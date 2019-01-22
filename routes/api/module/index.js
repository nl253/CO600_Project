/**
 * This module implements the Module model and operations on modules such as
 * updating fields, deleting modules, creating new modules in the database.
 *
 * I tried to make it as user-friendly as possible so if you occasionally use GET
 * instead of POST or forget to add a value to the request body the API will
 * suggest what you might want to do.
 *
 * However, this is at the cost of firing more queries. E.q. before I see if you can
 * update a module value I will first check:
 *
 * - that the module you want to modify exists (query #1),
 * - that there is a user with your credentials (query #2),
 * - that you are the owner of the module (query #3),
 * - finally I'll carry out the UPDATE (query #4).
 *
 * If anything goes wrong in between those steps you'll be notified what went wrong.
 *
 * @author Norbert
 */

const NoSuchRecord = require('../../errors').NoSuchRecordErr;
const validCols = require('../../lib').validCols;
const isLoggedIn = require('../../lib').isLoggedIn;
const {MissingDataErr} = require('../../errors');
const {Session, Module, Lesson, File, Sequelize} = require('../../../database');
const router = require('express').Router();

const {suggestRoutes, msg, log} = require('../lib');

// Project
const {needs, decrypt} = require('../../lib');


router.delete(['/:id', '/:id/delete', '/:id/remove'],
  isLoggedIn(),
  (req, res, next) => Module.findOne({where: {id: req.params.id}})
    .then(module => module.destroy())
    .then(() => res.json(msg(`successfully deleted module`)))
    .catch(err => next(err)));


router.post('/create', isLoggedIn(),
  (req, res, next) => Module.create(Object.assign({authorId: res.locals.loggedIn.d}, req.body))
    .then(module => res.json(msg(`successfully created module`, module)))
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
        return next(new NoSuchRecord('Module', {id: req.params.id}));
      }
      if (Object.keys(req.body).length === 0) {
        return next(new MissingDataErr('data to modify', 'request body'));
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


/**
 * If none of the above match, shows help.
 */
suggestRoutes(router, /.*/, {
  GET: {
    '/:module': 'to lookup a module (the module must exist)',
    '/:module/delete': 'to delete a module (you must be it\'s creator & provide a a valid session token in the Cookie header)',
    '/': 'to search through modules',
  },
  POST: {
    '/': 'to update a module (you must be it\'s creator & provide a a valid session token in the Cookie header)',
    '/create': 'to create a module (you must provide a a valid session token in the Cookie header)',
  },
});

module.exports = router;
