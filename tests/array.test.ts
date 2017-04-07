import { Struct, Interfaces } from './../src/struct/struct';
import {Array as LDSArray} from './../src/array';
import * as Types from './../src/types';

describe("Array", function () {
 let MAX = 1<<30;
 let Person = Struct([
  { name: 'name', type: Types.Int32, length: 3 },
  { name: 'age', type: Types.Uint8 },
  { name: 'height', type: Types.Float64 }
 ]);
 let CompareStruct: Interfaces.StructClass = Struct([
  {
   name: 'value',
   type: Types.Int32
  }
 ], (left: Interfaces.Struct, right: Interfaces.Struct): number =>
   (right as any).value - (left as any).value
 );

 it("create", function () {
  let arr = new LDSArray(Person, 10);
  expect(arr.length).toEqual(10);
 });

 it("set/get", function() {
  let N = 10;
  let arr = new LDSArray(Person, N);
  for (let i=0; i<N; ++i) {
   arr.set({
    name: [i],
    age: i+30,
    height: 150 + i
   }, i);
  }
  for (let i=N-1; i>=0; --i) {
   expect(arr.get(i).toJSON()).toEqual({
    name: [i, 0, 0],
    age: i+30,
    height: 150 + i
   });
  }
 })

 it("getRef", function() {
  let ref: Interfaces.StructExternal | undefined;
  let N = 999997;
  let arr = new LDSArray(Person, N);
  for (let i=0; i<N; ++i) {
   ref = arr.getRef(i, ref as Interfaces.Struct) as Interfaces.StructExternal;
   ref.height = i;
  }
  for (let i=0; i<N; ++i) {
   expect(arr.get(i).height).toEqual(i);
  }
  for (let i=0; i<N / 10; ++i) {
   let p = Math.floor(Math.random() * N);
   ref = arr.getRef(p, ref as Interfaces.Struct) as Interfaces.StructExternal;
   ref.age = 1;
   ref.height = p * 2;

   p = Math.floor(Math.random() * N);
   ref = arr.getRef(p, ref as Interfaces.Struct) as Interfaces.StructExternal;
   if (ref.age == 1) {
    expect(ref.height).toEqual(p * 2);
   } else {
    expect(ref.height).toEqual(p);
   }
  }
 });

 it("sort", function() {
  let N = 9997;
  let arr = new LDSArray(CompareStruct, N);

  // Reverse sort
  for (let i=0; i<N; ++i) {
   arr.set({value: i}, i);
  }
  arr.sort();
  for (let i=0; i<N; ++i) {
   expect(arr.get(i).value).toEqual(N-i-1);
  }

  // Sort random values
  let sum: number = 0;
  let ref: Interfaces.Struct | undefined;
  let value: number;
  let jsArr = [];
  for (let i=0; i<N; ++i) {
   ref = arr.getRef(i, ref);
   value = Math.round(Math.random() * MAX);
   jsArr.push(value);
   sum += value;
   (ref as Interfaces.StructExternal).value = value;
  }
  console.time("js sort");
  jsArr.sort((a, b) => a - b);
  console.timeEnd("js sort");

  console.time("LDS_sort_struct_compare");
  arr.sort();
  console.timeEnd("LDS_sort_struct_compare");
  let cur: number, last = -1;
  let s: number = 0;
  for (let i=N-1; i>-1; --i) {
   ref = arr.getRef(i, ref);
   cur = (ref as any).value;
   expect(cur).toBeGreaterThanOrEqual(last);
   expect(cur).toEqual(jsArr[N-i-1]);
   last = cur;
   s += cur;
  }
  expect(s).toEqual(sum);

  // Sort using a custom compare function
  console.time("LDS_sort_custom_compare");
  arr.sort((left: Interfaces.Struct, right: Interfaces.Struct): number =>
   (left as any).value - (right as any).value
  );
  console.timeEnd("LDS_sort_custom_compare");
  last = -1;
  s = 0;
  for (let i=0; i<N; ++i) {
   ref = arr.getRef(i, ref);
   cur = (ref as any).value;
   expect(cur).toBeGreaterThanOrEqual(last);
   expect(cur).toEqual(jsArr[i]);
   s += cur;
   last = cur;
  }
  expect(s).toEqual(sum);
 })
});
