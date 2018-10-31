/**
 * Tests for ./user.js.
 *
 * To test the REST API it's necessary to start the app itself.
 * See `beforeAll()` and `afterAll()`.
 *
 * @author Norbert
 */
const {spawn} = require('child_process');
const os = require('os');

const faker = require('faker');

/**
 * Draws a boolean from the uniform distribution.
 *
 * @return {string} random boolean
 */
const maybe = faker.random.boolean;
const axios = require('axios');

const WAIT_SEC = 3;
const PORT = 3000;
const HOST = '127.0.0.1';
const NO_RUNS = 50;

// root URL for REST API
axios.defaults.baseURL = `http://${HOST}:${PORT}/api`;

// loads axios and includes config from the defaults
const instance = axios.create();

const {
  validateJSON,
} = require('./lib.js');


/** @type {ChildProcess} */
let serverProcess;

/**
 * Starts a child process with the express server running and serving.
 */
beforeAll(() => {
  if (os.type().toLowerCase() === 'linux') {
    spawn('pkill', ['node']);
  } else {
    console.warn(
      `you seem to be on ${os.type()}, make sure that no other node processes are running`);
  }
  // return; // FOR NOW
  console.info('testing REST API, starting server');
  serverProcess = spawn('npm', ['run', 'start']);
  const start = new Date().getSeconds();
  // wait WAIT_SEC seconds to load the server
  while (Math.abs((new Date().getSeconds() - start)) < WAIT_SEC) {
    // wait & do nothing
  }
});

/**
 * Kills the child process with the express server running and serving.
 */
afterAll(() => {
  // return; // FOR NOW
  console.info('finished testing REST API, killing server');
  serverProcess.kill('SIGKILL');
});

/**
 * Tests a GET request by firing it to url and verifying output against schema.
 *
 * @param {string} url
 * @param {Object} schema
 */
function testGET(url, schema = {}) {
  let msg = `GET ${axios.defaults.baseURL}${url}`;
  const pairs = Object.entries(schema);
  if (pairs.length > 0) {
    msg += ' has fields:\n';
    for (const pair of pairs) {
      const [key, val] = pair;
      msg += `  => ${key}: ${val}\n`;
    }
  }
  test(msg, () => {
    expect.assertions(1);
    return expect(instance.get(url)
      .then((res) => {
        const data = res.data;
        const isOK = validateJSON(data, schema);
        if (!isOK) {
        }
        return isOK;
      })
      .catch((err) => {
        console.log(err);
        return err;
      })).resolves.toBe(true);
  });
}

/**
 * Tests a POST request by firing it with postData to url and verifying output against schema.
 *
 * @param {string} url
 * @param {Object} schema
 * @param {Object} postData
 */
function testPOST(url, schema, postData) {
  let msg = `POST ${axios.defaults.baseURL}${url}`;
  const pairs = Object.entries(schema);
  if (pairs.length > 0) {
    msg += ' has fields:\n';
    for (const pair of pairs) {
      const [key, val] = pair;
      msg += `  => ${key}: ${val}\n`;
    }
  }
  test(msg, () => {
    expect.assertions(1);
    return expect(instance.post(url, postData)
      .then((res) => validateJSON(res.data, schema))
      .catch((err) => {
        console.info(err);
        return err;
      })).resolves.toBe(true);
  });
}

/**
 * Some routes will not yield any data nor will they modify the database but act as directories.
 *
 * If you type something like:
 *
 *   /
 *   /user
 *   /module
 *
 * you should get a hint suggesting where you might want to go next (e.g. /user/<email>).
 */
for (const route of ['/', '/user', '/module']) {
  testGET(route, {
    status: 'String',
    msg: 'String',
  });
}

/**
 * Checks user-related sequences of actions such:
 *
 * 1. register
 * 2. expect non-null email (username)
 * 3. set attribute
 * 4. get attribute (expect a value)
 * 5. un-register
 *
 */
for (let i = 0; i < NO_RUNS; i++) {
  /** @type {string} */
  const email = faker.internet.email();
  /** @type {string} */
  const password = faker.internet.password();
  /** @type {string} */
  const firstName = faker.name.firstName();
  /** @type {string} */
  const lastName = faker.name.lastName();
  /** @type {string} */
  const info = faker.lorem.text();

  // uncomment when debugging
  /*
  const user =
    `

User
----
email     ${email}
password  ${password}
firstName ${firstName}
lastName  ${lastName}
info      ${(info.length > 50 ? info.slice(0, 50) + ' ...' : info).replace('\n',
      ' ')}`
      .trim();

  console.info(user);
  */

  /**
   * Tests registration with email in the URL and just password in request body.
   *
   * Also tests registration with email in the URL and both password AND email in request body.
   */
  let postParams = maybe() ? {password} : {password, email};
  testPOST(`/user/${email}/register`, {status: 'String', msg: 'String'},
    postParams);

  for (const pair of [
    ['email', email],
    ['first_name', firstName],
    ['last_name', lastName],
    ['info', info]]) {
    const [attr, value] = pair;

    /**
     * Tests updating an attribute with email in the URL and just password in request body.
     *
     * Also tests updating an attribute with email in the URL and both password AND email in request body.
     */
    postParams = maybe() ? {password, value} : {password, email, value};
    testPOST(`/user/${email}/${attr}`, {status: 'String', msg: 'String'},
      postParams);

    /**
     * Tests getting an attribute after updating it above.
     */
    testGET(`/user/${email}/${attr}`, {
      status: 'String',
      msg: 'String',
      result: 'String',
    });

    /**
     * Tests updating an attribute to the empty string ('') with email in the URL and just password in request body.
     *
     * Also tests updating an attribute to '' with email in the URL and both password AND email in request body.
     */
    postParams = maybe() ? {email, password, value: ''} : {password, value: ''};
    testPOST(`/user/${email}/${attr}`, {
      status: 'String',
      msg: 'String',
    }, postParams);
  }

  /**
   * Tests retrieving all info about a user.
   *
   * NOTE: there is an issue with booleans being stored as INTS by databases. After all databases are written in C which sees boolean as alias to int.
   * DO NOT check that is_admin is of type 'Boolean' because it will fail.
   */
  testGET(`/user/${email}`, {
    status: 'String',
    msg: 'String',
    result: {
      email: 'String',
      first_name: 'String',
      last_name: 'String',
      info: 'String',
    },
  });

  /**
   * Tests retrieving user's email. It must not be null since it's the PK.
   */
  testGET(`/user/${email}/email`,
    {status: 'String', msg: 'String', result: 'String'});


  /**
   * Tests un-registering a user with email in the URL and password in the request body.
   *
   * Also tests un-registering a user with email in the URL AND credentials in the request body.
   */
  postParams = maybe() ? {email, password} : {password};
  testPOST(`/user/${email}/unregister`, {status: 'String', msg: 'String'},
    postParams);
}
