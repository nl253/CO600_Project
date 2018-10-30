const api = require('./lib.js');

// number the tests for better msgs
let counter = 1;
let counterNeg = 1;

/**
 * Tests validateJSON by looking if json matches the schema.
 *
 * @param {*} json
 * @param {*} schema
 */
function testValidateJSON(json, schema) {
  test(`json matches schema ${counter}`, () => expect(
    api.validateJSON(json, schema)).toBe(true));
  counter++;
}

/**
 * Tests validateJSON by looking if json DOES NOT match the schema.
 *
 * @param {*} json
 * @param {*} schema
 */
function testNegValidateJSON(json, schema) {
  test(`json doesn't match schema ${counterNeg}`, () => expect(
    api.validateJSON(json, schema)).toBe(false));
  counterNeg++;
}

/**
 * It's valid when all k-v pairs in the schema are satisfied but MAY also have extra stuff in it.
 * Therefore, every object matches an empty-object schema.
 */
testValidateJSON({a: 22, b: 33}, {});
testNegValidateJSON({}, {a: 22, b: 33});


/**
 * Test if it works on nested objects.
 */
testValidateJSON({
    id: 22,
    email: 'if50@kent.ac.uk',
    other: {secret: 2213},
  },
  {
    id: 'Number',
    email: 'String',
    other: {secret: 'Number'},
  },
);

testValidateJSON({
  id: 22,
  email: 'if50@kent.ac.uk',
}, {
  id: 'Number',
  email: 'String',
});

testNegValidateJSON({
  id: 22,
  email: 'if50@kent.ac.uk',
}, {
  id: '22',
  email: 'if50@kent.ac.uk',
});

testValidateJSON([1, 'a'], ['Number', 'String']);
testValidateJSON([null, undefined], ['Number?', 'String?']);
testValidateJSON(null, 'null');
testValidateJSON(undefined, 'undefined');

/**
 * Specifying `?` at the end of a type means it MIGHT be `null` or `undefined`.
 */
for (const type of ['String', 'Object', 'Number', 'Array']) {
  testValidateJSON(null, `${type}?`);
  testValidateJSON(undefined, `${type}?`);
}

/**
 * Check that `getType` correctly guesses type of data by comparing the result to expected.
 *
 * @param {*} data
 * @param {string} expected
 */
function testGetType(data, expected) {
  test(`getType correctly guesses type of ${data} to be ${expected}`, () => {
    expect(api.getType(data)).toBe(expected);
  });
}

testGetType('', 'String');
testGetType('abc', 'String');
testGetType('123', 'String');
testGetType(999, 'Number');
testGetType(0, 'Number');
testGetType(123.8123, 'Number');
testGetType(0.312, 'Number');
testGetType([], 'Array');
testGetType([0, 'a', 'b'], 'Array');
testGetType({}, 'Object');
testGetType({email: null, password: null}, 'Object');
testGetType(new Date(), 'Date');
testGetType(new String(), 'String');
testGetType(new Object(), 'Object');
