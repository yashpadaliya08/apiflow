const fs = require('node:fs');
const path = require('node:path');
const COUNTERS = ['totalPageviews', 'totalEvents', 'totalSimulations', 'totalLiveProxy', 'totalCodeCopies', 'totalExports'];
const GROUPS = ['sourceCounts', 'deviceCounts', 'campaignCounts', 'countryCounts'];

function createAnalyticsStore(db) {
  let ready;
  function initialize() {
    if (!ready) ready = (async () => {
      const sql = fs.readFileSync(path.join(__dirname, 'migrations/001-analytics.sql'), 'utf8').replace(/^--.*$/gm, '');
      for (const statement of sql.split(';').map(s => s.trim()).filter(Boolean)) await db.query(statement);
    })().catch(error => { ready = null; throw error; });
    return ready;
  }
  async function record(increments, now = new Date()) {
    await initialize();
    const rows = [];
    for (const name of COUNTERS) if (increments[name]) rows.push([name, '', increments[name]]);
    for (const name of GROUPS) for (const [key, count] of Object.entries(increments[name] || {})) {
      if (key.length <= 64 && count > 0) rows.push([name, key, count]);
    }
    if (!rows.length) return;
    // One statement commits all dimensions together; concurrent instances add, never overwrite.
    await db.query(`INSERT INTO apiflow_analytics_daily (day, metric, dimension, count)
      SELECT $1::date, x.metric, x.dimension, x.count FROM jsonb_to_recordset($2::jsonb)
      AS x(metric text, dimension text, count bigint)
      ON CONFLICT (day, metric, dimension) DO UPDATE
      SET count = apiflow_analytics_daily.count + EXCLUDED.count`,
    [now.toISOString().slice(0, 10), JSON.stringify(rows.map(([metric, dimension, count]) => ({ metric, dimension, count })))]);
  }
  async function summary(period = 'lifetime', now = new Date()) {
    await initialize();
    const days = { today: 1, '7d': 7, '30d': 30 }[period];
    const start = days ? new Date(now.getTime() - (days - 1) * 86400000).toISOString().slice(0, 10) : null;
    const { rows } = await db.query(`SELECT metric, dimension, SUM(count)::text AS count
      FROM apiflow_analytics_daily WHERE ($1::date IS NULL OR day >= $1::date)
      AND day <= $2::date GROUP BY metric, dimension`, [start, now.toISOString().slice(0, 10)]);
    const result = Object.fromEntries(COUNTERS.map(name => [name, 0]));
    for (const group of GROUPS) result[group] = Object.create(null);
    for (const row of rows) {
      if (COUNTERS.includes(row.metric)) result[row.metric] = Number(row.count);
      else if (GROUPS.includes(row.metric)) result[row.metric][row.dimension] = Number(row.count);
    }
    return result;
  }
  return { record, summary };
}

function configuredStore() {
  const connectionString = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL;
  if (!connectionString) return null;
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString, max: 3, connectionTimeoutMillis: 10000, idleTimeoutMillis: 10000, statement_timeout: 5000, allowExitOnIdle: true });
  // Do not log connection details, which can contain database credentials.
  pool.on('error', () => console.error('[Analytics] Database connection unavailable'));
  return createAnalyticsStore(pool);
}
module.exports = { createAnalyticsStore, configuredStore };
