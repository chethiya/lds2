import { Struct, Interfaces } from './../src/struct/struct';
import {ArrayList as ArrayList} from './../src/array_list';
import * as Types from './../src/types';

describe("PrimitiveArray", function () {
 it("create", function () {
  let arr = new ArrayList(Types.Int32, 10);
  expect(arr.length).toEqual(10);
 });

 it("set/get", function() {
  let N = 10;
  let arr = new ArrayList(Types.Int32, N);
  for (let i=0; i<N; ++i) {
   arr.set(i + 100, i);
  }
  for (let i=N-1; i>=0; --i) {
   expect(arr.get(i)).toEqual(i + 100);
  }
 });

 let N = 9997;
 let arr: ArrayList;
 let sum: number = 0;
 let jsArr: number[];

 let initArr = function() {
  arr = new ArrayList(Types.Int32, N)
 }

 // Sort random values
 let setRandom = function() {
  let value: number;
  sum = 0;
  jsArr = [];
  for (let i=0; i<N; ++i) {
   value = Math.round(Math.random() * N / 3);
   jsArr.push(value);
   sum += value;
   arr.set(value, i);
  }
  console.time("js sort");
  jsArr.sort((a, b) => a - b);
  console.timeEnd("js sort");
 }

 let checkSort = function(asc: boolean) {
  let cur: number, last = -1;
  let s: number = 0;

  for (let i=(asc?0:N-1); (asc?(i<N):(i>-1)); (asc?++i:--i)) {
   cur = arr.get(i) as number;
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
   arr.set(N-i-1, i);
  }
  arr.sort();
  for (let i=0; i<N; ++i) {
   expect(arr.get(i)).toEqual(i);
  }

  // Sort using a compare function in struct
  setRandom();
  console.time("LDS_sort_struct_compare");
  arr.sort();
  console.timeEnd("LDS_sort_struct_compare");
  checkSort(true);


  // Sort using a custom compare function
  setRandom();
  console.time("LDS_sort_custom_compare");
  arr.sort((left: number, right: number): number => right - left);
  console.timeEnd("LDS_sort_custom_compare");
  checkSort(false);

  // Sort using a compare function in struct on reversed items
  console.time("LDS_sort_struct_compare_on_reverse");
  arr.sort();
  console.timeEnd("LDS_sort_struct_compare_on_reverse");
  checkSort(true);
 });


 it("sort large array", function() {
  let N = 99997;
  let arr = new ArrayList(Types.Int32, N);
  let jsArr = []
  let value: number;
  for (let i=0; i<N; ++i) {
   value = Math.floor(Math.random() * N / 3);
   arr.set(value, i);
   jsArr.push(value);
  }
  console.time("large sort - js native");
  jsArr.sort((a, b) => a - b);
  console.timeEnd("large sort - js native");

  console.time("large sort - LDS");
  arr.sort();
  console.timeEnd("large sort - LDS");

  for (let i=N-1; i>-1; --i) {
   expect(arr.get(i)).toEqual(jsArr[i]);
  }
 });

});
