#!/usr/bin/env node
/**
 * Offline metadata regression guard. This is NOT a vulnerability scanner.
 * Run: node --test tests/dependency-lock-integrity.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));
const root = lock.packages?.[''];

test('lockfile matches the manifest including identity and direct dependencies', () => {
  assert.ok(root, 'lockfile root package must be present');
  assert.equal(lock.name, pkg.name);
  assert.equal(root.name, pkg.name);
  assert.equal(lock.version, pkg.version);
  assert.equal(root.version, pkg.version);
  assert.deepEqual(root.dependencies, pkg.dependencies);
  assert.deepEqual(root.devDependencies, pkg.devDependencies);
});

test('Next.js November 2026 security release is represented in the lockfile', () => {
  assert.equal(pkg.dependencies.next, '16.4.5');
  assert.equal(lock.packages['node_modules/next']?.version, pkg.dependencies.next);
  assert.equal(pkg.devDependencies['eslint-config-next'], pkg.dependencies.next);
  assert.equal(lock.packages['node_modules/eslint-config-next']?.version, pkg.dependencies.next);
  assert.match(lock.packages['node_modules/next']?.integrity ?? '', /^sha512-/);
});

test('React and matching types stay in sync with the resolved lockfile', () => {
  for (const name of ['react', 'react-dom', '@types/react', '@types/react-dom']) {
    const declared = pkg.dependencies[name] ?? pkg.devDependencies[name];
    assert.equal(lock.packages['node_modules/' + name]?.version, declared, name);
  }
});

test('preserve existing targeted minimatch override where configured', () => {
  const expected = pkg.overrides?.['@typescript-eslint/typescript-estree']?.minimatch;
  if (!expected) return;
  const path = 'node_modules/@typescript-eslint/typescript-estree/node_modules/minimatch';
  assert.equal(lock.packages[path]?.version, expected);
  assert.match(lock.packages[path]?.integrity ?? '', /^sha512-/);
});

test('PWA privacy regression is preserved in both local tests and CI', () => {
  const requiredSwTests = [
    'tests/sw-cache-boundary.test.mjs',
    'tests/sw-cache-namespace.test.mjs',
    'tests/sw-cache-privacy.test.mjs',
  ];
  assert.equal(pkg.scripts['test:sw'], 'node --test ' + requiredSwTests.join(' '),
    'CI must execute all offline cache privacy and namespace regression files');
  assert.match(pkg.scripts.test, /npm run test:sw/);
  const workflow = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
  assert.match(workflow, /Service Worker cache privacy regressions[\s\S]*?npm run test:sw/);
  assert.match(
    readFileSync(new URL('./sw-cache-privacy.test.mjs', import.meta.url), 'utf8'),
    /private URLs, tokens and non-static endpoints bypass service-worker interception/
  );
});

// Separate npm audit remains mandatory. This guard does not waive known
// picomatch ReDoS advisories or establish production security.

test('CI dependency audit must fail closed on findings, outage, or timeout', () => {
  const workflow = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
  const step = workflow.match(/^\s+- name: Dependency audit \(blocking\)\s*\n\s+run: ([^\n]+)/m);
  assert.ok(step, 'A required dependency audit step must exist');
  assert.equal(step[1].trim(), 'timeout 120s npm run audit');
  assert.doesNotMatch(workflow, /continue-on-error\s*:\s*true/);
  assert.doesNotMatch(workflow, /CI will not fail on this external outage/);
});

test('CI executes the dependency lockfile integrity regressions', () => {
  const workflow = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
  assert.match(workflow, /- name: Dependency lock integrity\s*\n\s+run: npm run test:dependency-lock/);
});


test('static export gate must validate scoped offline caches and reject origin-wide reads', () => {
  const verifier = readFileSync(new URL('../scripts/verify-static-export.mjs', import.meta.url), 'utf8');
  const worker = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');

  assert.equal((worker.match(/shell\.match\("\/"\)/g) || []).length, 1,
    'navigation may fall back to the known public shell exactly once');
  assert.match(worker, /runtime\.match\(request\)/);
  assert.doesNotMatch(worker, /\bcaches\.match\(/,
    'workers may not read another app or old-generation cache');

  assert.match(verifier, /sw\.includes\('shell\.match\("\/"\)'\)/,
    'the static export verifier must recognize the new scoped shell lookup');
  assert.match(verifier, /sw\.includes\('runtime\.match\(request\)'\)/,
    'the static export verifier must require scoped static/runtime lookup');
  assert.match(verifier, /sw\.includes\('caches\.match\('\)/,
    'the verifier must reject origin-wide cache reads');
  assert.doesNotMatch(verifier, /homepageFallbacks\s*=\s*sw\.match/,
    'the historical global cache assertion must not return');
});


function verifySyntheticExport(workerOverride) {
  // Run the actual production verifier against a safe, in-memory build fixture.
  // No Next installation, network, deployment or filesystem writes are needed.
  const verifierSource = readFileSync(new URL('../scripts/verify-static-export.mjs', import.meta.url), 'utf8');
  const worker = workerOverride ?? readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');
  const files = {
    'out/index.html': '<html><link rel="canonical" href="https://fitflow-gym.onrender.com/"><meta content="https://fitflow-gym.onrender.com/og.png"><link rel="manifest" href="/manifest.webmanifest">FitFlow</html>',
    'out/sw.js': worker,
    'out/manifest.webmanifest': JSON.stringify({
      name: 'FitFlow', start_url: '/', display: 'standalone', icons: [{src:'/icon-192.png'}],
    }),
    'netlify.toml': readFileSync(new URL('../netlify.toml', import.meta.url), 'utf8'),
    'app/page.tsx': readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8'),
    'app/layout.tsx': readFileSync(new URL('../app/layout.tsx', import.meta.url), 'utf8'),
  };
  const filesPresent = new Set([...Object.keys(files), 'out/favicon.svg', 'out/_next', 'out/icon-192.png']);
  const executable = verifierSource.replace(
    /^import \{ existsSync, readFileSync, statSync \} from "node:fs";\r?\n/, ''
  );
  assert.notEqual(executable, verifierSource, 'fixture must execute the genuine export verifier body');
  return vm.runInNewContext(executable, {
    existsSync(path) { return filesPresent.has(path); },
    statSync(path) {
      assert.equal(path, 'out/_next');
      return {isDirectory: () => true};
    },
    readFileSync(path) {
      assert.ok(Object.hasOwn(files, path), 'unexpected verifier fixture read: ' + path);
      return files[path];
    },
    console: {log() {}},
  }, {filename:'verify-static-export.mjs', timeout:3000});
}

test('static-export verifier accepts the privacy-safe named-cache worker', () => {
  assert.doesNotThrow(() => verifySyntheticExport());
});

test('static-export verifier fails closed on a global app-shell fallback', () => {
  const worker = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');
  assert.match(worker, /shell\.match\("\/"\)/);
  assert.throws(
    () => verifySyntheticExport(worker.replace('shell.match("/")', 'caches.match("/")')),
    /named FitFlow shell cache|origin-wide/i
  );
});

test('static-export verifier fails closed on cross-cache runtime lookups', () => {
  const worker = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');
  assert.match(worker, /runtime\.match\(request\)/);
  assert.throws(
    () => verifySyntheticExport(worker.replace('runtime.match(request)', 'caches.match(request)')),
    /named runtime cache|origin-wide/i
  );
});
