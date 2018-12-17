/**
 * TODO AJAX file uploads
 *      Make sure that you have it in the /api/lesson namespace!
 */

const validCols = require('../../lib').validCols;
// 3rd Party
const isLoggedIn = require('../../lib').isLoggedIn;
const {suggestRoutes, msg} = require('../lib');
const {NoSuchRecord} = require('../../errors');
const router = require('express').Router();

// Project
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
      const files = await File.findAll({where: req.query}).then(fs => fs.map(f => f.dataValues));
      let s = `found ${files.length} files`;
      if (Object.entries(req.query).length > 0) {
        s += ` matching given ${Object.keys(req.query).join(', ')}`;
      }
      return res.json(msg(s, files));
    } catch (e) {
      return next(e);
    }
  });

router.get('/:id', isLoggedIn(),
  async (req, res, next) => {
    const {id} = req.params;
    try {
      const file = await File.findOne({where: {id}});
      if (file === null) {
        return next(new NoSuchRecord('File', {id}));
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


suggestRoutes(router, {});

module.exports = router;
