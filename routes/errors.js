const {pprint} = require('../lib');

class RestAPIErr extends Error {
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
    if (Error.captureStackTrace) Error.captureStackTrace(this, RestAPIErr);
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
   * @param {Object<String, *>|Array<String>} [attrs]
   */
  constructor(tableName, attrs = {}) {
    let msg = `failed to find a matching ${tableName.toLowerCase()}`;
    if (Object.keys(attrs).length > 0) {
      msg += ' with given: ';
      msg += (
        Array.isArray(attrs)
          ? attrs
          : Object.entries(attrs)
            .map(pair => `${pair[0]} = ${pprint(pair[1])}`)
      ).join(', ');
    }
    super(msg, 404);
  }
}

class TypoErr extends RestAPIErr {
  constructor(suggestion) {
    super(`did you mean '${suggestion}'?`, 400);
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
    super(`missing ${missing} in ${where}`, 400, ...params);
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
  BadMethodErr,
  InvalidRequestErr,
  MissingDataErr,
  NoSuchRecord,
  RestAPIErr,
  NotImplYetErr,
  TypoErr,
};
