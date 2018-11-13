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

for (const pair of Object.entries({
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
})) {
  const [k, v] = pair;
  if (process.env[k] === undefined) {
    process.env[k] = v;
  }
}

/**
 * Produce a path relative to this file (i.e. path relative to the root of the project).
 *
 * @param {String} fileName
 * @return {String} path relative to project root
 */
function rootPath(fileName) {
  return resolve(join(__dirname, fileName));
}

if (!existsSync(rootPath('logs'))) mkdirSync(rootPath('logs'));

const express = require('express');
const app = express();

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

// view engine setup
app.set('views', rootPath('views'));
app.set('view engine', 'hbs');
app.set('x-powered-by', false);


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

app.use('/api', require('./routes/api'));
app.use('/user', require('./routes/user'));
app.use('/', require('./routes'));

module.exports = app;
