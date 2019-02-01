
const fs = require('fs');
const path = require('path');

require('./env')();

const {User, Session, Sequelize} = require('./database');
const {decrypt} = require('./routes/lib');
const log = require('./lib').createLogger({label: 'APP', fileLvl: 'debug', lvl: 'debug'});
const babel = require('babel-core');
const express = require('express');
const app = express();
require('./locals')(app);

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Allow-Headers', ['Origin', 'X-Requested-With', 'Content-Type', 'Accept'].join(', '));
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

let requestCount = 0;

function cleanupSess() {
  if (requestCount > 100) {
    requestCount = 0;
    log.warn('session clean-up');
    Session.findAll({where: {updatedAt: {[Sequelize.Op.lt]: new Date(Date.now() - parseInt(process.env.SESSION_TIME))}}})
      .then(ss => ss.forEach(s => s.destroy()));
  }
}

app.use(async (req, res, next) => {
  if (req.originalUrl.match(/^\/(javascript|stylesheet|image)s\//)) {
    return next();
  }
  requestCount++;
  if (!req.cookies.token) {
    if (!req.originalUrl.match(/^\/api\//)) {
      log.debug(`token not sent in cookies`);
      cleanupSess();
    }
    return next();
  }
  try {
    log.debug(`token sent in cookies`);
    let token = null, sess = null;
    try {
      token = decrypt(decodeURIComponent(req.cookies.token));
    } catch (e) {
      log.debug(`token sent could not be decrypted`);
      res.set('Set-Cookie', `token=; HttpOnly; Max-Age=0; SameSite=Strict; Path=/`);
      return next();
    }
    try {
      sess = await Session.findOne({where: {token}});
    } catch (e) {
      log.debug(`token sent could not be decrypted`);
      res.set('Set-Cookie', `token=; HttpOnly; Max-Age=0; SameSite=Strict; Path=/`);
      return next();
    }
    if (sess === null) {
      log.debug(`token sent does not correspond to a session`);
      res.set('Set-Cookie', `token=; HttpOnly; Max-Age=0; SameSite=Strict; Path=/`);
      return next();
    } else if (sess.updatedAt <= new Date((Date.now() - parseInt(process.env.SESSION_TIME)))) {
      log.debug(`token sent is stale, destroying associated session`);
      sess.destroy();
      res.set('Set-Cookie', `token=; HttpOnly; Max-Age=0; SameSite=Strict; Path=/`);
      return next();
    }
    // log.debug(`valid token sent, refreshing it`);
    // sess.update({email: sess.email});
    res.locals.loggedIn = await User.findOne({
      where: {email: sess.email},
      attributes: {exclude: ['password']},
    }).then(u => u.dataValues);
    return next();
  } catch (err) {
    return next(err);
  }
});

app.get(/.*/, (req, res, next) => {
  if (process.env.NODE_ENV !== 'development') {
    res.set({
      'Cache-Control': ['private', `max-age=${process.env.SESSION_TIME}`, 'only-if-cached', 'immutable'].join(', '),
      'Expires': new Date(
        (Date.now() + parseInt(process.env.SESSION_TIME))).toString()
        .replace(/ GMT.*/, ' GMT'),
    });
  }
  return next();
});

app.use(
  require('node-sass-middleware')({
    src: process.env.PUBLIC_PATH,
    dest: process.env.PUBLIC_PATH,
    maxAge: parseInt(process.env.SESSION_TIME),
    force: process.env.NODE_ENV === 'development',
    debug: false,
    outputStyle: 'compressed',
    // true = .sass and false = .scss
    indentedSyntax: false,
    sourceMap: true,
  }),
);

app.get(/\/javascripts\/.*\.js$/, async (req, res, next) => {
  res.set('Content-Type', 'application/javascript');
  res.set('X-SourceMap', `${req.originalUrl}.map`);
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

app.use((req, res, next) => {
  res.set({
    'Cache-Control': 'no-cache',
    'Expires': new Date((Date.now() - 1000).toString().replace(/ GMT.*/, ' GMT')),
  });
  return next();
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
