const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {
  res.render('index', {title: 'Final Year CO600 Project'});
});

module.exports = router;
