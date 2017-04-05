import * as Types from './../types';

interface Options {
 // TODO in case we'll have options like memory optimized string fidlds
}

export interface Attribute {
 name: string;
 type: Types.Type;
 length?: number;
 options?: Options;
};

export interface ValueRow {
 [prop: string]: Types.Value | Types.Value[];
}

export interface Value {
 [prop: string]: Types.Value | Types.Value[] | (() => Object);
 toJSON: () => Object;
}

export interface Struct {
 set(value: Value | Types.Value | Types.Value[], attr?: number,
  index?: number): Struct;
 get(attr?: number, index?: number): Value | Types.Value |
  Types.Value[]
 copyFrom: (source: Struct) => Struct;
 // [prop: string]: any;

 //private
 assign: (views: Types.View[], pos: number, length: number) => void;
 assignPos: (pos: number) => void;
};

export interface StructClass {
 Id: number;
 N: number;
 //  new (value?: Value): Struct;

 // private
 Offset: number[]
 Counts: number[]
 Bytes: number[]
 Length: number[]
 Name: string[]
 Type: Types.Type[];
 MaxBytes: number;
 new (value?: Value, views?: Types.View[], pos?: number, length?: number)
 : Struct;
}