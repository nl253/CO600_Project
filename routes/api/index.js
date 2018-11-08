/**
 * This is where the REST API is defined. This module does not do much itself,
 * it only registers other routers.
 *
 * A word of caution:
 *
 * Although it would make sense to use DELETE, UPDATE and
 * PUT, sadly, they don't allow to extract data from the request body.
 * Whenever sensitive data needs to be sent
 * e.g. password or new value for a potentially sensitive property
 * (such as password), POST is used instead of GET.
 *
 * The aim is to create a REST API. I try to make it feel like calling a method
 * in an object oriented programming language.
 *
 * E.g.:
 *
 * To set password on user type `/<user_email>/<property>` and send the `value`
 * in the request body.
 *
 * This is similar to calling a setter.
 *
 * E.g.:
 *
 * To unregister i.e. delete account, simply "call" unregister on the entity
 * `/<user_email>/unregister` and pass `password` in the request body.
 *
 * This is similar to calling a method `user.unregister()`.
 *
 * Passwords are SHA256 hashed before storing and before comparing.
 *
 * Status codes try to follow the spec, see {@link https://www.wikiwand.com/en/List_of_HTTP_status_codes HTTP status codes}.
 *
 * @author Norbert
 */
const {join} = require('path');
const {existsSync} = require('fs');

const express = require('express');
const router = express.Router();

const {suggestRoutes, log, errMsg} = require('./lib');
const {TypoErr, NotImplYetErr} = require('./errors');

const MODELS = [
  'User',
  'Report',
  'QuizQuestion',
  'Answer',
  'Rating',
  'Module',
  'Lesson',
  'Enrollment',
  'Comment',
  'Definition',
  'Invitation',
  'OpenQuestion'];

for (const mod of MODELS.map(key => key.toLowerCase())) {

  const badPlural = new TypoErr(mod);

  router.all(`/${mod}s`,
    (req, res) => res.status(badPlural.code).json(errMsg(badPlural)));

  if (existsSync(join(__dirname, `${mod}.js`)) || existsSync(join(__dirname, mod, 'index.js'))) {
    log.info(`mounting the ${mod} part of the api to /api/${mod}`);
    router.use(`/${mod}`, require(`./${mod}`));

  } else {
    const notDone = new NotImplYetErr(`${mod} part of the REST API`);
    router.all(`/${mod}`,
      (req, res) => res.status(notDone.code).json(errMsg(notDone)));
  }
}

suggestRoutes(router, /.*/, {
  user: 'user-related operations e.g.: register, lookup, delete',
  module: 'module-related operations e.g.: register, lookup, delete',
});

module.exports = router;
