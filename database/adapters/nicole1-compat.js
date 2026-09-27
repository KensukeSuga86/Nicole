import {loadNicoleAstronomyDB} from "./database-loader.js";

export async function loadNicole1Legacy(base="../data/"){
  const db=await loadNicoleAstronomyDB(base);

  const CONSTELLATIONS=db.constellations.map(c=>({
    id:c.id,name:c.name.ja,en:c.name.en,abbr:c.name.abbr,
    season:c.season,months:c.visible_months_legacy,
    stars:c.main_stars_text,story:c.legacy_story
  }));

  const CONSTELLATION_TEXT=Object.fromEntries(db.constellations.map(c=>[
    c.id,{science:c.explanation.science,myth:c.explanation.myth}
  ]));

  const CONST_COORD=Object.fromEntries(db.constellations.map(c=>[
    c.id,[c.representative_position.ra_deg,c.representative_position.dec_deg]
  ]));

  const STARS_DB=db.stars.filter(s=>s.roles?.includes("curated_object")).map(s=>({
    id:s.id,name:s.name.ja_full,type:"star",icon:s.icon,cat:s.catalog_category,
    ra:s.position.ra_deg,dec:s.position.dec_deg,mag:s.magnitude_v,
    dist:s.distance_text,size:s.size_text,scope:s.recommended_magnification,
    highlight:s.highlight,months:s.visible_months_legacy,
    story:s.explanation?.raw_html||""
  }));

  const DSO_DB=[
    ...db.planets.map(o=>({
      id:o.id,name:o.name.ja,type:"planet",icon:o.icon,cat:o.catalog_category,
      planet:o.position.planet_key,mag:o.magnitude_v,dist:o.distance_text,
      size:o.size_text,scope:o.recommended_magnification,highlight:o.highlight,
      months:o.visible_months_legacy,story:o.explanation?.raw_html||""
    })),
    ...db.deep_sky.map(o=>({
      id:o.id,name:o.name.ja,type:o.type,icon:o.icon,cat:o.catalog_category,
      ra:o.position.ra_deg,dec:o.position.dec_deg,mag:o.magnitude_v,
      dist:o.distance_text,size:o.size_text,scope:o.recommended_magnification,
      highlight:o.highlight,months:o.visible_months_legacy,
      story:o.explanation?.raw_html||""
    }))
  ];

  const SKY_EXTRA_STARS=db.stars.filter(s=>s.source?.dataset==="SKY_EXTRA_STARS").map(s=>({
    id:s.id,name:s.name.ja,ra:s.position.ra_deg,dec:s.position.dec_deg,mag:s.magnitude_v
  }));

  const allStars=Object.fromEntries(db.stars.map(s=>[s.id,s]));
  const SKY_ASTERISM_STARS={};
  for(const ast of db.asterisms){
    for(const id of ast.star_ids){
      const s=allStars[id]; if(!s)continue;
      SKY_ASTERISM_STARS[id]={name:s.name.ja,ra:s.position.ra_deg,dec:s.position.dec_deg};
    }
  }
  const SKY_ASTERISMS=db.asterisms.map(a=>({
    name:a.name.ja,stars:a.star_ids,lines:a.lines.map(x=>[x.from,x.to])
  }));
  const SKY_STAR_CONSTELLATION_MAP=Object.fromEntries(
    db.stars.filter(s=>s.constellation_id).map(s=>[s.id,s.constellation_id])
  );

  return {
    CONSTELLATIONS,CONSTELLATION_TEXT,CONST_COORD,STARS_DB,DSO_DB,
    SKY_EXTRA_STARS,SKY_ASTERISM_STARS,SKY_ASTERISMS,SKY_STAR_CONSTELLATION_MAP
  };
}
