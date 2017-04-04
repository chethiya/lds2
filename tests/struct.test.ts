// First argument to 'describe' (which is defined by Jasmine) is the testing module that will
// appear in test reports. The second argument is a callback containing the individual tests.

import {Struct, Interfaces} from './../src/struct/struct';
import * as Types from './../src/types';

describe("Struct", function () {
 it("arguments", function () {
  let Person = Struct([
   { name: 'name', type: Types.Int32, length: 3 },
   { name: 'age', type: Types.Uint8 },
   { name: 'height', type: Types.Float64 }
  ]);
  let p: Interfaces.Struct = new Person({
   name: [1, 2, 3],
   age: 29,
   height: 160
  });
  console.log(p.get().toString());
  expect((p.get() as Interfaces.Value).age).toEqual(29);
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