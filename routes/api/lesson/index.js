// 3rd Party
const {validCols, needs, isLoggedIn} = require('../../lib');
const {suggestRoutes, msg} = require('../lib');
const {NoSuchRecord, NotLoggedIn, DeniedErr} = require('../../errors');
const router = require('express').Router();

const {Lesson, Module, User, sequelize} = require('../../../database');

router.delete('/:id', isLoggedIn(),
  async (req, res) => {
    if (!res.locals.loggedIn) return new NotLoggedIn();
    try {
      const lesson = await Lesson.findOne({where: {id: req.params.id}});
      if (lesson === null) {
        return new NoSuchRecord('Lesson',
          {id: req.params.id});
      }
      const module = await Module.findOne({where: {id: lesson.moduleId}});
      const author = await User.findOne({where: {id: module.authorId}});
      if (author.id !== res.locals.loggedIn.id) {
        return DeniedErr(
          `delete lesson ${req.params.id}`);
      }
      await lesson.destroy();
      return res.json(msg(`deleted lesson`));
    } catch (e) {
      return next(e);
    }
  });

router.post('/create',
  needs('moduleId', 'body'),
  isLoggedIn(),
  validCols(Lesson),
  async (req, res, next) => {
    try {
      const {moduleId} = req.body;
      let order = await sequelize.query(`SELECT max(id)
                                           FROM (SELECT id
                                                 FROM Lesson
                                                 WHERE moduleId = :moduleId)`,
        {replacements: {moduleId}})
        .spread((res, meta) => res[0]['max(id)']);
      if (!order) order = 1;
      order++;
      const lesson = await Lesson.create(Object.assign({order}, req.body));
      return res.json(msg(`successfully created lesson`, lesson.dataValues));
    } catch (err) {
      return next(err);
    }
  });

router.post(['/:id', '/:id/update', '/:id/modify'], isLoggedIn(),
  async (req, res, next) => {
    if (!res.locals.loggedIn) return new NotLoggedIn();
    try {
      const lesson = await Lesson.findOne({where: {id: req.params.id}});
      if (lesson === null) {
        return new NoSuchRecord('Lesson',
          {id: req.params.id});
      }
      const module = await Module.findOne({where: {id: lesson.moduleId}});
      const author = await User.findOne({where: {id: module.authorId}});
      if (author.id !== res.locals.loggedIn.id) {
        return DeniedErr(
          `delete lesson ${req.params.id}`);
      }
      await lesson.update(req.body);
      return res.json(msg('updated lesson'));
    } catch (e) {
      return next(e);
    }
  });

router.get(['/', '/search'], validCols(Lesson, 'query'),
  async (req, res, next) => {
    const lessons = await Lesson.findAll({
      where: req.query,
      order: sequelize.col('order'),
      limit: process.env.MAX_RESULTS || 100,
    }).then(ls => ls.map(l => l.dataValues));
    let s = `found ${lessons.length} lessons`;
    if (Object.entries(req.query).length > 0) {
      s += ` matching given ${Object.keys(req.query).join(', ')}`;
    }
    return res.json(msg(s, lessons));
  });

suggestRoutes(router, /.*/, {});

module.exports = router;
