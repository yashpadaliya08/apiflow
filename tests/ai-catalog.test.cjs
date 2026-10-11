const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Compatibility with the strict ai-catalog v1 schema used by the reported
// Lighthouse audit (not a complete ARD conformance validator):
// https://github.com/ards-project/ard-spec/blob/main/spec/schemas/ai-catalog.schema.json
// An unsupported root member such as $schema makes that audit reject the catalog.
for (const directory of ['public', 'dist']) {
  test(`${directory} AI catalog has no unsupported root properties`, () => {
    const catalog = JSON.parse(fs.readFileSync(
      path.join(__dirname, '../frontend', directory, 'ai-catalog.json'), 'utf8'));
    const allowed = new Set(['specVersion', 'host', 'entries']);
    assert.deepEqual(Object.keys(catalog).filter(key => !allowed.has(key)), [],
      'Strict catalog consumers reject additional root properties');
    assert.equal(catalog.specVersion, '1.0');
    assert.ok(Array.isArray(catalog.entries) && catalog.entries.length > 0);
  });
}
