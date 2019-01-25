// 3rd Party
const {isLoggedIn} = require('../../lib');
const {msg} = require('../lib');
const {NoSuchRecordErr, DeniedErr} = require('../../errors');
const router = require('express').Router();

// Project
const {validCols} = require('../../lib');
const {File, Lesson, Module, Sequelize, sequelize} = require('../../../database');

router.delete(['/:id', '/:id/delete', '/:id/remove'], isLoggedIn(),
  async (req, res, next) => {
    try {
      const {id} = req.params;
      const file = await File.findOne({where: {id}});
      if (file === null) {
        throw new new NoSuchRecordErr('File', {id});
      }
      const lesson = await Lesson.findOne({where: {id: file.lessonId}});
      const mod = await Module.findOne({where: {id: lesson.moduleId}});
      if (mod.authorId !== res.locals.loggedIn.id) {
        throw new DeniedErr(`delete file from lesson ${lesson.id} in module ${mod.id}`);
      }
      await file.destroy();
      return res.json(msg(`deleted ${file.name} from lesson`));
    } catch (e) {
      return next(e);
    }
  });

router.get(['/', '/search'],
  validCols(File, 'query', []),
  async (req, res, next) => {
    try {
      if (req.query.name) {
        req.query.name = {[Sequelize.Op.like]: `%${req.query.name}%`};
      }
      for (const dateAttr of ['createdAt', 'updatedAt']) {
        if (req.query[dateAttr]) {
          req.query[dateAttr] = {[Sequelize.Op.gte]: new Date(Date.parse(req.query[dateAttr]))};
        }
      }
      const files = await File
        .findAll({
          where: req.query,
          order: sequelize.col('createdAt'),
          limit: process.env.MAX_RESULTS || 100,
        })
        .then(fs => fs.map(f_ => {
          const f = f_.dataValues;
          f.data = !!f.data;
          return f;
      }));
      let s = `found ${files.length} files`;
      if (Object.entries(req.query).length > 0) {
        s += ` matching given ${Object.keys(req.query).join(', ')}`;
      }
      return res.json(msg(s, files));
    } catch (e) {
      return next(e);
    }
  });

module.exports = router;
