import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export function renderServiceWorker(template, manifest, shellContent) {
  const chunks = Object.values(manifest).flatMap(entry => [entry.file, ...(entry.css || []), ...(entry.assets || [])]).filter(Boolean).map(file => '/' + file);
  const revision = createHash('sha256').update(template).update(JSON.stringify(manifest)).update(shellContent).digest('hex').slice(0, 20);
  return template.replace('__BUILD_ID__', revision).replace('/* __PRECACHE__ */ []', JSON.stringify([...new Set(chunks)]));
}

export function serviceWorkerBuild() {
  let config;
  return {
    name: 'apiflow-versioned-service-worker',
    apply: 'build',
    configResolved(value) { config = value; },
    closeBundle() {
      const output = path.resolve(config.root, config.build.outDir);
      const template = readFileSync(path.join(config.publicDir, 'sw.js'), 'utf8');
      const manifest = JSON.parse(readFileSync(path.join(output, 'asset-manifest.json'), 'utf8'));
      const shell = ['index.html', 'manifest.json', 'favicon.svg'].map(file => readFileSync(path.join(output, file), 'utf8')).join('\n');
      writeFileSync(path.join(output, 'sw.js'), renderServiceWorker(template, manifest, shell));
    },
  };
}
