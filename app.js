/**
 * Entry into the application.
 *
 * @author Norbert
 */
const {join, resolve} = require('path');
const {mkdirSync, existsSync} = require('fs');

/**
 * Produce a path relative to this file (i.e. path relative to the root of the project).
 *
 * @param {String} fileName
 * @return {String} path relative to project root
 */
function rootPath(fileName) {
  return resolve(join(__dirname, fileName));
}

if (!existsSync('logs')) mkdirSync('logs');

const express = require('express');
const SECRET = 'U\x0bQ*kf\x1bb$Z\x13\x03\x15w\'- f\x0fn1\x0f\\\x106V\'M~\x07';

const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '127.0.0.1');
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.use(require('cookie-parser')({
  secret: SECRET,
  options: {
    httpOnly: true,
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

// app.use(require('cookie-session')({
// name: 'session',
// secret: SECRET,
// // 4 hours
// maxAge: 4 * 60 * 60 * 1000,
// }));

// view engine setup
app.set('views', rootPath('views'));
app.set('view engine', 'hbs');

app.use(require('morgan')('dev'));
app.use(express.json());
app.use(
  express.urlencoded({
    extended: false,
  }),
);

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

app.use('/user', require('./routes/user'));
app.use('/api', require('./routes/api'));
app.use('/', require('./routes/index'));

// catch 404 and forward to error handler
app.use((req, res, next) => next(require('http-errors')(404)));

// error handler
app.use((err, req, res, next) => {
  /** @namespace res.locals */
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  return res.render('error');
});

module.exports = app;
