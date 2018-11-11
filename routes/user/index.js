const express = require('express');
const router = express.Router();
const {log, decrypt, exists, models} = require('../lib');
const {User} = models;
const {join} = require('path');

router.get('/register', (req, res) => res.render(join('user', 'register')));

router.get('/:email',
  exists(User, (req) => ({email: req.params.email})),
  (req, res) => User.findByPk(req.params.email)
    .then(user => {
      if (user !== null) {
        const userInfo = JSON.parse(JSON.stringify(user.dataValues));
        delete userInfo.password;
        res.locals.user = userInfo;
        return res.render(join('user', 'profile'));
      }
      log.warn(`user ${req.params.email} not found`);
      return res.status(404);
    }).catch((err) => {
      log.error(err.message);
      return res.status(404);
    }),
);

router.get('/', (req, res) =>
  req.cookies.token !== undefined
    ? Session
      .findOne({where: {token: decrypt(req.cookies.token)}})
      .then(session => {
        return session !== null
          ? res.redirect(session.email)
          : res.status(404);
      })
    : res.status(404));

module.exports = router;
