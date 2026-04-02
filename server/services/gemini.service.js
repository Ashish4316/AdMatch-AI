const { generateContent } = require('../config/gemini');
const logger = require('../utils/logger');

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

const ensureGeminiKey = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }
};

const removeCodeFences = (text) => String(text || '').replace(/```json|```/gi, '').trim();

const safeJsonParse = (text) => {
  const cleaned = removeCodeFences(text);
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
};

const fallbackKeywords = (description, targetAudience) => {
  const corpus = `${description || ''} ${targetAudience || ''}`.toLowerCase();
  const words = corpus
    .split(/[^a-z0-9]+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 4);

  const frequency = new Map();
  words.forEach((word) => {
    frequency.set(word, (frequency.get(word) || 0) + 1);
  });

  return [...frequency.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 10)
    .map(([word]) => word);
};

const extractCampaignKeywords = async ({ description, targetAudience }) => {
  ensureGeminiKey();

  const prompt = [
    'You are an influencer marketing analyst.',
    'Extract campaign niche and practical matching keywords.',
    'Return ONLY valid JSON with this shape:',
    '{"niche":"string","keywords":["keyword1","keyword2"]}',
    'Rules:',
    '- keywords must be 5 to 12 items',
    '- each keyword should be 1 to 3 words',
    '- no hashtags, no punctuation-only tokens',
    '- keep keywords lowercase',
    `Campaign Description: ${description || ''}`,
    `Target Audience: ${targetAudience || ''}`,
  ].join('\n');

  try {
    const responseText = await generateContent(prompt, GEMINI_MODEL, {
      temperature: 0.3,
      maxOutputTokens: 512,
    });

    const parsed = safeJsonParse(responseText);
    const niche = String((Array.isArray(parsed) ? 'General' : parsed?.niche) || 'General').trim() || 'General';
    const modelKeywords = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.keywords)
        ? parsed.keywords
        : null;

    const keywords = Array.isArray(modelKeywords)
      ? modelKeywords
          .map((keyword) => String(keyword || '').toLowerCase().trim())
          .filter((keyword) => keyword.length >= 2)
          .slice(0, 12)
      : fallbackKeywords(description, targetAudience);

    return {
      niche,
      keywords: keywords.length > 0 ? keywords : fallbackKeywords(description, targetAudience),
    };
  } catch (error) {
    logger.error(`Keyword extraction failed: ${error.message}`);
    return {
      niche: 'General',
      keywords: fallbackKeywords(description, targetAudience),
    };
  }
};

const buildInfluencerMatchPrompt = ({ campaign, influencer }) => {
  return [
    'You are scoring influencer-campaign fit for ad partnerships.',
    'Return ONLY valid JSON with this shape:',
    '{"matchScore":78,"reason":"short reason"}',
    'Rules:',
    '- matchScore must be an integer from 0 to 100',
    '- reason must be max 25 words and concrete',
    '- consider niche relevance, audience fit, engagement quality, and keyword overlap',
    `Campaign Title: ${campaign.title || ''}`,
    `Campaign Description: ${campaign.description || ''}`,
    `Target Audience: ${campaign.target_audience || ''}`,
    `Campaign Keywords: ${JSON.stringify(campaign.extracted_keywords || [])}`,
    `Influencer Name: ${influencer.name || ''}`,
    `Influencer Niche: ${influencer.niche || ''}`,
    `Influencer Subscribers: ${influencer.subscribers || 0}`,
    `Influencer Avg Views: ${influencer.avg_views || 0}`,
    `Influencer Engagement Rate: ${influencer.engagement_rate || 0}`,
    `Influencer Keywords: ${JSON.stringify(influencer.keywords || [])}`,
  ].join('\n');
};

const scoreInfluencerMatch = async ({ campaign, influencer }) => {
  ensureGeminiKey();

  try {
    const responseText = await generateContent(buildInfluencerMatchPrompt({ campaign, influencer }), GEMINI_MODEL, {
      temperature: 0.2,
      maxOutputTokens: 300,
    });

    const parsed = safeJsonParse(responseText) || {};
    const scoreRaw = Number(parsed.matchScore);
    const clampedScore = Number.isFinite(scoreRaw)
      ? Math.max(0, Math.min(100, Math.round(scoreRaw)))
      : 0;

    const reason = String(parsed.reason || 'Low relevance due to limited audience and niche alignment.')
      .trim()
      .slice(0, 220);

    return {
      matchScore: clampedScore,
      reason,
    };
  } catch (error) {
    logger.error(`Influencer scoring failed for influencer ${influencer.id}: ${error.message}`);
    return {
      matchScore: 0,
      reason: 'Unable to score this influencer right now.',
    };
  }
};

module.exports = {
  extractCampaignKeywords,
  scoreInfluencerMatch,
};
