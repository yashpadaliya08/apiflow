require('./register.cjs');
const test=require('node:test');
const assert=require('node:assert/strict');
const {hasAdminSession}=require('../frontend/src/lib/admin-session.ts');
test('admin UI discovers HttpOnly sessions from server status without reading a cookie or key',async t=>{
  t.mock.method(globalThis,'fetch',async(url,options)=>{
    assert.equal(url,'/api/stats');
    assert.equal(options.credentials,'same-origin');
    assert.equal(options.cache,'no-store');
    assert.equal(options.headers,undefined);
    return new Response('{}',{status:200});
  });
  assert.equal(await hasAdminSession(),true);
});
test('admin UI treats expired and offline sessions as unavailable',async t=>{
  t.mock.method(globalThis,'fetch',async()=>new Response('{}',{status:401}));
  assert.equal(await hasAdminSession(),false);
  t.mock.method(globalThis,'fetch',async()=>{throw new Error('offline');});
  assert.equal(await hasAdminSession(),false);
});
