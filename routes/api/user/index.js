// 3rd Party
const router = require('express').Router();

// Project
const {
  encrypt,
  decrypt,
  needs,
  exists,
  validColumn,
  notExists,
  notRestrictedColumn,
  genToken,
} = require('../../lib');

const {
  BadMethodErr,
} = require('../errors');

const {
  errMsg,
  log,
  msg,
  sha256,
} = require('../../lib');

const {User, Session} = require('../../lib').models;

/**
 * Logs a user in.
 *
 * Requires credentials (BOTH email AND password) to be sent in POST request body.
 */
router.post([
    '/login',
    '/authenticate',
    '/startSession',
    '/beginSession',
    '/getToken',
  ],
  needs('email', 'body'),
  needs('password', 'body'),
  exists(User,
    (req) => ({email: req.body.email, password: sha256(req.body.password)})),
  (req, res, next) =>
    Session.findOne({where: {email: req.body.email}})
      .then(result => result === null ?
        next() :
        result.destroy().then(() => next())),
  (req, res) => {
    const token = genToken();
    return Session
      .create({email: req.body.email, token})
      .then(() => res.json(
        msg(`successfully authenticated ${req.body.email}`, encrypt(token))))
      .catch((err) => res.status(err.code || 400).json(errMsg(err)));
  });


/**
 * Clears the session for the user that is currently logged in.
 *
 * Requires someone to be logged in.
 */
router.get([
    '/logout',
    '/unauthenticate',
    '/endSession',
    '/killSession',
    '/destroySession',
    '/clearToken',
    '/removeToken',
  ],
  needs('token', 'cookies'),
  exists(Session, (req) => ({token: decrypt(req.cookies.token)})),
  (req, res) =>
    Session.findOne({where: {token: decrypt(req.cookies.token)}})
      .then(session => session.destroy())
      .then(() => res.json(msg('successfully logged out')))
      .catch((err) => res.status(err.code || 400).json(errMsg(err))),
);

/**
 * Inserts a new user into the database.
 *
 * Requires credentials to be passed in POST request body.
 */
router.post([
    '/register',
    '/create',
    '/createAccount',
    '/newAccount',
  ],
  needs('email', 'body'),
  needs('password', 'body'),
  notExists(User,
    (req) => ({email: req.body.email, password: sha256(req.body.password)})),
  (req, res) => {
    const queryParams = {};
    const columns = new Set(Object.keys(User.attributes));
    for (const param in req.body) {
      if (columns.has(param)) {
        queryParams[param] = param === 'password' ?
          sha256(req.body[param]) :
          req.body[param];
      }
    }
    return User.create(queryParams)
      .then(() => res.json(msg(`created user ${req.body.email}`)))
      .catch((err) => {
        log.warn(err);
        return res.status(err.code || 400).json(errMsg(err));
      });
  });

/**
 * Removes a user from the database.
 *
 * Requires authentication OR credentials passed in the request params and body.
 */
router.get([
    '/unregister',
    '/deleteAccount',
    '/closeAccount',
    '/delete',
    '/remove',
  ],
  needs('token', 'cookies'),
  exists(Session, (req) => ({token: decrypt(req.cookies.token)})),
  (req, res) => {
    return Session.findOne({where: {token: decrypt(req.cookies.token)}})
      .then((session) => User.findOne({where: {email: session.email}}))
      .then((user) => user.destroy())
      .then(() => res.json(msg('successfully unregistered')))
      .catch((err) => res.status(err.code || 400).json(errMsg(err)));
  });

/**
 * If an API user tries to perform these actions, show suggestion that they should use POST not GET.
 */
for (const action of ['register', 'login']) {
  router.get(`/${action}`, (req, res) => {
    const err = new BadMethodErr(action, 'POST');
    return res.status(err.code || 400).json(errMsg(err));
  });
}

/**
 * Queries the database for a user's attribute (i.e. a property such as: email, id etc.).
 *
 * Doesn't require authentication.
 */
router.get('/:email/:property',
  exists(User, (req) => ({email: req.params.email})),
  validColumn(User, (req) => req.params.property),
  notRestrictedColumn((req) => req.params.property, ['password']),
  (req, res) => User
    .findOne({where: {email: req.params.email}})
    .then((result) => result.dataValues)
    .then((user) => res.json(msg(`found ${user.email}'s ${req.params.property}`,
      user[req.params.property])))
    .catch((err) => res.status(err.code || 400).json(errMsg(err))),
);

/**
 * Modifies a user's property (e.g. email, firstName etc.).
 *
 * Requires the user to be logged in or that the password is in request body.
 */
router.post('/:email/:property',
  exists(User, (req) => ({email: req.params.email})),
  needs('value', 'body'),
  needs('token', 'cookies'),
  validColumn(User, (req) => req.params.property),
  notRestrictedColumn((req) => req.params.property,
    ['isAdmin', 'updatedAt', 'isAdmin']),
  (req, res) => {
    const queryParams = {};
    queryParams[req.params.property] = req.params.property === 'password' ?
      sha256(req.body.value) :
      req.body.value;
    return user
      .update(queryParams)
      .then(() => res.json(
        msg(`updated ${req.params.property} in user ${req.params.email}`)))
      .catch((err) => res.status(err.code || 400).json(errMsg(err)));
  });

/**
 * If an API user tries to query the database for user's info with POST suggest using GET.
 */
router.post('/:email', (req, res) => {
  const err = new BadMethodErr(`retrieve info about user`, 'GET');
  return res.status(err.code || 400).json(err.msgJSON || err.message);
});

router.get('/:email',
  exists(User, (req) => ({email: req.params.email})),
  (req, res) => User
    .findOne({where: {email: req.params.email}})
    .then(result => result.dataValues)
    .then((userInfo) => JSON.parse(JSON.stringify(userInfo)))
    .then((userInfo) => {
      // don't send hashed password (sensitive data)
      delete userInfo.password;
      return userInfo;
    })
    .then((user) => res.json(msg(`found user ${req.params.email}`, user)))
    .catch((err) => res.status(err.code || 400).json(errMsg(err))),
);

/**
 * Get all users matching properties specified in query params.
 *
 * On success serves: {msg: String, status: String, result: Array<Object<String, *>>}
 */
router.get('/', (req, res) => {
    // log.debug(`many user lookup request with query ${pprint(req.query)}`);
    const queryParams = {};
    for (const q in req.query) {
      if (q in User.attributes) {
        queryParams[q] = q === 'password'
          ? sha256(req.query[q])
          : req.query[q];
      }
    }
    return User.findAll({limit: 100, where: queryParams})
      .then((results) => results.map((u) => u.dataValues))
      .then((users) => users.map((u) => JSON.parse(JSON.stringify(u))))
      .then((clones) => {
        // log.debug('removing passwords from user-info objects');
        for (const c in clones) {
          delete clones[c].password;
        }
        return clones;
      })
      .then(
        (users) => res.json(msg(`found users matching ${Object.keys(req.query)
          .filter((attr) => attr in User.attributes && attr !== 'password')
          .join(', ')}`, users)))
      .catch((err) => res.status(err.code || 400).json(errMsg(err)));
  },
);

/**
 * If an API user tries to query the database for users' info with POST suggest using GET.
 */
router.post('/', (req, res) => {
  const err = new BadMethodErr(`retrieve info about many users`, 'GET');
  return res.status(err.code || 400).json(err.msgJSON || err.message);
});

module.exports = router;
