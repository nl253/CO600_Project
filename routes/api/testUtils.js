// Standard Library
const {spawn} = require('child_process');
const {join, resolve} = require('path');

// 3rd Party
const faker = require('faker');
const axios = require('axios');

// Project
const winston = require('winston');

/**
 * This is a logger for the database that logs all queries.
 *
 * @type {winston.Logger}
 */
const log = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.label({label: 'TESTS'}),
    winston.format.prettyPrint(),
    winston.format.printf(
      info => `${info.level && info.level.trim() !== '' ?
        ('[' + info.level.toUpperCase() + ']').padEnd(10) :
        ''}${info.label ?
        (info.label + ' ::').padEnd(12) :
        ''}${info.message}`),
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      level: 'warn',
      filename: resolve(join(__dirname, '..', 'logs', 'tests.log')),
    }),
  ],
});

const PORT = 3000;
const HOST = '127.0.0.1';

// loads axios and includes config from the defaults
const instance = axios.create({
  withCredentials: true,
  baseURL: `http://${HOST}:${PORT}/api`,
  headers: {'Content-Type': 'application/json'},
  responseType: 'json',
  validateStatus: (status) => true,
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
 * @param {{url: String, method: String, [responseType]: String, [data]: Object, [params]: Object}} reqCfg
 * @return {string}
 */
function describeTest(reqCfg) {
  /** @namespace instance.defaults */
  return `${reqCfg.method.toUpperCase()} ${join(instance.defaults.baseURL,
    reqCfg.url)}${'params' in reqCfg 
        ? ' with params: ' + Object.entries(reqCfg.params).map(entry => entry[0] + ': ' + entry[1].slice(0, 10)).join(', ') 
        : ''}${'data' in reqCfg 
            ? ' with body ' + Object.entries(entry => entry[0] + ': ' + entry[1].slice(0, 10)) 
            : ''}`;
}

/**
 * Generate a random user.
 *
 * @return {{email: String, password: String, firstName: String, lastName: String, info: String, isAdmin: Boolean}}
 */
function randUser() {
  return {
    email: faker.internet.email(),
    password: faker.internet.password(),
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    info: faker.lorem.text(),
    isAdmin: false,
  };
}

module.exports = {
  HOST,
  PORT,
  afterAll,
  beforeAll,
  describeTest,
  instance,
  log,
  randUser,
};
