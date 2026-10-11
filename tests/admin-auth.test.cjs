const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('../backend/node_modules/express');
const { createAdminAuth } = require('../backend/admin-auth');

async function fixture(t, options = {}) {
  const app = express();
  const auth = createAdminAuth({ key: 'test-only-key-not-for-deployment', ...options });
  app.use(express.json({limit:'4kb'}));
  app.post('/login', auth.login);
  app.post('/logout', auth.logout);
  app.get('/private', (req,res)=>res.status(auth.verify(req)?200:401).json({}));
  const server = app.listen(0,'127.0.0.1');
  await new Promise(resolve=>server.once('listening',resolve));
  t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));
  const origin = `http://127.0.0.1:${server.address().port}`;
  return {origin, request:(route, init={})=>fetch(origin+route,init), login:(key='test-only-key-not-for-deployment',originHeader=origin)=>fetch(origin+'/login',{method:'POST',headers:{'Content-Type':'application/json',Origin:originHeader},body:JSON.stringify({key})})};
}

test('admin key is exchanged for a revocable HttpOnly session, never accepted in URL/header/legacy cookie', async t=>{
  const f=await fixture(t);
  for(const init of [{},{headers:{'x-admin-key':'test-only-key-not-for-deployment'}},{headers:{Cookie:'apiflow_admin_key=test-only-key-not-for-deployment'}}]) assert.equal((await f.request('/private?key=test-only-key-not-for-deployment',init)).status,401);
  const login=await f.login();
  assert.equal(login.status,204);
  const cookie=login.headers.get('set-cookie');
  assert.match(cookie,/HttpOnly/i); assert.match(cookie,/SameSite=Strict/i); assert.doesNotMatch(cookie,/test-only-key/);
  const headers={Cookie:cookie.split(';')[0]};
  assert.equal((await f.request('/private',{headers})).status,200);
  assert.equal((await f.request('/logout',{method:'POST',headers:{...headers,Origin:'https://attacker.example'}})).status,403);
  assert.equal((await f.request('/logout',{method:'POST',headers:{...headers,Origin:f.origin}})).status,204);
  assert.equal((await f.request('/private',{headers})).status,401);
});

test('login blocks cross-origin requests, throttles guesses, and fails closed without configuration',async t=>{
  const f=await fixture(t);
  assert.equal((await f.login(undefined,'https://attacker.example')).status,403);
  for(let i=0;i<5;i++) assert.equal((await f.login('wrong')).status,401);
  assert.equal((await f.login()).status,429);
  const disabled=await fixture(t,{key:''}); assert.equal((await disabled.login()).status,503);
});

test('sessions expire and production cookies are Secure',async t=>{
  let now=1000;
  const f=await fixture(t,{clock:()=>now,ttlMs:1000,secure:true});
  const response=await f.login(); const cookie=response.headers.get('set-cookie');
  assert.match(cookie,/Secure/);
  now=2001;
  assert.equal((await f.request('/private',{headers:{Cookie:cookie.split(';')[0]}})).status,401);
});
