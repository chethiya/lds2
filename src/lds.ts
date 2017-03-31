import * as Types from './types';
import {Struct, Interfaces} from './struct/struct';

let LDS = {
 Types: Types
}

declare let module: any;
declare var define: any;

if (typeof module !== "undefined" && module.exports) {
 module.exports["LDS"] = LDS;
} else if (typeof define === 'function' && define.amd) { // AMD or RequireJS
 define(() => LDS);
}
else if (window) {
 (window as any)["LDS"] = LDS;
}


// Test
let Person = Struct([
 {name: 'name', type: Types.Int32, length: 3},
 {name: 'age', type: Types.Uint8},
 {name: 'height', type: Types.Float32}
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

