-- ================================================================
-- AdMatch AI — PostgreSQL Migration
-- Run this file in Supabase SQL Editor or via psql
-- ================================================================

-- ── 1. companies ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255)        NOT NULL,
  email       VARCHAR(255)        NOT NULL UNIQUE,
  password    VARCHAR(255)        NOT NULL,
  industry    VARCHAR(100),
  created_at  TIMESTAMP           DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companies_email ON companies(email);

-- ── 2. influencers ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS influencers (
  id                  SERIAL PRIMARY KEY,
  youtube_channel_id  VARCHAR(255)    UNIQUE,
  name                VARCHAR(255)    NOT NULL,
  niche               VARCHAR(100),
  subscribers         INT,
  avg_views           INT,
  engagement_rate     DECIMAL(5,2),
  keywords            JSONB,
  last_synced         TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_influencers_niche ON influencers(niche);

-- ── 3. campaigns ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campaigns (
  id                  SERIAL PRIMARY KEY,
  company_id          INT             NOT NULL,
  title               VARCHAR(255)    NOT NULL,
  description         TEXT,
  target_audience     TEXT,
  budget              INT,
  extracted_keywords  JSONB,
  status              VARCHAR(20)     DEFAULT 'pending',
  created_at          TIMESTAMP       DEFAULT NOW(),

  CONSTRAINT fk_campaigns_company
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_campaigns_company_id ON campaigns(company_id);

-- ── 4. matches ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS matches (
  id              SERIAL PRIMARY KEY,
  campaign_id     INT             NOT NULL,
  influencer_id   INT             NOT NULL,
  match_score     DECIMAL(5,2),
  ai_reason       TEXT,
  created_at      TIMESTAMP       DEFAULT NOW(),

  CONSTRAINT fk_matches_campaign
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  CONSTRAINT fk_matches_influencer
    FOREIGN KEY (influencer_id) REFERENCES influencers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_matches_campaign_id ON matches(campaign_id);

-- ── 5. shortlists ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shortlists (
  id              SERIAL PRIMARY KEY,
  company_id      INT             NOT NULL,
  influencer_id   INT             NOT NULL,
  campaign_id     INT,
  created_at      TIMESTAMP       DEFAULT NOW(),

  CONSTRAINT fk_shortlists_company
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_shortlists_influencer
    FOREIGN KEY (influencer_id) REFERENCES influencers(id) ON DELETE CASCADE,
  CONSTRAINT fk_shortlists_campaign
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL
);

-- ================================================================
-- Done! All tables and indexes created.
-- ================================================================
