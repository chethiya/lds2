import {Struct, Interfaces, Primitives} from './struct/struct';
import * as Types from './types';

class LDSArray {
 private _views: Types.View[];
 private _maxLength: number;
 private _struct: Interfaces.Struct;
 private _pivot: Interfaces.Struct;
 private _leftwall: Interfaces.Struct;
 private _cur: Interfaces.Struct[];
 private _compareFunc: Interfaces.CompareFunction | null;


 private static _tempStruct: Interfaces.Struct;

 public StructClass: Interfaces.StructClass;

 public static readonly MaxBytes: number = 1<<29;

 private static _swap(left: Interfaces.Struct, right: Interfaces.Struct): void {
  LDSArray._tempStruct.copyFrom(left);
  left.copyFrom(right);
  right.copyFrom(LDSArray._tempStruct);
 }

 constructor(private type: Interfaces.StructClass | Types.Type, public length: number) {
  if ("number" == typeof type) {
   this.StructClass = Primitives[type];
   if (this.StructClass == null) {
    throw new Error(`Invalid primitive ${type}`);
   }
  } else {
   this.StructClass = type;
  }
  this._checkLength();
  this._views = [];
  for (let i=0; i < this.StructClass.N; ++i) {
   let buffer = new ArrayBuffer(this.StructClass.Bytes[i] * this.length);
   this._views.push(new Types.TypedArray[this.StructClass.Type[i]][0](buffer));
  }
  this._createStructs();
 }

 private _checkLength() : void {
  this._maxLength = Math.floor(LDSArray.MaxBytes / this.StructClass.MaxBytes);
  if (this.length == 0) {
   this.length = this._maxLength;
  }
  if (this.length < 0 || this.length != Math.floor(this.length)) {
   throw(new Error(`Array definition with invalid length: ${this.length}`));
  }
  if (this.length > this._maxLength) {
   throw(new Error(`Array definition with too large length: ${this.length}. ` +
   `Max length for this Struct is: ${this._maxLength}`));
  }
 }

 private _createStructs(): void {
  // Array references
  this._struct = new this.StructClass(undefined, this._views, 0, this.length);
  this._pivot = new this.StructClass(undefined, this._views, 0, this.length);
  this._leftwall = new this.StructClass(undefined, this._views, 0, this.length);
  this._cur = [
   new this.StructClass(undefined, this._views, 0, this.length),
   new this.StructClass(undefined, this._views, 0, this.length)
  ];

  // temporary data out of array
  LDSArray._tempStruct = new this.StructClass();
 }

 public get(index: number) : Interfaces.Value | Types.Value {
  this._struct.assignPos(index);
  return this._struct.get() as Interfaces.Value;
 }

 public getRef(index: number, struct?: Interfaces.Struct) : Interfaces.Struct {
  if (struct == null) {
   struct = new this.StructClass(undefined, this._views, index, this.length);
  } else {
   struct.assign(this._views, index, this.length);
  }
  return struct;
 }

 public set(value: Interfaces.ValueRaw | Types.Value,
  index: number): LDSArray {
  this._struct.assignPos(index);
  this._struct.set(value);
  return this;
 }

 private _bubbleSort(l: number, r: number): void {
  for (let i=0; i<this.length; ++i) {
   this._sortGetRef(i, this._leftwall);
   for (let j=i+1; j<this.length; ++j) {
    this._sortGetRef(j, this._struct);
    if (
     (this._compareFunc != null &&
     this._compareFunc(this._leftwall, this._struct) > 0)
    ||
     (this._compareFunc == null &&
     this._leftwall.compare(this._struct) > 0)
    ) {
     LDSArray._swap(this._leftwall, this._struct);
    }
   }
  }
 }

 private _insertSort(l: number, r: number) {
  let j: number;
  let cur = 0, next = 1;
  for (let i=l+1; i<=r; ++i) {
   this._sortGetRef(i, this._cur[next]);
   for (let j=i-1; j>=l; --j) {
    cur = next;
    next = (next + 1) % 2;
    this._sortGetRef(j, this._cur[next]);
    if (
     (
      this._compareFunc != null &&
      this._compareFunc(this._cur[next], this._cur[cur]) <= 0
     ) ||
     (
      this._compareFunc == null && this._cur[next].compare(this._cur[cur]) <= 0
     )
    ) {
     break;
    }
    LDSArray._swap(this._cur[cur], this._cur[next]);
   }
  }
 }

 private _qsortPartition(l: number, r: number) : number {
  this._sortGetRef(r, this._pivot); // pivot
  let i = l - 1;
  for (let j=l; j < r; ++j) {
   this._sortGetRef(j, this._struct); // get current

   // compare current and pivot
   if (
    (this._compareFunc != null &&
     this._compareFunc(this._struct, this._pivot) <= 0)
    ||
    (this._compareFunc == null && this._struct.compare(this._pivot) <= 0)
   ) {
    // if current smaller than pivot move left wall and swap
    this._sortGetRef(++i, this._leftwall);
    LDSArray._swap(this._leftwall, this._struct);
   }
  }
  this._sortGetRef(++i, this._leftwall);
  LDSArray._swap(this._leftwall, this._pivot);
  return i;
 }

 private _qsort(l: number, r: number) : void {
  let stackSize = 2 * Math.ceil(Math.log(this.length) / Math.log(2));
  let stack: number[][] = [new Array(stackSize), new Array(stackSize)];
  let pos = -1;
  let p;
  if (l < r) {
   stack[0][++pos] = l;
   stack[1][pos] = r;
  }
  while (pos >= 0) {
   l = stack[0][pos];
   r = stack[1][pos--];
   if (r - l <= 10) {
    this._insertSort(l, r);
   } else {
    p = this._qsortPartition(l, r);
    if (p + 1 < r) {
     stack[0][++pos] = p + 1;
     stack[1][pos] = r
    }
    if (l < p - 1) {
     stack[0][++pos] = l;
     stack[1][pos] = p - 1;
    }
   }
  }
 }

 public sort(compareFunc?: Interfaces.CompareFunction) : void {
  if (compareFunc != null) {
   // If type is Types.Value then wrap function
   if ('number' == typeof this.type) {
    this._compareFunc = (left: Interfaces.Struct, right: Interfaces.Struct): number =>
     compareFunc(left.get() as Types.Value,
      right.get() as Types.Value);
   } else {
    this._compareFunc = compareFunc;
   }
  } else {
   this._compareFunc = null;
  }

  this._qsort(0, this.length - 1);
  //this._bubbleSort(0, this.length - 1);
  //this._insertSort(0, this.length - 1);
 }

 //TODO Child classes should override this
 protected _sortGetRef(index: number, struct: Interfaces.Struct) {
  struct.assignPos(index);
 }
}

export {LDSArray as Array};
