const express = require('express');
const isLoggedIn = require('../lib').isLoggedIn;
const router = express.Router();
const {join} = require('path');

const {NoSuchRecord} = require('../errors');
const {Enrollment, Module, Lesson, Rating, sequelize, User} = require('../../database');

router.get('/edit', isLoggedIn(), (req, res) => res.render(join('module', 'edit')));

router.get('/search', (req, res) => res.render(join('module', 'search')));

router.get(['/view', '/learn'], (req, res) => res.render(join('module', 'learn')));

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
