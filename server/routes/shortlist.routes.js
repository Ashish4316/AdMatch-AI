const express = require('express');

const { protect } = require('../middlewares/auth.middleware');
const {
  addToShortlist,
  getMyShortlist,
  removeFromShortlist,
} = require('../controllers/shortlist.controller');

const router = express.Router();

router.post('/add', protect, addToShortlist);
router.get('/my-list', protect, getMyShortlist);
router.delete('/remove/:id', protect, removeFromShortlist);

module.exports = router;
