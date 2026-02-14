# Database

This folder contains the SQLite schema and a small initializer.

## Create the database

```bash
python backend/db/init_db.py
```

This creates `backend/data/rice_yield.db`.

## Tables
- `simulations`: one saved simulation plus aggregated stats
- `simulation_runs`: one row per replication or scenario run
- `season_results`: one row per season within a run

Notes:
- `run_mode` distinguishes a single-scenario run from an all-scenarios run.
- Probabilities are stored per run to keep `runAllScenarios` accurate.
