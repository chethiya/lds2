function toUTF8Array(str: string) {
 let utf8 = [];
 for (let i = 0; i < str.length; i++) {
  let charcode: number = str.charCodeAt(i);
  if (charcode < 0x80) {
   utf8.push(charcode);
  } else if (charcode < 0x800) {
   utf8.push(0xc0 | (charcode >> 6));
   utf8.push(0x80 | (charcode & 0x3f));
  } else if (charcode < 0xd800 || charcode >= 0xe000) {
   utf8.push(0xe0 | (charcode >> 12));
   utf8.push(0x80 | ((charcode >> 6) & 0x3f));
   utf8.push(0x80 | (charcode & 0x3f));
  } else {  // surrogate pair
   charcode = ((charcode & 0x3ff) << 10); // high surrogate pair (10 bits)
   charcode |= (str.charCodeAt(++i) & 0x3ff); // low surrogate pair (10 bits)
   charcode += 0x10000; // correct code point in 0x10000-0x10FFFF
   utf8.push(0xf0 | (charcode >> 18));
   utf8.push(0x80 | ((charcode >> 12) & 0x3f));
   utf8.push(0x80 | ((charcode >> 6) & 0x3f));
   utf8.push(0x80 | (charcode & 0x3f));
  }
 }
 return utf8;
}

function toString(utf8: number[]) {
 let charcodes: number[] = [];
 let code: number = 0;
 for (let i = 0; i < utf8.length; ++i) {
  if (utf8[i] < 0x80) {
   code = utf8[i];
  } else if ((0xf0 & utf8[i]) == 0xf0) {
   code = ((0x0f & utf8[i]) << 18) | ((0x3f & utf8[++i]) << 12) |
    ((0x3f & utf8[++i]) << 6) | (0x3f & utf8[++i]);
   code -= 0x10000; // add 0x10000 again to the code point
   // high surrogate starts with 0xd800
   charcodes.push(0xd800 | ((code >> 10) & 0x3ff));
   // low surrogate starts with 0xdc00
   code = 0xdc00 | (code & 0x3ff); // will be pusshed below
  } else if ((0xe0 & utf8[i]) == 0xe0) {
   code = ((0x1f & utf8[i]) << 12) | ((0x3f & utf8[++i]) << 6) |
    (0x3f & utf8[++i]);
  } else if ((0xc0 & utf8[i]) == 0xc0) {
   code = ((0x3f & utf8[i]) << 6) | (0x3f & utf8[++i]);
  }
  charcodes.push(code);
 }
 return String.fromCharCode.apply(null, charcodes);
}

function toHex(arr: number[]) {
 let res: string[] = [];
 for (let v of arr) {
  res.push(v.toString(16));
 }
 return res;
}

let s = 'Chethiya';
let a = toUTF8Array(s);
console.log(s, a, toString(a));


s = '𝟘'; // not ascii 0
a = toUTF8Array(s);
console.log(s, s.length, a, toString(a));

s = '«';
a = toUTF8Array(s);
console.log(s, s.charCodeAt(0).toString(16), toHex(a), toString(a));

// Unicode test string suggested at
// http://stackoverflow.com/questions/1343223/what-makes-a-good-test-string-for-testing-web-forms-for-unicode-compatibility
s = 'Testing «ταБЬℓσ»: 1<2 & 4+1>3, now 20% off!'
a = toUTF8Array(s);
console.log(s, toString(a), '\nMatches: ', toString(a) == s);

