-- Drop indexes
DROP INDEX IF EXISTS idx_briefing_metrics_briefing_id;
DROP INDEX IF EXISTS idx_briefing_risks_briefing_id;
DROP INDEX IF EXISTS idx_briefing_key_points_briefing_id;
DROP INDEX IF EXISTS idx_briefings_is_generated;
DROP INDEX IF EXISTS idx_briefings_created_at;
DROP INDEX IF EXISTS idx_briefings_sector;
DROP INDEX IF EXISTS idx_briefings_ticker;

-- Drop tables in reverse order (children first)
DROP TABLE IF EXISTS briefing_metrics;
DROP TABLE IF EXISTS briefing_risks;
DROP TABLE IF EXISTS briefing_key_points;
DROP TABLE IF EXISTS briefings;