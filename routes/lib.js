// Standard Library
const {
  randomBytes,
  createHash,
  createCipher,
  createDecipher,
} = require('crypto');

// Project
const {createLogger, pprint} = require('../lib');
const models = require('./database');
const {
  NoSuchRecord,
  MissingDataErr,
  InvalidRequestErr,
} = require('./api/errors');

const log = createLogger({label: 'routing', lvl: 'debug'});
const SECRET = 'U\x0bQ*kf\x1bb$Z\x13\x03\x15w\'- f\x0fn1\x0f\\\x106V\'M~\x07';
const ENCRYPTION_ALGORITHM = 'aes192';

/**
 * Validation middleware that says that the next middleware will need a certain `what` in `req[where]`.
 *
 * @param {*} what
 * @param {String} where
 * @return {Function} middleware
 */
function needs(what, where) {
  return (req, res, next) => {
    if (req[where][what] === undefined || req[where][what] === null) {
      const err = new MissingDataErr(what, where);
      return res.status(err.code).json(errMsg(err));
    } else {
      next();
    }
  };
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
 * Suggest routes when an API user types something like `/`, `/module` or `/content`.
 *
 * @param {express.Router} router
 * @param {String|RegExp|Array<String>|Array<RegExp>} path
 * @param {String|Object<String, *>|Number|Array} routes
 * @return {undefined}
 */
function suggestRoutes(router, path, routes) {
  return router.all(path, (req, res) => res.status(400).json(
    {status: 'CONFUSED', msg: 'nothing here, see the routes', routes}));
}

/**
 * Format response message when it's OK.
 *
 * @param {String} msg
 * @param {*} [result]
 * @return {{status: String, msg: String}}
 */
function msg(msg, result) {
  const status = 'OK';
  return result !== undefined ? {status, msg, result} : {status, msg};
}

/**
 * Produce a more informative error msg when using the REST API.
 *
 * @param {ValidationError|RestAPIErr|Error|String} [err]
 * @return {{status: String, msg: String}}
 */
function errMsg(err) {
  const status = 'ERROR';
  if (err === undefined || err === null) {
    return {status, msg: 'failure'};
  }

  if (err.constructor !== undefined && err.constructor.name === 'RestAPIErr') {
    return err.msgJSON;
  }

  if (err.constructor !== undefined && err.constructor.name ===
    'ValidationError') {
    /** @namespace err.errors */
    let noErrs = err.errors.length;

    if (noErrs === 0) {
      /** @namespace err.message */
      return {status, msg: `validation error: ${err.message}`};
    }

    if (noErrs > 1) {
      return {
        status,
        msg: `validation errors: ${err.errors.map(e => e.message).join(', ')}`,
      };
    }

    /** @namespace err.errors */
    return {status, msg: `validation error: ${err.errors[0].message}`};
  }

  if (err instanceof Error) {
    return {status, msg: `error: ${err.message}`};
  }

  // if err is String (cannot check with instanceof)
  return {status, msg: err.toString()};
}


/**
 * Decrypt a string.
 *
 * @param {String} s
 * @return {String} decrypted string
 */
function decrypt(s) {
  const decipher = createDecipher(ENCRYPTION_ALGORITHM, SECRET);
  let decrypted = decipher.update(s, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Encrypt a string.
 *
 * @param {String} s
 * @return {String} encrypted string
 */
function encrypt(s) {
  const cipher = createCipher(ENCRYPTION_ALGORITHM, SECRET);
  let encrypted = cipher.update(s, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function genToken(tokenLen = 18) {
  return encodeURIComponent(randomBytes(tokenLen).toString('base64'));
}

/**
 * Validation middleware that says that the next middleware will need a certain record in model not to exist.
 *
 * @param {Model} model
 * @param {Function} [attrSupplier]
 * @return {Function} middleware
 */
function notExists(model, attrSupplier = (req) => new Object()) {
  return (req, res, next) => {
    const attrs = attrSupplier(req);
    return model.findOne({where: attrs})
      .then((result) => {
        if (result === null) return next();
        /** @namespace model.tableName */
        const err = new NoSuchRecord(model.tableName, attrs);
        return res.status(err.code).json(errMsg(err));
      });
  };
}

/**
 * Validation middleware that says that the next middleware will need a certain record in model to exist.
 *
 * @param {Model} model
 * @param {Function} [attrSupplier] a function of a Request
 * @return {Function} middleware
 */
function exists(model, attrSupplier = undefined) {
  return (req, res, next) => {
    const attrs = attrSupplier(req);
    return model.findOne({where: attrs})
      .then((result) => {
        if (result !== null) return next();
        /** @namespace model.tableName */
        const err = new NoSuchRecord(model.tableName, attrs);
        return res.status(err.code).json(errMsg(err));
      });
  };
}

/**
 * Validation middleware.
 *
 * @param model
 * @param columnNameSupplier
 * @return {Function}
 */
function validColumn(model, columnNameSupplier) {
  return (req, res, next) => {
    if (model.attributes[columnNameSupplier(req)] !== undefined) {
      return next();
    }
    const err = new InvalidRequestErr('User', columnNameSupplier(req));
    return res.status(err.code).json(errMsg(err));
  };
}

/**
 * Validation middleware.
 *
 * @param columnNameSupplier
 * @param forbidden
 * @return {Function}
 */
function notRestrictedColumn(
  columnNameSupplier, forbidden = ['updatedAt', 'createdAt']) {
  return (req, res, next) => {
    const set = new Set(forbidden);
    if (!set.has(columnNameSupplier(req))) return next();
    const err = new InvalidRequestErr('User', columnNameSupplier(req));
    return res.status(err.code).json(errMsg(err));
  };
}


module.exports = {
  createLogger,
  models,
  exists,
  notExists,
  needs,
  genToken,
  encrypt,
  decrypt,
  pprint,
  sha256,
  notRestrictedColumn,
  errMsg,
  msg,
  suggestRoutes,
  log,
  validColumn,
};
