const express = require('express');
const router = express.Router();
const {join} = require('path');

const NoSuchRecord = require('../errors').NoSuchRecord;
const {Enrollment, Module, Lesson, Rating, sequelize, Sequelize} = require(
  '../database');

/**
 * Search page for all modules.
 */
router.get('/search', (req, res) => res.render(join('module', 'search')));


/**
 * Public info about a module.
 */
router.get('/:name',
  (req, res, next) => {
    const {name} = req.params;
    return Module.findOne({where: {name}})
      .then((m) => m === null
        ? Promise.reject(new NoSuchRecord('Module', {name: req.params.name}))
        : m.dataValues)
      .then((moduleInfo) =>
        Lesson.findAll({where: {module: moduleInfo.name}})
          .then((lessons) => {
            moduleInfo.lessons = lessons.map(l => l.dataValues);
            return sequelize.query(`SELECT avg(stars) AS average
                                    from Rating AS r
                                           INNER JOIN Module AS m
                                    WHERE r.module = m.name`)
              .spread((avg, metadata) => {
                moduleInfo.rating = avg[0].average;
                return Rating.findAll({
                  order: sequelize.literal('createdAt DESC'),
                  limit: 20,
                  where: {module: moduleInfo.name},
                }).then((ratings) => {
                  moduleInfo.ratings = ratings.map(r => r.dataValues);
                  return res.locals.loggedIn === undefined
                    ? res.render(join('module', 'index'), {module: moduleInfo})
                    : Enrollment.findOne({
                      where: {
                        module: moduleInfo.name,
                        student: res.locals.loggedIn.email,
                      },
                    }).then(enrollment => {
                      moduleInfo.enrolled = enrollment !== null;
                      return res.render(join('module', 'index'),
                        {module: moduleInfo});
                    });
                });
              });
          }),
      ).catch((err) => next(err));
  });

router.get('/', (req, res) => res.redirect('/module/search'));

module.exports = router;
