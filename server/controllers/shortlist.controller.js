const { query } = require('../config/db');
const { success, error } = require('../utils/response');

const addToShortlist = async (req, res, next) => {
  try {
    const influencerId = Number.parseInt(req.body.influencerId, 10);
    const campaignIdRaw = req.body.campaignId;
    const campaignId = campaignIdRaw === undefined || campaignIdRaw === null || campaignIdRaw === ''
      ? null
      : Number.parseInt(campaignIdRaw, 10);

    if (!influencerId) {
      return error(res, 'Valid influencerId is required.', 400);
    }

    if (campaignIdRaw !== undefined && campaignId !== null && !campaignId) {
      return error(res, 'campaignId must be a valid number when provided.', 400);
    }

    const influencerResult = await query('SELECT id, name FROM influencers WHERE id = $1 LIMIT 1', [influencerId]);
    if (influencerResult.rows.length === 0) {
      return error(res, 'Influencer not found.', 404);
    }

    if (campaignId !== null) {
      const campaignResult = await query(
        'SELECT id FROM campaigns WHERE id = $1 AND company_id = $2 LIMIT 1',
        [campaignId, req.company.id]
      );

      if (campaignResult.rows.length === 0) {
        return error(res, 'Campaign not found for this company.', 404);
      }
    }

    const duplicateCheck = await query(
      `SELECT id
       FROM shortlists
       WHERE company_id = $1
         AND influencer_id = $2
         AND (campaign_id = $3 OR (campaign_id IS NULL AND $3::int IS NULL))
       LIMIT 1`,
      [req.company.id, influencerId, campaignId]
    );

    if (duplicateCheck.rows.length > 0) {
      return error(res, 'Influencer already shortlisted for this campaign context.', 409);
    }

    const { rows } = await query(
      `INSERT INTO shortlists (company_id, influencer_id, campaign_id, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, company_id, influencer_id, campaign_id, created_at`,
      [req.company.id, influencerId, campaignId]
    );

    return success(res, 'Influencer added to shortlist.', {
      shortlist: rows[0],
    }, 201);
  } catch (err) {
    return next(err);
  }
};

const getMyShortlist = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT
         s.id,
         s.company_id,
         s.influencer_id,
         s.campaign_id,
         s.created_at,
         i.name AS influencer_name,
         i.niche,
         i.subscribers,
         i.avg_views,
         i.engagement_rate,
         i.keywords,
         c.title AS campaign_title
       FROM shortlists s
       JOIN influencers i ON i.id = s.influencer_id
       LEFT JOIN campaigns c ON c.id = s.campaign_id
       WHERE s.company_id = $1
       ORDER BY s.created_at DESC`,
      [req.company.id]
    );

    return success(res, 'Shortlist fetched successfully.', {
      total: rows.length,
      items: rows,
    });
  } catch (err) {
    return next(err);
  }
};

const removeFromShortlist = async (req, res, next) => {
  try {
    const shortlistId = Number.parseInt(req.params.id, 10);
    if (!shortlistId) {
      return error(res, 'Valid shortlist id is required.', 400);
    }

    const { rows } = await query(
      `DELETE FROM shortlists
       WHERE id = $1 AND company_id = $2
       RETURNING id`,
      [shortlistId, req.company.id]
    );

    if (rows.length === 0) {
      return error(res, 'Shortlist item not found.', 404);
    }

    return success(res, 'Shortlist item removed.', {
      removedId: rows[0].id,
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  addToShortlist,
  getMyShortlist,
  removeFromShortlist,
};
