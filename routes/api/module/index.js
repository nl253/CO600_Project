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

/**
 * Update property to value in a module.
 *
 * Requires that the module exists and value is passed in request body.
 */
router.post('/:module/:property', () => undefined);

/**
 * Query the database for a property of a certain module.
 *
 * Requires that the module exists.
 */
router.get('/:module/:property', () => undefined);

/**
 * Suggest using GET when an API user uses POST instead of GET to get a module's property.
 */
router.post('/:module', () => undefined);

/**
 * Shows all info about a module.
 *
 * Requires that the module exists.
 */
router.get('/:module', () => undefined);

/**
 * If none of the above match, shows help.
 */
suggestRoutes(router, /.*/, {
  GET: {
    ':module/:property': 'to lookup a property of a module (the module must exist)',
    ':module': 'to lookup a module (the module must exist)',
  },
  POST: {
    ':module/create': 'to create module with name :module (you must provide credentials in cookies or request body, another module with the same name cannot exist)',
    ':module/delete': 'to delete module with name :module (you must provide credentials in cookies or request body, the module must exist)',
    ':module/:property': 'to set property to value in a module (`value` needs to be set in request body)',
  },
});

module.exports = router;
