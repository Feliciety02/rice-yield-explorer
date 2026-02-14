PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS simulations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  run_mode TEXT NOT NULL DEFAULT 'single' CHECK (run_mode IN ('single','all_scenarios')),
  num_seasons INTEGER NOT NULL CHECK (num_seasons > 0),
  num_replications INTEGER NOT NULL CHECK (num_replications > 0),
  seed INTEGER,
  average_yield REAL NOT NULL CHECK (average_yield >= 0),
  min_yield REAL NOT NULL CHECK (min_yield >= 0),
  max_yield REAL NOT NULL CHECK (max_yield >= 0),
  yield_variability TEXT NOT NULL CHECK (yield_variability IN ('low','medium','high')),
  low_yield_percent REAL NOT NULL CHECK (low_yield_percent >= 0 AND low_yield_percent <= 100)
);

CREATE TABLE IF NOT EXISTS simulation_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  simulation_id TEXT NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
  run_index INTEGER NOT NULL,
  scenario_id INTEGER NOT NULL CHECK (scenario_id BETWEEN 1 AND 5),
  prob_low INTEGER NOT NULL CHECK (prob_low >= 0 AND prob_low <= 100),
  prob_normal INTEGER NOT NULL CHECK (prob_normal >= 0 AND prob_normal <= 100),
  prob_high INTEGER NOT NULL CHECK (prob_high >= 0 AND prob_high <= 100),
  average_yield REAL NOT NULL CHECK (average_yield >= 0),
  min_yield REAL NOT NULL CHECK (min_yield >= 0),
  max_yield REAL NOT NULL CHECK (max_yield >= 0),
  yield_variability TEXT NOT NULL CHECK (yield_variability IN ('low','medium','high')),
  low_yield_percent REAL NOT NULL CHECK (low_yield_percent >= 0 AND low_yield_percent <= 100),
  CHECK (prob_low + prob_normal + prob_high = 100),
  UNIQUE (simulation_id, run_index)
);

CREATE TABLE IF NOT EXISTS season_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  simulation_run_id INTEGER NOT NULL REFERENCES simulation_runs(id) ON DELETE CASCADE,
  season_index INTEGER NOT NULL,
  rainfall TEXT NOT NULL CHECK (rainfall IN ('low','normal','high')),
  yield REAL NOT NULL CHECK (yield >= 0),
  UNIQUE (simulation_run_id, season_index)
);

CREATE INDEX IF NOT EXISTS idx_simulation_runs_simulation_id
  ON simulation_runs(simulation_id);

CREATE INDEX IF NOT EXISTS idx_season_results_run_id
  ON season_results(simulation_run_id);
