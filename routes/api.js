const express = require('express');
const router = express.Router();
const usersRouter = require('./user');

router.use('/user', usersRouter);

router.all('/', async (req, res, next) => {
  res.json({
    status: 'CONFUSED',
    msg: 'nothing here, try looking at routes',
    routes: {
      'user': 'user-related operations e.g.: register, lookup, delete',
    },
  });
});

module.exports = router;
