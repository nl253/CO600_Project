const NoSuchRecord = require('../../errors').NoSuchRecordErr;
const validCols = require('../../lib').validCols;
const isLoggedIn = require('../../lib').isLoggedIn;
const {Module, Sequelize} = require('../../../database');
const router = require('express').Router();

const {msg} = require('../lib');

router.delete(['/:id', '/:id/delete', '/:id/remove'],
  isLoggedIn(),
  async (req, res, next) => {
    try {
      const mod = await Module.findOne({where: {
          id: req.params.id,
          authorId: res.locals.loggedIn.id,
      }});
      if (mod === null) {
        throw new NoSuchRecord('Module', {
          id: req.params.id,
          authorId: res.locals.loggedIn.id,
        });
      }
      await mod.destroy();
      return res.json(msg(`successfully deleted module`));
    } catch (e) {
      return next(e);
    }
  });


router.post('/create',
  isLoggedIn(),
  validCols(Module, 'body', ['createdAt', 'updatedAt', 'authorId']),
  (req, res, next) => Module
    .create(Object.assign({authorId: res.locals.loggedIn.id}, req.body))
    .then(module => res.json(msg(`successfully created module`, module.dataValues)))
    .catch(err => next(err)));


router.post(['/:id', '/:id/update', '/:id/modify'],
  validCols(Module, 'body', ['createdAt', 'updatedAt', 'authorId']),
  isLoggedIn(),
  async (req, res, next) => {
    try {
      const module = await Module.findOne({
        where: {
          authorId: res.locals.loggedIn.id,
          id: req.params.id
        },
      });
      if (module === null) {
        throw new NoSuchRecord('Module', {id: req.params.id});
      }
      return res.json(msg('updated module', await module.update(req.body).then(m => m.dataValues)));
    } catch (e) {
      return next(e);
    }
  });


router.get(['/', '/search'],
  validCols(Module, 'query'),
  async (req, res, next) => {
    try {
      if (req.query.name) {
        req.query.name = {[Sequelize.Op.like]: `%${req.query.name}%`};
      }
      if (req.query.topic) {
        req.query.topic = {[Sequelize.Op.like]: `%${req.query.topic}%`};
      }
      if (req.query.summary) {
        req.query.summary = {[Sequelize.Op.like]: `%${req.query.summary}%`};
      }
      if (req.query.createdAt) {
        req.query.createdAt = new Date(Date.parse(req.query.createdAt));
        req.query.createdAt = {[Sequelize.Op.gte]: req.query.createdAt};
      }
      if (req.query.updatedAt) {
        req.query.updatedAt = new Date(Date.parse(req.query.updatedAt));
        req.query.updatedAt = {[Sequelize.Op.gte]: req.query.updatedAt};
      }
      const modules = await Module.findAll({
        limit: process.env.MAX_RESULTS || 100,
        where: req.query,
      }).then(ms => ms.map(m => m.dataValues));
      let s = `found ${modules.length} modules`;
      if (Object.keys(req.query).length > 0) {
        s += ` matching given ${Object.keys(req.query).join(', ')}`;
      }
      return res.json(msg(s, modules));
    } catch (e) {
      return next(e);
    }
  });

module.exports = router;
