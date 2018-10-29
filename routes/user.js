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
const db = require('../database/db.js')();
const {
  msg,
  errMsg,
  sha256,
  validateJSON,
  getCredentials,
  isLoggedIn,
  userExists,
} = require('./lib.js');


/**
 * Logs a user in.
 *
 * Requires credentials to be passed in the request params and body.
 */
router.post('/:email/login', async (req, res) => {
  if (await isLoggedIn(req)) {
    const email = req.params.email;
    res.json(
      errMsg(`user with email ${email} is already logged in`));
    return;
  }
  const maybeCredentials = getCredentials(req);
  if (maybeCredentials === undefined || maybeCredentials === null) {
    res.json(
      errMsg(
        'failed to authenticate, you need to provide password in cookies or request body'));
  }
  const {email, password} = maybeCredentials;

  if (await userExists(email, password)) {
    req.session.user = {email, password};
    res.json(
      msg(
        `successfully authenticated user with email ${email}`));

  } else {
    res.json(
      errMsg(
        `failed to authenticate, no matching user with email ${email} and this password`));
  }
});

/**
 * Clears the session cookies for the user that is currently logged in.
 */
router.post('/:email/logout', async (req, res) => {
  if (!await isLoggedIn(req)) {
    res.json(
      errMsg(`not logged in`));
    return;
  }
  delete req.session.user;
  res.json(
    msg(`user ${req.params.email} logged out`));
});

/**
 * Inserts a new user into the database.
 *
 * Requires credentials to be passed in the request params and body.
 */
router.post('/:email/register', async (req, res) => {
  if (!validateJSON(req.body, {password: 'String'})) {
    res.json(errMsg('password not present in POST params'));
    return;
  }
  const email = req.params.email;
  const password = sha256(req.body.password);
  if (await userExists(email, password)) {
    res.json(
      errMsg(`user with email ${email} and this password already exists`));
    return;
  }
  const sql = 'INSERT INTO User (email, password) VALUES (:email, :password)';
  const replacements = {email, password};
  db.query(sql, {replacements}).then((rows) => {
    res.json(msg(`registered user ${email}`));
  }).catch((err) => {
    res.json(errMsg(`failed to register user ${email}`, err));
  });
});

/**
 * Removes a user from the database.
 *
 * Requires authentication OR credentials passed in the request params and body.
 */
router.post('/:email/unregister', async (req, res) => {
  let maybeCredentials = getCredentials(req);
  if (maybeCredentials === undefined || maybeCredentials === null) {
    res.json({
      msg: 'not logged in and password not present in POST params',
      status: 'ERROR',
    });
    return;
  }
  const {email, password} = maybeCredentials;

  if (!await userExists(email, password)) {
    res.json(
      errMsg(
        `failed to unregister because user with email ${email} and this password does not exist`));
    return;
  }

  const sql = 'DELETE FROM User WHERE email = :email AND password = :password';
  const replacements = {email, password};
  db.query(sql, {replacements}).then((rows) => {
    res.json({
      status: 'OK',
      msg: `unregistered user ${email}`,
    });
  }).catch((err) => {
    res.json(errMsg(
      `failed to unregistered user ${email}, the user probably does not exist`));
  });
});

/**
 * If an API user tries to perform these actions, show suggestion that they should use POST not GET.
 */
for (const action of ['register', 'unregister', 'login', 'logout']) {
  router.get(`/:email/${action}`, (req, res) => {
    res.json({
      msg: `use POST to ${action}`,
      status: 'ERROR',
    });
  });
}

/**
 * Query the database for a user's attribute (i.e. a property such as: email, id etc.).
 *
 * Doesn't require authentication.
 */
router.get('/:email/:property', async (req, res) => {
  const {email, property} = req.params;
  if (!await userExists(email)) {
    res.json(errMsg(`user with email ${email} does not exist`));
    return;
  }
  if (property === 'password') {
    res.json(errMsg('cannot lookup password'));
    return;
  }
  const sql = 'SELECT * FROM User WHERE email = :email';
  const replacements = {email, property};
  db.query(sql, {replacements}).catch((err) => {
    res.json(errMsg(`failed to find ${property} of ${email}`, err));
  }).then((rows) => {
    if (property in rows[0][0]) {
      res.json(
        msg(`found property ${property} of ${email}`, rows[0][0][property]));
    } else {
      res.json(errMsg(`user does not have property ${property}`));
    }
  });
});

/**
 * Modifies a user's property (e.g. email, first_name etc.).
 *
 * Requires the user to be logged in or that the password is in request body.
 */
router.post('/:email/:property', async (req, res) => {

  const property = req.params.property;

  if (property === 'is_admin') {
    res.json({
      msg: `property is_admin cannot be set directly`,
      status: 'ERROR',
    });
    return;
  }

  const maybeCredentials = getCredentials(req);

  if (maybeCredentials === undefined || maybeCredentials === null) {
    res.json({
      msg: 'not logged in and password not present in POST params',
      status: 'ERROR',
    });
    return;
  }

  const {email, password} = maybeCredentials;

  if (!await userExists(email, password)) {
    res.json(
      errMsg(`user with email ${email} and this password does not exist`));
    return;
  }

  if (!validateJSON(req.body, {value: 'String'})) {
    res.json(errMsg('replacement value not specified in request body'));
    return;
  }

  let {value} = req.body;

  // sha passwords *before* inserting into the db
  if (property === 'password') {
    value = sha256(value);
  }

  const sql = 'UPDATE User SET :property = :value WHERE email = :email AND password = :password';
  const replacements = {email, property, password, value};
  db.query(sql, {replacements}).catch((err) => {
    res.json(errMsg(
      `failed to set property ${property} of user ${email} to ${value} (likely because of bad format)`,
      err));
  }).then((rows) => {
    res.json(msg(`updated property ${property} of user ${email} to ${value}`));
  });
});

/**
 * If an API user tries to query the database for user's info with POST suggest using GET.
 */
router.post('/:email', async (req, res) => {
  res.json({
    msg: `use GET to retrieve info about user ${req.params.email}`,
    status: 'ERROR',
  });
});

router.get('/:email', async (req, res) => {
  const email = req.params.email;

  if (!await userExists(email)) {
    res.json(errMsg(`user with email ${email} does not exist`));
    return;
  }
  const replacements = {email};
  const sql = 'SELECT * FROM User WHERE email = :email';
  db.query(sql, {replacements}).catch((err) => {
    res.json(errMsg(`failed to find user with email ${email}`, err));
  }).then((rows) => {
    if (rows[0].length >= 1) {
      let result = rows[0][0];
      delete result.password; // don't show the password
      res.json(msg(`found user ${email}`, result));
    } else {
      res.json(msg(`failed to find user with email ${email}`));
    }
  });
});

/**
 * If none of the above match, show help.
 */
router.all(/.*/, (req, res) => {
  res.json({
    status: 'CONFUSED',
    msg: 'nothing here, try looking at routes',
    routes: {
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
    },
  });
});

module.exports = router;
