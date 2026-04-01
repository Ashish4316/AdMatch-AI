const {
  fetchAndStoreInfluencerData,
  refreshAllInfluencerData,
} = require('../services/youtube.service');
const { sendSuccess, sendBadRequest, sendError } = require('../utils/apiResponse');

const isValidChannelId = (channelId) => /^UC[\w-]{10,}$/.test(channelId);

const fetchInfluencerByChannelId = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const forceRefresh = req.query.forceRefresh === 'true';

    if (!channelId) {
      return sendBadRequest(res, 'channelId is required.');
    }

    if (!isValidChannelId(channelId)) {
      return sendBadRequest(res, 'Invalid YouTube channel ID format.');
    }

    const data = await fetchAndStoreInfluencerData(channelId, { forceRefresh });

    return sendSuccess(res, {
      message: 'Influencer data fetched successfully.',
      data,
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return sendError(res, { statusCode: 404, message: error.message });
    }

    if (error.message.includes('YOUTUBE_API_KEY')) {
      return sendError(res, { statusCode: 500, message: error.message });
    }

    return next(error);
  }
};

const refreshAllInfluencers = async (req, res, next) => {
  try {
    const result = await refreshAllInfluencerData();
    return sendSuccess(res, {
      message: 'Influencer refresh completed.',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  fetchInfluencerByChannelId,
  refreshAllInfluencers,
};
