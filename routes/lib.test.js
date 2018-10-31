const faker = require('faker');
const api = require('./lib.js');

/**
 * Tests validateJSON by looking if json matches the schema.
 *
 * @param {*} json
 * @param {*} schema
 */
function testValidateJSON(json, schema) {
  let s = '';
  for (const key of Object.keys(schema)) {
    s += `  => ${key}: ${schema[key]}\n`;
  }
  test(`json matches schema\n${s}`, () => expect(
    api.validateJSON(json, schema)).toBe(true));
}

/**
 * Tests validateJSON by looking if json DOES NOT match the schema.
 *
 * @param {*} json
 * @param {*} schema
 */
function testNegValidateJSON(json, schema) {
  let s = '';
  for (const key of Object.keys(schema)) {
    s += `  => ${key}: ${schema[key]}\n`;
  }
  test(`json doesn't match schema\n${s}`, () => expect(
    api.validateJSON(json, schema)).toBe(false));
}

/**
 * It's valid when all k-v pairs in the schema are satisfied but MAY also have extra stuff in it.
 * Therefore, every object matches an empty-object schema.
 */
for (let i = 0; i < 10; i++) {
  const a = faker.random.number();
  const b = faker.random.number();
  testValidateJSON({a, b}, {});
  testNegValidateJSON({}, {a, b});
}

/**
 * Test if it works on nested objects.
 */
for (let i = 0; i < 10; i++) {
  testValidateJSON({
    id: faker.random.number(),
    email: faker.internet.email(),
    other: {
      secret: faker.random.number(),
    },
  }, {
    id: 'Number',
    email: 'String',
    other: {
      secret: 'Number',
    },
  });

  /**
   * Check if null matches every nullable type, the universal wildcard '*' as well as 'null'.
   */
  for (const nullType of [
    'null',
    '*',
    'Number?',
    'String?',
    'Object?',
    'Map?',
    'Set?']) {
    testValidateJSON({
      a: faker.random.number(),
      b: {
        inner: null,
      },
    }, {
      a: 'Number',
      b: {
        inner: nullType,
      },
    });
  }
}


/**
 * The schema cannot be just any arbitrary strings.
 */
for (let i = 0; i < 50; i++) {
  const email = faker.internet.email();
  const id = faker.random.number();
  testNegValidateJSON({id, email}, {id, email});
}

testValidateJSON([1, 'a'], ['Number', 'String']);
testValidateJSON([null, undefined], ['Number?', 'String?']);
testValidateJSON(null, 'null');
testValidateJSON(undefined, 'undefined');

/**
 * Null matches any schema that ends with '?'. But it will reject if you don't have it.
 */
for (const type of ['Object', 'String', 'Array']) {
  testNegValidateJSON(null, type);
  testValidateJSON(null, type + '?');
}
testNegValidateJSON({firstName: null, lastName: null},
  {firstName: 'String', lastName: 'String'});
testValidateJSON({firstName: null, lastName: null},
  {firstName: 'String?', lastName: 'String?'});

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
  let s;
  if (data instanceof Array) {
    s = '[' + data.join(', ') + ']';
  } else if (data instanceof Date) {
    s = data.toString();
  } else if (data instanceof RegExp) {
    s = data.toString();
  } else if (data instanceof Map) {
    s = 'Map {' + Array.from(data.keys()).join(', ') + '}';
  } else if (data instanceof Set) {
    s = 'Set { ' + Array.from(data.values()).join(', ') + '}';
  } else if (data === null) {
    s = 'null';
  } else if (data === undefined) {
    s = 'undefined';
  } else if (data instanceof Object) {
    s = '{' + Array.from(Object.keys(data)).join(', ') + '}';
  } else {
    s = data.toString();
  }
  test(`getType correctly guesses type of ${s} to be ${expected}`, () => {
    expect(api.getType(data)).toBe(expected);
  });
}

for (let i = 0; i < 20; i++) {
  testGetType(faker.random.word(), 'String');
  testGetType(new RegExp(faker.random.word()), 'RegExp');
  testGetType(faker.internet.email(), 'String');
  testGetType(faker.internet.password(), 'String');
  testGetType(faker.random.number(), 'Number');
  testGetType(new Number(faker.finance.amount()).valueOf(), 'Number');
  testGetType(faker.finance.amount().toString(), 'String');
  testGetType(faker.random.number().toString(), 'String');
  testGetType(faker.date.recent(), 'Date');
  testGetType(faker.date.recent().toString(), 'String');
  testGetType(faker.random.boolean(), 'Boolean');
  testGetType(faker.random.boolean().toString(), 'String');
  let array = [];
  for (let i = 0; i < faker.random.number(10); i++) {
    array.push(
      faker.random.boolean() ? faker.random.number() : faker.random.word());
  }
  testGetType(array, 'Array');
  let obj = {};
  for (let i = 0; i < faker.random.number(10); i++) {
    obj[faker.random.word()] = faker.random.boolean() ?
      faker.random.number() :
      faker.random
        .word();
  }
  testGetType(obj, 'Object');
}

// literals
testGetType('', 'String');
testGetType(0, 'Number');
testGetType(0.0, 'Number');
testGetType('0', 'String');
testGetType('0.0', 'String');
testGetType([], 'Array');
testGetType({}, 'Object');

// constructors
for (const pair of [
  [new Date(), 'Date'],
  [new Set(), 'Set'],
  [new Map(), 'Map'],
  [new Object(), 'Object'],
  [new Array(), 'Array'],
  [new Number(), 'Number'],
  [new RegExp(), 'RegExp'],
  [new String(), 'String'],
]) {
  const [data, type] = pair;
  testGetType(data, type);
}
