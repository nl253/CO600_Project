const express = require('express');
const router = express.Router();

const {File} = require('../../database');

router.get('/:id/:fileName', async (req, res) =>
  res.redirect(`/api/file/${(await File.findOne({
    where: {
      lessonId: req.params.id,
      name: req.params.fileName,
    },
  }).then(f => f.dataValues.id))}`));

module.exports = router;
