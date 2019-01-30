// 3rd Party


const {msg} = require('../lib');
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

const {User, Session, Sequelize, sequelize} = require('../../../database');

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
      const {email, password} = req.body;
      const user = await User.findOne({
        where: {
          email,
          password: sha256(password),
        }});
      if (user === null) {
        throw new NoSuchRecordErr('User', {email});
      }
      const newToken = genToken();
      const sess = await Session.findOrCreate({
        where: {email},
        defaults: {email, token: newToken},
      }).spread((s, created) =>
        created
        ? s
        : s.update({token: newToken}));
      console.log(sess.dataValues);
      delete user.dataValues.password;
      delete user.dataValues.info;
      delete user.dataValues.isAdmin;
      res.set('Set-Cookie', `token=${encodeURIComponent(encrypt(sess.token))}; HttpOnly; Max-Age=${parseInt(process.env.SESSION_TIME) / 1000}; SameSite=Strict; Path=/`);
      return res.json(msg(`successfully authenticated ${req.body.email}`, user.dataValues));
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
  async (req, res) => {
    if (req.cookies.token) {
      let token = '';
      try {
        token = decrypt(decodeURIComponent(req.cookies.token))
      } catch (e) {
        return next(e);
      }
      await Session.findOne({
        where: {token},
      }).then(s => s ? s.destroy() : null);
    }
    res.set('Set-Cookie', 'token=; HttpOnly; Max-Age=0; SameSite=Strict; Path=/');
    return res.json(msg('successfully logged out'));
  }
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
      if (!created) return next(new RecordExists('User'));
      u = u.dataValues;
      console.log(`created { ${Object.entries(u).map(pair => pair.map(el => el ? el.toLocaleString() : '')).join(', ')} }`);
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
  async (req, res, next) => {
    try {
      const sess = await Session.findOne({where: {token: decrypt(decodeURIComponent(req.cookies.token))}});
      await sess.destroy();
      const user = await User.findOne({where: {id: res.locals.loggedIn.id}});
      await user.destroy();
      return res.json(msg('successfully unregistered'));
    } catch (e) {
      return next(e);
    }
  });

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
  async (req, res, next) => {
    try {
      if (!req.body.value.match(/\S{6,}/)) {
        return next(new ValidationErr('password', 'too short or includes spaces'));
      }
      const user = await User.findOne({where: {
          email: req.body.email,
          id: res.locals.loggedIn.id,
        }});
      if (user === null) {
        throw new NoSuchRecordErr('User', {
          email: req.body.email,
          id: res.locals.loggedIn.id,
        });
      }
      await user.update({password: sha256(req.body.value)});
      return res.json(msg(`updated password in user ${req.body.email}`));
    } catch (e) {
      return next(e);
    }
  });


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
  async (req, res, next) => {
    try {
      let u =  await User.findOne({where: {id: res.locals.loggedIn.id}});
      if (u === null) {
        throw new NoSuchRecordErr('User');
      }
      await u.update(req.body);
      return res.json(msg(`updated ${Object.keys(req.body).join(', ')}`));
    } catch (e) {
      return next(e);
    }
  });

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
    try {
      for (const attr of ['firstName', 'lastName', 'email', 'info']) {
        if (req.query[attr]) {
          req.query[attr] = {[Sequelize.Op.like]: `%${req.query[attr]}%`};
        }
      }
      for (const dateAttr of ['createdAt', 'updatedAt']) {
        if (req.query[dateAttr]) {
          req.query[dateAttr] = {[Sequelize.Op.gte]: new Date(Date.parse(req.query[dateAttr]))};
        }
      }
      const users = await User.findAll({
        limit: parseInt(process.env.MAX_RESULTS),
        order: sequelize.col('createdAt'),
        where: req.query,
        attributes: Object
          .keys(User.attributes)
          .filter(attr => attr !== 'password'),
      }).then(us => us.map(u => u.dataValues));
      let s = `found ${users.length} users`;
      if (Object.keys(req.query).length > 0) {
        s += ` matching given ${Object.keys(req.query).join(', ')}`;
      }
      return res.json(msg(s, users));
    } catch (e) {
      return next(e);
    }
  }
);

module.exports = router;
