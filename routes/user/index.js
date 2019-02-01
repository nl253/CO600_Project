// Standard Library
const fs = require('fs');
const {join} = require('path');

// 3rd Party
const express = require('express');
const {NotImplYetErr, NoSuchRecordErr} = require('../errors');
const router = express.Router();

// Project
const {log} = require('../lib');
const {User, Enrollment, Module} = require('../../database');

router.get('/search', (req, res) => res.render(join('user', 'search')));

/**
 * Registration page if not logged in, otherwise redirect to user home.
 */
router.get(['/register', '/sign[-_]?up', 'create'],
  (req, res) => res.locals.loggedIn
    ? res.redirect('/user/home')
    : res.render(join('user', 'register')));

router.get(['/edit', '/settings'],
  (req, res) => res.locals.loggedIn === undefined
    ? res.status(403).redirect('/')
    : res.render(join('user', 'settings')));

/**
 * User profile page of the user that's logged in.
 */
router.get(['/', '/home', '/profile', '/dashboard', '/account'],
  (req, res) => res.locals.loggedIn === undefined
    ? res.status(403).redirect('/user/register')
    : res.render(join('user', 'home')));

/**
 * Public info about a user.
 */
router.get('/:page',
  async (req, res, next) => {
    try {
      let user = null;
      const attributes = Object.keys(User.attributes).filter(a => a !== 'password');
      if (req.params.page.match(/\d+/)) {
        user = await User.findOne({
          where: {id: eval(req.params.page)},
          attributes,
        });
      } else if (req.params.page.indexOf('@') >= 0) {
        user = await User.findOne({
          where: {email: req.params.page},
          attributes,
        });
      } else return next();
      if (user === null) {
        throw new NoSuchRecordErr('User', [req.params.page]);
      }
      user = user.dataValues;
      user.enrollments = await Enrollment.findAll({where: {studentId: user.id}}).then(es => es.map(e => e.dataValues));
      for (let i = 0; i < user.enrollments.length; i++) {
        user.enrollments[i].module = await Module.findOne({where: {id: user.enrollments[i].moduleId}}).then(m => m.dataValues);
      }
      user.isMe = res.locals.loggedIn && res.locals.loggedIn.id && res.locals.loggedIn.id === user.id;
      user.createdModules = await Module.findAll({where: {authorId: user.id}}).then(ms => ms.map(m => m.dataValues));
      console.log(user);
      return res.render(join('user', 'profile'), {user});
    } catch (err) {
      return next(err);
    }
  },
  (req, res, next) => {
    // not a user but a user page (for development render all pages in /views/user)
    const {page} = req.params;
    const pagePath = join(process.env.ROOT, 'views', 'user', `${page}.hbs`);
    return fs.exists(pagePath, ok => {
      if (ok) return res.render(join('user', page));
      log.warn(`the file ${pagePath} does not exist`);
      log.warn(`the ${page} user page has not been created yet (hint: you can create "/views/user/${page}.hbs" and it will be served)`);
      return next(new NotImplYetErr(`page ${page}`));
    });
  });


module.exports = router;
