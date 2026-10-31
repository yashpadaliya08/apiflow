const ORIGIN = 'https://apiflowstudio.onrender.com';
const articles = [
  {
    slug: 'webhook-curl-works-browser-fails',
    title: 'Why a webhook works in curl but fails in a browser',
    description: 'Understand preflight requests, signature headers, and localhost delivery before changing your webhook handler.',
    body: `<p>A POST reaches your handler from curl. The same JSON fails from a browser. Start by opening the browser Network panel: did it send an OPTIONS request, the POST itself, or neither?</p>
<h2>Check the preflight first</h2><p>A cross-origin POST with <code>Content-Type: application/json</code> or a custom signature header usually needs a preflight. The browser asks the receiver which origins, methods, and headers it permits. curl does not enforce the browser's CORS rules.</p>
<pre><code>curl -i -X OPTIONS http://localhost:3000/api/webhook \\
  -H 'Origin: https://apiflowstudio.onrender.com' \\
  -H 'Access-Control-Request-Method: POST' \\
  -H 'Access-Control-Request-Headers: content-type,stripe-signature'</code></pre>
<p>Adapt the origin, port, and header to your test. A successful preflight should allow that origin, POST, and the requested headers. The POST response also needs an appropriate Access-Control-Allow-Origin header. Configure this only where direct browser testing is intended; ordinary provider-to-server webhooks do not require CORS.</p>
<h2>Separate transport from signature validation</h2><p>If OPTIONS fails, your handler may never receive the POST. If POST arrives but returns 400 or 401, inspect the receiver's test logs. A signature can fail because the secret is wrong, the timestamp is stale, or the handler verifies reserialized JSON instead of the original request bytes.</p>
<p>A browser CORS error does not prove that nothing reached the server. Check the receiver before retrying an operation that could have side effects. Never disable signature verification on a production handler to make a test pass.</p>
<h2>Understand localhost</h2><p>localhost in a browser points to the visitor's machine. localhost on a hosted backend points to that backend's machine. APIFlow dispatches localhost test webhooks directly from the browser; remote HTTP targets use its backend proxy. Browser local-network permissions, mixed-content restrictions, and CORS can still prevent delivery. It is not a universal tunnel replacement.</p>
<h2>Try a controlled test</h2><p>Use a dummy payload, a test-only signing secret, and a handler you control. In APIFlow, open Webhooks, select the matching provider, enter the test target and secret, and dispatch. Confirm the receiver validates the signature and inspect its response. APIFlow constructs synthetic events; it does not receive real provider events or reproduce their complete delivery behavior.</p>
<p>Reference: <a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS">MDN's CORS guide</a>.</p>`
  },
  {
    slug: 'generate-sample-json-from-schema',
    title: 'Generate sample JSON from a JSON Schema in APIFlow',
    description: 'Create repeatable example responses and understand the limits of an in-browser mock.',
    body: `<p>Start with a small response shape. This schema describes an object with a required name and email:</p>
<pre><code>{
  "type": "object",
  "properties": {
    "name": { "type": "string", "example": "Alex" },
    "email": { "type": "string", "format": "email" }
  },
  "required": ["name", "email"]
}</code></pre>
<h2>Generate an example</h2><p>Create or select a request in APIFlow and switch to mock mode. Open its response-schema editor, enter the schema, and run the request. Set a seed when you need repeatable schema-generated values. An explicit response example takes precedence over schema generation on successful responses.</p>
<h2>Keep the schema small and inspect the result</h2><p>APIFlow supports a subset of JSON Schema, including common primitive types, objects, arrays, examples, enums, and basic bounds. Advanced combinations, recursive references, and some constraints are unsupported. Generating an example does not prove an arbitrary schema is valid or that every output satisfies every possible constraint.</p>
<p>Use the generated object as example data for discussion or manual testing. Review it before sharing; schemas and examples can contain private values.</p>
<h2>What the mock actually tests</h2><p>The result is displayed inside APIFlow. Changing its status or delay lets you explore response scenarios within this workspace. It does not create a URL that another frontend can fetch, and it does not automatically exercise that frontend's loading or error states.</p>
<p>Explore APIFlow's <a href="/mock-api-generator">in-browser mock generator</a> for response scenarios, or <a href="/blog/import-postman-collection">import an existing Postman collection</a> to start with your own request shapes.</p>
<p>Reference: <a href="https://json-schema.org/understanding-json-schema/reference/object">JSON Schema object documentation</a>. The example keyword shown above is an APIFlow-supported annotation, not a portable validation rule.</p>`
  },
  {
    slug: 'import-postman-collection',
    title: 'Import a Postman collection into APIFlow',
    description: 'Move common HTTP requests into a browser workspace while checking variables, authentication, and import warnings.',
    body: `<p>Export a small Postman collection as Collection v2.1 JSON. Use a sanitized copy: exported collections can contain API keys, tokens, private URLs, and payloads.</p>
<h2>Import and read the warnings</h2><p>Open APIFlow's Import / export tools and choose the Postman JSON import. Select your collection, then inspect the imported requests and any warnings before sending them. Common HTTP requests, headers, query and path parameters, variables, and inherited bearer, API-key, and basic authentication are supported.</p>
<h2>Check variables and authentication</h2><p>A request URL such as <code>{{baseUrl}}/users/{{userId}}</code> still needs appropriate values. Set the active environment, review the resolved destination and headers, and use dummy credentials for the first test. Environment variables override collection variables at send time.</p>
<h2>Know what does not transfer</h2><p>APIFlow does not execute imported Postman pre-request or test scripts, OAuth flows, or non-raw request bodies. Script-generated tokens therefore need a separate workflow. Do not assume a successful import means identical execution semantics.</p>
<h2>Run one safe request first</h2><p>Choose a read-only test endpoint you control. Use live mode only when you intend to contact it. Live traffic passes through APIFlow's Express backend, including explicitly supplied headers and body; use a trusted self-hosted instance for sensitive requests. Mock mode generates a local simulation instead.</p>
<p>Collections live in this browser's IndexedDB without automatic cloud sync. Export backups before clearing site data or moving to another origin. Backups are not automatically redacted or encrypted.</p>
<p>Review the <a href="/postman-alternative">Postman alternative overview</a> before switching workflows. For storage and offline behavior, see the <a href="/offline-api-client">offline API client guide</a>.</p>`
  }
];
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const arrow = '<svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
// Publication dates match the dates displayed in the guides; do not bump on deploy.
const published = '2026-10-26';
const organization = { '@type': 'Organization', name: 'APIFlow Studio', url: ORIGIN + '/' };
const jsonLd = value => JSON.stringify(value).replace(/</g, '\\u003c');
function structuredData(title, description, route) {
  const article = articles.find(a => route === '/blog/' + a.slug);
  const url = ORIGIN + route;
  return { '@context': 'https://schema.org', '@graph': [
    article ? {
      '@type': 'BlogPosting', '@id': url + '#article', headline: title, description,
      url, mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      datePublished: published, author: organization, publisher: organization, inLanguage: 'en'
    } : {
      '@type': 'CollectionPage', '@id': url, name: title, description, url,
      mainEntity: { '@type': 'ItemList', itemListElement: articles.map((a, i) => ({
        '@type': 'ListItem', position: i + 1, name: a.title, url: ORIGIN + '/blog/' + a.slug
      })) }
    },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'APIFlow Studio', item: ORIGIN + '/' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: ORIGIN + '/blog' },
      ...(article ? [{ '@type': 'ListItem', position: 3, name: title, item: url }] : [])
    ] }
  ] };
}
const meta = a => `<span>${['Webhooks & HTTP', 'Response schemas', 'Collections'][articles.indexOf(a)]}</span><span>${Math.max(1, Math.ceil(a.body.replace(/<[^>]*>/g, ' ').split(/\s+/).length / 200))} min read</span>`;
function preview(index) {
  if (index === 0) return `<div class="request-preview" aria-label="Illustrative CORS preflight sequence"><div class="preview-header"><span>Browser → webhook handler</span><span class="file-type">HTTP</span></div><div class="request-line"><span class="method">OPTIONS</span><code>/api/webhook</code><span class="status">204</span></div><dl><div><dt>Origin</dt><dd>https://your-app.dev</dd></div><div><dt>Allow-Methods</dt><dd>POST, OPTIONS</dd></div><div><dt>Allow-Headers</dt><dd>stripe-signature</dd></div></dl><div class="request-line last"><span class="method post">POST</span><code>/api/webhook</code>${arrow}</div><p class="preview-caption">Check the preflight before debugging the payload.</p></div>`;
  return index === 1 ? `<div class="small-preview"><span class="file-label">response.schema.json</span><pre><code>{
  <span>"type"</span>: "object",
  <span>"required"</span>: ["email"]
}</code></pre></div>` : `<div class="small-preview"><span class="file-label">collection.json</span><div class="import-flow"><span>Postman v2.1</span>${arrow}<span>APIFlow</span></div><code class="import-url">GET {{baseUrl}}/users</code></div>`;
}
function page(title, description, route, body) {
  const discovery = route ? `<link rel="canonical" href="${ORIGIN}${route}">
<meta property="og:url" content="${ORIGIN}${route}">
<script type="application/ld+json">${jsonLd(structuredData(title, description, route))}</script>` : '<meta name="robots" content="noindex, follow">';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)} | APIFlow</title><meta name="description" content="${escape(description)}">${discovery}<meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:site_name" content="APIFlow Studio"><meta property="og:type" content="${route && route !== '/blog' ? 'article' : 'website'}"><meta name="twitter:card" content="summary"><meta name="twitter:title" content="${escape(title)}"><meta name="twitter:description" content="${escape(description)}">${route && route !== '/blog' ? `<meta property="article:published_time" content="${published}">` : ''}<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/blog-assets/editorial.css"></head><body><a class="skip-link" href="#content">Skip to content</a><header class="site-header"><nav aria-label="Main"><a class="brand" href="/"><img src="/favicon.svg" width="25" height="25" alt="">APIFlow<span>Studio</span></a><div class="nav-links"><a href="/blog" aria-current="page">Blog</a><a href="https://github.com/yashpadaliya08/apiflow">GitHub</a></div><a class="workspace-link" href="/?view=studio&amp;ref=blog">Open workspace ${arrow}</a></nav></header><main id="content">${body}</main><footer><a class="brand footer-brand" href="/">APIFlow Studio</a><span>Built for the work between request and response.</span><div><a href="/blog">Blog</a><a href="/privacy">Privacy</a><a href="https://github.com/yashpadaliya08/apiflow">Source code ${arrow}</a></div></footer></body></html>`;
}
function registerBlog(app) {
  app.use('/blog', (req, res, next) => {
    if (req.path.endsWith('/') && req.originalUrl.split('?')[0].endsWith('/')) {
      const [pathname, query] = req.originalUrl.split('?');
      return res.redirect(301, pathname.replace(/\/+$/, '') + (query ? '?' + query : ''));
    }
    next();
  });
  app.get('/blog-assets/editorial.css', (req, res) => res.sendFile(require('node:path').join(__dirname, 'blog.css')));
  app.get('/blog', (req, res) => {
    const first = articles[0];
    res.send(page('API testing guides', 'Practical guides to HTTP testing, mock responses, and signed webhook development.', '/blog', `<section class="index-heading"><h1>API testing,<br><span>explained.</span></h1><div><p>Working notes on webhooks, response schemas, and the requests you send every day.</p><a class="text-link" href="#all-guides">Browse the guides ${arrow}</a></div></section><article class="featured"><div class="featured-copy"><div class="article-meta">${meta(first)}</div><h2><a href="/blog/${first.slug}">${escape(first.title)}</a></h2><p>${escape(first.description)}</p><a class="text-link" href="/blog/${first.slug}">Read the guide ${arrow}</a><time datetime="2026-10-26">October 26, 2026</time></div>${preview(0)}</article><section class="all-guides" id="all-guides"><div class="section-heading"><h2>More from the workbench</h2><span>Practical guides · No account needed</span></div>${articles.slice(1).map((a, i) => `<article class="guide-row">${preview(i + 1)}<div><div class="article-meta">${meta(a)}</div><h2><a href="/blog/${a.slug}">${escape(a.title)}</a></h2><p>${escape(a.description)}</p><a class="text-link" href="/blog/${a.slug}">Read the guide ${arrow}</a></div></article>`).join('')}</section><aside class="workspace-note"><div><h2>Put the examples to work.</h2><p>Open a request, explore a response, and keep your collections in your browser.</p></div><a class="workspace-link" href="/?view=studio&amp;ref=blog">Open APIFlow ${arrow}</a></aside>`));
  });
  app.get('/blog/:slug', (req, res) => {
    const a = articles.find(a => a.slug === req.params.slug);
    if (!a) return res.status(404).send(page('Guide not found', 'This guide does not exist.', null, '<h1>Guide not found</h1><a href="/blog">Browse the guides</a>'));
    const headings = [];
    const body = a.body.replace(/<h2>(.*?)<\/h2>/g, (_, title) => {
      const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      headings.push({ title, id });
      return `<h2 id="${id}">${title}</h2>`;
    });
    res.send(page(a.title, a.description, `/blog/${a.slug}`, `<div class="article-top"><a class="back-link" href="/blog">← All guides</a><div class="article-meta">${meta(a)}</div><h1>${escape(a.title)}</h1><p class="article-deck">${escape(a.description)}</p><div class="byline"><span class="author-mark">AF</span><span>APIFlow Studio<br><time datetime="2026-10-26">October 26, 2026</time></span></div></div><div class="reading-layout"><article class="article-body">${body}<div class="article-end"><p>Ready to try the workflow?</p><a class="workspace-link" href="/?view=studio&amp;ref=blog">Open APIFlow ${arrow}</a></div></article><aside class="contents"><nav aria-label="On this page"><h2>On this page</h2>${headings.map(h => `<a href="#${h.id}">${h.title}</a>`).join('')}</nav><div class="aside-note"><p>Keep the guide open.<br>Try it in the workspace.</p><a class="text-link" href="/?view=studio&amp;ref=blog">Open APIFlow ${arrow}</a></div></aside></div><section class="related"><h2>Keep reading</h2>${articles.filter(other => other !== a).map(other => `<a href="/blog/${other.slug}">${escape(other.title)} ${arrow}</a>`).join('')}</section>`));
  });
}
module.exports = { registerBlog, articles };
