// 3rd Party
const faker = require('faker');
const axios = require('axios');

// Project
const {createLogger} = require('../lib');

/**
 * This is a logger for the database that logs all queries.
 *
 * @type {winston.Logger}
 */
const log = createLogger({label: 'TEST', lvl: process.env.LOGGING_TESTS});

const HOST = '127.0.0.1';

// loads axios and includes config from the defaults
const httpClient = axios.create({
  withCredentials: true,
  baseURL: `http://${HOST}:${process.env.PORT}/api`,
  headers: {
    'accept': ['application/json', 'application/javascript'].join(', '),
    'accept-language': ['en-GB', 'en-US', 'en'].join(', '),
    'content-language': 'en-GB',
    'content-type': 'application/json',
  },
  validateStatus: (status) => true,
});

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
  httpClient,
  log,
  randUser,
};
