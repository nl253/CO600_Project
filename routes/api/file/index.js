// 3rd Party
const {isLoggedIn} = require('../../lib');
const {suggestRoutes, msg} = require('../lib');
const {NoSuchRecord} = require('../../errors');
const router = require('express').Router();

// Project
const {validCols} = require('../../lib');
const {File} = require('../../../database');

router.delete(['/:id', '/:id/delete', '/:id/remove'], isLoggedIn(),
  async (req, res, next) => {
    try {
      const {id} = req.params;
      const file = await File.findOne({where: {id}});
      if (file === null) return next(new NoSuchRecord('File', {id}));
      const fileName = file.name;
      await file.destroy();
      return res.json(msg(`deleted ${fileName} from lesson`));
    } catch (e) {
      return next(e);
    }
  });

router.get(['/', '/search'], isLoggedIn(),
  validCols(File, 'query'),
  async (req, res, next) => {
    try {
      const files = await File
        .findAll({where: req.query, limit: process.env.MAX_RESULTS || 100})
        .then(fs => fs.map(f_ => {
          f = f_.dataValues;
          f.data = f.data ? true : false;
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


suggestRoutes(router, {});

module.exports = router;
