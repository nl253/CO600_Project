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

// create `/logs` and `/sessions` directories if they don't already exist
// otherwise session files and logs won't be saved!
for (const dir of ['logs', 'sessions'].map(rootPath)) {
  if (!existsSync(dir)) mkdirSync(dir);
}

const express = require('express');
const createError = require('http-errors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const logger = require('morgan');
const sassMiddleware = require('node-sass-middleware');
const cors = require('cors');

const SECRET = 'U\x0bQ*kf\x1bb$Z\x13\x03\x15w\'- f\x0fn1\x0f\\\x106V\'M~\x07';

const app = express();

app.use(cors());

// view engine setup
app.set('views', rootPath('views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(
  express.urlencoded({
    extended: false,
  }),
);
app.use(cookieParser(SECRET));
app.use(session(
  {store: new FileStore({path: rootPath('sessions')}), secret: SECRET}));

app.use(
  sassMiddleware({
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
app.use((req, res, next) => next(createError(404)));

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
