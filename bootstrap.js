const EXPECTED_DB_VERSION="0.4.0";
// Database updates inside the app: any 0.4.x with schema 5 is compatible (content-only
// releases are patch versions; a structural change becomes 0.5.0 and needs an app update).
const COMPATIBLE_DB_SERIES="0.4";
const COMPATIBLE_SCHEMA_VERSION=5;
const REMOTE_ROOT="https://kensukesuga86.github.io/Nicole-Astronomy-Database/";
const LOCAL_BASE="./database/";
const DATA_NAMES=["constellations","stars","planets","deep-sky","asterisms","catalog","external-sources","solar-system","constellation-standard","constellation-line-stars"];
const STORE_DB="nicole-common-db",STORE_NAME="updates",STORE_KEY="current";

async function fetchJson(base,path){const r=await fetch(base+path,{cache:"no-store"});if(!r.ok)throw new Error(`${path} HTTP ${r.status}`);return r.json()}
function versionParts(v){const m=/^(\d+)\.(\d+)\.(\d+)$/.exec(String(v||""));return m?m.slice(1).map(Number):null}
function compareVersions(a,b){const x=versionParts(a),y=versionParts(b);if(!x||!y)return NaN;for(let i=0;i<3;i++)if(x[i]!==y[i])return x[i]-y[i];return 0}
function compatibleVersion(v){const p=versionParts(v);return!!p&&`${p[0]}.${p[1]}`===COMPATIBLE_DB_SERIES}
function validateDb(db){if(!Array.isArray(db.constellations)||db.constellations.length!==88)throw new Error("88星座DBではありません");if(!Array.isArray(db.deep_sky)||db.deep_sky.filter(x=>Number(x.messier_number)>=1&&Number(x.messier_number)<=110).length!==110)throw new Error("M1-M110が揃っていません");return db}
function assembleDb(manifest,values){const db={manifest};DATA_NAMES.forEach((n,i)=>db[n.replaceAll("-","_")]=values[i]);return validateDb(db)}
async function loadBundledDb(){const manifest=await fetchJson(LOCAL_BASE,"manifest.json");if(manifest.database_version!==EXPECTED_DB_VERSION)throw new Error(`DB version mismatch: ${manifest.database_version}`);const values=await Promise.all(DATA_NAMES.map(n=>fetchJson(LOCAL_BASE,`data/${n}.json`)));return assembleDb(manifest,values)}

// ---- Stored update (IndexedDB) ----
function openStore(){return new Promise((resolve,reject)=>{if(!("indexedDB" in window))return reject(new Error("IndexedDB unavailable"));const req=indexedDB.open(STORE_DB,1);req.onupgradeneeded=()=>req.result.createObjectStore(STORE_NAME);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
async function storeOp(mode,fn){const idb=await openStore();try{return await new Promise((resolve,reject)=>{const tx=idb.transaction(STORE_NAME,mode),req=fn(tx.objectStore(STORE_NAME));tx.oncomplete=()=>resolve(req?.result);tx.onerror=tx.onabort=()=>reject(tx.error)})}finally{idb.close()}}
const readStoredUpdate=()=>storeOp("readonly",st=>st.get(STORE_KEY));
const writeStoredUpdate=rec=>storeOp("readwrite",st=>st.put(rec,STORE_KEY));
const clearStoredUpdate=()=>storeOp("readwrite",st=>st.delete(STORE_KEY));
// A stored update is used only while it is compatible and newer than the bundled database
// (after an app release that bundles a newer version, the bundled one wins).
function usableStoredUpdate(rec){return!!rec&&compatibleVersion(rec.version)&&rec.schema_version===COMPATIBLE_SCHEMA_VERSION&&compareVersions(rec.version,EXPECTED_DB_VERSION)>0&&rec.manifest&&rec.data}
async function loadStoredDb(){const rec=await readStoredUpdate();if(!usableStoredUpdate(rec))return null;return{db:assembleDb(rec.manifest,DATA_NAMES.map(n=>rec.data[n])),fetchedAt:rec.fetchedAt}}

// ---- Update check / download (only on the operator's request) ----
async function sha256Hex(buf){const h=await crypto.subtle.digest("SHA-256",buf);return[...new Uint8Array(h)].map(b=>b.toString(16).padStart(2,"0")).join("")}
async function checkForDbUpdate(){
 const latest=await fetchJson(REMOTE_ROOT,"latest.json"),current=window.NicoleAstronomyDatabaseMeta?.version;
 if(!versionParts(latest.version))throw new Error("latest.json の版が読めません");
 const newer=!versionParts(current)||compareVersions(latest.version,current)>0;
 return{latest,current,newer,compatible:compatibleVersion(latest.version)}}
async function downloadDbUpdate(latest,onProgress){
 const base=REMOTE_ROOT+String(latest.path||`versions/${latest.version}/`).replace(/^\/+/,"");
 const manifest=await fetchJson(base,"manifest.json");
 if(manifest.database_version!==latest.version)throw new Error(`manifest の版が一致しません（${manifest.database_version}）`);
 if(manifest.schema_version!==COMPATIBLE_SCHEMA_VERSION)throw new Error(`データ構造の版が対応外です（schema ${manifest.schema_version}）`);
 const sums=manifest.checksums_sha256||{},values=[];
 for(const[i,n]of DATA_NAMES.entries()){
  const path=`data/${n}.json`,expected=String(sums[path]||"").toLowerCase();
  if(!expected)throw new Error(`${path} のチェックサムが manifest にありません`);
  const r=await fetch(base+path,{cache:"no-store"});if(!r.ok)throw new Error(`${path} HTTP ${r.status}`);
  const buf=await r.arrayBuffer();if(await sha256Hex(buf)!==expected)throw new Error(`${path} のチェックサムが一致しません`);
  values.push(JSON.parse(new TextDecoder("utf-8").decode(buf)));onProgress?.(i+1,DATA_NAMES.length)}
 assembleDb(manifest,values);
 const data=Object.fromEntries(DATA_NAMES.map((n,i)=>[n,values[i]]));
 const rec={version:manifest.database_version,schema_version:manifest.schema_version,fetchedAt:new Date().toISOString(),manifest,data};
 await writeStoredUpdate(rec);return rec}

function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function storyHtml(e){if(!e)return"";if(e.raw_html)return e.raw_html;const parts=[["概要",e.overview],["観測のポイント",e.observing],["天文学的な見どころ",e.science],["歴史・名前",e.history]].filter(x=>x[1]);return parts.map(([h,t])=>`<div class="story-topic"><h4>${esc(h)}</h4><p>${esc(t)}</p></div>`).join("")}
function pendingStory(o){const cat=o.catalog_metadata||{},bits=[];if(o.constellation_id)bits.push(`星座：${esc(o.constellation_id)}`);if(Number.isFinite(Number(o.magnitude_v)))bits.push(`等級：約${esc(o.magnitude_v)}`);if(o.size_text)bits.push(`見かけの大きさ：${esc(o.size_text)}`);if(cat.source_type_label_ja)bits.push(`種類：${esc(cat.source_type_label_ja)}`);return `<div class="story-topic"><h4>カタログ情報</h4><p>${bits.join(" / ")||"基本カタログ情報を収録しています。"}</p></div><div class="story-topic"><h4>解説</h4><p>情報準備中</p></div>`}
function legacy(db){
 const allMonths=[1,2,3,4,5,6,7,8,9,10,11,12];
 const CONSTELLATIONS=db.constellations.map(c=>({id:c.id,name:c.name?.ja||c.id,en:c.name?.en||"",abbr:c.name?.abbr||c.id,season:c.season||"",months:c.visible_months_legacy||allMonths,stars:c.main_stars_text||"",story:c.legacy_story||"",science:c.explanation?.science||"",myth:c.explanation?.myth||""}));
 const CONSTELLATION_TEXT=Object.fromEntries(db.constellations.map(c=>[c.id,{science:c.explanation?.science||"",myth:c.explanation?.myth||""}]));
 const CONST_COORD=Object.fromEntries(db.constellations.map(c=>[c.id,[Number(c.representative_position?.ra_deg),Number(c.representative_position?.dec_deg)]]));
 const STARS_DB=db.stars.filter(x=>x.roles?.includes("curated_object")).map(o=>({id:o.id,name:o.name?.ja_full||o.name?.ja||o.id,type:"star",icon:o.icon||"⭐",cat:o.catalog_category||"恒星",ra:Number(o.position?.ra_deg),dec:Number(o.position?.dec_deg),mag:o.magnitude_v==null?99:Number(o.magnitude_v),dist:o.distance_text||"",size:o.size_text||"",scope:o.recommended_magnification||"",highlight:o.highlight||"",months:o.visible_months_legacy?.length?o.visible_months_legacy:allMonths,story:storyHtml(o.explanation)||pendingStory(o),bv:o.photometry?.bv??null,spectral_type:o.photometry?.spectral_type??null,display_color_hex:o.photometry?.display_color_hex??null}));
 const planets=db.planets.map(o=>({id:o.id,name:o.name?.ja||o.id,type:"planet",icon:o.icon||"●",cat:o.catalog_category||"惑星",planet:o.position?.planet_key||o.id,mag:o.magnitude_v==null?99:Number(o.magnitude_v),dist:o.distance_text||"",size:o.size_text||"",scope:o.recommended_magnification||"",highlight:o.highlight||"",months:o.visible_months_legacy||[],story:storyHtml(o.explanation)||pendingStory(o),physical_diameter_km:o.physical_diameter_km??null}));
 const deep=db.deep_sky.map(o=>({id:o.id,name:o.name?.ja||o.id,type:o.type,icon:o.icon||"✦",cat:o.catalog_category||"",ra:Number(o.position?.ra_deg),dec:Number(o.position?.dec_deg),mag:o.magnitude_v==null?99:Number(o.magnitude_v),dist:o.distance_text||"",size:o.size_text||"",scope:o.recommended_magnification||"",highlight:o.highlight||"",months:o.visible_months_legacy?.length?o.visible_months_legacy:allMonths,story:storyHtml(o.explanation)||pendingStory(o),constellation:o.constellation_id||null,aliases:o.aliases||[],messier_number:o.messier_number||null,catalog_metadata:o.catalog_metadata||null,angular_size:o.angular_size||null}));
 const SKY_EXTRA_STARS=db.stars.filter(x=>x.source?.dataset==="SKY_EXTRA_STARS").map(o=>({id:o.id,name:o.name?.ja||o.id,ra:Number(o.position?.ra_deg),dec:Number(o.position?.dec_deg),mag:o.magnitude_v==null?6:Number(o.magnitude_v),bv:o.photometry?.bv??null,display_color_hex:o.photometry?.display_color_hex??null}));
 const allStars=Object.fromEntries(db.stars.map(x=>[x.id,x])),SKY_ASTERISM_STARS={};for(const a of db.asterisms)for(const id of a.star_ids||[]){const o=allStars[id];if(o)SKY_ASTERISM_STARS[id]={name:o.name?.ja||id,ra:Number(o.position?.ra_deg),dec:Number(o.position?.dec_deg)}}
 const SKY_ASTERISMS=db.asterisms.map(a=>({name:a.name?.ja||a.id,stars:a.star_ids||[],lines:(a.lines||[]).map(x=>[x.from,x.to])}));
 const SKY_STAR_CONSTELLATION_MAP=Object.fromEntries(db.stars.filter(x=>x.constellation_id).map(x=>[x.id,x.constellation_id]));
 for(const c of db.constellation_standard||[])for(const id of c.line?.star_ids||[])if(!SKY_STAR_CONSTELLATION_MAP[id])SKY_STAR_CONSTELLATION_MAP[id]=c.id;
 const SKY_CONSTELLATION_STANDARD=(db.constellation_standard||[]).map(c=>({name:c.name?.ja||c.id,abbr:c.name?.abbr||c.id,lines:(c.line?.segments||[]).map(x=>[x.from,x.to])}));
 const SKY_STANDARD_LINE_STARS=Object.fromEntries((db.constellation_line_stars||[]).filter(x=>x.ra_deg!=null&&x.dec_deg!=null&&Number.isFinite(Number(x.ra_deg))&&Number.isFinite(Number(x.dec_deg))).map(x=>[x.id,{id:x.id,hip:x.hip??null,name:x.name||null,ra:Number(x.ra_deg),dec:Number(x.dec_deg),mag:x.magnitude_v==null?6:Number(x.magnitude_v)}]));
 const SKY_STANDARD_LINE_STAR_REFERENCES=(db.constellation_line_stars||[]).filter(x=>x.coordinate_status==="upstream_reference");
 return{CONSTELLATIONS,CONSTELLATION_TEXT,CONST_COORD,STARS_DB,DSO_DB:[...planets,...deep],SKY_EXTRA_STARS,SKY_ASTERISM_STARS,SKY_ASTERISMS,SKY_STAR_CONSTELLATION_MAP,SKY_CONSTELLATION_STANDARD,SKY_STANDARD_LINE_STARS,SKY_STANDARD_LINE_STAR_REFERENCES};
}
function loadClassic(src){return new Promise((resolve,reject)=>{const el=document.createElement("script");el.src=src;el.async=false;el.onload=resolve;el.onerror=()=>reject(new Error(`script load failed: ${src}`));document.body.appendChild(el)})}

// ---- 「天文データベース」 panel ----
function fmtDate(iso){const d=new Date(iso);return Number.isFinite(d.getTime())?d.toLocaleString("ja-JP",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}):""}
function setupDbPanel(){
 const info=document.getElementById("dbUpdateInfo"),status=document.getElementById("dbUpdateStatus"),checkBtn=document.getElementById("dbUpdateCheck"),revertBtn=document.getElementById("dbUpdateRevert");
 if(!info||!status||!checkBtn||!revertBtn)return;
 const meta=window.NicoleAstronomyDatabaseMeta||{};
 const src=meta.source==="updated"?`更新版（${fmtDate(meta.fetchedAt)} に取得）`:meta.source==="bundled"?"アプリ同梱版":"アプリ内蔵の旧データ";
 info.textContent=`使用中：v${meta.version||"—"} / ${src}`;
 revertBtn.hidden=meta.source!=="updated";
 const say=(t,kind="")=>{status.textContent=t;status.dataset.kind=kind};
 let pending=null;
 checkBtn.onclick=async()=>{
  checkBtn.disabled=true;
  try{
   if(pending){
    say("取得中…");
    const rec=await downloadDbUpdate(pending,(n,total)=>say(`取得・検証中… ${n}/${total}`));
    pending=null;checkBtn.textContent="最新版を確認";
    say(`v${rec.version} を取り込みました。再読み込みすると使われます。`,"ok");
    if(confirm(`天文データベース v${rec.version} を取り込みました。今すぐ再読み込みしますか？`))location.reload();
    return}
   say("確認中…");
   const r=await checkForDbUpdate();
   if(!r.newer)say(`最新です（v${r.latest.version}）。`,"ok");
   else if(!r.compatible)say(`新しい v${r.latest.version} が出ていますが、このアプリでは使えません。アプリの更新が必要です。`,"warn");
   else{pending=r.latest;checkBtn.textContent=`v${r.latest.version} を取り込む`;say(`新しい v${r.latest.version} があります（使用中 v${r.current||"—"}）。`)}
  }catch(err){console.warn("Nicole DB update",err);say(`できませんでした：${err instanceof TypeError?"通信できません（オフラインの可能性があります）":(err?.message||err)}`,"warn")}
  finally{checkBtn.disabled=false}};
 revertBtn.onclick=async()=>{
  if(!confirm(`取り込んだ更新版を削除し、アプリ同梱版（v${EXPECTED_DB_VERSION}）に戻しますか？`))return;
  try{await clearStoredUpdate();location.reload()}catch(err){say(`戻せませんでした：${err?.message||err}`,"warn")}}
}

(async()=>{
 let db=null,source="",fetchedAt=null;
 try{const stored=await loadStoredDb();if(stored){db=stored.db;source="updated";fetchedAt=stored.fetchedAt}}catch(err){console.warn("Nicole common DB stored update unusable; using the bundled database",err)}
 if(!db){try{db=await loadBundledDb();source="bundled"}catch(err){console.warn("Nicole common DB bundled load failed",err)}}
 if(db){window.NICOLE_COMMON=legacy(db);window.NicoleAstronomyDatabase=db;window.NicoleAstronomyDatabaseMeta={version:db.manifest.database_version,source,fetchedAt}}else{window.NICOLE_COMMON=null;window.NicoleAstronomyDatabaseMeta={version:"legacy-embedded",source:"embedded"}}
 try{setupDbPanel()}catch(err){console.warn("Nicole DB panel",err)}
 await loadClassic(`./app.js?v=2.1.6`)})().catch(err=>{console.error("Nicole bootstrap failed",err);loadClassic(`./app.js?v=2.1.6`) });
