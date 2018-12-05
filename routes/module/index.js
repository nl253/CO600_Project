const {IncomingForm} = require('formidable');
const express = require('express');
const {validColumns, notRestrictedColumns} = require('../lib');
const router = express.Router();
const {join} = require('path');
const {readFile, readFileSync} = require('fs');

const {NoSuchRecord, InvalidRequestErr, NotLoggedIn, MissingDataErr} = require('../errors');
const {Enrollment, Module, Lesson, Rating, sequelize, User} = require('../database');

const NUM_REGEX = /\d+/;
const MEDIA_REGEX = /.+\.((pn|jp)g|gif|mp[34g])$/;

router.get('/:moduleId/:lessonId/:fileName',
  (req, res, next) => res.locals.loggedIn ? next() : res.redirect('/'),
  async (req, res, next) => {
    if (!MEDIA_REGEX.test(req.params.fileName)) {
      return next(new InvalidRequestErr('File', req.params.fileName));
    }
    if (!NUM_REGEX.test(req.params.moduleId)) {
      return next(new InvalidRequestErr('Module', req.params.moduleId));
    }
    if (!NUM_REGEX.text(req.params.lessonId)) {
      return next(new InvalidRequestErr('Lesson', req.params.lessonId));
    }
    const {lessonId, fileName} = req.params;
    try {
      const file = await File.findOne({where: {name: fileName, lessonId}});
      if (file === null) {
        return next(new NoSuchRecord('lesson file', {name: req.params.fileName}));
      } else if (file.name.match('\.png$')) {
        res.set('Content-Type', 'image/png');
      } else if (file.name.match('\.jpe?g$')) {
        res.set('Content-Type', 'image/jpeg');
      } else if (file.name.match('\.gif$')) {
        res.set('Content-Type', 'image/gif');
      }
      return res.send(file.data);
    } catch (e) {
      return next(e);
    }
  });

router.get('/:moduleId/:lessonId',
  async (req, res, next) => {
    if (!res.locals.loggedIn) return next(new NotLoggedIn());
    try {
      let lesson = Lesson.findOne({where: {id: req.params.lessonId}}).then(l => l.dataValues);
      const module = await Module.findOne({where: {id: req.params.moduleId}}).then(m => m.dataValues);
      if (module === null) {
        return next(new NoSuchRecord('Module', {id: req.params.moduleId}));
      }
      if (res.locals.loggedIn.id !== module.authorId && await Enrollment.findOne({
        where: {
          moduleId: req.params.moduleId,
          studentId: res.locals.loggedIn.id,
        }}) === null) {
        throw new NoSuchRecord('Enrollment', {email: res.locals.loggedIn.email})
      }
      const author = await User.findOne({where: {id: module.authorId}}).then(u => u.dataValues);
      lesson = await lesson;
      if (lesson === null) {
        return next(new NoSuchRecord('Lesson', {id: req.params.lessonId}));
      }
      module.isMine = author.id === res.locals.loggedIn.id;
      lesson.isMine = author.id === res.locals.loggedIn.id;
      lesson.module = module;
      lesson.author = author;
      module.author = author;
      return res.render(join('lesson', 'index'), {lesson, module, author});
    } catch (e) {
      return next(e);
    }
  });

router.post([
    '/:moduleId/:lessonId',
    '/:moduleId/:lessonId/update',
    '/:moduleId/:lessonId/modify',
  ],
  (req, res, next) => {
    if (!res.locals.loggedIn) return next(new NotLoggedIn());
    return new IncomingForm().parse(req,
      async (err, fields, files) => {

        for (const f in fields) {
          if (Object.keys(Lesson.attributes).indexOf(f) < 0) {
            return next(new InvalidRequestErr('Lesson', f));
          } else if (f === 'updatedAt' || f === 'createdAt') {
            return next(new InvalidRequestErr('Lesson', f));
          }
        }

        try {
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
              .map(fileName => File.create({
                lessonId: lesson.id,
                name: files[fileName].name,
                data: readFileSync(files[fileName].path),
              })));
          return res.redirect(req.originalUrl);
        } catch (e) {
          return next(e);
        }
      });
  });

router.get('/', (req, res) => res.redirect('/module/search'));

module.exports = router;
