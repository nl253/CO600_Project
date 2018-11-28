// Standard Library
const fs = require('fs');
const {join} = require('path');

// 3rd Party
const express = require('express');
const {NotImplYetErr, NoSuchRecord} = require('../errors');
const router = express.Router();

// Project
const {log} = require('../lib');
const {User, Enrollment, Module} = require('../database');

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
    // tell hbs what tab to open
    if (res.locals.query && res.locals.query.tab) {
      res.locals.tab = {};
      if (res.locals.query.tab.match('personal')) {
        res.locals.tab.personalDetails = true;
      } else if (res.locals.query.tab.match('module')) {
        res.locals.tab.createdModules = true;
      } else if (res.locals.query.tab.match('enrollment')) {
        res.locals.tab.enrollments = true;
      }
    }
    return next();
  },
  (req, res, next) => {
    // use email to locate user
    if (req.params.page.indexOf('@') < 0) return next();
    const email = req.params.page;
    return User.findOne({
      where: {email},
      attributes: Object.keys(User.attributes).filter(a => a !== 'password'),
    }).then((u) => {
      if (u === null) return next(new NoSuchRecord('User', {email}));
      const user = u.dataValues;
      return Enrollment.findAll({where: {studentId: user.id}})
        .then(async enrollments => {
          user.enrollments = enrollments.map(e => e.dataValues);
          for (let i = 0; i < user.enrollments.length; i++) {
            user.enrollments[i].module = (await (Module.findOne({where: {id: user.enrollments[i].moduleId}}))).dataValues;
          }
          user.isMe = res.locals.loggedIn && res.locals.loggedIn.id && res.locals.loggedIn.id === user.id;
          return Module.findAll({where: {authorId: user.id}})
            .then(modules => {
              user.createdModules = modules.map(m => m.dataValues);
              return res.render(join('user', 'index'), {user});
            });
        });
    }).catch((err) => next(err));
  },
  (req, res, next) => {
    // use id to locate user
    if (!req.params.page.match(/\d+/)) return next();
    const id = req.params.page;
    return User.findOne({where: {id}})
      .then(u => {
        if (u === null) return next(new NoSuchRecord('User', {id}));
        const user = u.dataValues;
        return Enrollment.findAll({where: {studentId: user.id}})
          .then(async enrollments => {
            user.enrollments = enrollments.map(e => e.dataValues);
            for (let i = 0; i < user.enrollments.length; i++) {
              user.enrollments[i].module = (await (Module.findOne({where: {id: user.enrollments[i].moduleId}}))).dataValues;
            }
            user.isMe = res.locals.loggedIn && res.locals.loggedIn.id && res.locals.loggedIn.id === user.id;
            return Module.findAll({where: {authorId: user.id}})
              .then(modules => {
                user.createdModules = modules.map(m => m.dataValues);
                return res.render(join('user', 'index'), {user});
              });
          });
      })
  },
  (req, res, next) => {
    // not a user but a user page (for development render all pages in /views/user)
    const {page} = req.params;
    const pagePath = join(process.env.ROOT || process.env.PWD, 'views', 'user', `${page}.hbs`);
    return fs.exists(pagePath, ok => {
      if (ok) return res.render(join('user', page));
      log.warn(`the file ${pagePath} does not exist`);
      log.warn(`the ${page} user page has not been created yet (hint: you can create "/views/user/${page}.hbs" and it will be served)`);
      return next(new NotImplYetErr(`page ${page}`));
    });
  });

/**
 * User profile page of the user that's logged in.
 */
/** @namespace user.dataValues */
/** @namespace session.updatedAt */
router.get('/', (req, res, next) => {
  if (res.locals.loggedIn) {
    let url = `/user/${res.locals.loggedIn.id}`;
    // don't loose query parameters during re-routing
    if (req.query && Object.entries(req.query).length > 0) {
      url += `?${Object.entries(req.query).map(pair => pair.join('=')).join('&')}`;
    }
    return res.redirect(url);
  } else {
    return res.status(403).redirect('/user/register');
  }
});

module.exports = router;
