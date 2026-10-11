const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
test('service worker never intercepts admin, telemetry or asset query URLs', () => {
  const listeners = {};
  vm.runInNewContext(fs.readFileSync('frontend/public/sw.js','utf8'), { self:{location:{origin:'https://app.example.com'}, addEventListener:(type, handler) => { listeners[type] = handler; }}, URL, console });
  for (const path of ['/stats','/admin/stats','/api/stats','/assets/chunk.js?secret=value']) {
    let intercepted = false;
    listeners.fetch({request:{method:'GET',url:'https://app.example.com'+path},respondWith:() => { intercepted = true; }});
    assert.equal(intercepted, false, path);
  }
});
