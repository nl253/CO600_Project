const express = require('express');
const router = express.Router();
const {join} = require('path');

const NoSuchRecord = require('../errors').NoSuchRecord;
const {Enrollment, Module, Lesson, Rating, sequelize, User} = require('../database');

/**
 * Search page for all modules.
 */
router.get('/search', (req, res) => res.render(join('module', 'search')));


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
