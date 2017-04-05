import {Struct, Interfaces} from './struct/struct';
import * as Types from './types';

class LDSArray {
 private _views: Types.View[];
 private _maxLength: number;
 private _struct: Interfaces.Struct;

 public StructClass: Interfaces.StructClass;

 public static readonly MaxBytes: number = 12;

 constructor(type: Interfaces.StructClass, public length: number) {
  if ("number" == typeof type) {
   // TODO
  } else {
   this.StructClass = type;
  }
  this._checkLength();
  this._views = [];
  for (let i=0; i < this.StructClass.N; ++i) {
   let buffer = new ArrayBuffer(this.StructClass.Bytes[i]);
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
   throw(new Error(`Array definition with too large length: ${this.length}.` +
   `Max length for this Struct is: ${this._maxLength}`));
  }
 }

 private _createStructs(): void {
  this._struct = new this.StructClass(undefined, this._views, 0, this.length);
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

 public set(value: Interfaces.Value, index: number) : LDSArray {
  this._struct.assignPos(index);
  this._struct.set(value);
  return this;
 }
}

export {LDSArray as Array};
