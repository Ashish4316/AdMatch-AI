const axios = require('axios');
const { query } = require('../config/db');
const logger = require('../utils/logger');

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_BASE_URL = process.env.YOUTUBE_API_BASE_URL || 'https://www.googleapis.com/youtube/v3';
const CACHE_TTL_HOURS = Number(process.env.YOUTUBE_CACHE_TTL_HOURS) || 24;
const CACHE_TTL_MS = CACHE_TTL_HOURS * 60 * 60 * 1000;

const channelCache = new Map();

const VIDEO_CATEGORY_MAP = {
  '1': 'Film & Animation',
  '2': 'Autos & Vehicles',
  '10': 'Music',
  '15': 'Pets & Animals',
  '17': 'Sports',
  '19': 'Travel & Events',
  '20': 'Gaming',
  '22': 'People & Blogs',
  '23': 'Comedy',
  '24': 'Entertainment',
  '25': 'News & Politics',
  '26': 'Howto & Style',
  '27': 'Education',
  '28': 'Science & Technology',
};

const NICHE_KEYWORDS = {
  Tech: ['tech', 'software', 'ai', 'gadget', 'coding', 'programming', 'review'],
  Gaming: ['gaming', 'gameplay', 'esports', 'stream', 'minecraft', 'fps'],
  Fashion: ['fashion', 'style', 'outfit', 'lookbook', 'beauty', 'makeup'],
  Food: ['food', 'recipe', 'cooking', 'kitchen', 'chef', 'meal'],
  Fitness: ['fitness', 'workout', 'gym', 'training', 'yoga', 'health'],
  Education: ['education', 'tutorial', 'learn', 'science', 'math', 'history'],
  Travel: ['travel', 'trip', 'adventure', 'destination', 'vlog'],
};

const ensureApiKey = () => {
  if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'your_youtube_data_api_v3_key_here') {
    throw new Error('YOUTUBE_API_KEY is not configured.');
  }
};

const normalizeCount = (value) => Number.parseInt(value || '0', 10) || 0;

const toTitleCase = (text) =>
  text
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const extractKeywords = (description, videos) => {
  const fromDescription = (description || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 3);

  const fromTags = videos.flatMap((video) => video.tags || []).map((tag) => tag.toLowerCase().trim());
  const merged = [...fromDescription, ...fromTags];

  const freq = new Map();
  merged.forEach((word) => {
    if (!word) {
      return;
    }
    freq.set(word, (freq.get(word) || 0) + 1);
  });

  return [...freq.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 12)
    .map(([word]) => word);
};

const extractNiche = (description, videos) => {
  const searchable = [
    (description || '').toLowerCase(),
    ...videos.flatMap((video) => (video.tags || []).map((tag) => String(tag).toLowerCase())),
  ].join(' ');

  let winner = 'General';
  let maxScore = 0;

  Object.entries(NICHE_KEYWORDS).forEach(([niche, words]) => {
    const score = words.reduce((sum, word) => (searchable.includes(word) ? sum + 1 : sum), 0);
    if (score > maxScore) {
      maxScore = score;
      winner = niche;
    }
  });

  return winner;
};

const getCachedChannelData = (channelId) => {
  const cached = channelCache.get(channelId);
  if (!cached) {
    return null;
  }

  if (cached.expiresAt < Date.now()) {
    channelCache.delete(channelId);
    return null;
  }

  return cached.value;
};

const setCachedChannelData = (channelId, value) => {
  channelCache.set(channelId, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
};

const fetchChannelCore = async (channelId) => {
  const response = await axios.get(`${YOUTUBE_API_BASE_URL}/channels`, {
    params: {
      part: 'snippet,statistics,contentDetails,topicDetails',
      id: channelId,
      key: YOUTUBE_API_KEY,
    },
  });

  const channel = response.data?.items?.[0];
  if (!channel) {
    throw new Error('YouTube channel not found for provided channel ID.');
  }

  return channel;
};

const fetchLatestVideos = async (uploadsPlaylistId) => {
  const playlistResponse = await axios.get(`${YOUTUBE_API_BASE_URL}/playlistItems`, {
    params: {
      part: 'contentDetails',
      playlistId: uploadsPlaylistId,
      maxResults: 10,
      key: YOUTUBE_API_KEY,
    },
  });

  const videoIds = (playlistResponse.data?.items || [])
    .map((item) => item.contentDetails?.videoId)
    .filter(Boolean);

  if (videoIds.length === 0) {
    return [];
  }

  const videosResponse = await axios.get(`${YOUTUBE_API_BASE_URL}/videos`, {
    params: {
      part: 'snippet,statistics',
      id: videoIds.join(','),
      key: YOUTUBE_API_KEY,
      maxResults: 10,
    },
  });

  const byId = new Map((videosResponse.data?.items || []).map((video) => [video.id, video]));
  return videoIds
    .map((videoId) => byId.get(videoId))
    .filter(Boolean)
    .map((video) => ({
      id: video.id,
      title: video.snippet?.title || '',
      views: normalizeCount(video.statistics?.viewCount),
      likes: normalizeCount(video.statistics?.likeCount),
      comments: normalizeCount(video.statistics?.commentCount),
      tags: video.snippet?.tags || [],
      categoryId: video.snippet?.categoryId || null,
    }));
};

const buildChannelData = (channel, videos) => {
  const subscribers = normalizeCount(channel.statistics?.subscriberCount);
  const totalViews = normalizeCount(channel.statistics?.viewCount);
  const avgViews = videos.length
    ? Math.round(videos.reduce((sum, video) => sum + video.views, 0) / videos.length)
    : 0;

  const engagementRate = subscribers > 0 ? Number(((avgViews / subscribers) * 100).toFixed(2)) : 0;
  const niche = extractNiche(channel.snippet?.description || '', videos);
  const keywords = extractKeywords(channel.snippet?.description || '', videos);

  const topicCategory = channel.topicDetails?.topicCategories?.[0]
    ? toTitleCase(channel.topicDetails.topicCategories[0].split('/').pop())
    : null;
  const firstVideoCategory = videos[0]?.categoryId ? VIDEO_CATEGORY_MAP[videos[0].categoryId] : null;

  return {
    channelId: channel.id,
    name: channel.snippet?.title || '',
    subscribers,
    totalViews,
    category: topicCategory || firstVideoCategory || niche,
    avgViews,
    engagementRate,
    niche,
    keywords,
    videos: videos.map(({ categoryId, ...video }) => video),
    lastSynced: new Date().toISOString(),
  };
};

const fetchInfluencerChannelData = async (channelId, { forceRefresh = false } = {}) => {
  ensureApiKey();

  if (!forceRefresh) {
    const cached = getCachedChannelData(channelId);
    if (cached) {
      return { ...cached, cacheHit: true };
    }
  }

  const channel = await fetchChannelCore(channelId);
  const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;
  const videos = uploadsPlaylistId ? await fetchLatestVideos(uploadsPlaylistId) : [];
  const data = buildChannelData(channel, videos);

  setCachedChannelData(channelId, data);
  return { ...data, cacheHit: false };
};

const saveInfluencerData = async (influencerData) => {
  const { rows } = await query(
    `INSERT INTO influencers
      (youtube_channel_id, name, niche, subscribers, avg_views, engagement_rate, keywords, last_synced)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, NOW())
     ON CONFLICT (youtube_channel_id)
     DO UPDATE SET
       name = EXCLUDED.name,
       niche = EXCLUDED.niche,
       subscribers = EXCLUDED.subscribers,
       avg_views = EXCLUDED.avg_views,
       engagement_rate = EXCLUDED.engagement_rate,
       keywords = EXCLUDED.keywords,
       last_synced = NOW()
     RETURNING id, youtube_channel_id, name, niche, subscribers, avg_views, engagement_rate, keywords, last_synced`,
    [
      influencerData.channelId,
      influencerData.name,
      influencerData.niche,
      influencerData.subscribers,
      influencerData.avgViews,
      influencerData.engagementRate,
      JSON.stringify(influencerData.keywords || []),
    ]
  );

  return rows[0] || null;
};

const fetchAndStoreInfluencerData = async (channelId, { forceRefresh = false } = {}) => {
  const data = await fetchInfluencerChannelData(channelId, { forceRefresh });
  const savedInfluencer = await saveInfluencerData(data);
  return { ...data, savedInfluencer };
};

const refreshAllInfluencerData = async () => {
  const { rows } = await query(
    `SELECT youtube_channel_id
     FROM influencers
     WHERE youtube_channel_id IS NOT NULL
     ORDER BY id ASC`
  );

  let refreshed = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      await fetchAndStoreInfluencerData(row.youtube_channel_id, { forceRefresh: true });
      refreshed += 1;
    } catch (error) {
      failed += 1;
      logger.error(`Failed to refresh channel ${row.youtube_channel_id}: ${error.message}`);
    }
  }

  return {
    total: rows.length,
    refreshed,
    failed,
  };
};

module.exports = {
  fetchInfluencerChannelData,
  fetchAndStoreInfluencerData,
  saveInfluencerData,
  refreshAllInfluencerData,
};
