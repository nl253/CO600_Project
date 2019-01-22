// 3rd Party

const validCols = require('../../lib').validCols;
const isLoggedIn = require('../../lib').isLoggedIn;
const {suggestRoutes, msg} = require('../lib');
const {NoSuchRecordErr, ValidationErr} = require('../../errors');
const {Sequelize, Enrollment} = require('../../../database');
const router = require('express').Router();

// Project
const {needs} = require('../../lib');

const {Rating} = require('../../../database');

router.post('/create',
  validCols(Rating),
  isLoggedIn(),
  needs('moduleId', 'body'),
  needs('stars', 'body'),
  async (req, res, next) => {
    try {
      if (await Enrollment.findOne({where: {studentId: res.locals.loggedIn.id, moduleId: req.body.moduleId}}) === null) {
        return next(new ValidationErr('rating', 'not enrolled in the module'));
      }
      if (await Rating.findOne({where: {moduleId: req.body.moduleId, raterId: res.locals.loggedIn.id}}) !== null) {
        return next(new ValidationErr('rating', 'already rated'));
      }
      req.body.raterId = res.locals.loggedIn.id;
      const rating = await Rating.create(req.body);
      return res.json(msg('created rating', rating.dataValues));
    } catch (e) {
      return next(e);
    }
  });

// router.get('/', async (req, res, next) => res.redirect(`/api/rating/search?raterId=${res.locals.loggedIn.id}`));

router.delete(['/:id', '/:id/remove', '/:id/delete'],
  isLoggedIn(),
  async (req, res, next) => {
    const rating = await Rating.findOne({where: {raterId: res.locals.loggedIn.id, id: req.params.id}});
    if (rating === null) return next(new NoSuchRecordErr('Rating', {id: req.params.id, raterId: res.locals.loggedIn.id}));
    await rating.destroy();
    return res.json(msg('deleted rating'));
  });

router.get(['/search', '/'],
  validCols(Rating, 'query'),
  async (req, res, next) => {
    if (req.query.stars) {
      req.query.stars = {[Sequelize.Op.gte]: req.query.stars};
    }
    const ratings = await Rating.findAll({
      where: req.query,
      limit: process.env.MAX_RESULTS || 100,
    }).then(rs => rs.map(r => r.dataValues));
    let s = `found ${ratings.length} ratings`;
    if (Object.keys(req.query).length > 0) {
      s += ` matching given ${Object.keys(req.query).join(', ')}`;
    }
    return res.json(msg(s, ratings));
  });

suggestRoutes(router, /.*/, {});

module.exports = router;
