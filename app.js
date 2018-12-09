/**
 * Entry into the application.
 *
 * @author Norbert
 */

// Standard Library
const {join, resolve} = require('path');
const {mkdirSync, existsSync} = require('fs');

const SECOND = 1000;
const MINUTE = 60 * SECOND;
// const HOUR = 60 * MINUTE;

const APP_ENV = {
  NODE_ENV: 'development',
  DB_SYNC: 'false',
  MAX_RESULTS: '100',
  PORT: '3000',
  SECRET: 'U\x0bQ*kf\x1bb$Z\x13\x03\x15w\'- f\x0fn1\x0f\\\x106V\'M~\x07',
  ROOT: resolve(__dirname),
  ENCRYPTION_ALGORITHM: 'aes192',
  SESSION_TIME: 20 * MINUTE,
  TEST_RUNS: '20',
  DB_PATH: join(__dirname, 'routes', 'database', 'db'),
  LOGGING_ROUTING: 'info',
  LOGGING_DB: 'warn',
  LOGGING_TESTS: 'info',
};

const padStartLen = Object.keys(APP_ENV).reduce((prev, curr) => curr.length >= prev ? curr.length : prev, 0);
const padEndLen = Object.values(APP_ENV).reduce((prev, curr) => curr.length >= prev ? curr.length : prev, 0);
console.info(`APPLICATION ENVIRONMENT\n${'-'.repeat(padStartLen + padEndLen + 3)}`);
for (const pair of Object.entries(APP_ENV)) {
  const [k, v] = pair;
  if (process.env[k] === undefined) process.env[k] = v;
  console.info(`${k.padEnd(padStartLen)} = ${v}`);
}

/**
 * Produce a path relative to this file (i.e. path relative to the root of the project).
 *
 * @param {...String} components
 * @return {String} path relative to project root
 */
function rootPath(...components) {
  return resolve(join(__dirname, ...components));
}

if (!existsSync(rootPath('logs'))) mkdirSync(rootPath('logs'));

const express = require('express');
const app = express();

// view engine setup
app.set('views', rootPath('views'));
app.set('view engine', 'hbs');
app.set('x-powered-by', false);

app.locals.title = 'FreeLearn';
app.locals.authors = [
  {name: 'Norbert Logiewa', email: 'nl253@kent.ac.uk'},
  {name: 'Imaan Fakim', email: 'if50@kent.ac.uk'},
  {name: 'Nicolas Valderrabano', email: 'nv55@kent.ac.uk'},
];


app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '127.0.0.1');
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Allow-Headers',
    ['Origin', 'X-Requested-With', 'Content-Type', 'Accept'].join(', '));
  next();
});

/**
 * Gives access to `req.cookies`.
 */
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
    src: rootPath('public'),
    dest: rootPath('public'),
    debug: false,
    outputStyle: 'compressed',
    // true = .sass and false = .scss
    indentedSyntax: false,
    sourceMap: true,
  }),
);

app.use(express.static(rootPath('public')));

const models = require('./routes/database');
const {decrypt} = require('./routes/lib');

app.use((req, res, next) => {
  if (req.query) res.locals.query = req.query;
  next();
});

app.use((req, res, next) => {
  function clearToken(res) {
    return res.clearCookie('token', {
      SameSite: true,
      httpOnly: false,
      Path: '/',
    });
  }

  if (req.cookies.token === '') {
    clearToken(res);
    return next();
  } else if (req.cookies.token === undefined) {
    return next();
  }

  return models.Session
    .findOne({where: {token: decrypt(decodeURIComponent(req.cookies.token))}})
    .then((session) => {
      if (session === null) {
        clearToken(res);
        return next();
      } else if ((Date.now() - session.updatedAt) >=
        (process.env.SESSION_TIME || 20 * MINUTE)) {
        return session.destroy().then(() => {
          clearToken(res);
          return next();
        });
      } else {
        return models.User.findOne({
          where: {email: session.email},
          attributes: Object.keys(models.User.attributes)
            .filter(a => a !== 'password'),
        }).then((user) => {
          res.locals.loggedIn = user.dataValues;
          return next();
        });
      }
    });
});

app.use('/api', require('./routes/api'));
app.use('/user', require('./routes/user'));
app.use('/module', require('./routes/module'));
app.use('/', require('./routes'));

// catch 404 and forward to error handler
app.use((req, res, next) => next(require('http-errors')(404)));

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV === 'development' ? err : {};

  // render the error page
  return res.status(err.status || err.code || 500).render('error');
});

module.exports = app;
