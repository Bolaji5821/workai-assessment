-- Create briefings table
CREATE TABLE IF NOT EXISTS briefings (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(200) NOT NULL,
    ticker VARCHAR(10) NOT NULL,
    sector VARCHAR(100) NOT NULL,
    analyst_name VARCHAR(100) NOT NULL,
    summary TEXT NOT NULL,
    recommendation TEXT NOT NULL,
    is_generated BOOLEAN DEFAULT FALSE NOT NULL,
    generated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create briefing_key_points table
CREATE TABLE IF NOT EXISTS briefing_key_points (
    id SERIAL PRIMARY KEY,
    briefing_id INTEGER NOT NULL REFERENCES briefings(id) ON DELETE CASCADE,
    point_text TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create briefing_risks table
CREATE TABLE IF NOT EXISTS briefing_risks (
    id SERIAL PRIMARY KEY,
    briefing_id INTEGER NOT NULL REFERENCES briefings(id) ON DELETE CASCADE,
    risk_text TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create briefing_metrics table
CREATE TABLE IF NOT EXISTS briefing_metrics (
    id SERIAL PRIMARY KEY,
    briefing_id INTEGER NOT NULL REFERENCES briefings(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    metric_value VARCHAR(50) NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_briefings_ticker ON briefings(ticker);
CREATE INDEX idx_briefings_sector ON briefings(sector);
CREATE INDEX idx_briefings_created_at ON briefings(created_at DESC);
CREATE INDEX idx_briefings_is_generated ON briefings(is_generated);

CREATE INDEX idx_briefing_key_points_briefing_id ON briefing_key_points(briefing_id);
CREATE INDEX idx_briefing_risks_briefing_id ON briefing_risks(briefing_id);
CREATE INDEX idx_briefing_metrics_briefing_id ON briefing_metrics(briefing_id);