const express = require('express');
const {NotImplYetErr} = require('./errors');
const {join, resolve} = require('path');
const {existsSync} = require('fs');
const {log} = require('./lib');
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
  const pagePath = resolve(join(process.env.ROOT || process.env.PWD, 'views', 'pages', `${page}.hbs`));
  if (!existsSync(pagePath)) {
    /** @namespace req.params.page */
    log.error(`failed to render page "${page}" in "${pagePath}", HINT: try creating it in "/views/pages/${page}.hbs" and it will be served`);
    return next(new NotImplYetErr(`page ${page}`));
  }
  return res.render(join('pages', page));
});

/**
 * Redirect `/search` to `/module/search` .
 */
router.get('/', (req, res) => res.redirect('/user/register'));

module.exports = router;
