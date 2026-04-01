const logger = require('../utils/logger');
const { refreshAllInfluencerData } = require('../services/youtube.service');

let timer = null;
let running = false;

const msUntilNext2AM = () => {
  const now = new Date();
  const nextRun = new Date(now);
  nextRun.setHours(2, 0, 0, 0);

  if (nextRun <= now) {
    nextRun.setDate(nextRun.getDate() + 1);
  }

  return nextRun.getTime() - now.getTime();
};

const runYoutubeSyncNow = async () => {
  if (running) {
    logger.warn('YouTube sync skipped: previous sync is still running.');
    return;
  }

  running = true;
  try {
    logger.info('YouTube influencer sync started.');
    const result = await refreshAllInfluencerData();
    logger.info(
      `YouTube influencer sync completed. Total: ${result.total}, Refreshed: ${result.refreshed}, Failed: ${result.failed}`
    );
  } catch (error) {
    logger.error(`YouTube influencer sync failed: ${error.message}`);
  } finally {
    running = false;
  }
};

const scheduleNextRun = () => {
  const delay = msUntilNext2AM();
  logger.info(`YouTube sync scheduled in ${Math.ceil(delay / 60000)} minutes (next run at 2:00 AM).`);

  timer = setTimeout(async () => {
    await runYoutubeSyncNow();
    scheduleNextRun();
  }, delay);
};

const startYoutubeSyncJob = () => {
  if (timer) {
    return;
  }

  scheduleNextRun();

  if (process.env.YOUTUBE_SYNC_RUN_ON_STARTUP === 'true') {
    runYoutubeSyncNow();
  }
};

module.exports = {
  startYoutubeSyncJob,
  runYoutubeSyncNow,
};
