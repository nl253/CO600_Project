// Standard Library
const {NoSuchRecord} = require('../errors');

const {exists} = require('fs');
const {join} = require('path');

// 3rd Party
const express = require('express');
const NotImplYetErr = require('../errors').NotImplYetErr;
const router = express.Router();

// Project
const {decrypt, log} = require('../lib');
const {User, Session} = require('../database');

const SECOND = 1000;
const MINUTE = 60 * SECOND;

router.get('/register', (req, res) => res.render(join('user', 'register')));
router.get([
  '/profile',
  '/dashboard',
  '/account'], (req, res) => res.redirect('/user'));

/**
 * Display public info about a user.
 */
router.get('/:page',
  (req, res, next) => {
    const {page} = req.params;
    if (page.indexOf('@') < 0) {
      const pagePath = join(process.env.ROOT || process.env.PWD, 'views', 'user', `${page}.hbs`);
      return exists(pagePath, ok => {
        if (ok) return res.render(join('user', page));
        log.warn(`the file ${pagePath} does not exist`);
        log.warn(`the ${page} user page has not been created yet (hint: you can create "/views/user/${page}.hbs" and it will be served)`);
        return next(new NotImplYetErr(`page ${page}`));
      });
    }
    const email = page;
    return User.findOne({
      where: {email},
      attributes: Object.keys(User.attributes).filter(a => a !== 'password')
    }).then((user) => user === null
      ? next(new NoSuchRecord('User', {email}))
      : res.render(join('user', 'index'), {user: user.dataValues})
    ).catch((err) => next(err))
  });


/** @namespace user.dataValues */
/** @namespace session.updatedAt */
router.get('/',
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
