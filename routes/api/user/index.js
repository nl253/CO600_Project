// 3rd Party
const router = require('express').Router();

// Project
const {
  encrypt,
  decrypt,
  needs,
  suggestRoutes,
  exists,
  validColumn,
  notExists,
  notRestrictedColumn,
  genToken,
} = require('../../lib');

const {
  BadMethodErr,
} = require('../../errors');

const {
  errMsg,
  msg,
  sha256,
} = require('../../lib');

const {User, Session} = require('../../database');

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
 * Requires a session token to be passed in cookies.
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
  (req, res, next) => {
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
      .catch((err) => next(err));
  });

/**
 * Removes a user from the database.
 *
 * Requires a session token to be passed in cookies.
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
  (req, res, next) => {
    return Session.findOne({where: {token: decrypt(req.cookies.token)}})
      .then((session) => User.findOne({where: {email: session.email}}))
      .then((user) => user.destroy())
      .then(() => res.json(msg('successfully unregistered')))
      .catch((err) => next(err));
  });

/**
 * If an API user tries to perform these actions,
 * show suggestion that they should use POST not GET.
 */
for (const action of ['register', 'login']) {
  router.get(`/${action}`,
    (req, res, next) => next(new BadMethodErr(action, 'POST')));
}

/** POST not used for logout since the token will be sent in cookies. */
router.get('/logout',
  (req, res, next) => next(new BadMethodErr('POST', 'GET')));

/** @namespace result.dataValues */
/** @namespace req.params.property */
/**
 * Queries the database for a user's attribute (i.e. a property such as: email, id etc.).
 *
 * Doesn't require authentication.
 */
router.get('/:email/:property',
  exists(User, (req) => ({email: req.params.email})),
  validColumn(User, (req) => req.params.property),
  notRestrictedColumn((req) => req.params.property, ['password']),
  (req, res, next) => User
    .findOne({where: {email: req.params.email}})
    .then((result) => result.dataValues)
    .then(
      (user) => res.json(msg(`found ${user.email}'s ${req.params.property}`,
        user[req.params.property])))
    .catch((err) => next(err)),
);

/**
 * Modifies a user's property (e.g. email, firstName etc.).
 *
 * Requires a session token to be passed in cookies.
 */
router.post('/:email/:property',
  exists(User, (req) => ({email: req.params.email})),
  needs('value', 'body'),
  needs('token', 'cookies'),
  validColumn(User, (req) => req.params.property),
  notRestrictedColumn((req) => req.params.property,
    ['isAdmin', 'updatedAt', 'isAdmin']),
  (req, res, next) => {
    const queryParams = {};
    queryParams[req.params.property] = req.params.property === 'password' ?
      sha256(req.body.value) :
      req.body.value;
    return user
      .update(queryParams)
      .then(() => res.json(
        msg(`updated ${req.params.property} in user ${req.params.email}`)))
      .catch((err) => next(err));
  });

/**
 * If an API user tries to query the database for user's info with POST suggest using GET.
 */
router.post('/:email', (req, res, next) =>
  next(new BadMethodErr(`retrieve info about user`, 'GET')));

/**
 * Gets all info about a single user.
 *
 * Doesn't require authentication.
 */
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
    .catch((err) => next(err)),
);

/**
 * Get all users matching properties specified in query params.
 *
 * On success serves: {msg: String, status: String, result: Array<Object<String, *>>}
 *
 * Doesn't require authentication.
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
      .catch((err) => next(err));
  },
);

/**
 *  If an API user tries to query the database for users' info with POST suggest using GET.
 */
router.post('/', (req, res, next) =>
  next(new BadMethodErr(`retrieve info about many users`, 'GET')));

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
