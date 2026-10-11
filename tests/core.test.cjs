require('./register.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluateAssertion } = require('../frontend/src/lib/assertions/evaluator.ts');
const { generateSyntheticBody } = require('../frontend/src/lib/engines/synthetic-engine.ts');
const { encodeEndpointToUrl, decodeEndpointFromUrl } = require('../frontend/src/lib/utils/share-encoder.ts');
const { importCollection } = require('../frontend/src/lib/generators/import-export.ts');
const { buildPython } = require('../frontend/src/lib/generators/code-snippets.ts');
const { executeLive } = require('../frontend/src/lib/engines/mock-executor.ts');

const endpoint = (extra = {}) => ({ id: 'ep-test', collectionId: 'col-test', name: 'Test', method: 'POST', path: '/orders', resource: 'Orders', authRequired: false, headers: [], queryParams: [], pathParams: [], requestBody: '', mockScenario: 200, createdAt: '', updatedAt: '', ...extra });

test('strict assertions distinguish null, numbers, strings and casing', () => {
  const eq = (actual, expectedValue) => evaluateAssertion({ id: 'a', enabled: true, target: 'bodyPath', property: 'value', operator: 'equals', expectedValue }, { body: { value: actual } }).passed;
  assert.equal(eq(null, '0'), false);
  assert.equal(eq('ADMIN', 'admin'), false);
  assert.equal(eq(0, '0'), true);
  assert.equal(eq(null, 'null'), true);
});

test('synthetic generation preserves nested objects, arrays and primitive types', () => {
  const result = JSON.parse(generateSyntheticBody('{"profile":{"age":42},"active":true,"items":[{"quantity":2}],"nothing":null}'));
  assert.equal(typeof result.profile.age, 'number');
  assert.equal(typeof result.active, 'boolean');
  assert.equal(result.items.length, 1);
  assert.equal(typeof result.items[0].quantity, 'number');
  assert.equal(result.nothing, null);
});

test('share links use fragments and redact credentials in headers, query and nested body', () => {
  const url = new URL(encodeEndpointToUrl(endpoint({ headers: [{ id: 'h', key: 'Authorization', value: 'Bearer DUMMY_SECRET', enabled: true }], queryParams: [{ id: 'q', key: 'api_key', value: 'DUMMY_SECRET', enabled: true }], requestBody: '{"nested":{"password":"DUMMY_SECRET"},"name":"Alice"}' })));
  assert.equal(url.search, '');
  const payload = decodeEndpointFromUrl(new URLSearchParams(url.hash.slice(1)).get('mock'));
  assert.ok(payload);
  assert.equal(JSON.stringify(payload).includes('DUMMY_SECRET'), false);
  assert.match(payload.requestBody, /Alice/);
});

test('share decoder rejects malformed endpoint structures', () => {
  const malformed = Buffer.from(JSON.stringify({ method: 'GET', path: '/', headers: 'invalid' })).toString('base64url');
  assert.equal(decodeEndpointFromUrl(malformed), null);
});

test('Postman absolute URL import preserves destination and query values', () => {
  const result = importCollection(JSON.stringify({ info: { name: 'Fixture', schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json' }, item: [{ name: 'Orders', request: { method: 'GET', url: 'https://orders.example.com/orders?limit=5' } }] }));
  assert.equal(result.collection.baseUrl + result.endpoints[0].path, 'https://orders.example.com/orders');
  assert.equal(result.endpoints[0].queryParams[0].value, '5');
});

test('generated Python parses JSON booleans and null instead of embedding JS literals', () => {
  const source = buildPython(endpoint({ requestBody: '{"active":true,"optional":null}' }), 'https://example.com');
  assert.match(source, /json\.loads\(/);
});

test('live execution never automatically retries an unsuccessful POST', async (t) => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => { calls++; return new Response(JSON.stringify({ error: 'Gateway failed' }), { status: 502 }); });
  await executeLive(endpoint(), 'https://example.com', {}).catch(() => {});
  assert.equal(calls, 1);
});

test('draft saving preserves endpoint A after the active endpoint changes to B', async (t) => {
  const { db } = require('../frontend/src/lib/db/dexie-db.ts');
  const { useCollectionStore } = require('../frontend/src/store/collection-store.ts');
  const writes = [];
  t.mock.method(db.endpoints, 'put', async (ep) => { writes.push(ep); return ep.id; });
  useCollectionStore.setState({ activeEndpoint: endpoint({ id: 'A', name: 'Edited A' }) });
  const saving = useCollectionStore.getState().saveActiveEndpointDraft();
  useCollectionStore.setState({ activeEndpoint: endpoint({ id: 'B' }) });
  await saving;
  await new Promise(resolve => setTimeout(resolve, 300));
  assert.equal(writes[0]?.id, 'A');
  assert.equal(writes[0]?.name, 'Edited A');
});

test('workspace restore validates every endpoint before writing anything', async (t) => {
  const { db } = require('../frontend/src/lib/db/dexie-db.ts');
  const { restoreWorkspaceBackup } = require('../frontend/src/lib/generators/workspace-backup.ts');
  let writes = 0;
  t.mock.method(db.collections, 'put', async () => { writes++; });
  t.mock.method(db.endpoints, 'put', async () => { writes++; });
  await assert.rejects(() => restoreWorkspaceBackup(JSON.stringify({version:'1.0',collections:[{id:'c',name:'Test',baseUrl:'https://example.com',createdAt:'',updatedAt:''}],endpoints:[{id:'bad',collectionId:'c',method:'INVALID'}]})));
  assert.equal(writes, 0);
});
