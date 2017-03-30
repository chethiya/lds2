export let Uint8 = 0;
export let Int16 = 2;
export let Int32 = 1;
export let Float32 = 3;
export let Float64 = 4;
export let String = 5;

/*
export let names : any = {
 '0': 'Uint8',
 '2': 'Int16',
 '1': 'Int32',
 '3': 'Float32',
 '4': 'Float64',
 '5': 'String'
};
*/

export enum Type {
 Uint8,
 Int16,
 Int32,
 Float32,
 Float64,
 String
};
export let nTypes = 6;

export type Value = number; //TODO | string;

export type View = Uint8Array | Int16Array | Int32Array |
 Float32Array | Float64Array;

export let TypedArray : [any, number][] = [
 [Uint8Array, 1],
 [Int16Array, 1],
 [Int32Array, 1],
 [Float32Array, 1],
 [Float64Array, 1],
 [Int32Array, 2]
];

export let Length = [
 1,
 2,
 4,
 4,
 8,
 8
];

