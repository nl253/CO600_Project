const express = require('express');
const router = express.Router();
const {log, decrypt, exists} = require('../lib');
const {User, Session} = require('../database');
const {join} = require('path');

router.get('/register', (req, res) => res.render(join('user', 'register')));

router.get('/:email',
  exists(User, (req) => ({email: req.params.email})),
  (req, res) => User.findByPk(req.params.email)
    .then(user => {
      const userInfo = JSON.parse(JSON.stringify(user.dataValues));
      delete userInfo.password;
      res.locals.user = userInfo;
      return res.render(join('user', 'profile'));
    }).catch((err) => {
      log.error(err.message);
      return res.status(404);
    }),
);

router.get('/', (req, res) =>
  req.cookies.token === undefined || req.cookies.token === null
    ? res.redirect('register')
    : Session.findOne({where: {token: decrypt(req.cookies.token)}})
      .then(session =>
        session !== null &&
        ((Date.now() - session.dataValues.updatedAt) < process.env.SESSION_TIME)
          ? res.redirect(session.email)
          : res.redirect('register')));

module.exports = router;
