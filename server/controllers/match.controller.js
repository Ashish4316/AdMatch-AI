const { query, getClient } = require('../config/db');
const { scoreInfluencerMatch } = require('../services/gemini.service');
const { sendSuccess, sendBadRequest, sendNotFound } = require('../utils/apiResponse');
const logger = require('../utils/logger');

const MATCH_CACHE_TTL_MS = 60 * 60 * 1000;
const matchCache = new Map();

const getCachedMatches = (campaignId) => {
  const cached = matchCache.get(campaignId);
  if (!cached) {
    return null;
  }

  if (cached.expiresAt < Date.now()) {
    matchCache.delete(campaignId);
    return null;
  }

  return cached.value;
};

const setCachedMatches = (campaignId, value) => {
  matchCache.set(campaignId, {
    value,
    expiresAt: Date.now() + MATCH_CACHE_TTL_MS,
  });
};

const normalizeMatch = (row) => ({
  id: row.id,
  campaignId: row.campaign_id,
  influencerId: row.influencer_id,
  matchScore: Number(row.match_score),
  reason: row.ai_reason,
  createdAt: row.created_at,
});

const getCampaignForCompany = async (campaignId, companyId) => {
  const { rows } = await query(
    `SELECT id, company_id, title, description, target_audience, budget, extracted_keywords, status, created_at
     FROM campaigns
     WHERE id = $1 AND company_id = $2
     LIMIT 1`,
    [campaignId, companyId]
  );

  return rows[0] || null;
};

const fetchAllInfluencers = async () => {
  const { rows } = await query(
    `SELECT id, youtube_channel_id, name, niche, subscribers, avg_views, engagement_rate, keywords, last_synced
     FROM influencers
     ORDER BY subscribers DESC NULLS LAST, id ASC`
  );

  return rows;
};

const persistMatches = async (campaignId, scoredMatches) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM matches WHERE campaign_id = $1', [campaignId]);

    for (const match of scoredMatches) {
      await client.query(
        `INSERT INTO matches (campaign_id, influencer_id, match_score, ai_reason, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [campaignId, match.influencerId, match.matchScore, match.reason]
      );
    }

    const { rows } = await client.query(
      `SELECT id, campaign_id, influencer_id, match_score, ai_reason, created_at
       FROM matches
       WHERE campaign_id = $1
       ORDER BY match_score DESC, id ASC`,
      [campaignId]
    );

    await client.query('COMMIT');
    return rows;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const runMatching = async (campaign, influencers) => {
  const scoredMatches = [];

  for (const influencer of influencers) {
    const scored = await scoreInfluencerMatch({ campaign, influencer });
    scoredMatches.push({
      influencerId: influencer.id,
      influencer,
      matchScore: scored.matchScore,
      reason: scored.reason,
    });
  }

  scoredMatches.sort((left, right) => right.matchScore - left.matchScore);
  return scoredMatches;
};

const generateCampaignMatches = async (req, res, next) => {
  try {
    const campaignId = Number.parseInt(req.params.campaignId, 10);
    const forceRefresh = req.query.forceRefresh === 'true';

    if (!campaignId) {
      return sendBadRequest(res, 'Valid campaignId is required.');
    }

    const campaign = await getCampaignForCompany(campaignId, req.company.id);
    if (!campaign) {
      return sendNotFound(res, 'Campaign not found.');
    }

    if (!forceRefresh) {
      const cached = getCachedMatches(campaignId);
      if (cached) {
        return sendSuccess(res, {
          message: 'Matches fetched from cache.',
          data: {
            campaignId,
            cacheHit: true,
            totalMatches: cached.length,
            matches: cached,
          },
        });
      }
    }

    const influencers = await fetchAllInfluencers();
    if (influencers.length === 0) {
      return sendSuccess(res, {
        message: 'No influencers available to match.',
        data: {
          campaignId,
          cacheHit: false,
          totalMatches: 0,
          matches: [],
        },
      });
    }

    const scoredMatches = await runMatching(campaign, influencers);
    const persisted = await persistMatches(campaignId, scoredMatches);

    const responseMatches = persisted.map((row) => {
      const influencer = influencers.find((entry) => entry.id === row.influencer_id);
      return {
        ...normalizeMatch(row),
        influencer: influencer
          ? {
              id: influencer.id,
              name: influencer.name,
              niche: influencer.niche,
              subscribers: influencer.subscribers,
              avgViews: influencer.avg_views,
              engagementRate: influencer.engagement_rate,
              keywords: influencer.keywords || [],
            }
          : null,
      };
    });

    setCachedMatches(campaignId, responseMatches);

    return sendSuccess(res, {
      message: 'Influencer matching completed successfully.',
      data: {
        campaignId,
        cacheHit: false,
        totalMatches: responseMatches.length,
        matches: responseMatches,
      },
    });
  } catch (error) {
    logger.error(`Matching failed: ${error.message}`);
    return next(error);
  }
};

const getCampaignMatches = async (req, res, next) => {
  try {
    const campaignId = Number.parseInt(req.params.campaignId, 10);
    if (!campaignId) {
      return sendBadRequest(res, 'Valid campaignId is required.');
    }

    const campaign = await getCampaignForCompany(campaignId, req.company.id);
    if (!campaign) {
      return sendNotFound(res, 'Campaign not found.');
    }

    const { rows } = await query(
      `SELECT id, campaign_id, influencer_id, match_score, ai_reason, created_at
       FROM matches
       WHERE campaign_id = $1
       ORDER BY match_score DESC, id ASC`,
      [campaignId]
    );

    return sendSuccess(res, {
      message: 'Campaign matches fetched successfully.',
      data: {
        campaignId,
        totalMatches: rows.length,
        matches: rows.map(normalizeMatch),
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  generateCampaignMatches,
  getCampaignMatches,
};
