// 3rd Party
const DeniedErr = require('../../errors').DeniedErr;
const {isLoggedIn} = require('../../lib');
const {msg} = require('../lib');
const {NoSuchRecordErr} = require('../../errors');
const router = require('express').Router();

// Project
const {needs, validCols} = require('../../lib');

const {Question, Module, sequelize, Sequelize} = require('../../../database');

router.post('/create',
  isLoggedIn(),
  needs('moduleId', 'body'),
  validCols(Question),
  async (req, res, next) => {
    try {
      const {moduleId} = req.body;
      const mod = await Module.findOne({where: {id: moduleId}});
      if (mod.authorId !== res.locals.loggedIn.id) {
        throw new DeniedErr(`create question for module ${moduleId}`);
      }
      if (!mod) {
        throw new NoSuchRecordErr('Module', {moduleId});
      }
      let order = await sequelize.query(
          `SELECT max(id)
           FROM (SELECT id
                 FROM Question
                 WHERE moduleId = :moduleId)`, {replacements: {moduleId}})
        .spread((res, meta) => res[0]['max(id)']);
      if (!order) order = 1;
      order++;
      const question = await Question.create(Object.assign({order}, req.body)).then(q => q.dataValues);
      return res.json(msg('created question', question));
    } catch (e) {
      return next(e);
    }
  });

router.post(['/:id', '/:id/modify', '/:id/update'],
  isLoggedIn(),
  validCols(Question),
  async (req, res, next) => {
    try {
      let question = await Question.findOne({where: {id: req.params.id}});
      const mod = await Module.findOne({where: {
          authorId: res.locals.loggedIn.id,
          id: question.moduleId,
        }});
      if (mod === null) {
        throw new NoSuchRecordErr('Module', {
          authorId: res.locals.loggedIn.id,
          id: question.moduleId,
        });
      }
      question = await question.update(req.body);
      return res.json(msg('updated question', question.dataValues));
    } catch (e) {
      return next(e);
    }
  });

router.delete(['/:id', '/:id/delete', '/:id/remove'],
  isLoggedIn(),
  async (req, res, next) => {
  try {
    const question = await Question.findOne({where: {id: req.params.id}});
    if (question === null) {
      throw new NoSuchRecordErr('Question', {id: req.query.id});
    }
    const mod = await Module.findOne({where: {
        authorId: res.locals.loggedIn.id,
        id: question.moduleId,
      }});
    if (mod === null) {
      throw new NoSuchRecordErr('Module', {
        authorId: res.locals.loggedIn.id,
        id: question.moduleId,
      });
    }
    await question.destroy();
    return res.json(msg('deleted question'));
  } catch (e) {
    return next(e);
  }
});

router.get(['/', '/search'], validCols(Question, 'query', []),
  async (req, res, next) => {
    try {
      for (const attr of ['name', 'correctAnswer', 'badAnswer1', 'badAnswer2', 'badAnswer3']) {
        if (req.query[attr]) {
          req.query[attr] = {[Sequelize.Op.like]: `%${req.query[attr]}%`};
        }
      }
      for (const dateAttr of ['createdAt', 'updatedAt']) {
        if (req.query[dateAttr]) {
          req.query[dateAttr] = {[Sequelize.Op.gte]: new Date(Date.parse(req.query[dateAttr]))};
        }
      }
      const questions = await Question.findAll({
        where: req.query,
        order: sequelize.col('name'),
        limit: process.env.MAX_RESULTS || 100,
      }).then(qs => qs.map(q => q.dataValues));
      let s = `found ${questions.length} questions`;
      if (Object.entries(req.query).length > 0) {
        s += ` given ${Object.keys(req.query).join(', ')}`;
      }
      return res.json(msg(s, questions));
    } catch (e) {
      return next(e);
    }
  });

module.exports = router;
