import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const script = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');

function fixture() {
  const handlers = new Map();
  const stored = [];
  const responses = new Map();
  const bulkCached = [];
  const installFetches = [];
  const deletedCaches = [];
  const cache = {
    async addAll(paths) { bulkCached.push(...paths); },
    async keys() { return []; },
    async put(request) { stored.push(request.url); },
    async delete() { return true; },
  };
  const ctx = {
    URL, Request, Response,
    self: {location:{origin:'https://fitflow.example'},addEventListener(name,cb){handlers.set(name,cb);},skipWaiting(){},clients:{claim(){}}},
    caches: {
      open:async()=>cache, match:async()=>null,
      keys:async()=>["fitflow-shell-v4", "fitflow-runtime-v4", "fitflow-shell-v5", "fitflow-runtime-v5", "other-owner"],
      delete:async name=>{deletedCaches.push(name);return true;},
    },
    fetch:async request=>{
      installFetches.push({url: request.url, credentials: request.credentials});
      return responses.get(request.url) ?? new Response('ok');
    },
  };
  vm.runInNewContext(script,ctx);
  async function fire(url,{method='GET',mode='cors',headers={},response}={}) {
    if(response)responses.set(url,response);
    const req={url,method,mode,headers:new Headers(headers)};
    let handled;
    handlers.get('fetch')({request:req,respondWith(p){handled=p;}});
    if(handled)await handled;
    return Boolean(handled);
  }
  async function install(responseMap = {}) {
    for (const [url, response] of Object.entries(responseMap)) responses.set(url, response);
    let pending;
    handlers.get('install')({waitUntil(promise){pending=promise;}});
    if (pending) await pending;
  }
  async function activate() {
    let pending;
    handlers.get('activate')({waitUntil(promise){pending=promise;}});
    if (pending) await pending;
  }
  return {fire,install,activate,stored,bulkCached,installFetches,deletedCaches};
}

test('only safe same-origin static assets are cached',async()=>{
  const {fire,stored}=fixture();
  assert.equal(await fire('https://fitflow.example/assets/fitflow-hero.png'),true);
  assert.deepEqual(stored,['https://fitflow.example/assets/fitflow-hero.png']);
});

test('private URLs, tokens and non-static endpoints bypass service-worker interception',async()=>{
  const {fire,stored}=fixture();
  assert.equal(await fire('https://fitflow.example/assets/fitflow-hero.png?token=sensitive'),false);
  assert.equal(await fire('https://fitflow.example/api/profile'),false);
  assert.equal(await fire('https://fitflow.example/api/private.js'),false);
  assert.equal(await fire('https://fitflow.example/account',{mode:'navigate'}),false);
  assert.equal(await fire('https://fitflow.example/assets/fitflow-hero.png',{headers:{authorization:'Bearer secret'}}),false);
  assert.equal(await fire('https://other.example/assets/fitflow-hero.png'),false);
  assert.deepEqual(stored,[]);
});

test('Cache-Control private/no-store and Set-Cookie prevent caching',async()=>{
  const {fire,stored}=fixture();
  assert.equal(await fire('https://fitflow.example/assets/fitflow-hero.png',{response:new Response('private',{headers:{'cache-control':'private'}})}),true);
  assert.equal(await fire('https://fitflow.example/assets/fitflow-programs-grid.png',{response:new Response('sensitive',{headers:{'cache-control':'no-store'}})}),true);
  assert.equal(await fire('https://fitflow.example/icon-192.png',{response:new Response('sensitive',{headers:{'set-cookie':'session=secret'}})}),true);
  assert.deepEqual(stored,[]);
});


test('install never bulk-caches private or cookie-bearing home responses',async()=>{
  const {install,stored,bulkCached}=fixture();
  await install({
    'https://fitflow.example/': new Response('private home',{headers:{'cache-control':'private'}}),
    'https://fitflow.example/favicon.svg': new Response('cookie icon',{headers:{'set-cookie':'session=secret'}}),
  });
  assert.deepEqual(bulkCached,[], 'cache.addAll would bypass cacheResponse privacy checks');
  assert.deepEqual(stored,[], 'no private or cookie-bearing install responses can be cached');
});

test('install caches public shell using credential-free fetches and response checks',async()=>{
  const {install,stored,bulkCached,installFetches}=fixture();
  await install();
  assert.deepEqual(bulkCached,[]);
  assert.deepEqual(stored,[
    'https://fitflow.example/',
    'https://fitflow.example/favicon.svg',
  ]);
  assert.equal(installFetches.length,2);
  assert.ok(installFetches.every(item=>item.credentials==='omit'), 'never send session cookies when pre-caching');
});


test('activation retires the old pre-cache generation that bypassed privacy checks',async()=>{
  const {activate,deletedCaches}=fixture();
  await activate();
  assert.deepEqual(deletedCaches,["fitflow-shell-v4","fitflow-runtime-v4"]);
});

test('Cache-Control no-cache responses must not be saved for offline reuse', async () => {
  const { fire, stored } = fixture();
  assert.equal(await fire('https://fitflow.example/manifest.webmanifest', {
    response: new Response('session-bound response', {
      headers: { 'cache-control': 'max-age=0, no-cache' },
    }),
  }),true);
  assert.deepEqual(stored, []);
});

test('navigation responses are not persisted; offline uses the pre-validated public shell', async () => {
  const { fire, stored } = fixture();
  await fire('https://fitflow.example/', {
    mode: 'navigate',
    response: new Response('potentially personalized dashboard'),
  });
  assert.deepEqual(stored, []);
});
