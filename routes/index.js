const express = require('express');
const router = express.Router();

router.get([
  '/profile',
  '/home',
  '/dashboard'
], (req, res) => res.redirect('/user/profile'));

router.get('/search', (req, res) => res.redirect('/module/search'));

router.get('/', (req, res) => res.redirect('/user/register'));

module.exports = router;
