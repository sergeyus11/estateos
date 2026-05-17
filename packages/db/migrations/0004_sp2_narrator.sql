CREATE TYPE narrative_status AS ENUM ('pending', 'generating', 'ready', 'error');

CREATE TABLE morning_narratives (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  admin_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_date text NOT NULL,
  narrative_text text,
  audio_path text,
  audio_duration_sec integer,
  stats jsonb NOT NULL DEFAULT '{}'::jsonb,
  status narrative_status NOT NULL DEFAULT 'pending',
  error_message text,
  cost_usd numeric(10, 5),
  generated_at timestamptz,
  listened_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT morning_narratives_admin_period_unique UNIQUE (admin_id, period_date)
);

CREATE INDEX idx_morning_narratives_admin_created
  ON morning_narratives (admin_id, created_at DESC);
