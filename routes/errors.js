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

class BadMethodErr extends APIErr {
  /**
   * @param {String} action
   * @param {String} suggestedMethod
   */
  constructor(action, suggestedMethod) {
    super(`to ${action} use ${suggestedMethod.toUpperCase()}`, 405);
  }
}

class RecordExistsErr extends APIErr {
  /**
   *
   * @param {String} tableName
   * @param {Object<String, *>|Array<String>} [attrs]
   */
  constructor(tableName, attrs = {}) {
    let msg = `found existing ${tableName.toLowerCase()}`;
    if (Object.keys(attrs).length > 0) {
      msg += ' with given ';
      msg += (
        Array.isArray(attrs)
          ? attrs
          : Object.keys(attrs)
      ).join(', ');
    }
    super(msg, 409);
  }
}

class NoSuchRecord extends APIErr {
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

class TypoErr extends APIErr {
  constructor(suggestion) {
    super(`did you mean '${suggestion}'?`, 400);
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

class NotLoggedIn extends APIErr {
  constructor() {
    super('not logged in', 403);
  }
}

module.exports = {
  BadMethodErr,
  InvalidRequestErr,
  MissingDataErr,
  NotLoggedIn,
  NoSuchRecord,
  APIErr,
  NotImplYetErr,
  RecordExistsErr,
  TypoErr,
};
