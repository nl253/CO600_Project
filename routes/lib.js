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
const {Session} = require('./database');
const {createLogger} = require('../lib');
const {
  SessionExpiredErr,
  RecordExistsErr,
  NoSuchRecord,
  MissingDataErr,
  InvalidRequestErr,
} = require('./errors');

const log = createLogger({label: 'ROUTING', lvl: process.env.LOGGING_ROUTING || 'warn'});

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

/**
 * Validation middleware that says that the next middleware will need a certain record in model not to exist.
 *
 * @param {Model} model
 * @param {Function} attrSupplier function of Request that returns Object with column names as keys
 * @return {Function} Express middleware
 */
function notExists(model, attrSupplier) {
  return (req, res, next) => model
    .findOne({where: attrSupplier(req)})
    .then((result) => result === null
      ? next()
      : next(new RecordExistsErr(model.tableName, attrSupplier(req))));
}

/**
 * Validation middleware that says that the next middleware will need a certain record in model to exist.
 *
 * @param {Model} model
 * @param {Function} attrSupplier function of Request that returns Object with keys matching columns
 * @return {Function} Express middleware
 */
function exists(model, attrSupplier) {
  return (req, res, next) => model
    .findOne({where: attrSupplier(req)})
    .then((result) => result !== null
      ? next()
      : next(new NoSuchRecord(model.tableName, attrSupplier(req))));
}

/**
 * Validation middleware.
 *
 * @param {Model} model
 * @param {Function} columnNameSupplier function of Request that returns String
 * @return {Function} Express middleware
 */
function validColumn(model, columnNameSupplier) {
  return (req, res, next) =>
    model.attributes[columnNameSupplier(req)] === undefined
      ? next(new InvalidRequestErr('User', columnNameSupplier(req)))
      : next();
}

/**
 * Validation middleware.
 *
 * @param {Model} model
 * @param {Function} columnsNamesSupplier
 * @return {Function} Express middleware
 */
function validColumns(model, columnsNamesSupplier) {
  return (req, res, next) => {
    try {
      for (let col of columnsNamesSupplier(req)) {
        if (model.attributes[col] === undefined) {
          return next(new InvalidRequestErr('User', col));
        }
      }
    } catch (e) {}
    return next();
  };
}

/**
 * Validation middleware.
 *
 * @param columnNameSupplier
 * @param {Array<String>} forbidden banned columns
 * @return {Function} Express middleware
 */
function notRestrictedColumn(columnNameSupplier, forbidden = ['updatedAt', 'createdAt']) {
  return (req, res, next) => {
    try {
      if (new Set(forbidden).has(columnNameSupplier(req))) {
        return next(new InvalidRequestErr('User', columnNameSupplier(req)));
      }
    } catch (e) {}
    return next();
  }
}

/**
 * Validation middleware.
 *
 * @param {Function} columnsNamesSupplier function of Request that returns Array of Strings
 * @param {Array<String>} forbidden banned columns
 * @return {Function} Express middleware
 */
function notRestrictedColumns(columnsNamesSupplier = (request) => [], forbidden = ['updatedAt', 'createdAt']) {
  return (req, res, next) => {
    const bannedCols = new Set(forbidden);
    try {
      for (const c of columnsNamesSupplier(req)) {
        if (bannedCols.has(c)) {
          return next(new InvalidRequestErr('User', c));
        }
      }
    } catch (e) {}
    return next();
  };
}

/**
 * Validation middleware.
 *
 * @param {Function} tokenSupplier function of Request that returns String (the token)
 * @return {Function} Express middleware
 */
function hasFreshSess(tokenSupplier) {
  return (req, res, next) =>
    Session.findOne({where: {token: tokenSupplier(req)}})
      .then(token => (Date.now() - token.dataValues.updatedAt) >=
      process.env.SESSION_TIME
        ? next(new SessionExpiredErr())
        : next());
}


module.exports = {
  decrypt,
  encrypt,
  exists,
  genToken,
  hasFreshSess,
  log,
  needs,
  notExists,
  notRestrictedColumn,
  notRestrictedColumns,
  sha256,
  validColumn,
  validColumns,
};
