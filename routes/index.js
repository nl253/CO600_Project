const express = require('express');
const {join, resolve} = require('path');
const {existsSync} = require('fs');
const router = express.Router();

router.get(['/manual', '/help'], (req, res) => {
  return res.render(join('manual','help'));
});
router.get(['/manual/:page', '/help/:page'], (req, res) => {
  return res.render(join('manual', req.params.page));
});

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
  const pagePath = resolve(join(process.env.ROOT, 'views', 'pages', `${page}.hbs`));
  return existsSync(pagePath)
    ? res.render(join('pages', page))
    : next();
});

module.exports = router;
