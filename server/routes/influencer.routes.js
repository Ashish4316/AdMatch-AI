const express = require('express');

const { protect } = require('../middlewares/auth.middleware');
const {
  fetchInfluencerByChannelId,
  refreshAllInfluencers,
} = require('../controllers/influencer.controller');

const router = express.Router();

router.get('/:channelId', protect, fetchInfluencerByChannelId);
router.post('/refresh-all', protect, refreshAllInfluencers);

module.exports = router;
