const test = require('node:test');
const assert = require('node:assert/strict');
const { PGlite } = require('@electric-sql/pglite');
const { createAnalyticsStore } = require('../backend/analytics-store');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

test('committed counters survive database shutdown and reopening from disk', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'apiflow-analytics-test-'));
  let db;
  try {
    db = new PGlite(directory);
    await createAnalyticsStore(db).record({ totalLiveProxy: 3 });
    await db.close();
    db = new PGlite(directory);
    assert.equal((await createAnalyticsStore(db).summary()).totalLiveProxy, 3);
  } finally {
    if (db && !db.closed) await db.close();
    // Only remove the disposable directory allocated by this test.
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test('analytics survive store recreation and aggregate atomic increments into UTC periods', async t => {
  const db = new PGlite();
  t.after(() => db.close());
  const store = createAnalyticsStore(db);
  await store.record({ totalPageviews: 2, sourceCounts: { 'Hacker News': 2 } }, new Date('2026-10-01T12:00:00Z'));
  await Promise.all(Array.from({ length: 8 }, () => store.record({ totalPageviews: 1, totalSimulations: 1 }, new Date('2026-10-26T12:00:00Z'))));
  const recreated = createAnalyticsStore(db);
  const all = await recreated.summary('lifetime', new Date('2026-10-26T23:00:00Z'));
  assert.equal(all.totalPageviews, 10);
  assert.equal(all.totalSimulations, 8);
  assert.equal(all.sourceCounts['Hacker News'], 2);
  for (const period of ['today', '7d']) assert.equal((await recreated.summary(period, new Date('2026-10-26T23:00:00Z'))).totalPageviews, 8);
  assert.equal((await recreated.summary('30d', new Date('2026-10-26T23:00:00Z'))).totalPageviews, 10);
  const { rows } = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name='apiflow_analytics_daily'");
  assert.deepEqual(rows.map(row => row.column_name).sort(), ['count', 'day', 'dimension', 'metric']);
});

test('failed writes propagate instead of reporting persistence success; initialization can retry', async t => {
  const db = new PGlite();
  t.after(() => db.close());
  const store = createAnalyticsStore(db);
  await store.record({ totalExports: 1 });
  await db.exec('DROP TABLE apiflow_analytics_daily');
  await assert.rejects(store.record({ totalExports: 1 }));
  const restored = createAnalyticsStore(db);
  await restored.record({ totalExports: 1 });
  assert.equal((await restored.summary()).totalExports, 1);
});
