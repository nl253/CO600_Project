const fs = require('fs');
const path = require('path');

require('./env')();

const {User, Session} = require('./database');
const {decrypt} = require('./routes/lib');
const log = require('./lib')
  .createLogger({label: 'APP', fileLvl: 'debug', lvl: 'debug'});

const SECOND = 1000;
const MINUTE = 60 * SECOND;

const babel = require("babel-core");
const express = require('express');
const app = express();
require('./locals')(app);

app.use((req, res, next) => {
  // res.header('Access-Control-Allow-Origin', '127.0.0.1');
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Allow-Headers', ['Origin', 'X-Requested-With', 'Content-Type', 'Accept'].join(', '));
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  return next();
});

app.use(require('compression')());

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

app.use(require('morgan')(':method :url :status :req[cookie]'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.use(
  require('node-sass-middleware')({
    src: process.env.PUBLIC_PATH,
    dest: process.env.PUBLIC_PATH,
    force: process.env.NODE_ENV === 'development',
    debug: false,
    outputStyle: 'compressed',
    // true = .sass and false = .scss
    indentedSyntax: false,
    sourceMap: true,
  }),
);

app.use(/\/javascripts\/.*\.js$/, async (req, res, next) => {
  res.header('X-SourceMap', `${req.originalUrl}.map`);
  if (req.originalUrl.match(/\.min\.js$/)) return next();
  const jsPath = path.join(process.env.ROOT, 'public', req.originalUrl.slice(1));
  const jsPathMap = `${jsPath}.map`;
  const jsPathMin = jsPath.replace(/\.js$/, '.min.js');
  if (process.env.NODE_ENV === 'development' || !fs.existsSync(jsPathMin)) {
    const {code, map} = await babel.transformFileAsync(jsPath);
    const writeJSMinP = new Promise((res, rej) => res(fs.writeFileSync(jsPathMin, code)));
    const writeJSMapP = new Promise((res, rej) => res(fs.writeFileSync(jsPathMap, JSON.stringify(map))));
    await writeJSMinP;
    await writeJSMapP;
  }
  return res.send(fs.readFileSync(jsPathMin));
});

app.use(express.static(process.env.PUBLIC_PATH));

app.use(async (req, res, next) => {
  if (req.cookies.token === undefined) {
    log.debug(`token not sent in cookies`);
    return next();
  }
  try {
    log.debug(`token sent in cookies`);
    let token;
    try {
      token = decrypt(decodeURIComponent(req.cookies.token));
    } catch (e) {
      log.debug(`token sent could not be decrypted`);
      res.clearCookie('token', {
        SameSite: 'Strict',
        httpOnly: false,
        Path: '/',
      });
      return next();
    }
    const sess = await Session.findOne({where: {token}});
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
app.use('/file', require('./routes/file'));
app.use('/module', require('./routes/module'));
// app.use('/lesson', require('./routes/lesson'));
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
