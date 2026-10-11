const test=require('node:test');
const assert=require('node:assert/strict');

test('server enforces route body limits and never serves HTML for missing chunks', async t=>{
  const app=require('../backend/server');
  const server=app.listen(0,'127.0.0.1');
  await new Promise(resolve=>server.once('listening',resolve));
  t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));
  const origin=`http://127.0.0.1:${server.address().port}`;
  for(const [route,size] of [['/api/admin/login',5000],['/api/telemetry',9000],['/api/proxy',1050000]]) {
    const response=await fetch(origin+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({data:'x'.repeat(size)})});
    assert.equal(response.status,413,route);
  }
  const stats=await fetch(origin+'/api/stats'); assert.equal(stats.status,401); assert.match(stats.headers.get('cache-control'),/no-store/);
  const chunk=await fetch(origin+'/assets/missing-release-chunk.js'); assert.equal(chunk.status,404);
});

test('proxy quotas use Express trusted identity, while untrusted forwarded headers cannot replace it', async ()=>{
  const {createProxyHandler}=require('../backend/proxy');
  const handler=createProxyHandler();
  async function request(ip, spoofed) {
    let status;
    const res={setHeader(){},status(code){status=code;return this;},json(){return this;}};
    await handler({ip,socket:{remoteAddress:'127.0.0.1'},headers:{'x-forwarded-for':spoofed},body:{}},res);
    return status;
  }
  for(let i=0;i<120;i++) assert.notEqual(await request('203.0.113.1',String(i)),429);
  assert.equal(await request('203.0.113.1','203.0.113.2'),429);
  assert.notEqual(await request('203.0.113.2','203.0.113.1'),429);
});
