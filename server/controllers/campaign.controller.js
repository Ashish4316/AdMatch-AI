const { query } = require('../config/db');
const { extractCampaignKeywords } = require('../services/gemini.service');
const { sendCreated, sendSuccess, sendBadRequest, sendNotFound } = require('../utils/apiResponse');

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

const createCampaign = async (req, res, next) => {
  try {
    const { title, description, targetAudience, budget } = req.body;

    if (!title || !description || !targetAudience) {
      return sendBadRequest(res, 'title, description and targetAudience are required.');
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
    return sendCreated(res, {
      message: 'Campaign created and keywords extracted successfully.',
      data: {
        campaign: normalizeCampaign(campaign),
        niche: extraction.niche,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getCampaignById = async (req, res, next) => {
  try {
    const campaignId = Number.parseInt(req.params.campaignId, 10);
    if (!campaignId) {
      return sendBadRequest(res, 'Valid campaignId is required.');
    }

    const { rows } = await query(
      `SELECT id, company_id, title, description, target_audience, budget, extracted_keywords, status, created_at
       FROM campaigns
       WHERE id = $1 AND company_id = $2
       LIMIT 1`,
      [campaignId, req.company.id]
    );

    if (rows.length === 0) {
      return sendNotFound(res, 'Campaign not found.');
    }

    return sendSuccess(res, {
      message: 'Campaign fetched successfully.',
      data: {
        campaign: normalizeCampaign(rows[0]),
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createCampaign,
  getCampaignById,
};
