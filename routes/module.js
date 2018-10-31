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
const db = require('../database/db.js')();
const {
  msg,
  insertContent,
  insertModule,
  moduleExists,
  errMsg,
  isOfType,
  getCredentials,
  userExists,
} = require('./lib.js');

/**
 * Suggest using POST if an API user uses GET instead of POST for the following actions.
 */
for (const act of ['create', 'delete']) {
  router.get(`/:module/${act}`,
    (req, res) => res.json(errMsg(`use POST to ${act} modules`)));
}

/**
 * Creates a new module.
 *
 * Requires that the module does not already exist.
 */
router.post('/:module/create', async (req, res) => {
  const module = req.params.module;
  if (await moduleExists(module)) {
    return res.json(errMsg(`module ${module} already exists`));
  }
  const maybeCredentials = getCredentials(req);
  if (maybeCredentials === undefined || maybeCredentials === null) {
    return res.json(errMsg(
      'failed to authenticate, you need to provide password in cookies or request body'));
  }
  const {email, password} = maybeCredentials;
  if (await userExists(email, password)) {
    const lastId = await insertContent(email);
    if (insertModule(module, lastId)) {
      return res.json(msg(
        `inserted new module ${module} and linked it to content #${lastId}`));
    } else {
      return res.json(errMsg(
        `failed to insert new module ${module} and link it to content #${lastId}`));
    }
  } else {
    return res.json(errMsg(
      `failed to authenticate user with email ${email} and this password`));
  }
});

/**
 * Deletes a new module.
 *
 * Requires that the module exists.
 */
router.post('/:module/delete', async (req, res) => {
  const module = req.params.module;

  // check if module exists
  if (!await moduleExists(module)) {
    return res.json(errMsg(`module ${module} does not exist`));
  }

  const maybeCredentials = getCredentials(req);
  if (maybeCredentials === undefined || maybeCredentials === null) {
    return res.json(errMsg(
      'failed to authenticate, you need to provide password in cookies or request body'));
  }
  const {email, password} = maybeCredentials;

  // check if the credentials correspond to an existing user
  if (!await userExists(email, password)) {
    return res.json(errMsg(
      `failed to authenticate user with email ${email} and this password`));
  }

  const sql = `SELECT id, email, name
               FROM User AS u
                      INNER JOIN Module AS m
                      INNER JOIN Content AS c
                        on m.content_id = c.id AND u.email = c.creator
               WHERE :module = m.name`;
  const replacements = {module};

  // check if this user is the creator of the module
  return db.query(sql, {replacements}).catch(err => {
    return res.json(errMsg(
      `failed to authenticate, user with email ${email} and this password is not the creator of module ${module}`));
  }).then(rows => {
    if (rows[0].length > 0) {
      const sql = `DELETE
                   FROM Module
                   WHERE name = :module`;
      const replacements = {module};
      return db.query(sql, {replacements})
        .catch(err => {
          return res.json(errMsg(`failed to delete the module`));
        }).then(rows => res.json(msg(`deleted module ${module}`)));
    } else {
      return res.json(errMsg(
        `failed to authenticate, user with email ${email} and this password is not the creator of module ${module}`));
    }
  });
});

/**
 * If an API user tries to query the database for modules's info with POST suggest using GET.
 */
router.post('/:module', (req, res) => {
  return res.json(
    errMsg(`use GET to retrieve info about module ${req.params.module}`));
});

/**
 * Update property to value in a module.
 *
 * Requires that the module exists and value is passed in request body.
 */
router.post('/:module/:property', async (req, res) => {
  const {module, property} = req.params;

  // check if module exists
  if (!await moduleExists(module)) {
    return res.json(errMsg(`module ${module} does not exist`));
  }

  if (!isOfType(req.body, {value: '*'})) {
    return res.json(errMsg(`you need to pass 'value' in request body`));
  }

  const value = req.body.value;

  const maybeCredentials = getCredentials(req);
  if (maybeCredentials === undefined || maybeCredentials === null) {
    return res.json(errMsg(
      'failed to authenticate, you need to provide password in cookies or request body'));
  }
  const {email, password} = maybeCredentials;

  // check if the credentials correspond to an existing user
  if (!await userExists(email, password)) {
    return res.json(errMsg(
      `failed to authenticate user with email ${email} and this password`));
  }

  const sql = `SELECT *
               FROM User AS u
                      INNER JOIN Module AS m
                      INNER JOIN Content AS c
                        on m.content_id = c.id AND u.email = c.creator
               WHERE m.name = :module`;
  const replacements = {module};

  // check if this user is the creator of the module
  db.query(sql, {replacements}).catch(err => {
    return res.json(errMsg(
      `failed to authenticate, user with email ${email} and this password is not the creator of module ${module}`));
  }).then(rows => {
    console.log(rows);
    if (rows[0].length > 0) {
      const sql = `UPDATE Module SET ${property} = :value
                   WHERE name = :module`;
      const replacements = {module, value};
      db.query(sql, {replacements})
        .catch(err => {
          return res.json(errMsg(
            `failed to change value of ${property} in module ${module}`));
        })
        .then(rows => res.json(
          msg(`updated property ${property} of module ${module} to ${value}`)));
    } else {
      return res.json(errMsg(
        `failed to authenticate, user with email ${email} and this password is not the creator of module ${module}`));
    }
  });
});

/**
 * Query the database for a property of a certain module.
 *
 * Requires that the module exists.
 */
router.get('/:module/:property', async (req, res) => {
  const {module, property} = req.params;
  if (!await moduleExists(module)) {
    return res.json(errMsg(`module ${module} does not exist`));
  }
  const replacements = {module};
  const sql = `SELECT *
               FROM Module AS m
                      INNER JOIN Content AS c
                      INNER JOIN User AS u
                        ON u.email = c.creator AND m.content_id = c.id
               WHERE m.name = :module`;
  db.query(sql, {replacements})
    .catch((err) => res.json(errMsg(`failed to find module ${module}`, err)))
    .then((rows) => {
      if (rows[0].length >= 1) {
        let result = rows[0][0];
        if (property in result) {
          return res.json(
            msg(`found module ${module} with property ${property}`,
              result[property]));
        } else {
          return res.json(errMsg(
            `could not locate property ${property} on module ${module}`));
        }
      } else {
        return res.json(errMsg(`failed to find module ${module}`));
      }
    });
});

/**
 * Suggest using GET when an API user uses POST instead of GET to get a module's property.
 */
router.post('/:module', async (req, res) => {
  return res.json(errMsg('use GET to retrieve info about a module'));
});

/**
 * Shows all info about a module.
 *
 * Requires that the module exists.
 */
router.get('/:module', async (req, res) => {
  const module = req.params.module;
  if (!await moduleExists(module)) {
    return res.json(errMsg(`module ${module} does not exist`));
  }
  const replacements = {module};
  const sql = `SELECT id, name, field, email, is_blocked
               FROM Module AS m
                      INNER JOIN User AS u
                      INNER JOIN Content AS c
                        ON m.content_id = c.id AND u.email = c.creator
               WHERE m.name = :module`;
  db.query(sql, {replacements}).catch((err) => {
    return res.json(errMsg(`failed to find module ${module}`, err));
  }).then((rows) => {
    if (rows[0].length >= 1) {
      let result = rows[0][0];
      return res.json(msg(`found module ${module}`, result));
    } else {
      return res.json(errMsg(`failed to find module ${module}`));
    }
  });
});

/**
 * If none of the above match, shows help.
 */
router.all(/.*/, (req, res) => {
  return res.json({
    status: 'CONFUSED',
    msg: 'nothing here, try looking at routes',
    routes: {
      GET: {
        ':module/:property': 'to lookup a property of a module (the module must exist)',
        ':module': 'to lookup a module (the module must exist)',
      },
      POST: {
        ':module/create': 'to create module with name :module (you must provide credentails in cookies or request body, another module with the same name cannot exist)',
        ':module/delete': 'to delete module with name :module (you must provide credentails in cookies or request body, the module must exist)',
        ':module/:property': 'to set property to value in a module (`value` needs to be set in request body)',
      },
    },
  });
});

module.exports = router;
