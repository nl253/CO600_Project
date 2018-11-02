/**
 * Test Suite for `/user/*`.
 *
 * Plan:
 *
 * 1. register
 * 2. expect non-null email (username)
 * 3. set attribute
 * 4. get attribute (expect a value)
 * 5. un-register
 *
 * @author Norbert
 */
const testUtils = require('./testUtils');
const NO_RUNS = 100;
const {
  afterAll: after,
  beforeAll: before,
  maybe,
  randUser,
  testGET,
  testPOST,
  testSuggest,
} = testUtils;

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

/**
 * Checks user-related sequences of actions such:
 *
 */
for (let i = 0; i < NO_RUNS; i++) {

  const {email, password, firstName, lastName, info} = randUser();

  /**
   * Tests registration with email in the URL and just password in request body.
   */
  testPOST(
    `/user/${email}/register`,
    {status: 'String', msg: 'String'},
    maybe() ? {password} : {password, email},
  );

  for (const entry of Object.entries(
    {email, firstName, lastName, password, info})) {

    const [attr, value] = entry;

    /**
     * Tests updating an attribute with email in the URL and password in request body.
     */
    if (attr !== 'password' && attr !== 'email') {
      testPOST(`/user/${email}/${attr}`, {status: 'String', msg: 'String'},
        {password, value});
    }

    /**
     * Tests getting an attribute after updating it above.
     */
    if (attr !== 'password') {
      testGET(`/user/${email}/${attr}`, {
        status: 'String',
        msg: 'String',
        result: 'String',
      });
    }

    /**
     * Tests updating nullable attributes to null.
     */
    if (new Set(['firstName', 'lastName', 'info']).has(attr)) {
      testPOST(
        `/user/${email}/${attr}`,
        {status: 'String', msg: 'String'},
        maybe() ? {email, password, value: null} : {password, value: null},
      );

      /**
       * Tests that it's null after changing it to null above.
       */
      testGET(`/user/${email}/${attr}`, {
        status: 'String',
        msg: 'String',
        result: 'null',
      });
    }
  }

  /**
   * Tests retrieving all info about a user.
   *
   * NOTE there is an issue with booleans being stored as INTS by databases. After all databases are written in C which sees boolean as alias to int.
   * DO NOT check that is_admin is of type 'Boolean' because it will fail.
   *
   * NOTE nullable attrs have been changed to null above.
   */
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


  /**
   * Tests un-registering a user with email in the URL and password in the request body.
   *
   * Also tests un-registering a user with email in the URL AND credentials in the request body.
   */
  testPOST(
    `/user/${email}/unregister`,
    {status: 'String', msg: 'String'},
    maybe() ? {email, password} : {password},
  );
}
