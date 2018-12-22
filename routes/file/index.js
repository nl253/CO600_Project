// 3rd Party
const router = require('express').Router();

// Project
const {isLoggedIn} = require('../lib');
const {NoSuchRecord} = require('../errors');
const {File} = require('../../database');

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


module.exports = router;
