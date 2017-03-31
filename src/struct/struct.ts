import * as Types from './../types';
import * as Interfaces from './interfaces';

let nameRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
let invalidNames: string[] = [
 'set',
 'get',
 'copy',
]
let lastId: number = -1;

let invalidMap: {[key: string]: boolean} = {};
invalidNames.forEach(name => invalidMap[name] = true);

function validateAttr(attrs: Interfaces.Attribute[]) : void {
 if (!Array.isArray(attrs) || attrs.length == 0) {
  throw new Error(`Invalid struct definition ${attrs}`);
 }
 attrs.forEach(attr => {
  // Test name
  if (attr.name == null || typeof attr.name != 'string' ||
  attr.name.length == 0 || !nameRegex.test(attr.name) ||
  invalidMap[attr.name]) {
   throw new Error(`Invalid attribute name: ${attr.name}`);
  }


  // Test type
  if (attr.type == null || typeof attr.type != 'number' ||
  attr.type < 0 || attr.type >= Types.nTypes || Types.Type[attr.type] == null) {
   throw new Error(`Invalid type in attribute ${attr.name}: ${attr.type} -> ` +
   `${Types.Type[attr.type]}`);
  }

  // Test length
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

export function Struct(Attrs: Interfaces.Attribute[]) : any {
 validateAttr(Attrs);
 let Id: number = ++lastId;
 let Offset: number[] = [];
 let Bytes: number[] = [];
 let Length: number[] = [];
 let Name: string[] = [];
 let Type: Types.Type[] = [];
 let N: number = 0;

 // Init struct constants
 N = Attrs.length;
 Offset.push(0);
 Attrs.forEach((attr, i) : void => {
  Name.push(attr.name);
  Type.push(attr.type);
  Length.push(attr.length as number);
  Bytes.push(Types.Length[attr.type] * (attr.length as number));
  if (i < N - 1) {
   Offset.push(Offset[i] + Bytes[i]);
  }
 });



 /* ValueObejct that's returned from get() method */
 class ValueObject implements Interfaces.Value {
  [prop: string]: Types.Value;
  constructor() {
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
  private _obj: Interfaces.Value;
  private _isObj: boolean = false;
  private _views: Types.View[];
  private _pos: number;
  private _len: number;

  static readonly Id: number = Id;
  static readonly Offset: number[] = Offset;
  static readonly Bytes: number[] = Bytes;
  static readonly Length: number[] = Length;
  static readonly Name: string[] = Name;
  static readonly Type: Types.Type[] = Type;
  static readonly N: number = N;

  constructor(value?: Interfaces.Value, views?: Types.View[],
  pos?: number, len?: number) {
   if (views == null) {
    this._views = []
    this._pos = 0
    this._len = 1
    for (let i=0; i < N; ++i) {
     let buffer =
      new ArrayBuffer(Types.Length[Type[i]] * Length[i]);
     this._views.push(new Types.TypedArray[Type[i]][0](buffer));
    }
   } else {
    this._views = views;
    this._pos = pos as number ;
    this._len = len as number;
   }
   if (value != null) {
    this.set(value);
   }
  }

  public set(value: Interfaces.Value | Types.Value |
  Types.Value[], attr?: number, index?: number)
  : Interfaces.Struct {
   if (value != null) {
    if (attr != null) {
     this._set(value as Types.Value, attr, index);
    } else {
     for (let i = 0; i < N; ++i) {
      if ((value as Interfaces.Value)[Name[i]] != null) {
       this._set((value as Interfaces.Value)[Name[i]], i);
      } else {
       throw new Error(`Missing attribute ${Name[i]} passed ` +
       `to set(): ${value}`);
      }
     }
     this._obj = value as Interfaces.Value;
     this._isObj = true;
    }
   }
   return this;
  }

  private _set(value: Types.Value | Types.Value[], attr: number,
  index?: number) {
   if (Length[attr] == 1) {
    this._views[attr][this._pos] = value as Types.Value;
   } else {
    let offset = this._pos * Length[attr];
    if (Array.isArray(value)) {
     let l = Math.min(Length[attr], value.length);
     for (let j=0; j<l; ++j) {
      this._views[attr][offset + j] = value[j];
     }
    } else {
     if (index == null) index = 0;
     this._views[attr][offset + index] = value;
    }
   }
   this._isObj = false;
  }

  public get(attr?: number, index?: number) : Interfaces.Value |
  Types.Value | Types.Value[] {
   if (attr != null) {
    return this._get(attr, index);
   } else if (!this._isObj) {
    if (this._obj == null) {
     this._obj = new ValueObject();
    }
    for (let i=0; i<N; ++i) {
     this._obj[Name[i]] = this._get(i);
    }
   }
   return this._obj;
  }

  private _get(attr: number, index?: number): Types.Value |
  Types.Value[] {
   if (Length[attr] == 1) {
    return this._views[attr][this._pos];
   } else if (index != null) {
    return this._views[attr][this._pos * Length[attr] + index];
   } else {
    let arr: Types.Value[] = new Array(Length[attr]);
    let offset: number = this._pos * Length[attr];
    for (let j=0; j<Length[attr]; ++j) {
     arr[j] = this._views[attr][offset + j];
    }
    return arr;
   }
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

 return StructClass;
}

export {Interfaces as Interfaces};
