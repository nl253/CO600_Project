// 3rd Party
const fs = require('fs');
const {validCols, needs, isLoggedIn} = require('../../lib');
const {suggestRoutes, msg} = require('../lib');
const {NoSuchRecord, NotLoggedIn, DeniedErr} = require('../../errors');
const router = require('express').Router();
const {IncomingForm} = require('formidable');

const {Lesson, Module, User, sequelize, File} = require('../../../database');

router.get(['/:id/download', '/:id/content'], isLoggedIn(),
  async (req, res) => {
    try {
      const lesson = await Lesson.findOne({where: {id: req.params.id}}).then(l => l.dataValues);
      res.set('Content-Type', 'text/html');
      res.send(lesson.content);
      return res.end();
    } catch (e) {
      return next(e);
    }
  });

router.delete('/:id', isLoggedIn(),
  async (req, res, next) => {
    if (!res.locals.loggedIn) return new NotLoggedIn();
    try {
      const lesson = await Lesson.findOne({where: {id: req.params.id}});
      if (lesson === null) {
        return new NoSuchRecord('Lesson',
          {id: req.params.id});
      }
      const module = await Module.findOne({where: {id: lesson.moduleId}});
      const author = await User.findOne({where: {id: module.authorId}});
      if (author.id !== res.locals.loggedIn.id) {
        return next(new DeniedErr(`delete lesson ${req.params.id}`));
      }
      await lesson.destroy();
      return res.json(msg(`deleted lesson`));
    } catch (e) {
      return next(e);
    }
  });

router.post('/create',
  needs('moduleId', 'body'),
  isLoggedIn(),
  validCols(Lesson),
  async (req, res, next) => {
    try {
      const {moduleId} = req.body;
      let order = await sequelize.query(`SELECT max(id)
                                           FROM (SELECT id
                                                 FROM Lesson
                                                 WHERE moduleId = :moduleId)`,
        {replacements: {moduleId}})
        .spread((res, meta) => res[0]['max(id)']);
      if (!order) order = 1;
      order++;
      const lesson = await Lesson.create(Object.assign({order}, req.body));
      return res.json(msg(`successfully created lesson`, lesson.dataValues));
    } catch (err) {
      return next(err);
    }
  });

router.post(['/:id', '/:id/update', '/:id/modify'], isLoggedIn(),
  async (req, res, next) => {
    if (!res.locals.loggedIn) return new NotLoggedIn();
    try {
      let lesson = await Lesson.findOne({where: {id: req.params.id}});
      if (lesson === null) {
        return next(new NoSuchRecord('Lesson', {id: req.params.id}));
      }
      const module = await Module.findOne({where: {id: lesson.moduleId}});
      const author = await User.findOne({where: {id: module.authorId}});
      if (author.id !== res.locals.loggedIn.id) {
        return next(new DeniedErr(`delete lesson ${req.params.id}`));
      }
      return Object.assign(new IncomingForm(), {multiples: true, keepExtensions: true})
        .parse(req, async (err, fields, files) => {
          console.log(fields);
          console.log(req.body);
          console.log(files);
          const promises = [lesson.update(fields)];
          if (files.lesson) {
            promises.push(lesson.update({
              content: fs.readFileSync(files.lesson.path),
            }));
          }
          // attachments
          for (const i in files) {
            const f = files[i];
            if (f.size > 0 && f.name !== 'lesson') {
              promises.push(File.create({
                lessonId: lesson.id,
                name: f.name,
                data: fs.readFileSync(f.path),
              }));
            }
          }
          await Promise.all(promises);
          return res.json(msg('updated lesson'));
        });
    } catch (e) {
      return next(e);
    }
  });

router.get(['/', '/search'], validCols(Lesson, 'query'),
  async (req, res, next) => {
    const lessons = await Lesson.findAll({
      where: req.query,
      order: sequelize.col('order'),
      limit: process.env.MAX_RESULTS || 100,
    }).then(ls => ls.map(l => l.dataValues));
    let s = `found ${lessons.length} lessons`;
    if (Object.entries(req.query).length > 0) {
      s += ` matching given ${Object.keys(req.query).join(', ')}`;
    }
    return res.json(msg(s, lessons));
  });

suggestRoutes(router, /.*/, {});

module.exports = router;
