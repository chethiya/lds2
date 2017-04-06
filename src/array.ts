import {Struct, Interfaces} from './struct/struct';
import * as Types from './types';

class LDSArray {
 private _views: Types.View[];
 private _maxLength: number;
 private _struct: Interfaces.Struct;
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
  this._struct = new this.StructClass(undefined, this._views, 0, this.length);
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

 public sort(compareFunc?: Interfaces.CompareFunction) {
  let l: Interfaces.Struct =
  new this.StructClass(undefined, this._views, 0, this.length);
  let r: Interfaces.Struct =
  new this.StructClass(undefined, this._views, 0, this.length);

  for (let i=0; i<this.length; ++i) {
   l.assignPos(i);
   for (let j=i+1; j<this.length; ++j) {
    r.assignPos(j);
    if ((compareFunc != null && compareFunc(l, r) > 0) ||
    (compareFunc == null && l.compare(r) > 0)) {
     LDSArray._swap(l, r);
    }
   }
  }
 }
}

export {LDSArray as Array};
