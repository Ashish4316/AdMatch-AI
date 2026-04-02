const { query } = require('../config/db');
const { extractCampaignKeywords } = require('../services/gemini.service');
const { success, error } = require('../utils/response');

const normalizeCampaign = (row) => ({
  id: row.id,
  companyId: row.company_id,
  title: row.title,
  description: row.description,
  targetAudience: row.target_audience,
  budget: row.budget,
  extractedKeywords: row.extracted_keywords || [],
  status: row.status,
  createdAt: row.created_at,
});

const normalizeMatch = (row) => ({
  id: row.id,
  campaignId: row.campaign_id,
  influencerId: row.influencer_id,
  matchScore: Number(row.match_score),
  reason: row.ai_reason,
  createdAt: row.created_at,
  influencer: {
    id: row.influencer_id,
    name: row.influencer_name,
    niche: row.influencer_niche,
    subscribers: row.influencer_subscribers,
    avgViews: row.influencer_avg_views,
    engagementRate: row.influencer_engagement_rate,
  },
});

const createCampaign = async (req, res, next) => {
  try {
    const { title, description, targetAudience, budget } = req.body;

    if (!title || !description || !targetAudience) {
      return error(res, 'title, description and targetAudience are required.', 400);
    }

    const cleanedBudget = Number.parseInt(budget || '0', 10) || 0;

    const extraction = await extractCampaignKeywords({
      description: String(description).trim(),
      targetAudience: String(targetAudience).trim(),
    });

    const { rows } = await query(
      `INSERT INTO campaigns
        (company_id, title, description, target_audience, budget, extracted_keywords, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, 'pending', NOW())
       RETURNING id, company_id, title, description, target_audience, budget, extracted_keywords, status, created_at`,
      [
        req.company.id,
        String(title).trim(),
        String(description).trim(),
        String(targetAudience).trim(),
        cleanedBudget,
        JSON.stringify(extraction.keywords),
      ]
    );

    const campaign = rows[0];
    return success(
      res,
      'Campaign created and keywords extracted successfully.',
      {
        campaign: normalizeCampaign(campaign),
        niche: extraction.niche,
      },
      201
    );
  } catch (error) {
    return next(error);
  }
};

const getCampaignById = async (req, res, next) => {
  try {
    const campaignId = Number.parseInt(req.params.id, 10);
    if (!campaignId) {
      return error(res, 'Valid campaign id is required.', 400);
    }

    const campaignResult = await query(
      `SELECT id, company_id, title, description, target_audience, budget, extracted_keywords, status, created_at
       FROM campaigns
       WHERE id = $1 AND company_id = $2
       LIMIT 1`,
      [campaignId, req.company.id]
    );

    if (campaignResult.rows.length === 0) {
      return error(res, 'Campaign not found.', 404);
    }

    const matchesResult = await query(
      `SELECT
         m.id,
         m.campaign_id,
         m.influencer_id,
         m.match_score,
         m.ai_reason,
         m.created_at,
         i.name AS influencer_name,
         i.niche AS influencer_niche,
         i.subscribers AS influencer_subscribers,
         i.avg_views AS influencer_avg_views,
         i.engagement_rate AS influencer_engagement_rate
       FROM matches m
       LEFT JOIN influencers i ON i.id = m.influencer_id
       WHERE m.campaign_id = $1
       ORDER BY m.match_score DESC, m.id ASC`,
      [campaignId]
    );

    return success(res, 'Campaign fetched successfully.', {
      campaign: normalizeCampaign(campaignResult.rows[0]),
      matches: matchesResult.rows.map(normalizeMatch),
    });
  } catch (error) {
    return next(error);
  }
};

const getMyCampaigns = async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit || '10', 10)));
    const offset = (page - 1) * limit;

    const [listResult, countResult] = await Promise.all([
      query(
        `SELECT id, company_id, title, description, target_audience, budget, extracted_keywords, status, created_at
         FROM campaigns
         WHERE company_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [req.company.id, limit, offset]
      ),
      query('SELECT COUNT(*)::int AS total FROM campaigns WHERE company_id = $1', [req.company.id]),
    ]);

    const total = countResult.rows[0]?.total || 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return success(res, 'Campaign list fetched successfully.', {
      page,
      limit,
      total,
      totalPages,
      items: listResult.rows.map(normalizeCampaign),
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createCampaign,
  getMyCampaigns,
  getCampaignById,
};
