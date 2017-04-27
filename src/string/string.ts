import * as Types from './../types';
import {Struct, Interfaces, Primitives} from './../struct/struct';
import {ArrayList} from './../array_list';

//TODO use Number.MAX_SAFE_INTEGER to limit allocater max index

let attrs: Interfaces.Attribute[] = [
 {name: 'start', type: Types.Float64},
 {name: 'end', type: Types.Float64},
 {name: 'length', type: Types.Float64},
 {name: 'count', type: Types.Int32}
];
let RefStruct = Struct(attrs);

export class StringRef {
 private index: number;
 private value: string | null;
 private isValue: boolean = false;

 public static create(str: string | null) {
  return new StringRef(StringAlloc.create(str));
 }

 constructor(index: number, value?: string | null) {
  this.index = index;
  if (this.index == 0) {
   this.value = null;
   this.isValue = true;
  } else if (value != null) {
   this.value = value;
   this.isValue = true;
  }
 }

 public assign(index: number) : void {
  this.index = index;
  this.isValue = false;
 }

 public getString(): string | null {
  return StringAlloc.get(this.index);
 }

 public getIndex() : number {
  return this.index;
 }
}

class StringAllocator {
 private bytes: ArrayList = new ArrayList(Types.Uint8);
 private ref: ArrayList = new ArrayList(RefStruct);
 private struct: Interfaces.Struct;
 private structIndex: number;


 constructor() {
  this.ref.push({start: 0, end: 1, length: 1, count: 0}); // 0th is null
  this.structIndex = 0;
  this.struct = this.ref.getRef(0, this.struct); // init ref
 }

 private string2Utf8(str: string, start: number) : number {
  for (let i = 0; i < str.length; i++) {
   let charcode: number = str.charCodeAt(i);
   if (charcode < 0x80) {
    this.bytes.push(charcode);
    start++;
   } else if (charcode < 0x800) {
    this.bytes.push(0xc0 | (charcode >> 6));
    this.bytes.push(0x80 | (charcode & 0x3f));
    start += 2;
   } else if (charcode < 0xd800 || charcode >= 0xe000) {
    this.bytes.push(0xe0 | (charcode >> 12));
    this.bytes.push(0x80 | ((charcode >> 6) & 0x3f));
    this.bytes.push(0x80 | (charcode & 0x3f));
    start += 3;
   } else {  // surrogate pair
    charcode = ((charcode & 0x3ff) << 10); // high surrogate pair (10 bits)
    charcode |= (str.charCodeAt(++i) & 0x3ff); // low surrogate pair (10 bits)
    charcode += 0x10000; // correct code point in 0x10000-0x10FFFF
    this.bytes.push(0xf0 | (charcode >> 18));
    this.bytes.push(0x80 | ((charcode >> 12) & 0x3f));
    this.bytes.push(0x80 | ((charcode >> 6) & 0x3f));
    this.bytes.push(0x80 | (charcode & 0x3f));
    start += 4;
   }
  }
  return start;
 }

 private utf8ToString(start: number, end: number) : string {
  let charcodes: number[] = [];
  let code: number = 0;
  let byte: number = 0;
  for (let i = start; i < end; ++i) {
   byte = this.bytes.get(i) as number;
   if (byte < 0x80) {
    code = byte;
   } else if ((0xf0 & byte) == 0xf0) {
    code = ((0x0f & byte) << 18) |
     ((0x3f & (this.bytes.get(++i) as number)) << 12) |
     ((0x3f & (this.bytes.get(++i) as number)) << 6) |
     (0x3f & (this.bytes.get(++i) as number));
    code -= 0x10000; // add 0x10000 again to the code point
    // high surrogate starts with 0xd800
    charcodes.push(0xd800 | ((code >> 10) & 0x3ff));
    // low surrogate starts with 0xdc00
    code = 0xdc00 | (code & 0x3ff); // will be pusshed below
   } else if ((0xe0 & byte) == 0xe0) {
    code = ((0x1f & byte) << 12) |
     ((0x3f & (this.bytes.get(++i) as number)) << 6) |
     (0x3f & (this.bytes.get(++i) as number));
   } else if ((0xc0 & byte) == 0xc0) {
    code = ((0x3f & byte) << 6) |
     (0x3f & (this.bytes.get(++i) as number));
   }
   charcodes.push(code);
  }
  return String.fromCharCode.apply(null, charcodes);
 }

 public create(str: string | null) : number {
  if (str == null) {
   return 0; // null
  } else {
   let start = this.bytes.length;
   let end = this.string2Utf8(str, start);
   this.ref.push({
    start: start,
    end: end,
    length: str.length,
    count: 1
   });
   return this.ref.length - 1;
  }
 }

 public get(index: number) : string | null {
  if (index == 0) {
   return null;
  } else {
   if (this.structIndex != index) {
    this.struct = this.ref.getRef(index);
    this.structIndex = index;
   }
   return this.utf8ToString((this.struct as any).start,
    (this.struct as any).end);
  }
 }
}

let StringAlloc = new StringAllocator()
