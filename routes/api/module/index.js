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

const msg = require('../lib').msg;
const {decrypt} = require('../../lib');
const {Session, Module, Enrollment, Lesson} = require('../../database');
const router = require('express').Router();

const {suggestRoutes} = require('../lib');

// Project
const {
  needs,
  hasFreshSess,
  exists,
  validColumns,
  notExists,
  notRestrictedColumns,
} = require('../../lib');

/**
 * Creates a new module.
 *
 * Requires that the module does not already exist.
 */
router.post('/:module/create', () => undefined);

router.get('/:module/enroll',
  exists(Module, (req) => ({name: req.params.module})),
  needs('token', 'cookies'),
  exists(Session,
    (req) => ({token: decrypt(decodeURIComponent(req.cookies.token))})),
  hasFreshSess((req) => decrypt(decodeURIComponent(req.cookies.token))),
  (req, res) => Enrollment.create({
    module: req.params.module,
    student: res.locals.loggedIn.email,
  }).then(() => res.json(msg('successfully enrolled'))));

router.get('/:module/unenroll',
  exists(Module, (req) => ({name: req.params.module})),
  needs('token', 'cookies'),
  exists(Session, (req) => ({token: decrypt(decodeURIComponent(req.cookies.token))})),
  // (req, res, next) => exists(Enrollment, (req) => ({
  //   student: res.locals.loggedIn.email,
  //   module: req.params.module,
  // }))(),
  hasFreshSess((req) => decrypt(decodeURIComponent(req.cookies.token))),
  (req, res) => Enrollment.findOne({
    module: req.params.module,
    student: res.locals.loggedIn.email,
  }).then(enrollment => enrollment.destroy())
    .then(() => res.json(msg('successfully unenrolled'))));


router.get('/:module', () => undefined);

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
