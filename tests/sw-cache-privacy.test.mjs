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
  const cache = {
    async addAll(paths) { bulkCached.push(...paths); },
    async keys() { return []; },
    async put(request) { stored.push(request.url); },
    async delete() { return true; },
  };
  const ctx = {
    URL, Request, Response,
    self: {location:{origin:'https://fitflow.example'},addEventListener(name,cb){handlers.set(name,cb);},skipWaiting(){},clients:{claim(){}}},
    caches: {open:async()=>cache,match:async()=>null,keys:async()=>[]},
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
  return {fire,install,stored,bulkCached,installFetches};
}

test('only safe same-origin static assets are cached',async()=>{
  const {fire,stored}=fixture();
  assert.equal(await fire('https://fitflow.example/asset.css'),true);
  assert.deepEqual(stored,['https://fitflow.example/asset.css']);
});

test('private URLs, tokens and non-static endpoints bypass service-worker interception',async()=>{
  const {fire,stored}=fixture();
  assert.equal(await fire('https://fitflow.example/asset.css?token=sensitive'),false);
  assert.equal(await fire('https://fitflow.example/api/profile'),false);
  assert.equal(await fire('https://fitflow.example/api/private.js'),false);
  assert.equal(await fire('https://fitflow.example/account',{mode:'navigate'}),false);
  assert.equal(await fire('https://fitflow.example/asset.js',{headers:{authorization:'Bearer secret'}}),false);
  assert.equal(await fire('https://other.example/asset.css'),false);
  assert.deepEqual(stored,[]);
});

test('Cache-Control private/no-store and Set-Cookie prevent caching',async()=>{
  const {fire,stored}=fixture();
  await fire('https://fitflow.example/private.css',{response:new Response('private',{headers:{'cache-control':'private'}})});
  await fire('https://fitflow.example/no-store.js',{response:new Response('sensitive',{headers:{'cache-control':'no-store'}})});
  await fire('https://fitflow.example/session.svg',{response:new Response('sensitive',{headers:{'set-cookie':'session=secret'}})});
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
