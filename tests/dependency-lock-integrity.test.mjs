#!/usr/bin/env node
/**
 * Offline metadata regression guard. This is NOT a vulnerability scanner.
 * Run: node --test tests/dependency-lock-integrity.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

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

// Separate npm audit remains mandatory. This guard does not waive known
// picomatch ReDoS advisories or establish production security.
