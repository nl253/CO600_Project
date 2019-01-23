class APIErr extends Error {
  /**
   * @param {String} msg
   * @param {Number} [code]
   * @param {...*} params
   */
  constructor(msg, code, ...params) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(msg, ...params);
    this._code = code || 400;
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) Error.captureStackTrace(this, APIErr);
  }

  /**
   * @return {Number} HTTP status code
   */
  get code() {
    return this._code;
  }

  /**
   * @return {{status: String, msg: String}}
   */
  get msgJSON() {
    return {status: 'ERROR', msg: this.message};
  }
}

class NoSuchRecordErr extends APIErr {
  /**
   *
   * @param {String} tableName
   * @param {Object<String, *>|Array<String>} [attrs]
   */
  constructor(tableName, attrs = {}) {
    let msg = `failed to find a matching ${tableName.toLowerCase()}`;
    if (Object.keys(attrs).length > 0) {
      msg += ' with given ';
      msg += (
        Array.isArray(attrs)
          ? attrs
          : Object.keys(attrs)
      ).join(', ');
    }
    super(msg, 404);
  }
}

class InvalidRequestErr extends APIErr {
  /**
   * @param {String} table
   * @param {String} attr
   */
  constructor(table, attr) {
    super(`invalid request for ${table.toLowerCase()}'s ${attr}`, 400);
  }
}

class RecordExists extends  APIErr {
  /**
   * @param {String} table
   */
  constructor(table) {
    super(`${table} already exists`, 400);
  }
}

class MissingDataErr extends APIErr {
  /**
   * @param {String} missing
   * @param {String} where
   * @param {...String} params
   */
  constructor(missing, where, ...params) {
    super(`missing ${missing} in ${where}`, 400, ...params);
  }
}

class NotImplYetErr extends APIErr {
  /**
   * @param {String} feature
   */
  constructor(feature) {
    super(`${feature} is not implemented yet`, 501);
  }
}

class NotLoggedInErr extends APIErr {
  constructor() {
    super('not logged in', 403);
  }
}

class DeniedErr extends APIErr {
  /**
   * @param {String} action
   */
  constructor(action) {
    super(`insufficient privileges to ${action}`, 403);
  }
}

class ValidationErr extends APIErr {
  /**
   * @param {String} what
   * @param {String} [info]
   */
  constructor(what, info) {
    if (info) super(`Validation failed on ${what}. ${info.slice(0, 1).toUpperCase()}${info.slice(1)}.`, 400);
    else super(`Validation failed on ${what}`, 400);
  }
}

module.exports = {
  DeniedErr,
  ValidationErr,
  InvalidRequestErr,
  MissingDataErr,
  NotLoggedInErr,
  NoSuchRecordErr,
  APIErr,
  RecordExists,
  NotImplYetErr,
};
