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
  _obj: ValueObject; //TODO
  private _isObj: boolean = false; //TODO
  private _views: Types.View[];
  private _pos: number;
  private _len: number;

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

  public set(value: Interfaces.Value | Types.Value,
  attr?: number, index?: number) : Interfaces.Struct {
   if (value != null) {
    if (attr != null) {
     this._set(value as Types.Value, attr, index);
    } else {
     this._obj = value as Interfaces.Value;
     this._isObj = true;
     for (let i = 0; i < N; ++i) {
      if ((value as Interfaces.Value)[Name[i]] != null) {
       this._set((value as Interfaces.Value)[Name[i]], i);
      }
     }
    }
   }
   return this;
  }

  private _set(value: Types.Value, attr: number, index?: number) {
   if (Length[attr] == 1) {
    this._views[attr][this._pos] = value;

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
  }

  public get() : Interfaces.Value {
   return this._obj;
  }
 }

 // setter and getters
 Attrs.forEach(attr => {
  Object.defineProperty(StructClass.prototype, attr.name, {
   set: function(this:  StructClass, val: Types.Value) {
    this._obj[attr.name] = val;
   }
  });
 });

 return StructClass;
}

export {Interfaces as Interfaces};











/*



Struct = ->
 id = null
 name = null
 properties = []
 titleCasePropperties = []
 types = []
 lengths = []
 offsets = []
 n = 0
 bytes = 0
 maxBytesPerProp = 0

 if typeof arguments[0] isnt 'string' or arguments[0].length is 0
  throw new Error 'No name for the struct'
 name = arguments[0]
 if names[name]?
  throw new Error "An Struct already defined with name: #{name}"
 names[name] = namesCnt
 id = namesCnt++

 for k, v of arguments
  if v?.property? and v?.type? and
  (typeof v.property is 'string') and (typeof v.type is 'number') and
  v.type >= 0 and v.type < nTypes and (v.type is parseInt v.type)
   properties.push v.property
   types.push v.type
   offsets.push bytes

   if v.length? and (typeof v.length is 'number') and
   (v.length > 0) and (v.length is parseInt v.length)
    lengths.push v.length
    bytes += TypeLenghts[v.type] * v.length
    maxBytesPerProp = Math.max maxBytesPerProp, TypeLenghts[v.type] * v.length
   else
    lengths.push 1
    bytes += TypeLenghts[v.type]
    maxBytesPerProp = Math.max maxBytesPerProp, TypeLenghts[v.type]
   n++

 if n is 0
  throw new Error Strings.NO_PROPERTIES name

 class RawObject
  constructor: ->
   for k, i in properties
    if lengths[i] is 1
     this[k] = null
    else
     this[k] = new Array lengths[i]

 class StructClass
  constructor: (obj, views, pos, viewLen) ->
   @id = id
   if views?
    @views = views
    @pos = pos
    @viewLen = viewLen
   else
    @pos = 0
    @views = []
    @viewLen = 1
    for t, i in types
     buffer = new ArrayBuffer TypeLenghts[t] * lengths[i]
     @views.push new TypeArrays[t][0] buffer
   if obj?
    @set obj

  set: (obj) ->
   if obj?
    for k, i in properties
     if obj[k]?
      @set_prop i, obj[k]
   return

  get: ->
   o = new RawObject()
   for k, i in properties
    o[k] = @get_prop i
   o

  set_prop: (v, i, j, string_ref) ->
   if types[i] is Types.String
    if lengths[i] is 1
     if string_ref is on
      s = v
      s.retain()
     else
      s = new StringClass v
     StringAlloc.release @views[i][@pos*2], @views[i][@pos*2+1]
     @views[i][@pos*2] = s.x
     @views[i][@pos*2+1] = s.y
    else
     k1 = @pos*lengths[i]*2
     if j?
      if string_ref is on
       s = v
       s.retain()
      else
       s = new StringClass v
      StringAlloc.release @views[i][k1 + j*2], @views[i][k1 + j*2 + 1]
      @views[i][k1 + j*2] = s.x
      @views[i][k1 + j*2 + 1] = s.y
     else
      l = Math.min lengths[i], v.length
      for j in [0...l]
       if string_ref is on
        s = v
        s.retain()
       else
        s = new StringClass v[j]
       StringAlloc.release @views[i][k1 + j*2], @views[i][k1 + j*2 + 1]
       @views[i][k1 + j*2] = s.x
       @views[i][k1 + j*2 + 1] = s.y
   else
    if lengths[i] is 1
     @views[i][@pos] = v
    else
     k1 = @pos*lengths[i]
     if j?
      @views[i][k1 + j] = v
     else
      l = Math.min lengths[i], v.length
      for j in [0...l]
       @views[i][k1 + j] = v[j]
   return

  get_prop: (i, j, string_ref) ->
   res = null
   if lengths[i] is 1
    if types[i] is Types.String
     s = new StringClass null, @views[i][@pos*2], @views[i][@pos*2+1]
     if string_ref is on
      res = s
     else
      res = s.toString()
      s.release()
    else
     res = @views[i][@pos]
   else
    if j?
     if types[i] is Types.String
      k1 = @pos*lengths[i]*2
      s = new StringClass null, @views[i][k1 + j*2], @views[i][k1 + j*2 + 1]
      if string_ref is on
       res = s
      else
       res = s.toString()
       s.release()
     else
      k1 = @pos * lengths[i]
      res = @views[i][k1 + j]
    else
     res = new Array lengths[i]
     if types[i] is Types.String
      k1 = @pos*lengths[i]*2
      for j in [0...lengths[i]]
       s = new StringClass null, @views[i][k1 + j*2], @views[i][k1 + j*2 + 1]
       if string_ref is on
        res[j] = s
       else
        res[j] = s.toString()
        s.release()
     else
      k1 = @pos*lengths[i]
      for j in [0...lengths[i]]
       res[j] = @views[i][k1 + j]
   res

  copyFrom: (struct) ->
   if @id isnt struct.id
    return off
   for t, i in types
    k1 = lengths[i] * TypeArrays[t][1]
    k2 = TypeArrays[t][1]
    for j in [0...lengths[i]]
     p = @pos * k1 + j * k2
     if t is Types.String
      StringAlloc.release @views[i][p], @views[i][p+1]
     for k in [0...k2]
      @views[i][p+k] = struct.views[i][struct.pos*k1 + j*k2 + k]
     if t is Types.String
      StringAlloc.retain @views[i][p], @views[i][p+1]
   return true

  next: ->
   if @pos < @viewLen-1
    @pos++
    return on
   else
    return off

  prev: ->
   if @pos > 0
    @pos--
    return on
   else
    return off

 for k, i in properties
  StructClass[k.toUpperCase()] = i
  code = k.charCodeAt 0
  tcase = k
  if code <= 122 and code >= 97
   tcase = (k.substr 0, 1).toUpperCase() + k.substr 1
  titleCasePropperties.push tcase
  do (i) ->
   StructClass.prototype["set#{tcase}"] = (val, j, string_ref) ->
    @set_prop val, i, j, string_ref

   StructClass.prototype["get#{tcase}"] = (j, string_ref) ->
    @get_prop i, j, string_ref

 StructClass.id = id
 StructClass.name = name
 StructClass.properties = properties
 StructClass.titleCasePropperties = titleCasePropperties
 StructClass.types = types
 StructClass.lengths = lengths
 StructClass.offsets = offsets
 StructClass.n = n
 StructClass.bytes = bytes
 StructClass.maxBytesPerProp = maxBytesPerProp
 StructClass.Object = RawObject
 StructClass

 */