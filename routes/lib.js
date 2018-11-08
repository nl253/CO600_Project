/**
 * This module contains utility functions to be used by everything in the `/routes` directory.
 *
 * @author Norbert
 */

// Project
const {createLogger, pprint, sha256} = require('../lib');

module.exports = {
  createLogger,
  pprint,
  sha256,
  log: createLogger({label: 'routing', lvl: 'silly'}),
};
