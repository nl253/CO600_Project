/**
 * This module implements the User model and operations on users such as
 * updating fields, deleting users, creating new users in the database.
 *
 * I tried to make it as user-friendly as possible so if you occasionally use GET
 * instead of POST or forget to add a value to the request body the API will
 * suggest what you might want to do.
 *
 * @author Norbert
 */

// 3rd Party
const router = require('express').Router();

// Project
const {
  InvalidRequestErr,
  AuthFailedErr,
  BadMethodErr,
  NoCredentialsErr,
  MissingDataErr,
  NoPermissionErr,
  NotLoggedIn,
} = require('../errors');

const {
  AlreadyLoggedIn,
  UserExistsErr,
  NoSuchUser,
} = require('./errors');

const {
  errMsg,
  getCredentials,
  log,
  msg,
  pprint,
  sha256,
} = require('../lib');

const {User} = require('../lib').models;

const cookieOpts = {
  httpOnly: true,
  sameSite: true,
  signed: false,
  path: '/',
};

/**
 * Logs a user in.
 *
 * Requires credentials (BOTH email AND password) to be sent in POST request body.
 */
router.post('/login', (req, res) => {
  // log.debug(`login request with body: ${pprint(req.body)} & cookies: ${pprint(
  //   req.cookies)}`);
  /** @namespace req.cookies */
  return new Promise((ok, rej) => req.cookies.email === undefined
    ? ok(getCredentials(req))
    : rej(new AlreadyLoggedIn(req.cookies.email)))
    .then(credentials => User.findOne({where: credentials}))
    .then(result => result === null ?
      Promise.reject(new AuthFailedErr()) :
      result.dataValues)
    .then(user => {
      // log.warn(pprint(user));
      // log.debug(`started session for ${user.email}`);
      return res
        .cookie('email', user.email, cookieOpts)
        .cookie('password', user.password, cookieOpts)
        .json(msg(`successfully authenticated user ${user.email}`));
    })
    .catch(err => res.status(err.code || 400).json(errMsg(err)));
});

/**
 * Clears the cookies for the user that is currently logged in.
 *
 * Requires someone to be logged in.
 */
router.post('/logout', (req, res) => {
  // log.debug(`logout request with body: ${pprint(req.body)} and cookies ${pprint(
  //   req.cookies)}`);
  return new Promise((ok, rej) => req.cookies.email === undefined
    ? rej(new NotLoggedIn())
    : ok(req.cookies.email))
    .then(email => {
      for (const cookie of ['email', 'password']) {
        res.clearCookie(cookie, {
          httpOnly: true,
          sameSite: true,
          signed: false,
          path: '/',
        });
      }
      return res.json(msg(`user ${email} logged out`));
    })
    .catch(err => res.status(err.code || 400).json(errMsg(err)));
});

/**
 * Inserts a new user into the database.
 *
 * Requires credentials to be passed in POST request body.
 */
router.post('/register', (req, res) => {
  // log.debug(`register request with body ${pprint(req.body)}`);
  return new Promise((ok, rej) => 'email' in req.body && 'password' in req.body
    ? ok({email: req.body.email, password: sha256(req.body.password)})
    : rej(new NoCredentialsErr()))
    .then(credentials => User.findOne({where: credentials}))
    .then(result => result !== null
      ? Promise.reject(new UserExistsErr())
      : Promise.resolve())
    .then(() => {
      const queryParams = {};
      const columns = new Set(Object.keys(User.attributes));
      for (const param in req.body) {
        if (columns.has(param)) {
          queryParams[param] = param === 'password' ?
            sha256(req.body[param]) :
            req.body[param];
        }
      }
      return queryParams;
    })
    .then(queryParams => User.create(queryParams))
    .then(() => res.json(msg(`created user ${req.body.email}`)))
    .catch(err => {
      log.warn(err);
      return res.status(err.code || 400).json(errMsg(err));
    });
});

/**
 * Removes a user from the database.
 *
 * Requires authentication OR credentials passed in the request params and body.
 */
router.post('/unregister', (req, res) => {
  // log.debug(
  //   `unregister request with body ${pprint(req.body)} and cookies ${pprint(
  //     req.cookies)}`);
  return getCredentials(req)
    .then(credentials => User.findOne({where: credentials}))
    .then(user => user === null ? Promise.reject(new AuthFailedErr()) : user)
    .then(user => {
      /** @namespace user.dataValues */
      const email = user.dataValues.email;
      return user.destroy().then(() => {
        for (const cookie of ['email', 'password']) {
          res.clearCookie(cookie, {
            // to be accessible only by the web server.
            httpOnly: true,
            sameSite: true,
            signed: false,
          });
        }
        return email;
      });
    })
    .then(email => res.json(msg(`successfully unregistered user ${email}`)))
    .catch(err => res.status(err.code || 400).json(errMsg(err)));
});

/**
 * If an API user tries to perform these actions, show suggestion that they should use POST not GET.
 */
for (const action of ['register', 'unregister', 'login', 'logout']) {
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
router.get('/:email/:property', (req, res) => {
  // log.debug(`property lookup request for ${req.params.email}`);
  return new Promise((ok, rej) => req.params.property === 'password'
    ? rej(new NoPermissionErr('lookup password'))
    : ok())
    .then(() => req.params.property in User.attributes
      ? User.findOne({where: {email: req.params.email}})
      : Promise.reject(new InvalidRequestErr('User', req.params.property)))
    .then(result => result === null
      ? Promise.reject(new NoSuchUser())
      : result)
    .then(result => result.dataValues)
    .then(user => res.json(msg(`found ${user.email}'s ${req.params.property}`,
      user[req.params.property])))
    .catch(err => res.status(err.code || 400).json(errMsg(err)));
});

/**
 * Modifies a user's property (e.g. email, firstName etc.).
 *
 * Requires the user to be logged in or that the password is in request body.
 */
router.post('/:email/:property', (req, res) => {
  // log.debug(`property update request with params ${pprint(
  //   req.params)} and body ${pprint(req.body)} and cookies ${pprint(
  //   req.cookies)}`);
  /** @namespace req.params.property */
  return new Promise((ok, rej) => req.params.property === 'isAdmin'
    ? rej(new NoPermissionErr('set property isAdmin of a user'))
    : ok())
    .then(() => req.params.property in User.attributes
      ? getCredentials(req)
      : Promise.reject(new NoPermissionErr('change a user to admin')))
    .then(credentials => 'value' in req.body
      ? User.findOne({where: credentials})
      : Promise.reject(new MissingDataErr('replacement value', 'request body')))
    .then(user => user === null ?
      Promise.reject(new NoSuchUser(req.params.email)) :
      user)
    .then(user => {
      const queryParams = {};
      queryParams[req.params.property] = req.params.property === 'password' ?
        sha256(req.body.value) :
        req.body.value;
      return user.update(queryParams);
    })
    .then(user => res.json(
      msg(`updated ${req.params.property} in user ${user.email}`)))
    .catch(err => res.status(err.code || 400).json(errMsg(err)));
});

/**
 * If an API user tries to query the database for user's info with POST suggest using GET.
 */
router.post('/:email', (req, res) => {
  const err = new BadMethodErr(`retrieve info about user`, 'GET');
  return res.status(err.code || 400).json(err.msgJSON || err.message);
});

router.get('/:email', (req, res) => {
  // log.debug(`user ${req.params.email} lookup request`);
  /** @namespace result.dataValues */
  return Promise.resolve({email: req.params.email})
    .then(queryParams => User.findOne({where: queryParams}))
    .then(result => result === null ?
      Promise.reject(new NoSuchUser(req.params.email)) : result)
    .then(result => {
      // log.debug(`located user ${req.params.email}, unwrapping user-info`);
      return result.dataValues;
    })
    .then(user => {
      // log.debug(`cloning user-info`);
      return JSON.parse(JSON.stringify(user));
    })
    .then(userInfo => {
      // don't send hashed password (sensitive data)
      /** @namespace userInfo.password */
      // log.debug(`removing password from ${req.params.email}'s user-info`);
      delete userInfo.password;
      return userInfo;
    })
    .then(user => res.json(msg(`found user ${req.params.email}`, user)))
    .catch(err => res.status(err.code || 400).json(errMsg(err)));
});

/**
 * Get all users matching properties specified in query params.
 *
 * On success serves: {msg: String, status: String, result: Array<Object<String, *>>}
 */
router.get('/', (req, res) => {
  // log.debug(`many user lookup request with query ${pprint(req.query)}`);
  return new Promise((ok, rej) => {
    const queryParams = {};
    for (const q in req.query) {
      if (q in User.attributes) {
        queryParams[q] = q === 'password'
          ? sha256(req.query[q])
          : req.query[q];
      }
    }
    return ok(queryParams);
  }).then(queryParams => User.findAll({limit: 100, where: queryParams}))
    .then(results => {
      // log.debug(`located matching ${results.length} users`);
      return results.map(u => u.dataValues);
    })
    .then(users => {
      const clones = users.map(u => JSON.parse(JSON.stringify(u)));
      // log.debug('extracted info from found users');
      return clones;
    })
    .then(clones => {
      // log.debug('removing passwords from user-info objects');
      for (const c in clones) {
        delete clones[c].password;
      }
      return clones;
    })
    .then(users => res.json(msg(`found users matching ${Object.keys(req.query)
      .filter(attr => attr in User.attributes && attr !== 'password')
      .join(', ')}`, users)))
    .catch(err => res.status(err.code || 400).json(errMsg(err)));
});

/**
 * If an API user tries to query the database for users' info with POST suggest using GET.
 */
router.post('/', (req, res) => {
  const err = new BadMethodErr(`retrieve info about many users`, 'GET');
  return res.status(err.code || 400).json(err.msgJSON || err.message);
});

module.exports = router;
