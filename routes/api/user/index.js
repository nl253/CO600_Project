// 3rd Party
const {suggestRoutes, msg} = require('../lib');
const {NoSuchRecord, BadMethodErr} = require('../../errors');
const router = require('express').Router();

// Project
const {
  encrypt,
  decrypt,
  needs,
  hasFreshSess,
  exists,
  validColumn,
  validColumns,
  notExists,
  notRestrictedColumn,
  notRestrictedColumns,
  genToken,
} = require('../../lib');


const {sha256} = require('../../lib');

const {User, Session} = require('../../database');

/**
 * Logs a user in.
 *
 * Requires credentials (BOTH email AND password) to be sent in POST request body.
 */
router.post([
    '/login',
    '/authenticate',
  ],
  needs('email', 'body'),
  needs('password', 'body'),
  exists(User, (req) => ({email: req.body.email, password: sha256(req.body.password)})),
  (req, res, next) =>
    Session.findOne({where: {email: req.body.email}})
      .then(result => result === null
        ? next()
        : result.destroy().then(() => next())),
  (req, res, next) => {
    const token = genToken();
    return Session
      .create({email: req.body.email, token})
      .then(() => res.json(msg(`successfully authenticated ${req.body.email}`, encodeURIComponent(encrypt(token)))))
      .catch((err) => next(err));
  });

/** POST not used for logout since the token will be sent in cookies. */
router.post(['/logout', '/unauthenticate'], (req, res, next) => next(new BadMethodErr('POST', 'GET')));

/**
 * Clears the session for the user that is currently logged in.
 *
 * Requires a session token to be passed in cookies.
 */
router.get([
    '/logout',
    '/unauthenticate',
  ],
  needs('token', 'cookies'),
  exists(Session, (req) => ({token: decrypt(decodeURIComponent(req.cookies.token))})),
  (req, res, next) => Session
    .findOne({where: {token: decrypt(decodeURIComponent(req.cookies.token))}})
    .then(session => session.destroy())
    .then(() => res.json(msg('successfully logged out')))
    .catch((err) => next(err)),
);

/**
 * If an API user tries to perform these actions,
 * show suggestion that they should use POST not GET.
 */
router.get(['/register', '/login'],
  (req, res, next) => next(new BadMethodErr('GET', 'POST')));

/**
 * Inserts a new user into the database.
 *
 * Requires credentials (BOTH email AND password) to be sent in POST request body.
 */
router.post([
    '/register',
    '/create',
  ],
  needs('email', 'body'),
  needs('password', 'body'),
  validColumns(User, (req) => Object.keys(req.body)),
  notRestrictedColumns((req) => Object.keys(req.body), ['updatedAt', 'createdAt', 'isAdmin']),
  notExists(User, (req) => ({email: req.body.email})),
  (req, res, next) => {
    const attrs = {};
    for (const attr in req.body) {
      attrs[attr] = attr === 'password' ?  sha256(req.body.password) : req.body[attr];
    }
    return User
      .create(attrs)
      .then(() => res.json(msg(`created user ${req.body.email}`)))
      .catch((err) => next(err));
  });

/**
 * Removes a user from the database.
 *
 * Requires a session token to be passed in cookies.
 */
router.get([
    '/unregister',
    '/delete',
    '/remove',
  ],
  needs('token', 'cookies'),
  exists(Session, (req) => ({token: decrypt(decodeURIComponent(req.cookies.token))})),
  hasFreshSess((req) => decrypt(decodeURIComponent(req.cookies.token))),
  (req, res, next) => Session
    .findOne({where: {token: decrypt(decodeURIComponent(req.cookies.token))}})
    .then((session) => {
      const email = JSON.parse(JSON.stringify(session.dataValues)).email;
      return session.destroy().then(() => User.findOne({where: {email}}))
    })
    .then((user) => user.destroy())
    .then(() => res.json(msg('successfully unregistered')))
    .catch((err) => next(err)));

/**
 * Change the user's password.
 *
 * Requires credentials (BOTH email AND password) to be sent in POST request body.
 */
router.post('/password',
  needs('email', 'body'),
  needs('password', 'body'),
  needs('value', 'body'),
  exists(User, (req) => ({email: req.body.email, password: sha256(req.body.password)})),
  (req, res, next) => User
    .findOne({where: {email: req.body.email}})
    .then(user => user.update({password: sha256(req.body.value)}))
    .then(() => res.json(msg(`updated password in user ${req.body.email}`)))
    .catch((err) => next(err)));


/**
 * Queries the database for a user's attribute (i.e. a property such as: email, id etc.).
 *
 * Doesn't require authentication.
 *
 * @namespace result.dataValues
 * @namespace req.params.property
 */
router.get('/:email/:property',
  exists(User, (req) => ({email: req.params.email})),
  validColumn(User, (req) => req.params.property),
  notRestrictedColumn((req) => req.params.property, ['password']),
  (req, res, next) => User
    .findOne({where: {email: req.params.email}, attributes: [req.params.property]})
    .then((user) => res.json(msg(`found ${user.email}'s ${req.params.property}`, user.dataValues[req.params.property])))
    .catch((err) => next(err)),
);

/**
 * Change the user's property.
 *
 * Requires a session token to be passed in cookies.
 */
router.post('/:property',
  needs('token', 'cookies'),
  needs('value', 'body'),
  exists(Session, (req) => ({token: decrypt(decodeURIComponent(req.cookies.token))})),
  hasFreshSess((req) => decrypt(decodeURIComponent(req.cookies.token))),
  notRestrictedColumn((req) => req.params.property, ['createdAt', 'updatedAt', 'isAdmin', 'password', 'email']),
  validColumn(User, (req) => req.params.property),
  (req, res, next) => Session
    .findOne({where: {token: decrypt(decodeURIComponent(req.cookies.token))}})
    .then((session) => User.findOne({where: {email: session.email}}))
    .then(user => {
      const attrs = {};
      attrs[req.params.property] = req.body.value;
      return user.update(attrs);
    })
    .then(() => res.json(msg(`updated password in user ${req.body.email}`)))
    .catch((err) => next(err)));

/**
 * Get details of a single user.
 *
 * Doesn't require authentication.
 */
router.get('/:email',
  exists(User, (req) => ({email: req.params.email})),
  (req, res) => User
    .findOne({
      where: {email: req.params.email},
      attributes: Object.keys(User.attributes).filter(attr => attr !== 'password'),
    })
    .then((user) => res.json(msg(`found user ${req.params.email}`, user.dataValues)))
    .catch((err) => next(err)),
);

/**
 * Modifies user's properties (e.g. email AND firstName etc.).
 *
 * Requires a session token to be passed in cookies.
 *
 * XXX changing emails (PK) does not work! (this is a flaw in sequelize)
 * XXX modifying password through this call if forbidden, POST to `/api/user/password`
 */
router.post('/',
  needs('token', 'cookies'),
  exists(Session, (req) => ({token: decrypt(decodeURIComponent(req.cookies.token))})),
  hasFreshSess((req) => decrypt(decodeURIComponent(req.cookies.token))),
  validColumns(User, (req) => Object.keys(req.body)),
  notRestrictedColumns((req) => Object.keys(req.body), ['createdAt', 'updatedAt', 'isAdmin', 'password', 'email']),
  (req, res, next) => Session
    .findOne({where: {token: decrypt(decodeURIComponent(req.cookies.token))}})
    .then((session) => User.findOne({where: {email: session.email}}))
    .then((user) => user === null
      ? Promise.reject(new NoSuchRecord('User'))
      : user.update(JSON.parse(JSON.stringify(req.body))))
    .then(() => res.json(msg(`updated ${Object.keys(req.body).join(', ')}`)))
    .catch((err) => next(err)));


/**
 * Get all users matching properties specified in query params.
 *
 * On success sends: {msg: String, status: String, result: Array<Object<!String, ?String>>}
 *
 * Doesn't require authentication.
 */
router.get('/',
  validColumns(User, (req) => Object.keys(req.query)),
  (req, res, next) => {
    const queryParams = {};
    for (const q in req.query) {
      if (q === 'password') {
        queryParams[q] = sha256(req.query[q]);
      } else queryParams[q] = req.query[q];
    }
    return User.findAll({
      limit: process.env.MAX_RESULTS || 100,
      where: queryParams,
      attributes: Object.keys(User.attributes).filter(attr => attr !== 'password'),
    })
      .then((results) => results.map((u) => u.dataValues))
      .then((users) => {
        let s = `found ${users.length} users`;
        if (Object.keys(req.query).length > 0) {
          s += ` matching given ${Object.keys(req.query).join(', ')}`;
        }
        return res.json(msg(s, users));
      })
      .catch((err) => next(err));
  },
);

/**
 * If an API user tries to query the database for users' info with POST suggest using GET.
 */
suggestRoutes(router, /.*/, {
  'POST': {
    '/{register,create}': 'create a new user in the database',
    '/{login,authenticate}': 'generated and send a session token',
    '/:email/:property': 'update the value of :property for a user e.g.: update firstName /if50@kent.ac.uk/firstName',
  },
  'GET': {
    '/{unregister,delete,remove}': 'remove a user from the database',
    '/:email': 'info about a user',
    '/:email/:property': 'value of :property for a user e.g.: /nl253@kent.ac.uk/email',
    '/{logout,unauthenticate}': 'clear created session, deactivate a token and send a session token',
    '/': 'find all users matching criteria (can be given as query params e.g.: `?email=nv55@kent.ac.uk&firstName=Nic`',
  },
});

module.exports = router;
