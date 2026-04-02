const express = require('express');

const { protect } = require('../middlewares/auth.middleware');
const { generateCampaignMatches, getCampaignMatches } = require('../controllers/match.controller');

const router = express.Router();

router.post('/campaign/:campaignId', protect, generateCampaignMatches);
router.get('/campaign/:campaignId', protect, getCampaignMatches);

module.exports = router;
