// Standard Library
const {spawn} = require('child_process');
const {join, resolve} = require('path');

// 3rd Party
const faker = require('faker');
const axios = require('axios');

// Project
const {isOfType} = require('./lib');

const PORT = 3000;
const HOST = '127.0.0.1';

// root URL for REST API
axios.defaults.baseURL = `http://${HOST}:${PORT}/api`;

// loads axios and includes config from the defaults
const instance = axios.create();

let winston = require('winston');

/**
 * This logger is meant to be used by all `./*.test.js` files.
 *
 * @type {winston.Logger}
 */
const log = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [
    new winston.transports.Console(),
    // Write all logs error (and below) to `/tests.log`.
    new winston.transports.File({
      filename: resolve(join(__dirname + '/../tests.log')),
    }),
  ],
});

/**
 * Starts a child process with the express server running and serving.
 * Requires a reference to the calling object since it modifies `this.serverProcess`.
 *
 * @param {Number} wait
 */
function beforeAll(wait = 3) {
  log.info('testing the REST API, starting server');
  this.serverProcess = spawn('npm', ['run', 'start']);
  const start = new Date().getSeconds();
  // wait n seconds to load the server
  while (Math.abs((new Date().getSeconds() - start)) < wait) {
    // wait & do nothing
  }
}

/**
 * Kills the child process with the express server running and serving.
 * Requires a reference to the calling object since it modifies `this.serverProcess`.
 */
function afterAll() {
  log.info('finished testing the user model in REST API, killing server');
  this.serverProcess.kill('SIGKILL');
}

/**
 * @param {String} s
 * @param {Number} len
 * @return {string}
 */
function truncate(s, len = process.stdout.columns - 5) {
  return s.length >= len ? `${s.slice(0, len - 3)} ...` : s;
}

/**
 * @param {String} url
 * @param {String} method
 * @param {Object} [typeSpec]
 * @param {Object} params
 * @return {string}
 */
function makeMsg(url, method, typeSpec = {}, params = {}) {
  const testMarker = '[test]';
  let msg = `${testMarker} ${method.toUpperCase()} ${axios.defaults.baseURL}${url}`;
  if (typeSpec === null || typeSpec === undefined ||
    (typeSpec instanceof Object && Object.keys(typeSpec).length === 0)) {
    return msg;
  }
  if (params !== null && params !== undefined && params instanceof
    Object && Object.keys(params).length > 0) {
    msg += `\n\n    with ${method.toUpperCase()} params:`;
    const longestParamLen = Object.keys(params)
      .reduce((cur, p) => p.length >= cur ? p.length : cur, 0);
    for (const param in params) {
      msg += `\n    => ${param.padEnd(longestParamLen)} ${params[param]}`;
    }
  }
  const longestKeyLen = Object.keys(typeSpec)
    .reduce((cur, k) => k.length >= cur ? k.length : cur, 0);
  msg += '\n\n    has properties:\n';
  for (const pair of Object.entries(typeSpec)) {
    let [key, val] = pair;
    val = val.toString();
    msg += `    => ${key.padEnd(longestKeyLen)} ${truncate(val)}\n`;
  }
  return msg;
}


/**
 * Tests a GET request by firing it to url and verifying output against typeSpec.
 *
 * @param {String} url
 * @param {Object} typeSpec
 */
function testGET(url, typeSpec) {
  test(makeMsg(url, 'GET', typeSpec), () => {
    expect.assertions(1);
    return expect(instance.get(url)
      .then((res) => isOfType(res.data, typeSpec))
      .catch((err) => err)).resolves.toBe(true);
  });
}

/**
 * Tests a POST request by firing it with postData to url and verifying output against typeSpec.
 *
 * @param {String} url
 * @param {String|Array<String>|Object} typeSpec
 * @param {Object} postData
 */
function testPOST(url, typeSpec, postData) {
  test(makeMsg(url, 'POST', typeSpec, postData), () => {
    expect.assertions(1);
    return expect(
      instance.post(url, postData)
        .then((res) => isOfType(res.data, typeSpec))
        .catch((err) => false)).resolves.toBe(true);
  });
}

/**
 * Tests that suggestions on routes such as `/`, `/user`, `/module` are in a proper format.
 *
 * @param {String|RegExp|Array<String|RegExp>} url
 */
function testSuggest(url) {
  return testGET(url, {status: 'String', msg: 'String'});
}

/**
 * Generate a random user.
 *
 * @return {{email: String, password: String, firstName: String, lastName: String, info: String, isAdmin: Boolean}}
 */
function randUser() {
  /** @type {String} */
  const email = faker.internet.email();
  /** @type {String} */
  const password = faker.internet.password();
  /** @type {String} */
  const firstName = faker.name.firstName();
  /** @type {String} */
  const lastName = faker.name.lastName();
  /** @type {String} */
  const info = faker.lorem.text();
  return {
    email,
    password,
    firstName,
    lastName,
    info,
    isAdmin: false,
  };
}

module.exports = {
  log,
  HOST,
  PORT,
  afterAll,
  beforeAll,
  randUser,
  testGET,
  testPOST,
  testSuggest,
};
