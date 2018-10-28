/* eslint-disable no-console,node/no-unsupported-features/node-builtins */
/**
 * A word of caution:
 *
 * Although it would make sense to use DELETE, UPDATE and
 * PUT, sadly, they don't allow to extract data from the request body.
 * Whenever sensitive data needs to be sent
 * e.g. password or new value for a potentially sensitive property
 * (such as password), POST is used instead of get.
 *
 * I am using raw SQL here because I am comfortable with SQL and it means
 * I don't need to learn sequelize's syntax for defining, updating and
 * querying entities. The goal is to reduce complexity.
 *
 * The aim is to create a REST API. I try to make it feel like calling a method
 * in an object oriented programming language.
 *
 * E.g.:
 *
 * To set password on user `/<user_email>/<property>` and sent the `value` in
 * POST request body.
 *
 * This is similar to calling a setter.
 *
 * E.g.:
 *
 * To unregister i.e. delete account, simply "call" unregister on the entity
 * `/<user_email>/unregister` and pass `password` in POST request body.
 *
 * This is similar to calling a method `user.unregister()`.
 *
 * Passwords are SHA256 hashed before storing and before comparing.
 *
 * @author Norbert
 */
const crypto = require('crypto');
const ValidationError = require('sequelize/lib/errors').ValidationError;
const express = require('express');
const router = express.Router();
const db = require('../database/db.js')();

/**
 * Compute SHA-256 of data. Use to avoid storing passwords in the
 * db in plain text.
 *
 * @param {string} data
 * @return {string}
 */
function sha256(data) {
  const hash = crypto.createHash('sha256');
  hash.update(data);
  return hash.digest('base64').toString();
}

/**
 * Produce a more informative error msg when using the REST API.
 *
 * @param {string} msg
 * @param {BaseError} err
 */
function errMsg(msg, err) {
  const status = 'ERROR';
  if (err && (err instanceof ValidationError) && err.errors.length > 0) {
    const error = err.errors[0];
    let message = error.message;
    if (err.fields.length > 0) {
      const fields = err.fields.map((f) => f.toLocaleString())
        .reduce((x, y) => `${x}, ${y}`);
      message = `issue with ${fields}: ${message}`;
    }
    return {status, msg: `${msg}, error: ${message}`};
  } else {
    return {status, msg};
  }
}

function msg(msg, result) {
  const status = 'OK';
  return result ? {status, msg, result} : {status, msg};
}

router.post('/:email/register', (eq, res) => {
  if (!('password' in req.body)) {
    res.json({
      msg: 'password not present in POST params',
      status: 'ERROR',
    });
    return;
  }
  const email = req.params.email;
  const password = sha256(req.body.password);
  const sql = 'INSERT INTO User (email, password) VALUES (:email, :password)';
  const replacements = {email, password};
  db.query(sql, {replacements}).then((rows) => {
    res.json(msg(`registered user ${email}`));
  }).catch((err) => {
    console.debug(err);
    res.json(
      errMsg(
        `failed to register user ${email}, the user probably already has an account`,
        err));
  });
});

router.post('/:email/unregister', (req, res) => {
  if (!('password' in req.body)) {
    res.json({
      msg: 'password not present in POST params',
      status: 'ERROR',
    });
    return;
  }
  const email = req.params.email;
  const password = sha256(req.body.password);
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

router.get('/:email/:property', (req, res) => {
  const sql = 'SELECT * FROM User WHERE email = :email';
  const {email, property} = req.params;
  const replacements = {email, property};
  if (property === 'password') {
    res.json(errMsg('cannot lookup password'));
    return;
  }
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

router.post('/:email/:property', (req, res) => {
  const {email, property} = req.params;
  for (const needed of ['password', 'value']) {
    if (!(needed in req.body)) {
      res.json({
        msg: `${needed} not present in POST request params`,
        status: 'ERROR',
      });
      return;
    }
  }

  if (property === 'is_admin') {
    res.json({
      msg: `property is_admin cannot be set directly`,
      status: 'ERROR',
    });
    return;
  }

  let value;

  if (property === 'password') {
    // sha passwords *before* inserting into the db
    value = sha256(req.body.value);
  } else {
    value = req.body.value;
  }
  const password = sha256(req.body.password);

  const sql = 'UPDATE User SET :property = :value WHERE email = :email AND password = :password';
  const replacements = {email, property, password, value};
  db.query(sql, {replacements}).catch((err) => {
    console.debug(err);
    res.json(errMsg(
      `failed to set property ${property} of user ${email} to ${value} (likely because of bad format)`,
      err));
  }).then((rows) => {
    res.json(msg(`updated property ${property} of user ${email} to ${value}`));
  });
});

router.get('/:email', (req, res) => {
  const sql = 'SELECT * FROM User WHERE email = :email';
  const email = req.params.email;
  const replacements = {email};
  db.query(sql, {replacements}).catch((err) => {
    console.debug(err);
    res.json(errMsg(`failed to find user with email ${email}`, err));
  }).then((rows) => {
    if (rows[0].length >= 1) {
      res.json(msg(`found user ${email}`, rows[0][0]));
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
