/**
 * This module implements the User model and operations on users such as
 * updating fields, deleting users, creating new users in the database.
 *
 * @author Norbert
 */
const router = require('express').Router();
const db = require('../database/db.js')();
const {errMsg, msg, sha256} = require('./lib.js');


/**
 * Check if the user exists.
 *
 * @param {string} email
 * @param {string} [password]
 * @return {boolean}
 */
async function userExists(email, password) {
  let sql, replacements;
  if (password !== undefined) {
    sql = 'SELECT * FROM User WHERE email = :email AND password = :password';
    replacements = {email, password};
  } else {
    sql = 'SELECT * FROM User WHERE email = :email';
    replacements = {email};
  }
  return await db.query(sql, {replacements}).then((rows) => {
    return rows[0].length > 0;
  }).catch((err) => {
    console.debug(err);
    return false;
  });
}


router.post('/:email/register', async (req, res) => {
  if (!('password' in req.body)) {
    res.json({
      msg: 'password not present in POST params',
      status: 'ERROR',
    });
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
    console.debug(err);
    res.json(errMsg(`failed to register user ${email}`, err));
  });
});

router.post('/:email/unregister', async (req, res) => {
  if (!('password' in req.body)) {
    res.json({
      msg: 'password not present in POST params',
      status: 'ERROR',
    });
    return;
  }
  const email = req.params.email;
  const password = sha256(req.body.password);

  if (!await userExists(email, password)) {
    res.json(
      errMsg(`user with email ${email} and this password does not exist`));
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
    console.debug(err);
    res.json(errMsg(
      `failed to unregistered user ${email}, the user probably does not exist`));
  });
});

for (const action of ['register', 'unregister']) {
  router.all(`/:email/${action}`, (req, res) => {
    res.json({
      msg: `use POST to ${action}`,
      status: 'ERROR',
    });
  });
}

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
    console.debug(err);
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

router.post('/:email/:property', async (req, res) => {
  const {email, property} = req.params;

  if (property === 'is_admin') {
    res.json({
      msg: `property is_admin cannot be set directly`,
      status: 'ERROR',
    });
    return;
  }

  for (const needed of ['password', 'value']) {
    if (!(needed in req.body)) {
      res.json(
        errMsg(`${needed} not present in POST request params but is required`));
      return;
    }
  }

  let {value, password} = req.body;
  password = sha256(password);

  // sha passwords *before* inserting into the db
  if (property === 'password') {
    value = sha256(value);
  }

  if (!await userExists(email, password)) {
    res.json(
      errMsg(`user with email ${email} and this password does not exist`));
    return;
  }

  const sql = 'UPDATE User SET :property = :value WHERE email = :email AND password = :password';
  const replacements = {email, property, password, value};
  db.query(sql, {replacements}).catch((err) => {
    console.debug(err);
    res.json(errMsg(
      `failed to set property ${property} of user ${email} to ${value} (likely because of bad format)`,
      err));
  }).then((rows) => {
    console.log(rows);
    res.json(msg(`updated property ${property} of user ${email} to ${value}`));
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
    console.debug(err);
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

router.all(/.*/, (req, res) => {
  res.json({
    status: 'CONFUSED',
    msg: 'nothing here, try looking at routes',
    routes: {
      GET: {
        ':email': 'to lookup a single user',
        ':email/:property': 'to lookup a property of a single user',
      },
      POST: {
        ':email/register': 'to register a single user',
        ':email/unregister': 'to unregister a single user',
        ':email/:property': 'to set property to value in a single user',
      },
    },
  });
});

module.exports = router;
