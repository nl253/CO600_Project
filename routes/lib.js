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
 * Validate JSON according to schema.
 *
 * E.g.:
 *
 * const schema = {
 *   email: 'String',
 *   password: 'String',
 * }
 *
 * const json = {
 *   email: 'if50@kent.ac.uk',
 *   password: 'pass123',
 * }
 *
 * @param {*} json JSON-compatible value (int, float, str, array, obj, null, bool)
 * @param {*} schema
 * @return {boolean} if json matches schema
 */
function validateJSON(json, schema) {
  // NOTE: do NOT use Array.reduce here because it's buggy
  // it causes stack overflow presumably of objects with circular references
  if (schema === '*') {
    return true;
  } else if ((json === null || json === undefined) &&
    isOfType(schema, 'String') && schema.endsWith('?')) {
    return true;
  }

  let typeName = getType(json);
  if (typeName.endsWith('?')) {
    typeName = typeName.slice(0, typeName.length - 1);
  }

  // if json is an array then the size of the schema and the array must match
  // all items in corresponding indicies must be valid
  if (typeName === 'Array') {
    if (!getType(schema) === 'Array') {
      return false;
    }
    for (let i = 0; i < schema.length; i++) {
      if (!validateJSON(json[i], schema[i])) {
        return false;
      }
    }
    return true;
  } else if (typeName === 'Object') {

    // all schema keys in json and all json values valid
    for (const key in schema) {
      if (!(key in json) || !validateJSON(json[key], schema[key])) {
        return false;
      }
    }
    return true;
  }

  // handles Number, Boolean, String
  return typeName === schema;
}

/**
 * Get the type of data.
 *
 * NOTE: expect the type to be *capitalised* as in: "Array", "Object", "Number" etc.
 * NOTE: `null` will return "null" and undefined will return "undefined".
 *
 * @param {*} data
 * @return {string}
 */
function getType(data) {
  if (data === undefined) {
    return 'undefined';
  } else if (data === null) {
    return 'null';
  } else if (Array.isArray(data)) {
    return 'Array';
  } else if (data instanceof Number) {
    return 'Number';
  } else if (data instanceof String) {
    return 'String';
  } else if (data.constructor) {
    return data.constructor.name;
  } else {
    return 'Object';
  }
}

/**
 * Check if data is of specified type.
 *
 * @param {*} data
 * @param {string} type
 * @return {boolean}
 */
function isOfType(data, type) {
  return getType(data) === type;
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
    if (validateJSON(req.session.user,
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
  if (validateJSON(req.params, {email: 'String'}) &&
    validateJSON(req.body, {password: 'String'})) {
    return {password: sha256(req.body.password), email: req.params.email};
  }

  if (validateJSON(req.body, {email: 'String'}) &&
    validateJSON(req.body, {password: 'String'})) {
    return {password: sha256(req.body.password), email: req.body.email};
  }

  if (validateJSON(req.session, {
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
  getType,
  insertModule,
  insertContent,
  moduleExists,
  isOfType,
  errMsg,
  sha256,
  validateJSON,
  isLoggedIn,
  getCredentials,
  userExists,
};
