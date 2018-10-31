const faker = require('faker');
const api = require('./lib.js');


/**
 * Tests isOfType by looking if data matches the type.
 *
 * @param {*} data
 * @param {String|Object|Array} type
 */
function testIsOfType(data, type) {
  test(`data ${api.pprint(data)} matches type ${api.pprint(type)}`,
    () => expect(api.isOfType(data, type)).toBe(true));
}

/**
 * Tests isOfType by looking if data DOES NOT match the type.
 *
 * @param {*} data
 * @param {String|Object|Array} type
 */
function testNotOfType(data, type) {
  test(
    `data ${api.pprint(data)} doesn't match type ${api.pprint(type)}`,
    () => expect(
      api.isOfType(data, type)).toBe(false));
}

/**
 * It's valid when all k-v pairs in the schema are satisfied but MAY also have extra stuff in it.
 * Therefore, every object matches an empty-object schema.
 */
for (let i = 0; i < 10; i++) {
  const a = faker.random.number();
  const b = faker.random.number();
  testIsOfType({a, b}, {});
  testNotOfType({}, {a, b});
}

/**
 * Test if it works on nested objects.
 */
for (let i = 0; i < 10; i++) {
  testIsOfType({
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
    'Date?',
    'Set?']) {
    testIsOfType({
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
  testNotOfType({id, email}, {id, email});
}

testIsOfType([1, 'a'], ['Number', 'String']);
testIsOfType([null, undefined], ['Number?', 'String?']);
testIsOfType(null, 'null');
testIsOfType(null, '*');
testIsOfType(undefined, 'undefined');
testIsOfType(undefined, '*');

/**
 * Null matches any schema that ends with '?'. But it will reject if you don't have it.
 */
for (const type of ['String', 'Boolean', 'Number', 'Date', 'Set']) {
  testNotOfType(null, type);
  testIsOfType(null, type + '?');
}
testNotOfType({firstName: null, lastName: null},
  {firstName: 'String', lastName: 'String'});
testIsOfType({firstName: null, lastName: null},
  {firstName: 'String?', lastName: 'String?'});

/**
 * Specifying `?` at the end of a type means it MIGHT be `null` or `undefined`.
 */
for (const type of ['String', 'Number', 'Boolean', 'Date', 'Set']) {
  testIsOfType(null, `${type}?`);
  testIsOfType(undefined, `${type}?`);
}


/**
 * Check that `guessType` correctly guesses type of data by comparing the result to expected.
 *
 * @param {*} data
 * @param {string} expected
 */
function testGuessType(data, expected) {
  test(
    `guessType correctly guesses type of ${api.pprint(
      data)} to be ${data instanceof
    String ? data : api.pprint(data)}`,
    () => {
      expect(api.guessType(data)).toEqual(expected);
    });
}

for (let i = 0; i < 20; i++) {
  testGuessType(faker.random.word(), 'String');
  testGuessType(new RegExp(faker.random.word()), 'RegExp');
  testGuessType(faker.internet.email(), 'String');
  testGuessType(faker.internet.password(), 'String');
  testGuessType(faker.random.number(), 'Number');
  testGuessType(new Number(faker.finance.amount()).valueOf(), 'Number');
  testGuessType(faker.finance.amount().toString(), 'String');
  testGuessType(faker.random.number().toString(), 'String');
  testGuessType(faker.date.recent(), 'Date');
  testGuessType(faker.date.recent().toString(), 'String');
  testGuessType(faker.random.boolean(), 'Boolean');
  testGuessType(faker.random.boolean().toString(), 'String');
  // let array = [];
  // for (let i = 0; i < faker.random.number(10); i++) {
  //   array.push(
  //     faker.random.boolean() ? faker.random.number() : faker.random.word());
  // }
  // testGuessType(array, 'Array');
  // let obj = {};
  // for (let i = 0; i < faker.random.number(10); i++) {
  //   obj[faker.random.word()] = faker.random.boolean() ?
  //     faker.random.number() :
  //     faker.random
  //       .word();
  // }
  // testGuessType(obj, 'Object');
}

// literals
testGuessType('', 'String');
testGuessType(0, 'Number');
testGuessType(0.0, 'Number');
testGuessType('0', 'String');
testGuessType('0.0', 'String');
testGuessType([], []);
testGuessType({}, {});

// constructors
for (const pair of [
  [new Date(), 'Date'],
  [new Set(), 'Set'],
  [new Map(), {}],
  [new Object(), {}],
  [new Array(), []],
  [new Number(), 'Number'],
  [new RegExp(), 'RegExp'],
  [new String(), 'String'],
]) {
  const [data, type] = pair;
  testGuessType(data, type);
}
