const http = require('node:http');
const https = require('node:https');
const dns = require('node:dns').promises;
const net = require('node:net');

const blocked = new net.BlockList();
for (const [ip, bits] of [['0.0.0.0',8], ['10.0.0.0',8], ['100.64.0.0',10], ['127.0.0.0',8], ['169.254.0.0',16], ['172.16.0.0',12], ['192.0.0.0',24], ['192.0.2.0',24], ['192.88.99.0',24], ['192.168.0.0',16], ['198.18.0.0',15], ['198.51.100.0',24], ['203.0.113.0',24], ['224.0.0.0',4], ['240.0.0.0',4]]) blocked.addSubnet(ip, bits, 'ipv4');
for (const [ip, bits] of [['2001::',23], ['2001:db8::',32], ['2002::',16]]) blocked.addSubnet(ip, bits, 'ipv6');
const globalV6 = new net.BlockList();
globalV6.addSubnet('2000::', 3, 'ipv6');

function isPublicAddress(address) {
  const family = net.isIP(address);
  if (family === 4) return !blocked.check(address, 'ipv4');
  // Only globally routable IPv6; excludes mapped, translated, link-local and ULA ranges.
  return family === 6 && globalV6.check(address, 'ipv6') && !blocked.check(address, 'ipv6');
}

class ProxyError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

async function resolveTarget(rawUrl, allowedDomains, lookup) {
  let url;
  try { url = new URL(rawUrl); } catch { throw new ProxyError(400, 'Invalid target URL.'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new ProxyError(400, 'Use HTTP(S) without credentials in the URL.');
  const hostname = url.hostname.replace(/^\[|\]$/g, '').toLowerCase().replace(/\.$/, '');
  if (!allowedDomains.some(pattern => pattern === '*' || pattern === hostname || (pattern.startsWith('*.') && (hostname === pattern.slice(2) || hostname.endsWith(pattern.slice(1)))))) throw new ProxyError(403, 'Target domain is not in ALLOWED_PROXY_DOMAINS.');
  if (/^(localhost|metadata\.google\.internal|instance-data)$/.test(hostname) || /\.(localhost|local|internal|lan)$/.test(hostname)) throw new ProxyError(403, 'Local and internal destinations are blocked.');
  if ([21,22,23,25,53,110,143,389,445,1433,1521,3306,5432,6379,9200,11211,27017,28017].includes(Number(url.port))) throw new ProxyError(403, 'Target port is restricted.');
  let addresses;
  try { addresses = net.isIP(hostname) ? [{ address: hostname, family: net.isIP(hostname) }] : await lookup(hostname, { all: true, verbatim: true }); }
  catch { throw new ProxyError(502, 'Could not resolve target hostname.'); }
  if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address))) throw new ProxyError(403, 'Private or reserved destination addresses are blocked.');
  return { url, address: addresses[0] };
}

function readUpstream(url, address, input, options) {
  return new Promise((resolve, reject) => {
    const headers = {};
    const forbidden = /^(host|connection|content-length|transfer-encoding|upgrade|proxy-.*|sec-.*|x-forwarded-.*|x-admin-key|accept-encoding)$/i;
    for (const [key, value] of Object.entries(input.headers || {})) {
      if (forbidden.test(key)) continue;
      if (typeof value !== 'string' || /[\r\n]/.test(key + value) || !/^[!#$%&'*+.^_`|~\w-]+$/.test(key)) return reject(new ProxyError(400, 'Invalid request header.'));
      headers[key.toLowerCase()] = value;
    }
    // Only explicitly supplied target headers are forwarded, never application cookies.
    headers['accept-encoding'] = 'identity';
    let request;
    const timer = setTimeout(() => request?.destroy(new ProxyError(504, 'Upstream request timed out.')), options.timeoutMs);
    const finish = (error, value) => { clearTimeout(timer); error ? reject(error) : resolve(value); };
    try {
      request = options.request(url, {
        method: input.method,
        headers,
        agent: false,
        // Connect only to the address just validated; never re-resolve at connection time.
        lookup: (_hostname, opts, callback) => opts?.all ? callback(null, [address]) : callback(null, address.address, address.family),
      }, response => {
        const chunks = [];
        let size = 0;
        response.on('data', chunk => {
          size += chunk.length;
          if (size > options.maxResponseBytes) {
            const error = new ProxyError(413, 'Upstream response exceeds the size limit.');
            response.destroy(error);
            request?.destroy(error);
            finish(error);
          } else chunks.push(Buffer.from(chunk));
        });
        response.on('error', error => finish(error));
        response.on('aborted', () => finish(new ProxyError(502, 'Upstream response was interrupted.')));
        response.on('end', () => {
          const responseHeaders = {};
          for (const [key, value] of Object.entries(response.headers)) {
            if (!['set-cookie', 'set-cookie2'].includes(key.toLowerCase()) && value !== undefined) responseHeaders[key] = Array.isArray(value) ? value.join(', ') : String(value);
          }
          finish(null, { status: response.statusCode, statusText: response.statusMessage || '', headers: responseHeaders, body: Buffer.concat(chunks).toString('utf8'), size });
        });
      });
      request.on('error', error => finish(error));
      request.end(input.body || undefined);
    } catch (error) { finish(error); }
  });
}

function createProxyHandler(config = {}) {
  const allowedDomains = config.allowedDomains || (process.env.ALLOWED_PROXY_DOMAINS || '*').split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
  const lookup = config.lookup || dns.lookup;
  const options = {
    timeoutMs: config.timeoutMs || 30000,
    maxResponseBytes: config.maxResponseBytes || 5 * 1024 * 1024,
    request: config.request || ((url, opts, callback) => (url.protocol === 'https:' ? https : http).request(url, opts, callback)),
  };
  const clients = new Map();
  let active = 0;
  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const now = Date.now();
    const client = req.ip || req.socket.remoteAddress || 'unknown';
    for (const [key, entry] of clients) if (entry.expires < now) clients.delete(key);
    const quota = clients.get(client) || { count: 0, expires: now + 60000 };
    if (++quota.count > 120 || active >= 20 || (!clients.has(client) && clients.size >= 5000)) return res.status(429).json({ error: 'Proxy capacity reached. Try again shortly.' });
    clients.set(client, quota);
    active++;
    try {
      const input = req.body;
      if (!input || typeof input.url !== 'string' || !['GET','HEAD','POST','PUT','PATCH','DELETE','OPTIONS'].includes(input.method) || (input.headers !== undefined && (!input.headers || Array.isArray(input.headers) || typeof input.headers !== 'object')) || (input.body !== undefined && typeof input.body !== 'string')) throw new ProxyError(400, 'Invalid proxy request envelope.');
      if (['GET', 'HEAD'].includes(input.method) && input.body) throw new ProxyError(400, 'GET and HEAD cannot have a request body.');
      if (Buffer.byteLength(JSON.stringify(input)) > 1024 * 1024) throw new ProxyError(413, 'Request exceeds the 1 MB limit.');
      let dnsTimer;
      const target = await Promise.race([
        resolveTarget(input.url, allowedDomains, lookup),
        new Promise((_, reject) => { dnsTimer = setTimeout(() => reject(new ProxyError(504, 'DNS lookup timed out.')), 5000); }),
      ]).finally(() => clearTimeout(dnsTimer));
      const started = Date.now();
      const result = await readUpstream(target.url, target.address, input, options);
      // Never copy upstream content-type, cookies, Location or CSP onto the app response.
      return res.json({ ...result, url: target.url.href, latency: Date.now() - started });
    } catch (error) {
      return res.status(error.status || 502).json({ error: error.status ? error.message : 'Could not complete upstream request.' });
    } finally { active--; }
  };
}

module.exports = { createProxyHandler, isPublicAddress };
