const crypto = require('node:crypto');

// Process-local sessions: restart revokes all sessions. Never store the admin key in a cookie.
function createAdminAuth({ key = '', clock = Date.now, ttlMs = 30 * 60 * 1000, secure = process.env.NODE_ENV === 'production', publicOrigin = process.env.PUBLIC_ORIGIN } = {}) {
  const sessions = new Map();
  const attempts = new Map();
  const cookieName = 'apiflow_admin_session';
  const cookieOptions = { httpOnly: true, secure, sameSite: 'strict', path: '/' };
  const digest = value => crypto.createHash('sha256').update(value).digest();
  const configured = Boolean(key && key !== 'change_me_to_a_secure_admin_key');
  const expectedKey = digest(key);
  function prune(map) { for (const [id, value] of map) if (value.expires <= clock()) map.delete(id); }
  function token(req) {
    return (req.headers.cookie || '').split(';').map(part => part.trim()).find(part => part.startsWith(cookieName + '='))?.slice(cookieName.length + 1) || '';
  }
  function sessionId(req) { return digest(token(req)).toString('hex'); }
  function sameOrigin(req) {
    try {
      const origin = req.get('origin');
      const expected = publicOrigin || `${req.protocol}://${req.get('host')}`;
      return Boolean(origin && new URL(origin).origin === new URL(expected).origin && req.get('sec-fetch-site') !== 'cross-site');
    } catch { return false; }
  }
  function verify(req) {
    prune(sessions);
    return configured && sessions.has(sessionId(req));
  }
  function login(req, res) {
    res.set('Cache-Control', 'no-store');
    if (!sameOrigin(req)) return res.status(403).json({error:'Same-origin login required.'});
    if (!configured) return res.status(503).json({error:'Admin access is not configured.'});
    prune(attempts); prune(sessions);
    const client = req.ip || req.socket.remoteAddress || 'unknown';
    const quota = attempts.get(client) || {count:0, expires:clock()+60000};
    if (quota.count >= 5 || (!attempts.has(client) && attempts.size >= 1000)) return res.status(429).set('Retry-After','60').json({error:'Too many login attempts. Try again in a minute.'});
    quota.count++; attempts.set(client,quota);
    if (typeof req.body?.key !== 'string' || !crypto.timingSafeEqual(digest(req.body.key), expectedKey)) return res.status(401).json({error:'Invalid admin key.'});
    if (sessions.size >= 1000) return res.status(503).json({error:'Session capacity reached. Try later.'});
    sessions.delete(sessionId(req));
    const session = crypto.randomBytes(32).toString('hex');
    sessions.set(digest(session).toString('hex'),{expires:clock()+ttlMs});
    res.cookie(cookieName,session,{...cookieOptions,maxAge:ttlMs});
    res.clearCookie('apiflow_admin_key',{path:'/'});
    return res.status(204).end();
  }
  function logout(req,res) {
    res.set('Cache-Control','no-store');
    if (!sameOrigin(req)) return res.status(403).json({error:'Same-origin logout required.'});
    sessions.delete(sessionId(req));
    res.clearCookie(cookieName,cookieOptions);
    res.clearCookie('apiflow_admin_key',{path:'/'});
    return res.status(204).end();
  }
  return {verify,login,logout};
}
module.exports = {createAdminAuth};
