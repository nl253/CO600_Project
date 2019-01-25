// Project
const {validCols, isLoggedIn, needs} = require('../../lib');
const {msg} = require('../lib');
const {NoSuchRecordErr, ValidationErr} = require('../../errors');
const {Sequelize, Enrollment, Rating, sequelize} = require('../../../database');

// 3rd Party
const router = require('express').Router();

router.post('/create',
  validCols(Rating),
  isLoggedIn(),
  needs('moduleId', 'body'),
  needs('stars', 'body'),
  async (req, res, next) => {
    try {
      if (await Enrollment.findOne({where: {
          studentId: res.locals.loggedIn.id,
          moduleId: req.body.moduleId,
        }}) === null) {
        return next(new ValidationErr('rating', 'not enrolled in the module'));
      }
      if (await Rating.findOne({where: {
          moduleId: req.body.moduleId,
          raterId: res.locals.loggedIn.id,
        }}) !== null) {
        return next(new ValidationErr('rating', 'already rated'));
      }
      req.body.raterId = res.locals.loggedIn.id;
      const rating = await Rating.create(req.body);
      return res.json(msg('created rating', rating.dataValues));
    } catch (e) {
      return next(e);
    }
  });

router.delete(['/:id', '/:id/remove', '/:id/delete'],
  isLoggedIn(),
  async (req, res, next) => {
    const rating = await Rating.findOne({
      where: {raterId: res.locals.loggedIn.id, id: req.params.id}});
    if (rating === null) {
      return next(new NoSuchRecordErr('Rating', {
        id: req.params.id,
        raterId: res.locals.loggedIn.id,
      }));
    }
    await rating.destroy();
    return res.json(msg('deleted rating'));
  });

router.get(['/search', '/'],
  validCols(Rating, 'query', []),
  async (req, res, next) => {
    try {
      if (req.query.stars) {
        req.query.stars = {[Sequelize.Op.gte]: req.query.stars};
      }
      if (req.query.comment) {
        req.query.comment = {[Sequelize.Op.like]: `%${req.query.comment}%`};
      }
      for (const dateAttr of ['createdAt', 'updatedAt']) {
        if (req.query[dateAttr]) {
          req.query[dateAttr] = {[Sequelize.Op.gte]: new Date(Date.parse(req.query[dateAttr]))};
        }
      }
      const ratings = await Rating.findAll({
        where: req.query,
        order: sequelize.col('stars'),
        limit: process.env.MAX_RESULTS || 100,
      }).then(rs => rs.map(r => r.dataValues));
      let s = `found ${ratings.length} ratings`;
      if (Object.keys(req.query).length > 0) {
        s += ` matching given ${Object.keys(req.query).join(', ')}`;
      }
      return res.json(msg(s, ratings));
    } catch (e) {
      return next(e);
    }
  });

module.exports = router;
