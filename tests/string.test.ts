// First argument to 'describe' (which is defined by Jasmine) is the testing module that will
// appear in test reports. The second argument is a callback containing the individual tests.

import { Struct, Interfaces } from './../src/struct/struct';
import * as Types from './../src/types';
import {StringRef} from './../src/string/string'

describe("String", function () {


 it("create and get", function () {
  let str = "Hello world!";
  let s1: StringRef = StringRef.create(str);
  let s2: StringRef = new StringRef(s1.getIndex());
  expect(s2.getString()).toEqual(str);
  s2.assign(0);
  expect(s2.getString()).toEqual(null);
  // Unicode test string suggested at
  // http://stackoverflow.com/questions/1343223/what-makes-a-good-test-string-for-testing-web-forms-for-unicode-compatibility
  str = 'Testing «ταБЬℓσ»: 1<2 & 4+1>3, now 20% off!'
  s1 = StringRef.create(str);
  s2.assign(s1.getIndex());
  expect(s2.getString()).toEqual(str);
 });
});