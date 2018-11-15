const express = require('express');
const {NotImplYetErr} = require('./errors');
const {join, resolve} = require('path');
const {existsSync} = require('fs');
const router = express.Router();


/**
 * Redirect `/search` to `/module/search` .
 */
router.get('/search', (req, res) => res.redirect('/module/search'));

/**
 * Redirect `/profile`, `/account` & `/dashboard` to `/user/profile` .
 */
router.get([
  '/profile',
  '/account',
  '/dashboard',
], (req, res) => res.redirect('/user/profile'));

/**
 * Render all pages in `/views/pages`.
 */
router.get('/:page', (req, res, next) => {
  const {page} = req.params;
  const pagePath = resolve(join(process.env.ROOT || process.env.PWD, 'views', 'pages', page));
  if (!existsSync(pagePath)) {
    /** @namespace req.params.page */
    log.error(`failed to render page "${page}" in "${pagePath}", HINT: try creating it in "/views/pages/${page}" and it will be served`);
    return next(new NotImplYetErr(`page ${page}`));
  }
  return res.render(join('pages', page));
});

/**
 * Redirect `/search` to `/module/search` .
 */
router.get('/', (req, res) => res.redirect('/user/register'));

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
