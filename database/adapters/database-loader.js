export async function loadNicoleAstronomyDB(base="./data/"){
  const files=["constellations","stars","planets","deep-sky","asterisms","catalog","external-sources"];
  const values=await Promise.all(files.map(async name=>{
    const r=await fetch(`${base}${name}.json`,{cache:"no-store"});
    if(!r.ok)throw new Error(`Nicole DB: ${name}.json HTTP ${r.status}`);
    return r.json();
  }));
  return Object.fromEntries(files.map((name,i)=>[name.replaceAll("-","_"),values[i]]));
}

export function buildIndex(db){
  const byId=new Map();
  for(const group of [db.stars,db.planets,db.deep_sky,db.constellations,db.asterisms]){
    for(const item of group||[])byId.set(item.id,item);
  }
  return {byId};
}
