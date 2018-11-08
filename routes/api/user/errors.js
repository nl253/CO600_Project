const {AlreadyExistsErr, NoSuchRecord, RestAPIErr} = require('../errors');

class UserExistsErr extends AlreadyExistsErr {
  constructor(...attrs) {
    super('User', 'email', ...attrs);
  }
}

class AlreadyLoggedIn extends RestAPIErr {
  /**
   * @param {String} [email]
   * @param params
   */
  constructor(email, ...params) {
    super(`the user ${email ? email + ' ' : ''}is already logged in`, 409,
      ...params);
  }
}

/**
 * DO NOT use this if authentication fails. For that purpose use AuthFailedErr.
 * This is when looking users up for httpClient by using their emails.
 */
class NoSuchUser extends NoSuchRecord {
  /**
   * @param {String} [email]
   * @param {Array<String>|Object<String, String>} [attrs]
   */
  constructor(email, attrs = {}) {
    if (email === undefined) {
      if (Array.isArray(attrs)) {
        super('User', ['email'] + attrs);
      } else {
        super('User', Object.assign({email}, attrs));
      }
    } else {
      super('User', attrs);
    }
  }
}

module.exports = {
  AlreadyLoggedIn,
  NoSuchUser,
  UserExistsErr,
};
