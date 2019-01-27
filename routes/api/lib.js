// Project
const {createLogger} = require('../../lib');
const log = createLogger({
  label: 'API',
  lvl: process.env.LOGGING_API,
});

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
 * @param {ValidationError|APIErr|Error|String} [err]
 * @return {{status: String, msg: String}}
 */
function errMsg(err) {
  const status = 'ERROR';
  if (err === undefined || err === null) {
    return {status, msg: 'failure'};
  }

  if (err.constructor !== undefined && err.constructor.name === 'APIErr') {
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

module.exports = {
  errMsg,
  log,
  msg,
};
