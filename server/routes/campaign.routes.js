const express = require('express');

const { protect } = require('../middlewares/auth.middleware');
const { createCampaign, getCampaignById } = require('../controllers/campaign.controller');

const router = express.Router();

router.post('/', protect, createCampaign);
router.get('/:campaignId', protect, getCampaignById);

module.exports = router;
