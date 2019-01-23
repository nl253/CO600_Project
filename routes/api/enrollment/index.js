// 3rd Party
const {isLoggedIn, validCols} = require('../../lib');
const {msg} = require('../lib');
const router = require('express').Router();

// Project
const {needs} = require('../../lib');
const {Enrollment} = require('../../../database');

router.post('/create',
  needs('moduleId', 'body'),
  validCols(Enrollment),
  isLoggedIn(),
  async (req, res, next) => {
    try {
      const vars = Object.assign({studentId: res.locals.loggedIn.id}, req.body);
      const enrollment = await Enrollment.create(vars);
      return res.json(msg('successfully enrolled', enrollment.dataValues));
    } catch (e) {
      return next(e);
    }
  });

router.delete(['/:id', '/:id/delete', '/:id/remove'],
  isLoggedIn(),
  (req, res, next) => Enrollment.findOne({
    id: req.params.id,
    studentId: res.locals.loggedIn.id,
  }).then(enrollment => enrollment.destroy())
    .then(() => res.json(msg('successfully un-enrolled')))
    .catch(err => next(err)));

router.get(['/', '/search'], async (req, res, next) => {
  try {
    const enrollments = await Enrollment.findAll({
      where: req.query || {},
      limit: process.env.MAX_RESULTS || 100,
    }).then(es => es.map(e => e.dataValues));
    let s = `found ${enrollments.length} enrollments`;
    if (req.query && Object.entries(req.query) > 0) {
      s += ` matching given ${Object.keys(req.query).join(', ')}`;
    }
    return res.json(msg(s, enrollments));
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
