import { Struct, Interfaces } from './../src/struct/struct';
import {Array as LDSArray} from './../src/array';
import * as Types from './../src/types';

describe("Array", function () {
 let Person = Struct([
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

 it("compare", function() {
  let p1, p2: Interfaces.Struct;
  p1 = new Person();
  p2 = new Person();
  expect(p1.compare(p2)).toEqual(0);

  (p1 as Interfaces.StructExternal).age = 12;
  (p2 as Interfaces.StructExternal).age = 14;
  expect(p1.compare(p2)).toBeLessThan(0);
  expect(p2.compare(p1)).toBeGreaterThan(0);

  (p1 as Interfaces.StructExternal).name = [0, 0, 100];
  (p2 as Interfaces.StructExternal).name = [0, 0, 1];
  expect(p1.compare(p2)).toBeGreaterThan(0);
  expect(p2.compare(p1)).toBeLessThan(0);

  p1.set(-1, Person._NAME, 1);
  expect(p1.compare(p2)).toBeLessThan(0);
  expect(p2.compare(p1)).toBeGreaterThan(0);

  let CustomStruct: Interfaces.StructClass = Struct([
   {
    name: 'value',
    type: Types.Int32
   }
  ], function(left: Interfaces.Struct, right: Interfaces.Struct) : number {
   return (right as Interfaces.StructExternal).value -
   (left as Interfaces.StructExternal).value;
  });

  let a, b: Interfaces.Struct;
  a = new CustomStruct({value: 10});
  b = new CustomStruct({value: 100});
  expect(a.compare(b)).toBeGreaterThan(0);

 })
});
