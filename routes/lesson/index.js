const express = require('express');
const router = express.Router();

const {File} = require('../../database');

router.get('/:id/:fileName', async (req, res, next) => {
  console.log(decodeURIComponent(req.originalUrl));
  try {
    const id = await File.findOne({
      attributes: ['id'],
      where: {
        lessonId: req.params.id,
        name: decodeURIComponent(req.params.fileName),
      },
    }).then(f => f.id);
    return res.redirect(`/api/file/${id}`);
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
