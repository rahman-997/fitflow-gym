import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');
const origin = 'https://fitflow.example';

function scenario({ offline=false }={}) {
  const handlers = new Map();
  const cacheEntries = new Map();
  const globalLeaks = new Map();
  const fetches = [];
  let globalMatchCount = 0;
  function key(request) {
    return new URL(typeof request === 'string' ? request : request.url, origin).href;
  }
  const caches = {
    async open(cacheName) {
      if (!cacheEntries.has(cacheName)) cacheEntries.set(cacheName,new Map());
      const entries = cacheEntries.get(cacheName);
      return {
        async match(request) {return entries.get(key(request));},
        async put(request, response) {entries.set(key(request),response);},
        async keys() {return [...entries.keys()].map(url=>new Request(url));},
        async delete(request) {return entries.delete(key(request));},
      };
    },
    async match(request) {
      globalMatchCount++;
      return globalLeaks.get(key(request)) || new Response('PRIVATE: unrelated cache');
    },
  };
  vm.runInNewContext(source,{
    URL, Request, Response, caches,
    self:{location:{origin},addEventListener(name,handler){handlers.set(name,handler);},skipWaiting(){},clients:{claim(){}}},
    fetch: async request => {
      fetches.push(key(request));
      if (offline) throw Error('network offline');
      return new Response('PUBLIC: freshly fetched chunk', {headers:{'content-type':'application/javascript'}});
    },
  },{filename:'public/sw.js'});
  async function request(path,mode='cors') {
    let handled;
    handlers.get('fetch')({
      request:{url:origin+path,method:'GET',mode,headers:new Headers(),credentials:'same-origin'},
      respondWith(result){handled=Promise.resolve(result);},
    });
    assert.ok(handled, 'expected worker to handle ' + path);
    return handled;
  }
  return {caches,globalLeaks,cacheEntries,request,fetches,globalMatchCount:()=>globalMatchCount};
}

test('immutable Next chunk is loaded from network, not unrelated same-origin caches',async()=>{
  const ctx=scenario();
  ctx.globalLeaks.set(origin+'/_next/static/chunks/app.js',new Response('PRIVATE: unrelated cache'));
  const response=await ctx.request('/_next/static/chunks/app.js');
  assert.equal(await response.text(),'PUBLIC: freshly fetched chunk');
  assert.deepEqual(ctx.fetches,[origin+'/_next/static/chunks/app.js']);
  assert.equal(ctx.globalMatchCount(),0,'global caches.match could read an unrelated cache');
});

test('offline public asset must fail closed rather than leak a cached private resource',async()=>{
  const ctx=scenario({offline:true});
  const response=await ctx.request('/favicon.svg');
  assert.equal(response.type,'error');
  assert.equal(ctx.globalMatchCount(),0);
});

test('offline navigation only returns the v6 public shell, not a private cache entry',async()=>{
  const ctx=scenario({offline:true});
  const shell=await ctx.caches.open('fitflow-shell-v6');
  await shell.put(new Request(origin+'/'),new Response('PUBLIC: offline shell'));
  ctx.globalLeaks.set(origin+'/',new Response('PRIVATE: another cache'));
  const response=await ctx.request('/','navigate');
  assert.equal(await response.text(),'PUBLIC: offline shell');
  assert.equal(ctx.globalMatchCount(),0);
});

test('without a verified public shell, offline navigation fails rather than serve unrelated cache',async()=>{
  const ctx=scenario({offline:true});
  const response=await ctx.request('/','navigate');
  assert.equal(response.type,'error');
  assert.equal(ctx.globalMatchCount(),0);
});

test('immutable Next chunk reuses only current runtime cache when present',async()=>{
  const ctx=scenario();
  const runtime=await ctx.caches.open('fitflow-runtime-v6');
  await runtime.put(new Request(origin+'/_next/static/chunks/app.js'),new Response('PUBLIC: own runtime chunk'));
  const response=await ctx.request('/_next/static/chunks/app.js');
  assert.equal(await response.text(),'PUBLIC: own runtime chunk');
  assert.deepEqual(ctx.fetches,[]);
  assert.equal(ctx.globalMatchCount(),0);
});
