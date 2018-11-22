// Standard Library
const {exists} = require('fs');
const {join} = require('path');

// 3rd Party
const express = require('express');
const {NotImplYetErr, NoSuchRecord} = require('../errors');
const router = express.Router();

// Project
const {decrypt, log} = require('../lib');
const {User, Session} = require('../database');

const SECOND = 1000;
const MINUTE = 60 * SECOND;

/**
 * Registration page if not logged in, otherwise redirect to user profile page.
 */
router.get('/register', (req, res) => res.locals.loggedIn 
  ? res.redirect('/user/') 
  : res.render(join('user', 'register')));

router.get([
  '/profile',
  '/dashboard',
  '/account'], (req, res) => res.redirect('/user/'));

/**
 * Public info about a user.
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
      : res.render(join('user', 'profile'), {user: user.dataValues})
    ).catch((err) => next(err))
  });

/**
 * User profile page with enrollments and their content.
 */
/** @namespace user.dataValues */
/** @namespace session.updatedAt */
router.get('/', (req, res, next) => res.locals.loggedIn 
  ? res.render(join('user', 'index'))
  : res.status(403).redirect('/user/register'));

module.exports = router;
