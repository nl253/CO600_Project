const {pprint} = require('./lib');

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
   * @return {Number}
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
      msg += ' with fields: ';
      msg += Array.isArray(attrs) ?
        attrs.join(', ') :
        Object.entries(attrs)
          .map(pair => `${pair[0]} = ${pprint(pair[1])}`)
          .join(', ');
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

class NoPermissionErr extends RestAPIErr {
  /**
   * @param {String} toDo
   * @param {String} [likelyCause]
   * @param {...*} params
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
    super('credentials', 'request body', ...params);
  }
}

class NotLoggedIn extends RestAPIErr {
  /**
   * @param {String} [email]
   * @param params
   */
  constructor(email = undefined, ...params) {
    super(email !== undefined && email !== null ?
      `the user ${email} is not logged in` :
      `the user is not logged in`, 400, ...params);
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

class AuthFailedErr extends NoSuchRecord {
  /**
   * @param {String} [email]
   */
  constructor(email = undefined) {
    if (email === undefined || email === null) {
      super('User');
    } else {
      super('User', {email, password: '<hidden>'});
    }
  }
}

module.exports = {
  BadMethodErr,
  InvalidRequestErr,
  MissingDataErr,
  NoCredentialsErr,
  NoPermissionErr,
  NoSuchRecord,
  RestAPIErr,
  NotImplYetErr,
  AlreadyExistsErr,
  AuthFailedErr,
  NotLoggedIn,
  TypoErr,
};
