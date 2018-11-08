// 3rd Party
const {ValidationError} = require('sequelize/lib/errors');

// Project
const {log, sha256, pprint, createLogger} = require('../lib');
const models = require('./database');
const {NoCredentialsErr, RestAPIErr} = require('./errors');

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
 * Retrieves credentials by trying the request body, params and then the cookies.
 * The function may return undefined but if it doesn't you are guaranteed to have
 * an email and password.
 *
 * @param {express.Request} req http request (see Express docs)
 * @return {Promise<{password: String, email: String}>} credentials with SHA256 hashed password
 */
function getCredentials(req) {
  let email;
  let password;
  /** @namespace req.cookies */
  /** @namespace req.params */
  if (req.params.email !== undefined) {
    log.debug('found email in request params');
    email = req.params.email;
  } else if (req.cookies.email !== undefined && req.cookies.email !== null) {
    log.debug('found email in a cookie');
    email = req.cookies.email;
  } else if (req.body.email !== undefined) {
    log.debug('found email in request body');
    email = req.body.email;
  } else {
    log.debug('failed to find credentials (email not found)');
    return Promise.reject(new NoCredentialsErr());
  }

  /** @namespace req.body */
  if (req.body.password !== undefined) {
    log.debug('found password in request body');
    password = sha256(req.body.password);
  } else if (req.cookies.password !== undefined && req.cookies.password !==
    null) {
    log.debug('found password in a cookie');
    /** @namespace req.cookies */
    password = req.cookies.password;
  } else {
    log.debug('failed to find credentials (password not found)');
    return Promise.reject(new NoCredentialsErr());
  }

  log.debug(`found credentials: ${pprint({email, password})}`);
  return Promise.resolve({email, password});
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


module.exports = {
  errMsg,
  getCredentials,
  log,
  sha256,
  pprint,
  msg,
  models,
  createLogger,
  suggestRoutes,
};
