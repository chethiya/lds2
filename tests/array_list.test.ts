import { Struct, Interfaces } from './../src/struct/struct';
import {ArrayList as ArrayList} from './../src/array_list';
import * as Types from './../src/types';

describe("ArrayList", function () {
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
  let arr = new ArrayList(Person, 10);
  expect((arr as any)._size).toEqual(128);
  expect(arr.length).toEqual(10);
  arr = new ArrayList(Types.Float32);
  expect((arr as any)._size).toEqual(128);
  expect(arr.length).toEqual(0);
 });

 it("set/get", function() {
  let N = 10;
  let arr = new ArrayList(Person);
  for (let i=0; i<N; ++i) {
   arr.push({
    name: [i],
    age: i+30,
    height: 150 + i
   });
  }
  for (let i=N-1; i>=0; --i) {
   expect((arr.get(i) as Interfaces.Value).toJSON()).toEqual({
    name: [i, 0, 0],
    age: i+30,
    height: 150 + i
   });
  }
 })


 it("getRef", function() {
  let ref: Interfaces.StructExternal | undefined;
  let N = 999997;
  let arr = new ArrayList(Person);
  for (let i=0; i<N; ++i) {
   arr.push();
   ref = arr.getRef(i, ref as Interfaces.Struct) as Interfaces.StructExternal;
   ref.height = i;
  }
  for (let i=0; i<N; ++i) {
   expect((arr.get(i) as Interfaces.Value).height).toEqual(i);
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

 let N = 9997;
 let arr: ArrayList;
 let sum: number = 0;
 let jsArr: number[];

 let initArr = function() {
  arr = new ArrayList(CompareStruct)
 }

 // Sort random values
 let setRandom = function() {
  let value: number;
  let ref: Interfaces.Struct | undefined;
  sum = 0;
  jsArr = [];
  for (let i=0; i<N; ++i) {
   arr.push();
   ref = arr.getRef(i, ref);
   value = Math.round(Math.random() * N / 3);
   jsArr.push(value);
   sum += value;
   (ref as Interfaces.StructExternal).value = value;
  }
  console.time("js sort");
  jsArr.sort((a, b) => a - b);
  console.timeEnd("js sort");
 }

 let checkSort = function(asc: boolean) {
  let cur: number, last = -1;
  let s: number = 0;
  let ref: Interfaces.Struct | undefined;

  for (let i=(asc?0:N-1); (asc?(i<N):(i>-1)); (asc?++i:--i)) {
   ref = arr.getRef(i, ref);
   cur = (ref as any).value;
   expect(cur).toBeGreaterThanOrEqual(last);
   expect(cur).toEqual(asc ? jsArr[i] : jsArr[N-i-1]);
   last = cur;
   s += cur;
  }
  expect(s).toEqual(sum);
 }

 it("sort", function() {
  initArr();

  // Reverse sort
  for (let i=0; i<N; ++i) {
   arr.push({value: i});
  }
  arr.sort();
  for (let i=0; i<N; ++i) {
   expect((arr.get(i) as Interfaces.Value).value).toEqual(N-i-1);
  }

  // Sort using a compare function in struct
  initArr();
  setRandom();
  console.time("LDS_sort_struct_compare");
  arr.sort();
  console.timeEnd("LDS_sort_struct_compare");
  checkSort(false);


  // Sort using a custom compare function
  initArr();
  setRandom();
  console.time("LDS_sort_custom_compare");
  arr.sort((left: Interfaces.Struct, right: Interfaces.Struct): number =>
   (left as any).value - (right as any).value
  );
  console.timeEnd("LDS_sort_custom_compare");
  checkSort(true);

  // Sort using a compare function in struct on reversed items
  console.time("LDS_sort_struct_compare_on_reverse");
  arr.sort();
  console.timeEnd("LDS_sort_struct_compare_on_reverse");
  checkSort(false);
 });


 it("sort large array", function() {
  let N = 99997;
  let arr = new ArrayList(CompareStruct);
  let ref: Interfaces.Struct | undefined;
  let jsArr = []
  let value: number;
  for (let i=0; i<N; ++i) {
   arr.push();
   ref = arr.getRef(i, ref);
   value = Math.floor(Math.random() * N / 3);
   (ref as any).value = value;
   jsArr.push(value);
  }
  console.time("large sort - js native");
  jsArr.sort((a, b) => a - b);
  console.timeEnd("large sort - js native");

  console.time("large sort - LDS");
  arr.sort();
  console.timeEnd("large sort - LDS");

  for (let i=N-1; i>-1; --i) {
   ref = arr.getRef(i, ref);
   expect((ref as any).value).toEqual(jsArr[N-i-1]);
  }
 });
});
