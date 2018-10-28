/**
 * This module contains utility functions to be used by everything in the
 * `PROJECT_ROOT/routes` directory.
 *
 * @author Norbert
 */
const crypto = require('crypto');
const ValidationError = require('sequelize/lib/errors').ValidationError;

/**
 * Produce a more informative error msg when using the REST API.
 *
 * @param {string} msg
 * @param {Error} [err]
 * @return {{status: string, msg: string}}
 */
function errMsg(msg, err) {
  const status = 'ERROR';
  if ((err !== undefined) && (err instanceof ValidationError) &&
    err.errors.length > 0) {
    const error = err.errors[0];
    let message = error.message;
    if (err.fields.length > 0) {
      const fields = err.fields.map((f) => f.toLocaleString())
        .reduce((x, y) => `${x}, ${y}`);
      message = `issue with ${fields}: ${message}`;
    }
    return {status, msg: `${msg}, error: ${message}`};
  } else if (err) {
    return {status, msg: `${msg}, error: ${err.message}`};
  } else {
    return {status, msg};
  }

}

/**
 * Format response message when it's OK.
 *
 * @param {string} msg
 * @param {*} [result]
 * @return {{status: string, msg: string}}
 */
function msg(msg, result) {
  const status = 'OK';
  return result !== undefined ? {status, msg, result} : {status, msg};
}

/**
 * Compute SHA-256 of data. Use to avoid storing passwords in the
 * db in plain text.
 *
 * @param {string} data
 * @return {string}
 */
function sha256(data) {
  const hash = crypto.createHash('sha256');
  hash.update(data);
  return hash.digest('base64').toString();
}

module.exports = {msg, errMsg, sha256};
