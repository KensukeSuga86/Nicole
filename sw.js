const CACHE_VERSION="nicole-pwa-v1.8.0";
const APP_CACHE=`${CACHE_VERSION}-app`;
const DATA_CACHE=`${CACHE_VERSION}-data`;

const APP_SHELL=[
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./favicon.ico",
  "./icon-32.png",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(APP_CACHE).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{
    const names=await caches.keys();
    await Promise.all(names.filter(n=>n.startsWith("nicole-pwa-")&&!n.startsWith(CACHE_VERSION)).map(n=>caches.delete(n)));
    await self.clients.claim();
  })());
});

function isDataRequest(url){
  if(url.hostname==="api.open-meteo.com")return true;
  if(url.hostname==="astro-nicole.hideld12.workers.dev")return true;
  if(url.hostname==="kensukesuga86.github.io" && url.pathname.startsWith("/Hoshinotori/"))return true;
  if(url.hostname==="raw.githubusercontent.com")return true;
  return false;
}

async function withCacheMetadata(response){
  if(!response || !response.ok || response.type==="opaque")return response;
  const headers=new Headers(response.headers);
  headers.set("X-Nicole-Cached-At",new Date().toISOString());
  const body=await response.clone().blob();
  return new Response(body,{status:response.status,statusText:response.statusText,headers});
}

async function markOfflineCache(response){
  if(!response || response.type==="opaque")return response;
  const headers=new Headers(response.headers);
  headers.set("X-Nicole-Offline-Cache","1");
  const body=await response.clone().blob();
  return new Response(body,{status:response.status,statusText:response.statusText,headers});
}

async function networkFirstData(request){
  const cache=await caches.open(DATA_CACHE);
  const url=new URL(request.url);
  const timeoutMs=url.hostname==="api.open-meteo.com"?18000:10000;
  try{
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),timeoutMs);
    let fresh;
    try{
      fresh=await fetch(request,{signal:controller.signal});
    }finally{
      clearTimeout(timer);
    }
    if(fresh && fresh.ok){
      const stored=await withCacheMetadata(fresh);
      if(stored)await cache.put(request,stored.clone());
      return fresh;
    }
    const cached=await cache.match(request);
    if(cached)return markOfflineCache(cached);
    return fresh;
  }catch(error){
    const cached=await cache.match(request);
    if(cached)return markOfflineCache(cached);
    throw error;
  }
}

async function networkFirstNavigation(request){
  const cache=await caches.open(APP_CACHE);
  try{
    const fresh=await fetch(request);
    if(fresh && fresh.ok)await cache.put("./index.html",fresh.clone());
    return fresh;
  }catch(error){
    return (await cache.match(request)) || (await cache.match("./index.html")) || (await cache.match("./"));
  }
}

async function staleWhileRevalidate(request){
  const cache=await caches.open(APP_CACHE);
  const cached=await cache.match(request);
  const network=fetch(request).then(response=>{
    if(response && response.ok)cache.put(request,response.clone());
    return response;
  }).catch(()=>null);
  return cached || (await network) || Response.error();
}

self.addEventListener("fetch",event=>{
  const request=event.request;
  if(request.method!=="GET")return;
  const url=new URL(request.url);

  if(request.mode==="navigate"){
    event.respondWith(networkFirstNavigation(request));
    return;
  }
  if(isDataRequest(url)){
    event.respondWith(networkFirstData(request));
    return;
  }
  if(url.origin===self.location.origin){
    event.respondWith(staleWhileRevalidate(request));
  }
});
