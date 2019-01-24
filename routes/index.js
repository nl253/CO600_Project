const express = require('express');
const {join, resolve} = require('path');
const {existsSync} = require('fs');
const router = express.Router();

router.get('/search', (req, res) => res.redirect('/module/search'));

router.get([
  '/profile',
  '/account',
  '/dashboard',
], (req, res) => res.redirect('/user/profile'));

router.get(['/', '/register'], (req, res) => res.redirect('/user/register'));

/**
 * Render all pages in `/views/pages`.
 */
router.get('/:page', (req, res, next) => {
  const {page} = req.params;
  const pagePath = resolve(join(process.env.ROOT || process.env.PWD, 'views', 'pages', `${page}.hbs`));
  return existsSync(pagePath)
    ? res.render(join('pages', page))
    : next();
});

module.exports = router;
