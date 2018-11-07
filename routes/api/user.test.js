/**
 * Test Suite for `/user/*`.
 *
 * Plan:
 *
 * 1. register
 * 2. expect non-null email (username)
 * 2. expect null firstName, lastName, info
 * 3. set attributes
 * 4. get attributes (expect a non-null value)
 * 3. set nullable attributes to null
 * 4. get attributes (expect a null value)
 * 4. get all info on a user (expect a null value in nullable attrs, non-null email)
 * 5. un-register
 *
 * @author Norbert
 */
const testUtils = require('./testUtils');
const faker = require('faker');
const maybe = faker.random.boolean;
const NO_RUNS = 10;
const {
  afterAll: after,
  beforeAll: before,
  log,
  randUser,
  testGET,
  testPOST,
  testSuggest,
} = testUtils;
const {pprint} = require('./../lib');

beforeAll(function() {
  return before();
});

afterAll(function() {
  return after();
});

/**
 * Some routes will not yield any data nor will they modify the database but act as directories.
 *
 * If you type `/user` you should get a hint suggesting where you might want to go next (e.g. /user/<email>).
 */
testSuggest('/user');

log.info(`running user test suite ${NO_RUNS}x`);

const mockUsers = []

for (let i = 0; i < NO_RUNS; i++) {

  const user = randUser();
  const {email, password} = user;

  log.debug('generated mock user');
  log.debug(pprint(user));

  log.info(`testing registration of ${email}`);
  testPOST(`/user/register`,
    {status: 'String', msg: 'String'}, {password, email});

  log.info(`testing that email of ${email} is not null after registration`);
  testGET(`/user/${email}/email`, {
    status: 'String',
    msg: 'String',
    result: 'String',
  });

  for (const attr of ['firstName', 'lastName', 'info']) {

    log.info(`testing that ${attr} of new user ${email} is null`);
    testGET(`/user/${email}/${attr}`, {
      status: 'String',
      msg: 'String',
      result: 'null',
    });

    const value = user[attr] + 'abc'; // reset to the same

    log.info(`testing updating of ${attr} in ${email}`);
    testPOST(`/user/${email}/${attr}`,
      {status: 'String', msg: 'String'}, {password, value});

    log.info(`testing getting of ${attr} in ${email}`);
    testGET(`/user/${email}/${attr}`, {
      status: 'String',
      msg: 'String',
      result: 'String',
    });

    log.info(`testing that ${attr} of ${email} was set to null`);
    testPOST(`/user/${email}/${attr}`,
      {status: 'String', msg: 'String'},
      maybe() ? {email, password, value: null} : {password, value: null},
    );

    log.info(`testing that ${attr} was set to null`);
    testGET(`/user/${email}/${attr}`, {
      status: 'String',
      msg: 'String',
      result: 'null',
    });
  }

  /**
   * NOTE there is an issue with booleans being stored as INTS by databases. After all databases are written in C which sees boolean as alias to int.
   * DO NOT check that is_admin is of type 'Boolean' because it will fail.
   *
   * NOTE nullable attrs have been changed to null above.
   */
  log.info(`testing getting all info about ${email}`);
  testGET(`/user/${email}`, {
    status: 'String',
    msg: 'String',
    result: {
      email: 'String',
      firstName: 'null',
      lastName: 'null',
      info: 'null',
    },
  });

  testGET(`/user/${email}`, {
    status: 'String',
    msg: 'String',
    result: {
      email: 'String',
      firstName: 'String?',
      lastName: 'String?',
      info: 'String?',
    },
  });

  /**
   * Tests retrieving user's non-nullable attribute.
   *
   * NOTE don't check for password because it won't work.
   */
  testGET(`/user/${email}/email`,
    {status: 'String', msg: 'String', result: 'String'});
}


for (const user of mockUsers) {
  log.info(`testing un-registering of ${user.email}`);
  testPOST(`/user/unregister`,
    {status: 'String', msg: 'String'}, {email: user.email, password: user.password},
  );
}
