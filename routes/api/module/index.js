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

const {MissingDataErr} = require('../../errors');
const {Session, Module, Enrollment} = require('../../database');
const router = require('express').Router();

const {suggestRoutes, msg} = require('../lib');

// Project
const {needs, hasFreshSess, exists, decrypt} = require('../../lib');

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

router.get('/create',
  needs('token', 'cookies'),
  exists(Session, (req) => ({token: decrypt(decodeURIComponent(req.cookies.token))})),
  hasFreshSess((req) => decrypt(decodeURIComponent(req.cookies.token))),
  (req, res, next) => Module.create({
    authorId: res.locals.loggedIn.id,
  }).then(module => res.json(msg(`successfully created module`, module.id)))
    .catch(err => next(err)));

router.post('/:id',
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

// router.get('/:module', () => undefined);

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
