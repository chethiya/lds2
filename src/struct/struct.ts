import * as Types from './../types';
import * as Interfaces from './interfaces';

let nameRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
let invalidNames: string[] = [
 'assign',
 'assignPos',
 'set',
 'get',
 'copyFrom',
 'compare'
 // TODO
]
let lastId: number = -1;

let invalidMap: {[key: string]: boolean} = {};
invalidNames.forEach(name => invalidMap[name] = true);

let ArrayMaxBytes: number = 1<<29;
let ArrayMaxBytesPos: number = 29;
let MIN_LENGTH = 128;

function validateAttr(attrs: Interfaces.Attribute[]) : void {
 if (!Array.isArray(attrs) || attrs.length == 0) {
  throw new Error(`Invalid struct definition ${attrs}`);
 }
 attrs.forEach(attr => {
  // Check name
  if (attr.name == null || typeof attr.name != 'string' ||
  attr.name.length == 0 || !nameRegex.test(attr.name) ||
  invalidMap[attr.name]) {
   throw new Error(`Invalid attribute name: ${attr.name}`);
  }

  // Check type
  if (attr.type == null || typeof attr.type != 'number' ||
  attr.type < 0 || attr.type >= Types.nTypes || Types.Type[attr.type] == null) {
   throw new Error(`Invalid type in attribute ${attr.name}: ${attr.type} -> ` +
   `${Types.Type[attr.type]}`);
  }

  // Check length
  if (attr.length != null &&
  (typeof attr.length != 'number' || attr.length < 1 ||
  attr.length != Math.floor(attr.length))) {
   throw new Error(`Invalid length in attribute ${attr.name}: ${attr.length}`);
  }
  if (attr.length == null) {
   attr.length = 1;
  }
 });
}

export function Struct(Attrs: Interfaces.Attribute[],
CompareFunc?: Interfaces.CompareFunction) : any {
 validateAttr(Attrs);
 let Id: number = ++lastId;
 let Offset: number[] = [];
 let Bytes: number[] = [];
 let Counts: number[] = [];
 let Length: number[] = [];
 let Name: string[] = [];
 let Type: Types.Type[] = [];
 let N: number = 0;
 let MaxBytes = 0;
 let MaxLength = 0;

 // Init struct constants
 N = Attrs.length;
 Offset.push(0);
 Attrs.forEach((attr, i) : void => {
  Name.push(attr.name);
  Type.push(attr.type);
  Length.push(attr.length as number);
  Counts.push(Types.TypedArray[attr.type][1] * (attr.length as number));
  Bytes.push(Types.Bytes[attr.type] * (attr.length as number));
  Offset.push(Offset[i] + Bytes[i]);
 });
 MaxBytes = Math.max.apply(Math, Bytes);
 MaxLength = Math.floor(ArrayMaxBytes / MaxBytes);
 for (let i=ArrayMaxBytesPos; i>0; --i) {
  if ((MaxLength & (1<<i)) > 0) {
   MaxLength = 1<<i;
   break;
  }
 }
 if (MaxLength < MIN_LENGTH) {
  throw new Error(`MaxLength of tpyie is smallers than ${MIN_LENGTH}`);
 }

 /* ValueObejct that's returned from get() method */
 class ValueObject implements Interfaces.Value {
  [prop: string]: Types.Value | Types.Value[] | (() => Object);
  constructor() {
  }
  public toJSON(): Object {
   let res: any = {};
   for (let i = 0; i < N; ++i) {
    res[Name[i]] = this[Name[i]];
   }
   return res;
  }
 }
 Attrs.forEach(attr => {
  if (attr.type == Types.String) {
   (ValueObject.prototype as any)[attr.name] = null;
  } else {
   (ValueObject.prototype as any)[attr.name] = 0;
  }
 });


 /* Struct class that will be returned */
 class StructClass implements Interfaces.Struct  {
  private readonly _id: number = Id;
  private _views: Types.View[];
  private _pos: number;
  private _length: number;

  static readonly Id: number = Id;
  static readonly Offset: number[] = Offset;
  static readonly Counts: number[] = Counts;
  static readonly Bytes: number[] = Bytes;
  static readonly Length: number[] = Length;
  static readonly Name: string[] = Name;
  static readonly Type: Types.Type[] = Type;
  static readonly N: number = N;
  static readonly MaxBytes: number = MaxBytes;
  static readonly MaxLength: number = MaxLength;

  constructor(value?: Interfaces.ValueRaw, views?: Types.View[],
  pos?: number, length?: number) {
   if (views == null) {
    this._views = [];
    this._pos = 0;
    this._length = 1;

    /* Note : Having multiple ArrayBuffers for each attribute is going to
    result in largest attribute the bottleneck max possible elements in an
    Array. Alternative is to share one ArrayBuffer for all attributes.

    But that needs aligining types with respective # bytes.
    e.g. Int32 view should start at a 4 byte offset in the ArrayBuffer
         Float64 view should start at an 8 byte offset in the ArrayBuffer.

    This behaviour require wasting few bytes in between. It's neglectable when
    Array size is large. Anyway decided against using that for now considering
    the trouble of aligning attributes when creating an Array.

    This is an option to consider lateron.
    */
    for (let i=0; i < N; ++i) {
     let buffer =
      new ArrayBuffer(Bytes[i]);
     this._views.push(new Types.TypedArray[Type[i]][0](buffer));
    }
   } else {
    this.assign(views, pos as number, length as number);
   }
   if (value != null) {
    this.set(value);
   }
  }

  public assign(views: Types.View[], pos: number, length: number) : void {
   this._views = views;
   this._pos = pos;
   this._length = length;
  }

  public assignPos(pos: number) : void {
   this._pos = pos;
  }

  public set(value: Interfaces.ValueRaw | Types.Value |
  Types.Value[], attr?: number, index?: number)
  : Interfaces.Struct {
   if (attr != null) {
    this._set(value as Types.Value, attr, index);
   } else if (value == null || typeof value != "object") {
    throw(new Error(`Invalid vlaue passed into set: ${value}`))
   } else {
    for (let i = 0; i < N; ++i) {
     if ((value as Interfaces.Value)[Name[i]] != null) {
      this._set((value as Interfaces.ValueRaw)[Name[i]], i);
     } else {
      throw new Error(`Missing attribute ${Name[i]} passed ` +
      `to set(): ${value}`);
     }
    }
   }
   return this;
  }

  private _set(value: Types.Value | Types.Value[], attr: number,
  index?: number) {
   let v: number = Math.floor(this._pos / MaxLength);
   let p: number = this._pos - MaxLength * v;
   v *= N;
   if (Length[attr] == 1) {
    this._views[v + attr][p] = value as Types.Value;
   } else {
    let offset = p * Length[attr];
    if (Array.isArray(value)) {
     let l = Math.min(Length[attr], value.length);
     for (let j=0; j<l; ++j) {
      this._views[v + attr][offset + j] = value[j];
     }
    } else {
     if (index == null) {
      index = 0;
     }
     this._views[v + attr][offset + index] = value;
    }
   }
  }

  public get(attr?: number, index?: number) : Interfaces.Value |
  Types.Value | Types.Value[] {
   if (attr != null) {
    return this._get(attr, index);
   } else {
    let obj : Interfaces.Value = new ValueObject();
    for (let i=0; i<N; ++i) {
     obj[Name[i]] = this._get(i);
    }
    return obj;
   }
  }

  private _get(attr: number, index?: number): Types.Value |
  Types.Value[] {
   let v: number = Math.floor(this._pos / MaxLength);
   let p: number = this._pos - MaxLength * v;
   v *= N;
   if (Length[attr] == 1) {
    return this._views[v + attr][p];
   } else if (index != null) {
    return this._views[v + attr][p * Length[attr] + index];
   } else {
    let arr: Types.Value[] = new Array(Length[attr]);
    let offset: number = p * Length[attr];
    for (let j=0; j<Length[attr]; ++j) {
     arr[j] = this._views[v + attr][offset + j];
    }
    return arr;
   }
  }

  public copyFrom(ref: StructClass) : Interfaces.Struct {
   if (this._id != ref._id) {
    throw new Error("Copying from incompativle struct");
   }
   let s, t : number = 0;
   let sv, tv: number;
   tv = Math.floor(this._pos / MaxLength);
   sv = Math.floor(ref._pos / MaxLength);
   for (let i=0; i < N; ++i) {
    // Note: a copy() method in ArrayBuffer would be have been nice
    t = (this._pos - tv * MaxLength) * Counts[i];
    s = (ref._pos - sv * MaxLength) * Counts[i];
    let tvv = tv * N + i;
    let svv = sv * N + i;
    for (let j=0; j < Counts[i]; ++j, ++s, ++t) {
     this._views[tvv][t] = ref._views[svv][s];
    }

    //TODO if type is string release string references
   }
   return this;
  }

  // Default comparison method comapring attributes one by one
  public compare(right: StructClass) : number {
   let l, r;
   for (let i=0; i<N; ++i) {
    for (let j=0; j<Length[i]; ++j) {
     // TODO string comparsion should be using StringRef
     l = this._get(i, j);
     r = right._get(i, j);
     if (l < r) return -1; else
     if (l > r) return 1; else continue;
    }
   }
   return 0;
  }
 }

 // setter and getters
 Attrs.forEach((attr, i) => {
  // Attribute indices
  (StructClass as any)[`_${attr.name.toUpperCase()}`] = i;

  // Attribute setters and getters
  Object.defineProperty(StructClass.prototype, attr.name, {
   set: function(this:  StructClass,
    value: Types.Value | Types.Value[]) : void {
     (this as any)._set(value, i);
    },
   get: function(this: StructClass) : Types.Value |
    Types.Value[] {
     return (this as any)._get(i);
    }
  });
 });

 if (CompareFunc != null) {
  (StructClass.prototype as any).compare = function(this: StructClass,
  right: Interfaces.Struct) {
   return CompareFunc(this, right);
  }
 }
 return StructClass;
}

function getPrimitive(type: Types.Type) : Interfaces.StructClass  {
 let Class = Struct([
  {
   name: "value",
   type: type
  }
 ]); // TODO string compare

 Class.prototype.set = function (this: Interfaces.Struct,
  value: Types.Value): Interfaces.Struct {
   (this as any)._set(value, 0);
   return this;
 }

 Class.prototype.get =
  function (this: Interfaces.Struct): Types.Value {
   return (this as any)._get(0);
  }

 return Class;
}

export let Primitives : any = {};
for (let i=0; i < Types.nTypes; ++i) {
 Primitives[i] = getPrimitive(i);
}

export {Interfaces as Interfaces};
