import {Struct, Interfaces} from './struct/struct';
import * as Types from './types';

class LDSArray {
 private _views: Types.View[];
 private _maxLength: number;
 private _struct: Interfaces.Struct;
 private _pivot: Interfaces.Struct;
 private _leftwall: Interfaces.Struct;
 private _compareFunc: Interfaces.CompareFunction;

 private static _tempStruct: Interfaces.Struct;

 public StructClass: Interfaces.StructClass;

 public static readonly MaxBytes: number = 1<<29;

 private static _swap(left: Interfaces.Struct, right: Interfaces.Struct): void {
  LDSArray._tempStruct.copyFrom(left);
  left.copyFrom(right);
  right.copyFrom(LDSArray._tempStruct);
 }

 constructor(type: Interfaces.StructClass, public length: number) {
  if ("number" == typeof type) {
   // TODO
  } else {
   this.StructClass = type;
  }
  this._checkLength();
  this._views = [];
  for (let i=0; i < this.StructClass.N; ++i) {
   let buffer = new ArrayBuffer(this.StructClass.Bytes[i] * length);
   this._views.push(new Types.TypedArray[this.StructClass.Type[i]][0](buffer));
  }
  this._createStructs();
 }

 private _checkLength() : void {
  if (this.length < 0 || this.length != Math.floor(this.length)) {
   throw(new Error(`Array definition with invalid length: ${this.length}`));
  }
  if (this.length == 0) {
   // TODO max length??
  }
  this._maxLength = Math.floor(LDSArray.MaxBytes / this.StructClass.MaxBytes);
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

  // temport data out of array
  LDSArray._tempStruct = new this.StructClass();
 }

 public get(index: number) : Interfaces.Value {
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

 public set(value: Interfaces.ValueRaw, index: number) : LDSArray {
  this._struct.assignPos(index);
  this._struct.set(value);
  return this;
 }

 private _bubbleSort(compareFunc?: Interfaces.CompareFunction): void {
  let l: Interfaces.Struct =
  new this.StructClass(undefined, this._views, 0, this.length);
  let r: Interfaces.Struct =
  new this.StructClass(undefined, this._views, 0, this.length);

  for (let i=0; i<this.length; ++i) {
   this._sortGetRef(i, l);
   for (let j=i+1; j<this.length; ++j) {
    this._sortGetRef(j, r);
    if ((compareFunc != null && compareFunc(l, r) > 0) ||
    (compareFunc == null && l.compare(r) > 0)) {
     LDSArray._swap(l, r);
    }
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
  if (l < r) {
   // TODO if (r - l < 10) do bubble sort
   let p = this._qsortPartition(l, r);
   this._qsort(l, p - 1);
   this._qsort(p + 1, r);
  }
 }

 private _quickSort(compareFunc?: Interfaces.CompareFunction) : void {
  this._qsort(0, this.length - 1);
 }

 // Child classes should override this
 protected _sortGetRef(index: number, struct: Interfaces.Struct) {
  struct.assignPos(index);
 }

 public sort(compareFunc?: Interfaces.CompareFunction) : void {
  //this._bubbleSort(compareFunc);
  this._quickSort(compareFunc);
 }
}

export {LDSArray as Array};
