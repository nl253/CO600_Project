/**
 * TODO retrieve modules in alphabetical order
 */

// 3rd Party
const router = require('express').Router();
const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  // DO NOT USE file filter
});

// Project
const {validCols, needs, isLoggedIn} = require('../../lib');
const {msg} = require('../lib');
const {APIErr, NoSuchRecordErr, DeniedErr} = require('../../errors');
const {Lesson, Module, Sequelize, sequelize, File, Enrollment} = require('../../../database');

router.get(['/:id/download', '/:id/content'], isLoggedIn(),
  async (req, res) => {
    try {
      const lesson = await Lesson.findOne({where: {id: req.params.id}});
      if (lesson === null) {
        throw new NoSuchRecordErr('Lesson', {id: req.params.id});
      }
      const mod = await Module.findOne({where: {id: lesson.moduleId}});
      if (mod.authorId !== res.locals.loggedIn.id && await Enrollment.findOne({where: {
          moduleId: mod.id,
          studentId: res.locals.loggedIn.id}}) === null) {
        throw new DeniedErr('download lesson content');
      }
      res.set('Content-Type', 'text/html');
      res.send(lesson.content);
      return res.end();
    } catch (e) {
      return next(e);
    }
  });

router.delete('/:id', isLoggedIn(),
  async (req, res, next) => {
    try {
      const lesson = await Lesson.findOne({where: {id: req.params.id}});
      if (lesson === null) {
        return new NoSuchRecordErr('Lesson',
          {id: req.params.id});
      }
      const mod = await Module.findOne({where: {id: lesson.moduleId}});
      if (res.locals.loggedIn.id !== mod.authorId) {
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

router.post(['/:id', '/:id/update', '/:id/modify'],
  isLoggedIn(),
  upload.any(), // the only one that works DON'T TRY OTHERS
  validCols(Lesson),
  async (req, res, next) => {
    try {
      let lesson = await Lesson.findOne({where: {id: req.params.id}});
      if (lesson === null) {
        return next(new NoSuchRecordErr('Lesson', {id: req.params.id}));
      }
      const mod = await Module.findOne({where: {id: lesson.moduleId}});
      if (mod.authorId !== res.locals.loggedIn.id) {
        throw new DeniedErr(`delete lesson ${req.params.id}`);
      }
      const existingFileNames = await File.findAll({
        where: {lessonId: lesson.id},
        attributes: ['name'],
      }).then(ns => ns.map(n => n.dataValues.name));
      // console.log(existingFileNames.length === 0 ? 'no existing files' : `existing files: ${existingFileNames.join(', ')}`);
      // console.debug(req.files);
      // console.debug(req.body);
      const maybeLessFile = req.files.find(f => f.fieldname === 'lesson');
      if (maybeLessFile && !maybeLessFile.originalname.match(/\.x?html?$/)) {
        return next(new APIErr('Invalid lesson content file.'));
      }
      for (const f of req.files) {
        if (existingFileNames.indexOf(f.fieldname) >= 0) {
          return next(new APIErr(`File ${f.fieldname} already uploaded.`));
        }
      }
      for (const k in req.body) {
        if (req.body[k].trim() === '') {
          req.body[k] = null;
        }
      }
      if (maybeLessFile) req.body.content = maybeLessFile.buffer;
      lesson = await lesson.update(req.body);
      for (const f of req.files) {
        if (f.fieldname !== 'lesson') {
          await File.create({
            lessonId: lesson.id,
            name: f.fieldname,
            data: f.buffer,
          });
        }
      }
      return res.json(msg('updated lesson', lesson.dataValues));
    } catch (e) {
      console.error(e);
      return next(e);
    }
  });

router.get(['/', '/search'],
  validCols(Lesson, 'query', []),
  async (req, res, next) => {
    try {
      for (const attr of ['name', 'summary', 'content']) {
        if (req.query[attr]) {
          req.query[attr] = {[Sequelize.Op.like]: `%${req.query[attr]}%`};
        }
      }
      for (const dateAttr of ['createdAt', 'updatedAt']) {
        if (req.query[dateAttr]) {
          req.query[dateAttr] = {[Sequelize.Op.gte]: new Date(Date.parse(req.query[dateAttr]))};
        }
      }
      const lessons = await Lesson.findAll({
        where: req.query,
        order: sequelize.col('order'),
        limit: process.env.MAX_RESULTS || 100,
      }).then(ls => ls.map(l => l.dataValues));
      for (const l of lessons.filter(l => l.content)) {
        l.content = l.content.toString();
      }
      let s = `found ${lessons.length} lessons`;
      if (Object.entries(req.query).length > 0) {
        s += ` matching given ${Object.keys(req.query).join(', ')}`;
      }
      return res.json(msg(s, lessons));
    } catch (e) {
      return next(e);
    }
  });

module.exports = router;
