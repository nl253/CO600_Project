// 3rd Party


const {suggestRoutes, msg} = require('../lib');
const {NoSuchRecordErr, RecordExists, ValidationErr} = require('../../errors');
const router = require('express').Router();

// Project
const {
  encrypt,
  decrypt,
  needs,
  isLoggedIn,
  genToken,
  validCols,
} = require('../../lib');

const {sha256} = require('../../lib');

const {User, Session} = require('../../../database');

/**
 * Logs a user in.
 *
 * Requires credentials (BOTH email AND password) to be sent in POST request body.
 */
router.post(['/login', '/authenticate'],
  needs('email', 'body'),
  needs('password', 'body'),
  async (req, res, next) => {
    try {
      const user = await User.findOne({where: {
          email: req.body.email,
          password: sha256(req.body.password),
        }});
      if (user === null) return next(new NoSuchRecordErr('User', {email: req.body.email}));
      let sess = await Session.findOrCreate({
        where: {email: req.body.email},
        defaults: {email: req.body.email, token: genToken()}
      }).spread((s, created) => created ? s : s.update({updatedAt: Date.now()}));
      delete user.dataValues.password;
      return res.json(msg(`successfully authenticated ${req.body.email}`,
        Object.assign(user.dataValues, {token: encodeURIComponent(encrypt(sess.token))})));
    } catch (e) {
      return next(e);
    }
  });

/**
 * Clears the session for the user that is currently logged in.
 *
 * Requires a session token to be passed in cookies.
 */
router.get(['/logout', '/unauthenticate'],
  isLoggedIn(),
  (req, res, next) => Session
    .findOne({where: {token: decrypt(decodeURIComponent(req.cookies.token))}})
    .then(session => session.destroy())
    .then(() => res.json(msg('successfully logged out')))
    .catch((err) => next(err)),
);

/**
 * Inserts a new user into the database.
 *
 * Requires credentials (BOTH email AND password) to be sent in POST request body.
 */
router.post(['/register', '/create'],
  needs('email', 'body'),
  needs('password', 'body'),
  validCols(User),
  (req, res, next) => {
    if (!req.body.password.match(/\S{6,}/)) {
      return next(new ValidationErr('password', 'too short or includes spaces'));
    }
    req.body.password = sha256(req.body.password);
    return User.findOrCreate({
      where: {email: req.body.email},
      defaults: req.body,
    }).spread((u, created) => {
      if (created) throw new RecordExists('User');
      u = u.dataValues;
      console.log(`created { ${Object.entries(u).map(pair => pair.map(el => el.toLocaleString())).join(', ')} }`);
      delete u.password;
      return res.json(msg(`created user ${req.body.email}`));
    }).catch(err => next(err));
  });

/**
 * Removes a user from the database.
 *
 * Requires a session token to be passed in cookies.
 */
router.delete(['/', '/unregister', '/delete', '/remove'],
  isLoggedIn(),
  (req, res, next) => Session
    .findOne({where: {token: decrypt(decodeURIComponent(req.cookies.token))}})
    .then((session) => {
      const email = session.dataValues.email;
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
  isLoggedIn(),
  needs('email', 'body'),
  needs('password', 'body'),
  needs('value', 'body'),
  (req, res, next) => User
    .findOne({where: {email: req.body.email}})
    .then(user => {
      if (!req.body.value.match(/\S{6,}/)) {
        return next(new ValidationErr('password', 'too short or includes spaces'));
      }
      return user.update({password: sha256(req.body.value)});
    })
    .then(() => res.json(msg(`updated password in user ${req.body.email}`)))
    .catch((err) => next(err)));

/**
 * Get all users matching properties specified in query params.
 *
 * On success sends: {msg: String, status: String, result: Array<Object<!String, ?String>>}
 *
 * Doesn't require authentication.
 */
router.get(['/', '/search'],
  validCols(User, 'query', ['password']),
  async (req, res, next) => {
    const users = await User.findAll({
      limit: process.env.MAX_RESULTS || 100,
      where: req.query,
      attributes: Object.keys(User.attributes).filter(attr => attr !== 'password'),
    }).then((results) => results.map((u) => u.dataValues));
    let s = `found ${users.length} users`;
    if (Object.keys(req.query).length > 0) {
      s += ` matching given ${Object.keys(req.query).join(', ')}`;
    }
    return res.json(msg(s, users));
  }
);

/**
 * Modifies user's properties (e.g. email AND firstName etc.).
 *
 * Requires a session token to be passed in cookies.
 *
 * XXX modifying password through this call if forbidden, POST to `/api/user/password`
 */
router.post(['/', '/update', '/modify'],
  isLoggedIn(),
  validCols(User, 'body', ['password', 'isAdmin', 'updatedAt', 'createdAt']),
  (req, res, next) => User.findOne({where: {id: res.locals.loggedIn.id}})
    .then((user) => {
      return user === null
        ? Promise.reject(new NoSuchRecordErr('User'))
        : user.update(req.body);
    })
    .then(() => res.json(msg(`updated ${Object.keys(req.body).join(', ')}`)))
    .catch((err) => next(err)));

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
