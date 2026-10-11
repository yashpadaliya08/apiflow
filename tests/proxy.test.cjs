const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { PassThrough } = require('node:stream');

function upstream(statusCode = 200, text = '<script>untrusted()</script>', headers = { 'content-type': 'text/html', 'set-cookie': 'session=upstream' }) {
  return (url, options, callback) => {
    const request = new EventEmitter();
    request.destroy = (err) => request.emit('error', err);
    request.end = () => {
      const response = new PassThrough();
      response.statusCode = statusCode;
      response.statusMessage = 'Fixture';
      response.headers = headers;
      callback(response);
      response.end(text);
    };
    request.write = () => {};
    return request;
  };
}
async function invoke(handler, body, extra = {}) {
  const req = { body, headers: { cookie: 'apiflow_admin_key=DUMMY_SECRET' }, socket: { remoteAddress: '127.0.0.1' }, ...extra };
  const output = { status: 200, headers: {} };
  const res = { status(code) { output.status = code; return this; }, setHeader(k,v) { output.headers[k.toLowerCase()] = v; }, json(value) { output.body = value; return this; } };
  await handler(req, res);
  return output;
}
const input = { url: 'https://public.example.com/data', method: 'GET', headers: {} };

test('private destinations, mapped IPs and failed DNS are blocked before dispatch', async () => {
  const { createProxyHandler, isPublicAddress } = require('../backend/proxy.js');
  for (const address of ['127.0.0.1', '10.1.2.3', '169.254.169.254', '::1', '::ffff:7f00:1', 'fc00::1']) assert.equal(isPublicAddress(address), false, address);
  assert.equal(isPublicAddress('8.8.8.8'), true);
  assert.equal(isPublicAddress('2606:4700:4700::1111'), true);
  const handler = createProxyHandler({ lookup: async () => [{ address: '10.0.0.1', family: 4 }], request: () => assert.fail('must not dispatch') });
  assert.equal((await invoke(handler, input)).status, 403);
  const failedDns = createProxyHandler({ lookup: async () => { throw new Error('DNS unavailable'); }, request: () => assert.fail('must not dispatch') });
  assert.equal((await invoke(failedDns, input)).status, 502);
});

test('proxy envelopes HTML, isolates cookies, and pins the validated DNS address', async () => {
  const { createProxyHandler } = require('../backend/proxy.js');
  const handler = createProxyHandler({ lookup: async () => [{ address: '8.8.8.8', family: 4 }], request: (url, options, callback) => {
    assert.equal(options.headers.cookie, undefined);
    options.lookup('public.example.com', {}, (err, address) => { assert.ifError(err); assert.equal(address, '8.8.8.8'); });
    return upstream()(url, options, callback);
  } });
  const output = await invoke(handler, input);
  assert.equal(output.body.status, 200);
  assert.match(output.body.body, /<script>/);
  assert.equal(output.headers['set-cookie'], undefined);
  assert.equal(output.headers['content-type'], undefined);
  assert.equal(output.body.headers['set-cookie'], undefined);
});

test('redirects are returned as data without a second outgoing request', async () => {
  const { createProxyHandler } = require('../backend/proxy.js');
  let calls = 0;
  const handler = createProxyHandler({ lookup: async () => [{ address: '8.8.8.8', family: 4 }], request: (...args) => { calls++; return upstream(302, '', { location: 'http://127.0.0.1/private' })(...args); } });
  const result = await invoke(handler, input);
  assert.equal(result.body.status, 302);
  assert.equal(calls, 1);
});

test('oversized upstream bodies are rejected', async () => {
  const { createProxyHandler } = require('../backend/proxy.js');
  const handler = createProxyHandler({ maxResponseBytes: 5, lookup: async () => [{ address: '8.8.8.8', family: 4 }], request: upstream(200, 'too much data') });
  assert.equal((await invoke(handler, input)).status, 413);
});
