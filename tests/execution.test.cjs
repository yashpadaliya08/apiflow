require('./register.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const { createHmac, webcrypto } = require('node:crypto');
const ep = { id: 'ep', collectionId: 'c', method: 'POST', name: 'Request', path: '/{{version}}/items/:id', resource: 'Items', headers: [{ id:'h', key:'Authorization', value:'Bearer {{token}}', enabled:true }], queryParams: [{ id:'q', key:'q', value:'{{query}}', enabled:true }], pathParams: [{ id:'p', key:'id', value:'a/b', enabled:true }], requestBody: '{"id":"{{token}}"}', mockScenario:200 };
const vars = Object.entries({ version:'v1', token:'test-token', query:'a b', baseUrl:'https://example.com' }).map(([key,value]) => ({id:key,key,value,enabled:true}));

test('one request preparation resolves variables and encodes path segments', () => {
  const { prepareRequest } = require('../frontend/src/lib/execution/request.ts');
  const result = prepareRequest(ep, '{{baseUrl}}', vars);
  assert.equal(result.url, 'https://example.com/v1/items/a%2Fb?q=a+b');
  assert.equal(result.headers.Authorization, 'Bearer test-token');
  assert.equal(result.body, '{"id":"test-token"}');
  assert.throws(() => prepareRequest(ep, '{{baseUrl}}', []), /Unresolved/);
});

test('runner fails a 200 response when a saved body assertion fails', async () => {
  const { executeEndpoint } = require('../frontend/src/lib/execution/execute-endpoint.ts');
  const result = await executeEndpoint({ ...ep, path:'/items', assertions:[{id:'a', enabled:true,target:'bodyPath',property:'missing',operator:'exists',expectedValue:''}] }, 'https://example.com', [], 'mock');
  assert.equal(result.passed, false);
  assert.equal(result.assertions[0].passed, false);
});

test('provider signatures verify against independently computed HMACs', async () => {
  const { buildWebhookHeaders } = require('../frontend/src/lib/webhooks/signatures.ts');
  const body = '{"hello":"world"}';
  const secret = 'test-secret';
  const now = 1700000000;
  const id = 'msg_test';
  const hmac = (key, data, encoding) => createHmac('sha256', key).update(data).digest(encoding);
  const stripe = await buildWebhookHeaders('Stripe', 'payment_intent.succeeded', body, secret, now, id, webcrypto);
  assert.equal(stripe['Stripe-Signature'], 't=1700000000,v1=' + hmac(secret, now + '.' + body, 'hex'));
  const github = await buildWebhookHeaders('GitHub', 'pull_request.opened', body, secret, now, id, webcrypto);
  assert.equal(github['X-GitHub-Event'], 'pull_request');
  assert.equal(github['X-Hub-Signature-256'], 'sha256=' + hmac(secret, body, 'hex'));
  const shopify = await buildWebhookHeaders('Shopify', 'orders/create', body, secret, now, id, webcrypto);
  assert.equal(shopify['X-Shopify-Hmac-Sha256'], hmac(secret, body, 'base64'));
  const clerk = await buildWebhookHeaders('Clerk', 'user.created', body, 'whsec_' + Buffer.from(secret).toString('base64'), now, id, webcrypto);
  assert.equal(clerk['svix-signature'], 'v1,' + hmac(secret, `${id}.${now}.${body}`, 'base64'));
  await assert.rejects(() => buildWebhookHeaders('Stripe', '', body, '', now, id, webcrypto), /secret/i);
});

test('schema mocks preserve constraints and repeat with a seed', async () => {
  const { executeMock } = require('../frontend/src/lib/engines/mock-executor.ts');
  const endpoint = { ...ep, path:'/items', mockSeed:42, mockLatency:0, responseSchema: { type:'object', properties:{ count:{type:'integer',minimum:5,maximum:5}, active:{type:'boolean'}, items:{type:'array',minItems:2,maxItems:2,items:{type:'string',enum:['fixed']}}}, required:['count','active','items'] } };
  const first = await executeMock(endpoint);
  const second = await executeMock(endpoint);
  assert.equal(first.body.count, 5);
  assert.deepEqual(first.body.items, ['fixed','fixed']);
  assert.equal(typeof first.body.active, 'boolean');
  assert.deepEqual(first.body, second.body);
});
