/**
 * This module contains utility functions to be used by everything in the
 * `PROJECT_ROOT/routes` directory.
 *
 * @author Norbert
 */
const crypto = require('crypto');
const {join, resolve} = require('path');
const {ValidationError} = require('sequelize/lib/errors');
let winston = require('winston');

const log = winston.createLogger({
  level: 'debug',
  format: winston.format.simple(),
  transports: [
    new winston.transports.Console(),
    // Write all logs error (and below) to `/warnings.log`.
    new winston.transports.File({
      filename: resolve(join(__dirname + '/../warnings.log')),
    }),
  ],
});

/**
 * Pretty print data.
 *
 * @param {*} data
 * @return {string}
 */
function pprint(data) {
  if (data instanceof Array) {
    return `[${data.join(', ')}]`;
  }

  if (data === null) {
    return 'null';
  }

  if (data === undefined) {
    return 'undefined';
  }

  if ((data instanceof Date) || (data instanceof RegExp)) {
    return data.toString();
  }

  if (data instanceof Map) {
    return `Map {${Array.from(data.entries())
      .map((pair) => `${pair[0]}: ${pair[1]}`)
      .join(', ')}}`;
  }

  if (data instanceof Set) {
    return `Set {${Array.from(data.values())
      .join(', ')}}`;
  }

  if (data instanceof Object) {
    return `{${Array.from(Object.entries(data))
      .map((pair) => `${pair[0]}: ${pair[1]}`)
      .join(', ')}}`;
  }

  return data.toString();
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

  if (err instanceof RestAPIErr) {
    return err.msgJSON;
  }

  if (err instanceof ValidationError) {
    let noErrs = err.errors.length;

    if (noErrs === 0) {
      return {status, msg: `validation error: ${err.message}`};
    }

    if (noErrs > 1) {
      return {
        status,
        msg: `validation errors: ${err.errors.map(e => e.message).join(', ')}`,
      };
    }

    return {status, msg: `validation error: ${err.errors[0].message}`};
  }

  if (err instanceof Error) {
    return {status, msg: `error: ${err.message}`};
  }

  // if err is String (cannot check with instanceof)
  return {status, msg: err.toString()};
}

/**
 * Compute SHA-256 of data. Use to avoid storing passwords in the db in plain text.
 *
 * @param {String} data
 * @return {String} hashed value
 */
function sha256(data) {
  const hash = crypto.createHash('sha256');
  hash.update(data);
  return hash.digest('base64').toString();
}

/**
 * Guess the type of data.
 *
 * NOTE expect the type to be *capitalised* as in: "Array", "Object", "Number" etc.
 * NOTE `null` will return "null" and undefined will return "undefined".
 *
 * @param {*} data
 * @return {String|Array|Object} type info
 */
function guessType(data) {

  if (data === undefined) return 'undefined';
  if (data === null) return 'null';
  if (Array.isArray(data)) return data.map(guessType);

  if (data instanceof Map) {
    const typeObj = {};
    for (const key in data) {
      typeObj[key] = guessType(data.get(key));
    }
    return typeObj;
  }

  if (data.constructor.name !== 'Object') {
    return data.constructor.name;
  }

  if (data.constructor !== undefined && data.constructor.name === 'String') {
    return 'String';
  }

  if (data.constructor !== undefined && data.constructor.name === 'Number') {
    return 'Number';
  }

  if (data instanceof Set) return 'Set';
  if (data instanceof URL) return 'URL';
  if (data instanceof Promise) return 'Promise';
  if (data instanceof Error) return 'Error';
  if (data instanceof Buffer) return 'Buffer';
  if (data instanceof Int8Array) return 'Int8Array';
  if (data instanceof Int16Array) return 'Int16Array';
  if (data instanceof Int32Array) return 'Int32Array';
  if (data instanceof Float32Array) return 'Float32Array';
  if (data instanceof Float64Array) return 'Float64Array';
  if (data instanceof URL) return 'URL';
  if (data instanceof Date) return 'Date';

  // fallback to Object
  const typeObj = {};

  for (const key in data) {
    typeObj[key] = guessType(data[key]);
  }

  return typeObj;
}

/**
 * Suggest routes when an API user types something like `/`, `/module` or `/content`.
 *
 * @param {express.Router} router
 * @param {String|RegExp|Array<String>|Array<RegExp>} path
 * @param {String|Object|Number|Array} routes
 * @return {void}
 */
function suggestRoutes(router, path, routes) {
  return router.all(path, (req, res) => res.json(
    {status: 'CONFUSED', msg: 'nothing here, see the routes', routes}));
}

/**
 * Check if data is of specified type.
 *
 * @param {*} data
 * @param {String|Object|Array} type
 * @return {Boolean} whether type matches data
 */
function isOfType(data, type) {
  if (type === '*') return true;

  if (data === null) {
    return type.constructor !== undefined && type.constructor.name ===
      'String' && (type.endsWith('?') || type === 'null');
  }

  if (data === undefined) {
    return type.constructor !== undefined && type.constructor.name ===
      'String' && (type.endsWith('?') || type === 'undefined');
  }

  if (type.constructor !== undefined && type.constructor.name === 'String') {
    const guess = guessType(data);
    return guess.constructor !== undefined && guess.constructor.name ===
      'String' && (guess === type ||
        (type.endsWith('?') && type.slice(0, type.length - 1) === guess));
  }

  if (!(type instanceof Object)) return false;

  for (const key in type) {
    if (!(key in data && isOfType(data[key], type[key]))) {
      return false;
    }
  }

  return true;
}

/**
 * Retrieves credentials by trying the request body, params and then the cookies.
 * The function may return undefined but if it doesn't you are guaranteed to have
 * an email and password.
 *
 * FIXME getCredentials
 *
 * @param {express.Request} req http request (see Express docs)
 * @return {Promise<{password: String, email: String}>} credentials with SHA256 hashed password
 */
function getCredentials(req) {
  let email;
  let password;
  if ('email' in req.params) {
    email = req.params.email;
  } else if ('email' in req.session) {
    email = req.session.email;
  } else if ('email' in req.body) {
    email = req.body.email;
  } else {
    return Promise.reject(new NoCredentialsErr());
  }

  if ('password' in req.body) {
    password = sha256(req.body.password);
  } else if ('password' in req.session) {
    password = req.session;
  } else {
    return Promise.reject(new NoCredentialsErr());
  }

  return Promise.resolve({email, password});
}


class RestAPIErr extends Error {
  /**
   * @param {String} msg
   * @param {Number} [code]
   * @param params
   */
  constructor(msg, code, ...params) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(msg, ...params);
    this._code = code || 400;
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) Error.captureStackTrace(this, RestAPIErr);
  }

  /**
   * @return {Number}
   */
  get code() {
    return this._code;
  }

  /**
   * @return {{status: String, msg: String}}
   */
  get msgJSON() {
    return errMsg(this.message);
  }
}

class BadMethodErr extends RestAPIErr {
  /**
   * @param {String} action
   * @param {String} suggestedMethod
   */
  constructor(action, suggestedMethod) {
    super(`to ${action} use ${suggestedMethod.toUpperCase()}`, 405);
  }
}

class NoSuchRecord extends RestAPIErr {
  /**
   *
   * @param {String} tableName
   * @param {Object|Array<String>} attrs
   */
  constructor(tableName, attrs = {}) {
    let msg = `failed to find a matching ${tableName.toLowerCase()}`;
    if (Object.keys(attrs).length > 0) {
      msg += ' with fields: ';
      msg += Array.isArray(attrs) ?
        attrs.join(', ') :
        Object.entries(attrs).map(pair => `${pair[0]} = ${pair[1]}`).join(', ');
    }
    super(msg, 404);
  }
}

class TypoErr extends RestAPIErr {
  constructor(suggestion) {
    super(`did you mean '${suggestion}'?`, 400);
  }
}

class AlreadyExistsErr extends RestAPIErr {
  /**
   * @param {String} table
   * @param {...String} [attrs] name of overlapping attribute
   */
  constructor(table, ...attrs) {
    super(
      `cannot create a new ${table.toLowerCase()} because ${attrs.length > 0 ?
        attrs.join(', ') :
        'it'} overlap${attrs.length !== 0 ?
        's' :
        ''} with an existing ${table.toLowerCase()}`, 409);
  }
}

class UserExistsErr extends AlreadyExistsErr {
  constructor(...attrs) {
    super('User', 'email', ...attrs);
  }
}

class InvalidRequestErr extends RestAPIErr {
  /**
   * @param {String} table
   * @param {String} attr
   */
  constructor(table, attr) {
    super(`invalid request for ${table.toLowerCase()}'s ${attr}`, 400);
  }
}

class MissingDataErr extends RestAPIErr {
  /**
   * @param {String} missing
   * @param {String} where
   * @param {...String} params
   */
  constructor(missing, where, ...params) {
    super(`${missing} from ${where}`, 400, ...params);
  }
}

class NoPermissionErr extends RestAPIErr {
  /**
   * @param {String} toDo
   * @param {String} [likelyCause]
   * @param  params
   */
  constructor(toDo, likelyCause, ...params) {
    super(likelyCause !== undefined
      ?
      `no permission to ${toDo} (the likely cause is ${likelyCause})`
      :
      `no permission to ${toDo}`, 403, ...params);
  }
}

class NoCredentialsErr extends MissingDataErr {
  /**
   * @param {...String} params
   */
  constructor(...params) {
    super('credentials', 'cookies, GET params or request body', ...params);
  }
}

class AlreadyLoggedIn extends RestAPIErr {
  /**
   * @param {String} email
   * @param params
   */
  constructor(email, ...params) {
    super(`the user ${email} is alredy logged in`, 409, ...params);
  }
}

/**
 * DO NOT use this if authentication fails. For that purpose use AuthFailedErr.
 * This is when looking users up for instance by using their emails.
 */
class NoSuchUser extends NoSuchRecord {
  /**
   * @param {String} email
   * @param {...String} attrs
   */
  constructor(email, ...attrs) {
    super('User', ...attrs);
  }
}

class NotLoggedIn extends RestAPIErr {
  /**
   * @param {String} email
   * @param params
   */
  constructor(email, ...params) {
    super(`the user ${email} is not logged in`, 400, ...params);
  }
}

class AuthFailedErr extends NoSuchRecord {
  /**
   * @param {String} email
   */
  constructor(email) {
    super('User', {email, password: '<hidden>'});
  }
}

class NotImplYetErr extends RestAPIErr {
  /**
   * @param {String} feature
   */
  constructor(feature) {
    super(`${feature} is not implemented yet`, 501);
  }
}

module.exports = {
  AlreadyLoggedIn,
  AuthFailedErr,
  BadMethodErr,
  InvalidRequestErr,
  MissingDataErr,
  NoCredentialsErr,
  NoPermissionErr,
  NoSuchRecord,
  NoSuchUser,
  NotImplYetErr,
  NotLoggedIn,
  TypoErr,
  UserExistsErr,
  errMsg,
  getCredentials,
  guessType,
  isOfType,
  log,
  msg,
  pprint,
  sha256,
  suggestRoutes,
};
