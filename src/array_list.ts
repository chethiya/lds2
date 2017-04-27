import {Struct, Interfaces, Primitives} from './struct/struct';
import * as Types from './types';

class ArrayList {
 private _views: Types.View[];
 private _size: number;
 public length: number;
 private _maxLength: number;
 private _struct: Interfaces.Struct;
 private _pivot: Interfaces.Struct;
 private _leftwall: Interfaces.Struct;
 private _cur: Interfaces.Struct[];
 private _compareFunc: Interfaces.CompareFunction | null;


 private static _tempStruct: Interfaces.Struct;
 private static readonly INIT_ARRAY_SIZE: number = 128;

 public StructClass: Interfaces.StructClass;

 private static _swap(left: Interfaces.Struct, right: Interfaces.Struct): void {
  ArrayList._tempStruct.copyFrom(left);
  left.copyFrom(right);
  right.copyFrom(ArrayList._tempStruct);
 }

 constructor(private type: Interfaces.StructClass | Types.Type,
  length?: number) {
  if ("number" == typeof type) {
   this.StructClass = Primitives[type];
   if (this.StructClass == null) {
    throw new Error(`Invalid primitive ${type}`);
   }
  } else {
   this.StructClass = type;
  }
  this._initViews(length);
  this._createStructs();
 }

 private _initViews(length?: number) {
  this._maxLength = this.StructClass.MaxLength;
  if (length == null || length == 0) {
   this._size = ArrayList.INIT_ARRAY_SIZE;
   this.length = 0;
  } else {
   this.length = length;
   if (this.length < 0 || this.length != Math.floor(this.length)) {
    throw(new Error(`ArrayList definition with invalid length: ${this.length}`));
   }
   if (this.length <= this._maxLength) {
    this._size = ArrayList.INIT_ARRAY_SIZE;
    while (this._size < this.length) {
     this._size *= 2;
    }
   } else {
    this._size = this._maxLength * (
     Math.floor(this.length / this._maxLength) +
     (this.length % this._maxLength > 0 ? 1 : 0)
    );
   }
  }

  this._views = [];
  let size, remain: number = this._size;
  while (remain > 0) {
   if (remain >= this._maxLength) {
    size = this._maxLength;
   } else {
    size = remain;
   }
   remain -= size;
   for (let i = 0; i < this.StructClass.N; ++i) {
    let buffer = new ArrayBuffer(this.StructClass.Bytes[i] * size);
    this._views.push(new Types.TypedArray[this.StructClass.Type[i]][0](buffer));
   }
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
  ArrayList._tempStruct = new this.StructClass();
 }

 public get(index: number) : Interfaces.Value | Types.Value {
  if (index < 0 || index >= this.length) {
   throw new Error(`ArrayList::get out of bound.
   index: ${index}, length: ${this.length}`);
  }
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
  index: number): ArrayList {
  if (index < 0 || index >= this.length) {
   throw new Error(`ArrayList::set out of bound.
   index: ${index}, length: ${this.length}`);
  }
  this._struct.assignPos(index);
  this._struct.set(value);
  return this;
 }

 public push(value?: Interfaces.ValueRaw | Types.Value): ArrayList {
  // Extend array when running out of allocated arrays
  if (this._size == this.length) {
   if (this._size < this._maxLength) {
    // Create new array of size this._size * 2 and copy everything form existing
    for (let i = 0; i < this.StructClass.N; ++i) {
     let buffer = new ArrayBuffer(this.StructClass.Bytes[i] * this._size * 2);
     let view = new Types.TypedArray[this.StructClass.Type[i]][0](buffer);
     for (let j=0; j<this._size * this.StructClass.Counts[i]; ++j) {
      view[j] = this._views[i][j];
     }
     this._views[i] = view; // No view offset when this._size < this._maxLength
    }
    this._size *= 2;
   } else {
    // Double the array size
    for (let i = 0; i < this.StructClass.N; ++i) {
     let buffer = new ArrayBuffer(this.StructClass.Bytes[i] * this._maxLength);
     this._views.push(new Types.TypedArray[this.StructClass.Type[i]][0](buffer));
    }
    this._size += this._maxLength
   }
  }

  this.length++; // Increase array length
  // Assign value
  if (value != null) {
   this.set(value, this.length - 1);
  }
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
     ArrayList._swap(this._leftwall, this._struct);
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
    ArrayList._swap(this._cur[cur], this._cur[next]);
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
    ArrayList._swap(this._leftwall, this._struct);
   }
  }
  this._sortGetRef(++i, this._leftwall);
  ArrayList._swap(this._leftwall, this._pivot);
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

 // TODO No need to have this function
 private _sortGetRef(index: number, struct: Interfaces.Struct) {
  struct.assignPos(index);
 }
}

export {ArrayList as ArrayList};
