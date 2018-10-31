/**
 * This module contains utility functions to be used by everything in the
 * `PROJECT_ROOT/routes` directory.
 *
 * @author Norbert
 */
const crypto = require('crypto');
const ValidationError = require('sequelize/lib/errors').ValidationError;
const db = require('../database/db.js')();

/**
 * Pretty print data.
 *
 * @param {*} data
 * @return {string}
 */
function pprint(data) {
  let s;
  if (data instanceof Array) {
    s = '[' + data.join(', ') + ']';
  } else if ((data instanceof Date) || (data instanceof RegExp)) {
    s = data.toString();
  } else if (data instanceof Map) {
    s = 'Map {' + Array.from(data.entries())
      .map(pair => `${pair[0]}: ${pair[1]}`)
      .join(', ') + '}';
  } else if (data instanceof Set) {
    s = 'Set { ' + Array.from(data.values()).join(', ') + '}';
  } else if (data === null) {
    s = 'null';
  } else if (data === undefined) {
    s = 'undefined';
  } else if (data instanceof Object) {
    s = '{' + Array.from(Object.entries(data))
      .map(pair => `${pair[0]}: ${pair[1]}`)
      .join(', ') + '}';
  } else {
    s = data.toString();
  }
  return s;
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


/**
 * Guess the type of data.
 *
 * NOTE: expect the type to be *capitalised* as in: "Array", "Object", "Number" etc.
 * NOTE: `null` will return "null" and undefined will return "undefined".
 *
 * @param {*} data
 * @return {string|Array|Object} type info
 */
function guessType(data) {
  if (data === undefined) {
    return 'undefined';
  } else if (data === null) {
    return 'null';
  } else if (Array.isArray(data)) {
    return data.map(guessType);
  } else if (data instanceof Map) {
    const typeObj = {};
    for (const key in data) {
      typeObj[key] = guessType(data.get(key));
    }
    return typeObj;
  } else if (data.constructor.name.toLowerCase() !== 'object') {
    return data.constructor.name;
  } else if (data.constructor !== undefined && data.constructor.name ===
    'String') {
    return 'String';
  } else if (data.constructor !== undefined && data.constructor.name ===
    'Number') {
    return 'Number';
  } else if (data instanceof Set) {
    return 'Set';
  } else if (data instanceof URL) {
    return 'URL';
  } else if (data instanceof Promise) {
    return 'Promise';
  } else if (data instanceof Error) {
    return 'Error';
  } else if (data instanceof Buffer) {
    return 'Buffer';
  } else if (data instanceof Int8Array) {
    return 'Int8Array';
  } else if (data instanceof Int16Array) {
    return 'Int16Array';
  } else if (data instanceof Int32Array) {
    return 'Int32Array';
  } else if (data instanceof Float32Array) {
    return 'Float32Array';
  } else if (data instanceof Float64Array) {
    return 'Float64Array';
  } else if (data instanceof URL) {
    return 'URL';
  } else if (data instanceof Date) {
    return 'Date';
  } else { // fallback to Object
    const typeObj = {};
    for (const key in data) {
      typeObj[key] = guessType(data[key]);
    }
    return typeObj;
  }
}

/**
 * Check if data is of specified type.
 *
 * @param {*} data
 * @param {string|object|array} type
 * @return {boolean} whether type matches data
 */
function isOfType(data, type) {
  if (type === '*') {
    return true;
  } else if (data === null) {
    return type.constructor !== undefined && type.constructor.name ===
      'String' && (type.endsWith('?') || type === 'null');
  } else if (data === undefined) {
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
 * Check if the user is logged in by looking at the content of session and
 * checking if the credentials stored in them match an existing record.
 *
 * @param req http request (see Express docs)
 * @return {boolean}
 */
async function isLoggedIn(req) {
  if (req.session === null) {
    return false;
  } else if ('user' in req.session) {
    if (isOfType(req.session.user,
      {email: 'String', password: 'String'})) {
      return await userExists(req.session.user.email,
        req.session.user.password);
    } else {
      return false;
    }
  } else {
    return false;
  }
}

/**
 * Check if the user exists by querying the database.
 *
 * @param {string} email
 * @param {string} [password] unhashed password
 * @return {Promise<boolean>}
 */
async function userExists(email, password) {
  let sql, replacements;
  if (password !== undefined && password !== null) {
    sql = 'SELECT * FROM User WHERE email = :email AND password = :password';
    replacements = {email, password};
  } else {
    sql = 'SELECT * FROM User WHERE email = :email';
    replacements = {email};
  }
  return await db.query(sql, {replacements})
    .then((rows) => {
      return rows[0].length > 0;
    })
    .catch((err) => {
      return false;
    });
}

/**
 * Retrieves credentials by trying the POST & GET params and then the cookies.
 *
 * @param req http request (see Express docs)
 * @return {{password: String, email: String}} [credentials]
 */
function getCredentials(req) {
  if (isOfType(req.params, {email: 'String'}) &&
    isOfType(req.body, {password: 'String'})) {
    return {password: sha256(req.body.password), email: req.params.email};
  }

  if (isOfType(req.body, {email: 'String'}) &&
    isOfType(req.body, {password: 'String'})) {
    return {password: sha256(req.body.password), email: req.body.email};
  }

  if (isOfType(req.session, {
    user: {email: 'String', password: 'String'},
  })) {
    return {password: req.session.user.password, email: req.session.user.email};
  }
}

/**
 * Insert a new content record into the database, return a promise of id of the record.
 *
 * @param {string} creator i.e. an email
 * @return {Promise<number>} [lastId]
 */
function insertContent(creator) {
  const sql = `INSERT INTO Content (creator)
               VALUES (:creator)`;
  return db.query(sql, {replacements: {creator}}).catch(err => {
    return undefined;
    // return errMsg(
    //   `failed to insert new content for content creator ${creator}, ${err} has occured`);
  }).then(rows => {
    const [_, stmt] = rows;
    console.log(rows);
    return stmt.lastID;
  });
}

/**
 * Insert a new module record into the database, return true if it succeeded, false otherwise.
 *
 * @param {string} module
 * @param {number} contentId
 * @return {Promise<boolean>} if it succeeded
 */
function insertModule(module, contentId) {
  const sql = `INSERT INTO Module (name, content_id)
               VALUES (:module, :contentId)`;
  return db.query(sql, {replacements: {module, contentId}}).catch(err => {
    console.debug(err);
    return false;
  }).then(rows => {
    console.log(rows);
    return true;
  });
}

/**
 * Check if the module exists by querying the database.
 *
 * @param {string} module
 * @return {Promise<boolean>}
 */
function moduleExists(module) {
  let sql = 'SELECT * FROM Module WHERE name = :module';
  let replacements = {module};
  return db.query(sql, {replacements})
    .then((rows) => rows[0].length > 0)
    .catch((err) => false);
}

module.exports = {
  msg,
  insertModule,
  insertContent,
  moduleExists,
  guessType,
  errMsg,
  sha256,
  isLoggedIn,
  getCredentials,
  isOfType,
  pprint,
  userExists,
};
