// First argument to 'describe' (which is defined by Jasmine) is the testing module that will
// appear in test reports. The second argument is a callback containing the individual tests.

import { Struct, Interfaces } from './../src/struct/struct';
import * as Types from './../src/types';

describe("Struct", function () {
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
 ], function (left: Interfaces.Struct, right: Interfaces.Struct): number {
  return (right as Interfaces.StructExternal).value -
   (left as Interfaces.StructExternal).value;
 });

 it("init and assign", function () {
  let p: Interfaces.StructExternal = new Person({
   name: [1, 2, 3],
   age: 29,
   height: 160
  });

  expect((p.get() as Interfaces.Value).toJSON()).toEqual({
   name: [1, 2, 3], age: 29, height: 160
  });
  expect(p.name).toEqual([1, 2, 3]);
  p.name = [4, 5, 6];
  expect((p.get() as Interfaces.Value).toJSON()).toEqual({
   name: [4, 5, 6], age: 29, height: 160
  });
  expect(p.name).toEqual([4, 5, 6]);
  p.age = 31;
  expect(p.age).toEqual(31);
  expect((p.get() as Interfaces.Value).toJSON()).toEqual({
   name: [4, 5, 6], age: 31, height: 160
  });
  p.set(100, Person._NAME, 2);
  expect(p.get(Person._NAME, 2)).toEqual(100);
  expect((p.get() as Interfaces.Value).toJSON()).toEqual({
   name: [4, 5, 100], age: 31, height: 160
  });
  p.set([9, 9], Person._NAME);
  expect((p.get() as Interfaces.Value).toJSON()).toEqual({
   name: [9, 9, 100], age: 31, height: 160
  });
 });

 it("copyFrom", function() {
  let p: Interfaces.StructExternal = new Person({
   name: [1, 2, 3],
   age: 29,
   height: 160
  });
  let p2: Interfaces.StructExternal = new Person();

  expect((p2.get() as Interfaces.Value).toJSON()).toEqual({
   name: [0, 0, 0], age: 0, height: 0
  });

  p2.copyFrom(p as Interfaces.Struct);
  expect((p2.get() as Interfaces.Value).toJSON()).toEqual({
   name: [1, 2, 3], age: 29, height: 160
  });
  p.height = 23.3;
  expect(p.height).toEqual(23.3);
  expect((p.get() as Interfaces.Value).height).toEqual(23.3);

  expect(p2.height).toEqual(160);
  expect((p2.get() as Interfaces.Value).height).toEqual(160);
 });

 it("compare", function() {
  // Struct without compare function
  let p1: Interfaces.Struct, p2: Interfaces.Struct;
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


  // Struct with compare function
  let a: Interfaces.Struct, b: Interfaces.Struct;
  a = new CompareStruct({value: 10});
  b = new CompareStruct({value: 100});
  expect(a.compare(b)).toBeGreaterThan(0);
 });
});

/*


// Test
let Person = Struct([
 {name: 'name', type: Types.Int32, length: 3},
 {name: 'age', type: Types.Uint8},
 {name: 'height', type: Types.Float64}
]);

let p : Interfaces.Struct = new Person({
 name: [1, 2, 3],
 age: 29,
 height: 160
});
console.log(p.get());
console.log(p.name);
p.name = [4, 5, 6];
console.log(p.get());
console.log(p.name);
p.age = 31;
console.log(p.age);
console.log(p.get());

p.set(100, Person._NAME, 2);
console.log(p.get(Person._NAME, 2));
console.log(p.get());
p.set([9, 9], Person._NAME);
console.log(p.get());

let p2: Interfaces.Struct = new Person();
console.log(p2.get());
p2.copyFrom(p);
console.log(p2.get());
p.height = 23.3;
console.log(p.get(), p2.get());

*/