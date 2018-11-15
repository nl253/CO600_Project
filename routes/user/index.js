const express = require('express');
const router = express.Router();
const {decrypt, exists} = require('../lib');
const {User, Session} = require('../database');
const {join} = require('path');

const SECOND = 1000;
const MINUTE = 60 * SECOND;

router.get('/register', (req, res) => res.render(join('user', 'register')));

/**
 * Display public info about a user.
 */
router.get('/:email',
  exists(User, (req) => ({email: req.params.email})),
  (req, res, next) => User.findOne({
    where: {email: req.params.email},
    attributes: Object.keys(User.attributes).filter(a => a !== 'password'),
  }).then((user) => res.render(join('user', 'index'), {user: user.dataValues}))
    .catch((err) => next(err)));

/** @namespace session.updatedAt */
/** @namespace session.dataValues */
router.get(
  ['/profile', '/dashboard', '/account', '/'],
  (req, res, next) => req.cookies.token === undefined || req.cookies.token === null
    ? res.status(403).render(join('user', 'register'))
    : Session.findOne({where: {token: decrypt(decodeURIComponent(req.cookies.token))}})
      .then((session) => session === null
        ? res.status(403).redirect('/user/register')
        : session.dataValues
      )
      .then((session) => (Date.now() - session.updatedAt) >= (process.env.SESSION_TIME || 20 * MINUTE)
        ? res.status(401).redirect('/user/register')
        : User.findOne({
          where: {email: session.email},
          attributes: Object.keys(User.attributes).filter(a => a !== 'password')
        }).then((user) => res.render(join('user', 'profile'), {loggedIn: user.dataValues})))
      .catch(err => next(err)));

module.exports = router;
