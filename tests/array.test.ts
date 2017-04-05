import { Struct, Interfaces } from './../src/struct/struct';
import {Array as LDSArray} from './../src/array';
import * as Types from './../src/types';

describe("Array", function () {
 let Person: Interfaces.StructClass = Struct([
  { name: 'name', type: Types.Int32, length: 3 },
  { name: 'age', type: Types.Uint8 },
  { name: 'height', type: Types.Float64 }
 ]);
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
  let N = 500;
  let arr = new LDSArray(Person, N);
  for (let i=0; i<N; ++i) {
   ref = arr.getRef(i, ref as Interfaces.Struct) as Interfaces.StructExternal;
   ref.age = i;
  }
  expect(arr.get(N-1).age).toEqual(N-1);
 });
});
