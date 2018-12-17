const {IncomingForm} = require('formidable');
const express = require('express');
const isLoggedIn = require('../lib').isLoggedIn;
const router = express.Router();
const {join} = require('path');
const {readFileSync} = require('fs');
const {log} = require('../lib');

const {APIErr, NoSuchRecord, InvalidRequestErr, NotLoggedIn} = require('../errors');
const {Enrollment, Module, Lesson, Rating, sequelize, User, File} = require('../../database');

const MEDIA_REGEX = /.+\.((pn|jpe?|mp[34])g|gif)$/;

router.get('/edit', isLoggedIn(),
  async (req, res, next) => {
    try {
      const context = {};
      context.modules = await Module.findAll({where: {authorId: res.locals.loggedIn.id}}).then(ms => ms.map(m => m.dataValues));
      for (let module = 0; module < context.modules.length; module++) {
        context.modules[module].lessons = await Lesson.findAll({
          where: {moduleId: context.modules[module].id}}).then(ls => ls.map(l => {
          l.dataValues.content = l.dataValues.content === null ? false : true;
          l.dataValues.files = [];
          return l.dataValues;
        }));
        for (let lesson = 0; lesson < context.modules[module].lessons.length; lesson++) {
          context.modules[module].lessons[lesson].files = await File.findAll({
            attributes: { exclude: ['data'] },
            where: {
              lessonId: context.modules[module].lessons[lesson].id,
            }}).then(fs => fs.map(f => f.dataValues));
        }
      }
      return res.render(join('module', 'edit'), context);
    } catch (e) {
      log(e.msg || e.message || e.toString());
      return next(e);
    }
  });

router.get([
  '/:moduleId/:lessonId/download',
  '/:moduleId/:lessonId/content'], async (req, res) => {
  if (!res.locals.loggedIn) return next(new NotLoggedIn());
  try {
    const lesson = await Lesson.findOne({where: {id: req.params.lessonId}}).then(l => l.dataValues);
    res.set('Content-Type', 'text/html');
    res.send(lesson.content);
    return res.end();
  } catch (e) {
    return next(e);
  }
});

router.get('/:moduleId/:lessonId/edit',
  async (req, res, next) => {
    if (!res.locals.loggedIn) return next(new NotLoggedIn());
    try {
      let lesson = Lesson.findOne({where: {id: req.params.lessonId, moduleId: req.params.moduleId}}).then(l => l.dataValues);
      const module = await Module.findOne({where: {id: req.params.moduleId}}).then(m => m.dataValues);
      if (module === null) {
        return next(new NoSuchRecord('Module', {id: req.params.moduleId}));
      }
      if (res.locals.loggedIn.id !== module.authorId) return next(new NotLoggedIn());
      const author = res.locals.loggedIn;
      lesson = await lesson;
      if (lesson === null) {
        return next(new NoSuchRecord('Lesson', {id: req.params.lessonId}));
      }
      module.isMine = true;
      lesson.isMine = true;
      lesson.module = module;
      lesson.author = author;
      module.author = author;
      lesson.files = await File.findAll({
        where: {lessonId: req.params.lessonId},
        attributes: Object.keys(File.attributes).filter(l => l !== 'data'),
      }).then(fs => fs.map(f => f.dataValues));
      lesson.module.lessons = await Lesson.findAll({
        attributes: Object.keys(Lesson.attributes).filter(a => a !== 'content'),
        where: {
          moduleId: req.params.moduleId,
        }}).then(ls => ls.map(l => l.dataValues));
      return res.render(join('lesson', 'edit'), {lesson, module, author});
    } catch (e) {
      return next(e);
    }
  });


router.get('/:id/edit', async (req, res, next) => {
  if (!res.locals.loggedIn) return next(new NotLoggedIn());
  let moduleId = req.params.id, id = req.params.id, rating = Promise.resolve(0), ratings = Promise.resolve([]);
  const module = await Module.findOne({where: {id}});
  if (module === null) return next(new NoSuchRecord('Module', {id}));
  if (res.locals.loggedIn.id !== module.dataValues.authorId) return next(new NotLoggedIn());
  const moduleInfo = module.dataValues;
  const lessons = Lesson.findAll({where: {moduleId}}).then(ls => ls.map(l => l.dataValues));
  const author = User.findOne({where: {id: moduleInfo.authorId}}).then(a => a.dataValues);

  if ((await sequelize.query(`
    SELECT count(*) AS ratingCount
    FROM Rating AS r INNER JOIN Module AS m on r.moduleId = m.id
    WHERE m.id = :id`, {replacements: {id}}))[0][0].ratingCount > 0) {
    rating = sequelize.query(`
      SELECT avg(stars) AS average
      from Rating AS r INNER JOIN Module AS m
      WHERE r.moduleId = m.id AND m.id = :id`, {replacements: {id}}).then(r => r[0][0].average);
    ratings = Rating.findAll({
      order: sequelize.literal('createdAt DESC'),
      limit: 5,
      where: {moduleId},
    }).then(rs => rs.map(r => r.dataValues))
      .then(async rs => {
        const attributes = Object.keys(User.attributes).filter(a => a !== 'password');
        for (let i = 0; i < rs.length; i++) {
          rs[i].rater = User.findOne({where: {id: rs[i].raterId}, attributes}).then(u => u.dataValues);
        }
        for (let i = 0; i < rs.length; i++) rs[i].rater = await rs[i].rater;
        return rs;
      });
  }

  const topics  = sequelize.query(`SELECT topic FROM Module GROUP BY topic`)
    .then(result => result[0])
    .then(rows => rows.map(r => r.topic));
  moduleInfo.lessons = await lessons;
  moduleInfo.author = await author;
  moduleInfo.rating = await rating;
  moduleInfo.ratings = await ratings;
  moduleInfo.topics  = await topics;

  if (res.locals.loggedIn) {
    moduleInfo.isMine = res.locals.loggedIn.id === moduleInfo.authorId;
    moduleInfo.isEnrolled = !moduleInfo.isMine && (await Enrollment.findOne({where: {moduleId, studentId: res.locals.loggedIn.id}})) !== null;
  }

  return res.render(join('module', 'edit'), {module: moduleInfo});
});

router.get('/:moduleId/:lessonId',
  async (req, res, next) => {
    if (!res.locals.loggedIn) return next(new NotLoggedIn());
    try {
      let lesson = Lesson.findOne({where: {id: req.params.lessonId}});
      const module = await Module.findOne({where: {id: req.params.moduleId}}).then(m => m.dataValues);
      const author = await User.findOne({where: {id: module.authorId}}).then(u => u.dataValues);
      lesson = await lesson;
      if (lesson === null) {
        return next(new NoSuchRecord('Lesson', {id: req.params.lessonId}));
      }
      lesson = lesson.dataValues;
      if (author.id !== res.locals.loggedIn.id && await Enrollment.findOne({where: {studentId: res.locals.loggedIn.id, moduleId: req.params.moduleId}}) === null) {
        return next(new NoSuchRecord('Enrollment', {email: res.locals.loggedIn.email}));
      }
      module.isMine = author.id === res.locals.loggedIn.id;
      lesson.isMine = author.id === res.locals.loggedIn.id;
      lesson.module = module;
      lesson.author = author;
      module.author = author;
      lesson.files = await File.findAll({
        where: {lessonId: req.params.lessonId},
        attributes: Object.keys(File.attributes).filter(f => f !== 'data'),
      }).then(fs => fs.map(f => f.dataValues));
      lesson.module.lessons = await Lesson.findAll({
        attributes: Object.keys(Lesson.attributes).filter(a => a !== 'content'),
        where: {
          moduleId: req.params.moduleId,
        }}).then(ls => ls.map(l => l.dataValues));
      return res.render(join('lesson', 'view'), {lesson, module, author});
    } catch (e) {
      return next(e);
    }
  });

router.post([
    '/:moduleId/:lessonId',
    '/:moduleId/:lessonId/edit',
    '/:moduleId/:lessonId/update',
    '/:moduleId/:lessonId/modify',
  ],
  (req, res, next) => {
    if (!res.locals.loggedIn) return next(new NotLoggedIn());
    return new IncomingForm().parse(req,
      async (err, fields, files) => {
        try {

          for (const f in fields) {
            if (Object.keys(Lesson.attributes).indexOf(f) < 0) {
              return next(new InvalidRequestErr('Lesson', f));
            } else if (f === 'updatedAt' || f === 'createdAt') {
              return next(new InvalidRequestErr('Lesson', f));
            }
          }

          console.warn('about to check lesson size');
          if (files.lesson.name && !files.lesson.name.match(/\.html?$/)) {
            return next(new APIErr(`was expecting an HTML file and not ${files.lesson.name}`, 400));
          }

          const lesson = await Lesson.findOne({
            where: {
              moduleId: req.params.moduleId,
              id: req.params.lessonId,
            }
          });
          if (lesson === null) {
            return next(new NoSuchRecord('Lesson', {id: req.params.lessonId}));
          }
          const vars = {};
          if (files.lesson.name) {
            vars.content = readFileSync(files.lesson.path);
          }
          for (const pair of Object.entries(fields)) {
            const [field, val] = pair;
            vars[field] = val !== null && val.trim() !== '' ? val : null;
          }
          await lesson.update(vars);
          await Promise.all(
            Object.keys(files)
              .filter(fileName => fileName !== 'lesson')
              .filter(fileName => files[fileName].name !== '' && files[fileName].size > 0)
              .map(fileName => MEDIA_REGEX.test(files[fileName].name)
                ? File.create({
                  lessonId: lesson.id,
                  name: files[fileName].name,
                  data: readFileSync(files[fileName].path),
                })
                : Promise.reject(new APIErr(`invalid file type ${fileName}`))));
          return res.redirect(req.originalUrl.replace(/(\/edit)?\/?$/, '/edit'));
        } catch (e) {
          return next(e);
        }
      });
  });


router.get('/search', (req, res) => res.render(join('module', 'search')));

router.get('/:id', async (req, res, next) => {
  let moduleId = req.params.id, id = req.params.id, rating = Promise.resolve(0), ratings = Promise.resolve([]);
  const module = await Module.findOne({where: {id}});
  if (module === null) return next(new NoSuchRecord('Module', {id}));
  const moduleInfo = module.dataValues;
  const lessons = Lesson.findAll({where: {moduleId}}).then(ls => ls.map(l => l.dataValues));
  const author = User.findOne({where: {id: moduleInfo.authorId}}).then(a => a.dataValues);

  if ((await sequelize.query(`
    SELECT count(*) AS ratingCount
    FROM Rating AS r INNER JOIN Module AS m on r.moduleId = m.id
    WHERE m.id = :id`, {replacements: {id}}))[0][0].ratingCount > 0) {
    rating = sequelize.query(`
      SELECT avg(stars) AS average
      from Rating AS r INNER JOIN Module AS m
      WHERE r.moduleId = m.id AND m.id = :id`, {replacements: {id}}).then(r => r[0][0].average);
    ratings = Rating.findAll({
      order: sequelize.literal('createdAt DESC'),
      limit: 5,
      where: {moduleId},
    }).then(rs => rs.map(r => r.dataValues))
      .then(async rs => {
        const attributes = Object.keys(User.attributes).filter(a => a !== 'password');
        for (let i = 0; i < rs.length; i++) {
          rs[i].rater = User.findOne({where: {id: rs[i].raterId}, attributes}).then(u => u.dataValues);
        }
        for (let i = 0; i < rs.length; i++) rs[i].rater = await rs[i].rater;
        return rs;
      });
  }

  const topics  = sequelize.query(`SELECT topic FROM Module GROUP BY topic`)
    .then(result => result[0])
    .then(rows => rows.map(r => r.topic));
  moduleInfo.lessons = await lessons;
  moduleInfo.author = await author;
  moduleInfo.rating = await rating;
  moduleInfo.ratings = await ratings;
  moduleInfo.topics  = await topics;

  if (res.locals.loggedIn) {
    moduleInfo.isMine = res.locals.loggedIn.id === moduleInfo.authorId;
    moduleInfo.isEnrolled = !moduleInfo.isMine && (await Enrollment.findOne({where: {moduleId, studentId: res.locals.loggedIn.id}})) !== null;
  }

  return res.render(join('module', 'view'), {module: moduleInfo});
});

router.get('/', (req, res) => res.redirect('/module/search'));

module.exports = router;
