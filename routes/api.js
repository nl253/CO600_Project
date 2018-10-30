/**
 * This is where the REST API is defined. This module does not do much itself,
 * it only registers other routers.
 * A word of caution:
 *
 * Although it would make sense to use DELETE, UPDATE and
 * PUT, sadly, they don't allow to extract data from the request body.
 * Whenever sensitive data needs to be sent
 * e.g. password or new value for a potentially sensitive property
 * (such as password), POST is used instead of get.
 *
 * I am using raw SQL here because I am comfortable with SQL and it means
 * I don't need to learn sequelize'mod syntax for defining, updating and
 * querying entities. The goal is to reduce complexity.
 *
 * The aim is to create a REST API. I try to make it feel like calling a method
 * in an object oriented programming language.
 *
 * E.g.:
 *
 * To set password on user `/<user_email>/<property>` and sent the `value` in
 * POST request body.
 *
 * This is similar to calling a setter.
 *
 * E.g.:
 *
 * To unregister i.e. delete account, simply "call" unregister on the entity
 * `/<user_email>/unregister` and pass `password` in POST request body.
 *
 * This is similar to calling a method `user.unregister()`.
 *
 * Passwords are SHA256 hashed before storing and before comparing.
 *
 * @author Norbert
 */
const express = require('express');
const router = express.Router();

for (const mod of ['user', 'module']) {
  router.all(`/${mod}s`, (req, res) => {
    res.json({
      status: 'ERROR',
      msg: `did you mean '${mod}'?`,
    });
  });
  router.use(`/${mod}`, require(`./${mod}.js`));
}

router.all('/', (req, res) => {
  res.json({
    status: 'CONFUSED',
    msg: 'nothing here, try looking at routes',
    routes: {
      'user': 'user-related operations e.g.: register, lookup, delete',
    },
  });
});

module.exports = router;
