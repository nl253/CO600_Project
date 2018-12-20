require('./env')();

const {User, Session} = require('./database');
const {decrypt} = require('./routes/lib');
const log = require('./lib')
  .createLogger({label: 'APP', fileLvl: 'debug', lvl: 'debug'});

const SECOND = 1000;
const MINUTE = 60 * SECOND;

const express = require('express');
const app = express();
require('./locals')(app);

app.use((req, res, next) => {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  res.header('Access-Control-Allow-Origin', '127.0.0.1');
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Allow-Headers',
    ['Origin', 'X-Requested-With', 'Content-Type', 'Accept'].join(', '));
  return next();
});

const hbs = require('hbs');

hbs.registerPartials(process.env.PARTIALS_PATH);

// view engine setup
app.set('views', process.env.VIEW_PATH);
app.engine('hbs', hbs.__express);
app.set('view engine', 'hbs');
app.set('x-powered-by', false);

// Gives access to `req.cookies`
app.use(require('cookie-parser')({
  secret: process.env.SECRET,
  options: {
    // expose to JS (client-side)
    httpOnly: false,
    // only from the same host
    sameSite: true,
    signed: false,
    path: '/',
  },
}));

app.use(require('cors')({
  origin: ['http://localhost:3000'],
  methods: ['GET', 'POST'],
  // enable set cookie
  credentials: true,
}));

app.use(require('morgan')(':method :url :status :req[cookie]'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.use(
  require('node-sass-middleware')({
    src: process.env.PUBLIC_PATH,
    dest: process.env.PUBLIC_PATH,
    debug: false,
    outputStyle: 'compressed',
    // true = .sass and false = .scss
    indentedSyntax: false,
    sourceMap: true,
  }),
);

app.use(express.static(process.env.PUBLIC_PATH));

app.use(async (req, res, next) => {
  if (req.cookies.token === undefined) {
    log.debug(`token not sent in cookies`);
    return next();
  }
  try {
    log.debug(`token sent in cookies`);
    const sess = await Session.findOne({
      where: {
        token: decrypt(decodeURIComponent(req.cookies.token)),
      },
    });
    if (sess === null && !req.originalUrl.includes('/api/')) {
      log.debug(`token sent is does not correspond to a session`);
      res.clearCookie('token', {
        SameSite: 'Strict',
        httpOnly: false,
        Path: '/',
      });
      return next();
    } else if ((Date.now() - sess.updatedAt) >=
      (process.env.SESSION_TIME || 20 * MINUTE)) {
      log.debug(`token sent is stale, destroying associated session`);
      sess.destroy();
      if (!req.originalUrl.includes('/api/')) {
        res.clearCookie('token', {
          SameSite: 'Strict',
          httpOnly: false,
          Path: '/',
        });
      }
      return next();
    } else {
      log.debug(`valid token sent, refreshing it`);
      await sess.update({updatedAt: Date.now()});
    }
    res.locals.loggedIn = await User.findOne({
      where: {email: sess.email},
      attributes: {exclude: ['password']},
    }).then(u => u.dataValues);
    log.info(`logged in: ${Object.entries(res.locals.loggedIn)
      .map(pair => pair.join(' = '))
      .join(', ')}`);
    return next();
  } catch (err) {
    return next(err);
  }
});

app.use('/user', require('./routes/user'));
app.use('/module', require('./routes/module'));
app.use('/lesson', require('./routes/lesson'));
app.use('/api', require('./routes/api'));
app.use('/', require('./routes'));

// catch 404 and forward to error handler
app.use((req, res, next) => next(require('http-errors')(404)));

// error handler
app.use((err, req, res, next) => {
  log.error(err);
  return res
    .status(err.status || err.code || 500)
    .render('error', {message: err.message, error: err});
});

module.exports = app;
