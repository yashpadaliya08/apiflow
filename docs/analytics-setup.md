# Durable admin analytics and blog

Updated 2026-10-26. PostgreSQL works with Neon or Supabase; no browser database key is needed.

Neon setup verified locally on 2026-10-31: `neon deploy` uses the existing `neon.ts` policy and pulls database settings into the ignored `.env`. The CLI currently supplies `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, and `NEON_BRANCH`. The app uses `DATABASE_URL_POOLED` if explicitly supplied, otherwise `DATABASE_URL`; keep the direct/unpooled URL for administrative tools. `npm start` loads optional `.env` and then `.env.local` using the pinned Node 24 runtime. Existing process environment variables take precedence. Render must receive its own private database environment value; local env files are not deployed.

If deployment fails with `Cannot find module '@neon/config/v1'`, check for the empty `@neon/config` 0.0.0 placeholder. Working dependencies are now installed and locked: config 1.10.0 and env 1.6.8. Use the pinned Node version for the CLI as well as the app.

1. Create a PostgreSQL database in your chosen provider. Choose a nearby region and its recommended pooled connection endpoint. Use a server-side role that owns the analytics table; Supabase public/anonymous keys cannot access it.
2. Privately add the provider's connection string as DATABASE_URL in Render Environment. Follow provider TLS verification requirements (prefer sslmode=verify-full); never disable certificate verification. Do not paste credentials into chat, source code, URLs, or screenshots.
3. Export the currently visible totals before restarting the old server if you want a historical record. Previously erased data is unavailable. This version starts durable history with the first successfully persisted event; it does not silently import temporary counters, which could double-count events.
4. Deploy. The additive, rerunnable backend/migrations/001-analytics.sql migration creates a daily aggregate table on first database use, with row-level security and no public policies. The connected role needs permission to create/manage this table. It is intentionally irreversible: retain history when rolling back app code.
5. Open /stats, sign in, and confirm the saved-totals message. Send a dummy page view and simulation, refresh, export JSON, restart/redeploy, and confirm totals remain. Select Today, Last 7 days, Last 30 days, or Lifetime (UTC calendar days). Missing database configuration is visibly labeled temporary; database failures return 503 and never substitute zero historical totals.

Persisted: daily page views, feature-event totals, source/device/country counts, and validated public campaign tags. Live executions are client-reported events, not independently verified upstream successes. Online visitors, approximate unique IPs, and recent visits remain process-scoped. No raw IPs, unique visitor hashes, API URLs, payloads, or credentials are stored in the analytics table. Do not put secrets into public campaign tags. Client telemetry can be blocked or spoofed; counters are not billing or exact people counts.

The backend acknowledges events only after a database write succeeds. An unavailable database yields an error; browser beacon telemetry is best-effort and is not durably retried. Thus brief outages/network failures can leave gaps. There is no promise of lossless accounting. Export totals periodically and use provider backups; retain your private database credentials separately.

Blog: /blog plus three guides, served as complete HTML by Express. Content lives in backend/blog.js; add an article there and its sitemap entry is generated automatically. Landing footer links to the index. No CMS, browser editing, or database-backed blog is needed. Canonical origin is currently the existing production Render hostname. Review it if moving domains.

Runtime security updates from docs/security-runtime-update.md still apply. Nothing is deployed until GitHub/Render deployment is performed.
