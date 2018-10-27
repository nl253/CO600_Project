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
 * @author Norbert
 */
const express = require('express');
const router = express.Router();
const db = require('../database/db.js')();

router.post('/:email/register', async (req, res) => {
  if (!('password' in req.body)) {
    res.json({
      msg: 'password not present in POST params',
      status: 'ERROR',
    });
    return;
  }
  const {email} = req.params;
  const {password} = req.body;
  const sql = 'INSERT INTO User (email, password) VALUES (:email, :password)';
  const replacements = {email, password};
  const query = db.query(sql, {replacements});
  query.then((rows) => res.json({
    status: 'OK',
    msg: `registered user ${email}`,
  }));
  query.catch((err) => res.json({
    status: 'ERROR',
    msg: `failed to register user ${email}, the user probably already has an account`,
  }));
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
  const {password} = req.body;
  const sql = 'DELETE FROM User WHERE email = :email AND password = :password';
  const replacements = {email, password};
  const query = db.query(sql, {replacements});
  query.then((rows) => res.json({
    status: 'OK',
    msg: `unregistered user ${email}`,
  }));
  query.catch((err) => res.json({
    status: 'ERROR',
    msg: `failed to unregistered user ${email}, the user probably does not exist`,
  }));
});

for (const action of ['register', 'unregister']) {
  router.all(`/:email/${action}`, async (req, res) => {
    res.json({
      msg: `use POST to ${action}`,
      status: 'ERROR',
    });
  });
}

router.get('/:email/:property', async (req, res) => {
  const sql = 'SELECT * FROM User WHERE email = :email';
  const {email, property} = req.params;
  const replacements = {email, property};
  const query = db.query(sql, {replacements});

  query.catch((err) => res.json({
    status: 'ERROR',
    msg: `failed to find ${property} of ${email}`,
  }));

  query.then((rows) => {
    if (property in rows[0][0]) {
      res.json({
        status: 'OK',
        msg: `found property ${property} of ${email}`,
        result: rows[0][0][property],
      });
    } else {
      res.json({
        status: 'ERROR',
        msg: `user does not have property ${property}`,
      });
    }
  });
});

router.post('/:email/:property', async (req, res) => {
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
  const {password, value} = req.body;
  const sql = 'UPDATE User SET :property = :value WHERE email = :email AND password = :password';
  const replacements = {email, property, password, value};
  const query = db.query(sql, {replacements});

  query.catch((err) =>
    res.json({
      status: 'ERROR',
      msg: `failed to set property ${property} of user ${email} to ${value}`,
    }));

  query.then((rows) => res.json({
    status: 'OK',
    msg: `updated property ${property} of user ${email} to ${value}`,
  }));
});

router.get('/:email', async (req, res) => {
  const sql = 'SELECT * FROM User WHERE email = :email';
  const email = req.params.email;
  const replacements = {email};
  const query = db.query(sql, {replacements});

  query.catch((err) => res.json({
    status: 'ERROR',
    msg: `failed to find user with email ${email}`,
  }));

  query.then((rows) => {
    if (rows[0].length >= 1) {
      res.json({
        status: 'OK',
        msg: `found user ${email}`,
        result: rows[0][0],
      });
    } else {
      res.json({
        status: 'ERROR',
        msg: `failed to find user with email ${email}`,
      });
    }
  });
});

router.all(/.*/, async (req, res) => {
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
