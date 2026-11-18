import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const worker = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');
const BASE = 'https://fitflow.example';

function createWorker() {
  const listeners = new Map();
  const stored = [];
  const responses = new Map();
  const cache = {
    async put(request) { stored.push(request.url); },
    async keys() { return []; },
    async delete() { return true; },
  };
  vm.runInNewContext(worker, {
    URL, Request, Response,
    self: {
      location: { origin: BASE },
      addEventListener(name, listener) { listeners.set(name, listener); },
      skipWaiting() {},
      clients: { claim() {} },
    },
    caches: {
      async open() { return cache; },
      async match() { return undefined; },
      async keys() { return []; },
      async delete() { return true; },
    },
    async fetch(request) {
      return responses.get(request.url) || new Response('public asset');
    },
  }, { filename: 'public/sw.js' });

  async function fetchAsset(path, response = new Response('public asset')) {
    const url = BASE + path;
    responses.set(url, response);
    let result;
    listeners.get('fetch')({
      request: { url, method: 'GET', mode: 'cors', headers: new Headers() },
      respondWith(promise) { result = promise; },
    });
    if (result) await result;
    return Boolean(result);
  }
  return { fetchAsset, stored };
}

test('public build assets remain cacheable', async () => {
  const browser = createWorker();
  assert.equal(await browser.fetchAsset('/assets/fitflow-hero.png'), true);
  assert.deepEqual(browser.stored, [BASE + '/assets/fitflow-hero.png']);
});

test('Next.js immutable chunk assets remain cacheable', async () => {
  const browser = createWorker();
  assert.equal(await browser.fetchAsset('/_next/static/chunks/client-a1b2.js'), true);
  assert.deepEqual(browser.stored, [BASE + '/_next/static/chunks/client-a1b2.js']);
});

test('unknown .svg/.css/.png paths are not intercepted for offline storage', async () => {
  const browser = createWorker();
  for (const path of ['/profile/avatar.svg', '/reports/confidential.css', '/account/portrait.png']) {
    assert.equal(await browser.fetchAsset(path), false, `${path} should bypass SW`);
  }
  assert.deepEqual(browser.stored, []);
});

test('Vary: Cookie prevents caching even a known public asset path', async () => {
  const browser = createWorker();
  await browser.fetchAsset('/assets/fitflow-hero.png', new Response('session specific', { headers: { vary: 'Accept-Encoding, Cookie' } }));
  assert.deepEqual(browser.stored, []);
});

test('Vary: Authorization and Vary: * prevent storage', async () => {
  const browser = createWorker();
  await browser.fetchAsset('/assets/fitflow-hero.png', new Response('role specific', { headers: { vary: 'authorization' } }));
  await browser.fetchAsset('/assets/fitflow-programs-grid.png', new Response('not reusable', { headers: { vary: '*' } }));
  assert.deepEqual(browser.stored, []);
});
