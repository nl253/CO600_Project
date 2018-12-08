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

const {MissingDataErr, NotLoggedIn, InvalidRequestErr} = require('../../errors');
const {Session, Module, Enrollment, Lesson, File} = require('../../database');
const router = require('express').Router();

const {suggestRoutes, msg} = require('../lib');

// Project
const {needs, hasFreshSess, exists, decrypt, validColumns} = require('../../lib');

router.get([
  '/:moduleId/:lessonId/:fileName/delete',
  '/:moduleId/:lessonId/:fileName/remove'], async (req, res) => {
  if (!res.locals.loggedIn) return next(new NotLoggedIn());
  try {
    (await File.findOne({
      where: {
        lessonId: req.params.lessonId,
        name: req.params.fileName,
      }
    })).destroy();
    return res.json(msg(`deleted ${req.params.fileName} from lesson`));
  } catch (e) {
    return next(e);
  }
});

router.get([
  '/:moduleId/:lessonId/delete',
  '/:moduleId/:lessonId/remove'], async (req, res) => {
  if (!res.locals.loggedIn) return next(new NotLoggedIn());
  try {
    (await Lesson.findOne({
      where: {
        id: req.params.lessonId,
        moduleId: req.params.moduleId,
      }
    })).destroy();
    return res.json(msg(`deleted lesson from module`));
  } catch (e) {
    return next(e);
  }
});

router.get('/:id/lesson/create',
  needs('token', 'cookies'),
  exists(Session, (req) => ({token: decrypt(decodeURIComponent(req.cookies.token))})),
  hasFreshSess((req) => decrypt(decodeURIComponent(req.cookies.token))),
  exists(Module, (req) => ({id: req.params.id})),
  (req, res, next) => Lesson.create({moduleId: req.params.id,})
    .then(lesson => res.json(msg(`successfully created lesson`, lesson.id)))
    .catch(err => next(err)));

router.get('/:id/enroll',
  exists(Module, (req) => ({id: req.params.id})),
  needs('token', 'cookies'),
  exists(Session, (req) => ({token: decrypt(decodeURIComponent(req.cookies.token))})),
  hasFreshSess((req) => decrypt(decodeURIComponent(req.cookies.token))),
  (req, res, next) => Enrollment.create({
    moduleId: req.params.id,
    studentId: res.locals.loggedIn.id,
  }).then(() => res.json(msg('successfully enrolled')))
    .catch(err => next(err)));

router.get('/:id/unenroll',
  needs('token', 'cookies'),
  exists(Session, (req) => ({token: decrypt(decodeURIComponent(req.cookies.token))})),
  hasFreshSess((req) => decrypt(decodeURIComponent(req.cookies.token))),
  exists(Module, (req) => ({id: req.params.id})),
  (req, res, next) => Enrollment.findOne({
    moduleId: req.params.id,
    studentId: res.locals.loggedIn.email,
  }).then(enrollment => enrollment.destroy())
    .then(() => res.json(msg('successfully un-enrolled')))
    .catch(err => next(err)));

router.get(['/:id/delete', '/:id/remove', '/:id/destroy'],
  needs('token', 'cookies'),
  exists(Session, (req) => ({token: decrypt(decodeURIComponent(req.cookies.token))})),
  hasFreshSess((req) => decrypt(decodeURIComponent(req.cookies.token))),
  exists(Module, (req) => ({id: req.params.id})),
  (req, res, next) => Module.findOne({where: {id: req.params.id}})
    .then(module => module.destroy())
    .then(() => res.json(msg(`successfully deleted module`)))
    .catch(err => next(err)));


router.get('/create',
  needs('token', 'cookies'),
  exists(Session, (req) => ({token: decrypt(decodeURIComponent(req.cookies.token))})),
  hasFreshSess((req) => decrypt(decodeURIComponent(req.cookies.token))),
  (req, res, next) => Module.create({
    authorId: res.locals.loggedIn.id,
  }).then(module => res.json(msg(`successfully created module`, module.id)))
    .catch(err => next(err)));


router.get(['/', '/search'],
  validColumns(Module, (req) => Object.keys(req.query)),
  (req, res) => {
    const queryParams = {};
    for (const q in req.query) {
      queryParams[q] = req.query[q];
    }
    return Module.findAll({
      limit: process.env.MAX_RESULTS || 100,
      where: queryParams,
    }).then(modules => modules.map(r => r.dataValues))
      .then(modules => {
        let s = `found ${modules.length} modules`;
        if (Object.keys(req.query).length > 0) {
          s += ` matching given ${Object.keys(req.query).join(', ')}`;
        }
        return res.json(msg(s, modules));
      });
  });

router.post(['/:id', '/:id/update'],
  needs('token', 'cookies'),
  exists(Session, (req) => ({token: decrypt(decodeURIComponent(req.cookies.token))})),
  hasFreshSess((req) => decrypt(decodeURIComponent(req.cookies.token))),
  exists(Module, (req) => ({id: req.params.id})),
  (req, res, next) => Module.findOne({
    where: {
      authorId: res.locals.loggedIn.id,
      id: req.params.id
    },
  }).then(module => req.body && Object.entries(req.body).length >= 0
    ? module.update(req.body)
    : Promise.reject(new MissingDataErr('data to modify', 'request body')))
    .then(() => res.json(msg('successfully updated the module')))
    .catch(err => next(err)));

router.post(['/:moduleId/:lessonId', '/:moduleId/:lessonId/update'],
  needs('token', 'cookies'),
  exists(Session, (req) => ({token: decrypt(decodeURIComponent(req.cookies.token))})),
  validColumns(Lesson, (req) => (req.body)),
  hasFreshSess((req) => decrypt(decodeURIComponent(req.cookies.token))),
  exists(Lesson, (req) => ({id: req.params.lessonId})),
  async (req, res, next) => {
    try {
      const lesson = await Lesson.findOne({
        where: {
          moduleId: req.params.moduleId,
          id: req.params.lessonId,
        },
      });
      await lesson.update(req.body);
      return res.json(msg('updated lesson'));
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
