/**
 * This module implements the User model and operations on users such as
 * updating fields, deleting users, creating new users in the database.
 *
 * I tried to make it as user-friendly as possible so if you occasionally use GET
 * instead of POST or forget to add a value to the request body the API will
 * suggest what you might want to do.
 *
 * @author Norbert
 */
const router = require('express').Router();
const {
  AlreadyLoggedIn,
  AuthFailedErr,
  BadMethodErr,
  MissingDataErr,
  NoPermissionErr,
  NoSuchUser,
  NotLoggedIn,
  UserExistsErr,
  errMsg,
  getCredentials,
  isOfType,
  log,
  msg,
  sha256,
  suggestRoutes,
} = require('./lib');

const {User} = require('../database/db.js');

/**
 * Logs a user in.
 *
 * Requires credentials to be passed in the request params and body.
 */
router.post('/:email/login', (req, res) => {
  if (!(req.session.user === undefined || req.session.user === null)) {
    const err = new AlreadyLoggedIn(req.params.email);
    return res.status(err.code || 400).json(errMsg(err));
  }
  const {email} = req.params;

  return getCredentials(req)
    .then(cs => User.findOne({where: cs}))
    .then(result => result === null ?
      Promise.reject(new AuthFailedErr(email)) :
      result)
    .then(result => result.dataValues)
    .then(user => {
      req.session.user = user;
      return res.json(
        msg(`successfully authenticated user with email ${email}`));
    })
    .catch(err => res.status(err.code || 400).json(errMsg(err)));
});

/**
 * Clears the session cookies for the user that is currently logged in.
 *
 * Requires someone to be logged in.
 */
router.post('/:email/logout', async (req, res) => {
  if (req.session.user === null || req.session.user === undefined) {
    const err = new NotLoggedIn(req.params.email);
    return res.status(err.code).json(errMsg(err));
  }
  delete req.session.user;
  return res.json(msg(`user ${req.params.email} logged out`));
});

/**
 * Inserts a new user into the database.
 *
 * Requires credentials to be passed in the request params and body.
 */
router.post('/:email/register', (req, res) =>
  getCredentials(req)
    .then(credentials => User.findOne({where: credentials}))
    .then(result => result !== null ?
      Promise.reject(new UserExistsErr()) :
      getCredentials(req))
    .then(credentials => credentials.email)
    .then(email => {
      const queryParams = {email};
      const columns = new Set(Object.keys(User.attributes));
      // don't look for email in body: it's supplied in the params
      columns.delete('email');
      for (const param in req.body) {
        if (columns.has(param)) {
          queryParams[param] = param === 'password' ?
            sha256(req.body[param]) :
            req.body[param];
        }
      }
      return queryParams;
    })
    .then(queryParams => User.create(queryParams))
    .then(() => res.json(msg(`created user ${req.params.email}`)))
    .catch(err => res.status(err.code || 400).json(errMsg(err))));

/**
 * TODO unregister User
 *
 * Removes a user from the database.
 *
 * Requires authentication OR credentials passed in the request params and body.
 */
router.post('/:email/unregister', (req, res) =>
  getCredentials(req)
    .then(cs => User.findOne({where: cs}))
    .then(user => user === null ? Promise.reject(new UserExistsErr()) : user)
    .then(user => user.destroy())
    .then(() => res.json(msg(`successfully unregistered the user`)))
    .catch(err => res.status(err.code || 400).json(errMsg(err))));

/**
 * If an API user tries to perform these actions, show suggestion that they should use POST not GET.
 */
for (const action of ['register', 'unregister', 'login', 'logout']) {
  router.get(`/:email/${action}`,
    (req, res) => {
      const err = new BadMethodErr(action, 'POST');
      return res.status(err.code || 400).json(errMsg(err));
    });
}

/**
 * Queries the database for a user's attribute (i.e. a property such as: email, id etc.).
 *
 * Doesn't require authentication.
 */
router.get('/:email/:property', (req, res) => {
  let {property, email} = req.params;
  if (property === 'password') {
    let err = new NoPermissionErr('lookup password');
    return res.status(err.code || 400).json(errMsg(err));
  }
  return User
    .findOne({where: {email}})
    .then(result => result === null ?
      Promise.reject(new NoSuchUser(email)) :
      result)
    .then(result => result.dataValues)
    .then(user => res.json(msg(`found ${email}'s ${property}`, user[property])))
    .catch(err => res.status(err.code || 400).json(errMsg(err)));
});

/**
 * Modifies a user's property (e.g. email, firstName etc.).
 *
 * Requires the user to be logged in or that the password is in request body.
 */
router.post('/:email/:property', (req, res) => {

  const {property, email} = req.params;

  if (property === 'isAdmin') {
    let err = new NoPermissionErr('set property isAdmin in the User table');
    return res.status(err.code || 400).json(errMsg(err));
  }

  if (!(property in User.attributes)) {
    let err = new NoPermissionErr('set property isAdmin in the User table');
    return res.status(err.code || 400).json(errMsg(err));
  }

  return getCredentials(req)
    .then(cs =>
      !isOfType(req.body, {value: 'String?'}) ?
        new MissingDataErr('replacement value', 'request body') :
        User.findOne({where: cs}))
    .then(user => user === null ? Promise.reject(new NoSuchUser(email)) : user)
    .then(user => {
      console.debug(user);
      const queryParams = {};
      queryParams[property] = property === 'password' ?
        sha256(req.body.value) :
        req.body.value;
      return user.update(queryParams);
    })
    .then(() => res.json(msg(`updated ${property} in user ${email}`)))
    .catch(err => res.status(err.code || 400)
      .json(errMsg(err)));
});

/**
 * If an API user tries to query the database for user's info with POST suggest using GET.
 */
router.post('/:email', (req, res) => {
  const err = new BadMethodErr(`retrieve info about user ${req.params.email}`,
    'GET');
  return res.status(err.code || 400).json(err.msgJSON || err.message);
});

router.get('/:email', (req, res) =>
  User
    .findByPk(req.params.email)
    .then(result => result === null ?
      Promise.reject(new NoSuchUser(req.params.email)) : result)
    .then(result => result.dataValues)
    .then(user => JSON.parse(JSON.stringify(user)))
    .then(userInfo => {
      // don't send hashed password (sensitive data)
      delete userInfo.password;
      return userInfo;
    })
    .then(user => res.json(msg(`found user ${req.params.email}`, user)))
    .catch(err => res.status(err.code || 400)
      .json(errMsg(err))));

/**
 * If none of the above match, shows help.
 */
suggestRoutes(router, /.*/, {
  GET: {
    ':email': 'to lookup a single user (the user must exist)',
    ':email/:property': 'to lookup a property of a single user (the user must exist)',
  },
  POST: {
    ':email/register': 'to register a single user (the user must not have an account)',
    ':email/unregister': 'to unregister a single user (the user must be registered)',
    ':email/logout': 'to log out (the user must be logged in)',
    ':email/login': 'to authenticate (`password` needs to be set in cookies or request body)',
    ':email/:property': 'to set property to value in a single user (`value` needs to be set in request body)',
  },
});

module.exports = router;
