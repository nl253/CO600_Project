/**
 * This module contains utility functions to be used by everything in the
 * `PROJECT_ROOT/routes` directory.
 */

// Standard Library
const {
  randomBytes,
  createHash,
  createCipher,
  createDecipher,
} = require('crypto');

// Project
const {createLogger} = require('../lib');
const {
  NotLoggedInErr,
  MissingDataErr,
  InvalidRequestErr,
} = require('./errors');

const log = createLogger({
  label: 'ROUTING',
  lvl: process.env.LOGGING_ROUTING || 'warn',
});

/**
 * Validation middleware that says that the next middleware will need a certain `what` in `req[where]`.
 *
 * @param {*} what
 * @param {String} where
 * @return {Function} middleware
 */
function needs(what, where) {
  return (req, res, next) =>
    req[where] === undefined || req[where] === null || req[where][what] ===
    undefined || req[where][what] === null
      ? next(new MissingDataErr(what, where))
      : next();
}

/**
 * Compute SHA-256 of data. Use to avoid storing passwords in the db in plain text.
 *
 * @param {String} data
 * @return {String} hashed value
 */
function sha256(data) {
  const hash = createHash('sha256');
  hash.update(data);
  return hash.digest('base64').toString();
}


/**
 * Decrypt a string.
 *
 * @param {String} s message to decrypt
 * @return {String} decrypted string
 */
function decrypt(s) {
  const decipher = createDecipher(process.env.ENCRYPTION_ALGORITHM,
    process.env.SECRET);
  let decrypted = decipher.update(s, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Encrypt a string.
 *
 * @param {String} s message to encrypt
 * @return {String} encrypted String
 */
function encrypt(s) {
  const cipher = createCipher(process.env.ENCRYPTION_ALGORITHM,
    process.env.SECRET);
  let encrypted = cipher.update(s, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function genToken(tokenLen = 18) {
  return randomBytes(tokenLen).toString('base64');
}
function isLoggedIn() {
  return async (req, res, next) => {
    if (res.locals.loggedIn) return next();
    else return next(new NotLoggedInErr());
  };
}

function neededCols(where, needed) {
  return (req, res, next) => {

  };
}

function validCols(model, where = 'body', bannedCols = ['createdAt', 'updatedAt']) {
  return (req, res, next) => {
    const badCol = Object.keys(req[where])
      .find(col => model.attributes[col] === undefined || bannedCols.includes(col));
    return badCol === undefined
      ? next()
      : next(new InvalidRequestErr(model.getTableName(), badCol));
  };
}

module.exports = {
  decrypt,
  encrypt,
  genToken,
  isLoggedIn,
  validCols,
  log,
  needs,
  sha256,
};
