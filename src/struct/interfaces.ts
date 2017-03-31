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

export interface Value {
 [prop: string]: Types.Value | Types.Value[];
}

export interface Struct {
 set(value: Value | Types.Value | Types.Value[], attr?: number,
  index?: number) : void;
 get(attr?: number, index?: number) : Value | Types.Value |
  Types.Value[]
 copyFrom: (source: Struct) => boolean;
 [prop: string]: any;
};

export interface StructContructable extends Struct {
 new(value?: Value): Struct;
}