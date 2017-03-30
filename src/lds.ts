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
 {name: 'name', type: Types.String, length: 1},
 {name: 'age', type: Types.Uint8},
 {name: 'height', type: Types.Float32}
]);

let p : Interfaces.Struct = new Person();
console.log(p.name);
p.name = 'chethiya abeysinghe';
console.log(p.get());

console.log(Types.Float32, Types.Type[Types.Float32]);
console.log(typeof Person);