// 3rd Party
const router = require('express').Router();

// Project
const {isLoggedIn} = require('../lib');
const {NoSuchRecordErr} = require('../errors');
const {File} = require('../../database');

const PNG_REGEX = /\.png$/i;
const JPG_REGEX = /\.jpe?g$/i;
const GIF_REGEX = /\.gif$/i;

router.get('/:id', isLoggedIn(),
  async (req, res, next) => {
    const {id} = req.params;
    try {
      const file = await File.findOne({where: {id}});
      if (file === null) {
        return next(new NoSuchRecordErr('File', {id}));
      } else if (file.name.match(PNG_REGEX)) {
        res.set('Content-Type', 'image/png');
      } else if (file.name.match(JPG_REGEX)) {
        res.set('Content-Type', 'image/jpeg');
      } else if (file.name.match(GIF_REGEX)) {
        res.set('Content-Type', 'image/gif');
      }
      return res.send(file.data);
    } catch (e) {
      return next(e);
    }
  });


module.exports = router;
