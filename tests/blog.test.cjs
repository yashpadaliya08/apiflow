const test = require('node:test');
const assert = require('node:assert/strict');
test('blog serves readable article HTML, security headers, sitemap links and real missing-page status', async t => {
  const app = require('../backend/server');
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  const base = `http://127.0.0.1:${server.address().port}`;
  const list = await fetch(base + '/blog');
  assert.equal(list.status, 200);
  assert.ok(list.headers.get('content-security-policy'));
  const html = await list.text();
  const sitemap = await (await fetch(base + '/sitemap.xml')).text();
  const locations = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
  assert.equal(new Set(locations).size, locations.length);
  assert.ok(locations.every(url => !url.includes('#') && !url.includes('?')));
  assert.equal(locations.length, 10);
  assert.ok(html.includes('"@type":"CollectionPage"'));
  assert.equal((await fetch(base + '/blog-assets/editorial.css')).status, 200);
  const redirect = await fetch(base + '/blog/?ref=seo', { redirect: 'manual' });
  assert.equal(redirect.status, 301);
  assert.equal(redirect.headers.get('location'), '/blog?ref=seo');
  for (const article of require('../backend/blog').articles) {
    assert.ok(html.includes('/blog/' + article.slug));
    assert.ok(sitemap.includes('/blog/' + article.slug));
    const response = await fetch(base + '/blog/' + article.slug);
    assert.equal(response.status, 200);
    const body = await response.text();
    assert.ok(body.includes('<h1>' + article.title));
    assert.ok(body.includes('rel="canonical"'));
    assert.ok(body.includes('view=studio&amp;ref=blog'));
    const url = 'https://apiflowstudio.onrender.com/blog/' + article.slug;
    assert.ok(body.includes('<link rel="canonical" href="' + url + '">'));
    assert.ok(body.includes('<meta property="og:url" content="' + url + '">'));
    assert.ok(body.includes('name="twitter:card"'));
    const schema = JSON.parse(body.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
    const posting = schema['@graph'].find(item => item['@type'] === 'BlogPosting');
    assert.equal(posting.headline, article.title);
    assert.equal(posting.url, url);
    assert.equal(posting.author.name, 'APIFlow Studio');
    assert.ok(body.includes('datetime="' + posting.datePublished + '"'));
    assert.equal(schema['@graph'].find(item => item['@type'] === 'BreadcrumbList').itemListElement.at(-1).item, url);
  }
  const missing = await fetch(base + '/blog/nonexistent-guide');
  assert.equal(missing.status, 404);
  const missingHtml = await missing.text();
  assert.ok(missingHtml.includes('content="noindex, follow"'));
  assert.ok(!missingHtml.includes('rel="canonical"'));
  assert.equal((await fetch(base + '/api/stats?format=json')).status, 401);
  for (let i = 0; i < 120; i++) {
    const response = await fetch(base + '/api/telemetry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"event":"unknown"}' });
    assert.equal(response.status, 200);
  }
  assert.equal((await fetch(base + '/api/telemetry', { method: 'POST' })).status, 429);
});
