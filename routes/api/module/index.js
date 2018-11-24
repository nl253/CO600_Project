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

const router = require('express').Router();

const {suggestRoutes} = require('../lib');


/**
 * Creates a new module.
 *
 * Requires that the module does not already exist.
 */
router.post('/:module/create', () => undefined);

/**
 * Deletes a new module.
 *
 * Requires that the module exists.
 */
router.post('/:module/delete', () => undefined);

/**
 * If an API user tries to query the database for modules's info with POST suggest using GET.
 */
router.post('/:module', () => undefined);


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
