// 3rd Party
const {suggestRoutes, msg} = require('../lib');
const {NoSuchRecordErr} = require('../../errors');
const router = require('express').Router();

// Project
const {needs, validCols} = require('../../lib');

const {Question, sequelize} = require('../../../database');

router.post('/create',
  needs('moduleId', 'body'),
  validCols(Question),
  async (req, res, next) => {
    try {
      const {moduleId} = req.body;
      let order = await sequelize.query(
          `SELECT max(id)
           FROM (SELECT id
                 FROM Question
                 WHERE moduleId = :moduleId)`, {replacements: {moduleId}})
        .spread((res, meta) => res[0]['max(id)']);
      if (!order) order = 1;
      order++;
      console.log(order);
      const question = await Question.create(Object.assign({order}, req.body)).then(q => q.dataValues);
      return res.json(msg('deleted question', question));
    } catch (e) {
      return next(e);
    }
  });

router.post(['/:id', '/:id/modify', '/:id/update'], validCols(Question),
  async (req, res, next) => {
    try {
      let question = await Question.findOne({where: {id: req.params.id}});
      question = await question.update(req.body);
      return res.json(msg('updated question', question.dataValues));
    } catch (e) {
      return next(e);
    }
  });

router.delete('/:id', async (req, res, next) => {
  try {
    const question = await Question.findOne({where: {id: req.params.id}});
    if (question === null) {
      return next(
        new NoSuchRecordErr('Question', {id: req.query.id}));
    }
    await question.destroy();
    return res.json(msg('deleted question'));
  } catch (e) {
    return next(e);
  }
});

router.get(['/', '/search'], validCols(Question, 'query'),
  async (req, res, next) => {
    try {
      const questions = await Question.findAll({
        where: req.query,
        limit: process.env.MAX_RESULTS || 100,
      }).then(qs => qs.map(q => q.dataValues));
      let s = `found ${questions.length} questions`;
      if (Object.entries(req.query).length > 0) {
        s += ` given ${Object.keys(
          req.query).join(', ')}`;
      }
      return res.json(msg(s, questions));
    } catch (e) {
      return next(e);
    }
  });

suggestRoutes(router, /.*/, {});


module.exports = router;
