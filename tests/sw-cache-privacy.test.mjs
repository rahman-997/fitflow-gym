import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const script = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');

function fixture() {
  const handlers = new Map();
  const stored = [];
  const responses = new Map();
  const cache = {
    async addAll() {},
    async keys() { return []; },
    async put(request) { stored.push(request.url); },
    async delete() { return true; },
  };
  const ctx = {
    URL, Response,
    self: {location:{origin:'https://fitflow.example'},addEventListener(name,cb){handlers.set(name,cb);},skipWaiting(){},clients:{claim(){}}},
    caches: {open:async()=>cache,match:async()=>null,keys:async()=>[]},
    fetch:async request=>responses.get(request.url) ?? new Response('ok'),
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
  return {fire,stored};
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
