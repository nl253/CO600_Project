const {join} = require('path');
const {existsSync} = require('fs');

const express = require('express');
const router = express.Router();

const {log, errMsg} = require('./lib');
const {NotImplYetErr} = require('./../errors');

router.use((req, res, next) => {
  res.set({
    'Cache-Control': 'private, no-cache, no-store, must-revalidate',
    'Expires': '-1',
    'Pragma': 'no-cache',
  });
  return next();
});

const APPS = [
  'Enrollment',
  'File',
  'Lesson',
  'Module',
  'Question',
  'Rating',
  'Session',
  'User',
];

for (const app of APPS.map(key => key.toLowerCase())) {
  if (existsSync(join(__dirname, `${app}.js`)) || existsSync(join(__dirname, app, 'index.js'))) {
    log.info(`mounting the ${app} part of the api to /api/${app}`);
    router.use(`/${app}`, require(`./${app}`));
  } else router.all(`/${app}`, (req, res, next) => next(new NotImplYetErr(`${app} part of the REST API`)));
}

router.use((err, req, res, next) => {
  console.error(err);
  const msg = err.message || err.msg || err.toString();
  log.error(msg);
  return res.status(err.code || 500).json(errMsg(msg));
});

module.exports = router;
