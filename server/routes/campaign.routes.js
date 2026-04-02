const express = require('express');

const { protect } = require('../middlewares/auth.middleware');
const { createCampaign, getMyCampaigns, getCampaignById } = require('../controllers/campaign.controller');

const router = express.Router();

router.post('/create', protect, createCampaign);
router.get('/my-campaigns', protect, getMyCampaigns);
router.get('/:id', protect, getCampaignById);

module.exports = router;
