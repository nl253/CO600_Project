const express = require('express');
const router = express.Router();
const db = require('../database/db.js')();

router.get('/register/:email/:password', async (req, res, next) => {
  const query = db.query(
      'INSERT INTO User (email, password) VALUES (:email, :password)', {
        replacements: {
          email: req.params.email,
          password: req.params.password,
        },
      });
  query.then((rows) => res.json({
    status: 'OK',
    msg: `registered user ${req.params.email}`,
  }));
  query.catch((err) => res.json({
    status: 'ERROR',
    msg: `failed to registered user ${req.params.email}`,
  }));
});

router.get('/unregister/:email/:password', async (req, res, next) => {
  const query = db.query(
      'DELETE FROM User WHERE email = :email AND password = :password', {
        replacements: {
          email: req.params.email,
          password: req.params.password,
        },
      });

  query.then((rows) => res.json({
    status: 'OK',
    msg: `unregistered user ${req.params.user}`,
  }));

  query.catch((err) => req.json({
    status: 'ERROR',
    msg: `failed to unregister user ${req.params.user}, the user is probably not registered`,
  }));
});

router.get('/:email/:property', async (req, res, next) => {
  const query = db.query('SELECT * FROM User WHERE email = :email', {
    replacements: {email: req.params.email, property: req.params.property},
  });

  query.then((rows) => {
    if (req.params.property in rows[0][0]) {
      res.json({
        status: 'OK',
        msg: `found property ${req.params.property} of ${req.params.email}`,
        result: rows[0][0][req.params.property],
      });
    } else {
      res.json({
        status: 'ERROR',
        msg: `user does not have property ${req.params.property}`,
      });
    }
  });

  query.catch((err) => res.json({
    status: 'ERROR',
    msg: `failed to find ${req.params.property} of ${req.params.email}`,
  }));
});

router.get('/:email', async (req, res, next) => {
  const query = db.query('SELECT * FROM User WHERE email = :email', {
    replacements: {email: req.params.email},
  });

  query.then((rows) => {
    if (rows[0].length >= 1) {
      res.json({
        status: 'OK',
        msg: `found user ${req.params.email}`,
        result: rows[0][0],
      });
    } else {
      res.json({
        status: 'ERROR',
        msg: `failed to find user with email ${req.params.email}`,
      });
    }
  });

  query.catch((err) => res.json({
    status: 'ERROR',
    msg: `failed to find user with email ${req.params.email}`,
  }));
});

router.get('/', async (req, res, next) => {
  res.json({
    status: 'CONFUSED',
    msg: 'nothing here, try looking at routes',
    routes: {
      ':email': 'to lookup a single user',
      ':email/:property': 'to lookup a property of a single user',
      'register': 'to register a single user',
      'unregister': 'to unregister a single user',
    },
  });
});

module.exports = router;
