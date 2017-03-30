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
 [prop: string]: Types.Value;
}

export interface Struct {
 /*set: (value: ValueObject, attribute?: number, index?: number) => void;
 setStruct: (source: StructInterface) => void;
 copy: (source: StructInterface) => void;*/
 get: () => Value;
 [prop: string]: any;
};

export interface StructContructable extends Struct {
 new(value?: Value): Struct;
}