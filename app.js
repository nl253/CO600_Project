const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('cookie-session');
const logger = require('morgan');
const sassMiddleware = require('node-sass-middleware');

const indexRouter = require('./routes/index');
const apiRouter = require('./routes/api');
const SECRET = 'U\x0bQ*kf\x1bb$Z\x13\x03\x15w\'- f\x0fn1\x0f\\\x106V\'M~\x07';

const app = express();

/**
 * Produce a path relative to this file (i.e. path relative to the root of the project).
 *
 * @param {string} fileName
 * @return {string}
 */
function rootPath(fileName) {
  return path.join(__dirname, fileName);
}

// view engine setup
app.set('views', rootPath('views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser(SECRET));
app.use(session({keys: [SECRET]}));

app.use(sassMiddleware({
  src: rootPath('public'),
  dest: rootPath('public'),
  debug: false,
  outputStyle: 'compressed',
  indentedSyntax: false, // true = .sass and false = .scss
  sourceMap: true,
}));
app.use(express.static(rootPath('public')));

app.use('/api', apiRouter);
app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => next(createError(404)));

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
