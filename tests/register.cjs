// Test-only TypeScript loader: use the project's compiler without generating files.
const Module = require('node:module');
const path = require('node:path');
const fs = require('node:fs');
const ts = require('../frontend/node_modules/typescript');
const resolve = Module._resolveFilename;
Module._resolveFilename = function (name, parent, ...args) {
  if (name.startsWith('@/')) name = path.resolve(__dirname, '../frontend/src', name.slice(2));
  return resolve.call(this, name, parent, ...args);
};
Module._extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  });
  module._compile(outputText, filename);
};
