const {exists} = require('fs');
const {join, resolve} = require('path');
const express = require('express');
const router = express.Router();
const {log} = require('../lib');

router.get('/:page', (req, res) => {
  const pagePath = resolve(join(__dirname, '..', '..', 'views', 'user', `${req.params.page}.hbs`));
  return exists(pagePath, ok => {
    if (ok) {
      return res.render(join('user', req.params.page), {title: 'Final Year CO600 Project', email: req.cookies.email});
    } 
    log.warn(`the file ${pagePath} does not exist`);
    log.warn(`the ${req.params.page} user page has not been created yet (hint: you can create "/views/user/${req.params.page}.hbs" and it will be served)`);
  });
});

router.get('/', (req, res) => res.redirect('/user/profile'));

module.exports = router;
