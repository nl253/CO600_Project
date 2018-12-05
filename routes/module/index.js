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

/**
 * Public info about a module.
 */
router.get('/:id',
  (req, res, next) => {
    const {id} = req.params;
    return Module.findOne({where: {id}})
      .then((m) => m === null
        ? Promise.reject(new NoSuchRecord('Module', {id}))
        : m.dataValues)
      .then((moduleInfo) => {
          if (res.locals.loggedIn && res.locals.loggedIn.id === moduleInfo.authorId) {
            moduleInfo.isMine = true;
          }
          return Lesson.findAll({where: {moduleId: id}})
            .then((lessons) => {
              moduleInfo.lessons = lessons.map(l => l.dataValues);
              return sequelize.query(`SELECT avg(stars) AS average
                                      from Rating AS r
                                             INNER JOIN Module AS m
                                      WHERE r.moduleId = m.id`)
                .spread((avg, metadata) => {
                  moduleInfo.rating = avg[0].average;
                  return Rating.findAll({
                    order: sequelize.literal('createdAt DESC'),
                    limit: 5,
                    where: {moduleId: moduleInfo.id},
                  }).then(async (ratings) => {
                    moduleInfo.ratings = ratings.map(r => r.dataValues);
                    for (let i = 0 ; i < moduleInfo.ratings.length; i++) {
                      moduleInfo.ratings[i].rater = (await User.findOne({where: {id: moduleInfo.ratings[i].raterId}})).dataValues;
                    }
                    return res.locals.loggedIn === undefined
                      ? res.render(join('module', 'index'), {module: moduleInfo})
                      : Enrollment.findOne({
                        where: {
                          moduleId: moduleInfo.id,
                          studentId: res.locals.loggedIn.id,
                        },
                      }).then(enrollment => {
                        moduleInfo.enrolled = enrollment !== null;
                        return User.findOne({where: {id: moduleInfo.authorId}}).then(author => {
                          moduleInfo.author = author;
                          return res.render(join('module', 'index'), {module: moduleInfo});
                        })
                      });
                  });
                });
            });
        },
      ).catch((err) => next(err));
  });

router.get('/', (req, res) => res.redirect('/module/search'));

module.exports = router;
