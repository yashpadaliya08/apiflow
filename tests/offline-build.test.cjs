const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('service worker is release-specific and precaches every manifest chunk', async () => {
  const { renderServiceWorker } = await import('../frontend/build/service-worker.mjs');
  const template = fs.readFileSync('frontend/public/sw.js','utf8');
  const manifest = {main:{file:'assets/main-a.js',css:['assets/main-a.css']},lazy:{file:'assets/lazy-a.js'}};
  const first=renderServiceWorker(template,manifest,'index A');
  assert.notEqual(first,renderServiceWorker(template,{...manifest,lazy:{file:'assets/lazy-b.js'}},'index A'));
  assert.notEqual(first,renderServiceWorker(template,manifest,'index B'));
  const listeners={}; let cached=[]; let install;
  vm.runInNewContext(first,{self:{addEventListener:(type,fn)=>listeners[type]=fn},caches:{open:async()=>({addAll:async paths=>cached=paths})}});
  listeners.install({waitUntil:p=>install=p}); await install;
  for(const path of ['/index.html','/assets/main-a.js','/assets/main-a.css','/assets/lazy-a.js']) assert.ok(cached.includes(path),path);
});

test('active worker keeps navigation on its own cached build while a release waits', async () => {
  const { renderServiceWorker } = await import('../frontend/build/service-worker.mjs');
  const listeners={}; const cachedShell={build:'A'}; let response;
  const script=renderServiceWorker(fs.readFileSync('frontend/public/sw.js','utf8'),{},'A');
  vm.runInNewContext(script,{URL,self:{location:{origin:'https://app.example'},addEventListener:(type,fn)=>listeners[type]=fn},caches:{open:async()=>({match:async()=>cachedShell,put:async()=>{}})},fetch:async()=>({build:'B'})});
  for (const path of ['/','/?view=studio','/?ref=github','/?mock=secret']) {
    response=undefined;
    listeners.fetch({request:{method:'GET',url:'https://app.example'+path},respondWith:p=>response=p});
    assert.equal(await response,cachedShell,path);
  }
});
