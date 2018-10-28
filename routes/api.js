/**
 * This is where the REST API is defined. This module does not do much itself,
 * it only registers other routers.
 *
 * @author Norbert
 */
const express = require('express');
const router = express.Router();
const usersRouter = require('./user');

router.use('/user', usersRouter);

router.all('/', (req, res) => {
  res.json({
    status: 'CONFUSED',
    msg: 'nothing here, try looking at routes',
    routes: {
      'user': 'user-related operations e.g.: register, lookup, delete',
    },
  });
});

module.exports = router;
