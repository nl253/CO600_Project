// 3rd Party
const validCols = require('../../lib').validCols;
const isLoggedIn = require('../../lib').isLoggedIn;
const APIErr = require('../../errors').APIErr;
const NotLoggedIn = require('../../errors').NotLoggedIn;
const {suggestRoutes, msg} = require('../lib');
const {NoSuchRecord, BadMethodErr} = require('../../errors');
const router = require('express').Router();

// Project
const {needs} = require('../../lib');

const {Lesson, Rating} = require('../../../database');

router.post('/create',
  validCols(Rating),
  isLoggedIn(),
  needs('moduleId', 'body'),
  async (req, res, next) => {
    if (await Rating.findOne({where: {moduleId: req.body.moduleId, raterId: res.locals.loggedIn.id}}) !== null) {
      return next(new APIErr('already rated', 400));
    }
    const rating = await Rating.create(Object.assign( req.body, {raterId: res.locals.loggedIn.id}));
    return res.json(msg('created rating', rating.dataValues));
  });

router.get('/', async (req, res, next) => {
  return res.redirect(`/api/rating/search?raterId=${res.locals.loggedIn.id}`);
});

router.delete(['/:id', '/:id/remove', '/:id/delete'],
  isLoggedIn(),
  async (req, res, next) => {
    const rating = await Rating.findOne({where: {raterId: res.locals.loggedIn.id, id: req.params.id}});
    if (rating === null) return next(new NoSuchRecord('Rating', {id: req.params.id, raterId: res.locals.loggedIn.id}));
    await rating.destroy();
    return res.json(msg('deleted rating'));
  });

router.get('/search',
  validCols(Rating, 'query'),
  async (req, res, next) => {
    const ratings = await Rating.findAll({
      where: req.query,
      limit: process.env.MAX_RESULTS || 100,
    }).then(rs => rs.map(r => r.dataValues));
    let s = `found ${ratings.length} ratings`;
    if (Object.keys(req.query).length > 0) {
      s += `matching given ${Object.keys(req.query).join(', ')}`;
    }
    return res.json(msg(s, ratings));
  });

suggestRoutes(router, /.*/, {});

module.exports = router;
