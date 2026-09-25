const CACHE_VERSION="nicole-pwa-v1.10.4";
const APP_CACHE=`${CACHE_VERSION}-app`;
const DATA_CACHE=`${CACHE_VERSION}-data`;

const HOUR=60*60*1000;
const DAY=24*HOUR;

// Nicole Cache Manager
// 動的データは種類ごとに寿命と件数上限を設ける。
// 星図・追尾ロジックには関与しない。
const CACHE_POLICIES={
  weather:{maxAgeMs:18*HOUR,maxEntries:64},
  comet:{maxAgeMs:7*DAY,maxEntries:160},
  meteors:{maxAgeMs:45*DAY,maxEntries:16},
  hoshinotori:{maxAgeMs:365*DAY,maxEntries:240},
  astronomyStatic:{maxAgeMs:365*DAY,maxEntries:32},
  other:{maxAgeMs:7*DAY,maxEntries:48}
};
const DATA_CACHE_MAX_ENTRIES=320;
const CACHE_MAINTENANCE_INTERVAL_MS=10*60*1000;
let lastCacheMaintenance=0;
let cacheMaintenancePromise=null;

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
    await Promise.all(
      names
        .filter(name=>name.startsWith("nicole-pwa-")&&name!==APP_CACHE&&name!==DATA_CACHE)
        .map(name=>caches.delete(name))
    );
    await maintainDataCache(true);
    await self.clients.claim();
  })());
});

function getDataPolicyKey(url){
  if(url.hostname==="api.open-meteo.com")return "weather";

  if(url.hostname==="astro-nicole.hideld12.workers.dev"){
    if(url.pathname.includes("/meteors"))return "meteors";
    if(url.pathname.includes("/night-comets")||url.pathname.includes("/comet-track"))return "comet";
    return "other";
  }

  if(url.hostname==="kensukesuga86.github.io"&&url.pathname.startsWith("/Hoshinotori/")){
    return "hoshinotori";
  }

  if(url.hostname==="raw.githubusercontent.com")return "astronomyStatic";
  return "other";
}

function isDataRequest(url){
  if(url.hostname==="api.open-meteo.com")return true;
  if(url.hostname==="astro-nicole.hideld12.workers.dev")return true;
  if(url.hostname==="kensukesuga86.github.io"&&url.pathname.startsWith("/Hoshinotori/"))return true;
  if(url.hostname==="raw.githubusercontent.com")return true;
  return false;
}

function cachedAtFromResponse(response){
  if(!response)return 0;
  const value=response.headers.get("X-Nicole-Cached-At");
  const timestamp=value?Date.parse(value):NaN;
  return Number.isFinite(timestamp)?timestamp:0;
}

async function withCacheMetadata(response){
  if(!response||!response.ok||response.type==="opaque")return null;
  const headers=new Headers(response.headers);
  headers.set("X-Nicole-Cached-At",new Date().toISOString());
  const body=await response.clone().blob();
  return new Response(body,{status:response.status,statusText:response.statusText,headers});
}

async function markOfflineCache(response){
  if(!response||response.type==="opaque")return response;
  const headers=new Headers(response.headers);
  headers.set("X-Nicole-Offline-Cache","1");
  const body=await response.clone().blob();
  return new Response(body,{status:response.status,statusText:response.statusText,headers});
}

async function maintainDataCache(force=false){
  const now=Date.now();
  if(!force&&now-lastCacheMaintenance<CACHE_MAINTENANCE_INTERVAL_MS)return;
  if(cacheMaintenancePromise)return cacheMaintenancePromise;

  cacheMaintenancePromise=(async()=>{
    const cache=await caches.open(DATA_CACHE);
    const requests=await cache.keys();
    if(!requests.length){
      lastCacheMaintenance=Date.now();
      return;
    }

    const records=(await Promise.all(requests.map(async request=>{
      const response=await cache.match(request);
      const url=new URL(request.url);
      return {
        request,
        key:getDataPolicyKey(url),
        cachedAt:cachedAtFromResponse(response)
      };
    }))).filter(Boolean);

    const deleteUrls=new Set();
    const grouped=new Map();

    for(const record of records){
      const policy=CACHE_POLICIES[record.key]||CACHE_POLICIES.other;
      if(!record.cachedAt||now-record.cachedAt>policy.maxAgeMs){
        deleteUrls.add(record.request.url);
        continue;
      }
      if(!grouped.has(record.key))grouped.set(record.key,[]);
      grouped.get(record.key).push(record);
    }

    // 種類ごとの件数上限。古いものから削除する。
    for(const [key,list] of grouped){
      const policy=CACHE_POLICIES[key]||CACHE_POLICIES.other;
      list.sort((a,b)=>b.cachedAt-a.cachedAt);
      for(const record of list.slice(policy.maxEntries))deleteUrls.add(record.request.url);
    }

    // 全データキャッシュにも最終上限を設ける。
    const survivors=records
      .filter(record=>!deleteUrls.has(record.request.url))
      .sort((a,b)=>b.cachedAt-a.cachedAt);
    for(const record of survivors.slice(DATA_CACHE_MAX_ENTRIES)){
      deleteUrls.add(record.request.url);
    }

    if(deleteUrls.size){
      await Promise.all(
        records
          .filter(record=>deleteUrls.has(record.request.url))
          .map(record=>cache.delete(record.request))
      );
    }

    lastCacheMaintenance=Date.now();
  })().finally(()=>{
    cacheMaintenancePromise=null;
  });

  return cacheMaintenancePromise;
}

function scheduleCacheMaintenance(event){
  const maintenance=maintainDataCache(false).catch(()=>{});
  if(event&&typeof event.waitUntil==="function")event.waitUntil(maintenance);
}

async function getCachedData(cache,request){
  const cached=await cache.match(request);
  if(!cached)return null;

  // メタデータの無い古い形式のキャッシュは利用しない。
  const cachedAt=cachedAtFromResponse(cached);
  if(!cachedAt)return null;

  const policy=CACHE_POLICIES[getDataPolicyKey(new URL(request.url))]||CACHE_POLICIES.other;
  if(Date.now()-cachedAt>policy.maxAgeMs){
    await cache.delete(request);
    return null;
  }
  return cached;
}

async function networkFirstData(request,event){
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

    if(fresh&&fresh.ok){
      const stored=await withCacheMetadata(fresh);
      if(stored)await cache.put(request,stored.clone());
      scheduleCacheMaintenance(event);
      return fresh;
    }

    const cached=await getCachedData(cache,request);
    if(cached)return markOfflineCache(cached);
    return fresh;
  }catch(error){
    const cached=await getCachedData(cache,request);
    if(cached)return markOfflineCache(cached);
    throw error;
  }
}

async function networkFirstNavigation(request){
  const cache=await caches.open(APP_CACHE);
  try{
    const fresh=await fetch(request);
    if(fresh&&fresh.ok)await cache.put("./index.html",fresh.clone());
    return fresh;
  }catch(error){
    return (await cache.match(request))||(await cache.match("./index.html"))||(await cache.match("./"));
  }
}

async function staleWhileRevalidate(request){
  const cache=await caches.open(APP_CACHE);
  const cached=await cache.match(request);
  const network=fetch(request).then(response=>{
    if(response&&response.ok)cache.put(request,response.clone());
    return response;
  }).catch(()=>null);
  return cached||(await network)||Response.error();
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
    event.respondWith(networkFirstData(request,event));
    return;
  }
  if(url.origin===self.location.origin){
    event.respondWith(staleWhileRevalidate(request));
  }
});
