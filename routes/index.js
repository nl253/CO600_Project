const express = require('express');
const decrypt = require('./lib').decrypt;
const router = express.Router();
const {Session} = require('./database');

router.get('/search', (req, res) => res.redirect('/module/search'));

router.get(['/profile', '/account', '/dashboard', '/'],
  (req, res) =>
    req.cookies.token !== undefined && req.cookies.token !== null
      ? Session
        .findOne({where: {token: decrypt(req.cookies.token)}})
        .then(session => session !== null && ((Date.now() - session.dataValues.updatedAt) < process.env.SESSION_TIME)
          ? res.redirect(`/user/${session.email}`)
          : res.status(404))
      : res.redirect('/user/register'));

// catch 404 and forward to error handler
router.use((req, res, next) => next(require('http-errors')(404)));

// error handler
router.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV === 'development' ? err : {};

  // render the error page
  return res.status(err.status || err.code || 500).render('error');
});

module.exports = router;
