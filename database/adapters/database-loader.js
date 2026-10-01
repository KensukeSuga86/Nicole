export async function loadNicoleAstronomyDB(base="./data/"){
  const required=["constellations","stars","planets","deep-sky","asterisms","catalog","external-sources"];
  const optional=["solar-system","constellation-standard","constellation-line-stars","constellation-art-manifest","constellation-editor-audit"];
  const out={};
  for(const name of required){
    const r=await fetch(`${base}${name}.json`,{cache:"no-store"});
    if(!r.ok)throw new Error(`Nicole DB: ${name}.json HTTP ${r.status}`);
    out[name.replaceAll("-","_")]=await r.json();
  }
  for(const name of optional){
    try{
      const r=await fetch(`${base}${name}.json`,{cache:"no-store"});
      if(r.ok)out[name.replaceAll("-","_")]=await r.json();
    }catch(_){/* optional for backward compatibility */}
  }
  return out;
}

export function buildIndex(db){
  const byId=new Map();
  for(const group of [db.stars,db.planets,db.deep_sky,db.constellations,db.asterisms]){
    for(const item of group||[])byId.set(item.id,item);
  }
  const constellationStandardById=new Map((db.constellation_standard||[]).map(x=>[x.id,x]));
  const constellationLineStarById=new Map((db.constellation_line_stars||[]).map(x=>[x.id,x]));
  return {byId,constellationStandardById,constellationLineStarById};
}
