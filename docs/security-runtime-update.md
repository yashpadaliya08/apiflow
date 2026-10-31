# Node and Render security update

Prepared 2026-10-26 for the October 2026 Node.js and eMudhra advisories.

## Changes

The root `.node-version`, GitHub Actions CI, and both Docker build stages select Node 24.22.1. Docker stages update Alpine packages and the system certificate store during a fresh build. Node's patched release also updates its bundled certificate handling. PHP is not used by this project.

Sources: [Render advisory](https://render.com/docs/advisory-emudhra), [Node security release](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases), [Render version selection](https://render.com/docs/node-version).

## Before deploying

Capture currently visible admin analytics if needed: the current in-memory analytics reset when the process restarts. This update does not implement persistent storage or recover lost history. Avoid copying credentials into notes or screenshots.

Run `npm test`, `npm run check`, and `npm run build` under Node 24.22.1. Do not disable TLS verification or use `NODE_TLS_REJECT_UNAUTHORIZED=0` as a workaround. A runtime upgrade addresses the advisory; blindly updating all npm dependencies is a separate change.

## Render native Node service

1. Push the reviewed changes when authorized.
2. In Render Environment, set `NODE_VERSION=24.22.1` or remove an older override so the root `.node-version` applies. Environment selection takes precedence over the repository file. If Render's root directory is a subfolder, explicitly use the environment setting.
3. Select Manual Deploy > Clear build cache & deploy. A fresh native build refreshes Render's system certificate store.
4. Confirm the build logs report Node 24.22.1. For paid services with shell access, also run `node --version` in the running service. Free services do not provide shell access; do not expose a public administrative endpoint to obtain this information.
5. Verify `/health`, homepage asset loading, and an HTTPS request to a public test API with dummy data.

## Docker deployment

Build with `docker build --pull --no-cache -t apiflow-security-update .` so registry base images and package updates are fetched. Verify `docker run --rm apiflow-security-update node --version` reports v24.22.1, then deploy the updated image and check service health. Render's NODE_VERSION environment variable does not replace the runtime inside Docker images.

## Certificate rejection check

Render lists two intentionally affected test endpoints:

- `https://dv-g3b-emudhra.we-have-a-problem.com/`
- `https://dv-g3b-aaa-emudhra.we-have-a-problem.com/`

Using the deployed APIFlow live proxy with no credentials, both should fail specifically with a certificate verification error. A timeout, DNS error, rate limit, or blocked-domain response is inconclusive. Any actual upstream HTTP response, including a non-200 status, means trust remediation is incomplete. Also test an ordinary HTTPS destination to distinguish correct rejection from general connectivity failure. Keep any domain allowlist restriction in place; if the endpoints are not allowed, use a controlled service-side check instead.

## Completion boundary

Local configuration changes do not patch the already-running Render process. Completion requires a successful fresh deployment and confirmation of the deployed runtime and HTTPS behavior. Rebuilding the old commit does not apply these pins. Do not roll back to an unpatched runtime; rebuild a known-good application revision with the patched runtime if needed.
