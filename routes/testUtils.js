// Standard Library
const {spawn} = require('child_process');
const {join, resolve} = require('path');

// 3rd Party
const faker = require('faker');

// Project
const {isOfType} = require('./lib');

const axios = require('axios');

const PORT = 3000;
const HOST = '127.0.0.1';

// root URL for REST API
axios.defaults.baseURL = `http://${HOST}:${PORT}/api`;

// loads axios and includes config from the defaults
const instance = axios.create();

let winston = require('winston');

const log = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [
    new winston.transports.Console(),
    // Write all logs error (and below) to `/warnings.log`.
    new winston.transports.File({
      filename: resolve(join(__dirname + '/../tests.log')),
    }),
  ],
});

/**
 * Draws a boolean from the uniform distribution.
 *
 * @return {string} random boolean
 */
const maybe = faker.random.boolean;
const randWord = faker.random.word;
const randDate = faker.date.recent;
const randEmail = faker.internet.email;
const randPassword = faker.internet.password;
const randNum = faker.random.number;

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
 * Tests a GET request by firing it to url and verifying output against type.
 *
 * @param {String} url
 * @param {Object} type
 */
function testGET(url, type) {
  let msg = `GET ${axios.defaults.baseURL}${url}`;
  if (type !== undefined && type !== null && type instanceof Object) {
    const pairs = Object.entries(type);
    if (pairs.length > 0) {
      msg += ' has fields:\n';
      for (const pair of pairs) {
        const [key, val] = pair;
        msg += `  => ${key}: ${val}\n`;
      }
    }
  }
  test(msg, () => {
    expect.assertions(1);
    return expect(instance.get(url)
      .then((res) => {
        return isOfType(res.data, type);
      })
      .catch((err) => {
        return err;
      })).resolves.toBe(true);
  });
}

/**
 * Tests a POST request by firing it with postData to url and verifying output against type.
 *
 * @param {String} url
 * @param {String|Array<String>|Object} type
 * @param {Object} postData
 */
function testPOST(url, type, postData) {
  let msg = `POST ${axios.defaults.baseURL}${url}`;
  if (type !== undefined && type !== null && type instanceof Object) {
    const pairs = Object.entries(type);
    if (pairs.length > 0) {
      msg += ' has fields:\n';
      for (const pair of pairs) {
        const [key, val] = pair;
        msg += `  => ${key}: ${val}\n`;
      }
    }
  }
  test(msg, () => {
    expect.assertions(1);
    return expect(
      instance.post(url, postData)
        .then((res) => {
          return isOfType(res.data, type);
        })
        .catch((err) => {
          return false;
        })).resolves.toBe(true);
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
  const email = randEmail();
  /** @type {String} */
  const password = randPassword();
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
  maybe,
  randDate,
  randEmail,
  randNum,
  randPassword,
  randUser,
  randWord,
  testGET,
  testPOST,
  testSuggest,
};
