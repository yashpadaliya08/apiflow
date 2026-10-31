-- Additive migration; rerunnable. Deliberately irreversible: rollback the app, retain history.
CREATE TABLE IF NOT EXISTS apiflow_analytics_daily (
  day date NOT NULL,
  metric text NOT NULL,
  dimension text NOT NULL DEFAULT '',
  count bigint NOT NULL CHECK (count >= 0),
  PRIMARY KEY (day, metric, dimension)
);
-- Supabase API clients must not access admin analytics through the public REST API.
ALTER TABLE apiflow_analytics_daily ENABLE ROW LEVEL SECURITY;
