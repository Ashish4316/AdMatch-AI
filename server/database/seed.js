/**
 * AdMatch AI — Seed File
 * Inserts 50 realistic mock influencers across 6 niches.
 * Run: node database/seed.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { pool } = require('../config/db');

const influencers = [
    // ── Tech (9) ──────────────────────────────────────────────────
    { youtube_channel_id: 'UCtech001', name: 'Linus Tech Tips', niche: 'Tech', subscribers: 15800000, avg_views: 1200000, engagement_rate: 4.20, keywords: ['hardware', 'reviews', 'pc builds'] },
    { youtube_channel_id: 'UCtech002', name: 'Mrwhosetheboss', niche: 'Tech', subscribers: 12300000, avg_views: 900000, engagement_rate: 5.10, keywords: ['smartphones', 'apple', 'samsung'] },
    { youtube_channel_id: 'UCtech003', name: 'MKBHD', niche: 'Tech', subscribers: 18500000, avg_views: 2100000, engagement_rate: 3.80, keywords: ['phones', 'gadgets', 'reviews'] },
    { youtube_channel_id: 'UCtech004', name: 'Dave2D', niche: 'Tech', subscribers: 4200000, avg_views: 320000, engagement_rate: 4.50, keywords: ['laptops', 'productivity', 'design'] },
    { youtube_channel_id: 'UCtech005', name: 'Unbox Therapy', niche: 'Tech', subscribers: 21000000, avg_views: 2800000, engagement_rate: 3.20, keywords: ['unboxing', 'gadgets', 'accessories'] },
    { youtube_channel_id: 'UCtech006', name: 'JerryRigEverything', niche: 'Tech', subscribers: 8900000, avg_views: 710000, engagement_rate: 5.60, keywords: ['durability', 'teardown', 'phones'] },
    { youtube_channel_id: 'UCtech007', name: 'Arun Maini', niche: 'Tech', subscribers: 9700000, avg_views: 870000, engagement_rate: 4.90, keywords: ['tech news', 'smartphones', 'reviews'] },
    { youtube_channel_id: 'UCtech008', name: 'TechLinked', niche: 'Tech', subscribers: 1400000, avg_views: 250000, engagement_rate: 6.10, keywords: ['tech news', 'weekly', 'updates'] },
    { youtube_channel_id: 'UCtech009', name: 'Hardware Unboxed', niche: 'Tech', subscribers: 1200000, avg_views: 190000, engagement_rate: 5.80, keywords: ['gpu', 'benchmarks', 'pc parts'] },

    // ── Gaming (9) ────────────────────────────────────────────────
    { youtube_channel_id: 'UCgame001', name: 'PewDiePie', niche: 'Gaming', subscribers: 111000000, avg_views: 4500000, engagement_rate: 2.10, keywords: ['gameplay', 'memes', 'commentary'] },
    { youtube_channel_id: 'UCgame002', name: 'Jacksepticeye', niche: 'Gaming', subscribers: 32000000, avg_views: 1600000, engagement_rate: 3.40, keywords: ['indie', 'horror', 'lets play'] },
    { youtube_channel_id: 'UCgame003', name: 'Markiplier', niche: 'Gaming', subscribers: 35000000, avg_views: 1900000, engagement_rate: 3.60, keywords: ['horror', 'story games', 'reaction'] },
    { youtube_channel_id: 'UCgame004', name: 'Valkyrae', niche: 'Gaming', subscribers: 4000000, avg_views: 390000, engagement_rate: 5.80, keywords: ['valorant', 'streaming', 'warzone'] },
    { youtube_channel_id: 'UCgame005', name: 'Sykkuno', niche: 'Gaming', subscribers: 3100000, avg_views: 320000, engagement_rate: 5.20, keywords: ['among us', 'casual', 'variety'] },
    { youtube_channel_id: 'UCgame006', name: 'Dream', niche: 'Gaming', subscribers: 34000000, avg_views: 2200000, engagement_rate: 4.10, keywords: ['minecraft', 'speedrun', 'manhunt'] },
    { youtube_channel_id: 'UCgame007', name: 'Ninja', niche: 'Gaming', subscribers: 24000000, avg_views: 800000, engagement_rate: 2.90, keywords: ['fortnite', 'fps', 'streaming'] },
    { youtube_channel_id: 'UCgame008', name: 'Shroud', niche: 'Gaming', subscribers: 7200000, avg_views: 450000, engagement_rate: 4.40, keywords: ['fps', 'tactical', 'esports'] },
    { youtube_channel_id: 'UCgame009', name: 'TheRadBrad', niche: 'Gaming', subscribers: 13000000, avg_views: 980000, engagement_rate: 3.70, keywords: ['walkthroughs', 'story games', 'rpg'] },

    // ── Food (8) ──────────────────────────────────────────────────
    { youtube_channel_id: 'UCfood001', name: 'Binging with Babish', niche: 'Food', subscribers: 10500000, avg_views: 2100000, engagement_rate: 5.20, keywords: ['recipes', 'pop culture', 'cooking'] },
    { youtube_channel_id: 'UCfood002', name: 'Joshua Weissman', niche: 'Food', subscribers: 9800000, avg_views: 1800000, engagement_rate: 6.10, keywords: ['fast food', 'diy', 'budget meals'] },
    { youtube_channel_id: 'UCfood003', name: 'Ethan Chlebowski', niche: 'Food', subscribers: 2100000, avg_views: 650000, engagement_rate: 7.20, keywords: ['science', 'health', 'recipes'] },
    { youtube_channel_id: 'UCfood004', name: 'Internet Shaquille', niche: 'Food', subscribers: 850000, avg_views: 300000, engagement_rate: 8.50, keywords: ['beginner', 'simple recipes', 'tips'] },
    { youtube_channel_id: 'UCfood005', name: 'Tasty', niche: 'Food', subscribers: 21000000, avg_views: 3200000, engagement_rate: 3.80, keywords: ['quick meals', 'viral', 'comfort food'] },
    { youtube_channel_id: 'UCfood006', name: 'Mark Wiens', niche: 'Food', subscribers: 9400000, avg_views: 1600000, engagement_rate: 4.90, keywords: ['street food', 'travel', 'spicy'] },
    { youtube_channel_id: 'UCfood007', name: 'Chef John', niche: 'Food', subscribers: 4500000, avg_views: 520000, engagement_rate: 5.60, keywords: ['classic', 'techniques', 'gourmet'] },
    { youtube_channel_id: 'UCfood008', name: 'Bon Appétit', niche: 'Food', subscribers: 5900000, avg_views: 1100000, engagement_rate: 4.30, keywords: ['magazine', 'pro kitchen', 'testing'] },

    // ── Fashion (8) ───────────────────────────────────────────────
    { youtube_channel_id: 'UCfash001', name: 'Alexandra Anele', niche: 'Fashion', subscribers: 1200000, avg_views: 280000, engagement_rate: 7.10, keywords: ['outfits', 'ootd', 'hauls'] },
    { youtube_channel_id: 'UCfash002', name: 'Cole Habersham', niche: 'Fashion', subscribers: 890000, avg_views: 190000, engagement_rate: 6.80, keywords: ['mens fashion', 'streetwear', 'styling'] },
    { youtube_channel_id: 'UCfash003', name: 'Wisdom Kaye', niche: 'Fashion', subscribers: 2600000, avg_views: 480000, engagement_rate: 8.10, keywords: ['luxury', 'avant garde', 'editorial'] },
    { youtube_channel_id: 'UCfash004', name: 'Manny MUA', niche: 'Fashion', subscribers: 5100000, avg_views: 620000, engagement_rate: 5.60, keywords: ['makeup', 'beauty', 'tutorial'] },
    { youtube_channel_id: 'UCfash005', name: 'Safiya Nygaard', niche: 'Fashion', subscribers: 9800000, avg_views: 3100000, engagement_rate: 4.20, keywords: ['experiments', 'bold styles', 'reviews'] },
    { youtube_channel_id: 'UCfash006', name: 'Picked Last', niche: 'Fashion', subscribers: 540000, avg_views: 130000, engagement_rate: 7.90, keywords: ['thrift', 'upcycling', 'sustainable'] },
    { youtube_channel_id: 'UCfash007', name: 'Bestdressed', niche: 'Fashion', subscribers: 4200000, avg_views: 870000, engagement_rate: 6.30, keywords: ['vintage', 'thrift', 'ootd'] },
    { youtube_channel_id: 'UCfash008', name: 'Sharmeleon', niche: 'Fashion', subscribers: 1900000, avg_views: 340000, engagement_rate: 5.90, keywords: ['plus size', 'body positive', 'hauls'] },

    // ── Education (8) ─────────────────────────────────────────────
    { youtube_channel_id: 'UCedu001', name: 'Kurzgesagt', niche: 'Education', subscribers: 22000000, avg_views: 8900000, engagement_rate: 4.10, keywords: ['science', 'animated', 'explainer'] },
    { youtube_channel_id: 'UCedu002', name: '3Blue1Brown', niche: 'Education', subscribers: 6100000, avg_views: 1200000, engagement_rate: 5.80, keywords: ['math', 'visual', 'deep learning'] },
    { youtube_channel_id: 'UCedu003', name: 'Veritasium', niche: 'Education', subscribers: 14000000, avg_views: 4200000, engagement_rate: 4.70, keywords: ['physics', 'curiosity', 'experiments'] },
    { youtube_channel_id: 'UCedu004', name: 'CrashCourse', niche: 'Education', subscribers: 15000000, avg_views: 1800000, engagement_rate: 3.50, keywords: ['history', 'biology', 'literature'] },
    { youtube_channel_id: 'UCedu005', name: 'Ted-Ed', niche: 'Education', subscribers: 18000000, avg_views: 3700000, engagement_rate: 3.90, keywords: ['riddles', 'animated', 'ted talks'] },
    { youtube_channel_id: 'UCedu006', name: 'Mark Rober', niche: 'Education', subscribers: 28000000, avg_views: 12000000, engagement_rate: 5.20, keywords: ['engineering', 'nasa', 'fun science'] },
    { youtube_channel_id: 'UCedu007', name: 'SmarterEveryDay', niche: 'Education', subscribers: 11000000, avg_views: 2600000, engagement_rate: 4.60, keywords: ['physics', 'slow motion', 'military'] },
    { youtube_channel_id: 'UCedu008', name: 'CGP Grey', niche: 'Education', subscribers: 5800000, avg_views: 1400000, engagement_rate: 5.10, keywords: ['politics', 'geography', 'rules'] },

    // ── Fitness (8) ───────────────────────────────────────────────
    { youtube_channel_id: 'UCfit001', name: 'Jeff Nippard', niche: 'Fitness', subscribers: 5100000, avg_views: 920000, engagement_rate: 6.80, keywords: ['bodybuilding', 'science', 'nutrition'] },
    { youtube_channel_id: 'UCfit002', name: 'Athlean-X', niche: 'Fitness', subscribers: 14000000, avg_views: 2100000, engagement_rate: 4.50, keywords: ['injury', 'athletic', 'workout'] },
    { youtube_channel_id: 'UCfit003', name: 'Chloe Ting', niche: 'Fitness', subscribers: 25000000, avg_views: 6800000, engagement_rate: 5.30, keywords: ['home workout', 'abs', 'challenge'] },
    { youtube_channel_id: 'UCfit004', name: 'Chris Heria', niche: 'Fitness', subscribers: 5900000, avg_views: 820000, engagement_rate: 5.70, keywords: ['calisthenics', 'street workout', 'skills'] },
    { youtube_channel_id: 'UCfit005', name: 'Jeremy Ethier', niche: 'Fitness', subscribers: 5400000, avg_views: 990000, engagement_rate: 6.20, keywords: ['evidence-based', 'hypertrophy', 'diet'] },
    { youtube_channel_id: 'UCfit006', name: 'MindPumpMedia', niche: 'Fitness', subscribers: 800000, avg_views: 140000, engagement_rate: 7.50, keywords: ['podcast', 'hormones', 'wellness'] },
    { youtube_channel_id: 'UCfit007', name: 'FitnessBlender', niche: 'Fitness', subscribers: 7000000, avg_views: 540000, engagement_rate: 4.10, keywords: ['home', 'beginner', 'low impact'] },
    { youtube_channel_id: 'UCfit008', name: 'Yoga with Adriene', niche: 'Fitness', subscribers: 12000000, avg_views: 1700000, engagement_rate: 5.90, keywords: ['yoga', 'mental health', 'flexibility'] },
];

async function seed() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        let inserted = 0;
        for (const inf of influencers) {
            await client.query(
                `INSERT INTO influencers
          (youtube_channel_id, name, niche, subscribers, avg_views, engagement_rate, keywords, last_synced)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         ON CONFLICT (youtube_channel_id) DO UPDATE SET
           name             = EXCLUDED.name,
           niche            = EXCLUDED.niche,
           subscribers      = EXCLUDED.subscribers,
           avg_views        = EXCLUDED.avg_views,
           engagement_rate  = EXCLUDED.engagement_rate,
           keywords         = EXCLUDED.keywords,
           last_synced      = NOW()`,
                [
                    inf.youtube_channel_id,
                    inf.name,
                    inf.niche,
                    inf.subscribers,
                    inf.avg_views,
                    inf.engagement_rate,
                    JSON.stringify(inf.keywords),
                ]
            );
            inserted++;
        }

        await client.query('COMMIT');
        console.log(`✅ Seeded ${inserted} influencers successfully.`);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Seed failed:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

seed();
