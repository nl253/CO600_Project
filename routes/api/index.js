const {join} = require('path');
const {existsSync} = require('fs');

const express = require('express');
const router = express.Router();

const {log, errMsg} = require('./lib');
const {NotImplYetErr} = require('./../errors');

const MODELS = [
  'Enrollment',
  'File',
  'Lesson',
  'Module',
  'Question',
  'Rating',
  'Session',
  'User',
];

for (const mod of MODELS.map(key => key.toLowerCase())) {
  if (existsSync(join(__dirname, `${mod}.js`)) || existsSync(join(__dirname, mod, 'index.js'))) {
    log.info(`mounting the ${mod} part of the api to /api/${mod}`);
    router.use(`/${mod}`, require(`./${mod}`));
  } else router.all(`/${mod}`, (req, res, next) => next(new NotImplYetErr(`${mod} part of the REST API`)));
}

router.use((err, req, res, next) => {
  console.error(err);
  const msg = err.message || err.msg || err.toString();
  log.error(msg);
  return res.status(err.code || 500).json(errMsg(msg));
});

module.exports = router;
