const {exists} = require('fs');
const {join, resolve} = require('path');
const express = require('express');
const AuthFailedErr = require('../api/errors').AuthFailedErr;
const getCredentials = require('../api/lib').getCredentials;
const router = express.Router();
const {log} = require('../lib');

/**
 * Preload template variables for logged in users.
 */
router.get((req, res, next) =>
  getCredentials(req)
    .then(credentials => User.findOne({where: credentials}))
    .then(result => result === null ?
      Promise.reject(new AuthFailedErr()) :
      result.dataValues)
    .then(user => {
      const clone = JSON.parse(JSON.stringify(user));
      delete clone.password;
      res.locals.user = clone;
      next();
    })
    .catch(err => next()));

router.get('/:page', (req, res) => {
  /** @namespace req.params.page */
  const pagePath = resolve(
    join(__dirname, '..', '..', 'views', 'user', `${req.params.page}.hbs`));
  return exists(pagePath, ok => {
    if (ok) {
      return res.render(join('user', req.params.page));
    }
    log.warn(`the file ${pagePath} does not exist`);
    log.warn(
      `the ${req.params.page} user page has not been created yet (hint: you can create "/views/user/${req.params.page}.hbs" and it will be served)`);
  });
});

router.get('/', (req, res) => res.redirect('/user/profile'));

module.exports = router;
