
/* =====================================================
自前天文計算エンジン（CDN不要・完全オフライン）
参考アルゴリズム：Jean Meeus "Astronomical Algorithms"
===================================================== */
const D2R=Math.PI/180, R2D=180/Math.PI;
function norm360(x){x=x%360;return x<0?x+360:x;}
function toJD(date){return date.getTime()/86400000+2440587.5;}
function gmst(jd){
const T=(jd-2451545.0)/36525;
let g=280.46061837+360.98564736629*(jd-2451545.0)+0.000387933*T*T-T*T*T/38710000;
return norm360(g);
}
function precessJ2000ToDate(raDeg,decDeg,jd){
const t=(jd-2451545.0)/36525;
const zeta=(2306.2181*t+0.30188*t*t+0.017998*t*t*t)/3600*D2R;
const z=(2306.2181*t+1.09468*t*t+0.018203*t*t*t)/3600*D2R;
const theta=(2004.3109*t-0.42665*t*t-0.041833*t*t*t)/3600*D2R;
const ra=raDeg*D2R,dec=decDeg*D2R;
const A=Math.cos(dec)*Math.sin(ra+zeta);
const B=Math.cos(theta)*Math.cos(dec)*Math.cos(ra+zeta)-Math.sin(theta)*Math.sin(dec);
const C=Math.sin(theta)*Math.cos(dec)*Math.cos(ra+zeta)+Math.cos(theta)*Math.sin(dec);
return{
ra:norm360((Math.atan2(A,B)+z)*R2D),
dec:Math.asin(Math.max(-1,Math.min(1,C)))*R2D
};
}

function formatHourAngle(hours){
hours=((hours%24)+24)%24;
let h=Math.floor(hours);
let m=Math.round((hours-h)*60);
if(m>=60){h=(h+1)%24;m=0;}
return`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
}

function formatClock12(hours){
hours=((hours%12)+12)%12;
if(hours<1e-8)hours=12;
let h=Math.floor(hours);
let m=Math.round((hours-h)*60);
if(m>=60){h+=1;m=0;}
if(h>12)h-=12;
if(h===0)h=12;
return`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
}

function polarisReticleInfo(date,lat,lon,invert=false){
const jd=toJD(date);
/* Polaris J2000.0: α UMi */
const polaris=precessJ2000ToDate(37.95456067,89.26410897,jd);
const lst=norm360(gmst(jd)+lon);
const haDeg=norm360(lst-polaris.ra);
const haHours=haDeg/15;

/* 北天の空を正立の時計盤として見た時計位置。
   HA 0h = 12時、6h = 9時、12h = 6時、18h = 3時。 */
let clockHours=((24-haHours)/2)%12;
if(invert)clockHours=(clockHours+6)%12;
const clockAngle=clockHours/12*Math.PI*2;

return{
ra:polaris.ra,
dec:polaris.dec,
lst,
haHours,
clockHours,
clockAngle,
axisAltitude:Math.abs(lat)
};
}

function drawPolarReticle(info){
const canvas=$("#polarReticleCanvas");
if(!canvas||!info)return;
const ctx=canvas.getContext("2d");
const w=canvas.width,h=canvas.height,cx=w/2,cy=h/2;
const R=Math.min(w,h)*0.385;
ctx.clearRect(0,0,w,h);
ctx.fillStyle="#02070c";
ctx.fillRect(0,0,w,h);

ctx.save();
ctx.translate(cx,cy);

/* outer field */
ctx.strokeStyle="rgba(130,191,224,.55)";
ctx.lineWidth=3;
ctx.beginPath();ctx.arc(0,0,R*1.13,0,Math.PI*2);ctx.stroke();

/* Polaris orbit circles: generic Sky-Watcher/SynScan-style clock guide */
[1,0.88,0.76].forEach((f,i)=>{
ctx.strokeStyle=i===1?"rgba(117,211,255,.55)":"rgba(93,152,184,.28)";
ctx.lineWidth=i===1?3:2;
ctx.beginPath();ctx.arc(0,0,R*f,0,Math.PI*2);ctx.stroke();
});

/* cross hair */
ctx.strokeStyle="rgba(106,169,200,.35)";
ctx.lineWidth=2;
ctx.beginPath();ctx.moveTo(-R*1.05,0);ctx.lineTo(R*1.05,0);ctx.stroke();
ctx.beginPath();ctx.moveTo(0,-R*1.05);ctx.lineTo(0,R*1.05);ctx.stroke();

ctx.font="600 30px sans-serif";
ctx.fillStyle="#8fc8e8";
ctx.textAlign="center";
ctx.textBaseline="middle";
const labels=[
{t:"12",a:0},{t:"3",a:Math.PI/2},{t:"6",a:Math.PI},{t:"9",a:Math.PI*1.5}
];
labels.forEach(o=>{
const rr=R*1.28;
const x=Math.sin(o.a)*rr,y=-Math.cos(o.a)*rr;
ctx.fillText(o.t,x,y);
});

/* minute/hour ticks */
for(let i=0;i<60;i++){
const a=i/60*Math.PI*2;
const isHour=i%5===0;
const r1=R*(isHour?1.03:1.07),r2=R*1.12;
ctx.strokeStyle=isHour?"rgba(149,209,237,.7)":"rgba(100,154,181,.38)";
ctx.lineWidth=isHour?2.4:1.2;
ctx.beginPath();
ctx.moveTo(Math.sin(a)*r1,-Math.cos(a)*r1);
ctx.lineTo(Math.sin(a)*r2,-Math.cos(a)*r2);
ctx.stroke();
}

/* NCP */
ctx.fillStyle="#d9f4ff";
ctx.beginPath();ctx.arc(0,0,5,0,Math.PI*2);ctx.fill();
ctx.font="20px sans-serif";
ctx.fillStyle="#8ab7ce";
ctx.fillText("NCP",0,28);

/* Polaris position */
const pr=R*0.88;
const x=Math.sin(info.clockAngle)*pr;
const y=-Math.cos(info.clockAngle)*pr;
ctx.shadowColor="rgba(255,224,108,.8)";
ctx.shadowBlur=18;
ctx.fillStyle="#ffe47c";
ctx.beginPath();ctx.arc(x,y,12,0,Math.PI*2);ctx.fill();
ctx.shadowBlur=0;
ctx.strokeStyle="#fff5b8";
ctx.lineWidth=3;
ctx.beginPath();ctx.arc(x,y,18,0,Math.PI*2);ctx.stroke();
ctx.font="700 24px sans-serif";
ctx.fillStyle="#ffeaa0";
ctx.textAlign=x>=0?"left":"right";
ctx.fillText("Polaris",x+(x>=0?24:-24),y-20);

ctx.restore();
}

function formatCoordDegMin(value,positiveLetter,negativeLetter){
const n=Number(value);
if(!Number.isFinite(n))return"—";
const letter=n>=0?positiveLetter:negativeLetter;
const abs=Math.abs(n);
let deg=Math.floor(abs);
let min=Math.round((abs-deg)*60);
if(min>=60){deg+=1;min=0;}
return`${letter} ${String(deg).padStart(3,"0")}° ${String(min).padStart(2,"0")}′`;
}

function renderPolarScopeGuide(lat=currentLat,lon=currentLon,date=currentDate){
const panel=$("#polarScopePanel");
if(!panel)return;
if(!Number.isFinite(lat)||!Number.isFinite(lon)||!(date instanceof Date)||isNaN(date)){
$("#polarClockPosition").textContent="—";
$("#polarHourAngle").textContent="—";
return;
}
const invert=!!$("#polarReticleInvert")?.checked;
const info=polarisReticleInfo(date,lat,lon,invert);
const elev=parseFloat($("#inAlt").value);
$("#polarClockPosition").textContent=formatClock12(info.clockHours);
$("#polarHourAngle").textContent=formatHourAngle(info.haHours);
$("#polarAxisAltitude").textContent=`${info.axisAltitude.toFixed(2)}°`;
$("#polarSiteElevation").textContent=Number.isFinite(elev)?`${elev.toFixed(0)} m`:"—";
const place=$("#inPlace").value||"指定場所";
const p=n=>String(n).padStart(2,"0");
$("#polarGuideText").innerHTML=
`<b>${escapeHTML(place)}</b> / ${formatCoordDegMin(lon,"E","W")} / ${formatCoordDegMin(lat,"N","S")}`
+`${Number.isFinite(elev)?` / 標高 ${elev.toFixed(0)} m`:""}`
+`<br>${date.getFullYear()}-${p(date.getMonth()+1)}-${p(date.getDate())} ${p(date.getHours())}:${p(date.getMinutes())}`
+`<br>レクチルの12時を上に合わせ、北極星を <b>${formatClock12(info.clockHours)}</b> の方向へ置く目安です。`
+` 極軸高度は緯度と同じ約 <b>${info.axisAltitude.toFixed(2)}°</b>。`
+`<br><span style="color:#6f91a8">※ 極軸望遠鏡の像の向き・レクチル仕様は機種や世代で異なります。必要に応じて「レクチルを反転」を使用してください。</span>`;
drawPolarReticle(info);
}

function sunPosition(jd){
const T=(jd-2451545.0)/36525;
const L0=norm360(280.46646+36000.76983*T+0.0003032*T*T);
const M=norm360(357.52911+35999.05029*T-0.0001537*T*T);
const Mr=M*D2R;
const C=(1.914602-0.004817*T-0.000014*T*T)*Math.sin(Mr)+(0.019993-0.000101*T)*Math.sin(2*Mr)+0.000289*Math.sin(3*Mr);
const trueLong=L0+C;
const omega=125.04-1934.136*T;
const lambda=trueLong-0.00569-0.00478*Math.sin(omega*D2R);
const eps0=23+26/60+21.448/3600-(46.8150*T+0.00059*T*T-0.001813*T*T*T)/3600;
const eps=eps0+0.00256*Math.cos(omega*D2R);
const lr=lambda*D2R, er=eps*D2R;
const ra=Math.atan2(Math.cos(er)*Math.sin(lr),Math.cos(lr))*R2D;
const dec=Math.asin(Math.sin(er)*Math.sin(lr))*R2D;
return{ra:norm360(ra),dec:dec};
}
function moonPosition(jd){
const T=(jd-2451545.0)/36525;
const Lp=norm360(218.3164477+481267.88123421*T-0.0015786*T*T+T*T*T/538841-T*T*T*T/65194000);
const D=norm360(297.8501921+445267.1114034*T-0.0018819*T*T+T*T*T/545868-T*T*T*T/113065000);
const M=norm360(357.5291092+35999.0502909*T-0.0001536*T*T+T*T*T/24490000);
const Mp=norm360(134.9633964+477198.8675055*T+0.0087414*T*T+T*T*T/69699-T*T*T*T/14712000);
const F=norm360(93.2720950+483202.0175233*T-0.0036539*T*T-T*T*T/3526000+T*T*T*T/863310000);
const Dr=D*D2R,Mr=M*D2R,Mpr=Mp*D2R,Fr=F*D2R;
let dL=6.288774*Math.sin(Mpr)+1.274027*Math.sin(2*Dr-Mpr)+0.658314*Math.sin(2*Dr)+0.213618*Math.sin(2*Mpr)-0.185116*Math.sin(Mr)-0.114332*Math.sin(2*Fr)+0.058793*Math.sin(2*Dr-2*Mpr)+0.057066*Math.sin(2*Dr-Mr-Mpr)+0.053322*Math.sin(2*Dr+Mpr)+0.045758*Math.sin(2*Dr-Mr)-0.040923*Math.sin(Mr-Mpr)-0.034720*Math.sin(Dr)-0.030383*Math.sin(Mr+Mpr);
let dB=5.128122*Math.sin(Fr)+0.280602*Math.sin(Mpr+Fr)+0.277693*Math.sin(Mpr-Fr)+0.173237*Math.sin(2*Dr-Fr)+0.055413*Math.sin(2*Dr+Fr-Mpr)+0.046271*Math.sin(2*Dr-Fr-Mpr)+0.032573*Math.sin(2*Dr+Fr);
const lambda=Lp+dL;const beta=dB;
const eps=(23+26/60+21.448/3600-46.8150*T/3600)*D2R;
const lr=lambda*D2R,br=beta*D2R;
const ra=Math.atan2(Math.sin(lr)*Math.cos(eps)-Math.tan(br)*Math.sin(eps),Math.cos(lr))*R2D;
const dec=Math.asin(Math.sin(br)*Math.cos(eps)+Math.cos(br)*Math.sin(eps)*Math.sin(lr))*R2D;
return{ra:norm360(ra),dec:dec,lambda:norm360(lambda)};
}
function altitude(ra,dec,lat,lon,date){
const jd=toJD(date);
const lst=norm360(gmst(jd)+lon);
const ha=norm360(lst-ra)*D2R;
const dr=dec*D2R,lr=lat*D2R;
const sinAlt=Math.sin(dr)*Math.sin(lr)+Math.cos(dr)*Math.cos(lr)*Math.cos(ha);
return Math.asin(Math.max(-1,Math.min(1,sinAlt)))*R2D;
}
function altAz(ra,dec,lat,lon,date){
const jd=toJD(date);
const lst=norm360(gmst(jd)+lon);
const ha=norm360(lst-ra)*D2R;
const dr=dec*D2R,lr=lat*D2R;
const sinAlt=Math.sin(dr)*Math.sin(lr)+Math.cos(dr)*Math.cos(lr)*Math.cos(ha);
const alt=Math.asin(Math.max(-1,Math.min(1,sinAlt)))*R2D;
const cosAz=(Math.sin(dr)-Math.sin(alt*D2R)*Math.sin(lr))/(Math.cos(alt*D2R)*Math.cos(lr));
let az=Math.acos(Math.max(-1,Math.min(1,cosAz)))*R2D;
if(Math.sin(ha)>0)az=360-az;
return{alt,az};
}
function sunAlt(lat,lon,date){const p=sunPosition(toJD(date));return altitude(p.ra,p.dec,lat,lon,date);}
function moonAlt(lat,lon,date){const p=moonPosition(toJD(date));return altitude(p.ra,p.dec,lat,lon,date);}
function findAltCrossing(altFunc,lat,lon,dayStart,targetAlt,rising){
const base=new Date(dayStart);base.setHours(0,0,0,0);
let prev=altFunc(lat,lon,base);
for(let m=1;m<=1440;m++){
const d=new Date(base.getTime()+m*60000);
const cur=altFunc(lat,lon,d);
if(rising && prev<=targetAlt && cur>targetAlt){const frac=(targetAlt-prev)/(cur-prev);return new Date(base.getTime()+((m-1)+frac)*60000);}
if(!rising && prev>=targetAlt && cur<targetAlt){const frac=(prev-targetAlt)/(prev-cur);return new Date(base.getTime()+((m-1)+frac)*60000);}
prev=cur;
}
return null;
}
function moonPhaseInfo(date){
const jd=toJD(date);
const moon=moonPosition(jd);
const T=(jd-2451545.0)/36525;
const L0=norm360(280.46646+36000.76983*T+0.0003032*T*T);
const M=norm360(357.52911+35999.05029*T);
const C=(1.914602-0.004817*T)*Math.sin(M*D2R)+(0.019993)*Math.sin(2*M*D2R);
const sunEclLon=norm360(L0+C);
let elong=norm360(moon.lambda-sunEclLon);
const moonAge=Math.round(elong/360*29.53*10)/10;
const illum=Math.round((1-Math.cos(elong*D2R))/2*100);
let moonPhase;
if(elong<22.5)moonPhase="🌑";else if(elong<67.5)moonPhase="🌒";else if(elong<112.5)moonPhase="🌓";
else if(elong<157.5)moonPhase="🌔";else if(elong<202.5)moonPhase="🌕";else if(elong<247.5)moonPhase="🌖";
else if(elong<292.5)moonPhase="🌗";else if(elong<337.5)moonPhase="🌘";else moonPhase="🌑";
return{moonAge,moonIllum:illum,moonPhase};
}
function calcSkyInfo(lat,lon,date){
const dayStart=new Date(date);dayStart.setHours(0,0,0,0);
const sunrise=findAltCrossing(sunAlt,lat,lon,dayStart,-0.833,true);
const sunset=findAltCrossing(sunAlt,lat,lon,dayStart,-0.833,false);
const astroEnd=findAltCrossing(sunAlt,lat,lon,dayStart,-18,true);
const astroStart=findAltCrossing(sunAlt,lat,lon,dayStart,-18,false);
const moonRise=findAltCrossing(moonAlt,lat,lon,dayStart,-0.833,true);
const moonSet=findAltCrossing(moonAlt,lat,lon,dayStart,-0.833,false);
const {moonAge,moonIllum,moonPhase}=moonPhaseInfo(date);
return{sunrise,sunset,astroStart,astroEnd,moonRise,moonSet,moonPhase,moonAge,moonIllum};
}
function fmtTime(dt){
if(!dt||!(dt instanceof Date)||isNaN(dt))return"—";
const p=n=>String(n).padStart(2,"0");
return`${p(dt.getHours())}:${p(dt.getMinutes())}`;
}
function getMoonPhaseName(age){
if(age===null||age===undefined)return"";
if(age<1.5)return"新月";if(age<5.5)return"三日月";if(age<9.5)return"上弦の月";if(age<12.5)return"十日夜";
if(age<15.5)return"満月";if(age<18.5)return"十六夜";if(age<22.5)return"下弦の月";if(age<26.5)return"有明月";
return"晦日月";
}

/* =====================================================
惑星の簡易位置計算（軌道要素：NASA/JPL Keplerian Elements）
===================================================== */
const PLANET_ELEMENTS={
Mercury:{a:0.38710,e:0.20563,i:7.005,L:252.251,lp:77.456,node:48.331,per:87.969,mag0:-0.42},
Venus:{a:0.72333,e:0.00677,i:3.395,L:181.980,lp:131.564,node:76.680,per:224.701,mag0:-4.40},
Mars:{a:1.52368,e:0.09340,i:1.850,L:355.433,lp:336.041,node:49.579,per:686.980,mag0:-1.52},
Jupiter:{a:5.20260,e:0.04849,i:1.303,L:34.351,lp:14.331,node:100.464,per:4332.589,mag0:-9.40},
Saturn:{a:9.55491,e:0.05551,i:2.489,L:50.077,lp:93.057,node:113.665,per:10759.22,mag0:-8.88},
Uranus:{a:19.21845,e:0.04630,i:0.773,L:314.055,lp:173.005,node:74.006,per:30685.4,mag0:-7.19},
Neptune:{a:30.11039,e:0.00899,i:1.770,L:304.348,lp:48.124,node:131.784,per:60189,mag0:-6.87}
};
const EARTH_EL={a:1.00000,e:0.01671,L:100.464,lp:102.937,per:365.256};
function solveKepler(M,e){M=M*D2R;let E=M;for(let i=0;i<8;i++){E=E-(E-e*Math.sin(E)-M)/(1-e*Math.cos(E));}return E;}
function heliocentric(el,jd){
const d=jd-2451545.0;const n=360/el.per;
const M=norm360(el.L-el.lp+n*d);const E=solveKepler(M,el.e);
const xv=el.a*(Math.cos(E)-el.e);const yv=el.a*Math.sqrt(1-el.e*el.e)*Math.sin(E);
const v=Math.atan2(yv,xv);const r=Math.sqrt(xv*xv+yv*yv);
const lp=el.lp*D2R,node=(el.node||0)*D2R,i=(el.i||0)*D2R;const lon=v+lp;
const xh=r*(Math.cos(node)*Math.cos(lon-node)-Math.sin(node)*Math.sin(lon-node)*Math.cos(i));
const yh=r*(Math.sin(node)*Math.cos(lon-node)+Math.cos(node)*Math.sin(lon-node)*Math.cos(i));
const zh=r*Math.sin(lon-node)*Math.sin(i);
return{x:xh,y:yh,z:zh,r};
}
function planetRaDec(name,jd){
const el=PLANET_ELEMENTS[name];const p=heliocentric(el,jd);
const e=heliocentric({...EARTH_EL,i:0,node:0},jd);
const x=p.x-e.x,y=p.y-e.y,z=p.z-e.z;const dist=Math.sqrt(x*x+y*y+z*z);
const eps=23.4393*D2R;const xeq=x;const yeq=y*Math.cos(eps)-z*Math.sin(eps);const zeq=y*Math.sin(eps)+z*Math.cos(eps);
const ra=norm360(Math.atan2(yeq,xeq)*R2D);const dec=Math.atan2(zeq,Math.sqrt(xeq*xeq+yeq*yeq))*R2D;
let mag=el.mag0+5*Math.log10(p.r*dist);
return{ra,dec,dist,mag:Math.round(mag*10)/10};
}

/* =====================================================
88星座データベース（IAU公式星座に基づく）
===================================================== */
const CONSTELLATIONS=window.NICOLE_COMMON?.CONSTELLATIONS||[
{id:"UMa",name:"おおぐま座",en:"Ursa Major",abbr:"UMa",season:"circumpolar",months:[1,2,3,4,5,6,7,8,9,10,11,12],stars:"アリオト・ドゥーベ・アルカイド・ミザール・メラク",story:"北斗七星を含む北天の代表的な星座。ギリシャ神話ではゼウスに愛されたカリストが熊に変えられ天に上げられたとされる。北極星を見つけるための「道しるべ」として古来から航海者に重宝された。一年中見える周極星座。"},
{id:"UMi",name:"こぐま座",en:"Ursa Minor",abbr:"UMi",season:"circumpolar",months:[1,2,3,4,5,6,7,8,9,10,11,12],stars:"ポラリス（北極星）・コカブ・フェルカド",story:"北極星（ポラリス）を含む北天の星座。北極星は現在の地球の自転軸の延長線上にある星で、方位の基準として古来から航海者に重宝された。地球の歳差運動により、北極星は約2万6千年周期で変わる。"},
{id:"Dra",name:"りゅう座",en:"Draco",abbr:"Dra",season:"circumpolar",months:[1,2,3,4,5,6,7,8,9,10,11,12],stars:"エルタニン・アステリオン・アルタイス",story:"北天を大きく蛇行する星座。ギリシャ神話ではヘスペリデスの園の黄金のリンゴを守る竜ラドン。約5,000年前は北極星の近くにあるトゥバン（α星）が北極星だった。NGC6543（キャッツアイ星雲）を含む。"},
{id:"Cas",name:"カシオペヤ座",en:"Cassiopeia",abbr:"Cas",season:"circumpolar",months:[1,2,3,4,5,6,7,8,9,10,11,12],stars:"シェダル・カフ・ルクバ",story:"W字形が特徴的な北天の星座。北極星を挟んで北斗七星の反対側にあり、一年中見える周極星座。ギリシャ神話ではエチオピアの王妃カシオペヤ。NGC7789（カロリーンのバラ）を含む。"},
{id:"Cep",name:"ケフェウス座",en:"Cepheus",abbr:"Cep",season:"circumpolar",months:[1,2,3,4,5,6,7,8,9,10,11,12],stars:"アルデラミン・アルフィルク",story:"北天の周極星座。ギリシャ神話ではエチオピアの王ケフェウス。δ星（デルタ・ケフェイ）はケフェイド型変光星の原型として天文学的に重要。約5,500年後にはγ星が北極星になる。"},
{id:"Cam",name:"きりん座",en:"Camelopardalis",abbr:"Cam",season:"circumpolar",months:[1,2,3,4,5,6,7,8,9,10,11,12],stars:"β星・α星",story:"北天の大きな星座だが明るい星がなく見つけにくい。1612年にペトルス・プランシウスが設定。キリン（ジラフ）を表す。"},
{id:"Lyn",name:"やまねこ座",en:"Lynx",abbr:"Lyn",season:"spring",months:[12,1,2,3,4,5],stars:"α星",story:"1690年にヘベリウスが設定した星座。「この星座を見つけるにはやまねこのような目が必要」と言われるほど暗い星ばかり。"},
{id:"Cnc",name:"かに座",en:"Cancer",abbr:"Cnc",season:"spring",months:[11,12,1,2,3,4,5],stars:"アクベンス・アルタルフ",story:"黄道十二星座の一つ。M44プレセペ星団やM67を含む。ギリシャ神話ではヘラクレスとヒュドラの戦いに現れた巨大な蟹カルキノスとされる。"},
{id:"Leo",name:"しし座",en:"Leo",abbr:"Leo",season:"spring",months:[12,1,2,3,4,5,6],stars:"レグルス・デネボラ・アルギエバ",story:"春の代表的な星座。ギリシャ神話ではヘラクレスが退治したネメアの獅子。鎌（シックル）形の星の並びが獅子の頭部を表す。M65・M66・NGC3628のレオトリプレット（三つ子銀河）が有名な観測対象。"},
{id:"LMi",name:"こじし座",en:"Leo Minor",abbr:"LMi",season:"spring",months:[1,2,3,4,5,6],stars:"プラエキプア・β星",story:"1690年にヘベリウスが設定した小さな星座。しし座の北側に位置する。"},
{id:"Vir",name:"おとめ座",en:"Virgo",abbr:"Vir",season:"spring",months:[1,2,3,4,5,6,7],stars:"スピカ・ポリマ・ビンデミアトリックス",story:"春の夜空を代表する星座。1等星スピカは「春の大曲線」の終点として有名。おとめ座銀河団（M87・M84・M86など）の方向にあり、銀河観測の宝庫。ギリシャ神話では農業の女神デメテルまたはその娘ペルセポネとされる。"},
{id:"Com",name:"かみのけ座",en:"Coma Berenices",abbr:"Com",season:"spring",months:[1,2,3,4,5,6,7],stars:"ディアデム・β星",story:"エジプトの王妃ベレニケ2世が夫の無事を祈って捧げた髪の毛が星になったという伝説に基づく。かみのけ座銀河団（M85・M98・M99・M100など）を含む銀河の宝庫。"},
{id:"CVn",name:"りょうけん座",en:"Canes Venatici",abbr:"CVn",season:"spring",months:[1,2,3,4,5,6,7,8],stars:"コル・カロリ・アステリオン",story:"1690年にヘベリウスが設定。うしかい座の猟師が連れる2匹の猟犬を表す。M51（子持ち銀河）・M63（ひまわり銀河）・M94・M106など多くの銀河を含む。"},
{id:"Boo",name:"うしかい座",en:"Boötes",abbr:"Boo",season:"spring",months:[2,3,4,5,6,7,8],stars:"アルクトゥルス・イザール・ムフリド",story:"春の代表的な星座。アルクトゥルスは「春の大曲線」の中間点として有名な橙色の巨星。ギリシャ神話では熊を追う猟師の姿で描かれる。イザールは美しい二重星として知られる。"},
{id:"CrB",name:"かんむり座",en:"Corona Borealis",abbr:"CrB",season:"spring",months:[2,3,4,5,6,7,8],stars:"アルフェッカ・ヌサカン",story:"半円形に並ぶ星が王冠のように見える小さな星座。ギリシャ神話ではアリアドネが被った黄金の冠。T星は「回帰新星」として知られ、数十年に一度急激に明るくなる。"},
{id:"Ser",name:"へび座",en:"Serpens",abbr:"Ser",season:"spring",months:[3,4,5,6,7,8,9],stars:"ウヌカルハイ・エタ・ムー",story:"へびつかい座に分断される唯一の星座（頭部と尾部に分かれる）。ギリシャ神話では医神アスクレピオスが持つ蛇。M5（球状星団）・M16（わし星雲）を含む。"},
{id:"Lib",name:"てんびん座",en:"Libra",abbr:"Lib",season:"spring",months:[3,4,5,6,7,8],stars:"ズベンエルゲヌビ・ズベンエスカマリ",story:"黄道十二星座の一つ。古代ローマでは正義の女神アストレアが持つ天秤を表す。かつてはさそり座の爪とされていた。"},
{id:"Hya",name:"うみへび座",en:"Hydra",abbr:"Hya",season:"spring",months:[12,1,2,3,4,5,6,7],stars:"アルファルド・γ・ζ",story:"全88星座の中で最大の面積を持つ星座。ギリシャ神話ではヘラクレスが退治した9つの頭を持つ水蛇ヒュドラ。M48・M68・M83（南の風車銀河）・NGC3242（木星状星雲）を含む。"},
{id:"Crt",name:"コップ座",en:"Crater",abbr:"Crt",season:"spring",months:[1,2,3,4,5,6],stars:"アルケス・β・γ",story:"うみへび座の上に乗るコップを表す小さな星座。ギリシャ神話ではアポロンの聖杯。"},
{id:"Crv",name:"からす座",en:"Corvus",abbr:"Crv",season:"spring",months:[1,2,3,4,5,6],stars:"ギエナー・クラズ・アルゴラブ",story:"うみへび座の上に乗るからすを表す星座。ギリシャ神話ではアポロンの使いのカラス。4つの星が台形を作る特徴的な形。"},
{id:"Ant",name:"ポンプ座",en:"Antlia",abbr:"Ant",season:"spring",months:[12,1,2,3,4,5],stars:"α星・ε星",story:"1756年にラカイユが設定した近代的な星座。空気ポンプを表す。明るい星がなく見つけにくい。"},
{id:"Sex",name:"ろくぶんぎ座",en:"Sextans",abbr:"Sex",season:"spring",months:[1,2,3,4,5,6],stars:"α星",story:"1690年にヘベリウスが設定した星座。六分儀（セクスタント）を表す。明るい星がなく見つけにくい。"},
{id:"Her",name:"ヘルクレス座",en:"Hercules",abbr:"Her",season:"summer",months:[3,4,5,6,7,8,9,10],stars:"コルネフォロス・ザニア",story:"M13（ヘルクレス座大球状星団）を含む夏の星座。1974年にアレシボ電波望遠鏡からM13に向けてアレシボメッセージが送信された。ギリシャ神話の大英雄ヘラクレスの姿を表す。M92という別の球状星団も含む。"},
{id:"Oph",name:"へびつかい座",en:"Ophiuchus",abbr:"Oph",season:"summer",months:[3,4,5,6,7,8,9],stars:"ラス・アルハゲ・サビク",story:"へびを持つ男の姿を表す大きな星座。黄道上に位置するが黄道十二星座には含まれない「第13の星座」として話題になることも。M9・M10・M12・M14・M19・M62・M107など多くの球状星団を含む。"},
{id:"Sco",name:"さそり座",en:"Scorpius",abbr:"Sco",season:"summer",months:[4,5,6,7,8,9],stars:"アンタレス・シャウラ・サルガス",story:"夏の南天を代表する星座。ギリシャ神話では狩人オリオンを刺した大サソリ。オリオン座と正反対の位置にあり、一方が昇ると他方が沈む。赤い超巨星アンタレスは「火星に対抗するもの」という意味を持つ。M4・M6・M7・M80などを含む。"},
{id:"Sgr",name:"いて座",en:"Sagittarius",abbr:"Sgr",season:"summer",months:[5,6,7,8,9,10],stars:"カウス・アウストラリス・アルナスル",story:"銀河系の中心方向に位置する星座。南斗六星（ティーポット）の形が有名。M8干潟星雲・M17オメガ星雲・M22球状星団など、メシエ天体が密集する天文観測の宝庫。ギリシャ神話では半人半馬のケンタウロス族の賢者ケイロンとされる。"},
{id:"CrA",name:"みなみのかんむり座",en:"Corona Australis",abbr:"CrA",season:"summer",months:[5,6,7,8,9],stars:"α星・β星",story:"いて座の南に位置する小さな星座。かんむり座（北）に対応する南の王冠。古代ギリシャから知られる星座。"},
{id:"Tel",name:"望遠鏡座",en:"Telescopium",abbr:"Tel",season:"summer",months:[5,6,7,8,9],stars:"α星・ζ星",story:"1756年にラカイユが設定した近代的な星座。望遠鏡を表す。南天低空にあるため日本では観測しにくい。"},
{id:"Ara",name:"さいだん座",en:"Ara",abbr:"Ara",season:"summer",months:[4,5,6,7,8,9],stars:"β星・α星",story:"古代ギリシャから知られる星座。神々が巨人族との戦いの前に誓いを立てた祭壇を表す。南天低空にあるため日本では観測しにくい。"},
{id:"Sct",name:"たて座",en:"Scutum",abbr:"Sct",season:"summer",months:[4,5,6,7,8,9,10],stars:"α星・β星",story:"1684年にヘベリウスがポーランド王ヤン3世ソビエスキーの盾として設定した星座。M11（野鴨星団）・M26を含む。天の川の濃い部分に位置する。"},
{id:"Aql",name:"わし座",en:"Aquila",abbr:"Aql",season:"summer",months:[5,6,7,8,9,10,11],stars:"アルタイル（彦星）・タラゼド・アルシャイン",story:"七夕の彦星アルタイルを含む星座。ギリシャ神話ではゼウスの使いの鷲、またはゼウス自身が変身した鷲とされる。アルタイルは自転速度が非常に速く、赤道部分が膨らんだ扁平な形をしている。"},
{id:"Sge",name:"や座",en:"Sagitta",abbr:"Sge",season:"summer",months:[4,5,6,7,8,9,10,11],stars:"γ星・δ星",story:"矢の形をした小さな星座。ギリシャ神話ではヘラクレスがワシに射た矢、またはアポロンの矢とされる。M71（球状星団）を含む。"},
{id:"Vul",name:"こぎつね座",en:"Vulpecula",abbr:"Vul",season:"summer",months:[4,5,6,7,8,9,10,11],stars:"アンサー・α星",story:"1690年にヘベリウスが設定した小さな星座。M27（亜鈴状星雲）を含む。天の川の中に位置する。"},
{id:"Lyr",name:"こと座",en:"Lyra",abbr:"Lyr",season:"summer",months:[4,5,6,7,8,9,10,11],stars:"ベガ（織姫星）・スラフト・シェリアク",story:"七夕の織姫星ベガを含む星座。ギリシャ神話では音楽の名手オルフェウスの竪琴。彼の死後、竪琴は天に上げられたとされる。M57（リング星雲）とこと座ε（四重星）という観測的に面白い天体を含む。"},
{id:"Cyg",name:"はくちょう座",en:"Cygnus",abbr:"Cyg",season:"summer",months:[5,6,7,8,9,10,11],stars:"デネブ・アルビレオ・サドル",story:"夏の大三角の一角を担う星座。ギリシャ神話ではゼウスが白鳥に変身した姿とも言われる。北十字とも呼ばれ、天の川の中に位置するため双眼鏡での星野観察が楽しい。アルビレオは金色と青色の美しい二重星として有名。NGC6992（網状星雲）・NGC7000（北アメリカ星雲）を含む。"},
{id:"Del",name:"いるか座",en:"Delphinus",abbr:"Del",season:"summer",months:[5,6,7,8,9,10,11],stars:"スアロキン・ロタネフ",story:"小さいながらも特徴的な菱形の形をした星座。ギリシャ神話では音楽家アリオンを救ったイルカ。α星とβ星の名前は天文学者ニコラウス・ヴェンデリンのラテン語名を逆さにしたもの。"},
{id:"Equ",name:"こうま座",en:"Equuleus",abbr:"Equ",season:"summer",months:[5,6,7,8,9,10,11],stars:"キタルファ・β星",story:"全88星座の中で2番目に小さな星座。小さな馬の頭を表す。ギリシャ神話ではヘルメスが作った最初の馬とされる。"},
{id:"And",name:"アンドロメダ座",en:"Andromeda",abbr:"And",season:"autumn",months:[7,8,9,10,11,12,1],stars:"アルフェラッツ・ミラク・アルマク",story:"M31（アンドロメダ銀河）を含む秋の星座。ギリシャ神話ではエチオピアの王女アンドロメダ。海の怪物に生贄として捧げられそうになったところを英雄ペルセウスに救われた。アルマクは金色と青緑の美しい二重星として有名。"},
{id:"Per",name:"ペルセウス座",en:"Perseus",abbr:"Per",season:"autumn",months:[8,9,10,11,12,1,2,3],stars:"ミルファク・アルゴル",story:"秋から冬の北天の星座。ギリシャ神話の英雄ペルセウス。メドゥーサの首を持つ姿で描かれ、アルゴルは「悪魔の目」として古来から知られる変光星。NGC869/884（二重星団）という美しい散開星団ペアを含む。"},
{id:"Peg",name:"ペガスス座",en:"Pegasus",abbr:"Peg",season:"autumn",months:[7,8,9,10,11,12,1],stars:"エニフ・シェアト・マルカブ・アルゲニブ",story:"秋の代表的な星座。4つの星が作る「秋の四辺形」が目印。ギリシャ神話では英雄ペルセウスがメドゥーサを倒した時に生まれた天馬ペガサス。M15（球状星団）を含む。"},
{id:"Tri",name:"さんかく座",en:"Triangulum",abbr:"Tri",season:"autumn",months:[8,9,10,11,12,1,2],stars:"ベータ・アルファ",story:"3つの星が作る三角形の小さな星座。M33（さんかく座銀河）を含む。古代ギリシャから知られる星座。"},
{id:"Ari",name:"おひつじ座",en:"Aries",abbr:"Ari",season:"autumn",months:[8,9,10,11,12,1,2],stars:"ハマル・シェラタン・メサルティム",story:"黄道十二星座の一つ。かつて春分点がおひつじ座にあった（約2,000年前）。ギリシャ神話では金の羊毛を持つ神聖な羊。メサルティムは望遠鏡で初めて発見された二重星の一つ。"},
{id:"Psc",name:"うお座",en:"Pisces",abbr:"Psc",season:"autumn",months:[8,9,10,11,12,1],stars:"エタ・ピスキウム・アルレシャ",story:"秋から冬の黄道十二星座の一つ。現在の春分点がうお座にあり、占星術では重要な星座。ギリシャ神話ではアフロディーテとエロスが魚に変身した姿とされる。"},
{id:"Cet",name:"くじら座",en:"Cetus",abbr:"Cet",season:"autumn",months:[8,9,10,11,12,1,2],stars:"ディフダ・メンカル・ミラ",story:"秋の大きな星座。ギリシャ神話ではアンドロメダを食べようとした海の怪物。ミラ（ο星）は「驚くべきもの」という意味の有名な長周期変光星で、約332日周期で2等から10等まで変化する。M77（セイファート銀河）を含む。"},
{id:"Phe",name:"ほうおう座",en:"Phoenix",abbr:"Phe",season:"autumn",months:[8,9,10,11,12,1],stars:"アンカー・β星",story:"南天の星座。不死鳥フェニックスを表す。南天低空にあるため日本では観測しにくい。"},
{id:"Scl",name:"ちょうこくしつ座",en:"Sculptor",abbr:"Scl",season:"autumn",months:[8,9,10,11,12,1],stars:"α星・β星",story:"1756年にラカイユが設定した近代的な星座。彫刻家の作業台を表す。NGC253（ちょうこくしつ座銀河）・NGC300を含む。"},
{id:"For",name:"ろ座",en:"Fornax",abbr:"For",season:"autumn",months:[9,10,11,12,1,2],stars:"α星・β星",story:"1756年にラカイユが設定した近代的な星座。化学炉を表す。ろ座銀河団を含む。"},
{id:"Eri",name:"エリダヌス座",en:"Eridanus",abbr:"Eri",season:"autumn",months:[9,10,11,12,1,2],stars:"アケルナル・アクマル・クルサ",story:"南北に長い大きな星座。川（エリダヌス川）を表す。最南端のα星アケルナルは日本の南端でかろうじて見える。ε星（エプシロン・エリダニ）は太陽に近い恒星で、惑星系を持つ可能性がある。"},
{id:"Hor",name:"とけい座",en:"Horologium",abbr:"Hor",season:"autumn",months:[9,10,11,12,1],stars:"α星",story:"1756年にラカイユが設定した近代的な星座。振り子時計を表す。南天低空にあるため日本では観測しにくい。"},
{id:"Cae",name:"ちょうこくぐ座",en:"Caelum",abbr:"Cae",season:"autumn",months:[10,11,12,1,2],stars:"α星・β星",story:"1756年にラカイユが設定した近代的な星座。彫刻刀を表す。非常に小さく暗い星座。"},
{id:"Col",name:"はと座",en:"Columba",abbr:"Col",season:"autumn",months:[10,11,12,1,2,3],stars:"ファクト・ウァズン",story:"1592年にプランシウスが設定した星座。ノアの方舟に使われた鳩を表す。"},
{id:"Lac",name:"とかげ座",en:"Lacerta",abbr:"Lac",season:"autumn",months:[7,8,9,10,11,12],stars:"α星・β星",story:"1690年にヘベリウスが設定した小さな星座。トカゲを表す。天の川の中に位置する。"},
{id:"Aqr",name:"みずがめ座",en:"Aquarius",abbr:"Aqr",season:"autumn",months:[6,7,8,9,10,11],stars:"サダルスード・サダルメリク",story:"秋の黄道十二星座の一つ。M2・M72という球状星団やNGC7293（らせん星雲）・NGC7009（土星状星雲）などの惑星状星雲を含む。ギリシャ神話では水を注ぐ美少年ガニュメデスの姿とされる。"},
{id:"Cap",name:"やぎ座",en:"Capricornus",abbr:"Cap",season:"autumn",months:[6,7,8,9,10,11],stars:"デネブ・アルゲディ・ダビ",story:"秋の黄道十二星座の一つ。ギリシャ神話では上半身が山羊、下半身が魚という奇妙な姿のパン神が変身した姿。M30（球状星団）を含む。"},
{id:"PsA",name:"みなみのうお座",en:"Piscis Austrinus",abbr:"PsA",season:"autumn",months:[7,8,9,10,11],stars:"フォーマルハウト",story:"「秋の一つ星」フォーマルハウトを含む星座。フォーマルハウトは「魚の口」を意味し、ハッブル宇宙望遠鏡で惑星系の証拠（塵のリング）が発見された。"},
{id:"Mic",name:"けんびきょう座",en:"Microscopium",abbr:"Mic",season:"autumn",months:[6,7,8,9,10,11],stars:"γ星・ε星",story:"1756年にラカイユが設定した近代的な星座。顕微鏡を表す。"},
{id:"Gru",name:"つる座",en:"Grus",abbr:"Gru",season:"autumn",months:[7,8,9,10,11],stars:"アルナイル・β星",story:"南天の星座。鶴を表す。日本では南の低空に見える。"},
{id:"Tuc",name:"きょしちょう座",en:"Tucana",abbr:"Tuc",season:"autumn",months:[8,9,10,11,12],stars:"α星・β星",story:"南天の星座。オオハシ（トゥーカン）を表す。小マゼラン雲と47 Tucanae（NGC104、全天2位の球状星団）を含む。"},
{id:"Ind",name:"インディアン座",en:"Indus",abbr:"Ind",season:"autumn",months:[7,8,9,10,11],stars:"α星・β星",story:"南天の星座。アメリカ先住民（インディアン）を表す。ε星は太陽に近い恒星（約11.8光年）。"},
{id:"Pav",name:"くじゃく座",en:"Pavo",abbr:"Pav",season:"summer",months:[5,6,7,8,9,10],stars:"ピーコック（α星）",story:"南天の星座。孔雀を表す。NGC6752（球状星団）を含む。"},
{id:"Ori",name:"オリオン座",en:"Orion",abbr:"Ori",season:"winter",months:[11,12,1,2,3,4],stars:"ベテルギウス・リゲル・ベラトリックス・アルニラム",story:"ギリシャ神話の狩人オリオン。女神アルテミスに愛されたが、兄アポロンの策略で射殺されたとも、大サソリに刺されて死んだとも伝えられる。三ツ星の並びは世界中の文化で特別な意味を持ち、エジプトのピラミッドとの対応も指摘されている。M42（オリオン大星雲）・M43・M78・IC434（馬頭星雲）を含む。"},
{id:"Tau",name:"おうし座",en:"Taurus",abbr:"Tau",season:"winter",months:[9,10,11,12,1,2,3,4],stars:"アルデバラン・エルナト",story:"冬の星座。M45（プレアデス星団・すばる）とM1（かに星雲）を含む。ギリシャ神話ではゼウスが白牛に変身した姿。アルデバランは「牛の目」を意味し、赤色巨星として有名。すばるは日本で古来から親しまれ、清少納言の枕草子にも登場する。"},
{id:"Gem",name:"ふたご座",en:"Gemini",abbr:"Gem",season:"winter",months:[10,11,12,1,2,3,4],stars:"ポルックス・カストル・アルヘナ",story:"冬の星座。双子の兄弟カストルとポルックスを表す。ポルックスは太陽系外惑星を持つことが確認されている。M35という美しい散開星団を含む。ギリシャ神話ではアルゴナウタイの英雄双子。"},
{id:"Aur",name:"ぎょしゃ座",en:"Auriga",abbr:"Aur",season:"winter",months:[9,10,11,12,1,2,3,4],stars:"カペラ・メンカリナン・マアズ",story:"冬の星座。カペラは「子山羊」を意味し、全天で6番目に明るい恒星。M36・M37・M38の三散開星団を含む観測の宝庫。ギリシャ神話では馬車を操る御者の姿で描かれる。"},
{id:"CMa",name:"おおいぬ座",en:"Canis Major",abbr:"CMa",season:"winter",months:[11,12,1,2,3],stars:"シリウス・アドハラ・ウェゼン",story:"全天最明星シリウスを含む冬の星座。シリウスは「焼き焦がすもの」という意味で、古代エジプトではナイル川の氾濫を予告する重要な星だった。M41という明るい散開星団を含む。"},
{id:"CMi",name:"こいぬ座",en:"Canis Minor",abbr:"CMi",season:"winter",months:[11,12,1,2,3,4],stars:"プロキオン・ゴメイサ",story:"冬の大三角の一角プロキオンを含む小さな星座。「犬の前を行くもの」という意味で、シリウスより先に昇ることから命名。ギリシャ神話ではオリオンの猟犬。"},
{id:"Mon",name:"いっかくじゅう座",en:"Monoceros",abbr:"Mon",season:"winter",months:[11,12,1,2,3,4],stars:"β星・α星",story:"1612年にプランシウスが設定した星座。一角獣（ユニコーン）を表す。天の川の中に位置し、M50などの散開星団を含む。NGC2244（バラ星雲）が有名。"},
{id:"Lep",name:"うさぎ座",en:"Lepus",abbr:"Lep",season:"winter",months:[11,12,1,2,3],stars:"アルネブ・ニハル",story:"オリオン座の足元に位置するうさぎを表す星座。ギリシャ神話ではオリオンが追う兎。M79（球状星団）を含む。"},
{id:"Pup",name:"とも座",en:"Puppis",abbr:"Pup",season:"winter",months:[11,12,1,2,3,4],stars:"ナオス・ζ星",story:"かつてのアルゴ座（アルゴ船）を分割した星座の一つ（船尾部分）。M46・M47・M93などの散開星団を含む。"},
{id:"Pyx",name:"らしんばん座",en:"Pyxis",abbr:"Pyx",season:"winter",months:[12,1,2,3,4,5],stars:"α星・β星",story:"かつてのアルゴ座（アルゴ船）を分割した星座の一つ（羅針盤部分）。1756年にラカイユが設定。"},
{id:"Car",name:"りゅうこつ座",en:"Carina",abbr:"Car",season:"winter",months:[11,12,1,2,3,4],stars:"カノープス・ミアプラキドゥス",story:"かつてのアルゴ座（アルゴ船）を分割した星座の一つ（竜骨部分）。全天2位の明るさを持つカノープスを含む。η星（イータ・カリーナ）は近い将来超新星爆発を起こす可能性がある超大質量星。"},
{id:"Vel",name:"ほ座",en:"Vela",abbr:"Vel",season:"winter",months:[11,12,1,2,3,4,5],stars:"γ星・δ星",story:"かつてのアルゴ座（アルゴ船）を分割した星座の一つ（帆部分）。NGC3132（南のリング星雲）を含む。"},
{id:"Pic",name:"がか座",en:"Pictor",abbr:"Pic",season:"winter",months:[11,12,1,2,3],stars:"α星・β星",story:"1756年にラカイユが設定した近代的な星座。画家のイーゼルを表す。β星（ベータ・ピクトリス）は惑星系の証拠が発見された有名な星。"},
{id:"Dor",name:"かじき座",en:"Dorado",abbr:"Dor",season:"winter",months:[10,11,12,1,2],stars:"α星・β星",story:"南天の星座。大マゼラン雲の大部分を含む。大マゼラン雲内のタランチュラ星雲（NGC2070）は肉眼で見える最大の星形成領域の一つ。"},
{id:"Ret",name:"レチクル座",en:"Reticulum",abbr:"Ret",season:"winter",months:[10,11,12,1,2],stars:"α星・β星",story:"1756年にラカイユが設定した近代的な星座。望遠鏡の接眼レンズの十字線（レチクル）を表す。"},
{id:"Men",name:"テーブルさん座",en:"Mensa",abbr:"Men",season:"winter",months:[10,11,12,1,2],stars:"α星",story:"1756年にラカイユが設定した近代的な星座。南アフリカのテーブル山を表す。全88星座の中で最も暗い星しか含まない星座。"},
{id:"Cen",name:"ケンタウルス座",en:"Centaurus",abbr:"Cen",season:"spring",months:[2,3,4,5,6,7],stars:"リギル・ケンタウルス（α星）・ハダル（β星）",story:"南天の大きな星座。α星リギル・ケンタウルスは太陽に最も近い恒星系（約4.24光年）。ギリシャ神話では賢い半人半馬のケンタウロス族の賢者ケイロン。NGC5128（ケンタウルスA）・ω星団（NGC5139）を含む。"},
{id:"Cru",name:"みなみじゅうじ座",en:"Crux",abbr:"Cru",season:"spring",months:[2,3,4,5,6,7],stars:"アクルックス・ミモサ・ガクルックス",story:"全88星座の中で最小の面積を持つ星座。南十字星として有名で、南半球の方位の基準として使われる。日本では沖縄の南端でかろうじて見える。"},
{id:"Lup",name:"おおかみ座",en:"Lupus",abbr:"Lup",season:"spring",months:[3,4,5,6,7,8],stars:"α星・β星",story:"南天の星座。ギリシャ神話ではケンタウロスが捧げる獣。1006年に出現した史上最も明るい超新星（SN 1006）がこの星座の方向に現れた。"},
{id:"Nor",name:"じょうぎ座",en:"Norma",abbr:"Nor",season:"summer",months:[4,5,6,7,8,9],stars:"γ星・ε星",story:"1756年にラカイユが設定した近代的な星座。大工の定規（直角定規）を表す。"},
{id:"Cir",name:"コンパス座",en:"Circinus",abbr:"Cir",season:"spring",months:[3,4,5,6,7],stars:"α星・β星",story:"1756年にラカイユが設定した近代的な星座。コンパス（製図用）を表す。全88星座の中で3番目に小さな星座。"},
{id:"Mus",name:"はえ座",en:"Musca",abbr:"Mus",season:"spring",months:[2,3,4,5,6,7],stars:"α星・β星",story:"南天の星座。ハエを表す。みなみじゅうじ座の近くに位置する。"},
{id:"Cha",name:"カメレオン座",en:"Chamaeleon",abbr:"Cha",season:"circumpolar",months:[1,2,3,4,5,6,7,8,9,10,11,12],stars:"α星・γ星",story:"南天の周極星座。カメレオンを表す。南極に近い位置にある。"},
{id:"Vol",name:"とびうお座",en:"Volans",abbr:"Vol",season:"spring",months:[11,12,1,2,3,4,5],stars:"β星・γ星",story:"南天の星座。飛び魚を表す。りゅうこつ座の近くに位置する。"},
{id:"TrA",name:"みなみのさんかく座",en:"Triangulum Australe",abbr:"TrA",season:"spring",months:[3,4,5,6,7,8],stars:"アトリア・β星",story:"南天の星座。南の三角形を表す。みなみじゅうじ座の近くに位置する。"},
{id:"Hyi",name:"みずへび座",en:"Hydrus",abbr:"Hyi",season:"circumpolar",months:[1,2,3,4,5,6,7,8,9,10,11,12],stars:"β星・α星",story:"南天の周極星座。小さな水蛇を表す。大マゼラン雲・小マゼラン雲の近くに位置する。"},
{id:"Oct",name:"はちぶんぎ座",en:"Octans",abbr:"Oct",season:"circumpolar",months:[1,2,3,4,5,6,7,8,9,10,11,12],stars:"ν星・δ星",story:"南天の周極星座。南極星（σ星）を含む。八分儀（オクタント）を表す。南極点に最も近い星座。"},
{id:"Aps",name:"ふうちょう座",en:"Apus",abbr:"Aps",season:"circumpolar",months:[1,2,3,4,5,6,7,8,9,10,11,12],stars:"α星・β星",story:"南天の周極星座。極楽鳥（フウチョウ）を表す。"},
];

// SEASON_LABELを先に定義
const SEASON_LABEL = {
  spring: "春",
  summer: "夏",
  autumn: "秋",
  winter: "冬",
  circumpolar: "周極（年中）"
};

/* =====================================================
88星座 天文・科学 / 神話・由来 解説
===================================================== */
const CONSTELLATION_TEXT = window.NICOLE_COMMON?.CONSTELLATION_TEXT||{
  "And": {
    "science": "アンドロメダ座で特に有名なのがM31「アンドロメダ銀河」です。約250万光年離れた巨大な渦巻銀河で、天の川銀河と同じ局所銀河群に属します。空の暗い場所では肉眼でも淡い光として見ることができ、γ星アルマクは色の対比が美しい二重星として知られています。",
    "myth": "アンドロメダは、エチオピア王ケフェウスと王妃カシオペヤの娘です。母の自慢が海神の怒りを買い、生贄として岩に鎖でつながれましたが、英雄ペルセウスに救われます。ケフェウス座、カシオペヤ座、ペルセウス座、くじら座も同じ物語につながっています。"
  },
  "Ant": {
    "science": "明るい星が少なく、肉眼では形をたどるのが難しい星座です。最も明るいα星でも4等級ほどですが、その方向にはポンプ座銀河団など多数の遠方銀河があり、大型望遠鏡では銀河の世界を観察できます。",
    "myth": "古代神話に由来する星座ではありません。18世紀にフランスの天文学者ラカーユが設定し、当時の科学技術を象徴する空気ポンプをモチーフにしました。"
  },
  "Aps": {
    "science": "明るい星は少ないものの、球状星団NGC 6101などを含みます。NGC 6101は多数の古い恒星が球状に集まった天体で、南天の深宇宙観測で興味深い対象です。",
    "myth": "16世紀末の南天観測から生まれた星座で、極楽鳥を表します。大航海時代にヨーロッパへ知られるようになった南方の珍しい動物が星座に取り入れられました。"
  },
  "Aqr": {
    "science": "M2やM72などの球状星団に加え、NGC 7293「らせん星雲」やNGC 7009「土星状星雲」といった惑星状星雲があります。太陽程度の質量を持つ恒星が最期にどのような姿を見せるかを観察できる星座です。",
    "myth": "水瓶から水を注ぐ人物として古代から描かれてきました。ギリシャ神話では、ゼウスに気に入られて神々の給仕役となった美少年ガニメデと結び付けられることがよくあります。"
  },
  "Aql": {
    "science": "α星アルタイルは約17光年の近距離にある恒星で、非常に速く自転しているため赤道方向に膨らんでいます。天の川の中に位置し、双眼鏡を向けると背景に非常に多くの恒星を見ることができます。",
    "myth": "ギリシャ神話では大神ゼウスに仕える鷲、あるいはゼウス自身が変身した鷲とされています。日本ではアルタイルが七夕の彦星として知られ、こと座のベガと対になっています。"
  },
  "Ara": {
    "science": "天の川の濃い領域にあり、多数の恒星や星団があります。NGC 6397は地球に比較的近い球状星団の一つで、古い恒星が高密度に集まっています。",
    "myth": "祭壇を表す古代星座です。ギリシャ神話では、神々が巨人族との戦いを前に勝利を誓い、供物を捧げた祭壇とされることがあります。"
  },
  "Ari": {
    "science": "α星ハマルはオレンジ色の巨星で、γ星メサルティムは望遠鏡で分離できる二重星です。約2000年前には春分点がこの星座にあり、天文学や暦の歴史でも重要な位置を占めます。",
    "myth": "ギリシャ神話の「金の羊毛」を持つ牡羊がモデルです。王子プリクソスを救った羊の毛皮は、後に英雄イアソンとアルゴ船の仲間たちが探し求める宝物となりました。"
  },
  "Aur": {
    "science": "1等星カペラは肉眼では一つに見えますが、実際には複数の恒星からなる星系です。M36・M37・M38という三つの散開星団があり、それぞれ異なる星の集まり方を楽しめます。",
    "myth": "馬車を操る御者を表します。ギリシャ神話のアテネ王エリクトニオスなどと結び付けられます。カペラは「小さな雌山羊」を意味し、幼いゼウスを育てた山羊アマルテイアとも関連付けられています。"
  },
  "Boo": {
    "science": "α星アルクトゥルスは約37光年離れたオレンジ色の巨星で、全天でも特に明るい恒星です。ε星イザールは色の対比が美しい二重星として知られています。",
    "myth": "名前には「牛を追う者」「牧夫」という意味があります。おおぐま座の熊を追う人物、あるいはカリストの息子アルカスなど、複数の神話と結び付けられています。"
  },
  "Cae": {
    "science": "全天でも特に暗い星座の一つで、肉眼で目立つ恒星はほとんどありません。そのため主な観測対象は背景の遠方銀河などで、星が空に均等に分布していないことも実感できます。",
    "myth": "18世紀にラカーユが設定し、彫刻や版画に使う「たがね」を表します。科学や芸術、技術の道具を星座にしたラカーユらしい近代星座です。"
  },
  "Cam": {
    "science": "広い面積を持つ一方で明るい星は少ない星座です。IC 342やNGC 2403などの銀河があり、双眼鏡では「ケンブルのカスケード」と呼ばれる星の連なりも楽しめます。",
    "myth": "17世紀初めにペトルス・プランシウスによって設定されました。キリンを表し、古代ギリシャ神話とは関係のない比較的新しい星座です。"
  },
  "Cnc": {
    "science": "星座自体は暗いものの、M44「プレセペ星団」が有名です。肉眼では淡い光の雲、双眼鏡では多数の星に分かれて見えます。M67は非常に古い散開星団で、恒星進化の研究にも使われます。",
    "myth": "ヘラクレスがヒュドラと戦っていた際、女神ヘラが送り込んだ巨大な蟹カルキノスとされています。蟹はヘラクレスに踏みつぶされますが、その働きを称えたヘラによって天に上げられたと伝えられます。"
  },
  "CVn": {
    "science": "M51「子持ち銀河」をはじめ、M63、M94、M106など多くの銀河があります。M51は二つの銀河が重力的に相互作用する姿を観察でき、銀河の衝突や進化を考える代表的な天体です。",
    "myth": "17世紀にヘベリウスが設定しました。うしかい座の人物が連れている2匹の猟犬を表し、それぞれアステリオンとカーラという名が付けられています。"
  },
  "CMa": {
    "science": "α星シリウスは約8.6光年の距離にあり、夜空で最も明るく見える恒星です。白色矮星の伴星シリウスBを持ち、M41は双眼鏡や低倍率の望遠鏡で楽しめる散開星団です。",
    "myth": "狩人オリオンが連れていた猟犬の一匹とされることが一般的です。シリウスは古代エジプトでも重要視され、その出現はナイル川の増水時期を知る目印になりました。"
  },
  "CMi": {
    "science": "α星プロキオンは約11.5光年と近い恒星で、白色矮星を伴う連星系です。名前には「犬より先に」という意味があり、シリウスより先に昇ることに由来するとされています。",
    "myth": "おおいぬ座とともに狩人オリオンに付き従う犬として描かれることが多い星座です。ただし古代の伝承には複数の解釈があり、その正体は一つに定まっていません。"
  },
  "Cap": {
    "science": "α星付近は肉眼でも二つの星に見え、β星ダビーも複雑な多重星系です。M30は非常に古い恒星からなる球状星団で、太陽や月、惑星が通る黄道上にも位置します。",
    "myth": "上半身が山羊、下半身が魚という姿で描かれます。ギリシャ神話では牧神パンやアイギパンと結び付けられ、怪物から逃れるため水中へ飛び込んだ際に下半身が魚になったという伝説があります。"
  },
  "Car": {
    "science": "α星カノープスは全天でシリウスに次いで明るく見える恒星です。イータ・カリーナ星雲は巨大な星形成領域で、その中心のηカリーナは非常に大質量で高光度の恒星系です。",
    "myth": "かつての巨大星座「アルゴ船座」の一部で、船の竜骨を表します。アルゴ船は英雄イアソンたちが金の羊毛を求める冒険に使った船で、近代になって複数の星座へ分割されました。"
  },
  "Cas": {
    "science": "天の川の中にあり、M52やNGC 457など多くの散開星団があります。1572年には超新星が出現し、ティコ・ブラーエの観測によって「天上界は不変」という当時の考えを覆す重要な証拠となりました。",
    "myth": "エチオピア王妃カシオペヤを表します。自分や娘アンドロメダの美しさを海の精より上だと自慢したため海神の怒りを買い、国に災いを招いたとされています。"
  },
  "Cen": {
    "science": "αケンタウリは太陽系に最も近い恒星系で、その一員プロキシマ・ケンタウリは約4.24光年の距離にあります。ωケンタウリは天の川銀河で最大級の球状星団で、電波銀河ケンタウルスAも有名です。",
    "myth": "半人半馬のケンタウロスを表す古代星座です。後世には医学や音楽に優れた賢者ケイロンと結び付けられることがありますが、古代の伝承では必ずしもケイロン本人とは限りません。"
  },
  "Cep": {
    "science": "δ星デルタ・ケフェイは「ケフェイド変光星」の代表で、変光周期と本来の明るさの関係を使って遠方天体までの距離を測れます。μ星は非常に赤い赤色超巨星で「ガーネット・スター」とも呼ばれます。",
    "myth": "エチオピア王ケフェウスを表し、カシオペヤの夫、アンドロメダの父に当たります。妻の発言によって国が災いに見舞われ、娘を生贄に差し出すことになります。"
  },
  "Cet": {
    "science": "ο星ミラは長い周期で明るさが大きく変化するミラ型変光星の代表です。M77は活動銀河核を持つ銀河で、中心の巨大ブラックホールへ物質が落ち込むことで強いエネルギーを放っています。",
    "myth": "日本語では「くじら座」ですが、ギリシャ神話では王女アンドロメダを襲う海の怪物ケートスを表します。現代的なクジラというより怪獣に近い存在です。"
  },
  "Cha": {
    "science": "周辺にはカメレオン分子雲と呼ばれる低温のガスや塵の雲があり、現在も新しい恒星が誕生しています。比較的近距離にある星形成領域として研究されています。",
    "myth": "大航海時代に設定された南天星座で、カメレオンを表します。古代ギリシャ神話とは関係なく、南方で知られた珍しい動物がモチーフです。"
  },
  "Cir": {
    "science": "明るい星は少ないものの、その方向には活動銀河「コンパス座銀河」があります。中心の巨大ブラックホール周辺で激しい活動が起こり、強い電波やX線を放射しています。",
    "myth": "18世紀にラカーユが設定しました。ここでいうコンパスは方角を示す磁気コンパスではなく、円を描く製図用コンパスを意味します。"
  },
  "Col": {
    "science": "α星ファクトや球状星団NGC 1851があります。NGC 1851は多数の古い恒星が高密度に集まった天体で、星団内部に複数の恒星集団が存在する可能性も研究されています。",
    "myth": "16世紀ごろに設定された比較的新しい星座です。旧約聖書の「ノアの方舟」で陸地の出現を知らせた鳩、あるいはアルゴ船を導いた鳩と結び付けられることがあります。"
  },
  "Com": {
    "science": "肉眼では淡い星がまとまって見える「かみのけ座星団」が特徴です。M64「黒眼銀河」など多数の銀河があり、さらにその奥には巨大なかみのけ座銀河団があります。",
    "myth": "紀元前3世紀のエジプト王妃ベレニケ2世の髪を表します。夫の無事を祈って髪を神殿に捧げたところ姿を消し、「神々が天に上げた」と説明されたという伝説があります。"
  },
  "CrA": {
    "science": "周辺にはR Coronae Australisを中心とする星形成領域があります。暗黒星雲や反射星雲の中で若い恒星が形成されており、恒星誕生の現場を観察できる領域です。",
    "myth": "古代から知られる星座ですが、特定の一つの神話には明確に対応していません。冠や花輪として描かれ、北天のかんむり座に対応する「南の冠」として現在の名称が使われています。"
  },
  "CrB": {
    "science": "α星アルフェッカを中心に半円形の美しい星の並びをつくります。T Coronae Borealisは数十年規模で突然明るくなる「回帰新星」として知られています。",
    "myth": "ギリシャ神話ではクレタ島の王女アリアドネの冠とされています。英雄テセウスに見捨てられた彼女を酒神ディオニュソスが迎え、贈った冠が天に上げられたと伝えられます。"
  },
  "Crv": {
    "science": "四つの比較的明るい星が特徴的な形をつくります。NGC 4038・4039「アンテナ銀河」は二つの銀河が衝突している代表例で、星形成が活発に起こっています。",
    "myth": "太陽神アポロンに仕えるカラスとされています。水を汲むよう命じられたカラスが寄り道をし、蛇のせいにして嘘をついたため、アポロンがカラス・杯・蛇をまとめて天に置いたという物語があります。"
  },
  "Crt": {
    "science": "明るい恒星や大型の星雲・星団は少ない一方、背景にはNGC 3887など多数の銀河があります。肉眼では地味な領域でも、その奥に無数の銀河が存在していることを実感できます。",
    "myth": "杯を表す古代星座で、からす座・うみへび座と同じアポロンの物語に登場します。カラスが水を汲むために持たされた杯とされています。"
  },
  "Cru": {
    "science": "88星座で最も面積が小さい星座です。α星アクルックスは複数の恒星からなる星系で、近くにはNGC 4755「宝石箱星団」と暗黒星雲「コールサック」があります。",
    "myth": "現在の星座として独立したのは比較的新しく、もともとはケンタウルス座の一部でした。大航海時代に南半球の航海で重要な目印となり、十字形の星の並びが独立した星座として定着しました。"
  },
  "Cyg": {
    "science": "α星デネブは非常に遠方にありながら1等星として見える超巨星です。アルビレオ、北アメリカ星雲、網状星雲、X線連星はくちょう座X-1など、多様な天体が集まっています。",
    "myth": "白鳥を表す古代星座で、複数の神話があります。大神ゼウスが白鳥に変身した姿とする話や、親友を失った人物が白鳥になったという話などが伝えられています。"
  },
  "Del": {
    "science": "小さな星座ですが、四つの星がまとまった特徴的な形をしています。γ星は望遠鏡で楽しめる二重星で、球状星団NGC 6934もあります。",
    "myth": "ギリシャ神話では、海へ投げ出された音楽家アリオンをイルカが背中に乗せて救ったという伝説が有名です。その功績を称えてイルカが星座になったとされています。"
  },
  "Dor": {
    "science": "大マゼラン雲の主要部分があり、その内部の「タランチュラ星雲」は局所銀河群最大級の星形成領域です。1987年には超新星SN 1987Aが出現し、現代天文学に大きな影響を与えました。",
    "myth": "大航海時代につくられた南天星座で、大型の海水魚を表します。熱帯の海で航海者たちが目にした生物が星空に取り入れられました。"
  },
  "Dra": {
    "science": "α星トゥバンは約5000年前には北極星に近い位置にありました。NGC 6543「キャッツアイ星雲」は複雑な構造を持つ美しい惑星状星雲です。",
    "myth": "ギリシャ神話では、ヘスペリデスの園の黄金のリンゴを守っていた竜ラドンと結び付けられています。ヘラクレスの十二の功業にも登場します。"
  },
  "Equ": {
    "science": "全天で2番目に面積が小さい星座です。明るい星や有名な深宇宙天体は少なく、その小ささ自体が88星座を比較する際の特徴になっています。",
    "myth": "名前は「小さな馬」を意味します。古代からある星座ですが、その馬が誰なのかについては複数の説があり、一つの神話には定まっていません。"
  },
  "Eri": {
    "science": "α星アケルナルは非常に高速で自転し、赤道方向が大きく膨らんでいます。εエリダニは約10.5光年と近く、惑星系や塵円盤の研究対象として知られています。",
    "myth": "大河エリダヌスを表します。ギリシャ神話では、太陽神ヘリオスの息子パエトンが太陽の戦車を暴走させ、ゼウスの雷で撃ち落とされた際に落ちた川と結び付けられています。"
  },
  "For": {
    "science": "ろ座銀河団と呼ばれる比較的近い銀河団があります。NGC 1365は棒渦巻銀河の代表例で、中心には活動中の巨大ブラックホールがあります。",
    "myth": "18世紀にラカーユが設定した星座で、化学実験などに使われる炉を表します。当時発展しつつあった科学や実験技術を象徴する星座の一つです。"
  },
  "Gem": {
    "science": "α星カストルは肉眼では一つですが、実際には六つの恒星からなる複雑な多重星系です。β星ポルックスには太陽系外惑星が確認され、M35は美しい散開星団です。",
    "myth": "双子の兄弟カストルとポルックスを表します。カストルが命を落とした際、不死身だったポルックスは兄弟と離れることを望まず、ゼウスによって二人とも天へ上げられたと伝えられています。"
  },
  "Gru": {
    "science": "α星アルナイルが明るく目立ちます。周辺には複数の銀河からなる「つる座銀河群」もあり、望遠鏡でははるか遠方の銀河の世界を見ることができます。",
    "myth": "16世紀末に南天で設定された比較的新しい星座で、鶴を表します。古代ギリシャの48星座には含まれていません。"
  },
  "Her": {
    "science": "M13「ヘルクレス座大球状星団」は数十万個もの恒星が集まる巨大な球状星団です。1974年にはアレシボ電波望遠鏡からM13方向へ「アレシボ・メッセージ」が送信されました。",
    "myth": "ギリシャ神話最大級の英雄ヘラクレスを表します。十二の功業では、しし座やうみへび座のモデルとなった怪物とも戦いました。"
  },
  "Hor": {
    "science": "明るい恒星は少ないものの、球状星団NGC 1261などがあります。また遠方には巨大な銀河の集まりもあり、宇宙の大規模構造を研究する対象になります。",
    "myth": "18世紀にラカーユが設定し、振り子時計を表します。正確な時計は天体観測や航海に不可欠であり、近代科学を象徴する道具の一つでした。"
  },
  "Hya": {
    "science": "88星座で最も面積が大きい星座です。M48、M68、M83などさまざまな天体があり、NGC 3242「木星状星雲」も比較的見やすい惑星状星雲です。",
    "myth": "ヘラクレスが戦った怪物ヒュドラとされています。複数の頭を持ち、一つ切り落とすと新しい頭が生えるため、ヘラクレスは切り口を焼きながら退治しました。"
  },
  "Hyi": {
    "science": "南天の極に近く、明るい星は多くありません。β星は太陽に比較的似た性質を持つ恒星として研究されています。",
    "myth": "大航海時代につくられた星座で、水蛇を表します。古代のうみへび座Hydraとは別の星座で、特定のギリシャ神話には由来しません。"
  },
  "Ind": {
    "science": "ε星は約12光年と比較的近い恒星系で、褐色矮星を含むことでも知られています。近傍恒星から遠方銀河まで多様な天体があります。",
    "myth": "16世紀末に設定された南天星座です。当時のヨーロッパ人が航海で出会った「異国の先住民」を人物像として星座にしたもので、大航海時代の世界観を反映しています。"
  },
  "Lac": {
    "science": "天の川の中にあり、散開星団などがあります。「BL Lacertae」は、中心の巨大ブラックホールから強力なジェットをこちらへ向けている活動銀河「BL Lac天体」の名前の由来です。",
    "myth": "17世紀にヘベリウスが設定した星座で、トカゲを表します。古代神話との特別な関係はありません。"
  },
  "Leo": {
    "science": "α星レグルスは非常に速く自転し、赤道方向が膨らんでいます。M65・M66・NGC 3628は「しし座の三つ子銀河」と呼ばれ、複数の銀河を同じ領域で観察できます。",
    "myth": "ヘラクレスの十二の功業で最初に登場する「ネメアの獅子」を表します。どんな武器も通さない毛皮を持ち、ヘラクレスは最後には素手で絞め殺しました。"
  },
  "LMi": {
    "science": "明るい星や大型の星雲・星団は少ないものの、NGC 3344など美しい渦巻銀河があります。最も明るい星には「プラエキプア」という固有名があります。",
    "myth": "17世紀にヘベリウスが設定しました。しし座の近くにいる「小さな獅子」を表し、独自の古代神話はありません。"
  },
  "Lep": {
    "science": "M79は球状星団としては珍しく天の川銀河中心とは反対方向にあります。R Leporisは非常に赤い炭素星で「ハインドのクリムゾン・スター」と呼ばれています。",
    "myth": "オリオン座の足元に描かれるウサギです。狩人オリオンや猟犬であるおおいぬ座・こいぬ座に追われる獲物として星図に描かれることが多い星座です。"
  },
  "Lib": {
    "science": "α星ズベン・エル・ゲヌビは双眼鏡でも分離しやすい二重星です。星名に「南の爪」「北の爪」という意味が残るのは、かつてこの領域がさそり座の爪とされていた名残です。",
    "myth": "正義の女神が持つ天秤と結び付けられています。古代にはさそり座の一部でしたが、後に独立しました。黄道十二星座の中で唯一、生物ではなく道具を表します。"
  },
  "Lup": {
    "science": "周辺には若い恒星が生まれている「おおかみ座分子雲」があります。また西暦1006年に出現した超新星SN 1006の残骸もあり、記録上きわめて明るかった超新星として知られます。",
    "myth": "古代には必ずしも狼と決まっておらず、ケンタウルス座の人物が持つ野生動物や生贄として描かれていました。後に狼として解釈されるようになりました。"
  },
  "Lyn": {
    "science": "非常に暗い星が多い星座です。NGC 2419は天の川銀河の外縁にある遠方の球状星団で、「銀河間放浪者」と呼ばれることもあります。",
    "myth": "17世紀にヘベリウスが設定しました。暗い星ばかりで見つけにくいため「ヤマネコのような鋭い目が必要」という発想から名付けられたと伝えられています。"
  },
  "Lyr": {
    "science": "α星ベガは約25光年と近く、恒星の明るさを測る基準として重要な役割を果たしてきました。ε星は「ダブル・ダブルスター」、M57は代表的な惑星状星雲です。",
    "myth": "音楽の名手オルフェウスの竪琴を表します。彼の奏でる音は人間だけでなく動物や木々まで魅了したとされ、死後その竪琴が天に上げられたと伝えられます。"
  },
  "Men": {
    "science": "全天でも特に暗い星座の一つですが、大マゼラン雲の一部がこの星座にかかっています。肉眼の星座としては地味でも、実際には一つの銀河そのものを含む領域です。",
    "myth": "18世紀にラカーユが設定し、南アフリカのケープタウン近郊にあるテーブル山にちなんで名付けました。88星座でも珍しく、実在する山を直接モチーフにしています。"
  },
  "Mic": {
    "science": "AU Microscopiiは若い赤色矮星で、周囲には塵の円盤と複数の惑星が確認されています。若い惑星系がどのように形成・進化するかを研究する重要な対象です。",
    "myth": "18世紀にラカーユが設定し、顕微鏡を表します。人間の目だけでは見えない世界を明らかにする近代科学の象徴として星座になりました。"
  },
  "Mon": {
    "science": "星座自体に非常に明るい恒星はありませんが、ばら星雲、コーン星雲、クリスマスツリー星団など星形成領域が豊富です。M50も美しい散開星団です。",
    "myth": "17世紀に設定された比較的新しい星座で、伝説上の動物ユニコーンを表します。古代ギリシャの星座ではありません。"
  },
  "Mus": {
    "science": "天の川に近く、球状星団NGC 4833などがあります。暗黒星雲もあり、星が存在しないように見える黒い領域にも大量のガスや塵があることが分かります。",
    "myth": "大航海時代につくられた南天星座です。当初は蜂と呼ばれた時期もありましたが、後に「蝿」を意味するMuscaが定着しました。"
  },
  "Nor": {
    "science": "天の川の濃い領域にあり、多くの恒星や散開星団があります。その向こうには巨大なじょうぎ座銀河団があり、「グレート・アトラクター」と呼ばれる大規模構造の研究でも重要です。",
    "myth": "18世紀にラカーユが設定し、直角を測る定規や製図用具を表します。精密な測定を象徴する科学・技術系の星座です。"
  },
  "Oct": {
    "science": "南天の天の極を含む星座です。σ星は南極星に近い位置にありますが、北極星ほど明るくないため目印としては使いにくい星です。",
    "myth": "18世紀にラカーユが設定しました。八分儀は天体の高度など角度を測る航海・天文観測用の器具です。"
  },
  "Oph": {
    "science": "多数の球状星団があり、太陽系に比較的近いバーナード星もあります。1604年には「ケプラーの超新星」が出現しました。黄道上に位置しますが、伝統的な黄道十二星座には含まれていません。",
    "myth": "医術の神アスクレピオスが蛇を持つ姿とされています。死者を蘇らせるほどの医術を身につけたためゼウスに雷で撃たれ、その後才能を惜しまれて星座になったと伝えられています。"
  },
  "Ori": {
    "science": "赤いベテルギウスと青白いリゲルという、性質の大きく異なる二つの明るい星があります。M42オリオン大星雲では現在もガスや塵から新しい恒星が誕生しています。",
    "myth": "オリオンはギリシャ神話に登場する腕自慢の狩人です。大サソリに刺されて命を落としたという伝説が有名で、星空でもオリオン座とさそり座は離れた位置に置かれています。"
  },
  "Pav": {
    "science": "α星ピーコックは青白い明るい恒星です。NGC 6752は地球に比較的近い大型の球状星団で、非常に多くの古い恒星が密集しています。",
    "myth": "大航海時代に設定された星座で、孔雀を表します。古代星座ではありませんが、孔雀そのものはギリシャ神話では女神ヘラの聖鳥として知られています。"
  },
  "Peg": {
    "science": "M15は高密度な球状星団です。また51番星は、太陽に似た恒星の周囲で太陽系外惑星が発見された代表的な星として天文学史上重要です。",
    "myth": "翼を持つ天馬ペガサスを表します。英雄ペルセウスが怪物メドゥーサを倒した際、その血から生まれたとされています。"
  },
  "Per": {
    "science": "β星アルゴルは食変光星の代表で、二つの恒星が互いを隠すことで周期的に明るさが変わります。h・χ二重星団やNGC 1499「カリフォルニア星雲」も有名です。",
    "myth": "英雄ペルセウスを表します。メドゥーサを退治した帰路、海の怪物への生贄となっていたアンドロメダを救い、後に妻としました。"
  },
  "Phe": {
    "science": "α星アンカーが最も明るい恒星です。周辺には矮小銀河や遠方の巨大銀河団もあり、宇宙の大規模構造を見る方向でもあります。",
    "myth": "16世紀末に設定された南天星座で、不死鳥フェニックスを表します。炎に包まれて死に、灰の中から再び生まれる再生の象徴です。"
  },
  "Pic": {
    "science": "β星ベータ・ピクトリスは若い恒星で、周囲に巨大な塵の円盤と複数の太陽系外惑星があります。惑星系形成を研究する代表的な天体です。",
    "myth": "18世紀にラカーユが設定しました。もともとは「画家のイーゼル」を意味し、絵を描くための画架や道具を表しています。"
  },
  "Psc": {
    "science": "M74は正面から見た美しい渦巻銀河として知られています。現在の春分点はこの星座の領域にあり、地球の歳差運動によって約2000年前のおひつじ座から移動してきました。",
    "myth": "二匹の魚が紐で結ばれた姿です。怪物テュポンから逃れるため、女神アフロディーテと息子エロスが魚に姿を変え、離れないよう互いを紐で結んだという伝説があります。"
  },
  "PsA": {
    "science": "α星フォーマルハウトは約25光年の近距離にある若い恒星で、周囲には塵でできたリング構造があります。惑星系の形成・進化を研究する重要な対象です。",
    "myth": "古代から知られる大きな魚の星座です。みずがめ座が水瓶から流す水を口で受けている姿として描かれます。"
  },
  "Pup": {
    "science": "M46とM47という性格の異なる散開星団があります。M46の方向には惑星状星雲NGC 2438も重なって見え、ζ星ナオスは非常に高温で明るい大質量星です。",
    "myth": "かつての巨大星座「アルゴ船座」を分割してできた星座で、船の船尾部分を表します。アルゴ船はイアソンたちが金の羊毛を求めて航海した船です。"
  },
  "Pyx": {
    "science": "T Pyxidisは爆発を繰り返す「回帰新星」として知られています。白色矮星が伴星から物質を受け取り、その表面で核融合爆発が起こる現象です。",
    "myth": "18世紀にラカーユが設定し、航海用の磁気コンパスを表します。近くにアルゴ船由来の星座がありますが、らしんばん座自体は古代のアルゴ船座には含まれていませんでした。"
  },
  "Ret": {
    "science": "ζ星は太陽系から比較的近い二重星系です。NGC 1313など星形成活動の盛んな銀河もあり、近傍恒星から遠方銀河まで多様な対象があります。",
    "myth": "18世紀にラカーユが設定しました。レチクルとは望遠鏡の接眼部などに入れる目盛りや網線で、天体位置を精密に測る道具です。"
  },
  "Sge": {
    "science": "88星座でも特に小さな星座です。M71は球状星団に分類される星の集まりで、天の川の中にあるため背景にも多数の恒星が見えます。",
    "myth": "一本の矢を表す古代星座です。ヘラクレスの矢、アポロンの矢、エロスの矢など複数の解釈があり、一つの神話には定まっていません。"
  },
  "Sgr": {
    "science": "この方向には天の川銀河の中心があり、超大質量ブラックホール「いて座A*」が存在します。M8、M17、M20、M22など星雲・星団が密集し、銀河中心から星形成まで観察できます。",
    "myth": "弓を引く半人半馬の射手として描かれます。後世には賢者ケイロンとされることもありますが、クロトスとする説もあります。"
  },
  "Sco": {
    "science": "α星アンタレスは太陽の数百倍の直径を持つ赤色超巨星です。M4、M6、M7などの星団があり、強力なX線源さそり座X-1もあります。",
    "myth": "狩人オリオンを倒した巨大なサソリとされています。オリオンが地上のすべての動物を倒せると豪語したため、大地の女神がサソリを送り込んだという物語があります。"
  },
  "Scl": {
    "science": "NGC 253「ちょうこくしつ座銀河」は比較的近い大型銀河で、活発な星形成が行われています。ちょうこくしつ座矮小銀河も天の川銀河の伴銀河の一つです。",
    "myth": "18世紀にラカーユが設定しました。もともとは「彫刻家のアトリエ」を意味し、彫像や制作道具を含む姿として描かれていました。"
  },
  "Sct": {
    "science": "天の川の非常に濃い領域にあり「たて座スタークラウド」があります。M11「野鴨星団」は非常に星数の多い散開星団で、望遠鏡では無数の星が密集して見えます。",
    "myth": "17世紀にヘベリウスが設定し、ポーランド王ヤン3世ソビエスキーの盾を記念したものです。実在した人物の功績と深く関係する珍しい星座です。"
  },
  "Ser": {
    "science": "88星座で唯一、へびつかい座によって頭と尾の二領域に分かれています。M5やM16「わし星雲」があり、わし星雲の「創造の柱」は新しい星が誕生している領域として有名です。",
    "myth": "医神アスクレピオスが手に持つ蛇を表します。蛇の脱皮は古くから再生や生命力の象徴とされ、医術とも深く結び付けられてきました。"
  },
  "Sex": {
    "science": "肉眼では暗い星座ですが、NGC 3115「スピンドル銀河」などがあります。Sextans A、Sextans Bという矮小銀河もあり、近傍銀河の進化や星形成の研究対象です。",
    "myth": "17世紀にヘベリウスが設定しました。自身が天体観測に愛用していた六分儀を表し、火災で観測機器を失った経験とも関連するとされています。"
  },
  "Tau": {
    "science": "M45「プレアデス星団」とヒアデス星団があります。α星アルデバランはヒアデスと同じ方向に見えますが実際には手前の星です。M1「かに星雲」は1054年の超新星残骸で、中心にパルサーがあります。",
    "myth": "大神ゼウスが王女エウロペに近づくため変身した白い牡牛とされています。エウロペを背に乗せて海を渡りクレタ島へ連れて行ったという物語です。"
  },
  "Tel": {
    "science": "明るい恒星は少ないものの、球状星団NGC 6584などがあります。星座そのものは目立たなくても、望遠鏡を使えば遠方銀河など多様な天体を観察できます。",
    "myth": "18世紀にラカーユが設定し、望遠鏡を表します。望遠鏡によって月の地形や木星の衛星、銀河など、それまで知られていなかった宇宙が次々と発見されました。"
  },
  "Tri": {
    "science": "M33「さんかく座銀河」は約270万光年離れた渦巻銀河で、天の川銀河やアンドロメダ銀河とともに局所銀河群を代表する大型銀河です。非常に暗い空では肉眼で見えることもあります。",
    "myth": "三つの星がつくる単純な三角形を表す古代星座です。ギリシャ文字のデルタや、三角形に近い形のシチリア島と結び付けられることがあります。"
  },
  "TrA": {
    "science": "三つの比較的明るい星がはっきりした三角形をつくります。散開星団NGC 6025などがあり、双眼鏡や小型望遠鏡でも星の集まりを楽しめます。",
    "myth": "16世紀末の南天観測から生まれた星座です。北天のさんかく座に対応する「南の三角形」として名付けられ、特定の神話はありません。"
  },
  "Tuc": {
    "science": "小マゼラン雲があることで有名です。また47 Tucanaeは非常に大きく明るい球状星団で、数十万から百万個規模の恒星が集まっています。",
    "myth": "大航海時代につくられた星座で、南米などに生息する大きなくちばしを持つ鳥オオハシを表します。"
  },
  "UMa": {
    "science": "北斗七星はおおぐま座の一部です。ミザールとアルコルは肉眼で分離でき、M81・M82・M101など多くの有名な銀河もあります。",
    "myth": "ギリシャ神話では、美しい女性カリストが女神ヘラの怒りによって熊の姿に変えられた物語と結び付けられています。後に息子アルカスとともに天へ上げられたとされています。"
  },
  "UMi": {
    "science": "α星ポラリスは現在の地球の自転軸の延長方向に近いため、他の星がその周囲を回るように見えます。ポラリス自身はケフェイド変光星で、複数の恒星からなる星系です。",
    "myth": "おおぐま座のカリストの息子アルカスとされることが多い星座です。熊となった母を知らずに狩ろうとしたアルカスを見たゼウスが、親子をともに天へ上げたと伝えられています。"
  },
  "Vel": {
    "science": "ほ座超新星残骸が広がり、その中心付近には高速回転する中性子星「ほ座パルサー」があります。γ星は非常に明るいウォルフ・ライエ星を含む恒星系です。",
    "myth": "巨大星座アルゴ船座の一部で、船の帆を表します。英雄イアソンとアルゴナウタイが金の羊毛を求めて航海したアルゴ船の帆に当たります。"
  },
  "Vir": {
    "science": "α星スピカは肉眼では一つですが、高温の恒星からなる連星系です。おとめ座銀河団にはM87など多数の銀河があり、M87中心の巨大ブラックホールは2019年に初めて影が画像化されました。",
    "myth": "乙女の姿をした古代星座で、正義の女神アストレア、農業の女神デメテル、その娘ペルセポネなど複数の女神と結び付けられてきました。"
  },
  "Vol": {
    "science": "NGC 2442は重力的な影響によって渦巻腕が大きく歪んだ銀河で、「ミートフック銀河」と呼ばれることもあります。銀河が相互作用によって姿を変える例です。",
    "myth": "16世紀末の南天観測から生まれた星座で、海面から飛び出して滑空するトビウオを表します。大航海時代の船乗りに身近だった海洋生物が星座になった例です。"
  },
  "Vul": {
    "science": "M27「亜鈴状星雲」は最初に発見された惑星状星雲として知られています。また1967年に最初に発見されたパルサーも、こぎつね座の方向にあります。",
    "myth": "17世紀にヘベリウスが設定しました。当初は「ガチョウをくわえた小さなキツネ」という意味の名称で、後にガチョウの部分が省かれて現在のこぎつね座だけが残りました。"
  }
};

function enrichConstellationData(list) {
  return list.map(c => {
    const baseStory = c.story || "";
    const extra = CONSTELLATION_TEXT[c.id] || {};

    const science =
      extra.science ||
      c.science ||
      `${c.name}の主な星は ${c.stars || "—"} です。${baseStory}`;

    const myth =
      extra.myth ||
      c.myth ||
      baseStory;

    return { ...c, science, myth };
  });
}

const CONSTELLATIONS_ENRICHED = enrichConstellationData(CONSTELLATIONS);

const CONST_COORD=window.NICOLE_COMMON?.CONST_COORD||{
UMa:[165,55],UMi:[220,77],Dra:[240,65],Cas:[15,60],Cep:[330,68],Cam:[75,70],
Lyn:[120,47],Cnc:[130,20],Leo:[160,18],LMi:[155,33],Vir:[195,0],Com:[195,22],CVn:[195,40],
Boo:[218,30],CrB:[235,30],Ser:[240,5],Lib:[230,-15],Hya:[150,-15],Crt:[172,-15],
Crv:[185,-18],Ant:[155,-33],Sex:[155,0],Her:[255,30],Oph:[260,-5],Sco:[248,-30],
Sgr:[285,-28],CrA:[285,-40],Tel:[285,-50],Ara:[255,-55],Sct:[282,-9],Aql:[295,3],
Sge:[298,18],Vul:[300,25],Lyr:[283,38],Cyg:[308,42],Del:[309,13],Equ:[318,8],
And:[15,40],Per:[52,48],Peg:[340,20],Tri:[32,32],Ari:[38,20],Psc:[15,10],
Cet:[25,-10],Phe:[15,-48],Scl:[10,-32],For:[45,-30],Eri:[60,-25],Hor:[45,-55],
Cae:[70,-38],Col:[85,-35],Lac:[338,45],Aqr:[335,-10],Cap:[315,-18],PsA:[340,-30],
Mic:[315,-37],Gru:[335,-47],Tuc:[0,-63],Ind:[315,-55],Pav:[290,-63],Ori:[83,3],
Tau:[65,18],Gem:[105,25],Aur:[85,42],CMa:[105,-22],CMi:[113,6],Mon:[103,0],
Lep:[83,-20],Pup:[118,-32],Pyx:[133,-30],Car:[130,-60],Vel:[145,-47],Pic:[85,-53],
Dor:[75,-60],Ret:[57,-60],Men:[75,-78],Cen:[190,-47],Cru:[187,-60],Lup:[230,-42],
Nor:[245,-52],Cir:[220,-63],Mus:[190,-70],Cha:[165,-78],Vol:[115,-70],TrA:[240,-65],
Hyi:[35,-72],Oct:[0,-82],Aps:[250,-75]
};

/* =====================================================
恒星・二重星データベース（SIMBAD/Hipparcos に基づく）
===================================================== */
const STARS_DB=window.NICOLE_COMMON?.STARS_DB||[
{id:"Sirius",name:"シリウス（おおいぬ座α）",type:"star",icon:"⭐",cat:"恒星",ra:101.2872,dec:-16.7161,mag:-1.46,dist:"約8.6光年",size:"直径約238万km",scope:"肉眼〜低倍率",highlight:"全天最明星。白色矮星の伴星を持つ",months:[11,12,1,2,3,4],story:`<div class="story-topic"><h4>概要</h4><p>シリウス（おおいぬ座α）は、全天最明星。白色矮星の伴星を持つ天体です。距離は約8.6光年。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>肉眼で位置と色を確かめるのが基本です。望遠鏡では恒星自体は点像なので、倍率を上げるよりも色・瞬き・周囲の星並びを楽しむのが向いています。目安は肉眼〜低倍率です。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>主星シリウスAと白色矮星シリウスBからなる連星系です。Bは恒星が核融合を終えた後に残る高密度な天体で、恒星進化を考えるうえで重要な実例です。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>古代から非常に目立つ星として知られ、英名 Sirius はギリシャ語の「焼き焦がすもの」に由来するとされます。</p></div>`},
{id:"Canopus",name:"カノープス（りゅうこつ座α）",type:"star",icon:"⭐",cat:"恒星",ra:95.9879,dec:-52.6957,mag:-0.74,dist:"約310光年",size:"直径約7,200万km",scope:"肉眼",highlight:"全天2位の明るさ。日本では南の低空に見える",months:[11,12,1,2,3],story:`<div class="story-topic"><h4>概要</h4><p>カノープス（りゅうこつ座α）は、全天2位の明るさ。日本では南の低空に見える天体です。距離は約310光年。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>肉眼で位置と色を確かめるのが基本です。望遠鏡では恒星自体は点像なので、倍率を上げるよりも色・瞬き・周囲の星並びを楽しむのが向いています。目安は肉眼です。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>黄白色の明るい巨星で、シリウスより遠方にありながら全天2位の明るさに見えるほど本来の光度が大きい星です。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>日本や中国では南の低空に現れる「老人星」「南極老人星」と結び付けられ、長寿の象徴として扱われてきました。</p></div>`},
{id:"Arcturus",name:"アルクトゥルス（うしかい座α）",type:"star",icon:"🟠",cat:"恒星",ra:213.9153,dec:19.1822,mag:-0.05,dist:"約37光年",size:"直径約3,600万km",scope:"肉眼",highlight:"北天最明星。春の大曲線の中間点",months:[2,3,4,5,6,7,8],story:`<div class="story-topic"><h4>概要</h4><p>アルクトゥルス（うしかい座α）は、北天最明星。春の大曲線の中間点天体です。距離は約37光年。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>肉眼で位置と色を確かめるのが基本です。望遠鏡では恒星自体は点像なので、倍率を上げるよりも色・瞬き・周囲の星並びを楽しむのが向いています。目安は肉眼です。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>太陽より進化の進んだ橙色巨星です。大きな固有運動を持ち、太陽近傍の恒星集団とは異なる運動を示すことでも知られます。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>名前はギリシャ語で「熊の番人」を意味し、おおぐま座の後を追うような位置関係に由来します。</p></div>`},
{id:"Vega",name:"ベガ（こと座α・織姫星）",type:"star",icon:"✨",cat:"恒星",ra:279.2347,dec:38.7837,mag:0.03,dist:"約25光年",size:"直径約240万km",scope:"肉眼〜低倍率",highlight:"全天3位の明るさ。七夕の織姫星",months:[3,4,5,6,7,8,9,10,11],story:`<div class="story-topic"><h4>概要</h4><p>ベガ（こと座α・織姫星）は、全天3位の明るさ。七夕の織姫星天体です。距離は約25光年。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>肉眼で位置と色を確かめるのが基本です。望遠鏡では恒星自体は点像なので、倍率を上げるよりも色・瞬き・周囲の星並びを楽しむのが向いています。目安は肉眼〜低倍率です。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>比較的近いA型主系列星で、高速自転のため極方向と赤道方向で性質が少し異なることが分かっています。周囲には塵の円盤も知られています。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>七夕では織姫星として親しまれます。測光の歴史では、等級の基準を考える際の代表的な標準星として長く使われました。</p></div>`},
{id:"Capella",name:"カペラ（ぎょしゃ座α）",type:"star",icon:"🟡",cat:"恒星",ra:79.1723,dec:45.9980,mag:0.08,dist:"約43光年",size:"—",scope:"肉眼",highlight:"冬の北天の明星。実は2つの黄色巨星の連星",months:[9,10,11,12,1,2,3,4],story:`<div class="story-topic"><h4>概要</h4><p>カペラ（ぎょしゃ座α）は、冬の北天の明星。実は2つの黄色巨星の連星天体です。距離は約43光年。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>肉眼で位置と色を確かめるのが基本です。望遠鏡では恒星自体は点像なので、倍率を上げるよりも色・瞬き・周囲の星並びを楽しむのが向いています。目安は肉眼です。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>肉眼では1つに見えますが、明るい成分自体が2つの黄色巨星からなる連星で、さらに離れた赤色矮星のペアも含む多重星系です。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>ラテン語で「小さな雌ヤギ」を意味し、ぎょしゃ座の神話的表現と結び付いています。</p></div>`},
{id:"Rigel",name:"リゲル（オリオン座β）",type:"star",icon:"🔵",cat:"恒星",ra:78.6345,dec:-8.2016,mag:0.18,dist:"約860光年",size:"直径約9,700万km",scope:"肉眼",highlight:"オリオン座の青白い超巨星。太陽の約7万倍の光度",months:[10,11,12,1,2,3,4],story:`<div class="story-topic"><h4>概要</h4><p>リゲル（オリオン座β）は、オリオン座の青白い超巨星。太陽の約7万倍の光度天体です。距離は約860光年。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>肉眼で位置と色を確かめるのが基本です。望遠鏡では恒星自体は点像なので、倍率を上げるよりも色・瞬き・周囲の星並びを楽しむのが向いています。目安は肉眼です。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>非常に高温で高光度の青色超巨星です。大質量星が短い寿命の後半へ進んだ姿で、周囲には複数の伴星も知られています。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>オリオンの足を表す星で、名称はアラビア語の「巨人の足」に由来します。</p></div>`},
{id:"Procyon",name:"プロキオン（こいぬ座α）",type:"star",icon:"⭐",cat:"恒星",ra:114.8255,dec:5.2250,mag:0.40,dist:"約11.5光年",size:"直径約200万km",scope:"肉眼",highlight:"冬の大三角の一角。白色矮星の伴星を持つ",months:[11,12,1,2,3,4],story:`<div class="story-topic"><h4>概要</h4><p>プロキオン（こいぬ座α）は、冬の大三角の一角。白色矮星の伴星を持つ天体です。距離は約11.5光年。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>肉眼で位置と色を確かめるのが基本です。望遠鏡では恒星自体は点像なので、倍率を上げるよりも色・瞬き・周囲の星並びを楽しむのが向いています。目安は肉眼です。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>主星と白色矮星の伴星からなる連星系で、シリウス系と似た構成です。比較的近距離にあるため、恒星進化と連星軌道研究の重要な対象です。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>「犬の前」を意味する名で、シリウスより少し早く昇ることに由来します。</p></div>`},
{id:"Betelgeuse",name:"ベテルギウス（オリオン座α）",type:"star",icon:"🔴",cat:"恒星",ra:88.7929,dec:7.4071,mag:0.45,dist:"約700光年",size:"直径約12億km（太陽の約1,000倍）",scope:"肉眼",highlight:"近い将来超新星爆発する赤色超巨星",months:[10,11,12,1,2,3,4],story:`<div class="story-topic"><h4>概要</h4><p>ベテルギウス（オリオン座α）は、近い将来超新星爆発する赤色超巨星天体です。距離は約700光年。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>肉眼で位置と色を確かめるのが基本です。望遠鏡では恒星自体は点像なので、倍率を上げるよりも色・瞬き・周囲の星並びを楽しむのが向いています。目安は肉眼です。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>大質量星が進化した赤色超巨星で、外層が大きく膨張し、明るさも不規則に変化します。将来は超新星になると考えられますが、その時期を人間の時間尺度で予測することはできません。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>オリオンの肩を表す星として知られ、2019〜2020年の大減光では塵と表面活動が注目されました。</p></div>`},
{id:"Altair",name:"アルタイル（わし座α・彦星）",type:"star",icon:"✨",cat:"恒星",ra:297.6958,dec:8.8683,mag:0.76,dist:"約17光年",size:"直径約200万km",scope:"肉眼",highlight:"七夕の彦星。高速自転で扁平な形",months:[4,5,6,7,8,9,10,11],story:`<div class="story-topic"><h4>概要</h4><p>アルタイル（わし座α・彦星）は、七夕の彦星。高速自転で扁平な形天体です。距離は約17光年。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>肉眼で位置と色を確かめるのが基本です。望遠鏡では恒星自体は点像なので、倍率を上げるよりも色・瞬き・周囲の星並びを楽しむのが向いています。目安は肉眼です。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>非常に高速で自転しているため、完全な球ではなく赤道方向に膨らんだ形をしています。高速自転が恒星の形や表面温度に与える影響を直接調べられる星です。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>七夕では彦星として親しまれ、ベガ・デネブと夏の大三角を作ります。</p></div>`},
{id:"Aldebaran",name:"アルデバラン（おうし座α）",type:"star",icon:"🔴",cat:"恒星",ra:68.9802,dec:16.5093,mag:0.87,dist:"約65光年",size:"直径約6,100万km",scope:"肉眼",highlight:"おうし座の目。赤色巨星",months:[9,10,11,12,1,2,3,4],story:`<div class="story-topic"><h4>概要</h4><p>アルデバラン（おうし座α）は、おうし座の目。赤色巨星天体です。距離は約65光年。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>肉眼で位置と色を確かめるのが基本です。望遠鏡では恒星自体は点像なので、倍率を上げるよりも色・瞬き・周囲の星並びを楽しむのが向いています。目安は肉眼です。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>太陽より進化した橙色巨星で、おうし座のヒアデス星団の方向に見えますが、実際には星団より手前にあります。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>名前はアラビア語で「後に続くもの」を意味し、プレアデス星団を追うように昇る姿に由来します。</p></div>`},
{id:"Spica",name:"スピカ（おとめ座α）",type:"star",icon:"🔵",cat:"恒星",ra:201.2983,dec:-11.1613,mag:0.98,dist:"約250光年",size:"直径約1,400万km",scope:"肉眼",highlight:"春の大曲線の終点。青白い連星",months:[1,2,3,4,5,6,7],story:`<div class="story-topic"><h4>概要</h4><p>スピカ（おとめ座α）は、春の大曲線の終点。青白い連星天体です。距離は約250光年。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>肉眼で位置と色を確かめるのが基本です。望遠鏡では恒星自体は点像なので、倍率を上げるよりも色・瞬き・周囲の星並びを楽しむのが向いています。目安は肉眼です。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>肉眼では1つですが、実際には互いに近接して回る高温の連星です。潮汐力による変形やスペクトル変化も研究対象になります。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>おとめ座が持つ麦の穂を表す名前で、春の大曲線をたどる目印としても有名です。</p></div>`},
{id:"Antares",name:"アンタレス（さそり座α）",type:"star",icon:"🔴",cat:"恒星",ra:247.3519,dec:-26.4320,mag:0.96,dist:"約550光年",size:"直径約12億km（太陽の約700倍）",scope:"肉眼",highlight:"火星に対抗する赤い超巨星",months:[4,5,6,7,8,9],story:`<div class="story-topic"><h4>概要</h4><p>アンタレス（さそり座α）は、火星に対抗する赤い超巨星天体です。距離は約550光年。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>肉眼で位置と色を確かめるのが基本です。望遠鏡では恒星自体は点像なので、倍率を上げるよりも色・瞬き・周囲の星並びを楽しむのが向いています。目安は肉眼です。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>赤色超巨星で、低温の表面と巨大な半径を持つ大質量星です。周囲には星風で放出された物質も存在します。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>名は「火星に対抗するもの」の意味で、赤い色が火星と似ていることから付けられました。</p></div>`},
{id:"Pollux",name:"ポルックス（ふたご座β）",type:"star",icon:"🟠",cat:"恒星",ra:116.3289,dec:28.0262,mag:1.14,dist:"約34光年",size:"直径約1,100万km",scope:"肉眼",highlight:"ふたご座の兄。太陽系外惑星を持つ",months:[10,11,12,1,2,3,4],story:`<div class="story-topic"><h4>概要</h4><p>ポルックス（ふたご座β）は、ふたご座の兄。太陽系外惑星を持つ天体です。距離は約34光年。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>肉眼で位置と色を確かめるのが基本です。望遠鏡では恒星自体は点像なので、倍率を上げるよりも色・瞬き・周囲の星並びを楽しむのが向いています。目安は肉眼です。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>進化した橙色巨星で、周囲には太陽系外惑星が確認されています。肉眼で明るい恒星にも惑星系が存在する好例です。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>ふたご座の双子の一人ポルックスを表し、カストルと並んで冬の空の分かりやすい目印になります。</p></div>`},
{id:"Fomalhaut",name:"フォーマルハウト（みなみのうお座α）",type:"star",icon:"⭐",cat:"恒星",ra:344.4127,dec:-29.6223,mag:1.16,dist:"約25光年",size:"直径約200万km",scope:"肉眼",highlight:"秋の一つ星。惑星系の証拠が発見された",months:[7,8,9,10,11,12],story:`<div class="story-topic"><h4>概要</h4><p>フォーマルハウト（みなみのうお座α）は、秋の一つ星。惑星系の証拠が発見された天体です。距離は約25光年。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>肉眼で位置と色を確かめるのが基本です。望遠鏡では恒星自体は点像なので、倍率を上げるよりも色・瞬き・周囲の星並びを楽しむのが向いています。目安は肉眼です。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>若い恒星の周囲に塵の円盤が広がっており、惑星形成後の円盤構造を調べる代表的な対象です。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>秋の南の空で周囲に明るい星が少ないため「秋の一つ星」と呼ばれます。</p></div>`},
{id:"Deneb",name:"デネブ（はくちょう座α）",type:"star",icon:"🔵",cat:"恒星",ra:310.3580,dec:45.2803,mag:1.25,dist:"約2,600光年",size:"直径約2億km（太陽の約200倍）",scope:"肉眼",highlight:"夏の大三角の一角。超巨星で実は超明るい",months:[4,5,6,7,8,9,10,11],story:`<div class="story-topic"><h4>概要</h4><p>デネブ（はくちょう座α）は、夏の大三角の一角。超巨星で実は超明るい天体です。距離は約2,600光年。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>肉眼で位置と色を確かめるのが基本です。望遠鏡では恒星自体は点像なので、倍率を上げるよりも色・瞬き・周囲の星並びを楽しむのが向いています。目安は肉眼です。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>非常に遠方にあるにもかかわらず1等星に見える、極めて高光度の白色超巨星です。大質量星の進化を考えるうえで重要です。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>はくちょう座の尾を表し、ベガ・アルタイルと夏の大三角を形成します。</p></div>`},
{id:"Regulus",name:"レグルス（しし座α）",type:"star",icon:"🔵",cat:"恒星",ra:152.0930,dec:11.9672,mag:1.35,dist:"約79光年",size:"直径約500万km",scope:"肉眼",highlight:"しし座の心臓。高速自転で扁平",months:[12,1,2,3,4,5,6],story:`<div class="story-topic"><h4>概要</h4><p>レグルス（しし座α）は、しし座の心臓。高速自転で扁平天体です。距離は約79光年。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>肉眼で位置と色を確かめるのが基本です。望遠鏡では恒星自体は点像なので、倍率を上げるよりも色・瞬き・周囲の星並びを楽しむのが向いています。目安は肉眼です。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>高速自転する多重星系で、主星は自転によって扁平になっています。恒星の回転が形状に及ぼす影響の好例です。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>「小さな王」を意味する名で、しし座の心臓に位置します。黄道に近いため月や惑星に隠されることもあります。</p></div>`},
{id:"Castor",name:"カストル（ふたご座α）",type:"double",icon:"🔵",cat:"二重星",ra:113.6495,dec:31.8883,mag:1.58,dist:"約52光年",size:"—",scope:"50〜100倍",highlight:"実は6重星系！望遠鏡で2つに分かれる",months:[10,11,12,1,2,3,4],story:`<div class="story-topic"><h4>概要</h4><p>カストル（ふたご座α）は、実は6重星系！望遠鏡で2つに分かれる天体です。距離は約52光年。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>まず低倍率で導入し、像が安定してから倍率を上げます。推奨は50〜100倍。二星の間隔だけでなく色の違いにも注目すると見応えがあります。シーイングが悪い日は分離しにくくなります。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>肉眼では1つに見えますが、複数の連星が組み合わさった6重星系として知られます。望遠鏡ではまず明るい2成分を分離して楽しめます。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>ふたご座の双子の一人カストルを表し、ポルックスとの対比で古くから親しまれています。</p></div>`},
{id:"Polaris",name:"ポラリス（こぐま座α・北極星）",type:"star",icon:"⭐",cat:"恒星",ra:37.9546,dec:89.2641,mag:1.98,dist:"約433光年",size:"直径約7,000万km",scope:"肉眼",highlight:"現在の北極星。ほぼ動かない道しるべの星",months:[1,2,3,4,5,6,7,8,9,10,11,12],story:`<div class="story-topic"><h4>概要</h4><p>ポラリス（こぐま座α・北極星）は、現在の北極星。ほぼ動かない道しるべの星天体です。距離は約433光年。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>肉眼で位置と色を確かめるのが基本です。望遠鏡では恒星自体は点像なので、倍率を上げるよりも色・瞬き・周囲の星並びを楽しむのが向いています。目安は肉眼です。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>北天の回転中心に近い位置にあるケフェイド型変光星を含む多重星系です。地球の歳差運動のため、北極星は永遠に同じ星ではありません。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>航海や方位確認に長く使われてきた実用的な星です。北斗七星やカシオペヤ座から探す方法がよく知られています。</p></div>`},
{id:"Albireo",name:"アルビレオ（はくちょう座β）",type:"double",icon:"💎",cat:"二重星",ra:292.6803,dec:27.9597,mag:3.1,dist:"約380〜430光年",size:"—",scope:"50〜100倍",highlight:"金色×青白の色対比。北天の宝石",months:[4,5,6,7,8,9,10,11],story:`<div class="story-topic"><h4>概要</h4><p>アルビレオ（はくちょう座β）は、金色×青白の色対比。北天の宝石天体です。距離は約380〜430光年。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>まず低倍率で導入し、像が安定してから倍率を上げます。推奨は50〜100倍。二星の間隔だけでなく色の違いにも注目すると見応えがあります。シーイングが悪い日は分離しにくくなります。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>望遠鏡で金色と青白色の鮮やかな色対比を楽しめる代表的な二重星です。色の差は表面温度の違いを視覚的に感じる良い教材になります。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>はくちょう座のくちばし付近にあり、観望会で人気の高い対象です。</p></div>`},
{id:"EpsLyr",name:"こと座ε星（四重星）",type:"double",icon:"🌟",cat:"二重星",ra:282.5196,dec:39.6167,mag:4.7,dist:"約160光年",size:"—",scope:"150〜200倍",highlight:"1→2→4つに分かれる！望遠鏡の醍醐味",months:[3,4,5,6,7,8,9,10,11],story:`<div class="story-topic"><h4>概要</h4><p>こと座ε星（四重星）は、1→2→4つに分かれる！望遠鏡の醍醐味天体です。距離は約160光年。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>まず低倍率で導入し、像が安定してから倍率を上げます。推奨は150〜200倍。二星の間隔だけでなく色の違いにも注目すると見応えがあります。シーイングが悪い日は分離しにくくなります。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>肉眼または双眼鏡では2つ、十分な口径とシーイングではそれぞれがさらに2つに分かる「ダブル・ダブル」です。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>望遠鏡の分解能やシーイングを体感する定番対象として広く観測されています。</p></div>`},
{id:"Mizar",name:"ミザール（おおぐま座ζ）",type:"double",icon:"🔭",cat:"二重星",ra:200.9814,dec:54.9254,mag:2.2,dist:"約78光年",size:"—",scope:"50〜100倍",highlight:"肉眼二重星＋望遠鏡二重星",months:[1,2,3,4,5,6,7,8,9,10,11,12],story:`<div class="story-topic"><h4>概要</h4><p>ミザール（おおぐま座ζ）は、肉眼二重星＋望遠鏡二重星天体です。距離は約78光年。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>まず低倍率で導入し、像が安定してから倍率を上げます。推奨は50〜100倍。二星の間隔だけでなく色の違いにも注目すると見応えがあります。シーイングが悪い日は分離しにくくなります。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>ミザールとアルコルは肉眼二重星として有名で、ミザール自体も望遠鏡で分離できます。さらに分光連星を含む多重系です。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>北斗七星の柄にあり、古くから視力試験の星として語られてきました。</p></div>`},
{id:"Almach",name:"アルマク（アンドロメダ座γ）",type:"double",icon:"💫",cat:"二重星",ra:30.9750,dec:42.3297,mag:2.1,dist:"約350光年",size:"—",scope:"50〜100倍",highlight:"金色×青緑の美しい色対比",months:[8,9,10,11,12,1,2],story:`<div class="story-topic"><h4>概要</h4><p>アルマク（アンドロメダ座γ）は、金色×青緑の美しい色対比天体です。距離は約350光年。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>まず低倍率で導入し、像が安定してから倍率を上げます。推奨は50〜100倍。二星の間隔だけでなく色の違いにも注目すると見応えがあります。シーイングが悪い日は分離しにくくなります。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>明るい主星と青みを帯びた伴星の色対比が美しい二重星です。伴星側も複雑な多重系であることが知られています。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>アンドロメダ座の端に位置し、アルビレオと並ぶ色彩二重星として人気があります。</p></div>`},
];

/* =====================================================
深宇宙天体データベース（DSO：SEDS Messier / NGC/IC）
===================================================== */
const DSO_DB=window.NICOLE_COMMON?.DSO_DB||[
{id:"Mercury",name:"水星",type:"planet",icon:"🪨",cat:"惑星",planet:"Mercury",mag:-1.0,dist:"約0.4〜2.2億km",size:"直径4,879km",scope:"50〜100倍",highlight:"満ち欠けが見える！日没直後か夜明け前の低空に",story:`<div class="story-topic"><h4>概要</h4><p>水星は、満ち欠けが見える！日没直後か夜明け前の低空に天体です。距離は約0.4〜2.2億km。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>内惑星なので太陽から大きく離れず、日没直後か日の出前の低空が観測の中心です。望遠鏡では月のような満ち欠けが分かります。 推奨倍率の目安は50〜100倍です。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>太陽に最も近い岩石惑星で、公転周期は約88日です。大気は非常に希薄で、表面には多数のクレーターが残ります。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>惑星は背景の恒星に対して位置を変えるため、古代から「さまよう星」として知られてきました。数日〜数か月おきに位置や見え方を追うと、公転運動を実感できます。</p></div>`},
{id:"Venus",name:"金星",type:"planet",icon:"🌟",cat:"惑星",planet:"Venus",mag:-4.5,dist:"約0.4〜2.6億km",size:"直径12,104km",scope:"50〜150倍",highlight:"三日月〜満月形の満ち欠けが見える",story:`<div class="story-topic"><h4>概要</h4><p>金星は、三日月〜満月形の満ち欠けが見える天体です。距離は約0.4〜2.6億km。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>内惑星のため大きく満ち欠けします。細い三日月状の時期は見かけの直径が大きく、望遠鏡で変化を追うと公転運動を実感できます。 推奨倍率の目安は50〜150倍です。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>厚い二酸化炭素大気と硫酸雲に覆われ、強い温室効果によって表面は太陽系で最も高温な惑星です。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>惑星は背景の恒星に対して位置を変えるため、古代から「さまよう星」として知られてきました。数日〜数か月おきに位置や見え方を追うと、公転運動を実感できます。</p></div>`},
{id:"Mars",name:"火星",type:"planet",icon:"🔴",cat:"惑星",planet:"Mars",mag:0.0,dist:"約0.5〜4億km",size:"直径6,779km",scope:"100〜200倍",highlight:"極冠・模様が見える（接近時）",story:`<div class="story-topic"><h4>概要</h4><p>火星は、極冠・模様が見える（接近時）天体です。距離は約0.5〜4億km。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>地球との距離変化が大きく、接近期ほど表面模様を観察しやすくなります。高倍率ではシーイングの良い瞬間を待つのが重要です。 推奨倍率の目安は100〜200倍です。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>鉄を含む鉱物が酸化したため赤く見える岩石惑星です。極冠、巨大火山、峡谷など多様な地形を持ちます。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>惑星は背景の恒星に対して位置を変えるため、古代から「さまよう星」として知られてきました。数日〜数か月おきに位置や見え方を追うと、公転運動を実感できます。</p></div>`},
{id:"Jupiter",name:"木星",type:"planet",icon:"🟠",cat:"惑星",planet:"Jupiter",mag:-2.5,dist:"約6〜9億km",size:"直径142,984km",scope:"60〜150倍",highlight:"縞模様・大赤斑・ガリレオ衛星4個が見える",story:`<div class="story-topic"><h4>概要</h4><p>木星は、縞模様・大赤斑・ガリレオ衛星4個が見える天体です。距離は約6〜9億km。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>60倍程度でもガリレオ衛星と縞模様が楽しめます。衛星の位置は数時間でも変わるため、時間を空けて再観察すると動きを実感できます。 推奨倍率の目安は60〜150倍です。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>太陽系最大のガス惑星で、雲の帯や大赤斑など活発な大気現象が見られます。強い磁場と多数の衛星を持ちます。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>惑星は背景の恒星に対して位置を変えるため、古代から「さまよう星」として知られてきました。数日〜数か月おきに位置や見え方を追うと、公転運動を実感できます。</p></div>`},
{id:"Saturn",name:"土星",type:"planet",icon:"🪐",cat:"惑星",planet:"Saturn",mag:0.5,dist:"約12〜16億km",size:"直径120,536km（本体）",scope:"80〜150倍",highlight:"リング（環）が見える！",story:`<div class="story-topic"><h4>概要</h4><p>土星は、リング（環）が見える！天体です。距離は約12〜16億km。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>環は80倍前後から明瞭になり、条件が良ければ環の濃淡や衛星タイタンも楽しめます。環の傾きは年単位で変化します。 推奨倍率の目安は80〜150倍です。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>水素・ヘリウムを主成分とするガス惑星で、氷粒子を中心とした巨大な環系を持ちます。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>惑星は背景の恒星に対して位置を変えるため、古代から「さまよう星」として知られてきました。数日〜数か月おきに位置や見え方を追うと、公転運動を実感できます。</p></div>`},
{id:"Uranus",name:"天王星",type:"planet",icon:"🔵",cat:"惑星",planet:"Uranus",mag:5.7,dist:"約27〜32億km",size:"直径51,118km",scope:"100〜200倍",highlight:"青緑色の円盤。肉眼限界の惑星",story:`<div class="story-topic"><h4>概要</h4><p>天王星は、青緑色の円盤。肉眼限界の惑星天体です。距離は約27〜32億km。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>肉眼限界近くの明るさなので、まず星図で位置を正確に合わせます。高倍率では恒星とは違う小さな円盤状に見えることがあります。 推奨倍率の目安は100〜200倍です。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>氷巨星に分類され、メタンの吸収によって青緑色に見えます。自転軸がほぼ横倒しという特異な姿勢を持ちます。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>惑星は背景の恒星に対して位置を変えるため、古代から「さまよう星」として知られてきました。数日〜数か月おきに位置や見え方を追うと、公転運動を実感できます。</p></div>`},
{id:"Neptune",name:"海王星",type:"planet",icon:"🌀",cat:"惑星",planet:"Neptune",mag:7.8,dist:"約43〜47億km",size:"直径49,528km",scope:"150〜250倍",highlight:"青みがかった小さな円盤。望遠鏡必須",story:`<div class="story-topic"><h4>概要</h4><p>海王星は、青みがかった小さな円盤。望遠鏡必須天体です。距離は約43〜47億km。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>肉眼では見えないため星図での導入が必須です。高倍率でも小さな青い円盤で、位置確認そのものが観測の面白さになります。 推奨倍率の目安は150〜250倍です。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>太陽から最も遠い8番目の惑星で、メタンを含む大気と非常に強い風を持つ氷巨星です。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>惑星は背景の恒星に対して位置を変えるため、古代から「さまよう星」として知られてきました。数日〜数か月おきに位置や見え方を追うと、公転運動を実感できます。</p></div>`},
{id:"M1",name:"M1 かに星雲",type:"snr",icon:"🦀",cat:"メシエ",ra:83.6331,dec:22.0145,mag:8.4,dist:"約6,500光年",size:"約7'×5'",scope:"50〜100倍",highlight:"1054年の超新星爆発の残骸。中心にパルサーが存在",months:[10,11,12,1,2,3,4],story:`<div class="story-topic"><h4>概要</h4><p>M1 かに星雲は、1054年の超新星爆発の残骸。中心にパルサーが存在天体です。距離は約6,500光年。見かけの大きさは約7&#x27;×5&#x27;。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>非常に淡い広がりを持つため、暗い空と低〜中倍率が有利です。50〜100倍を目安に、直接注視せずそらし目を使うと細い構造が浮かびやすくなります。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>超新星爆発で吹き飛ばされたガスが現在も膨張しており、中心には高速自転する中性子星（かにパルサー）があります。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>1054年に東アジアなどで記録された「客星」と関連付けられています。メシエが彗星と紛らわしい天体を整理するきっかけの一つでもあります。</p></div>`},
{id:"M2",name:"M2 球状星団",type:"cluster",icon:"⭐",cat:"メシエ",ra:323.3625,dec:-0.8233,mag:6.3,dist:"約3万7,500光年",size:"約16'",scope:"100〜200倍",highlight:"みずがめ座の大型球状星団",months:[6,7,8,9,10,11],story:`<div class="story-topic"><h4>概要</h4><p>M2 球状星団は、みずがめ座の大型球状星団天体です。距離は約3万7,500光年。見かけの大きさは約16&#x27;。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>100〜200倍を目安に、低倍率で全体像を確認してから倍率を上げ、周辺部の星がどこまで分離するかを見ます。口径と空の暗さが増すほど星粒が豊かになります。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>球状星団は銀河系のハローに多く存在する非常に古い恒星集団です。同じ距離・ほぼ同じ年代の星を多数含むため、恒星進化や銀河系形成史を調べる重要な研究対象です。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>メシエ天体M2としてカタログ化された対象です。メシエカタログは、彗星探索中に紛らわしい恒星状・星雲状天体を記録したことから始まり、現在では代表的な深宇宙天体リストとして観望に広く使われています。</p></div>`},
{id:"M3",name:"M3 球状星団",type:"cluster",icon:"⭐",cat:"メシエ",ra:205.5483,dec:28.3775,mag:6.4,dist:"約3万3,900光年",size:"約18'",scope:"100〜200倍",highlight:"春の空の大型球状星団。約50万個の星",months:[2,3,4,5,6,7,8],story:`<div class="story-topic"><h4>概要</h4><p>M3 球状星団は、春の空の大型球状星団。約50万個の星天体です。距離は約3万3,900光年。見かけの大きさは約18&#x27;。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>100〜200倍を目安に、低倍率で全体像を確認してから倍率を上げ、周辺部の星がどこまで分離するかを見ます。口径と空の暗さが増すほど星粒が豊かになります。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>球状星団は銀河系のハローに多く存在する非常に古い恒星集団です。同じ距離・ほぼ同じ年代の星を多数含むため、恒星進化や銀河系形成史を調べる重要な研究対象です。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>メシエ天体M3としてカタログ化された対象です。メシエカタログは、彗星探索中に紛らわしい恒星状・星雲状天体を記録したことから始まり、現在では代表的な深宇宙天体リストとして観望に広く使われています。</p></div>`},
{id:"M4",name:"M4 球状星団",type:"cluster",icon:"⭐",cat:"メシエ",ra:245.8967,dec:-26.5258,mag:5.6,dist:"約7,200光年",size:"約26'",scope:"50〜150倍",highlight:"最も近い球状星団の一つ",months:[4,5,6,7,8,9],story:`<div class="story-topic"><h4>概要</h4><p>M4 球状星団は、最も近い球状星団の一つ天体です。距離は約7,200光年。見かけの大きさは約26&#x27;。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>50〜150倍を目安に、低倍率で全体像を確認してから倍率を上げ、周辺部の星がどこまで分離するかを見ます。口径と空の暗さが増すほど星粒が豊かになります。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>球状星団は銀河系のハローに多く存在する非常に古い恒星集団です。同じ距離・ほぼ同じ年代の星を多数含むため、恒星進化や銀河系形成史を調べる重要な研究対象です。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>メシエ天体M4としてカタログ化された対象です。メシエカタログは、彗星探索中に紛らわしい恒星状・星雲状天体を記録したことから始まり、現在では代表的な深宇宙天体リストとして観望に広く使われています。</p></div>`},
{id:"M5",name:"M5 球状星団",type:"cluster",icon:"⭐",cat:"メシエ",ra:229.6383,dec:2.0808,mag:5.7,dist:"約2万4,500光年",size:"約17'",scope:"100〜200倍",highlight:"M13に匹敵する北天の大型球状星団",months:[3,4,5,6,7,8,9],story:`<div class="story-topic"><h4>概要</h4><p>M5 球状星団は、M13に匹敵する北天の大型球状星団天体です。距離は約2万4,500光年。見かけの大きさは約17&#x27;。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>100〜200倍を目安に、低倍率で全体像を確認してから倍率を上げ、周辺部の星がどこまで分離するかを見ます。口径と空の暗さが増すほど星粒が豊かになります。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>球状星団は銀河系のハローに多く存在する非常に古い恒星集団です。同じ距離・ほぼ同じ年代の星を多数含むため、恒星進化や銀河系形成史を調べる重要な研究対象です。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>メシエ天体M5としてカタログ化された対象です。メシエカタログは、彗星探索中に紛らわしい恒星状・星雲状天体を記録したことから始まり、現在では代表的な深宇宙天体リストとして観望に広く使われています。</p></div>`},
{id:"M6",name:"M6 バタフライ星団",type:"cluster",icon:"🦋",cat:"メシエ",ra:265.0833,dec:-32.2167,mag:4.2,dist:"約1,600光年",size:"約25'",scope:"10〜30倍",highlight:"蝶の形に見える散開星団",months:[4,5,6,7,8,9,10],story:`<div class="story-topic"><h4>概要</h4><p>M6 バタフライ星団は、蝶の形に見える散開星団天体です。距離は約1,600光年。見かけの大きさは約25&#x27;。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>広がりを楽しむため低倍率が基本です。10〜30倍を目安に、視野の中で星の密集度や形を眺めます。暗い空では背景とのコントラストが上がります。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>散開星団は同じ分子雲からほぼ同時期に生まれた星々の集団です。星団内の星の色や明るさの違いを比べることで、恒星の質量と進化の関係を考えることができます。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>メシエ天体M6としてカタログ化された対象です。メシエカタログは、彗星探索中に紛らわしい恒星状・星雲状天体を記録したことから始まり、現在では代表的な深宇宙天体リストとして観望に広く使われています。</p></div>`},
{id:"M7",name:"M7 プトレマイオス星団",type:"cluster",icon:"🌟",cat:"メシエ",ra:268.4600,dec:-34.7933,mag:3.3,dist:"約800光年",size:"約80'",scope:"肉眼〜10倍",highlight:"全天最明の散開星団の一つ",months:[4,5,6,7,8,9,10],story:`<div class="story-topic"><h4>概要</h4><p>M7 プトレマイオス星団は、全天最明の散開星団の一つ天体です。距離は約800光年。見かけの大きさは約80&#x27;。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>広がりを楽しむため低倍率が基本です。肉眼〜10倍を目安に、視野の中で星の密集度や形を眺めます。暗い空では背景とのコントラストが上がります。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>散開星団は同じ分子雲からほぼ同時期に生まれた星々の集団です。星団内の星の色や明るさの違いを比べることで、恒星の質量と進化の関係を考えることができます。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>メシエ天体M7としてカタログ化された対象です。メシエカタログは、彗星探索中に紛らわしい恒星状・星雲状天体を記録したことから始まり、現在では代表的な深宇宙天体リストとして観望に広く使われています。</p></div>`},
{id:"M8",name:"M8 干潟星雲",type:"nebula",icon:"🌊",cat:"メシエ",ra:270.9167,dec:-24.3833,mag:6.0,dist:"約5,200光年",size:"約90'×40'",scope:"20〜60倍",highlight:"肉眼でも見える！現役の星形成領域",months:[4,5,6,7,8,9,10],story:`<div class="story-topic"><h4>概要</h4><p>M8 干潟星雲は、肉眼でも見える！現役の星形成領域天体です。距離は約5,200光年。見かけの大きさは約90&#x27;×40&#x27;。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>20〜60倍を目安に低倍率から始め、星雲全体の広がりを優先して観察します。暗い空では淡い外縁が伸び、対象によってはUHC/OIII系フィルターでコントラストが改善します。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>電離水素が光る巨大な星形成領域で、暗黒帯と明るい散光部が複雑な形を作ります。若い星団NGC 6530も同じ視野で楽しめます。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>「干潟」の名は、明るい星雲を横切る暗黒帯が入り江や干潟のように見えることに由来します。</p></div>`},
{id:"M11",name:"M11 野鴨星団",type:"cluster",icon:"🦆",cat:"メシエ",ra:282.7667,dec:-6.2667,mag:6.3,dist:"約6,200光年",size:"約14'",scope:"30〜100倍",highlight:"密集した美しい散開星団",months:[4,5,6,7,8,9,10,11],story:`<div class="story-topic"><h4>概要</h4><p>M11 野鴨星団は、密集した美しい散開星団天体です。距離は約6,200光年。見かけの大きさは約14&#x27;。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>30〜100倍を目安に、低倍率で全体像を確認してから倍率を上げ、周辺部の星がどこまで分離するかを見ます。口径と空の暗さが増すほど星粒が豊かになります。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>散開星団は同じ分子雲からほぼ同時期に生まれた星々の集団です。星団内の星の色や明るさの違いを比べることで、恒星の質量と進化の関係を考えることができます。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>メシエ天体M11としてカタログ化された対象です。メシエカタログは、彗星探索中に紛らわしい恒星状・星雲状天体を記録したことから始まり、現在では代表的な深宇宙天体リストとして観望に広く使われています。</p></div>`},
{id:"M13",name:"M13 ヘルクレス座大球状星団",type:"cluster",icon:"⭐",cat:"メシエ",ra:250.4230,dec:36.4613,mag:5.8,dist:"約2万5,000光年",size:"約20'",scope:"100〜200倍",highlight:"アレシボメッセージの宛先。約30万個の星の集団",months:[3,4,5,6,7,8,9,10],story:`<div class="story-topic"><h4>概要</h4><p>M13 ヘルクレス座大球状星団は、アレシボメッセージの宛先。約30万個の星の集団天体です。距離は約2万5,000光年。見かけの大きさは約20&#x27;。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>100〜200倍を目安に、低倍率で全体像を確認してから倍率を上げ、周辺部の星がどこまで分離するかを見ます。口径と空の暗さが増すほど星粒が豊かになります。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>銀河系ハローに属する古い球状星団で、数十万個規模の恒星が重力で密集しています。中心に向かうほど星の密度が急激に高くなります。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>1974年、アレシボ電波望遠鏡から送信された有名なメッセージの方向として選ばれました。</p></div>`},
{id:"M15",name:"M15 球状星団",type:"cluster",icon:"⭐",cat:"メシエ",ra:322.4933,dec:12.1670,mag:6.3,dist:"約3万3,600光年",size:"約18'",scope:"100〜200倍",highlight:"中心核崩壊を起こした超高密度な球状星団",months:[6,7,8,9,10,11],story:`<div class="story-topic"><h4>概要</h4><p>M15 球状星団は、中心核崩壊を起こした超高密度な球状星団天体です。距離は約3万3,600光年。見かけの大きさは約18&#x27;。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>100〜200倍を目安に、低倍率で全体像を確認してから倍率を上げ、周辺部の星がどこまで分離するかを見ます。口径と空の暗さが増すほど星粒が豊かになります。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>球状星団は銀河系のハローに多く存在する非常に古い恒星集団です。同じ距離・ほぼ同じ年代の星を多数含むため、恒星進化や銀河系形成史を調べる重要な研究対象です。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>メシエ天体M15としてカタログ化された対象です。メシエカタログは、彗星探索中に紛らわしい恒星状・星雲状天体を記録したことから始まり、現在では代表的な深宇宙天体リストとして観望に広く使われています。</p></div>`},
{id:"M16",name:"M16 わし星雲",type:"nebula",icon:"🦅",cat:"メシエ",ra:274.7000,dec:-13.8067,mag:6.4,dist:"約7,000光年",size:"約7'",scope:"30〜100倍",highlight:"ハッブルの「創造の柱」で有名な星形成領域",months:[4,5,6,7,8,9,10],story:`<div class="story-topic"><h4>概要</h4><p>M16 わし星雲は、ハッブルの「創造の柱」で有名な星形成領域天体です。距離は約7,000光年。見かけの大きさは約7&#x27;。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>30〜100倍を目安に低倍率から始め、星雲全体の広がりを優先して観察します。暗い空では淡い外縁が伸び、対象によってはUHC/OIII系フィルターでコントラストが改善します。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>若い星団と電離ガスからなる星形成領域で、濃い分子雲の柱の内部では新しい星が形成されています。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>ハッブル宇宙望遠鏡が撮影した「創造の柱」で世界的に有名になりました。</p></div>`},
{id:"M17",name:"M17 オメガ星雲",type:"nebula",icon:"Ω",cat:"メシエ",ra:275.1917,dec:-16.1833,mag:6.0,dist:"約5,500光年",size:"約46'×37'",scope:"20〜60倍",highlight:"Ω形・白鳥形に見える美しい散光星雲",months:[4,5,6,7,8,9,10],story:`<div class="story-topic"><h4>概要</h4><p>M17 オメガ星雲は、Ω形・白鳥形に見える美しい散光星雲天体です。距離は約5,500光年。見かけの大きさは約46&#x27;×37&#x27;。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>20〜60倍を目安に低倍率から始め、星雲全体の広がりを優先して観察します。暗い空では淡い外縁が伸び、対象によってはUHC/OIII系フィルターでコントラストが改善します。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>若い大質量星の紫外線で輝く星形成領域です。明るい中心部は比較的見やすく、淡い外縁まで含めると非常に大きな星雲です。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>見る向きによって「オメガ」「白鳥」「馬蹄」など複数の愛称があります。</p></div>`},
{id:"M20",name:"M20 三裂星雲",type:"nebula",icon:"🌿",cat:"メシエ",ra:270.6250,dec:-23.0333,mag:9.0,dist:"約5,200光年",size:"約28'",scope:"30〜80倍",highlight:"3つに裂けて見える美しい散光星雲",months:[4,5,6,7,8,9,10],story:`<div class="story-topic"><h4>概要</h4><p>M20 三裂星雲は、3つに裂けて見える美しい散光星雲天体です。距離は約5,200光年。見かけの大きさは約28&#x27;。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>30〜80倍を目安に低倍率から始め、星雲全体の広がりを優先して観察します。暗い空では淡い外縁が伸び、対象によってはUHC/OIII系フィルターでコントラストが改善します。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>赤い放射星雲、青い反射星雲、暗黒帯が一つの領域に共存する複合的な星形成領域です。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>暗黒帯が明るい星雲を三つに分けて見せることから「三裂星雲」と呼ばれます。</p></div>`},
{id:"M22",name:"M22 球状星団",type:"cluster",icon:"⭐",cat:"メシエ",ra:279.0997,dec:-23.9047,mag:5.1,dist:"約1万600光年",size:"約24'",scope:"50〜150倍",highlight:"南天の大型球状星団。肉眼でも見える",months:[5,6,7,8,9,10],story:`<div class="story-topic"><h4>概要</h4><p>M22 球状星団は、南天の大型球状星団。肉眼でも見える天体です。距離は約1万600光年。見かけの大きさは約24&#x27;。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>50〜150倍を目安に、低倍率で全体像を確認してから倍率を上げ、周辺部の星がどこまで分離するかを見ます。口径と空の暗さが増すほど星粒が豊かになります。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>球状星団は銀河系のハローに多く存在する非常に古い恒星集団です。同じ距離・ほぼ同じ年代の星を多数含むため、恒星進化や銀河系形成史を調べる重要な研究対象です。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>メシエ天体M22としてカタログ化された対象です。メシエカタログは、彗星探索中に紛らわしい恒星状・星雲状天体を記録したことから始まり、現在では代表的な深宇宙天体リストとして観望に広く使われています。</p></div>`},
{id:"M27",name:"M27 亜鈴状星雲",type:"nebula",icon:"🏋️",cat:"メシエ",ra:299.9013,dec:22.7214,mag:7.5,dist:"約1,000〜1,360光年",size:"約8'×6'",scope:"50〜100倍",highlight:"惑星状星雲で最も明るい",months:[4,5,6,7,8,9,10,11],story:`<div class="story-topic"><h4>概要</h4><p>M27 亜鈴状星雲は、惑星状星雲で最も明るい天体です。距離は約1,000〜1,360光年。見かけの大きさは約8&#x27;×6&#x27;。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>惑星状星雲は比較的小さく表面輝度が高いものが多いため、50〜100倍で倍率を上げても形を保ちやすい対象です。OIIIフィルターがコントラスト改善に有効な場合があります。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>太陽程度の質量の恒星が晩年に外層を放出してできた惑星状星雲です。中心には高温の白色矮星が残っています。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>1764年にメシエが記録した最初期の惑星状星雲の一つで、形が鉄亜鈴に似ることから愛称が付きました。</p></div>`},
{id:"M31",name:"M31 アンドロメダ銀河",type:"galaxy",icon:"🌌",cat:"メシエ",ra:10.6848,dec:41.2691,mag:3.4,dist:"約254万光年",size:"約3°×1°",scope:"20〜40倍",highlight:"肉眼でも見える！254万年前の光",months:[7,8,9,10,11,12,1],story:`<div class="story-topic"><h4>概要</h4><p>M31 アンドロメダ銀河は、肉眼でも見える！254万年前の光天体です。距離は約254万光年。見かけの大きさは約3°×1°。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>銀河は総合等級よりも表面輝度の影響が大きいため、暗い空と十分な暗順応が重要です。20〜40倍を目安に、まず中心核を捉え、視線を少し外す「そらし目」で淡い外縁を追います。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>天の川銀河に近い大型渦巻銀河で、恒星・ガス・塵・球状星団などを含む巨大な銀河系です。伴銀河M32とM110も周囲にあります。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>肉眼で見える最遠級の天体として知られます。アンドロメダ銀河の「星雲」ではなく独立した銀河だと理解されたことは、宇宙観の拡大につながりました。</p></div>`,talk:`このぼんやりした光は、すぐ近くの星雲ではなく銀河そのものです。いま見ている光は約254万年前に出発したもので、時間の深さを実感しやすい天体です。`},
{id:"M33",name:"M33 さんかく座銀河",type:"galaxy",icon:"🌀",cat:"メシエ",ra:23.4621,dec:30.6600,mag:5.7,dist:"約273万光年",size:"約70'×40'",scope:"20〜30倍",highlight:"正面向きの渦巻き",months:[7,8,9,10,11,12,1],story:`<div class="story-topic"><h4>概要</h4><p>M33 さんかく座銀河は、正面向きの渦巻き天体です。距離は約273万光年。見かけの大きさは約70&#x27;×40&#x27;。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>銀河は総合等級よりも表面輝度の影響が大きいため、暗い空と十分な暗順応が重要です。20〜30倍を目安に、まず中心核を捉え、視線を少し外す「そらし目」で淡い外縁を追います。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>局所銀河群の渦巻銀河で、正面に近い向きのため腕構造や星形成領域を研究しやすい銀河です。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>非常に淡く広がるため、総合等級の数字より観測が難しい「低表面輝度天体」の好例です。</p></div>`},
{id:"M35",name:"M35 散開星団",type:"cluster",icon:"🌟",cat:"メシエ",ra:92.2667,dec:24.3333,mag:5.3,dist:"約2,800光年",size:"約28'",scope:"20〜60倍",highlight:"ふたご座の大型散開星団",months:[10,11,12,1,2,3,4],story:`<div class="story-topic"><h4>概要</h4><p>M35 散開星団は、ふたご座の大型散開星団天体です。距離は約2,800光年。見かけの大きさは約28&#x27;。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>広がりを楽しむため低倍率が基本です。20〜60倍を目安に、視野の中で星の密集度や形を眺めます。暗い空では背景とのコントラストが上がります。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>散開星団は同じ分子雲からほぼ同時期に生まれた星々の集団です。星団内の星の色や明るさの違いを比べることで、恒星の質量と進化の関係を考えることができます。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>メシエ天体M35としてカタログ化された対象です。メシエカタログは、彗星探索中に紛らわしい恒星状・星雲状天体を記録したことから始まり、現在では代表的な深宇宙天体リストとして観望に広く使われています。</p></div>`},
{id:"M36",name:"M36 散開星団",type:"cluster",icon:"🌟",cat:"メシエ",ra:84.0667,dec:34.1333,mag:6.3,dist:"約4,100光年",size:"約12'",scope:"30〜80倍",highlight:"ぎょしゃ座の散開星団トリオの一つ",months:[9,10,11,12,1,2,3,4],story:`<div class="story-topic"><h4>概要</h4><p>M36 散開星団は、ぎょしゃ座の散開星団トリオの一つ天体です。距離は約4,100光年。見かけの大きさは約12&#x27;。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>30〜80倍を目安に、低倍率で全体像を確認してから倍率を上げ、周辺部の星がどこまで分離するかを見ます。口径と空の暗さが増すほど星粒が豊かになります。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>散開星団は同じ分子雲からほぼ同時期に生まれた星々の集団です。星団内の星の色や明るさの違いを比べることで、恒星の質量と進化の関係を考えることができます。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>メシエ天体M36としてカタログ化された対象です。メシエカタログは、彗星探索中に紛らわしい恒星状・星雲状天体を記録したことから始まり、現在では代表的な深宇宙天体リストとして観望に広く使われています。</p></div>`},
{id:"M37",name:"M37 散開星団",type:"cluster",icon:"🌟",cat:"メシエ",ra:88.0667,dec:35.8333,mag:6.2,dist:"約4,500光年",size:"約24'",scope:"30〜100倍",highlight:"ぎょしゃ座三散開星団の中で最大・最明",months:[9,10,11,12,1,2,3,4],story:`<div class="story-topic"><h4>概要</h4><p>M37 散開星団は、ぎょしゃ座三散開星団の中で最大・最明天体です。距離は約4,500光年。見かけの大きさは約24&#x27;。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>30〜100倍を目安に、低倍率で全体像を確認してから倍率を上げ、周辺部の星がどこまで分離するかを見ます。口径と空の暗さが増すほど星粒が豊かになります。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>散開星団は同じ分子雲からほぼ同時期に生まれた星々の集団です。星団内の星の色や明るさの違いを比べることで、恒星の質量と進化の関係を考えることができます。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>メシエ天体M37としてカタログ化された対象です。メシエカタログは、彗星探索中に紛らわしい恒星状・星雲状天体を記録したことから始まり、現在では代表的な深宇宙天体リストとして観望に広く使われています。</p></div>`},
{id:"M38",name:"M38 散開星団",type:"cluster",icon:"🌟",cat:"メシエ",ra:82.1833,dec:35.8333,mag:7.4,dist:"約4,200光年",size:"約21'",scope:"30〜80倍",highlight:"ぎょしゃ座三散開星団の一つ",months:[9,10,11,12,1,2,3,4],story:`<div class="story-topic"><h4>概要</h4><p>M38 散開星団は、ぎょしゃ座三散開星団の一つ天体です。距離は約4,200光年。見かけの大きさは約21&#x27;。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>30〜80倍を目安に、低倍率で全体像を確認してから倍率を上げ、周辺部の星がどこまで分離するかを見ます。口径と空の暗さが増すほど星粒が豊かになります。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>散開星団は同じ分子雲からほぼ同時期に生まれた星々の集団です。星団内の星の色や明るさの違いを比べることで、恒星の質量と進化の関係を考えることができます。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>メシエ天体M38としてカタログ化された対象です。メシエカタログは、彗星探索中に紛らわしい恒星状・星雲状天体を記録したことから始まり、現在では代表的な深宇宙天体リストとして観望に広く使われています。</p></div>`},
{id:"M41",name:"M41 散開星団",type:"cluster",icon:"🌟",cat:"メシエ",ra:101.5000,dec:-20.7167,mag:4.5,dist:"約2,300光年",size:"約38'",scope:"肉眼〜20倍",highlight:"シリウスの近くの明るい散開星団",months:[11,12,1,2,3],story:`<div class="story-topic"><h4>概要</h4><p>M41 散開星団は、シリウスの近くの明るい散開星団天体です。距離は約2,300光年。見かけの大きさは約38&#x27;。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>広がりを楽しむため低倍率が基本です。肉眼〜20倍を目安に、視野の中で星の密集度や形を眺めます。暗い空では背景とのコントラストが上がります。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>散開星団は同じ分子雲からほぼ同時期に生まれた星々の集団です。星団内の星の色や明るさの違いを比べることで、恒星の質量と進化の関係を考えることができます。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>メシエ天体M41としてカタログ化された対象です。メシエカタログは、彗星探索中に紛らわしい恒星状・星雲状天体を記録したことから始まり、現在では代表的な深宇宙天体リストとして観望に広く使われています。</p></div>`},
{id:"M42",name:"M42 オリオン大星雲",type:"nebula",icon:"✨",cat:"メシエ",ra:83.8221,dec:-5.3911,mag:4.0,dist:"約1,344光年",size:"約65'×60'",scope:"20〜100倍",highlight:"肉眼でも見える！現在進行形の星の産院",months:[10,11,12,1,2,3,4],story:`<div class="story-topic"><h4>概要</h4><p>M42 オリオン大星雲は、肉眼でも見える！現在進行形の星の産院天体です。距離は約1,344光年。見かけの大きさは約65&#x27;×60&#x27;。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>20〜100倍を目安に低倍率から始め、星雲全体の広がりを優先して観察します。暗い空では淡い外縁が伸び、対象によってはUHC/OIII系フィルターでコントラストが改善します。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>巨大分子雲の一部が若い大質量星からの紫外線で電離されて輝く星形成領域です。中心のトラペジウム星団は、生まれたばかりの星々が集まる場所です。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>古くから肉眼で存在が知られていましたが、望遠鏡時代以降に複雑なガス構造と若い星の集団が詳しく研究されるようになりました。</p></div>`,talk:`ここでは昔の星の光を見るだけでなく、星が生まれつつある現場を見ています。冬の案内では特に反応が良く、望遠鏡を向ける価値が高い代表天体です。`},
{id:"M44",name:"M44 プレセペ星団（蜂の巣）",type:"cluster",icon:"🐝",cat:"メシエ",ra:130.0500,dec:19.9833,mag:3.1,dist:"約577光年",size:"約95'",scope:"10〜30倍",highlight:"かに座の蜂の巣星団",months:[11,12,1,2,3,4,5],story:`<div class="story-topic"><h4>概要</h4><p>M44 プレセペ星団（蜂の巣）は、かに座の蜂の巣星団天体です。距離は約577光年。見かけの大きさは約95&#x27;。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>広がりを楽しむため低倍率が基本です。10〜30倍を目安に、視野の中で星の密集度や形を眺めます。暗い空では背景とのコントラストが上がります。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>散開星団は同じ分子雲からほぼ同時期に生まれた星々の集団です。星団内の星の色や明るさの違いを比べることで、恒星の質量と進化の関係を考えることができます。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>メシエ天体M44としてカタログ化された対象です。メシエカタログは、彗星探索中に紛らわしい恒星状・星雲状天体を記録したことから始まり、現在では代表的な深宇宙天体リストとして観望に広く使われています。</p></div>`},
{id:"M45",name:"M45 プレアデス星団（すばる）",type:"cluster",icon:"🌸",cat:"メシエ",ra:56.8500,dec:24.1167,mag:1.6,dist:"約440光年",size:"約110'",scope:"20〜30倍",highlight:"日本古来の「すばる」",months:[9,10,11,12,1,2,3,4],story:`<div class="story-topic"><h4>概要</h4><p>M45 プレアデス星団（すばる）は、日本古来の「すばる」天体です。距離は約440光年。見かけの大きさは約110&#x27;。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>広がりを楽しむため低倍率が基本です。20〜30倍を目安に、視野の中で星の密集度や形を眺めます。暗い空では背景とのコントラストが上がります。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>比較的若い散開星団で、青白い高温星が目立ちます。写真で見える青い星雲は、星団形成時の残りではなく周囲の塵を照らす反射星雲と考えられています。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>日本では「すばる」として古くから親しまれ、世界各地にも多様な神話・名称があります。</p></div>`},
{id:"M51",name:"M51 子持ち銀河",type:"galaxy",icon:"🌀",cat:"メシエ",ra:202.4696,dec:47.1952,mag:8.4,dist:"約2,300万光年",size:"約11'×7'",scope:"50〜150倍",highlight:"渦巻き構造が美しい",months:[1,2,3,4,5,6,7,8],story:`<div class="story-topic"><h4>概要</h4><p>M51 子持ち銀河は、渦巻き構造が美しい天体です。距離は約2,300万光年。見かけの大きさは約11&#x27;×7&#x27;。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>銀河は総合等級よりも表面輝度の影響が大きいため、暗い空と十分な暗順応が重要です。50〜150倍を目安に、まず中心核を捉え、視線を少し外す「そらし目」で淡い外縁を追います。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>典型的なグランドデザイン渦巻銀河で、伴銀河NGC 5195との重力相互作用が腕構造や星形成に影響しています。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>渦巻構造が望遠鏡で認識された最初期の銀河として天文学史上も重要です。</p></div>`},
{id:"M57",name:"M57 リング星雲",type:"nebula",icon:"💍",cat:"メシエ",ra:283.3962,dec:33.0294,mag:9.0,dist:"約2,300〜2,600光年",size:"約2.5'",scope:"100〜200倍",highlight:"ドーナツ形のリング。太陽の未来の姿",months:[4,5,6,7,8,9,10],story:`<div class="story-topic"><h4>概要</h4><p>M57 リング星雲は、ドーナツ形のリング。太陽の未来の姿天体です。距離は約2,300〜2,600光年。見かけの大きさは約2.5&#x27;。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>惑星状星雲は比較的小さく表面輝度が高いものが多いため、100〜200倍で倍率を上げても形を保ちやすい対象です。OIIIフィルターがコントラスト改善に有効な場合があります。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>中心星が放出したガス殻をほぼ軸方向から見ている惑星状星雲です。リング状に見えますが、実際には三次元的なガス構造を持ちます。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>こと座のβ星とγ星の間にあり、小型望遠鏡でも探しやすい惑星状星雲として定番です。</p></div>`},
{id:"M63",name:"M63 ひまわり銀河",type:"galaxy",icon:"🌻",cat:"メシエ",ra:198.9558,dec:42.0294,mag:8.6,dist:"約2,700万光年",size:"約12'×7.5'",scope:"50〜100倍",highlight:"ひまわりのような渦巻き構造",months:[1,2,3,4,5,6,7,8],story:`<div class="story-topic"><h4>概要</h4><p>M63 ひまわり銀河は、ひまわりのような渦巻き構造天体です。距離は約2,700万光年。見かけの大きさは約12&#x27;×7.5&#x27;。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>銀河は総合等級よりも表面輝度の影響が大きいため、暗い空と十分な暗順応が重要です。50〜100倍を目安に、まず中心核を捉え、視線を少し外す「そらし目」で淡い外縁を追います。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>銀河は数十億〜数千億規模の恒星、星間ガス、塵、暗黒物質などからなる巨大な系です。形や星形成活動の違いは、銀河の進化や周囲との相互作用を反映します。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>メシエ天体M63としてカタログ化された対象です。メシエカタログは、彗星探索中に紛らわしい恒星状・星雲状天体を記録したことから始まり、現在では代表的な深宇宙天体リストとして観望に広く使われています。</p></div>`},
{id:"M64",name:"M64 黒眼銀河",type:"galaxy",icon:"👁️",cat:"メシエ",ra:194.1825,dec:21.6828,mag:8.5,dist:"約1,700万光年",size:"約10'×5'",scope:"50〜150倍",highlight:"中心部に大きな暗黒帯",months:[1,2,3,4,5,6,7],story:`<div class="story-topic"><h4>概要</h4><p>M64 黒眼銀河は、中心部に大きな暗黒帯天体です。距離は約1,700万光年。見かけの大きさは約10&#x27;×5&#x27;。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>銀河は総合等級よりも表面輝度の影響が大きいため、暗い空と十分な暗順応が重要です。50〜150倍を目安に、まず中心核を捉え、視線を少し外す「そらし目」で淡い外縁を追います。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>中心近くの目立つ暗黒帯は塵による吸収です。内外でガスの回転方向が異なる領域があり、過去の銀河合体との関連が考えられています。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>暗黒帯が片目のように見えることから「黒眼銀河」と呼ばれます。</p></div>`},
{id:"M65",name:"M65 渦巻銀河",type:"galaxy",icon:"🌀",cat:"メシエ",ra:169.7333,dec:13.0922,mag:9.3,dist:"約3,500万光年",size:"約10'×3'",scope:"50〜100倍",highlight:"レオトリプレットの一つ",months:[12,1,2,3,4,5,6],story:`<div class="story-topic"><h4>概要</h4><p>M65 渦巻銀河は、レオトリプレットの一つ天体です。距離は約3,500万光年。見かけの大きさは約10&#x27;×3&#x27;。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>銀河は総合等級よりも表面輝度の影響が大きいため、暗い空と十分な暗順応が重要です。50〜100倍を目安に、まず中心核を捉え、視線を少し外す「そらし目」で淡い外縁を追います。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>銀河は数十億〜数千億規模の恒星、星間ガス、塵、暗黒物質などからなる巨大な系です。形や星形成活動の違いは、銀河の進化や周囲との相互作用を反映します。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>メシエ天体M65としてカタログ化された対象です。メシエカタログは、彗星探索中に紛らわしい恒星状・星雲状天体を記録したことから始まり、現在では代表的な深宇宙天体リストとして観望に広く使われています。</p></div>`},
{id:"M66",name:"M66 渦巻銀河",type:"galaxy",icon:"🌀",cat:"メシエ",ra:170.0625,dec:12.9917,mag:8.9,dist:"約3,600万光年",size:"約9'×4'",scope:"50〜100倍",highlight:"レオトリプレットの一つ",months:[12,1,2,3,4,5,6],story:`<div class="story-topic"><h4>概要</h4><p>M66 渦巻銀河は、レオトリプレットの一つ天体です。距離は約3,600万光年。見かけの大きさは約9&#x27;×4&#x27;。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>銀河は総合等級よりも表面輝度の影響が大きいため、暗い空と十分な暗順応が重要です。50〜100倍を目安に、まず中心核を捉え、視線を少し外す「そらし目」で淡い外縁を追います。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>銀河は数十億〜数千億規模の恒星、星間ガス、塵、暗黒物質などからなる巨大な系です。形や星形成活動の違いは、銀河の進化や周囲との相互作用を反映します。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>メシエ天体M66としてカタログ化された対象です。メシエカタログは、彗星探索中に紛らわしい恒星状・星雲状天体を記録したことから始まり、現在では代表的な深宇宙天体リストとして観望に広く使われています。</p></div>`},
{id:"M81",name:"M81 ボーデ銀河",type:"galaxy",icon:"🌀",cat:"メシエ",ra:148.8882,dec:69.0653,mag:6.9,dist:"約1,160万光年",size:"約26'×14'",scope:"50〜100倍",highlight:"整った渦巻き。M82とペアで比較観測",months:[1,2,3,4,5,6,7,8,9,10,11,12],story:`<div class="story-topic"><h4>概要</h4><p>M81 ボーデ銀河は、整った渦巻き。M82とペアで比較観測天体です。距離は約1,160万光年。見かけの大きさは約26&#x27;×14&#x27;。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>銀河は総合等級よりも表面輝度の影響が大きいため、暗い空と十分な暗順応が重要です。50〜100倍を目安に、まず中心核を捉え、視線を少し外す「そらし目」で淡い外縁を追います。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>大きく整った渦巻構造を持つ銀河で、近くのM82などと重力相互作用をしています。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>M82と同一視野に入る低倍率観測は、性質の異なる銀河を比較する定番の楽しみ方です。</p></div>`},
{id:"M82",name:"M82 葉巻銀河",type:"galaxy",icon:"💫",cat:"メシエ",ra:148.9696,dec:69.6797,mag:8.4,dist:"約1,200万光年",size:"約11'×4'",scope:"50〜100倍",highlight:"スターバースト銀河",months:[1,2,3,4,5,6,7,8,9,10,11,12],story:`<div class="story-topic"><h4>概要</h4><p>M82 葉巻銀河は、スターバースト銀河天体です。距離は約1,200万光年。見かけの大きさは約11&#x27;×4&#x27;。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>銀河は総合等級よりも表面輝度の影響が大きいため、暗い空と十分な暗順応が重要です。50〜100倍を目安に、まず中心核を捉え、視線を少し外す「そらし目」で淡い外縁を追います。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>中心部で非常に活発な星形成が起きているスターバースト銀河です。星形成と超新星活動によって銀河面の上下へガスが吹き出しています。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>細長い形から「葉巻銀河」と呼ばれ、M81との相互作用が活発な星形成を促したと考えられています。</p></div>`},
{id:"M87",name:"M87 楕円銀河（乙女座A）",type:"galaxy",icon:"🔵",cat:"メシエ",ra:187.7059,dec:12.3911,mag:8.6,dist:"約5,400万光年",size:"約7'×7'",scope:"50〜100倍",highlight:"2019年に人類初のブラックホール撮影に成功",months:[1,2,3,4,5,6,7],story:`<div class="story-topic"><h4>概要</h4><p>M87 楕円銀河（乙女座A）は、2019年に人類初のブラックホール撮影に成功天体です。距離は約5,400万光年。見かけの大きさは約7&#x27;×7&#x27;。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>銀河は総合等級よりも表面輝度の影響が大きいため、暗い空と十分な暗順応が重要です。50〜100倍を目安に、まず中心核を捉え、視線を少し外す「そらし目」で淡い外縁を追います。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>巨大楕円銀河で、中心には超大質量ブラックホールがあります。相対論的ジェットを放ち、銀河団中心の活動銀河として重要です。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>Event Horizon Telescopeにより、2019年に中心ブラックホール周辺の画像が初めて公開されました。</p></div>`},
{id:"M92",name:"M92 球状星団",type:"cluster",icon:"⭐",cat:"メシエ",ra:259.2808,dec:43.1358,mag:6.5,dist:"約2万6,700光年",size:"約14'",scope:"100〜200倍",highlight:"M13の近くのヘルクレス座球状星団",months:[3,4,5,6,7,8,9,10],story:`<div class="story-topic"><h4>概要</h4><p>M92 球状星団は、M13の近くのヘルクレス座球状星団天体です。距離は約2万6,700光年。見かけの大きさは約14&#x27;。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>100〜200倍を目安に、低倍率で全体像を確認してから倍率を上げ、周辺部の星がどこまで分離するかを見ます。口径と空の暗さが増すほど星粒が豊かになります。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>球状星団は銀河系のハローに多く存在する非常に古い恒星集団です。同じ距離・ほぼ同じ年代の星を多数含むため、恒星進化や銀河系形成史を調べる重要な研究対象です。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>メシエ天体M92としてカタログ化された対象です。メシエカタログは、彗星探索中に紛らわしい恒星状・星雲状天体を記録したことから始まり、現在では代表的な深宇宙天体リストとして観望に広く使われています。</p></div>`},
{id:"M101",name:"M101 風車銀河",type:"galaxy",icon:"🌀",cat:"メシエ",ra:210.8025,dec:54.3492,mag:7.9,dist:"約2,700万光年",size:"約29'×27'",scope:"30〜100倍",highlight:"正面向きの大型渦巻銀河",months:[1,2,3,4,5,6,7,8,9],story:`<div class="story-topic"><h4>概要</h4><p>M101 風車銀河は、正面向きの大型渦巻銀河天体です。距離は約2,700万光年。見かけの大きさは約29&#x27;×27&#x27;。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>銀河は総合等級よりも表面輝度の影響が大きいため、暗い空と十分な暗順応が重要です。30〜100倍を目安に、まず中心核を捉え、視線を少し外す「そらし目」で淡い外縁を追います。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>正面向きに近い大型渦巻銀河で、腕に多数のHII領域が見られます。非対称な構造は周辺銀河との相互作用の影響も受けています。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>「風車銀河」の名の通り渦巻腕が大きく広がりますが、表面輝度が低いため暗い空が重要です。</p></div>`},
{id:"M104",name:"M104 ソンブレロ銀河",type:"galaxy",icon:"🎩",cat:"メシエ",ra:189.9977,dec:-11.6231,mag:8.0,dist:"約2,800万光年",size:"約9'×4'",scope:"50〜150倍",highlight:"ソンブレロ帽のような形",months:[1,2,3,4,5,6,7],story:`<div class="story-topic"><h4>概要</h4><p>M104 ソンブレロ銀河は、ソンブレロ帽のような形天体です。距離は約2,800万光年。見かけの大きさは約9&#x27;×4&#x27;。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>銀河は総合等級よりも表面輝度の影響が大きいため、暗い空と十分な暗順応が重要です。50〜150倍を目安に、まず中心核を捉え、視線を少し外す「そらし目」で淡い外縁を追います。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>大きなバルジと濃いダストレーンを持つ銀河で、ほぼ横向きに近い角度から見ています。巨大な球状星団系も知られます。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>帽子のつばのような暗黒帯と明るい中心部から「ソンブレロ銀河」と呼ばれます。</p></div>`},
{id:"NGC869",name:"NGC869/884 ペルセウス二重星団",type:"cluster",icon:"💫",cat:"NGC",ra:34.7500,dec:57.1333,mag:4.3,dist:"約7,500光年",size:"約30'×30'",scope:"20〜40倍",highlight:"2つの星団が並ぶ絶景",months:[8,9,10,11,12,1,2,3],story:`<div class="story-topic"><h4>概要</h4><p>NGC869/884 ペルセウス二重星団は、2つの星団が並ぶ絶景天体です。距離は約7,500光年。見かけの大きさは約30&#x27;×30&#x27;。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>広がりを楽しむため低倍率が基本です。20〜40倍を目安に、視野の中で星の密集度や形を眺めます。暗い空では背景とのコントラストが上がります。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>散開星団は同じ分子雲からほぼ同時期に生まれた星々の集団です。星団内の星の色や明るさの違いを比べることで、恒星の質量と進化の関係を考えることができます。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>NGC（New General Catalogue）に収録された天体です。NGCは19世紀末にまとめられ、星雲・星団・銀河などを整理した代表的な深宇宙天体カタログです。</p></div>`},
{id:"NGC4565",name:"NGC4565 針銀河",type:"galaxy",icon:"🪡",cat:"NGC",ra:189.0867,dec:25.9878,mag:9.6,dist:"約4,200万光年",size:"約16'×2'",scope:"50〜150倍",highlight:"完全な横向き銀河の代表例",months:[1,2,3,4,5,6,7],story:`<div class="story-topic"><h4>概要</h4><p>NGC4565 針銀河は、完全な横向き銀河の代表例天体です。距離は約4,200万光年。見かけの大きさは約16&#x27;×2&#x27;。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>銀河は総合等級よりも表面輝度の影響が大きいため、暗い空と十分な暗順応が重要です。50〜150倍を目安に、まず中心核を捉え、視線を少し外す「そらし目」で淡い外縁を追います。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>薄い円盤をほぼ真横から見ている渦巻銀河で、中央バルジと細いダストレーンが目立ちます。銀河円盤の厚みを視覚的に理解しやすい天体です。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>針のように細長い外観から「針銀河」と呼ばれます。</p></div>`},
{id:"NGC6543",name:"NGC6543 キャッツアイ星雲",type:"nebula",icon:"👁️",cat:"NGC",ra:269.6392,dec:66.6333,mag:8.1,dist:"約3,300光年",size:"約0.3'",scope:"150〜300倍",highlight:"複雑な多重構造を持つ惑星状星雲",months:[3,4,5,6,7,8,9,10,11],story:`<div class="story-topic"><h4>概要</h4><p>NGC6543 キャッツアイ星雲は、複雑な多重構造を持つ惑星状星雲天体です。距離は約3,300光年。見かけの大きさは約0.3&#x27;。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>惑星状星雲は比較的小さく表面輝度が高いものが多いため、150〜300倍で倍率を上げても形を保ちやすい対象です。OIIIフィルターがコントラスト改善に有効な場合があります。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>中心星が複数回にわたって放出したガスや恒星風が複雑な殻を作る惑星状星雲です。高倍率・高解像度ほど細部が現れます。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>中心部の模様が猫の目のように見えることから「キャッツアイ星雲」の名があります。</p></div>`},
{id:"NGC6992",name:"NGC6992 網状星雲",type:"snr",icon:"🕸️",cat:"NGC",ra:314.2000,dec:31.7167,mag:7.0,dist:"約2,100光年",size:"約60'×8'",scope:"20〜50倍",highlight:"約5,000〜8,000年前の超新星爆発の残骸",months:[5,6,7,8,9,10,11],story:`<div class="story-topic"><h4>概要</h4><p>NGC6992 網状星雲は、約5,000〜8,000年前の超新星爆発の残骸天体です。距離は約2,100光年。見かけの大きさは約60&#x27;×8&#x27;。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>非常に淡い広がりを持つため、暗い空と低〜中倍率が有利です。20〜50倍を目安に、直接注視せずそらし目を使うと細い構造が浮かびやすくなります。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>はくちょう座ループと呼ばれる巨大な超新星残骸の一部です。衝撃波が星間ガスを加熱・電離し、細いフィラメント状に光ります。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>網のような繊細な構造から「網状星雲」と呼ばれ、OIIIフィルターが特に有効な対象として有名です。</p></div>`},
{id:"NGC7000",name:"NGC7000 北アメリカ星雲",type:"nebula",icon:"🌎",cat:"NGC",ra:314.7333,dec:44.3167,mag:4.0,dist:"約2,600光年",size:"約120'×100'",scope:"肉眼〜10倍",highlight:"北アメリカ大陸の形をした巨大散光星雲",months:[4,5,6,7,8,9,10,11],story:`<div class="story-topic"><h4>概要</h4><p>NGC7000 北アメリカ星雲は、北アメリカ大陸の形をした巨大散光星雲天体です。距離は約2,600光年。見かけの大きさは約120&#x27;×100&#x27;。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>肉眼〜10倍を目安に低倍率から始め、星雲全体の広がりを優先して観察します。暗い空では淡い外縁が伸び、対象によってはUHC/OIII系フィルターでコントラストが改善します。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>巨大なHII領域で、星間ガスが電離して赤く輝きます。非常に広いため望遠鏡より双眼鏡や低倍率、写真撮影との相性が良い対象です。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>外形が北アメリカ大陸に似ることからこの愛称が付きました。</p></div>`},
{id:"NGC7293",name:"NGC7293 らせん星雲",type:"nebula",icon:"🌀",cat:"NGC",ra:337.4108,dec:-20.8372,mag:7.6,dist:"約655光年",size:"約16'",scope:"30〜80倍",highlight:"地球に最も近い惑星状星雲",months:[6,7,8,9,10,11],story:`<div class="story-topic"><h4>概要</h4><p>NGC7293 らせん星雲は、地球に最も近い惑星状星雲天体です。距離は約655光年。見かけの大きさは約16&#x27;。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>惑星状星雲は比較的小さく表面輝度が高いものが多いため、30〜80倍で倍率を上げても形を保ちやすい対象です。OIIIフィルターがコントラスト改善に有効な場合があります。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>太陽に比較的近い惑星状星雲で、中心星から放出されたガス殻をほぼ正面から見ています。写真では複雑な環状構造が分かります。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>大きく淡い姿から「らせん星雲」と呼ばれ、写真では「神の目」の愛称で紹介されることもあります。</p></div>`},
{id:"NGC7789",name:"NGC7789 カロリーンのバラ",type:"cluster",icon:"🌹",cat:"NGC",ra:359.3333,dec:56.7167,mag:6.7,dist:"約8,000光年",size:"約25'",scope:"30〜100倍",highlight:"カシオペヤ座の豪華な散開星団",months:[8,9,10,11,12,1,2,3],story:`<div class="story-topic"><h4>概要</h4><p>NGC7789 カロリーンのバラは、カシオペヤ座の豪華な散開星団天体です。距離は約8,000光年。見かけの大きさは約25&#x27;。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>30〜100倍を目安に、低倍率で全体像を確認してから倍率を上げ、周辺部の星がどこまで分離するかを見ます。口径と空の暗さが増すほど星粒が豊かになります。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>散開星団は同じ分子雲からほぼ同時期に生まれた星々の集団です。星団内の星の色や明るさの違いを比べることで、恒星の質量と進化の関係を考えることができます。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>NGC（New General Catalogue）に収録された天体です。NGCは19世紀末にまとめられ、星雲・星団・銀河などを整理した代表的な深宇宙天体カタログです。</p></div>`},
{id:"NGC3628",name:"NGC3628 ハンバーガー銀河",type:"galaxy",icon:"🍔",cat:"NGC",ra:170.0700,dec:13.5892,mag:9.5,dist:"約3,500万光年",size:"約15'×3.5'",scope:"50〜100倍",highlight:"レオトリプレットの3番目",months:[12,1,2,3,4,5,6],story:`<div class="story-topic"><h4>概要</h4><p>NGC3628 ハンバーガー銀河は、レオトリプレットの3番目天体です。距離は約3,500万光年。見かけの大きさは約15&#x27;×3.5&#x27;。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>銀河は総合等級よりも表面輝度の影響が大きいため、暗い空と十分な暗順応が重要です。50〜100倍を目安に、まず中心核を捉え、視線を少し外す「そらし目」で淡い外縁を追います。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>ほぼ横向きの渦巻銀河で、濃いダストレーンが円盤を二分して見せます。M65・M66との重力相互作用で長い潮汐尾も形成されています。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>M65、M66と合わせて「レオトリプレット」を構成し、3銀河を同一視野で比較できます。</p></div>`},
{id:"IC434",name:"IC434 馬頭星雲",type:"nebula",icon:"🐴",cat:"IC",ra:85.2500,dec:-2.4583,mag:6.8,dist:"約1,500光年",size:"約60'×10'",scope:"50〜100倍（Hβフィルター推奨）",highlight:"馬の頭の形をした暗黒星雲",months:[10,11,12,1,2,3,4],story:`<div class="story-topic"><h4>概要</h4><p>IC434 馬頭星雲は、馬の頭の形をした暗黒星雲天体です。距離は約1,500光年。見かけの大きさは約60&#x27;×10&#x27;。数値だけでなく、実際の空でどのように見えるかを意識すると特徴をつかみやすくなります。</p></div><div class="story-topic"><h4>観測のポイント</h4><p>眼視難度の高い暗黒星雲です。50〜100倍（Hβフィルター推奨）を目安に大口径・十分な暗順応・Hβフィルターを組み合わせ、背景のIC434とのわずかな明暗差を探します。</p></div><div class="story-topic"><h4>天文学的な見どころ</h4><p>IC434という淡い発光星雲を背景に、前景の冷たい暗黒雲Barnard 33がシルエットとして浮かぶことで馬頭形が見えます。</p></div><div class="story-topic"><h4>歴史・名前</h4><p>写真では有名ですが眼視では非常に難しく、暗い空・大口径・Hβフィルターが大きな助けになります。</p></div>`},
];

const ALL_OBJECTS=[...DSO_DB,...STARS_DB];

/* =====================================================
全天星図データ・描画
===================================================== */
const SKY_EXTRA_STARS=window.NICOLE_COMMON?.SKY_EXTRA_STARS||[
{id:"Dubhe",name:"ドゥーベ",ra:165.932,dec:61.751,mag:1.79},{id:"Merak",name:"メラク",ra:165.460,dec:56.382,mag:2.37},{id:"Phecda",name:"フェクダ",ra:178.458,dec:53.695,mag:2.44},{id:"Megrez",name:"メグレズ",ra:183.856,dec:57.033,mag:3.31},{id:"Alioth",name:"アリオト",ra:193.507,dec:55.960,mag:1.77},{id:"Alkaid",name:"アルカイド",ra:206.885,dec:49.313,mag:1.86},
{id:"Schedar",name:"シェダル",ra:10.127,dec:56.537,mag:2.24},{id:"Caph",name:"カフ",ra:2.295,dec:59.150,mag:2.28},{id:"GammaCas",name:"カシオペヤ座γ",ra:14.177,dec:60.717,mag:2.15},{id:"Ruchbah",name:"ルクバ",ra:21.454,dec:60.235,mag:2.68},{id:"Segin",name:"セギン",ra:28.599,dec:63.670,mag:3.35},
{id:"Bellatrix",name:"ベラトリックス",ra:81.283,dec:6.350,mag:1.64},{id:"Alnilam",name:"アルニラム",ra:84.053,dec:-1.202,mag:1.69},{id:"Alnitak",name:"アルニタク",ra:85.190,dec:-1.943,mag:1.74},{id:"Mintaka",name:"ミンタカ",ra:83.002,dec:-0.299,mag:2.23},{id:"Saiph",name:"サイフ",ra:86.939,dec:-9.670,mag:2.06},
{id:"Denebola",name:"デネボラ",ra:177.265,dec:14.572,mag:2.14},{id:"Algieba",name:"アルギエバ",ra:154.993,dec:19.842,mag:2.01},{id:"Zosma",name:"ゾスマ",ra:168.527,dec:20.524,mag:2.56},
{id:"Shaula",name:"シャウラ",ra:263.402,dec:-37.104,mag:1.62},{id:"Sargas",name:"サルガス",ra:264.330,dec:-42.998,mag:1.86},{id:"Dschubba",name:"ジュバ",ra:240.083,dec:-22.622,mag:2.32},{id:"Acrab",name:"アクラブ",ra:241.359,dec:-19.805,mag:2.56},
{id:"KausAust",name:"カウス・アウストラリス",ra:276.043,dec:-34.385,mag:1.79},{id:"Nunki",name:"ヌンキ",ra:283.816,dec:-26.297,mag:2.05},{id:"Ascella",name:"アスケラ",ra:285.653,dec:-29.880,mag:2.60},
{id:"Alpheratz",name:"アルフェラッツ",ra:2.097,dec:29.090,mag:2.06},{id:"Mirach",name:"ミラク",ra:17.433,dec:35.621,mag:2.05},{id:"Markab",name:"マルカブ",ra:346.190,dec:15.205,mag:2.49},{id:"Scheat",name:"シェアト",ra:345.944,dec:28.083,mag:2.42},{id:"Algenib",name:"アルゲニブ",ra:3.309,dec:15.184,mag:2.84},
{id:"Sadr",name:"サドル",ra:305.557,dec:40.257,mag:2.23},{id:"GienahCyg",name:"ギェナー",ra:311.553,dec:33.970,mag:2.48},
{id:"Eltanin",name:"エルタニン",ra:269.152,dec:51.489,mag:2.24},{id:"Rastaban",name:"ラスタバン",ra:262.608,dec:52.301,mag:2.79},{id:"Kochab",name:"コカブ",ra:222.676,dec:74.156,mag:2.08},{id:"Pherkad",name:"フェルカド",ra:230.182,dec:71.834,mag:3.05},
{id:"Hamal",name:"ハマル",ra:31.793,dec:23.462,mag:2.00},{id:"Sheratan",name:"シェラタン",ra:28.660,dec:20.809,mag:2.64},{id:"Mirfak",name:"ミルファク",ra:51.081,dec:49.861,mag:1.79},{id:"Algol",name:"アルゴル",ra:47.042,dec:40.956,mag:2.12}
];

const SKY_STARS=[...STARS_DB.map(s=>({id:s.id,name:s.name.split("（")[0],ra:s.ra,dec:s.dec,mag:s.mag})),...SKY_EXTRA_STARS];
const SKY_STAR_MAP=Object.fromEntries(SKY_STARS.map(s=>[s.id,s]));
let SKY_MAP_HITS=[];
let SKY_FOCUS_CONSTELLATION_ID=null;
let SKY_FOCUS_OBJECT_ID=null;
let SKY_VIEW_DATE=null;

/* 現在時刻追従 */
let LIVE_NOW_MODE=false;
let LIVE_NOW_TIMER=null;
let LIVE_NOW_LAST_MINUTE_KEY=null;

/* 星図上の有名なアステリズム */
const SKY_ASTERISM_STARS=window.NICOLE_COMMON?.SKY_ASTERISM_STARS||{
Dubhe:{name:"ドゥーベ",ra:165.9320,dec:61.7510},
Merak:{name:"メラク",ra:165.4603,dec:56.3824},
Phecda:{name:"フェクダ",ra:178.4577,dec:53.6948},
Megrez:{name:"メグレズ",ra:183.8565,dec:57.0326},
Alioth:{name:"アリオト",ra:193.5073,dec:55.9598},
Mizar:{name:"ミザール",ra:200.9814,dec:54.9254},
Alkaid:{name:"アルカイド",ra:206.8852,dec:49.3133},
Vega:{name:"ベガ",ra:279.2347,dec:38.7837},
Deneb:{name:"デネブ",ra:310.3580,dec:45.2803},
Altair:{name:"アルタイル",ra:297.6958,dec:8.8683},
Sirius:{name:"シリウス",ra:101.2872,dec:-16.7161},
Procyon:{name:"プロキオン",ra:114.8255,dec:5.2250},
Betelgeuse:{name:"ベテルギウス",ra:88.7929,dec:7.4071},
Pollux:{name:"ポルックス",ra:116.3289,dec:28.0262},
Capella:{name:"カペラ",ra:79.1723,dec:45.9980},
Aldebaran:{name:"アルデバラン",ra:68.9802,dec:16.5093},
Rigel:{name:"リゲル",ra:78.6345,dec:-8.2016},
Arcturus:{name:"アルクトゥルス",ra:213.9153,dec:19.1822},
Spica:{name:"スピカ",ra:201.2983,dec:-11.1613},
Denebola:{name:"デネボラ",ra:177.2649,dec:14.5721},
Alpheratz:{name:"アルフェラッツ",ra:2.0969,dec:29.0904},
Scheat:{name:"シェアト",ra:345.9436,dec:28.0828},
Markab:{name:"マルカブ",ra:346.1902,dec:15.2053},
Algenib:{name:"アルゲニブ",ra:3.3089,dec:15.1836},
Alnitak:{name:"アルニタク",ra:85.1897,dec:-1.9426},
Alnilam:{name:"アルニラム",ra:84.0534,dec:-1.2019},
Mintaka:{name:"ミンタカ",ra:83.0017,dec:-0.2991},
Sadr:{name:"サドル",ra:305.5571,dec:40.2567},
Albireo:{name:"アルビレオ",ra:292.6803,dec:27.9597},
Fawaris:{name:"ファワリス",ra:296.2436,dec:45.1308},
GienahCyg:{name:"ギェナー",ra:311.5528,dec:33.9703}
};

const SKY_ASTERISMS=window.NICOLE_COMMON?.SKY_ASTERISMS||[
{name:"北斗七星",stars:["Dubhe","Merak","Phecda","Megrez","Alioth","Mizar","Alkaid"],lines:[["Dubhe","Merak"],["Merak","Phecda"],["Phecda","Megrez"],["Megrez","Alioth"],["Alioth","Mizar"],["Mizar","Alkaid"]]},
{name:"夏の大三角",stars:["Vega","Deneb","Altair"],lines:[["Vega","Deneb"],["Deneb","Altair"],["Altair","Vega"]]},
{name:"冬の大三角",stars:["Betelgeuse","Sirius","Procyon"],lines:[["Betelgeuse","Sirius"],["Sirius","Procyon"],["Procyon","Betelgeuse"]]},
{name:"冬のダイヤモンド",stars:["Capella","Aldebaran","Rigel","Sirius","Procyon","Pollux"],lines:[["Capella","Aldebaran"],["Aldebaran","Rigel"],["Rigel","Sirius"],["Sirius","Procyon"],["Procyon","Pollux"],["Pollux","Capella"]]},
{name:"春の大三角",stars:["Arcturus","Spica","Denebola"],lines:[["Arcturus","Spica"],["Spica","Denebola"],["Denebola","Arcturus"]]},
{name:"ペガススの四辺形（秋の四辺形）",stars:["Alpheratz","Scheat","Markab","Algenib"],lines:[["Alpheratz","Scheat"],["Scheat","Markab"],["Markab","Algenib"],["Algenib","Alpheratz"]]},
{name:"オリオンの三つ星",stars:["Mintaka","Alnilam","Alnitak"],lines:[["Mintaka","Alnilam"],["Alnilam","Alnitak"]]},
{name:"北十字",stars:["Deneb","Sadr","Albireo","Fawaris","GienahCyg"],lines:[["Deneb","Sadr"],["Sadr","Albireo"],["Fawaris","Sadr"],["Sadr","GienahCyg"]]}
];

const SKY_STAR_CONSTELLATION_MAP=window.NICOLE_COMMON?.SKY_STAR_CONSTELLATION_MAP||{
Sirius:"CMa",Canopus:"Car",Arcturus:"Boo",Vega:"Lyr",Capella:"Aur",Rigel:"Ori",Procyon:"CMi",
Betelgeuse:"Ori",Altair:"Aql",Aldebaran:"Tau",Spica:"Vir",Antares:"Sco",Pollux:"Gem",Fomalhaut:"PsA",
Deneb:"Cyg",Regulus:"Leo",Castor:"Gem",Polaris:"UMi",Albireo:"Cyg",EpsLyr:"Lyr",Mizar:"UMa",Almach:"And",
Dubhe:"UMa",Merak:"UMa",Phecda:"UMa",Megrez:"UMa",Alioth:"UMa",Alkaid:"UMa",
Schedar:"Cas",Caph:"Cas",GammaCas:"Cas",Ruchbah:"Cas",Segin:"Cas",
Bellatrix:"Ori",Alnilam:"Ori",Alnitak:"Ori",Mintaka:"Ori",Saiph:"Ori",
Denebola:"Leo",Algieba:"Leo",Zosma:"Leo",
Shaula:"Sco",Sargas:"Sco",Dschubba:"Sco",Acrab:"Sco",
KausAust:"Sgr",Nunki:"Sgr",Ascella:"Sgr",
Alpheratz:"And",Mirach:"And",Markab:"Peg",Scheat:"Peg",Algenib:"Peg",
Eltanin:"Dra",Rastaban:"Dra",Kochab:"UMi",Pherkad:"UMi",
Hamal:"Ari",Sheratan:"Ari",Mirfak:"Per",Algol:"Per",Sadr:"Cyg",GienahCyg:"Cyg"
};

let SKY_PROJECTION="allsky";
let SKY_PERSPECTIVE_AZ=180;
let SKY_PERSPECTIVE_ALT=35;
let SKY_DEVICE_MODE=false;
let SKY_DEVICE_LISTENER_ATTACHED=false;
let SKY_DEVICE_SMOOTH_AZ=null;
let SKY_DEVICE_SMOOTH_ALT=null;
let SKY_DEVICE_LAST_EVENT_AT=0;
let SKY_TRACKING_AZ_OFFSET=null;
let SKY_TRACKING_LAST_RAW_AZ=null;
let SKY_TRACKING_LAST_CONTINUOUS_AZ=null;
let SKY_TRACKING_SCREEN_ORIENTATION=0;
const SKY_PERSPECTIVE_FOV=100;
const SKY_CAMERA_LANDSCAPE_VFOV=53;
const SKY_CAMERA_PORTRAIT_VFOV=73;
let SKY_CAMERA_STREAM=null;
let SKY_CAMERA_AZ_CORRECTION=0;
let SKY_CAMERA_ALT_CORRECTION=0;
let SKY_CAMERA_LAST_ERROR="";
let SKY_CAMERA_SETTINGS=null;
function getActivePerspectiveFov(){
  if(SKY_PROJECTION!=="camera")return SKY_PERSPECTIVE_FOV;
  return SKY_PERSPECTIVE_ASPECT<1?SKY_CAMERA_PORTRAIT_VFOV:SKY_CAMERA_LANDSCAPE_VFOV;
}
/* 地平／追尾星図の描画アスペクト比。renderSkyChart()で更新する。 */
let SKY_PERSPECTIVE_ASPECT=1;

function getSkyPerspectiveViewport(radius){
const base=radius*1.06;
const aspect=Math.max(.45,Math.min(3.2,Number(SKY_PERSPECTIVE_ASPECT)||1));
/* 横長では高さ、縦長では幅を基準にし、どちらの向きでも描画領域を有効利用する */
if(aspect>=1)return{halfX:base*aspect,halfY:base};
return{halfX:base,halfY:base/aspect};
}
let SKY_ZOOM=1;
let SKY_PAN_X=0;
let SKY_PAN_Y=0;
const SKY_ZOOM_MIN=0.5;
const SKY_ZOOM_MAX=5;
const SKY_POINTERS=new Map();
let SKY_GESTURE=null;
let SKY_POINTER_MOVED=false;
let SKY_INTERACTIVE_RAF=0;

/* 選択した彗星のJPL Horizons見かけ軌道 */
let COMET_TRACK_DATA=null;
let COMET_TRACK_LOADING=false;
const COMET_TRACK_ENDPOINT="https://astro-nicole.hideld12.workers.dev/comet-track";
const NIGHT_COMETS_ENDPOINT="https://astro-nicole.hideld12.workers.dev/night-comets";

/* 星の鳥 — GitHub Static DB */
const HOSHINOTORI_BASE="https://kensukesuga86.github.io/Hoshinotori";
const HOSHINOTORI_INDEX_URL=`${HOSHINOTORI_BASE}/data/catalog/index.json`;
const HOSHINOTORI_INDEX_CACHE_KEY="nicole_hoshinotori_index_v2";
let HOSHINOTORI_INDEX=[];
let HOSHINOTORI_INDEX_LOADED=false;
let HOSHINOTORI_SELECTED=null;
const HOSHINOTORI_SHARD_CACHE=new Map();

/* 全天モードの写野中心。初期値は天頂。 */
let SKY_FOV_ALLSKY_ALT=90;
let SKY_FOV_ALLSKY_AZ=0;
let SKY_FOV_HIT_POLYGON=[];

let MILKYWAY_OUTLINE_DATA=null;
let MILKYWAY_LOADING=false;
const MILKYWAY_CACHE_KEY="nicole_milkyway_outline_v1";
const MILKYWAY_URLS=[
"https://raw.githubusercontent.com/sergio-dr/mw_geojson/main/mw_simplified_43p.json",
"https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data/mw.json"
];

const NICOLE_NIGHT_MODE_KEY="nicole_night_mode_v1";

let WEATHER_DATA=null;
let WEATHER_META=null;
let WEATHER_LOADING=false;
let WEATHER_MODEL_DATA={};
let WEATHER_MODEL_META=null;
let WEATHER_MODEL_LOADING=false;

const WEATHER_ENDPOINT="https://api.open-meteo.com/v1/forecast";
const WEATHER_FORECAST_CACHE_TTL=30*60*1000;      // 30分
const WEATHER_MODEL_CACHE_TTL=2*60*60*1000;       // 2時間
const WEATHER_CACHE_PREFIX="nicole_weather_cache_v3:";
const WEATHER_CACHE_INDEX_KEY="nicole_weather_cache_index_v3";
const WEATHER_CACHE_MAX_ENTRIES=10;
const WEATHER_FORECAST_INFLIGHT=new Map();
const WEATHER_MODEL_INFLIGHT=new Map();

function weatherLocationKey(lat,lon){
return `${Number(lat).toFixed(3)},${Number(lon).toFixed(3)}`;
}

function weatherModelLocationKey(lat,lon,altM){
const alt=Number.isFinite(Number(altM))?Math.round(Number(altM)/50)*50:0;
return `${weatherLocationKey(lat,lon)},${alt}`;
}

function weatherCacheStorageKey(kind,key){
return `${WEATHER_CACHE_PREFIX}${kind}:${key}`;
}

function touchWeatherCacheKey(storageKey){
try{
  const raw=localStorage.getItem(WEATHER_CACHE_INDEX_KEY);
  let list=raw?JSON.parse(raw):[];
  if(!Array.isArray(list))list=[];
  list=list.filter(x=>x&&x.key!==storageKey);
  list.push({key:storageKey,touchedAt:Date.now()});
  while(list.length>WEATHER_CACHE_MAX_ENTRIES){
    const old=list.shift();
    if(old?.key)localStorage.removeItem(old.key);
  }
  localStorage.setItem(WEATHER_CACHE_INDEX_KEY,JSON.stringify(list));
}catch(e){}
}

function writeWeatherCache(kind,key,payload){
try{
  const storageKey=weatherCacheStorageKey(kind,key);
  localStorage.setItem(storageKey,JSON.stringify({
    savedAt:Date.now(),
    payload
  }));
  touchWeatherCacheKey(storageKey);
}catch(e){
  console.warn("weather local cache write failed",e);
}
}

function readWeatherCache(kind,key,ttlMs,{allowStale=false}={}){
try{
  const storageKey=weatherCacheStorageKey(kind,key);
  const raw=localStorage.getItem(storageKey);
  if(!raw)return null;
  const parsed=JSON.parse(raw);
  if(!parsed||!Number.isFinite(Number(parsed.savedAt))||!parsed.payload)return null;
  const ageMs=Math.max(0,Date.now()-Number(parsed.savedAt));
  const fresh=ageMs<=ttlMs;
  if(!fresh&&!allowStale)return null;
  touchWeatherCacheKey(storageKey);
  return{payload:parsed.payload,savedAt:Number(parsed.savedAt),ageMs,fresh};
}catch(e){
  return null;
}
}

function weatherSavedLabel(meta){
if(!meta)return"";
if(meta.stale)return"保存済み予報（更新待ち） / ";
if(meta.fromLocalCache||meta.fromOfflineCache)return"保存済み予報 / ";
return"";
}

async function fetchWeatherJSON(url,timeoutMs=18000){
const controller=new AbortController();
const timer=setTimeout(()=>controller.abort(),timeoutMs);
try{
  const res=await fetch(url,{cache:"no-store",signal:controller.signal});
  if(!res.ok)throw new Error(`HTTP ${res.status}`);
  const data=await res.json();
  return{res,data};
}finally{
  clearTimeout(timer);
}
}
const WEATHER_COMPARE_MODELS=[
{id:"jma_msm",label:"JMA MSM"},
{id:"ecmwf_ifs",label:"ECMWF IFS"},
{id:"ncep_gfs_global",label:"NOAA GFS"}
];

function formatSkyViewDate(date){
if(!(date instanceof Date)||isNaN(date))return "—";
const pad=n=>String(n).padStart(2,"0");
return `${date.getFullYear()}/${pad(date.getMonth()+1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getSkyViewDate(){
if(SKY_VIEW_DATE instanceof Date&&!isNaN(SKY_VIEW_DATE)){
return new Date(SKY_VIEW_DATE);
}
if(currentDate instanceof Date&&!isNaN(currentDate)){
return new Date(currentDate);
}
const v=$("#inDatetime").value;
return v?new Date(v):new Date();
}

function getSkyBaseDate(){
if(currentDate instanceof Date&&!isNaN(currentDate))return new Date(currentDate);
const v=$("#inDatetime").value;
return v?new Date(v):new Date();
}

function getSkyTimeOffsetHours(){
const base=getSkyBaseDate();
const view=getSkyViewDate();
return (view-base)/3600000;
}

function syncSkyTimeSlider(){
const slider=$("#skyTimeSlider");
if(!slider)return;
const offset=getSkyTimeOffsetHours();
const min=Number(slider.min),max=Number(slider.max);
slider.value=Math.max(min,Math.min(max,offset));
}

function setSkyViewOffsetHours(hours){
const slider=$("#skyTimeSlider");
const min=slider?Number(slider.min):-24;
const max=slider?Number(slider.max):24;
const clamped=Math.max(min,Math.min(max,Number(hours)||0));
const base=getSkyBaseDate();
SKY_VIEW_DATE=new Date(base.getTime()+clamped*3600000);
if(HOSHINOTORI_SELECTED)renderHoshinotoriSelected();

/* JPL小天体は取得時刻に依存するが、表示チェック自体は維持する。
   条件が一致しない場合は renderSkyChart 側で描画しない。 */
renderSkyChart();
}

function shiftSkyViewTime(hours){
setSkyViewOffsetHours(getSkyTimeOffsetHours()+hours);
}

function resetSkyViewTime(){
SKY_VIEW_DATE=getSkyBaseDate();
if(HOSHINOTORI_SELECTED)renderHoshinotoriSelected();
renderSkyChart();
}

function setLiveNowButtonState(){
const btn=$("#btnNow");
if(!btn)return;
btn.classList.toggle("live-now",LIVE_NOW_MODE);
btn.textContent=LIVE_NOW_MODE?"🟢 現在時刻に追従中":"🕐 現在時刻をセット";
}

function stopLiveNowMode(){
LIVE_NOW_MODE=false;
if(LIVE_NOW_TIMER){clearInterval(LIVE_NOW_TIMER);LIVE_NOW_TIMER=null;}
LIVE_NOW_LAST_MINUTE_KEY=null;
setLiveNowButtonState();
}

function refreshLiveNow(force=false){
if(!LIVE_NOW_MODE)return;
const now=new Date();
const resultVisible=$("#resultArea")&&$("#resultArea").style.display!=="none";
let offset=0;
if(currentDate instanceof Date&&!isNaN(currentDate) && SKY_VIEW_DATE instanceof Date&&!isNaN(SKY_VIEW_DATE)){
offset=(SKY_VIEW_DATE-currentDate)/3600000;
}
$("#inDatetime").value=toDatetimeLocalValue(now);

if(resultVisible && Number.isFinite(currentLat) && Number.isFinite(currentLon)){
currentDate=new Date(now);
SKY_VIEW_DATE=new Date(now.getTime()+offset*3600000);

const minuteKey=`${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`;
if(force||minuteKey!==LIVE_NOW_LAST_MINUTE_KEY){
LIVE_NOW_LAST_MINUTE_KEY=minuteKey;
const minAlt=parseInt($("#inMinAlt").value)||20;
const maxMag=parseFloat($("#inMaxMag").value)||11;
currentResults=calcObjects(currentLat,currentLon,currentDate,minAlt,maxMag);
renderRecommendations(currentResults);
renderSkyInfo(currentLat,currentLon,currentDate);
renderCards(currentResults);
renderConstellations(currentDate.getMonth()+1,$("#constSearch")?.value||"");
const p=n=>String(n).padStart(2,"0");
$("#resDate").textContent=`${now.getFullYear()}年${p(now.getMonth()+1)}月${p(now.getDate())}日 ${p(now.getHours())}:${p(now.getMinutes())}（現在時刻に追従）`;
}
if(!document.hidden){renderSkyChart();renderPolarScopeGuide(currentLat,currentLon,currentDate);}
}else{
SKY_VIEW_DATE=new Date(now);
}
}

function startLiveNowMode(){
stopLiveNowMode();
LIVE_NOW_MODE=true;
SKY_VIEW_DATE=new Date();
setLiveNowButtonState();
refreshLiveNow(true);
LIVE_NOW_TIMER=setInterval(()=>refreshLiveNow(false),5000);
}

function skyPanelIsFullscreen(){
const wrap=$("#skyMapCanvasWrap");
return !!wrap && (document.fullscreenElement===wrap || wrap.classList.contains("sky-fullscreen-fallback"));
}

function updateSkyFullscreenButton(){
const isFull=skyPanelIsFullscreen();
const btn=$("#skyFullscreen");
if(btn)btn.textContent=isFull?"⤢ 全画面終了":"⛶ 全画面";
const trackingBtn=$("#skyTrackingFullscreen");
if(trackingBtn)trackingBtn.textContent=isFull?"⤢ 全画面終了":"⛶ 追尾を全画面";
const cameraBtn=$("#skyCameraFullscreen");
if(cameraBtn)cameraBtn.textContent=isFull?"⤢ 全画面終了":"⛶ カメラを全画面";
}

function syncNightFullscreenFilter(){
/* v2.0.1: red mode is an overlay; no filtered ancestor/fullscreen handoff is required. */
}

async function toggleSkyFullscreen(){
const wrap=$("#skyMapCanvasWrap");
if(!wrap)return;

if(document.fullscreenElement===wrap){
  await document.exitFullscreen?.();
  return;
}
if(wrap.classList.contains("sky-fullscreen-fallback")){
  wrap.classList.remove("sky-fullscreen-fallback");
  document.body.classList.remove("sky-fullscreen-open");
  updateSkyFullscreenButton();
  setTimeout(()=>{renderSkyChart();syncSkyInteractionLayer();},60);
  return;
}

if(wrap.requestFullscreen){
  try{
    await wrap.requestFullscreen();
    return;
  }catch(e){
    console.info("Native fullscreen unavailable; using Nicole fallback.",e);
  }
}

wrap.classList.add("sky-fullscreen-fallback");
document.body.classList.add("sky-fullscreen-open");
updateSkyFullscreenButton();
setTimeout(()=>{renderSkyChart();syncSkyInteractionLayer();},60);
}

function isHorizonProjection(){
return SKY_PROJECTION==="perspective"||SKY_PROJECTION==="tracking"||SKY_PROJECTION==="camera";
}

function updateSkyProjectionUI(){
const allBtn=$("#skyViewAllSky");
const pBtn=$("#skyViewPerspective");
const tBtn=$("#skyViewTracking");
const cBtn=$("#skyViewCamera");
const controls=$("#skyPerspectiveControls");
const tracking=$("#skyTrackingControls");
const camera=$("#skyCameraControls");
const hint=$("#skyViewHint");

if(allBtn)allBtn.classList.toggle("active",SKY_PROJECTION==="allsky");
if(pBtn)pBtn.classList.toggle("active",SKY_PROJECTION==="perspective");
if(tBtn)tBtn.classList.toggle("active",SKY_PROJECTION==="tracking");
if(cBtn)cBtn.classList.toggle("active",SKY_PROJECTION==="camera");
if(controls)controls.classList.toggle("show",SKY_PROJECTION==="perspective");
if(tracking)tracking.classList.toggle("show",SKY_PROJECTION==="tracking");
if(camera)camera.classList.toggle("show",SKY_PROJECTION==="camera");

if(hint){
  if(SKY_PROJECTION==="camera")hint.textContent="背面カメラ映像に星図を重ねます。中央の＋で位置合わせできます";
  else if(SKY_PROJECTION==="tracking")hint.textContent="端末の姿勢を専用追尾モードで星図へ反映";
  else if(SKY_PROJECTION==="perspective")hint.textContent="ドラッグ／スワイプで向き変更";
  else hint.textContent="天頂を中心に地平線まで表示／写野は枠内をドラッグして移動";
}
}

function setSkyProjection(mode){
SKY_PROJECTION=(mode==="perspective"||mode==="tracking"||mode==="camera")?mode:"allsky";
SKY_ZOOM=1;
SKY_PAN_X=0;
SKY_PAN_Y=0;
updateSkyProjectionUI();
updateSkyTrackingTargetStatus();
renderSkyChart();
requestAnimationFrame(syncSkyInteractionLayer);
}


function updateSkyDeviceUI(message=""){
const status=$("#skyDeviceStatus");
if(status){
  status.textContent=message||(SKY_DEVICE_MODE?"センサー待機中…":"停止中");
  status.style.color=SKY_DEVICE_MODE?"#86efac":"#6a8aaa";
}
updateSkyProjectionUI();
updateSkyTrackingTargetStatus();
}

function circularSmoothDeg(previous,next,weight=0.22){
if(!Number.isFinite(previous))return normalizeAzimuthDeg(next);
const d=((next-previous+540)%360)-180;
return normalizeAzimuthDeg(previous+d*weight);
}

function currentScreenOrientationDeg(){
const angle=Number(screen.orientation?.angle);
if(Number.isFinite(angle))return ((angle%360)+360)%360;
const legacy=Number(window.orientation);
return Number.isFinite(legacy)?((legacy%360)+360)%360:0;
}

function deviceViewingDirection(event){
const alpha=Number(event.alpha),beta=Number(event.beta),gamma=Number(event.gamma);
if(!Number.isFinite(alpha)||!Number.isFinite(beta)||!Number.isFinite(gamma))return null;

const a=alpha*D2R,b=beta*D2R,g=gamma*D2R;
const ca=Math.cos(a),sa=Math.sin(a),cb=Math.cos(b),sb=Math.sin(b),cg=Math.cos(g),sg=Math.sin(g);

/* DeviceOrientation Z-X-Y 回転を端末背面法線へ適用 */
let x=-(ca*sg + sa*sb*cg); // east
let y=-(sa*sg - ca*sb*cg); // north
let z=-(cb*cg);             // up

/*
  画面の portrait / landscape はUIの回転角であり、ここで方位ベクトルへ
  もう一度加えると横持ち時に90°の二重補正になる。
  DeviceOrientation の beta / gamma には端末の物理的な回転が既に反映されるため、
  screen.orientation は診断・レイアウト用に保持するだけで方位計算には適用しない。
*/
const orient=currentScreenOrientationDeg();
SKY_TRACKING_SCREEN_ORIENTATION=orient;

const len=Math.hypot(x,y,z)||1;
const alt=Math.asin(Math.max(-1,Math.min(1,z/len)))*R2D;
let rawAz=normalizeAzimuthDeg(Math.atan2(x,y)*R2D);

/*
  高仰角でEuler表現の枝が切り替わり方位だけ約180°飛ぶ端末がある。
  連続するイベント間では実視線が突然180°回らないことを利用して、
  rawAz と rawAz+180° のうち直前方向に連続する方を選ぶ。
*/
if(alt>=30&&Number.isFinite(SKY_TRACKING_LAST_CONTINUOUS_AZ)){
  const c0=rawAz,c1=normalizeAzimuthDeg(rawAz+180);
  const d0=Math.abs(((c0-SKY_TRACKING_LAST_CONTINUOUS_AZ+540)%360)-180);
  const d1=Math.abs(((c1-SKY_TRACKING_LAST_CONTINUOUS_AZ+540)%360)-180);
  if(d1+15<d0)rawAz=c1;
}
SKY_TRACKING_LAST_CONTINUOUS_AZ=rawAz;

/* iOSの絶対方位は低〜中仰角だけでゆっくり校正し、高仰角では固定 */
const compass=Number(event.webkitCompassHeading);
if(Number.isFinite(compass)&&alt>=-5&&alt<=35&&Math.abs(gamma)<=60){
  const target=((normalizeAzimuthDeg(compass)-rawAz+540)%360)-180;
  if(!Number.isFinite(SKY_TRACKING_AZ_OFFSET))SKY_TRACKING_AZ_OFFSET=target;
  else{
    const d=((target-SKY_TRACKING_AZ_OFFSET+540)%360)-180;
    SKY_TRACKING_AZ_OFFSET+=d*0.02;
  }
}

const az=normalizeAzimuthDeg(rawAz+(Number.isFinite(SKY_TRACKING_AZ_OFFSET)?SKY_TRACKING_AZ_OFFSET:0));
SKY_TRACKING_LAST_RAW_AZ=rawAz;
return{az,alt,rawAz,screenOrientation:orient};
}

function handleSkyDeviceOrientation(event){
if(!SKY_DEVICE_MODE||(SKY_PROJECTION!=="tracking"&&SKY_PROJECTION!=="camera"))return;
const dir=deviceViewingDirection(event);
if(!dir)return;

SKY_DEVICE_SMOOTH_AZ=circularSmoothDeg(SKY_DEVICE_SMOOTH_AZ,dir.az,0.20);
if(!Number.isFinite(SKY_DEVICE_SMOOTH_ALT))SKY_DEVICE_SMOOTH_ALT=dir.alt;
else SKY_DEVICE_SMOOTH_ALT+=(dir.alt-SKY_DEVICE_SMOOTH_ALT)*0.20;

const cameraMode=SKY_PROJECTION==="camera";
SKY_PERSPECTIVE_AZ=normalizeAzimuthDeg(SKY_DEVICE_SMOOTH_AZ+(cameraMode?SKY_CAMERA_AZ_CORRECTION:0));
SKY_PERSPECTIVE_ALT=Math.max(0,Math.min(89,SKY_DEVICE_SMOOTH_ALT+(cameraMode?SKY_CAMERA_ALT_CORRECTION:0)));
SKY_DEVICE_LAST_EVENT_AT=Date.now();
syncPerspectiveSelectors();
updateSkyDeviceUI(`${azToDir(SKY_PERSPECTIVE_AZ)} ${Math.round(SKY_PERSPECTIVE_AZ)}° / 仰角 ${Math.round(SKY_PERSPECTIVE_ALT)}°`);
if(SKY_PROJECTION==="camera"){
  const s=$("#skyCameraStatus");
  if(s)s.textContent=`📷 ${azToDir(SKY_PERSPECTIVE_AZ)} ${Math.round(SKY_PERSPECTIVE_AZ)}° / 仰角 ${Math.round(SKY_PERSPECTIVE_ALT)}°`;
  const fs=$("#skyCameraStatusFullscreen");
  if(fs)fs.textContent=`📷 ${azToDir(SKY_PERSPECTIVE_AZ)} ${Math.round(SKY_PERSPECTIVE_AZ)}° / 仰角 ${Math.round(SKY_PERSPECTIVE_ALT)}°`;
}
requestSkyInteractiveRender();
}

function attachSkyDeviceOrientation(){
if(SKY_DEVICE_LISTENER_ATTACHED)return;
window.addEventListener("deviceorientation",handleSkyDeviceOrientation,true);
SKY_DEVICE_LISTENER_ATTACHED=true;
}
screen.orientation?.addEventListener?.("change",()=>{
SKY_TRACKING_LAST_CONTINUOUS_AZ=null;
SKY_DEVICE_SMOOTH_AZ=null;
SKY_DEVICE_SMOOTH_ALT=null;
});
window.addEventListener("orientationchange",()=>{
SKY_TRACKING_LAST_CONTINUOUS_AZ=null;
SKY_DEVICE_SMOOTH_AZ=null;
SKY_DEVICE_SMOOTH_ALT=null;
});


function disableSkyDeviceOrientation(message="手動"){
SKY_DEVICE_MODE=false;
SKY_DEVICE_SMOOTH_AZ=null;
SKY_DEVICE_SMOOTH_ALT=null;
SKY_TRACKING_AZ_OFFSET=null;
SKY_TRACKING_LAST_RAW_AZ=null;
SKY_TRACKING_LAST_CONTINUOUS_AZ=null;
updateSkyDeviceUI(message);
}

async function enableSkyTrackingMode(){
if(!("DeviceOrientationEvent" in window)){
  setSkyProjection("perspective");
  updateSkyDeviceUI("この端末ではセンサーを利用できません");
  return;
}
try{
  if(typeof DeviceOrientationEvent.requestPermission==="function"){
    const permission=await DeviceOrientationEvent.requestPermission();
    if(permission!=="granted"){
      setSkyProjection("perspective");
      updateSkyDeviceUI("センサー利用が許可されていません");
      return;
    }
  }
  SKY_DEVICE_MODE=true;
  SKY_DEVICE_SMOOTH_AZ=null;
  SKY_DEVICE_SMOOTH_ALT=null;
  SKY_TRACKING_AZ_OFFSET=null;
  SKY_TRACKING_LAST_RAW_AZ=null;
  SKY_TRACKING_LAST_CONTINUOUS_AZ=null;
  attachSkyDeviceOrientation();
  setSkyProjection("tracking");
  updateSkyDeviceUI("センサー待機中…");
}catch(error){
  console.warn("Device orientation permission failed",error);
  SKY_DEVICE_MODE=false;
  setSkyProjection("perspective");
  updateSkyDeviceUI("センサーを開始できませんでした");
}
}


function updateCameraCorrectionReadout(){
  const text=`補正 方位 ${SKY_CAMERA_AZ_CORRECTION>=0?"+":""}${SKY_CAMERA_AZ_CORRECTION.toFixed(1)}° / 高度 ${SKY_CAMERA_ALT_CORRECTION>=0?"+":""}${SKY_CAMERA_ALT_CORRECTION.toFixed(1)}°`;
  const el=$("#cameraCorrectionReadout");
  const fs=$("#cameraCorrectionReadoutFullscreen");
  if(el)el.textContent=text;
  if(fs)fs.textContent=text;
}
function stopSkyCameraStream(){
  if(SKY_CAMERA_STREAM){
    SKY_CAMERA_STREAM.getTracks().forEach(track=>track.stop());
    SKY_CAMERA_STREAM=null;
    SKY_CAMERA_SETTINGS=null;
  }
  const video=$("#skyCameraVideo");
  if(video){video.pause();video.srcObject=null;}
  $("#skyMapCanvasWrap")?.classList.remove("camera-active");
  const status=$("#skyCameraStatus");
  if(status)status.textContent="カメラ停止中";
  const fsStatus=$("#skyCameraStatusFullscreen");
  if(fsStatus)fsStatus.textContent="カメラ停止中";
  const canvas=$("#skyMapCanvas");
  if(canvas)canvas.style.opacity="1";
}
function setCameraOverlayOpacity(value){
  const pct=Math.max(20,Math.min(100,Number(value)||80));
  const normal=$("#skyCameraOverlayOpacity");
  const fullscreen=$("#skyCameraOverlayOpacityFullscreen");
  if(normal&&Number(normal.value)!==pct)normal.value=String(pct);
  if(fullscreen&&Number(fullscreen.value)!==pct)fullscreen.value=String(pct);
  const canvas=$("#skyMapCanvas");
  if(canvas)canvas.style.opacity=String(pct/100);
}

async function requestSkyCameraStream(){
  if(!navigator.mediaDevices?.getUserMedia)throw new Error("このブラウザではカメラを利用できません");
  stopSkyCameraStream();
  const stream=await navigator.mediaDevices.getUserMedia({
    video:{facingMode:{ideal:"environment"}},
    audio:false
  });
  SKY_CAMERA_STREAM=stream;
  const video=$("#skyCameraVideo");
  if(!video)throw new Error("カメラ表示領域を初期化できません");
  video.srcObject=stream;
  video.muted=true;
  video.setAttribute("playsinline","");
  await video.play();
  /* 対応端末では倍率を1x付近へ固定する。非対応でも通常の背面メインカメラを使う。 */
  const track=stream.getVideoTracks()[0];
  try{
    const caps=track.getCapabilities?.();
    if(caps?.zoom){
      const z=Math.max(caps.zoom.min,Math.min(caps.zoom.max,1));
      await track.applyConstraints({advanced:[{zoom:z}]});
    }
  }catch(e){console.warn("Camera zoom constraint skipped",e);}
  SKY_CAMERA_SETTINGS=track.getSettings?.()||null;
  console.info("Nicole camera settings",SKY_CAMERA_SETTINGS);
  $("#skyMapCanvasWrap")?.classList.add("camera-active");
  setCameraOverlayOpacity($("#skyCameraOverlayOpacity")?.value||80);
}
async function enableSkyCameraMode(){
  try{
    if(!("DeviceOrientationEvent" in window))throw new Error("この端末では方向センサーを利用できません");
    if(typeof DeviceOrientationEvent.requestPermission==="function"){
      const permission=await DeviceOrientationEvent.requestPermission();
      if(permission!=="granted")throw new Error("方向センサーの利用が許可されていません");
    }
    await requestSkyCameraStream();
    SKY_DEVICE_MODE=true;
    SKY_DEVICE_SMOOTH_AZ=null;
    SKY_DEVICE_SMOOTH_ALT=null;
    SKY_TRACKING_AZ_OFFSET=null;
    SKY_TRACKING_LAST_RAW_AZ=null;
    SKY_TRACKING_LAST_CONTINUOUS_AZ=null;
    attachSkyDeviceOrientation();
    setSkyProjection("camera");
    updateCameraCorrectionReadout();
    setCameraOverlayOpacity($("#skyCameraOverlayOpacity")?.value||80);
    const fsControls=$("#cameraFullscreenControls");
    if(fsControls)fsControls.open=true;
    const status=$("#skyCameraStatus");
    if(status)status.textContent="📷 カメラ起動中：端末を空へ向けてください";
    const fsStatus=$("#skyCameraStatusFullscreen");
    if(fsStatus)fsStatus.textContent="📷 カメラ起動中：端末を空へ向けてください";
  }catch(error){
    console.warn("Sky camera start failed",error);
    SKY_CAMERA_LAST_ERROR=String(error?.message||error||"カメラを開始できませんでした");
    stopSkyCameraStream();
    disableSkyDeviceOrientation();
    setSkyProjection("perspective");
    alert(`カメラ星図を開始できませんでした。\n${SKY_CAMERA_LAST_ERROR}\n\nSafariのカメラ・モーションと方向の利用許可を確認してください。`);
  }
}
function exitSkyCameraMode(){
  stopSkyCameraStream();
  disableSkyDeviceOrientation("停止中");
  setSkyProjection("perspective");
}
function adjustCameraAlignment(azDelta=0,altDelta=0){
  SKY_CAMERA_AZ_CORRECTION+=Number(azDelta)||0;
  SKY_CAMERA_ALT_CORRECTION+=Number(altDelta)||0;
  if(Number.isFinite(SKY_DEVICE_SMOOTH_AZ))SKY_PERSPECTIVE_AZ=normalizeAzimuthDeg(SKY_DEVICE_SMOOTH_AZ+SKY_CAMERA_AZ_CORRECTION);
  if(Number.isFinite(SKY_DEVICE_SMOOTH_ALT))SKY_PERSPECTIVE_ALT=Math.max(0,Math.min(89,SKY_DEVICE_SMOOTH_ALT+SKY_CAMERA_ALT_CORRECTION));
  updateCameraCorrectionReadout();
  renderSkyChart();
}
function resetCameraAlignment(){
  SKY_CAMERA_AZ_CORRECTION=0;
  SKY_CAMERA_ALT_CORRECTION=0;
  adjustCameraAlignment(0,0);
}
function alignCameraToSelectedTarget(){
  const date=getSkyViewDate();
  const target=getSkyFocusTarget(date);
  const lat=Number.isFinite(currentLat)?currentLat:parseFloat($("#inLat")?.value);
  const lon=Number.isFinite(currentLon)?currentLon:parseFloat($("#inLon")?.value);
  if(!target){alert("先に天体カードや今夜のおすすめから「星図で見る」で基準天体を選択してください。");return;}
  if(!Number.isFinite(lat)||!Number.isFinite(lon)){alert("観測地点を設定してください。");return;}
  if(!Number.isFinite(SKY_DEVICE_SMOOTH_AZ)||!Number.isFinite(SKY_DEVICE_SMOOTH_ALT)){alert("端末の方向センサーをまだ取得できていません。端末を空へ向けて少し待ってください。");return;}
  const aa=altAz(target.ra,target.dec,lat,lon,date);
  SKY_CAMERA_AZ_CORRECTION=((aa.az-SKY_DEVICE_SMOOTH_AZ+540)%360)-180;
  SKY_CAMERA_ALT_CORRECTION=aa.alt-SKY_DEVICE_SMOOTH_ALT;
  SKY_PERSPECTIVE_AZ=normalizeAzimuthDeg(aa.az);
  SKY_PERSPECTIVE_ALT=Math.max(0,Math.min(89,aa.alt));
  updateCameraCorrectionReadout();
  renderSkyChart();
  const status=$("#skyCameraStatus");
  if(status)status.textContent=`◎ ${target.name} を画面中央の基準に設定しました`;
  const fsStatus=$("#skyCameraStatusFullscreen");
  if(fsStatus)fsStatus.textContent=`◎ ${target.name} を画面中央の基準に設定しました`;
}

function normalizeAzimuthDeg(v){
let a=Number(v)||0;
a=((a%360)+360)%360;
return a;
}

function clampPerspectiveAltitudeDeg(v){
return Math.max(5,Math.min(85,Number(v)||35));
}

function syncPerspectiveSelectors(){
const azSel=$("#skyPerspectiveAz");
const altSel=$("#skyPerspectiveAlt");
if(azSel){
const azPreset=(Math.round(SKY_PERSPECTIVE_AZ/45)*45)%360;
azSel.value=String(azPreset);
}
if(altSel){
const presets=[20,35,50,65,75];
let closest=presets[0];
for(const v of presets){
if(Math.abs(v-SKY_PERSPECTIVE_ALT)<Math.abs(closest-SKY_PERSPECTIVE_ALT))closest=v;
}
altSel.value=String(closest);
}
}

function requestSkyInteractiveRender(){
if(SKY_INTERACTIVE_RAF)return;
SKY_INTERACTIVE_RAF=requestAnimationFrame(()=>{
SKY_INTERACTIVE_RAF=0;
renderSkyChart(true);
});
}

function clampSkyZoom(v){
return Math.max(SKY_ZOOM_MIN,Math.min(SKY_ZOOM_MAX,v));
}

function limitSkyPan(){
const canvas=$("#skyMapCanvas");
if(!canvas)return;
if(SKY_ZOOM<=1.001){
SKY_PAN_X=0;
SKY_PAN_Y=0;
return;
}
const size=Math.min(canvas.clientWidth||760,canvas.clientHeight||760);
const maxPan=size*0.44*(SKY_ZOOM-1);
SKY_PAN_X=Math.max(-maxPan,Math.min(maxPan,SKY_PAN_X));
SKY_PAN_Y=Math.max(-maxPan,Math.min(maxPan,SKY_PAN_Y));
}

function setSkyZoom(newZoom,anchorX=null,anchorY=null){
const canvas=$("#skyMapCanvas");
const oldZoom=SKY_ZOOM;
const z=clampSkyZoom(newZoom);

if(canvas&&anchorX!==null&&anchorY!==null&&oldZoom>0){
const cx=canvas.clientWidth/2;
const cy=canvas.clientHeight/2;
const worldX=(anchorX-cx-SKY_PAN_X)/oldZoom;
const worldY=(anchorY-cy-SKY_PAN_Y)/oldZoom;
SKY_PAN_X=anchorX-cx-worldX*z;
SKY_PAN_Y=anchorY-cy-worldY*z;
}

SKY_ZOOM=z;
limitSkyPan();
renderSkyChart();
}

function resetSkyZoom(){
SKY_ZOOM=1;
SKY_PAN_X=0;
SKY_PAN_Y=0;
renderSkyChart();
}

function restoreNightMode(){
let on=false;
try{on=localStorage.getItem(NICOLE_NIGHT_MODE_KEY)==="1";}catch(e){}
document.body.classList.toggle("night-mode",on);
const btn=$("#nightModeToggle");
if(btn){
btn.setAttribute("aria-pressed",String(on));
btn.textContent=on?"⚫ 通常表示へ":"🔴 赤色夜間モード";
}
const theme=document.querySelector('meta[name="theme-color"]');
if(theme)theme.setAttribute("content",on?"#100000":"#081120");
}

function toggleNightMode(){
const on=!document.body.classList.contains("night-mode");
document.body.classList.toggle("night-mode",on);
try{localStorage.setItem(NICOLE_NIGHT_MODE_KEY,on?"1":"0");}catch(e){}
restoreNightMode();
syncNightFullscreenFilter();
}


function weatherCodeJa(code){
const m={
0:"快晴",
1:"晴れ",
2:"一部曇り",
3:"曇り",
45:"霧",
48:"着氷性の霧",
51:"弱い霧雨",
53:"霧雨",
55:"強い霧雨",
56:"弱い着氷性霧雨",
57:"強い着氷性霧雨",
61:"弱い雨",
63:"雨",
65:"強い雨",
66:"弱い着氷性の雨",
67:"強い着氷性の雨",
71:"弱い雪",
73:"雪",
75:"強い雪",
77:"霧雪",
80:"弱いにわか雨",
81:"にわか雨",
82:"強いにわか雨",
85:"弱いにわか雪",
86:"強いにわか雪",
95:"雷雨",
96:"ひょうを伴う雷雨",
99:"激しいひょうを伴う雷雨"
};
return m[Number(code)]||"—";
}

function weatherGradeFor(row){
let rank=4;
const reasons=[];

const cloud=Number(row.cloud_cover);
const pp=Number(row.precipitation_probability);
const precip=Number(row.precipitation);
const wind=Number(row.wind_speed_10m);
const vis=Number(row.visibility);
const rh=Number(row.relative_humidity_2m);

if((Number.isFinite(precip)&&precip>=0.2)||(Number.isFinite(pp)&&pp>=60)){
rank=1;reasons.push("降水の可能性が高い");
}else if(Number.isFinite(cloud)&&cloud>=80){
rank=1;reasons.push("雲量が非常に多い");
}else if(Number.isFinite(cloud)&&cloud>=60){
rank=Math.min(rank,2);reasons.push("雲が多い");
}else if(Number.isFinite(cloud)&&cloud>=35){
rank=Math.min(rank,3);reasons.push("雲がやや多い");
}else{
reasons.push("雲量が少ない");
}

if(Number.isFinite(wind)&&wind>=10){
rank=Math.min(rank,2);reasons.push("風が強い");
}else if(Number.isFinite(wind)&&wind>=6){
rank=Math.min(rank,3);reasons.push("風がやや強い");
}

if(Number.isFinite(vis)&&vis<5000){
rank=Math.min(rank,2);reasons.push("視程が悪い");
}else if(Number.isFinite(vis)&&vis<10000){
rank=Math.min(rank,3);reasons.push("視程がやや短い");
}

if(Number.isFinite(rh)&&rh>=92){
rank=Math.min(rank,3);reasons.push("高湿度");
}

const map={
4:{grade:"◎",cls:"good",label:"良好"},
3:{grade:"○",cls:"ok",label:"まずまず"},
2:{grade:"△",cls:"poor",label:"条件注意"},
1:{grade:"×",cls:"bad",label:"観測には不向き"}
};
return{...map[rank],reason:reasons.join("・")};
}

function clearWeatherData(message,cls=""){
WEATHER_DATA=null;
WEATHER_META=null;
const status=$("#weatherStatus");
const grid=$("#weatherGrid");
const evalEl=$("#weatherEval");
if(status){
status.className=`weather-status ${cls}`.trim();
status.textContent=message;
}
if(grid){grid.style.display="none";grid.innerHTML="";}
if(evalEl){evalEl.style.display="none";evalEl.innerHTML="";}
}

function weatherRowAt(date){
if(!WEATHER_DATA||!WEATHER_DATA.time||!WEATHER_DATA.time.length)return null;
const target=date.getTime()/1000;
const times=WEATHER_DATA.time;
if(target<times[0]-1800||target>times[times.length-1]+1800)return null;

let lo=0,hi=times.length-1;
while(lo<hi){
const mid=Math.floor((lo+hi)/2);
if(times[mid]<target)lo=mid+1;
else hi=mid;
}
let idx=lo;
if(idx>0&&Math.abs(times[idx-1]-target)<Math.abs(times[idx]-target))idx--;

const row={time:times[idx]};
[
"temperature_2m","relative_humidity_2m","precipitation_probability",
"precipitation","cloud_cover","cloud_cover_low","cloud_cover_mid",
"cloud_cover_high","visibility","wind_speed_10m","weather_code"
].forEach(k=>row[k]=WEATHER_DATA[k]?WEATHER_DATA[k][idx]:null);
return row;
}


function modelWeatherRowAt(modelId,date){
const data=WEATHER_MODEL_DATA[modelId];
if(!data||!Array.isArray(data.time)||!data.time.length)return null;

const target=date.getTime()/1000;
if(target<data.time[0]-1800||target>data.time[data.time.length-1]+1800)return null;

let lo=0,hi=data.time.length-1;
while(lo<hi){
const mid=Math.floor((lo+hi)/2);
if(data.time[mid]<target)lo=mid+1;
else hi=mid;
}
let idx=lo;
if(idx>0&&Math.abs(data.time[idx-1]-target)<Math.abs(data.time[idx]-target))idx--;

return{
time:data.time[idx],
cloud_cover:data.cloud_cover?data.cloud_cover[idx]:null
};
}

function median(values){
const a=values.filter(v=>Number.isFinite(v)).sort((x,y)=>x-y);
if(!a.length)return null;
const m=Math.floor(a.length/2);
return a.length%2?a[m]:(a[m-1]+a[m])/2;
}

function getModelComparison(date){
const rows=WEATHER_COMPARE_MODELS.map(m=>{
const row=modelWeatherRowAt(m.id,date);
const cloud=row&&Number.isFinite(Number(row.cloud_cover))?Number(row.cloud_cover):null;
return{...m,cloud};
});

const values=rows.map(r=>r.cloud).filter(Number.isFinite);
if(!values.length)return{rows,medianCloud:null,agreement:null,spread:null,count:0};

const med=median(values);
const spread=Math.max(...values)-Math.min(...values);

let agreement="高";
let cls="agreement-high";
if(spread>40){agreement="低";cls="agreement-low";}
else if(spread>20){agreement="中";cls="agreement-mid";}

return{
rows,
medianCloud:med,
agreement,
agreementClass:cls,
spread,
count:values.length
};
}

function integratedWeatherGrade(baseRow,comparison){
if(!comparison||!Number.isFinite(comparison.medianCloud)){
return baseRow?weatherGradeFor(baseRow):{grade:"—",cls:"",label:"評価できません",reason:"モデル比較データなし"};
}

const synthetic={...(baseRow||{}),cloud_cover:comparison.medianCloud};
let result=weatherGradeFor(synthetic);

/* モデル間の食い違いが大きい場合は、見かけの好天評価を1段階慎重にする */
if(comparison.agreement==="低"&&result.grade==="◎"){
result={grade:"○",cls:"ok",label:"まずまず",reason:"雲量予報のばらつきが大きい"};
}
return result;
}

async function loadWeatherModelComparison(lat,lon,altM=0){
if(!Number.isFinite(lat)||!Number.isFinite(lon))return;

const locKey=weatherModelLocationKey(lat,lon,altM);
const cached=readWeatherCache("models",locKey,WEATHER_MODEL_CACHE_TTL);

if(cached){
  WEATHER_MODEL_DATA=cached.payload.data||{};
  WEATHER_MODEL_META={
    savedAt:new Date(cached.savedAt),
    fromLocalCache:true,
    stale:false,
    key:locKey
  };
  WEATHER_MODEL_LOADING=false;
  if(currentDate instanceof Date&&!isNaN(currentDate))renderTonightSkyWeather(skyInfoDisplayDate(currentDate));
  return;
}

if(WEATHER_MODEL_INFLIGHT.has(locKey)){
  await WEATHER_MODEL_INFLIGHT.get(locKey);
  return;
}

const task=(async()=>{
  WEATHER_MODEL_LOADING=true;
  const common={
    latitude:String(Number(lat).toFixed(3)),
    longitude:String(Number(lon).toFixed(3)),
    hourly:"cloud_cover",
    forecast_days:"4",
    timezone:"auto",
    timeformat:"unixtime"
  };
  if(Number.isFinite(Number(altM)))common.elevation=String(Math.round(Number(altM)));

  try{
    const jobs=WEATHER_COMPARE_MODELS.map(async model=>{
      try{
        const params=new URLSearchParams({...common,models:model.id});
        const {data}=await fetchWeatherJSON(`${WEATHER_ENDPOINT}?${params.toString()}`,18000);
        if(!data||!data.hourly||!Array.isArray(data.hourly.time))throw new Error("invalid model data");
        return[model.id,data.hourly];
      }catch(e){
        return[model.id,null];
      }
    });

    const entries=await Promise.all(jobs);
    const usable=Object.fromEntries(entries.filter(([,v])=>v));
    if(!Object.keys(usable).length)throw new Error("all model requests failed");

    WEATHER_MODEL_DATA=usable;
    WEATHER_MODEL_META={
      savedAt:new Date(),
      fromLocalCache:false,
      stale:false,
      key:locKey
    };
    writeWeatherCache("models",locKey,{data:usable});
  }catch(error){
    const stale=readWeatherCache("models",locKey,WEATHER_MODEL_CACHE_TTL,{allowStale:true});
    if(stale){
      WEATHER_MODEL_DATA=stale.payload.data||{};
      WEATHER_MODEL_META={
        savedAt:new Date(stale.savedAt),
        fromLocalCache:true,
        stale:true,
        key:locKey
      };
    }else{
      WEATHER_MODEL_DATA={};
      WEATHER_MODEL_META=null;
    }
  }finally{
    WEATHER_MODEL_LOADING=false;
    if(currentDate instanceof Date&&!isNaN(currentDate))renderTonightSkyWeather(skyInfoDisplayDate(currentDate));
  }
})();

WEATHER_MODEL_INFLIGHT.set(locKey,task);
try{await task;}finally{WEATHER_MODEL_INFLIGHT.delete(locKey);}
}
function renderWeatherForDate(date){
const status=$("#weatherStatus");
const grid=$("#weatherGrid");
const evalEl=$("#weatherEval");
if(!status||!grid||!evalEl)return;

if(WEATHER_LOADING){
status.className="weather-status";
status.textContent="Open-Meteoから天候情報を取得中…";
grid.style.display="none";
evalEl.style.display="none";
return;
}

if(!WEATHER_DATA){
status.className="weather-status";
status.textContent="天候情報を取得できていません。オンライン接続を確認してください。";
grid.style.display="none";
evalEl.style.display="none";
return;
}

const row=weatherRowAt(date);
if(!row){
status.className="weather-status";
status.textContent="この星図時刻はOpen-Meteoの予報範囲外です。";
grid.style.display="none";
evalEl.style.display="none";
return;
}

const fmt=n=>Number.isFinite(Number(n))?Number(n):null;
const cloud=fmt(row.cloud_cover);
const low=fmt(row.cloud_cover_low);
const mid=fmt(row.cloud_cover_mid);
const high=fmt(row.cloud_cover_high);
const pp=fmt(row.precipitation_probability);
const precip=fmt(row.precipitation);
const vis=fmt(row.visibility);
const wind=fmt(row.wind_speed_10m);
const temp=fmt(row.temperature_2m);
const rh=fmt(row.relative_humidity_2m);

status.className="weather-status";
status.textContent=`${weatherSavedLabel(WEATHER_META)}${formatSkyViewDate(date)} に最も近い1時間予報：${weatherCodeJa(row.weather_code)}`;

const cells=[
["総雲量",cloud===null?"—":`${Math.round(cloud)}%`],
["低・中・高層雲",
`${low===null?"—":Math.round(low)} / ${mid===null?"—":Math.round(mid)} / ${high===null?"—":Math.round(high)}%`],
["降水確率",pp===null?"—":`${Math.round(pp)}%`],
["降水量",precip===null?"—":`${precip.toFixed(1)} mm`],
["視程",vis===null?"—":`${(vis/1000).toFixed(1)} km`],
["風速",wind===null?"—":`${wind.toFixed(1)} m/s`],
["気温",temp===null?"—":`${temp.toFixed(1)} ℃`],
["湿度",rh===null?"—":`${Math.round(rh)}%`]
];

grid.innerHTML=cells.map(([k,v])=>`
<div class="weather-cell">
<div class="k">${k}</div>
<div class="v">${v}</div>
</div>`).join("");
grid.style.display="grid";

const ev=weatherGradeFor(row);
evalEl.innerHTML=`
<span class="weather-grade ${ev.cls}">${ev.grade}</span>
<div>
<div style="font-size:11px;color:#e0eaf5;font-weight:bold">観測目安：${ev.label}</div>
<div class="weather-note">${ev.reason}<br>※ 雲量・降水・風・視程などから算出した簡易目安です。</div>
</div>`;
evalEl.style.display="flex";
}

async function loadWeatherForecast(lat,lon){
if(!Number.isFinite(lat)||!Number.isFinite(lon)){
  clearWeatherData("緯度・経度を設定すると天候情報を取得します。");
  return;
}

const locKey=weatherLocationKey(lat,lon);
const altM=parseFloat($("#inAlt")?$("#inAlt").value:"0");

/* モデル比較も独立した2時間キャッシュを使用 */
loadWeatherModelComparison(lat,lon,Number.isFinite(altM)?altM:0);

/* 同一地点の30分以内の予報はOpen-Meteoへ再通信しない */
const cached=readWeatherCache("forecast",locKey,WEATHER_FORECAST_CACHE_TTL);
if(cached){
  const saved=cached.payload;
  WEATHER_DATA=saved.hourly||null;
  WEATHER_META={
    lat,
    lon,
    timezone:saved.timezone||"",
    utcOffset:saved.utcOffset||0,
    fetchedAt:new Date(cached.savedAt),
    fromOfflineCache:false,
    fromLocalCache:true,
    stale:false,
    key:locKey
  };
  WEATHER_LOADING=false;
  renderWeatherForDate(getSkyViewDate());
  if(currentDate instanceof Date&&!isNaN(currentDate))renderTonightSkyWeather(skyInfoDisplayDate(currentDate));
  return;
}

/* 同じ丸め地点への重複通信を1本にまとめる */
if(WEATHER_FORECAST_INFLIGHT.has(locKey)){
  await WEATHER_FORECAST_INFLIGHT.get(locKey);
  return;
}

const task=(async()=>{
  WEATHER_LOADING=true;
  renderWeatherForDate(getSkyViewDate());

  try{
    const params=new URLSearchParams({
      latitude:String(Number(lat).toFixed(3)),
      longitude:String(Number(lon).toFixed(3)),
      hourly:[
        "temperature_2m",
        "relative_humidity_2m",
        "precipitation_probability",
        "precipitation",
        "cloud_cover",
        "cloud_cover_low",
        "cloud_cover_mid",
        "cloud_cover_high",
        "visibility",
        "wind_speed_10m",
        "weather_code"
      ].join(","),
      wind_speed_unit:"ms",
      forecast_days:"16",
      timezone:"auto",
      timeformat:"unixtime"
    });

    const {res,data}=await fetchWeatherJSON(`${WEATHER_ENDPOINT}?${params.toString()}`,18000);
    const servedFromOfflineCache=res.headers.get("X-Nicole-Offline-Cache")==="1";
    const cachedAtHeader=res.headers.get("X-Nicole-Cached-At");

    if(!data||!data.hourly||!Array.isArray(data.hourly.time)){
      throw new Error("予報データの形式が不正です");
    }

    WEATHER_DATA=data.hourly;
    WEATHER_META={
      lat,
      lon,
      timezone:data.timezone||"",
      utcOffset:data.utc_offset_seconds||0,
      fetchedAt:cachedAtHeader?new Date(cachedAtHeader):new Date(),
      fromOfflineCache:servedFromOfflineCache,
      fromLocalCache:false,
      stale:false,
      key:locKey
    };

    /* SWから返った保存済み応答でも、Nicole側キャッシュへコピーして次回通信を減らす */
    writeWeatherCache("forecast",locKey,{
      hourly:data.hourly,
      timezone:data.timezone||"",
      utcOffset:data.utc_offset_seconds||0
    });
  }catch(err){
    /* 30分を超えた保存済み予報でも、通信失敗時は明確に古いと表示して利用 */
    const stale=readWeatherCache("forecast",locKey,WEATHER_FORECAST_CACHE_TTL,{allowStale:true});
    if(stale){
      const saved=stale.payload;
      WEATHER_DATA=saved.hourly||null;
      WEATHER_META={
        lat,
        lon,
        timezone:saved.timezone||"",
        utcOffset:saved.utcOffset||0,
        fetchedAt:new Date(stale.savedAt),
        fromOfflineCache:false,
        fromLocalCache:true,
        stale:true,
        key:locKey
      };
    }else{
      WEATHER_DATA=null;
      WEATHER_META=null;
    }
  }finally{
    WEATHER_LOADING=false;
    if(WEATHER_DATA){
      renderWeatherForDate(getSkyViewDate());
    }else{
      clearWeatherData("天候情報の取得に失敗しました。再度「観測開始」または地点設定を行うと再取得します。","weather-error");
    }
    if(currentDate instanceof Date&&!isNaN(currentDate))renderTonightSkyWeather(skyInfoDisplayDate(currentDate));
  }
})();

WEATHER_FORECAST_INFLIGHT.set(locKey,task);
try{await task;}finally{WEATHER_FORECAST_INFLIGHT.delete(locKey);}
}
function loadWeatherFromInputs(){
const lat=parseFloat($("#inLat").value);
const lon=parseFloat($("#inLon").value);
loadWeatherForecast(lat,lon);
}


/* =====================================================
国土地理院 地図選択 + 標高自動取得
===================================================== */
let GSI_MAP=null;
let GSI_MARKER=null;
let GSI_SELECTED=null;
let LEAFLET_PROMISE=null;
let MAP_SEARCH_LAST_AT=0;
let MAP_SEARCH_BUSY=false;
let MAP_REVERSE_TOKEN=0;
const MAP_SEARCH_ENDPOINT="https://nominatim.openstreetmap.org/search";
const MAP_REVERSE_ENDPOINT="https://nominatim.openstreetmap.org/reverse";

let GSI_LIGHT_LAYER=null;
let MAP_LIGHT_TOKEN=0;
const LIGHT_TILE_Z=8;
const LIGHT_TILE_CACHE=new Map();
const LIGHT_TILE_URL="https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Night_Lights/default/2016-01-01/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png";


function ensureLeaflet(){
if(window.L)return Promise.resolve(window.L);
if(LEAFLET_PROMISE)return LEAFLET_PROMISE;

LEAFLET_PROMISE=new Promise((resolve,reject)=>{
if(!document.querySelector('link[data-nicole-leaflet]')){
const link=document.createElement("link");
link.rel="stylesheet";
link.href="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css";
link.dataset.nicoleLeaflet="1";
document.head.appendChild(link);
}

const existing=document.querySelector('script[data-nicole-leaflet]');
if(existing){
existing.addEventListener("load",()=>window.L?resolve(window.L):reject(new Error("Leafletの読込に失敗しました")));
existing.addEventListener("error",()=>reject(new Error("Leafletの読込に失敗しました")));
return;
}

const script=document.createElement("script");
script.src="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js";
script.dataset.nicoleLeaflet="1";
script.onload=()=>window.L?resolve(window.L):reject(new Error("Leafletの読込に失敗しました"));
script.onerror=()=>reject(new Error("Leafletの読込に失敗しました"));
document.head.appendChild(script);
});

return LEAFLET_PROMISE;
}

function demTilePoint(lat,lon,z){
const maxLat=85.05112878;
const clampedLat=Math.max(-maxLat,Math.min(maxLat,lat));
const n=Math.pow(2,z);
const px=((lon+180)/360)*n*256;
const latRad=clampedLat*Math.PI/180;
const py=(1-Math.log(Math.tan(latRad)+1/Math.cos(latRad))/Math.PI)/2*n*256;
const tileX=Math.floor(px/256);
const tileY=Math.floor(py/256);
return{
x:tileX,
y:tileY,
px:Math.max(0,Math.min(255,Math.floor(px-tileX*256))),
py:Math.max(0,Math.min(255,Math.floor(py-tileY*256)))
};
}

async function demPixelFromBlob(blob,px,py){
if("createImageBitmap" in window){
try{
const bmp=await createImageBitmap(blob);
const canvas=document.createElement("canvas");
canvas.width=256;canvas.height=256;
const ctx=canvas.getContext("2d",{willReadFrequently:true});
ctx.drawImage(bmp,0,0,256,256);
const d=ctx.getImageData(px,py,1,1).data;
if(bmp.close)bmp.close();
return[d[0],d[1],d[2]];
}catch(e){}
}

return await new Promise((resolve,reject)=>{
const url=URL.createObjectURL(blob);
const img=new Image();
img.onload=()=>{
try{
const canvas=document.createElement("canvas");
canvas.width=256;canvas.height=256;
const ctx=canvas.getContext("2d",{willReadFrequently:true});
ctx.drawImage(img,0,0,256,256);
const d=ctx.getImageData(px,py,1,1).data;
URL.revokeObjectURL(url);
resolve([d[0],d[1],d[2]]);
}catch(err){
URL.revokeObjectURL(url);
reject(err);
}
};
img.onerror=()=>{
URL.revokeObjectURL(url);
reject(new Error("標高タイル画像を読めません"));
};
img.src=url;
});
}

function decodeGsiElevation(r,g,b){
if(r===128&&g===0&&b===0)return null;
const x=65536*r+256*g+b;
if(x===8388608)return null;
const signed=x<8388608?x:x-16777216;
return signed*0.01;
}

async function fetchGsiElevation(lat,lon){
const sources=[
{id:"dem1a_png",z:17,label:"DEM1A"},
{id:"dem5a_png",z:15,label:"DEM5A"},
{id:"dem5b_png",z:15,label:"DEM5B"},
{id:"dem5c_png",z:15,label:"DEM5C"},
{id:"dem_png",z:14,label:"DEM10B"}
];

for(const s of sources){
try{
const t=demTilePoint(lat,lon,s.z);
const url=`https://cyberjapandata.gsi.go.jp/xyz/${s.id}/${s.z}/${t.x}/${t.y}.png`;
const res=await fetch(url,{cache:"no-store"});
if(!res.ok)continue;
const blob=await res.blob();
const [r,g,b]=await demPixelFromBlob(blob,t.px,t.py);
const h=decodeGsiElevation(r,g,b);
if(Number.isFinite(h))return{elevation:h,source:s.label};
}catch(e){}
}
throw new Error("この地点の標高データを取得できませんでした");
}


function lightTilePoint(lat,lon,z=LIGHT_TILE_Z){
const maxLat=85.05112878;
const clampedLat=Math.max(-maxLat,Math.min(maxLat,lat));
const n=Math.pow(2,z);
const px=((lon+180)/360)*n*256;
const latRad=clampedLat*Math.PI/180;
const py=(1-Math.log(Math.tan(latRad)+1/Math.cos(latRad))/Math.PI)/2*n*256;
const x=Math.floor(px/256),y=Math.floor(py/256);
return{x,y,px:Math.max(0,Math.min(255,Math.floor(px-x*256))),py:Math.max(0,Math.min(255,Math.floor(py-y*256)))};
}

async function getLightTileCanvas(x,y,z=LIGHT_TILE_Z){
const key=`${z}/${x}/${y}`;
if(LIGHT_TILE_CACHE.has(key))return LIGHT_TILE_CACHE.get(key);
const promise=(async()=>{
const url=LIGHT_TILE_URL.replace("{z}",z).replace("{x}",x).replace("{y}",y);
const res=await fetch(url,{cache:"force-cache"});
if(!res.ok)throw new Error(`夜間光タイル HTTP ${res.status}`);
const blob=await res.blob();
let image;
if("createImageBitmap" in window){
image=await createImageBitmap(blob);
}else{
image=await new Promise((resolve,reject)=>{
const u=URL.createObjectURL(blob);
const img=new Image();
img.onload=()=>{URL.revokeObjectURL(u);resolve(img);};
img.onerror=()=>{URL.revokeObjectURL(u);reject(new Error("夜間光画像を読めません"));};
img.src=u;
});
}
const canvas=document.createElement("canvas");
canvas.width=256;canvas.height=256;
const ctx=canvas.getContext("2d",{willReadFrequently:true});
ctx.drawImage(image,0,0,256,256);
if(image.close)image.close();
return canvas;
})().catch(err=>{LIGHT_TILE_CACHE.delete(key);throw err;});
LIGHT_TILE_CACHE.set(key,promise);
return promise;
}

function lightPollutionAssessment(brightness){
let label,cls,score;
if(brightness<=3){label="非常に少ない";cls="light-vlow";score=4;}
else if(brightness<=10){label="少ない";cls="light-low";score=3;}
else if(brightness<=28){label="中程度";cls="light-mid";score=2;}
else if(brightness<=65){label="多い";cls="light-high";score=1;}
else{label="非常に多い";cls="light-vhigh";score=0;}
return{label,cls,score};
}

async function fetchLightPollution(lat,lon){
const t=lightTilePoint(lat,lon,LIGHT_TILE_Z);
const canvas=await getLightTileCanvas(t.x,t.y,LIGHT_TILE_Z);
const ctx=canvas.getContext("2d",{willReadFrequently:true});
const radius=4;
const x0=Math.max(0,t.px-radius),y0=Math.max(0,t.py-radius);
const x1=Math.min(255,t.px+radius),y1=Math.min(255,t.py+radius);
const data=ctx.getImageData(x0,y0,x1-x0+1,y1-y0+1).data;
const vals=[];
for(let i=0;i<data.length;i+=4){
if(data[i+3]===0)continue;
const lum=0.2126*data[i]+0.7152*data[i+1]+0.0722*data[i+2];
vals.push(lum);
}
if(!vals.length)throw new Error("夜間光データを取得できません");
vals.sort((a,b)=>a-b);
const mean=vals.reduce((a,b)=>a+b,0)/vals.length;
const p75=vals[Math.floor((vals.length-1)*0.75)];
const brightness=Math.max(0,Math.min(255,mean*0.7+p75*0.3));
return{brightness, ...lightPollutionAssessment(brightness)};
}

function observingSiteAssessment(lightInfo,elevation){
if(!lightInfo||!Number.isFinite(lightInfo.score))return{grade:"—",label:"評価待ち"};
let score=lightInfo.score;
if(Number.isFinite(elevation)){
if(elevation>=1000)score+=0.7;
else if(elevation>=500)score+=0.4;
else if(elevation>=200)score+=0.2;
}
if(score>=3.7)return{grade:"◎",label:"良好"};
if(score>=2.7)return{grade:"○",label:"まずまず"};
if(score>=1.7)return{grade:"△",label:"条件注意"};
return{grade:"×",label:"明るい"};
}

function lightInfoHtml(lightInfo,elevation){
if(lightInfo===null)return'<br>夜間光 <span style="color:#fb923c">取得できませんでした</span>';
if(!lightInfo)return'<br>夜間光を解析中…';
const site=observingSiteAssessment(lightInfo,elevation);
return `<br>夜間光 <span class="light-grade ${lightInfo.cls}"><b>${lightInfo.label}</b></span> <span style="color:#7896af">（相対値 ${lightInfo.brightness.toFixed(1)}）</span>`
+`<br>観測地目安 <span class="site-grade">${site.grade} ${site.label}</span> <span style="color:#7896af">（光害＋標高の簡易評価）</span>`;
}

function destinationPoint(lat,lon,distanceKm,bearingDeg){
const R=6371;
const d=distanceKm/R;
const br=bearingDeg*Math.PI/180;
const p1=lat*Math.PI/180;
const l1=lon*Math.PI/180;
const p2=Math.asin(Math.sin(p1)*Math.cos(d)+Math.cos(p1)*Math.sin(d)*Math.cos(br));
const l2=l1+Math.atan2(Math.sin(br)*Math.sin(d)*Math.cos(p1),Math.cos(d)-Math.sin(p1)*Math.sin(p2));
return{lat:p2*180/Math.PI,lon:((l2*180/Math.PI+540)%360)-180};
}

function haversineKm(lat1,lon1,lat2,lon2){
const R=6371,toRad=v=>v*Math.PI/180;
const dLat=toRad(lat2-lat1),dLon=toRad(lon2-lon1);
const a=Math.sin(dLat/2)**2+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
return 2*R*Math.asin(Math.sqrt(a));
}

async function findDarkerNearby(){
if(!GSI_SELECTED||!Number.isFinite(GSI_SELECTED.lat)||!Number.isFinite(GSI_SELECTED.lon))return;
const btn=$("#findDarkerLocation"),box=$("#darkerSearchResult");
if(btn){btn.disabled=true;btn.textContent="探索中…";}
if(box){box.className="darker-search-result show";box.textContent="周囲10kmの夜間光を比較しています…";}

try{
const origin=GSI_SELECTED;
const candidates=[{lat:origin.lat,lon:origin.lon,distance:0,bearing:0}];
[2.5,5,7.5,10].forEach(distance=>{
for(let bearing=0;bearing<360;bearing+=45){
const p=destinationPoint(origin.lat,origin.lon,distance,bearing);
candidates.push({...p,distance,bearing});
}
});
const sampled=await Promise.all(candidates.map(async c=>{
try{return{...c,light:await fetchLightPollution(c.lat,c.lon)};}
catch(e){return{...c,light:null};}
}));
const valid=sampled.filter(x=>x.light&&Number.isFinite(x.light.brightness));
if(!valid.length)throw new Error("周辺の夜間光を取得できませんでした");
valid.sort((a,b)=>a.light.brightness-b.light.brightness);
const best=valid[0];
const current=valid.find(x=>x.distance===0)||null;

let elevation=null;
try{elevation=(await fetchGsiElevation(best.lat,best.lon)).elevation;}catch(e){}
let place=null;
try{
const token=++MAP_REVERSE_TOKEN;
place=await reverseGeocodeMapPoint(best.lat,best.lon,token);
}catch(e){}

const improvement=current
?Math.max(0,current.light.brightness-best.light.brightness)
:null;
const distance=haversineKm(origin.lat,origin.lon,best.lat,best.lon);
const placeName=place&&place.placeName?place.placeName:"暗い候補地点";
const site=observingSiteAssessment(best.light,elevation);

if(distance<0.4 || (improvement!==null&&improvement<1.0)){
box.innerHTML=`この10km圏では、現在地点より明確に暗い候補は見つかりませんでした。<br><span style="color:#7896af">現在地点：${current?current.light.label:"—"} / 相対値 ${current?current.light.brightness.toFixed(1):"—"}</span>`;
return;
}

box.innerHTML=`<b>🌌 より暗い候補：${escapeHTML(placeName)}</b><br>`
+`現在地点から 約 ${distance.toFixed(1)} km / 夜間光 <span class="${best.light.cls}">${best.light.label}</span>（相対値 ${best.light.brightness.toFixed(1)}）`
+`${current?`<br>現在地点より相対値で ${improvement.toFixed(1)} 低い候補`:""}`
+`${Number.isFinite(elevation)?` / 標高 ${elevation.toFixed(0)} m`:""}`
+` / 観測地目安 ${site.grade} ${site.label}`
+`<br><span style="color:#7896af">※ 衛星夜間光だけで探索した候補です。道路、立入可否、安全性、地平線の開け方は評価していません。</span>`
+`<br><button type="button" class="darker-candidate-btn" id="useDarkerCandidate">この候補を地図で選択</button>`;

$("#useDarkerCandidate").addEventListener("click",async()=>{
if(GSI_MAP)GSI_MAP.setView([best.lat,best.lon],Math.max(GSI_MAP.getZoom(),13));
await selectMapPoint(best.lat,best.lon,placeName,place&&place.placeSub?place.placeSub:"");
});
}catch(err){
if(box){box.className="darker-search-result show";box.innerHTML=`<span style="color:#f87171">${escapeHTML(String(err.message||err))}</span>`;}
}finally{
if(btn){btn.disabled=!GSI_SELECTED;btn.textContent="🌌 周囲10kmでもっと暗い場所を探す";}
}
}

function setLightPollutionLayerVisible(visible){
if(!GSI_MAP||!window.L)return;
if(visible){
if(!GSI_LIGHT_LAYER){
GSI_LIGHT_LAYER=L.tileLayer(
LIGHT_TILE_URL,
{
maxNativeZoom:8,
maxZoom:18,
minZoom:0,
opacity:($("#lightPollutionOpacity")?Number($("#lightPollutionOpacity").value):60)/100,
attribution:'NASA GIBS / Suomi NPP VIIRS Night Lights (2016)'
}
);
}
if(!GSI_MAP.hasLayer(GSI_LIGHT_LAYER))GSI_LIGHT_LAYER.addTo(GSI_MAP);
}else if(GSI_LIGHT_LAYER&&GSI_MAP.hasLayer(GSI_LIGHT_LAYER)){
GSI_MAP.removeLayer(GSI_LIGHT_LAYER);
}
}

function updateMapSelection(lat,lon,elevation=null,source="",placeName="",placeSub="",lightInfo=undefined){
const prev=GSI_SELECTED&&Math.abs(GSI_SELECTED.lat-lat)<1e-10&&Math.abs(GSI_SELECTED.lon-lon)<1e-10
?GSI_SELECTED
:null;
GSI_SELECTED={
lat,lon,elevation,source,
placeName:placeName||(prev&&prev.placeName)||"",
placeSub:placeSub||(prev&&prev.placeSub)||"",
lightInfo:lightInfo===undefined?(prev?prev.lightInfo:undefined):lightInfo
};

if(GSI_MAP&&window.L){
if(!GSI_MARKER){
GSI_MARKER=L.marker([lat,lon]).addTo(GSI_MAP);
}else{
GSI_MARKER.setLatLng([lat,lon]);
}
}

const info=$("#mapSelectInfo");
const use=$("#useMapLocation");
const darker=$("#findDarkerLocation");
if(info){
const elevText=Number.isFinite(elevation)
?`標高 <b>${elevation.toFixed(1)} m</b>${source?`（${source}）`:""}`
:"標高を取得中…";
const placeText=GSI_SELECTED&&GSI_SELECTED.placeName
?`<br>地名 <b>${GSI_SELECTED.placeName}</b>${GSI_SELECTED.placeSub?` <span style="color:#7896af">（${GSI_SELECTED.placeSub}）</span>`:""}`
:"<br>地名を取得中…";
info.innerHTML=`緯度 <b>${lat.toFixed(6)}</b> / 経度 <b>${lon.toFixed(6)}</b><br>${elevText}${placeText}${lightInfoHtml(GSI_SELECTED.lightInfo,elevation)}`;
}
if(use)use.disabled=!Number.isFinite(elevation);
if(darker)darker.disabled=false;
}

async function selectMapPoint(lat,lon,knownPlaceName="",knownPlaceSub=""){
const token=++MAP_REVERSE_TOKEN;
const lightToken=++MAP_LIGHT_TOKEN;
updateMapSelection(lat,lon,null,"",knownPlaceName,knownPlaceSub,undefined);
const darker=$("#darkerSearchResult");
if(darker){darker.className="darker-search-result";darker.innerHTML="";}

const elevationPromise=fetchGsiElevation(lat,lon)
.then(result=>({ok:true,result}))
.catch(error=>({ok:false,error}));

const reversePromise=knownPlaceName
?Promise.resolve({placeName:knownPlaceName,placeSub:knownPlaceSub})
:reverseGeocodeMapPoint(lat,lon,token);

const lightPromise=fetchLightPollution(lat,lon)
.then(result=>({ok:true,result}))
.catch(error=>({ok:false,error}));

const [elevResult,placeResult,lightResult]=await Promise.all([elevationPromise,reversePromise,lightPromise]);

if(!GSI_SELECTED||Math.abs(GSI_SELECTED.lat-lat)>1e-10||Math.abs(GSI_SELECTED.lon-lon)>1e-10||lightToken!==MAP_LIGHT_TOKEN)return;

const placeName=placeResult&&placeResult.placeName
?placeResult.placeName
:(GSI_SELECTED.placeName||"選択地点");
const placeSub=placeResult&&placeResult.placeSub
?placeResult.placeSub
:(GSI_SELECTED.placeSub||"");
const lightInfo=lightResult.ok?lightResult.result:null;

if(elevResult.ok){
updateMapSelection(lat,lon,elevResult.result.elevation,elevResult.result.source,placeName,placeSub,lightInfo);
}else{
GSI_SELECTED={
lat,lon,elevation:null,source:"",
placeName,placeSub,lightInfo
};
const info=$("#mapSelectInfo");
if(info){
info.innerHTML=`緯度 <b>${lat.toFixed(6)}</b> / 経度 <b>${lon.toFixed(6)}</b><br><span style="color:#fb923c">${elevResult.error.message}</span><br>地名 <b>${placeName}</b>${placeSub?` <span style="color:#7896af">（${placeSub}）</span>`:""}${lightInfoHtml(lightInfo,null)}`;
}
const use=$("#useMapLocation");
if(use)use.disabled=false;
const darkerBtn=$("#findDarkerLocation");
if(darkerBtn)darkerBtn.disabled=false;
}
}



function compactReverseName(result){
const a=result&&result.address?result.address:{};

const main=
a.tourism||a.amenity||a.building||a.railway||a.natural||
a.mountain_pass||a.road||a.neighbourhood||a.suburb||
a.village||a.town||a.city||a.municipality||a.county||
(result&&result.name)||"選択地点";

const area=[
a.neighbourhood,a.suburb,a.city_district,a.city,a.town,a.village,
a.municipality,a.county,a.state
].filter(Boolean);

const unique=[...new Set(area.filter(v=>v!==main))];
return{
main:String(main),
sub:unique.join("、")
};
}

async function waitForNominatimInterval(){
const elapsed=Date.now()-MAP_SEARCH_LAST_AT;
if(elapsed<1000){
await new Promise(resolve=>setTimeout(resolve,1000-elapsed));
}
MAP_SEARCH_LAST_AT=Date.now();
}

async function reverseGeocodeMapPoint(lat,lon,token){
if(!navigator.onLine)return null;

try{
await waitForNominatimInterval();
if(token!==MAP_REVERSE_TOKEN)return null;

const params=new URLSearchParams({
lat:String(lat),
lon:String(lon),
format:"jsonv2",
addressdetails:"1",
zoom:"16",
"accept-language":"ja"
});

const res=await fetch(`${MAP_REVERSE_ENDPOINT}?${params.toString()}`);
if(!res.ok)throw new Error(`HTTP ${res.status}`);
const data=await res.json();

if(token!==MAP_REVERSE_TOKEN)return null;
if(!data)return null;

const names=compactReverseName(data);
return{
placeName:names.main,
placeSub:names.sub,
displayName:data.display_name||""
};
}catch(e){
return null;
}
}

function compactSearchName(result){
const a=result.address||{};
const primary=
a.tourism||a.amenity||a.building||a.railway||a.natural||
a.mountain_pass||a.road||a.village||a.town||a.city||a.municipality||
a.county||a.state||result.name||"検索結果";

const parts=[
a.neighbourhood,a.suburb,a.city_district,a.city,a.town,a.village,
a.municipality,a.county,a.state
].filter(Boolean);

return{
main:String(primary),
sub:[...new Set(parts)].join("、")||result.display_name||""
};
}

function renderMapSearchMessage(message,isError=false){
const box=$("#mapSearchResults");
if(!box)return;
box.className="map-search-results show";
box.innerHTML=`<div class="map-search-msg"${isError?' style="color:#f87171"':""}>${message}</div>`;
}

function clearMapSearchResults(){
const box=$("#mapSearchResults");
if(!box)return;
box.className="map-search-results";
box.innerHTML="";
}

let OBS_PLACE_SEARCH_BUSY=false;

function renderObsPlaceSearchMessage(message,isError=false){
const box=$("#obsPlaceSearchResults");
if(!box)return;
box.className="obs-place-search-results show";
box.innerHTML=`<div class="obs-place-search-msg"${isError?' style="color:#f87171"':""}>${escapeHTML(message)}</div>`;
}

function clearObsPlaceSearchResults(){
const box=$("#obsPlaceSearchResults");
if(!box)return;
box.className="obs-place-search-results";
box.innerHTML="";
}

async function applyObservationPlaceSearchResult(result){
const lat=Number(result.lat),lon=Number(result.lon);
if(!Number.isFinite(lat)||!Number.isFinite(lon))return;

const names=compactSearchName(result);
$("#inLat").value=lat.toFixed(6);
$("#inLon").value=lon.toFixed(6);
$("#inPlace").value=names.main;
$("#inAlt").value="";
$("#obsPlaceSelected").textContent=`📍 ${names.main}${names.sub?`（${names.sub}）`:""}`;
$("#obsPlaceSearchInput").value=names.main;
clearObsPlaceSearchResults();

if(navigator.onLine){
try{
const elev=await fetchGsiElevation(lat,lon);
$("#inAlt").value=elev.elevation.toFixed(1);
}catch(e){
console.warn("地名検索後の標高取得失敗:",e);
}
loadWeatherForecast(lat,lon);
}
}

async function searchObservationPlace(query){
query=String(query||"").trim();

/* おふざけ機能：2:00 AM に「フミキリ」 */
const easterRaw=$("#inDatetime")?.value||"";
const easterDate=easterRaw?new Date(easterRaw):null;
if(query==="フミキリ" && easterDate instanceof Date && !isNaN(easterDate) &&
   easterDate.getHours()===2 && easterDate.getMinutes()===0){
  alert("おーいえーあはーん");
}

if(!query){
renderObsPlaceSearchMessage("検索する地名・施設名・住所を入力してください。",true);
return;
}
if(!navigator.onLine){
renderObsPlaceSearchMessage("地名検索にはインターネット接続が必要です。",true);
return;
}
if(OBS_PLACE_SEARCH_BUSY)return;

OBS_PLACE_SEARCH_BUSY=true;
const btn=$("#obsPlaceSearchBtn");
if(btn){btn.disabled=true;btn.textContent="検索中…";}
renderObsPlaceSearchMessage("検索しています…");

try{
await waitForNominatimInterval();
const params=new URLSearchParams({
q:query,
format:"jsonv2",
addressdetails:"1",
limit:"6",
countrycodes:"jp",
"accept-language":"ja"
});
const res=await fetch(`${MAP_SEARCH_ENDPOINT}?${params.toString()}`);
if(!res.ok)throw new Error(`HTTP ${res.status}`);
const data=await res.json();

if(!Array.isArray(data)||data.length===0){
renderObsPlaceSearchMessage("該当する場所が見つかりませんでした。");
return;
}

const box=$("#obsPlaceSearchResults");
box.className="obs-place-search-results show";
box.innerHTML="";

data.forEach(result=>{
const lat=Number(result.lat),lon=Number(result.lon);
if(!Number.isFinite(lat)||!Number.isFinite(lon))return;
const names=compactSearchName(result);
const b=document.createElement("button");
b.type="button";
b.className="obs-place-search-result";
b.innerHTML=`<div class="main">${escapeHTML(names.main)}</div><div class="sub">${escapeHTML(names.sub)}</div>`;
b.addEventListener("click",()=>applyObservationPlaceSearchResult(result));
box.appendChild(b);
});
}catch(err){
renderObsPlaceSearchMessage(`場所検索に失敗しました：${String(err.message||err)}`,true);
}finally{
OBS_PLACE_SEARCH_BUSY=false;
if(btn){btn.disabled=false;btn.textContent="検索";}
}
}

async function searchMapLocation(query){
query=String(query||"").trim();
if(!query){
renderMapSearchMessage("検索する地名・施設名・住所を入力してください。",true);
return;
}
if(!navigator.onLine){
renderMapSearchMessage("オフライン環境では場所検索を使用できません。",true);
return;
}
if(MAP_SEARCH_BUSY)return;

const elapsed=Date.now()-MAP_SEARCH_LAST_AT;
if(elapsed<1000){
renderMapSearchMessage("検索間隔を空けています。少し待ってからもう一度検索してください。");
return;
}

MAP_SEARCH_BUSY=true;
MAP_SEARCH_LAST_AT=Date.now();
const btn=$("#mapSearchBtn");
if(btn){btn.disabled=true;btn.textContent="検索中…";}
renderMapSearchMessage("検索しています…");

try{
const params=new URLSearchParams({
q:query,
format:"jsonv2",
addressdetails:"1",
limit:"6",
countrycodes:"jp",
"accept-language":"ja"
});
const res=await fetch(`${MAP_SEARCH_ENDPOINT}?${params.toString()}`);
if(!res.ok)throw new Error(`HTTP ${res.status}`);
const data=await res.json();

if(!Array.isArray(data)||data.length===0){
renderMapSearchMessage("該当する場所が見つかりませんでした。");
return;
}

const box=$("#mapSearchResults");
box.className="map-search-results show";
box.innerHTML="";

data.forEach((r,index)=>{
const lat=Number(r.lat),lon=Number(r.lon);
if(!Number.isFinite(lat)||!Number.isFinite(lon))return;

const names=compactSearchName(r);
const b=document.createElement("button");
b.type="button";
b.className="map-search-result";
b.innerHTML=`<div class="main">${escapeHTML(names.main)}</div><div class="sub">${escapeHTML(names.sub)}</div>`;
b.addEventListener("click",async()=>{
if(!GSI_MAP)return;
GSI_MAP.setView([lat,lon],Math.max(GSI_MAP.getZoom(),13));
clearMapSearchResults();
$("#mapSearchInput").value=names.main;
await selectMapPoint(lat,lon,names.main,names.sub);
});
box.appendChild(b);
});

if(!box.children.length)renderMapSearchMessage("該当する場所が見つかりませんでした。");
}catch(err){
renderMapSearchMessage("場所検索に失敗しました。しばらくしてからもう一度お試しください。",true);
}finally{
MAP_SEARCH_BUSY=false;
if(btn){btn.disabled=false;btn.textContent="検索";}
}
}

async function openMapSelector(){
const modal=$("#mapSelectModal");
const mapDiv=$("#gsiMap");
const info=$("#mapSelectInfo");
const use=$("#useMapLocation");

modal.classList.add("open");
modal.setAttribute("aria-hidden","false");
GSI_SELECTED=null;
use.disabled=true;
const darkerBtn=$("#findDarkerLocation");
if(darkerBtn)darkerBtn.disabled=true;
const darkerBox=$("#darkerSearchResult");
if(darkerBox){darkerBox.className="darker-search-result";darkerBox.innerHTML="";}
clearMapSearchResults();
if($("#mapSearchInput"))$("#mapSearchInput").value="";

if(!navigator.onLine){
mapDiv.innerHTML='<div class="map-offline-msg">オフライン環境では地図を使用できません</div>';
info.textContent="インターネット接続後にもう一度お試しください。";
return;
}

mapDiv.innerHTML="";
info.textContent="地図を読み込んでいます…";

try{
await ensureLeaflet();

const latInput=parseFloat($("#inLat").value);
const lonInput=parseFloat($("#inLon").value);
const startLat=Number.isFinite(latInput)?latInput:36.2;
const startLon=Number.isFinite(lonInput)?lonInput:138.25;
const zoom=Number.isFinite(latInput)&&Number.isFinite(lonInput)?13:5;

if(GSI_MAP){
GSI_MAP.remove();
GSI_MAP=null;
GSI_MARKER=null;
GSI_LIGHT_LAYER=null;
}

GSI_MAP=L.map("gsiMap",{zoomControl:true}).setView([startLat,startLon],zoom);

L.tileLayer(
"https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png",
{
maxZoom:18,
attribution:'<a href="https://maps.gsi.go.jp/" target="_blank" rel="noopener">地理院タイル</a>'
}
).addTo(GSI_MAP);

setLightPollutionLayerVisible($("#lightPollutionToggle")?$("#lightPollutionToggle").checked:true);

GSI_MAP.on("click",e=>{
selectMapPoint(e.latlng.lat,e.latlng.lng);
});

setTimeout(()=>GSI_MAP.invalidateSize(),100);
info.textContent="地図をクリック／タップして観測地点を選択してください。";

if(Number.isFinite(latInput)&&Number.isFinite(lonInput)){
GSI_MARKER=L.marker([latInput,lonInput]).addTo(GSI_MAP);
}
}catch(err){
mapDiv.innerHTML='<div class="map-offline-msg">地図の読み込みに失敗しました</div>';
info.innerHTML=`<span style="color:#f87171">${String(err.message||err)}</span>`;
}
}

function closeMapSelector(){
const modal=$("#mapSelectModal");
modal.classList.remove("open");
modal.setAttribute("aria-hidden","true");
}

function useMapSelectedLocation(){
if(!GSI_SELECTED)return;

$("#inLat").value=GSI_SELECTED.lat.toFixed(6);
$("#inLon").value=GSI_SELECTED.lon.toFixed(6);
$("#inAlt").value=Number.isFinite(GSI_SELECTED.elevation)
?GSI_SELECTED.elevation.toFixed(1)
:"";
$("#inPlace").value=GSI_SELECTED.placeName||"選択地点";

closeMapSelector();

loadWeatherForecast(GSI_SELECTED.lat,GSI_SELECTED.lon);
}

function getConstellationById(id){
return CONSTELLATIONS.find(c=>c.id===id)||null;
}

function switchResultTab(tabName){
const panel=$("#rtab-"+tabName);
const section=$("#resultPanel-"+tabName);
if(!panel||!section)return;
section.open=true;

if(tabName==="skymap"){
  requestAnimationFrame(()=>{
    renderSkyChart();
    syncSkyInteractionLayer();
  });
}
if(tabName==="smallbodies")updateSmallBodyStoredStatus();
if(tabName==="meteors"){
  const d=$("#inDatetime").value?new Date($("#inDatetime").value):new Date();
  if(!METEOR_SHOWERS.length||meteorLoadedYear!==d.getFullYear())loadMeteorShowers();
  else renderMeteorShowers();
}
}

function scrollToResultSection(tabName,block="start"){
const section=$("#resultPanel-"+tabName);
if(!section)return;
section.open=true;
requestAnimationFrame(()=>section.scrollIntoView({behavior:"smooth",block}));
}

function scrollToSkyPanel(){
const section=$("#resultPanel-skymap");
if(!section)return;
section.open=true;
requestAnimationFrame(()=>{
  section.scrollIntoView({behavior:"smooth",block:"start"});
  renderSkyChart();
  syncSkyInteractionLayer();
});
}

function focusConstellationOnSky(constellationId){
const c=getConstellationById(constellationId);
const co=CONST_COORD[constellationId];
if(!c||!co)return;

SKY_FOCUS_CONSTELLATION_ID=constellationId;
SKY_FOCUS_OBJECT_ID=null;
updateSkyTrackingTargetStatus();
switchResultTab("skymap");
scrollToSkyPanel();

requestAnimationFrame(()=>{
renderSkyChart();

const lat=Number.isFinite(currentLat)?currentLat:parseFloat($("#inLat").value);
const lon=Number.isFinite(currentLon)?currentLon:parseFloat($("#inLon").value);
const date=currentDate instanceof Date&&!isNaN(currentDate)
?currentDate
:($("#inDatetime").value?new Date($("#inDatetime").value):new Date());

const aa=altAz(co[0],co[1],lat,lon,date);
const info=$("#skyMapObjectInfo");

if(info){
const hasLine=SKY_CONSTELLATION_LINES.some(x=>
x.name===c.name||
String(x.abbr||"").toLowerCase()===String(c.abbr||"").toLowerCase()
);

if(aa.alt>=0){
info.innerHTML=`<b>🌌 ${c.name}</b> <span style="color:#8b9db3">${c.en}（${c.abbr}）</span><br>代表位置：高度 ${aa.alt.toFixed(1)}° / 方位 ${azToDir(aa.az)}（${aa.az.toFixed(1)}°）<br>${hasLine?'<span style="color:#ffd54f">星座線を黄色く太く強調表示しています。</span>':'<span style="color:#8b9db3">この星座は現在、星座線データ未登録です。</span>'}`;
}else{
info.innerHTML=`<b>🌌 ${c.name}</b> <span style="color:#8b9db3">${c.en}（${c.abbr}）</span><br>現在の星図時刻・場所では代表位置が地平線下です。<br><span style="color:#fb923c">時間送り・時間戻しで見える時刻を探せます。</span>`;
}
}
});
}

function objectRaDecAt(obj,date){
if(!obj)return null;
if(obj.type==="planet"&&obj.planet){
const q=planetRaDec(obj.planet,toJD(date));
return{ra:q.ra,dec:q.dec};
}
if(Number.isFinite(Number(obj.ra))&&Number.isFinite(Number(obj.dec))){
return{ra:Number(obj.ra),dec:Number(obj.dec)};
}
return null;
}

function focusObjectOnSky(obj){
if(!obj)return;
SKY_FOCUS_OBJECT_ID=obj.id||obj.name||null;
SKY_FOCUS_CONSTELLATION_ID=null;
updateSkyTrackingTargetStatus();

if(obj.type==="planet"){
$("#skyShowPlanets").checked=true;
}else{
$("#skyShowDSO").checked=true;
}

switchResultTab("skymap");
scrollToSkyPanel();
requestAnimationFrame(()=>{
renderSkyChart();
const lat=Number.isFinite(currentLat)?currentLat:parseFloat($("#inLat").value);
const lon=Number.isFinite(currentLon)?currentLon:parseFloat($("#inLon").value);
const date=getSkyViewDate();
const rd=objectRaDecAt(obj,date);
const info=$("#skyMapObjectInfo");
if(!rd||!Number.isFinite(lat)||!Number.isFinite(lon))return;
const aa=altAz(rd.ra,rd.dec,lat,lon,date);
if(info){
if(aa.alt>=0){
info.innerHTML=`<b>${escapeHTML(obj.name||obj.id||"天体")}</b><br>高度 ${aa.alt.toFixed(1)}° / 方位 ${azToDir(aa.az)}（${aa.az.toFixed(1)}°）<br><span style="color:#ffd54f">星図上で黄色いリングで強調表示しています。</span>`;
}else{
info.innerHTML=`<b>${escapeHTML(obj.name||obj.id||"天体")}</b><br>現在の星図時刻・場所では地平線下です。<br><span style="color:#fb923c">時間送り・時間戻しで見える時刻を探せます。</span>`;
}
appendSkyHitActions(info,{kind:"object",objectId:obj.id,starId:obj.id,name:obj.name});
}
});
}

function eclipticRaDec(lonDeg,jd){
const T=(jd-2451545.0)/36525;
const eps=(23.439291-0.0130042*T)*D2R;
const l=lonDeg*D2R;
const x=Math.cos(l),y=Math.sin(l)*Math.cos(eps),z=Math.sin(l)*Math.sin(eps);
return{ra:norm360(Math.atan2(y,x)*R2D),dec:Math.atan2(z,Math.hypot(x,y))*R2D};
}

function drawSkyPath(ctx,points,lat,lon,date,cx,cy,R,color,dash=[]){
ctx.save();
ctx.strokeStyle=color;
ctx.lineWidth=1.1;
ctx.setLineDash(dash);
ctx.beginPath();
let started=false;
for(const rd of points){
const p=skyProject(rd.ra,rd.dec,lat,lon,date,cx,cy,R);
if(!p){started=false;continue;}
if(!started){ctx.moveTo(p.x,p.y);started=true;}
else ctx.lineTo(p.x,p.y);
}
ctx.stroke();
ctx.restore();
}

function drawEcliptic(ctx,lat,lon,date,cx,cy,R){
const jd=toJD(date);
const pts=[];
for(let l=0;l<=360;l+=2)pts.push(eclipticRaDec(l,jd));
drawSkyPath(ctx,pts,lat,lon,date,cx,cy,R,"rgba(255,213,79,.62)",[5,4]);
}

function drawLunarPath(ctx,lat,lon,date,cx,cy,R){
const pts=[];
const center=date.getTime();
for(let h=-336;h<=336;h+=12){
const m=moonPosition(toJD(new Date(center+h*3600000)));
pts.push({ra:m.ra,dec:m.dec});
}
drawSkyPath(ctx,pts,lat,lon,date,cx,cy,R,"rgba(225,232,240,.52)",[3,4]);
}

function drawFocusedObject(ctx,lat,lon,date,cx,cy,R){
if(!SKY_FOCUS_OBJECT_ID)return;
const obj=ALL_OBJECTS.find(o=>(o.id||o.name)===SKY_FOCUS_OBJECT_ID);
if(!obj)return;
const rd=objectRaDecAt(obj,date);
if(!rd)return;
const p=skyProject(rd.ra,rd.dec,lat,lon,date,cx,cy,R);
if(!p)return;
ctx.save();
ctx.strokeStyle="#ffd54f";
ctx.lineWidth=2;
ctx.beginPath();
ctx.arc(p.x,p.y,9,0,Math.PI*2);
ctx.stroke();
ctx.restore();
}

function getSkyFocusTarget(date){
if(SKY_FOCUS_OBJECT_ID){
  const obj=ALL_OBJECTS.find(o=>(o.id||o.name)===SKY_FOCUS_OBJECT_ID);
  const rd=objectRaDecAt(obj,date);
  if(obj&&rd)return{kind:"object",name:obj.name||obj.id,ra:rd.ra,dec:rd.dec};
}
if(SKY_FOCUS_CONSTELLATION_ID){
  const c=getConstellationById(SKY_FOCUS_CONSTELLATION_ID);
  const co=CONST_COORD[SKY_FOCUS_CONSTELLATION_ID];
  if(c&&co)return{kind:"constellation",name:c.name,ra:co[0],dec:co[1]};
}
return null;
}

function updateSkyFocusClearButton(){
const btn=$("#clearSkyFocusTarget");
if(!btn)return;
btn.hidden=!(SKY_FOCUS_OBJECT_ID||SKY_FOCUS_CONSTELLATION_ID);
}

function clearSkyFocusTarget(){
SKY_FOCUS_OBJECT_ID=null;
SKY_FOCUS_CONSTELLATION_ID=null;
updateSkyTrackingTargetStatus();
const info=$("#skyMapObjectInfo");
if(info)info.textContent="星・惑星・月・主要天体をクリックすると、ここに情報を表示します。";
renderSkyChart();
}

function updateSkyTrackingTargetStatus(){
const el=$("#skyTrackingTargetStatus");
const target=getSkyFocusTarget(getSkyViewDate());
if(el){
  if(target){
    el.textContent=`目標：${target.name}`;
    el.classList.add("show");
  }else{
    el.textContent="";
    el.classList.remove("show");
  }
}
updateSkyFocusClearButton();
}

function drawTrackingTargetGuide(ctx,lat,lon,date,cx,cy,R,w,h){
if(SKY_PROJECTION!=="tracking"&&SKY_PROJECTION!=="camera")return;
const target=getSkyFocusTarget(date);
if(!target)return;
const aa=altAz(target.ra,target.dec,lat,lon,date);
if(!Number.isFinite(aa.alt)||!Number.isFinite(aa.az))return;

const p=skyProjectAltAz(aa.alt,aa.az,cx,cy,R,true);
ctx.save();
ctx.lineWidth=2;
ctx.strokeStyle="#ffd54f";
ctx.fillStyle="#ffd54f";
ctx.font="bold 11px sans-serif";
ctx.textBaseline="middle";

if(aa.alt<0){
  const text=`${target.name}：地平線下`;
  const tw=ctx.measureText(text).width;
  ctx.fillStyle="rgba(3,7,17,.78)";
  ctx.fillRect(Math.max(8,cx-tw/2-7),h-34,tw+14,24);
  ctx.fillStyle="#ffd54f";
  ctx.textAlign="center";
  ctx.fillText(text,cx,h-22);
  ctx.restore();
  return;
}

/* 対象が画面内なら、小さな矢印とラベルで位置を示す */
if(p){
  const labelY=Math.max(18,p.y-18);
  ctx.beginPath();
  ctx.moveTo(p.x,p.y-11);ctx.lineTo(p.x-5,p.y-18);ctx.lineTo(p.x+5,p.y-18);ctx.closePath();ctx.fill();
  ctx.textAlign="center";
  const label=target.name;
  const tw=ctx.measureText(label).width;
  ctx.fillStyle="rgba(3,7,17,.76)";ctx.fillRect(p.x-tw/2-5,labelY-9,tw+10,18);
  ctx.fillStyle="#ffd54f";ctx.fillText(label,p.x,labelY);
  ctx.restore();
  return;
}

/* 画面外なら、カメラ座標で対象方向を求めて画面端へ矢印を置く */
const v=horizontalUnitVector(aa.alt,aa.az);
const forward=horizontalUnitVector(SKY_PERSPECTIVE_ALT,SKY_PERSPECTIVE_AZ);
const camAz=SKY_PERSPECTIVE_AZ*D2R;
const right={x:Math.cos(camAz),y:-Math.sin(camAz),z:0};
const up={
  x:right.y*forward.z-right.z*forward.y,
  y:right.z*forward.x-right.x*forward.z,
  z:right.x*forward.y-right.y*forward.x
};
let dx=v.x*right.x+v.y*right.y+v.z*right.z;
let dy=-(v.x*up.x+v.y*up.y+v.z*up.z);
if(Math.hypot(dx,dy)<0.03){
  const da=((aa.az-SKY_PERSPECTIVE_AZ+540)%360)-180;
  dx=da>=0?1:-1;dy=0;
}
const {halfX,halfY}=getSkyPerspectiveViewport(R);
const maxX=Math.max(24,halfX-28),maxY=Math.max(24,halfY-28);
const k=Math.min(maxX/Math.max(.0001,Math.abs(dx)),maxY/Math.max(.0001,Math.abs(dy)));
const ax=cx+dx*k,ay=cy+dy*k;
const angle=Math.atan2(dy,dx);
ctx.save();ctx.translate(ax,ay);ctx.rotate(angle);
ctx.beginPath();ctx.moveTo(12,0);ctx.lineTo(-7,-7);ctx.lineTo(-3,0);ctx.lineTo(-7,7);ctx.closePath();ctx.fill();ctx.restore();

const dot=Math.max(-1,Math.min(1,v.x*forward.x+v.y*forward.y+v.z*forward.z));
const sep=Math.acos(dot)*R2D;
const label=`${target.name}  ${Math.round(sep)}°`;
ctx.textAlign=ax>cx?"right":"left";
const lx=ax+(ax>cx?-18:18);
const ly=Math.max(18,Math.min(h-18,ay));
const tw=ctx.measureText(label).width;
ctx.fillStyle="rgba(3,7,17,.78)";
ctx.fillRect(ax>cx?lx-tw-5:lx-5,ly-9,tw+10,18);
ctx.fillStyle="#ffd54f";ctx.fillText(label,lx,ly);
ctx.restore();
}

function syncSolarPathControls(){
const sun=$("#skyShowSun"),moon=$("#skyShowMoon");
const ecl=$("#skyShowEcliptic"),lun=$("#skyShowLunarPath");
if(ecl)ecl.disabled=!(sun&&sun.checked);
if(lun)lun.disabled=!(moon&&moon.checked);
}

function getSkyConstellationLabels(){
return CONSTELLATIONS.map(c=>{
const co=CONST_COORD[c.id];
return co?{id:c.id,name:c.name,ra:co[0],dec:co[1]}:null;
}).filter(Boolean);
}

const SKY_CONSTELLATION_LINES_FALLBACK=[
{name:"おおぐま座",abbr:"UMa",lines:[["Dubhe","Merak"],["Merak","Phecda"],["Phecda","Megrez"],["Megrez","Alioth"],["Alioth","Mizar"],["Mizar","Alkaid"]]},
{name:"こぐま座",abbr:"UMi",lines:[["Polaris","Kochab"],["Kochab","Pherkad"]]},
{name:"カシオペヤ座",abbr:"Cas",lines:[["Caph","Schedar"],["Schedar","GammaCas"],["GammaCas","Ruchbah"],["Ruchbah","Segin"]]},
{name:"オリオン座",abbr:"Ori",lines:[["Betelgeuse","Bellatrix"],["Betelgeuse","Alnitak"],["Alnitak","Alnilam"],["Alnilam","Mintaka"],["Mintaka","Bellatrix"],["Alnitak","Saiph"],["Saiph","Rigel"],["Rigel","Mintaka"]]},
{name:"はくちょう座",abbr:"Cyg",lines:[["Deneb","Albireo"]]},
{name:"こと座",abbr:"Lyr",lines:[["Vega","EpsLyr"]]},
{name:"ふたご座",abbr:"Gem",lines:[["Castor","Pollux"]]},
{name:"しし座",abbr:"Leo",lines:[["Regulus","Algieba"],["Algieba","Zosma"],["Zosma","Denebola"]]},
{name:"さそり座",abbr:"Sco",lines:[["Antares","Dschubba"],["Dschubba","Acrab"],["Antares","Shaula"],["Shaula","Sargas"]]},
{name:"いて座",abbr:"Sgr",lines:[["KausAust","Nunki"],["Nunki","Ascella"],["Ascella","KausAust"]]},
{name:"アンドロメダ座",abbr:"And",lines:[["Alpheratz","Mirach"],["Mirach","Almach"]]},
{name:"ペガスス座",abbr:"Peg",lines:[["Alpheratz","Scheat"],["Scheat","Markab"],["Markab","Algenib"],["Algenib","Alpheratz"]]},
{name:"おひつじ座",abbr:"Ari",lines:[["Hamal","Sheratan"]]},
{name:"ペルセウス座",abbr:"Per",lines:[["Mirfak","Algol"]]}
];

let SKY_CONSTELLATION_LINES=[...SKY_CONSTELLATION_LINES_FALLBACK];
let WESTERN_LINE_STARS={};
let WESTERN_LINES_READY=false;

const WESTERN_CACHE_KEY="nicole_stellarium_western_lines_v1";
const WESTERN_LINE_URLS=[
"https://raw.githubusercontent.com/creativival/hipparcos_planetarium_data_creator/main/data/hip_constellation_line.csv",
"https://creativival.github.io/hipparcos_planetarium_data_creator/data/hip_constellation_line.csv"
];
const WESTERN_STAR_URLS=[
"https://raw.githubusercontent.com/creativival/hipparcos_planetarium_data_creator/main/data/hip_constellation_line_star.csv",
"https://creativival.github.io/hipparcos_planetarium_data_creator/data/hip_constellation_line_star.csv"
];

function constellationByAbbr(abbr){
return CONSTELLATIONS.find(c=>String(c.abbr).toLowerCase()===String(abbr).toLowerCase())||null;
}

function setSkyLineStatus(text,color="#6f94b3"){
const el=$("#skyLineStatus");
if(el){
el.textContent=text;
el.style.color=color;
el.style.display=text?"block":"none";
}
}

function parseCsvRows(text){
return String(text||"").replace(/\r/g,"").split("\n")
.map(line=>line.trim()).filter(Boolean)
.map(line=>line.split(",").map(v=>v.trim().replace(/^"|"$/g,"")));
}

function parseWesternStarCsv(text){
const stars={};
parseCsvRows(text).forEach(row=>{
if(row.length<8)return;
const hip=Number(row[0]),rah=Number(row[1]),ram=Number(row[2]),ras=Number(row[3]);
const dd=Number(row[4]),dm=Number(row[5]),ds=Number(row[6]),mag=Number(row[7]);
if(![hip,rah,ram,ras,dd,dm,ds].every(Number.isFinite))return;

const ra=(rah+ram/60+ras/3600)*15;
const dec=dd<0 ? dd-Math.abs(dm)/60-Math.abs(ds)/3600 : dd+Math.abs(dm)/60+Math.abs(ds)/3600;

stars[hip]={id:`HIP${hip}`,hip,ra,dec,mag:Number.isFinite(mag)?mag:6};
});
return stars;
}

function parseWesternLineCsv(text,stars){
const grouped={};
parseCsvRows(text).forEach(row=>{
if(row.length<3)return;
const abbr=row[0],h1=Number(row[1]),h2=Number(row[2]);
if(!abbr||!Number.isFinite(h1)||!Number.isFinite(h2)||!stars[h1]||!stars[h2])return;
if(!grouped[abbr])grouped[abbr]=[];
grouped[abbr].push([`HIP${h1}`,`HIP${h2}`]);
});

return Object.entries(grouped).map(([abbr,lines])=>{
const c=constellationByAbbr(abbr);
return{name:c?c.name:abbr,abbr,lines};
});
}

async function fetchFirstText(urls){
let lastError=null;
for(const url of urls){
try{
const res=await fetch(url,{cache:"no-store"});
if(!res.ok)throw new Error(`HTTP ${res.status}`);
const text=await res.text();
if(text&&text.length>100)return text;
}catch(err){lastError=err;}
}
throw lastError||new Error("データ取得に失敗しました");
}

function restoreWesternLineCache(){
try{
const raw=localStorage.getItem(WESTERN_CACHE_KEY);
if(!raw)return false;
const cached=JSON.parse(raw);
if(!cached||!cached.stars||!Array.isArray(cached.lines))return false;
if(Object.keys(cached.stars).length<500||cached.lines.length<70)return false;

WESTERN_LINE_STARS=cached.stars;
SKY_CONSTELLATION_LINES=cached.lines;
WESTERN_LINES_READY=true;

const segCount=SKY_CONSTELLATION_LINES.reduce((n,c)=>n+c.lines.length,0);
setSkyLineStatus("");
return true;
}catch(e){return false;}
}

async function loadWesternConstellationLines(){
if(WESTERN_LINES_READY)return;
if(restoreWesternLineCache()){
if($("#resultPanel-skymap")?.open)renderSkyChart();
return;
}

setSkyLineStatus("星座線：Stellarium Western相当データを取得中…","#ffd54f");

try{
const [lineText,starText]=await Promise.all([
fetchFirstText(WESTERN_LINE_URLS),
fetchFirstText(WESTERN_STAR_URLS)
]);

const stars=parseWesternStarCsv(starText);
const lines=parseWesternLineCsv(lineText,stars);
const starCount=Object.keys(stars).length;
const segCount=lines.reduce((n,c)=>n+c.lines.length,0);

if(starCount<500||lines.length<70||segCount<500){
throw new Error(`件数不足 ${starCount}/${lines.length}/${segCount}`);
}

WESTERN_LINE_STARS=stars;
SKY_CONSTELLATION_LINES=lines;
WESTERN_LINES_READY=true;

try{
localStorage.setItem(WESTERN_CACHE_KEY,JSON.stringify({savedAt:new Date().toISOString(),stars,lines}));
}catch(e){}

setSkyLineStatus("");

if($("#resultPanel-skymap")?.open)renderSkyChart();
}catch(err){
WESTERN_LINE_STARS={};
SKY_CONSTELLATION_LINES=[...SKY_CONSTELLATION_LINES_FALLBACK];
WESTERN_LINES_READY=false;
setSkyLineStatus("星座線：内蔵簡易データ（Westernデータ取得失敗）","#fb923c");
}
}

function horizontalUnitVector(altDeg,azDeg){
const alt=altDeg*D2R,az=azDeg*D2R;
/* x=東, y=北, z=天頂 */
return{
x:Math.cos(alt)*Math.sin(az),
y:Math.cos(alt)*Math.cos(az),
z:Math.sin(alt)
};
}

function perspectiveProjectAltAz(alt,az,cx,cy,radius,allowBelowHorizon=false){
if(!allowBelowHorizon && alt<0)return null;
/* 写野枠では地上側も少し広めに許可 */
if(allowBelowHorizon && alt<-89.5)return null;

const v=horizontalUnitVector(alt,az);
const forward=horizontalUnitVector(SKY_PERSPECTIVE_ALT,SKY_PERSPECTIVE_AZ);

/* 画面右方向。南を向いたときは西が右になる */
const camAz=SKY_PERSPECTIVE_AZ*D2R;
const right={x:Math.cos(camAz),y:-Math.sin(camAz),z:0};

/* 画面上方向 */
const up={
x:right.y*forward.z-right.z*forward.y,
y:right.z*forward.x-right.x*forward.z,
z:right.x*forward.y-right.y*forward.x
};

const X=v.x*right.x+v.y*right.y+v.z*right.z;
const Y=v.x*up.x+v.y*up.y+v.z*up.z;
const Z=v.x*forward.x+v.y*forward.y+v.z*forward.z;

/* カメラ背面は表示しない */
if(Z<=0.001)return null;

const {halfX:viewportHalfX,halfY:viewportHalfY}=getSkyPerspectiveViewport(radius);
const halfFov=(getActivePerspectiveFov()/2)*D2R;
/* 縦方向のFOVを基準に投影し、横長画面では左右の視野を自然に拡張する */
const scale=viewportHalfY/Math.tan(halfFov);

let x=cx+(X/Z)*scale;
let y=cy-(Y/Z)*scale;

x=cx+(x-cx)*SKY_ZOOM+SKY_PAN_X;
y=cy+(y-cy)*SKY_ZOOM+SKY_PAN_Y;

const margin=14;
if(
x<cx-viewportHalfX-margin||x>cx+viewportHalfX+margin||
y<cy-viewportHalfY-margin||y>cy+viewportHalfY+margin
)return null;

return{
x,y,
alt,
az:((az%360)+360)%360
};
}

function skyProjectAltAz(alt,az,cx,cy,radius,allowBelowHorizon=false){
if(isHorizonProjection()){
return perspectiveProjectAltAz(alt,az,cx,cy,radius,allowBelowHorizon);
}
if(alt<0)return null;
const r=radius*(90-alt)/90;
const a=az*D2R;
const bx=cx-r*Math.sin(a);
const by=cy-r*Math.cos(a);
return{
x:cx+(bx-cx)*SKY_ZOOM+SKY_PAN_X,
y:cy+(by-cy)*SKY_ZOOM+SKY_PAN_Y,
alt,
az
};
}

function skyProject(ra,dec,lat,lon,date,cx,cy,radius){
const aa=altAz(ra,dec,lat,lon,date);
return skyProjectAltAz(aa.alt,aa.az,cx,cy,radius);
}


/* =====================================================
天の川：実測等輝度輪郭データ
d3-celestial系 Milky Way GeoJSON（RA/Dec）を使用
===================================================== */
function setMilkyWayStatus(message,color="#6f94b3"){
const el=$("#skyMilkyWayStatus");
if(!el)return;
el.textContent=message||"";
el.style.color=color;
}

function validateMilkyWayGeoJSON(data){
return !!(
data &&
data.type==="FeatureCollection" &&
Array.isArray(data.features) &&
data.features.some(f=>f&&f.geometry&&["Polygon","MultiPolygon"].includes(f.geometry.type))
);
}

function restoreMilkyWayCache(){
try{
const raw=localStorage.getItem(MILKYWAY_CACHE_KEY);
if(!raw)return false;
const data=JSON.parse(raw);
if(!validateMilkyWayGeoJSON(data))return false;
MILKYWAY_OUTLINE_DATA=data;
setMilkyWayStatus("輪郭データ：保存済み","#7fc8a9");
return true;
}catch(e){
return false;
}
}

async function loadMilkyWayOutline(){
if(MILKYWAY_LOADING)return;
if(MILKYWAY_OUTLINE_DATA){
renderSkyChart();
return;
}
if(!navigator.onLine){
setMilkyWayStatus("輪郭データ未取得（オフライン）","#fb923c");
return;
}

MILKYWAY_LOADING=true;
setMilkyWayStatus("輪郭データ読込中…","#8ab4d4");

let lastError=null;
for(const url of MILKYWAY_URLS){
try{
const res=await fetch(url,{cache:"no-store"});
if(!res.ok)throw new Error(`HTTP ${res.status}`);
const data=await res.json();
if(!validateMilkyWayGeoJSON(data))throw new Error("データ形式が不正です");

MILKYWAY_OUTLINE_DATA=data;
try{
localStorage.setItem(MILKYWAY_CACHE_KEY,JSON.stringify(data));
}catch(e){}

setMilkyWayStatus("輪郭データ：読込済み","#7fc8a9");
MILKYWAY_LOADING=false;
renderSkyChart();
return;
}catch(err){
lastError=err;
}
}

MILKYWAY_LOADING=false;
setMilkyWayStatus("輪郭データ取得失敗","#f87171");
console.warn("Milky Way outline load failed:",lastError);
}

function milkyWayRaFromGeoLon(lon){
const v=Number(lon);
if(!Number.isFinite(v))return null;
/* d3-celestial: RAは -180..180° 表記 */
return v<0?v+360:v;
}

function milkyWayGeometryRings(geometry){
if(!geometry)return[];
if(geometry.type==="Polygon"){
return Array.isArray(geometry.coordinates)?geometry.coordinates:[];
}
if(geometry.type==="MultiPolygon"){
const rings=[];
(geometry.coordinates||[]).forEach(poly=>{
(poly||[]).forEach(ring=>rings.push(ring));
});
return rings;
}
return[];
}

function drawMilkyWayRing(ctx,ring,lat,lon,date,cx,cy,R,style){
if(!Array.isArray(ring)||ring.length<3)return;

ctx.save();
ctx.strokeStyle=style.color;
ctx.lineWidth=style.width;
ctx.lineJoin="round";
ctx.lineCap="round";
ctx.beginPath();

let prev=null;
let started=false;

for(const coord of ring){
if(!Array.isArray(coord)||coord.length<2){
prev=null;started=false;continue;
}
const ra=milkyWayRaFromGeoLon(coord[0]);
const dec=Number(coord[1]);
if(!Number.isFinite(ra)||!Number.isFinite(dec)){
prev=null;started=false;continue;
}

const p=skyProject(ra,dec,lat,lon,date,cx,cy,R);
if(!p){
prev=null;started=false;
continue;
}

/* 地平線・投影境界・RA境界をまたぐ誤接続を防止 */
const jump=prev?Math.hypot(p.x-prev.x,p.y-prev.y):0;
if(!started || !prev || jump>R*0.34){
ctx.moveTo(p.x,p.y);
started=true;
}else{
ctx.lineTo(p.x,p.y);
}
prev=p;
}

ctx.stroke();
ctx.restore();
}

function drawMilkyWay(ctx,lat,lon,date,cx,cy,R){
if(!MILKYWAY_OUTLINE_DATA)return;

const features=MILKYWAY_OUTLINE_DATA.features||[];

/* ol1が最外周。必要に応じて内部等輝度輪郭もごく薄く表示 */
const styles={
ol1:{color:"rgba(194,205,232,.32)",width:1.25},
ol2:{color:"rgba(176,190,220,.10)",width:.75},
ol3:{color:"rgba(176,190,220,.07)",width:.68},
ol4:{color:"rgba(176,190,220,.05)",width:.62},
ol5:{color:"rgba(176,190,220,.035)",width:.58}
};

for(const feature of features){
const id=String(feature.id||"").toLowerCase();
const style=styles[id]||styles.ol1;
const rings=milkyWayGeometryRings(feature.geometry);
for(const ring of rings){
drawMilkyWayRing(ctx,ring,lat,lon,date,cx,cy,R,style);
}
}
}

/* =====================================================
カメラ写野
===================================================== */
const ASTRO_CAMERA_PRESETS={
z8:{name:"Nikon Z8",sensorW:35.9,sensorH:23.9,pixelsW:8256,pixelsH:5504,mp:45.7},
d6:{name:"Nikon D6",sensorW:35.9,sensorH:23.9,pixelsW:5568,pixelsH:3712,mp:20.8},
zr:{name:"Nikon ZR",sensorW:35.9,sensorH:23.9,pixelsW:6048,pixelsH:4032,mp:24.5}
};
const ASTRO_CUSTOM_CAMERA_KEY="nicole_astro_custom_cameras_v1";
const ASTRO_SENSOR_FORMATS={
full:{name:"フルサイズ",sensorW:36,sensorH:24,aspect:3/2},
apsc:{name:"APS-C",sensorW:23.5,sensorH:15.6,aspect:3/2},
mft:{name:"フォーサーズ",sensorW:17.3,sensorH:13.0,aspect:4/3}
};

function loadAstroCustomCameras(){
try{
const x=JSON.parse(localStorage.getItem(ASTRO_CUSTOM_CAMERA_KEY)||"[]");
return Array.isArray(x)?x.filter(v=>v&&v.id&&v.name):[];
}catch(e){return[];}
}
function saveAstroCustomCameras(items){
try{localStorage.setItem(ASTRO_CUSTOM_CAMERA_KEY,JSON.stringify(items));}catch(e){}
}
function approximatePixelsFromMP(mp,format){
const f=ASTRO_SENSOR_FORMATS[format]||ASTRO_SENSOR_FORMATS.full;
const total=Math.max(1,Number(mp)||24)*1e6;
const w=Math.sqrt(total*f.aspect);
const h=w/f.aspect;
return{pixelsW:Math.round(w),pixelsH:Math.round(h)};
}
function cameraFromCustomData(data){
const f=ASTRO_SENSOR_FORMATS[data.sensorFormat]||ASTRO_SENSOR_FORMATS.full;
const px=approximatePixelsFromMP(data.mp,data.sensorFormat);
return{
name:data.name||"カスタム",
sensorW:f.sensorW,
sensorH:f.sensorH,
pixelsW:px.pixelsW,
pixelsH:px.pixelsH,
mp:Number(data.mp)||24,
customId:data.id||null,
sensorFormat:data.sensorFormat||"full"
};
}
function refreshAstroCameraPresetOptions(selectedValue=null){
const sel=$("#astroCameraPreset");
if(!sel)return;
const current=selectedValue||sel.value||"z8";
[...sel.querySelectorAll('option[data-custom-saved="1"]')].forEach(o=>o.remove());
const customs=loadAstroCustomCameras();
for(const c of customs){
const o=document.createElement("option");
o.value="saved:"+c.id;
o.dataset.customSaved="1";
o.textContent=c.name;
sel.appendChild(o);
}
sel.value=[...sel.options].some(o=>o.value===current)?current:"z8";
}
function fillCustomCameraEditor(data=null){
const d=data||{name:"",sensorFormat:"full",mp:24,id:null};
$("#astroCustomName").value=d.name||"";
$("#astroCustomSensorFormat").value=d.sensorFormat||"full";
$("#astroCustomMP").value=Number(d.mp)||24;
$("#astroCustomCamera").dataset.editId=d.id||"";
$("#astroDeleteCustomCamera").hidden=!d.id;
}
function selectedCustomCameraData(){
const value=$("#astroCameraPreset")?.value||"z8";
if(value==="custom"){
return{
id:$("#astroCustomCamera")?.dataset.editId||null,
name:($("#astroCustomName")?.value||"カスタム").trim()||"カスタム",
sensorFormat:$("#astroCustomSensorFormat")?.value||"full",
mp:parseFloat($("#astroCustomMP")?.value)||24
};
}
if(value.startsWith("saved:")){
const id=value.slice(6);
return loadAstroCustomCameras().find(x=>x.id===id)||null;
}
return null;
}
function getAstroCameraSettings(){
const preset=$("#astroCameraPreset")?.value||"z8";
let c;
if(preset==="custom"||preset.startsWith("saved:")){
c=cameraFromCustomData(selectedCustomCameraData()||{name:"カスタム",sensorFormat:"full",mp:24});
}else{
c={...(ASTRO_CAMERA_PRESETS[preset]||ASTRO_CAMERA_PRESETS.z8)};
}
c.pitchMicron=(c.sensorW/c.pixelsW)*1000;
return c;
}
function showAstroCustomEditorForSelection(){
const value=$("#astroCameraPreset")?.value||"z8";
const custom=value==="custom"||value.startsWith("saved:");
$("#astroCustomCamera").hidden=!custom;
if(value==="custom"){
if(!$("#astroCustomCamera").dataset.editId)fillCustomCameraEditor();
}else if(value.startsWith("saved:")){
const d=selectedCustomCameraData();
if(d)fillCustomCameraEditor(d);
}
}
function persistCurrentAstroCustomCamera(){
const name=($("#astroCustomName")?.value||"").trim();
if(!name){alert("カスタム設定の名前を入力してください。");return;}
const mp=parseFloat($("#astroCustomMP")?.value);
if(!Number.isFinite(mp)||mp<=0){alert("画素数（MP）を入力してください。");return;}
const items=loadAstroCustomCameras();
let id=$("#astroCustomCamera")?.dataset.editId||"";
if(!id)id="cam_"+Date.now().toString(36);
const data={id,name,sensorFormat:$("#astroCustomSensorFormat")?.value||"full",mp};
const idx=items.findIndex(x=>x.id===id);
if(idx>=0)items[idx]=data;else items.push(data);
saveAstroCustomCameras(items);
refreshAstroCameraPresetOptions("saved:"+id);
fillCustomCameraEditor(data);
updateFovInfo();
renderSkyChart();
}
function deleteCurrentAstroCustomCamera(){
const id=$("#astroCustomCamera")?.dataset.editId||"";
if(!id)return;
saveAstroCustomCameras(loadAstroCustomCameras().filter(x=>x.id!==id));
$("#astroCustomCamera").dataset.editId="";
refreshAstroCameraPresetOptions("custom");
fillCustomCameraEditor();
showAstroCustomEditorForSelection();
updateFovInfo();
renderSkyChart();
}

function getFovSettings(){
const c=getAstroCameraSettings();
let sensorW=c.sensorW,sensorH=c.sensorH;
let focal=parseFloat($("#skyFovFocal")?$("#skyFovFocal").value:"20");
if(!Number.isFinite(focal)||focal<=0)focal=20;
if($("#skyFovOrientation")?.value==="portrait"){
[sensorW,sensorH]=[sensorH,sensorW];
}
const hFov=2*Math.atan(sensorW/(2*focal))/D2R;
const vFov=2*Math.atan(sensorH/(2*focal))/D2R;
const maxExposure500=500/focal;
return{sensorW,sensorH,cropFactor:1,focal,hFov,vFov,maxExposure500,camera:c};
}

function updateFovInfo(){
const info=$("#skyFovInfo");
const camInfo=$("#astroCameraInfo");
const f=getFovSettings();
if(info){
info.textContent=`${f.camera.name} ${f.focal}mm：${f.hFov.toFixed(1)}° × ${f.vFov.toFixed(1)}°`;
}
if(camInfo){
const mp=f.camera.mp?`${f.camera.mp}MP / `:"";
camInfo.textContent=`${mp}${f.camera.pixelsW}×${f.camera.pixelsH} / 画素ピッチ 約${f.camera.pitchMicron.toFixed(2)}µm`;
}
}

function shootingCenterAltAz(){
return isHorizonProjection()
?{alt:SKY_PERSPECTIVE_ALT,az:SKY_PERSPECTIVE_AZ}
:{alt:SKY_FOV_ALLSKY_ALT,az:SKY_FOV_ALLSKY_AZ};
}

function declinationFromAltAz(altDeg,azDeg,latDeg){
const a=altDeg*D2R,A=azDeg*D2R,p=latDeg*D2R;
const s=Math.sin(a)*Math.sin(p)+Math.cos(a)*Math.cos(p)*Math.cos(A);
return Math.asin(Math.max(-1,Math.min(1,s)))*R2D;
}

function angleSepAltAz(a1,z1,a2,z2){
const r1=a1*D2R,r2=a2*D2R,dz=(z1-z2)*D2R;
const c=Math.sin(r1)*Math.sin(r2)+Math.cos(r1)*Math.cos(r2)*Math.cos(dz);
return Math.acos(Math.max(-1,Math.min(1,c)))*R2D;
}

function sampledFovDeclinations(){
const lat=Number.isFinite(currentLat)?currentLat:parseFloat($("#inLat")?.value);
if(!Number.isFinite(lat))return[];
const f=getFovSettings();
const center=shootingCenterAltAz();
const tx=Math.tan((f.hFov/2)*D2R);
const ty=Math.tan((f.vFov/2)*D2R);
const vals=[];
for(let iy=-2;iy<=2;iy++){
for(let ix=-2;ix<=2;ix++){
const aa=viewTangentPoint(center.alt,center.az,tx*(ix/2),ty*(iy/2));
if(aa.alt<0)continue;
vals.push({dec:declinationFromAltAz(aa.alt,aa.az,lat),alt:aa.alt,az:aa.az});
}
}
return vals;
}

function trailDeclinationDeg(){
const lat=Number.isFinite(currentLat)?currentLat:parseFloat($("#inLat")?.value);
if(!Number.isFinite(lat))return 0;
const center=shootingCenterAltAz();
if($("#astroTrailBasis")?.value==="center"){
return declinationFromAltAz(center.alt,center.az,lat);
}
const vals=sampledFovDeclinations();
if(!vals.length)return declinationFromAltAz(center.alt,center.az,lat);
let best=vals[0].dec;
for(const v of vals){
if(Math.abs(v.dec)<Math.abs(best))best=v.dec;
}
return best;
}

function pointStarExposureFor(focal,allowedPixels,decDeg){
const c=getAstroCameraSettings();
const pixelScale=206.265*c.pitchMicron/focal;
const speed=15.041067*Math.max(0.03,Math.cos(Math.abs(decDeg)*D2R));
return allowedPixels*pixelScale/speed;
}

const ASTRO_SHUTTER_STEPS=[
1/8000,1/6400,1/5000,1/4000,1/3200,1/2500,1/2000,1/1600,1/1250,1/1000,
1/800,1/640,1/500,1/400,1/320,1/250,1/200,1/160,1/125,1/100,1/80,1/60,
1/50,1/40,1/30,1/25,1/20,1/15,1/13,1/10,1/8,1/6,1/5,1/4,0.3,0.4,0.5,
0.6,0.8,1,1.3,1.6,2,2.5,3,4,5,6,8,10,13,15,20,25,30,60,90,120,180,240,300,600,900
];

function safeShutterStep(seconds){
let out=ASTRO_SHUTTER_STEPS[0];
for(const s of ASTRO_SHUTTER_STEPS){
if(s<=seconds+1e-9)out=s;else break;
}
return out;
}

function formatShutter(s){
if(!Number.isFinite(s)||s<=0)return"—";
if(s<1){
const d=Math.round(1/s);
return `1/${d}秒`;
}
if(s<10&&Math.abs(s-Math.round(s))>.05)return `${s.toFixed(1)}秒`;
return `${Math.round(s)}秒`;
}

function formatDuration(sec){
if(!Number.isFinite(sec)||sec<0)return"—";
const s=Math.round(sec);
const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),ss=s%60;
if(h)return `${h}時間${m}分${ss?ss+"秒":""}`;
if(m)return `${m}分${ss?ss+"秒":""}`;
return `${ss}秒`;
}

function npfExposureSeconds(focal,aperture){
const c=getAstroCameraSettings();
return (35*aperture+30*c.pitchMicron)/focal;
}

function angularSeparationRaDec(ra1,dec1,ra2,dec2){
const d1=dec1*D2R,d2=dec2*D2R,dr=(ra1-ra2)*D2R;
const c=Math.sin(d1)*Math.sin(d2)+Math.cos(d1)*Math.cos(d2)*Math.cos(dr);
return Math.acos(Math.max(-1,Math.min(1,c)))*R2D;
}

function updateAstroPhotoTools(){
const f=getFovSettings();
const dec=trailDeclinationDeg();
const aperture=Math.max(.7,parseFloat($("#astroAperture")?.value)||1.8);
const strict=pointStarExposureFor(f.focal,1.5,dec);
const practical=pointStarExposureFor(f.focal,2.5,dec);
const npf=npfExposureSeconds(f.focal,aperture);
const rule500=500/f.focal;

const strictStep=safeShutterStep(strict);
const practicalStep=safeShutterStep(practical);

if($("#astroStrictSS"))$("#astroStrictSS").textContent=formatShutter(strictStep);
if($("#astroPracticalSS"))$("#astroPracticalSS").textContent=formatShutter(practicalStep);
if($("#astroNpfSS"))$("#astroNpfSS").textContent=formatShutter(safeShutterStep(npf));
if($("#astro500SS"))$("#astro500SS").textContent=formatShutter(safeShutterStep(rule500));

const c=getAstroCameraSettings();
const center=shootingCenterAltAz();
const centerLat=Number.isFinite(currentLat)?currentLat:parseFloat($("#inLat")?.value);
const centerDec=Number.isFinite(centerLat)?declinationFromAltAz(center.alt,center.az,centerLat):0;
const basis=$("#astroTrailBasis")?.value==="center"?"写野中心":"写野内で最も日周運動が速い領域";
if($("#astroDirectionInfo")){
$("#astroDirectionInfo").innerHTML=`${c.name} / ${f.focal}mm / F${aperture.toFixed(1)} / 画素ピッチ ${c.pitchMicron.toFixed(2)}µm<br>撮影方向：${azToDir(center.az)}・高度 ${center.alt.toFixed(1)}° / 中心赤緯 ${centerDec.toFixed(1)}° / 判定赤緯 ${dec.toFixed(1)}°（${basis}）<br>計算上限：星像優先 ${strict.toFixed(2)}秒 → 安全側 ${formatShutter(strictStep)}、実用優先 ${practical.toFixed(2)}秒 → ${formatShutter(practicalStep)}`;
}

const focalSet=[14,20,24,28,35,50,85,105,135];
if(!focalSet.includes(Math.round(f.focal)))focalSet.push(Math.round(f.focal));
focalSet.sort((a,b)=>a-b);
if($("#astroFocalCompare")){
$("#astroFocalCompare").innerHTML=focalSet.map(mm=>{
const t=pointStarExposureFor(mm,2.5,dec);
const s=safeShutterStep(t);
return `<div class="focal-compare-item ${Math.abs(mm-f.focal)<.5?"current":""}"><b>${mm}mm</b><span>${formatShutter(s)}</span></div>`;
}).join("");
}

updateAstroSkyConditions();
updateContinuousShootingTools();
}

function updateAstroSkyConditions(){
const lat=Number.isFinite(currentLat)?currentLat:parseFloat($("#inLat")?.value);
const lon=Number.isFinite(currentLon)?currentLon:parseFloat($("#inLon")?.value);
const date=getSkyViewDate();
if(!Number.isFinite(lat)||!Number.isFinite(lon)||!date||isNaN(date))return;
const center=shootingCenterAltAz();

const gc={ra:266.41683,dec:-29.00781};
const gcAA=altAz(gc.ra,gc.dec,lat,lon,date);
const gcSep=angleSepAltAz(center.alt,center.az,gcAA.alt,gcAA.az);
if($("#astroMilkyWayStatus")){
$("#astroMilkyWayStatus").textContent=gcAA.alt>=0?`銀河中心：高度 ${gcAA.alt.toFixed(1)}°`:"銀河中心：地平線下";
}
if($("#astroMilkyWayDetail")){
const near=gcAA.alt<0?"現在は撮影方向に出ていません":gcSep<=Math.max(getFovSettings().hFov,getFovSettings().vFov)/2?"写野付近に銀河中心があります":`写野中心から ${gcSep.toFixed(1)}°`;
$("#astroMilkyWayDetail").textContent=`${azToDir(gcAA.az)}（${gcAA.az.toFixed(1)}°） / ${near}`;
}

const moon=moonPosition(toJD(date));
const moonAA=altAz(moon.ra,moon.dec,lat,lon,date);
const sep=angleSepAltAz(center.alt,center.az,moonAA.alt,moonAA.az);
const ph=moonPhaseInfo(date);
if($("#astroMoonSeparation"))$("#astroMoonSeparation").textContent=`${sep.toFixed(1)}°`;
if($("#astroMoonSeparationDetail"))$("#astroMoonSeparationDetail").textContent=`月：高度 ${moonAA.alt.toFixed(1)}° / 輝面 ${ph.moonIllum}%`;

let impactScore=0;
if(moonAA.alt>0){
const altFactor=Math.max(0,Math.sin(moonAA.alt*D2R));
const sepFactor=.18+.82*Math.max(0,1-Math.min(sep,120)/120);
impactScore=(ph.moonIllum/100)*altFactor*sepFactor;
}
let label,color,detail;
if(moonAA.alt<=0){label="ほぼなし";color="#84d0a5";detail="月は地平線下";}
else if(impactScore<.10){label="小";color="#84d0a5";detail="星景撮影への影響は比較的小さい目安";}
else if(impactScore<.28){label="中";color="#ffd166";detail="空の明るさやコントラスト低下に注意";}
else{label="大";color="#f59e8b";detail="淡い天の川・星雲には不利な条件";}
if($("#astroMoonImpact")){$("#astroMoonImpact").textContent=label;$("#astroMoonImpact").style.color=color;}
if($("#astroMoonImpactDetail"))$("#astroMoonImpactDetail").textContent=`${detail} / 月齢 ${ph.moonAge}・輝面 ${ph.moonIllum}%・高度 ${moonAA.alt.toFixed(1)}°`;
}

function updateContinuousShootingTools(){
const expo=Math.max(.1,parseFloat($("#intervalExposure")?.value)||0);
const gap=Math.max(0,parseFloat($("#intervalGap")?.value)||0);
const frames=Math.max(1,Math.floor(parseFloat($("#intervalFrames")?.value)||1));
const total=frames*expo+Math.max(0,frames-1)*gap;
if($("#intervalTotalResult"))$("#intervalTotalResult").textContent=`${frames.toLocaleString()}枚 → 約 ${formatDuration(total)}`;

const tlLen=Math.max(.1,parseFloat($("#timelapseLength")?.value)||0);
const fps=Math.max(1,parseFloat($("#timelapseFps")?.value)||1);
const interval=Math.max(.1,parseFloat($("#timelapseInterval")?.value)||1);
const tlFrames=Math.ceil(tlLen*fps);
const tlSpan=Math.max(0,(tlFrames-1)*interval);
if($("#timelapseResult"))$("#timelapseResult").textContent=`必要 ${tlFrames.toLocaleString()}枚 / 撮影スパン 約 ${formatDuration(tlSpan)}`;

const deg=Math.max(1,parseFloat($("#trailDegrees")?.value)||1);
const trailExpo=Math.max(.1,parseFloat($("#trailExposure")?.value)||0);
const trailGap=Math.max(0,parseFloat($("#trailGap")?.value)||0);
const trailSec=(deg/15.041067)*3600;
const trailCycle=trailExpo+trailGap;
const trailFrames=Math.ceil(trailSec/trailCycle);
if($("#trailResult"))$("#trailResult").textContent=`${deg.toFixed(0)}° → 約 ${formatDuration(trailSec)} / 約 ${trailFrames.toLocaleString()}枚`;

const mins=Math.max(.1,parseFloat($("#totalShootMinutes")?.value)||0);
const totalExpo=Math.max(.1,parseFloat($("#totalExposure")?.value)||0);
const totalGap=Math.max(0,parseFloat($("#totalGap")?.value)||0);
const cycle=totalExpo+totalGap;
const possible=Math.max(1,Math.floor((mins*60+totalGap)/cycle));
if($("#totalFramesResult"))$("#totalFramesResult").textContent=`約 ${possible.toLocaleString()}枚（1サイクル ${cycle.toFixed(1)}秒）`;

const n=Math.max(1,Math.floor(parseFloat($("#stackFrames")?.value)||1));
const target=Math.max(1,parseFloat($("#stackTarget")?.value)||1);
const gain=Math.sqrt(n);
const need=Math.ceil(target*target);
if($("#stackResult"))$("#stackResult").textContent=`${n}枚 → 理論S/N 約${gain.toFixed(2)}倍 / ${target.toFixed(1)}倍を目指すなら約${need}枚`;
}


function allSkyCanvasToAltAz(x,y,cx,cy,R){
/* ズーム・パンを戻して全天図の基準座標へ */
const bx=cx+(x-cx-SKY_PAN_X)/SKY_ZOOM;
const by=cy+(y-cy-SKY_PAN_Y)/SKY_ZOOM;
const dx=bx-cx;
const dy=by-cy;
const r=Math.hypot(dx,dy);

if(r>R*1.04)return null;

const alt=Math.max(0,Math.min(90,90-(r/R)*90));
let az=Math.atan2(-dx,-dy)/D2R;
az=((az%360)+360)%360;
return{alt,az};
}

function pointInPolygon(x,y,poly){
if(!Array.isArray(poly)||poly.length<3)return false;
let inside=false;
for(let i=0,j=poly.length-1;i<poly.length;j=i++){
const xi=poly[i].x, yi=poly[i].y;
const xj=poly[j].x, yj=poly[j].y;
const hit=((yi>y)!==(yj>y)) &&
(x < (xj-xi)*(y-yi)/((yj-yi)||1e-9)+xi);
if(hit)inside=!inside;
}
return inside;
}

function viewTangentPoint(centerAlt,centerAz,tx,ty){
const forward=horizontalUnitVector(centerAlt,centerAz);
const az=centerAz*D2R;
const right={x:Math.cos(az),y:-Math.sin(az),z:0};
const up={
x:right.y*forward.z-right.z*forward.y,
y:right.z*forward.x-right.x*forward.z,
z:right.x*forward.y-right.y*forward.x
};

let x=forward.x+tx*right.x+ty*up.x;
let y=forward.y+tx*right.y+ty*up.y;
let z=forward.z+tx*right.z+ty*up.z;
const n=Math.hypot(x,y,z)||1;
x/=n;y/=n;z/=n;

const alt=Math.asin(Math.max(-1,Math.min(1,z)))/D2R;
let azDeg=Math.atan2(x,y)/D2R;
azDeg=((azDeg%360)+360)%360;
return{alt,az:azDeg};
}

function drawFovEdge(ctx,centerAlt,centerAz,cx,cy,R,edgeFn,collectPoints=null){
ctx.beginPath();
let prev=null;
for(let i=0;i<=40;i++){
const t=i/40;
const q=edgeFn(t);
const aa=viewTangentPoint(centerAlt,centerAz,q.tx,q.ty);

/* 地平モードでは写野枠のみ地平線下も描く */
const p=skyProjectAltAz(
aa.alt,aa.az,cx,cy,R,
isHorizonProjection()
);

if(!p){prev=null;continue;}

if(Array.isArray(collectPoints))collectPoints.push({x:p.x,y:p.y});

if(prev&&Math.hypot(p.x-prev.x,p.y-prev.y)<R*0.55){
ctx.lineTo(p.x,p.y);
}else{
ctx.moveTo(p.x,p.y);
}
prev=p;
}
ctx.stroke();
}

function drawCameraFov(ctx,cx,cy,R){
const f=getFovSettings();
const tx=Math.tan((f.hFov/2)*D2R);
const ty=Math.tan((f.vFov/2)*D2R);

/* 全天では独立した写野中心、地平では現在の視線中心 */
const centerAlt=isHorizonProjection()?SKY_PERSPECTIVE_ALT:SKY_FOV_ALLSKY_ALT;
const centerAz=isHorizonProjection()?SKY_PERSPECTIVE_AZ:SKY_FOV_ALLSKY_AZ;

ctx.save();
ctx.strokeStyle="rgba(244,114,182,.95)";
ctx.lineWidth=1.7;
ctx.setLineDash([7,4]);

const hitPoly=[];
drawFovEdge(ctx,centerAlt,centerAz,cx,cy,R,t=>({tx:-tx+2*tx*t,ty:-ty}),hitPoly);
drawFovEdge(ctx,centerAlt,centerAz,cx,cy,R,t=>({tx:tx,ty:-ty+2*ty*t}),hitPoly);
drawFovEdge(ctx,centerAlt,centerAz,cx,cy,R,t=>({tx:tx-2*tx*t,ty:ty}),hitPoly);
drawFovEdge(ctx,centerAlt,centerAz,cx,cy,R,t=>({tx:-tx,ty:ty-2*ty*t}),hitPoly);

/* 全天モードでのみ、写野内ドラッグ用の輪郭を保存 */
SKY_FOV_HIT_POLYGON=SKY_PROJECTION==="allsky"?hitPoly:[];

ctx.setLineDash([]);
const center=skyProjectAltAz(
centerAlt,centerAz,cx,cy,R,
isHorizonProjection()
);
if(center){
ctx.strokeStyle="rgba(244,114,182,.8)";
ctx.lineWidth=1;
ctx.beginPath();
ctx.moveTo(center.x-5,center.y);ctx.lineTo(center.x+5,center.y);
ctx.moveTo(center.x,center.y-5);ctx.lineTo(center.x,center.y+5);
ctx.stroke();


}
ctx.restore();
}

function drawPerspectiveGuide(ctx,cx,cy,R){
const {halfX,halfY}=getSkyPerspectiveViewport(R);
const left=cx-halfX,right=cx+halfX,top=cy-halfY,bottom=cy+halfY;
ctx.save();
ctx.strokeStyle="#35506b";ctx.lineWidth=1.2;
ctx.strokeRect(left,top,right-left,bottom-top);

/* 高度線 */
[0,15,30,45,60,75].forEach(alt=>{
ctx.beginPath();
let started=false;
for(let d=-180;d<=180;d+=2){
const az=SKY_PERSPECTIVE_AZ+d;
const p=skyProjectAltAz(alt,az,cx,cy,R);
if(!p){started=false;continue;}
if(!started){ctx.moveTo(p.x,p.y);started=true;}else ctx.lineTo(p.x,p.y);
}
ctx.strokeStyle=alt===0?"#466784":"#16283a";
ctx.lineWidth=alt===0?1.4:1;
ctx.stroke();
});

/* 方位線 */
for(let az=0;az<360;az+=30){
ctx.beginPath();
let started=false;
for(let alt=0;alt<=90;alt+=2){
const p=skyProjectAltAz(alt,az,cx,cy,R);
if(!p){started=false;continue;}
if(!started){ctx.moveTo(p.x,p.y);started=true;}else ctx.lineTo(p.x,p.y);
}
const diff=((az-SKY_PERSPECTIVE_AZ+540)%360)-180;
ctx.strokeStyle=Math.abs(diff)<1?"#20364c":"#16283a";
ctx.lineWidth=Math.abs(diff)<1?1.1:1;
ctx.stroke();
}

/* 方位ラベル */
ctx.fillStyle="#8ab4d4";
ctx.font="bold 12px sans-serif";
ctx.textAlign="center";
ctx.textBaseline="middle";
for(let az=0;az<360;az+=30){
const p=skyProjectAltAz(2,az,cx,cy,R);
if(!p)continue;
const diff=((az-SKY_PERSPECTIVE_AZ+540)%360)-180;
if(Math.abs(diff)>70)continue;
ctx.fillText(azToDir(az),p.x,Math.min(bottom-9,p.y-9));
}

ctx.fillStyle="#4a6a8a";
ctx.font="10px sans-serif";
[15,30,45,60].forEach(alt=>{
const p=skyProjectAltAz(alt,SKY_PERSPECTIVE_AZ,cx,cy,R);
if(p)ctx.fillText(`${alt}°`,p.x+18,p.y);
});
ctx.restore();
}



/* =====================================================
星の鳥 — GitHub Static DB
===================================================== */
function hoshinotoriName(r){return r?.full_name||r?.name||r?.designation||r?.spkid||"名称不明";}

function hoshinotoriReadIndexCache(){
try{
const raw=localStorage.getItem(HOSHINOTORI_INDEX_CACHE_KEY);
if(!raw)return null;
const data=JSON.parse(raw);
if(!data||!Array.isArray(data.records))return null;
return data;
}catch(e){return null;}
}
function hoshinotoriSaveIndexCache(doc){
try{localStorage.setItem(HOSHINOTORI_INDEX_CACHE_KEY,JSON.stringify({savedAt:new Date().toISOString(),records:doc.records||[]}));}
catch(e){console.warn("星の鳥 index cache save failed",e);}
}
async function loadHoshinotoriIndex(force=false){
const status=$("#htStatus");
if(status)status.textContent="星の鳥の検索インデックスを読み込んでいます…";
if(!force){
const cached=hoshinotoriReadIndexCache();
if(cached?.records?.length){
HOSHINOTORI_INDEX=cached.records;HOSHINOTORI_INDEX_LOADED=true;
if(status){status.className="smallbody-status";status.textContent=`星の鳥：${HOSHINOTORI_INDEX.length.toLocaleString()}彗星を検索できます（ブラウザ保存データ）。`;}
return HOSHINOTORI_INDEX;
}}
if(!navigator.onLine){
if(status){status.className="smallbody-status error";status.textContent="星の鳥の初回読み込みにはオンライン接続が必要です。";}
return[];
}
try{
const res=await fetch(HOSHINOTORI_INDEX_URL,{cache:force?"no-store":"default"});
if(!res.ok)throw new Error(`星の鳥 HTTP ${res.status}`);
const doc=await res.json();
const records=Array.isArray(doc)?doc:(doc.records||[]);
if(!Array.isArray(records)||!records.length)throw new Error("星の鳥の検索インデックスが空です。");
HOSHINOTORI_INDEX=records;HOSHINOTORI_INDEX_LOADED=true;hoshinotoriSaveIndexCache({records});
if(status){status.className="smallbody-status";status.textContent=`星の鳥：${records.length.toLocaleString()}彗星を検索できます。`;}
return records;
}catch(e){
const cached=hoshinotoriReadIndexCache();
if(cached?.records?.length){
HOSHINOTORI_INDEX=cached.records;HOSHINOTORI_INDEX_LOADED=true;
if(status){status.className="smallbody-status";status.textContent=`星の鳥の更新取得に失敗したため、保存済み${HOSHINOTORI_INDEX.length.toLocaleString()}件を使用します。`;}
return HOSHINOTORI_INDEX;
}
if(status){status.className="smallbody-status error";status.textContent=`星の鳥を読み込めませんでした：${String(e.message||e)}`;}
return[];
}}
function searchHoshinotori(query){
const q=String(query||"").trim().toLowerCase();if(!q)return[];
const tokens=q.split(/\s+/).filter(Boolean);
return HOSHINOTORI_INDEX.map(r=>{
const hay=[r.spkid,r.designation,r.full_name,r.name,r.prefix,r.kind,r.class,r.orbit_id].filter(Boolean).join(" ").toLowerCase();
let score=0;
for(const t of tokens){
if(!hay.includes(t))return null;
if(String(r.spkid||"").toLowerCase()===t)score+=20;
if(String(r.designation||"").toLowerCase()===t)score+=18;
if(String(r.name||"").toLowerCase()===t)score+=16;
if(String(r.full_name||"").toLowerCase().startsWith(t))score+=10;
score+=2;
}
return{r,score};
}).filter(Boolean).sort((a,b)=>b.score-a.score||hoshinotoriName(a.r).localeCompare(hoshinotoriName(b.r))).slice(0,30).map(x=>x.r);
}
function renderHoshinotoriResults(){
const box=$("#htSearchResults");if(!box)return;
const q=$("#htCometSearch")?.value||"";
if(!q.trim()){box.innerHTML="";return;}
if(!HOSHINOTORI_INDEX_LOADED){box.innerHTML='<div class="smallbody-status">星の鳥を読み込み中です…</div>';return;}
const hits=searchHoshinotori(q);
if(!hits.length){box.innerHTML='<div class="smallbody-status">該当する彗星が見つかりませんでした。</div>';return;}
box.innerHTML="";
hits.forEach(r=>{
const row=document.createElement("div");row.className="ht-result";
row.innerHTML=`<div><div class="ht-result-name">${escapeHTML(hoshinotoriName(r))}</div><div class="ht-result-meta">${r.designation?`符号 ${escapeHTML(r.designation)} / `:""}SPK-ID ${escapeHTML(r.spkid||"—")}${r.orbit_id?` / 軌道解 ${escapeHTML(r.orbit_id)}`:""}${r.detail?` / 詳細JSONあり`:" / 基本データ"}</div></div><button type="button">Nicoleに読み込む</button>`;
row.querySelector("button").addEventListener("click",()=>selectHoshinotoriComet(r));box.appendChild(row);
});
}
async function fetchHoshinotoriShard(bucket){
if(HOSHINOTORI_SHARD_CACHE.has(bucket))return HOSHINOTORI_SHARD_CACHE.get(bucket);
const res=await fetch(`${HOSHINOTORI_BASE}/data/catalog/${encodeURIComponent(bucket)}.json`);
if(!res.ok)throw new Error(`基本軌道JSON HTTP ${res.status}`);
const doc=await res.json();const records=Array.isArray(doc)?doc:(doc.records||[]);
HOSHINOTORI_SHARD_CACHE.set(bucket,records);return records;
}
async function fetchHoshinotoriBasic(indexRecord){
const bucket=indexRecord.bucket;if(!bucket)throw new Error("星の鳥のbucket情報がありません。");
const records=await fetchHoshinotoriShard(bucket);
const r=records.find(x=>String(x.spkid)===String(indexRecord.spkid));
if(!r)throw new Error("基本軌道レコードが見つかりません。");return r;
}
async function fetchHoshinotoriDetail(indexRecord){
const url=`${HOSHINOTORI_BASE}/data/comets/${encodeURIComponent(indexRecord.bucket)}/${encodeURIComponent(indexRecord.spkid)}.json`;
const res=await fetch(url,{cache:"no-store"});if(res.status===404)return null;
if(!res.ok)throw new Error(`詳細JSON HTTP ${res.status}`);return await res.json();
}
function normalizeDeg(v){v=Number(v)||0;return((v%360)+360)%360;}
function solveKeplerElliptic(M,e){
M=((M+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;let E=M;
for(let j=0;j<24;j++){const f=E-e*Math.sin(E)-M,fp=1-e*Math.cos(E),d=f/fp;E-=d;if(Math.abs(d)<1e-12)break;}return E;
}
function solveKeplerHyperbolic(M,e){
let H=Math.asinh(M/Math.max(e,1.000001));
for(let j=0;j<30;j++){const f=e*Math.sinh(H)-H-M,fp=e*Math.cosh(H)-1,d=f/fp;H-=d;if(Math.abs(d)<1e-12)break;}return H;
}
function solveBarker(W){
let D=Math.cbrt(3*W);
for(let j=0;j<30;j++){const f=D+D*D*D/3-W,fp=1+D*D,d=f/fp;D-=d;if(Math.abs(d)<1e-12)break;}return D;
}
function earthHeliocentricEcliptic(jd){
const d=jd-2451543.5,w=(282.9404+4.70935e-5*d)*D2R,e=0.016709-1.151e-9*d,M=normalizeDeg(356.0470+0.9856002585*d)*D2R;
const E=solveKeplerElliptic(M,e),xv=Math.cos(E)-e,yv=Math.sqrt(1-e*e)*Math.sin(E),v=Math.atan2(yv,xv),r=Math.hypot(xv,yv),lon=v+w;
return{x:-r*Math.cos(lon),y:-r*Math.sin(lon),z:0};
}
function cometHeliocentricEcliptic(rec,jd){
const e=Number(rec.e),q=Number(rec.q),tp=Number(rec.tp),inc=Number(rec.i)*D2R,Om=Number(rec.om)*D2R,w=Number(rec.w)*D2R;
if(![e,q,tp,inc,Om,w].every(Number.isFinite)||q<=0)return null;
const k=0.01720209895,dt=jd-tp;let v,r;
if(Math.abs(e-1)<1e-4){
const W=k*dt/Math.sqrt(2*q*q*q),D=solveBarker(W);v=2*Math.atan(D);r=q*(1+D*D);
}else if(e<1){
const a=q/(1-e);if(!(a>0))return null;const n=k/Math.pow(a,1.5),M=n*dt,E=solveKeplerElliptic(M,e);
v=2*Math.atan2(Math.sqrt(1+e)*Math.sin(E/2),Math.sqrt(1-e)*Math.cos(E/2));r=a*(1-e*Math.cos(E));
}else{
const a=q/(e-1);if(!(a>0))return null;const n=k/Math.pow(a,1.5),M=n*dt,H=solveKeplerHyperbolic(M,e);
v=2*Math.atan2(Math.sqrt(e+1)*Math.sinh(H/2),Math.sqrt(e-1)*Math.cosh(H/2));r=a*(e*Math.cosh(H)-1);
}
const u=w+v,cu=Math.cos(u),su=Math.sin(u),cO=Math.cos(Om),sO=Math.sin(Om),ci=Math.cos(inc),si=Math.sin(inc);
return{x:r*(cO*cu-sO*su*ci),y:r*(sO*cu+cO*su*ci),z:r*(su*si),r};
}
function hoshinotoriLocalPosition(rec,date){
if(!rec||!date||isNaN(date))return null;const jd=toJD(date),c=cometHeliocentricEcliptic(rec,jd);if(!c)return null;
const earth=earthHeliocentricEcliptic(jd),x=c.x-earth.x,y=c.y-earth.y,z=c.z-earth.z,dist=Math.hypot(x,y,z),T=(jd-2451545.0)/36525,eps=(23.439291-0.0130042*T)*D2R;
const xe=x,ye=y*Math.cos(eps)-z*Math.sin(eps),ze=y*Math.sin(eps)+z*Math.cos(eps),ra=normalizeDeg(Math.atan2(ye,xe)*R2D),dec=Math.atan2(ze,Math.hypot(xe,ye))*R2D;
const lat=parseFloat($("#inLat")?.value),lon=parseFloat($("#inLon")?.value),aa=(Number.isFinite(lat)&&Number.isFinite(lon))?altAz(ra,dec,lat,lon,date):null;
return{ra,dec,dist,r:c.r,alt:aa?.alt,az:aa?.az};
}
function hoshinotoriDetailSummary(detail){
if(!detail)return"星の鳥に詳細JSONはまだ保存されていません。";
const orbit=detail.orbit||{},cov=orbit.covariance?"共分散あり":"共分散なし",model=Array.isArray(orbit.model_parameters)?orbit.model_parameters.length:0,phys=Array.isArray(detail.physical_parameters)?detail.physical_parameters.length:0;
return`詳細JSON取得済み / ${cov} / モデルパラメータ ${model}件 / 物理パラメータ ${phys}件`;
}
async function selectHoshinotoriComet(indexRecord){
const status=$("#htStatus"),mode=$("#htPrecisionMode")?.value||"simple";
if(status){status.className="smallbody-status";status.textContent=`${hoshinotoriName(indexRecord)} を星の鳥から読み込んでいます…`;}
try{
const basic=await fetchHoshinotoriBasic(indexRecord);let detail=null;if(mode==="precise")detail=await fetchHoshinotoriDetail(indexRecord);
HOSHINOTORI_SELECTED={index:indexRecord,basic,detail,mode};renderHoshinotoriSelected();$("#skyShowSmallBodies").checked=true;
if(mode==="jpl"){
if(status)status.textContent="星の鳥から対象を特定しました。JPL Horizons高精度軌道を取得します…";
await loadCometTrack({name:hoshinotoriName(indexRecord),designation:indexRecord.designation||basic.pdes||"",spkid:indexRecord.spkid});
}else{
if(status){status.className="smallbody-status";status.textContent=mode==="precise"
?`${hoshinotoriName(indexRecord)}：${hoshinotoriDetailSummary(detail)}。位置は現在、軌道要素の二体近似で計算しています。`
:`${hoshinotoriName(indexRecord)}：基本軌道要素をNicoleへ読み込みました。二体近似で位置を計算します。`;}
renderSkyChart();
}
}catch(e){if(status){status.className="smallbody-status error";status.textContent=`星の鳥からの読み込みに失敗しました：${String(e.message||e)}`;}}
}
function renderHoshinotoriSelected(){
const wrap=$("#htSelected");if(!wrap||!HOSHINOTORI_SELECTED)return;
const {index,basic,detail,mode}=HOSHINOTORI_SELECTED,date=getSkyViewDate(),p=hoshinotoriLocalPosition(basic,date);
$("#htSelectedTitle").textContent=`☄️ ${hoshinotoriName(index)}`;
const modeLabel=mode==="precise"?"精密計算":mode==="jpl"?"JPL高精度":"簡易計算";
const values=[["モード",modeLabel],["SPK-ID",index.spkid||"—"],["符号",index.designation||basic.pdes||"—"],["軌道解",basic.orbit_id||index.orbit_id||"—"],
["離心率 e",Number.isFinite(Number(basic.e))?Number(basic.e).toFixed(8):"—"],["近日点距離 q",Number.isFinite(Number(basic.q))?`${Number(basic.q).toFixed(6)} AU`:"—"],
["RA",p?`${(p.ra/15).toFixed(4)} h`:"—"],["Dec",p?`${p.dec.toFixed(3)}°`:"—"],["高度",p&&Number.isFinite(p.alt)?`${p.alt.toFixed(1)}°`:"—"],
["方位",p&&Number.isFinite(p.az)?`${azToDir(p.az)} ${p.az.toFixed(0)}°`:"—"],["地球距離",p?`${p.dist.toFixed(3)} AU`:"—"],["詳細",detail?hoshinotoriDetailSummary(detail):(index.detail?"未取得":"星の鳥未保存")]];
$("#htSelectedGrid").innerHTML=values.map(([k,v])=>`<div class="ht-kv"><div class="ht-k">${escapeHTML(k)}</div><div class="ht-v">${escapeHTML(String(v))}</div></div>`).join("");wrap.style.display="block";
}
function drawHoshinotoriSelected(ctx,lat,lon,date,cx,cy,R){
if(!HOSHINOTORI_SELECTED||HOSHINOTORI_SELECTED.mode==="jpl")return;
const p0=hoshinotoriLocalPosition(HOSHINOTORI_SELECTED.basic,date);if(!p0)return;const p=skyProject(p0.ra,p0.dec,lat,lon,date,cx,cy,R);if(!p)return;
ctx.save();ctx.strokeStyle="#67e8f9";ctx.lineWidth=1.8;ctx.beginPath();ctx.arc(p.x,p.y,4.2,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(p.x+4,p.y-4);ctx.lineTo(p.x+9,p.y-9);ctx.stroke();
ctx.fillStyle="#9debf5";ctx.font="9px sans-serif";ctx.textAlign="left";ctx.fillText(hoshinotoriName(HOSHINOTORI_SELECTED.index),p.x+7,p.y-5);ctx.restore();
SKY_MAP_HITS.push({x:p.x,y:p.y,r:10,kind:"comet",name:hoshinotoriName(HOSHINOTORI_SELECTED.index),mag:NaN,alt:p.alt,az:p.az,type:"彗星（星の鳥）"});
}

function formatCometTrackDate(value){
const d=value instanceof Date?value:new Date(value);
if(!d||isNaN(d))return "—";
const p=n=>String(n).padStart(2,"0");
return `${d.getFullYear()}/${p(d.getMonth()+1)}/${p(d.getDate())}`;
}

function setCometTrackStatus(message,color="#7f9db5"){
const el=$("#cometTrackStatus");
if(!el)return;
el.textContent=message;
el.style.color=color;
}

function clearCometTrack(){
COMET_TRACK_DATA=null;
const cb=$("#skyShowCometTrack");
const clear=$("#clearCometTrack");
if(cb){cb.checked=false;cb.disabled=true;}
if(clear)clear.disabled=true;
setCometTrackStatus("彗星カードの「長期軌道を追う」から選択できます。");
renderSkyChart();
}

async function loadCometTrack(comet){
if(!comet||!comet.name)return;
if(COMET_TRACK_LOADING)return;

const lat=parseFloat($("#inLat").value);
const lon=parseFloat($("#inLon").value);
const altM=parseFloat($("#inAlt").value||"0");
const dtVal=$("#inDatetime").value;
const center=dtVal?new Date(dtVal):null;

if(!Number.isFinite(lat)||!Number.isFinite(lon)||!center||isNaN(center)){
alert("観測日時・緯度・経度を設定してください。");
return;
}
COMET_TRACK_LOADING=true;
setCometTrackStatus(navigator.onLine
?`${comet.name} の長期軌道（30日前〜90日後）をJPL Horizonsから取得中…`
:`${comet.name} の保存済み長期軌道を確認中…`,"#8ab4d4");

document.querySelectorAll(".comet-track-btn").forEach(b=>b.disabled=true);

try{
const p=new URLSearchParams({
designation:comet.designation||"",
query:comet.name,
lat:String(lat),
lon:String(lon),
alt_m:String(Number.isFinite(altM)?altM:0),
center:center.toISOString(),
before_days:"30",
after_days:"90",
step_days:"1"
});

const res=await fetch(`${COMET_TRACK_ENDPOINT}?${p.toString()}`,{cache:"no-store"});
if(!res.ok){
if(res.status===404){
throw new Error("Cloudflare Worker の /comet-track が未実装です。");
}
throw new Error(`Nicole API HTTP ${res.status}`);
}
const data=await res.json();
if(!data.ok)throw new Error(data.error||"JPL Horizons軌道取得に失敗しました。");
if(!Array.isArray(data.points)||data.points.length<3){
throw new Error("軌道点を十分に取得できませんでした。");
}

COMET_TRACK_DATA={
name:data.object?.name||comet.name,
designation:data.object?.designation||comet.designation||"",
pdes:data.object?.pdes||"",
spkid:data.object?.spkid||"",
centerTime:data.centerTime||center.toISOString(),
startTime:data.startTime||data.points[0].time,
stopTime:data.stopTime||data.points[data.points.length-1].time,
lat,lon,altM:Number.isFinite(altM)?altM:0,
points:data.points
};

const cb=$("#skyShowCometTrack");
const clear=$("#clearCometTrack");
if(cb){cb.disabled=false;cb.checked=true;}
if(clear)clear.disabled=false;

/* 長期の移動経路を見やすくするため、まず全天図へ */
SKY_PROJECTION="allsky";
SKY_ZOOM=1;
SKY_PAN_X=0;
SKY_PAN_Y=0;
updateSkyProjectionUI();
switchResultTab("skymap");

setCometTrackStatus(
`${COMET_TRACK_DATA.name}：${formatCometTrackDate(COMET_TRACK_DATA.startTime)}〜${formatCometTrackDate(COMET_TRACK_DATA.stopTime)}（1日刻み）`,
"#9debf5"
);

requestAnimationFrame(()=>{
renderSkyChart();
$("#skyMapCanvas")?.scrollIntoView({behavior:"smooth",block:"center"});
});
}catch(err){
setCometTrackStatus(String(err.message||err),"#f87171");
}finally{
COMET_TRACK_LOADING=false;
document.querySelectorAll(".comet-track-btn").forEach(b=>b.disabled=false);
}
}


function interpolateRaDeg(a,b,t){
a=Number(a);b=Number(b);
if(!Number.isFinite(a)||!Number.isFinite(b))return NaN;
let d=((b-a+540)%360)-180;
return (a+d*t+360)%360;
}

function interpolateEphemeris(points,date){
if(!Array.isArray(points)||!points.length||!date||isNaN(date))return null;
const target=date.getTime();
const valid=points
.map(p=>({...p,_t:new Date(p.time).getTime()}))
.filter(p=>Number.isFinite(p._t)&&Number.isFinite(Number(p.ra))&&Number.isFinite(Number(p.dec)))
.sort((a,b)=>a._t-b._t);

if(!valid.length||target<valid[0]._t||target>valid[valid.length-1]._t)return null;
let lo=0,hi=valid.length-1;
while(hi-lo>1){
const m=(lo+hi)>>1;
if(valid[m]._t<=target)lo=m;else hi=m;
}
const a=valid[lo],b=valid[Math.min(hi,valid.length-1)];
if(a._t===b._t)return{ra:Number(a.ra),dec:Number(a.dec),time:new Date(a._t)};
const f=(target-a._t)/(b._t-a._t);
return{
ra:interpolateRaDeg(a.ra,b.ra,f),
dec:Number(a.dec)+(Number(b.dec)-Number(a.dec))*f,
time:new Date(target)
};
}

function drawCometTrack(ctx,lat,lon,viewDate,cx,cy,R){
if(!COMET_TRACK_DATA||!Array.isArray(COMET_TRACK_DATA.points))return;

const viewMs=viewDate.getTime();
const projected=[];

COMET_TRACK_DATA.points.forEach((pt,index)=>{
const ra=Number(pt.ra),dec=Number(pt.dec);
if(!Number.isFinite(ra)||!Number.isFinite(dec))return;
const p=skyProject(ra,dec,lat,lon,viewDate,cx,cy,R);
if(!p)return;
const t=new Date(pt.time).getTime();
projected.push({...p,time:pt.time,t,index});
});

if(projected.length){
function strokeSide(points,isFuture){
ctx.save();
ctx.strokeStyle=isFuture?"rgba(103,232,249,.95)":"rgba(103,232,249,.42)";
ctx.lineWidth=isFuture?2:1.4;
ctx.setLineDash(isFuture?[]:[5,5]);
ctx.beginPath();
let prev=null;
for(const p of points){
if(prev&&Math.hypot(p.x-prev.x,p.y-prev.y)<R*0.55)ctx.lineTo(p.x,p.y);
else ctx.moveTo(p.x,p.y);
prev=p;
}
ctx.stroke();
ctx.restore();
}
strokeSide(projected.filter(p=>p.t<=viewMs),false);
strokeSide(projected.filter(p=>p.t>=viewMs),true);

ctx.save();
ctx.font="9px sans-serif";
ctx.textAlign="left";
ctx.textBaseline="bottom";
projected.forEach((p,i)=>{
if(i%5!==0)return;
ctx.fillStyle="#9debf5";
ctx.beginPath();ctx.arc(p.x,p.y,2,0,Math.PI*2);ctx.fill();
ctx.fillText(formatCometTrackDate(p.time).slice(5),p.x+5,p.y-4);
});
ctx.restore();
}

/* 現在の星図日時における選択彗星の位置を補間 */
const current=interpolateEphemeris(COMET_TRACK_DATA.points,viewDate);
if(!current)return;
const cp=skyProject(current.ra,current.dec,lat,lon,viewDate,cx,cy,R);
if(!cp)return;

ctx.save();
ctx.strokeStyle="#ffffff";
ctx.lineWidth=1.5;
ctx.beginPath();ctx.arc(cp.x,cp.y,6,0,Math.PI*2);ctx.stroke();
ctx.strokeStyle="#67e8f9";
ctx.beginPath();ctx.arc(cp.x,cp.y,3.2,0,Math.PI*2);ctx.stroke();
ctx.beginPath();ctx.moveTo(cp.x+4,cp.y-4);ctx.lineTo(cp.x+8,cp.y-8);ctx.stroke();
ctx.restore();

SKY_MAP_HITS.push({
x:cp.x,y:cp.y,r:11,
kind:"comet-track",
name:COMET_TRACK_DATA.name,
type:"彗星長期軌道",
alt:cp.alt,az:cp.az
});
}

function clamp01(v){return Math.max(0,Math.min(1,v));}
function smoothstep01(v){
const t=clamp01(v);
return t*t*(3-2*t);
}
function smootherstep01(v){
const t=clamp01(v);
return t*t*t*(t*(t*6-15)+10);
}
function lerp(a,b,t){return a+(b-a)*clamp01(t);}
function mixRGB(c1,c2,t){
const k=smootherstep01(t);
return[
Math.round(lerp(c1[0],c2[0],k)),
Math.round(lerp(c1[1],c2[1],k)),
Math.round(lerp(c1[2],c2[2],k))
];
}
function rgbCss(c){return`rgb(${c[0]},${c[1]},${c[2]})`;}

function daylightBaseColor(sunAltDeg){
/*
  太陽高度に対する空の基調色。
  -18°以下は天文夜として完全な夜色。
  -18〜-12°は天文薄明だが、-18°へ近づくほど急速に夜色へ収束。
  -12〜-6° 航海薄明
  -6〜0° 市民薄明
  0°以上 昼光
*/
const night=[3,7,17];
const astroEdge=[4,10,22];
const nautical=[10,29,55];
const civil=[25,68,108];
const day=[61,132,184];

if(sunAltDeg<=-18)return night;
if(sunAltDeg<=-12){
/* 天文薄明は「まだ青い空」ではなく、夜色にかなり近い */
return mixRGB(night,astroEdge,(sunAltDeg+18)/6);
}
if(sunAltDeg<=-6)return mixRGB(astroEdge,nautical,(sunAltDeg+12)/6);
if(sunAltDeg<=0)return mixRGB(nautical,civil,(sunAltDeg+6)/6);
return mixRGB(civil,day,Math.min(1,sunAltDeg/12));
}

function daylightLimitingMagnitude(sunAltDeg,userMaxMag){
/*
  視覚表現用の簡易モデル。
  昼でも1等級以上（mag <= 1.0）の星は残す。
  -18°以下ではユーザー設定上限まで完全復帰。
*/
if(sunAltDeg<=-18)return userMaxMag;

let skyLimit;
if(sunAltDeg<=-12){
  /* -18°で完全復帰、-12°でも4等級前後まで */
  skyLimit=lerp(userMaxMag,4.0,smootherstep01((sunAltDeg+18)/6));
}else if(sunAltDeg<=-6){
  skyLimit=lerp(4.0,2.2,smootherstep01((sunAltDeg+12)/6));
}else if(sunAltDeg<=0){
  skyLimit=lerp(2.2,1.0,smootherstep01((sunAltDeg+6)/6));
}else{
  /* 日中も1等級以上は残す */
  skyLimit=1.0;
}
return Math.min(userMaxMag,skyLimit);
}

function daylightTwilightStrength(sunAltDeg){
/* -18°以下は昼光効果ゼロ。境界をなめらかに立ち上げる。 */
if(sunAltDeg<=-18)return 0;
if(sunAltDeg>=0)return 1;
return smootherstep01((sunAltDeg+18)/18);
}

function beginDaylightSkyClip(ctx,cx,cy,R){
ctx.save();

if(SKY_PROJECTION==="allsky"){
  const mapCx=cx+SKY_PAN_X;
  const mapCy=cy+SKY_PAN_Y;
  const mapR=R*SKY_ZOOM;
  ctx.beginPath();
  ctx.arc(mapCx,mapCy,mapR,0,Math.PI*2);
  ctx.clip();
  return;
}

/* 地平星図：地平線より上だけを昼光対象にする */
const {halfX:viewportHalfX,halfY:viewportHalfY}=getSkyPerspectiveViewport(R);
const left=cx-viewportHalfX;
const right=cx+viewportHalfX;
const top=cy-viewportHalfY;
const bottom=cy+viewportHalfY;

const horizon=[];
for(let d=-120;d<=120;d+=1){
  const az=SKY_PERSPECTIVE_AZ+d;
  const p=skyProjectAltAz(0,az,cx,cy,R,false);
  if(p && Number.isFinite(p.x) && Number.isFinite(p.y)){
    horizon.push({x:p.x,y:p.y});
  }
}

if(horizon.length>=2){
  horizon.sort((a,b)=>a.x-b.x);
  ctx.beginPath();
  ctx.moveTo(left,top);
  ctx.lineTo(right,top);
  ctx.lineTo(right,Math.min(bottom,horizon[horizon.length-1].y));
  for(let i=horizon.length-1;i>=0;i--){
    ctx.lineTo(horizon[i].x,horizon[i].y);
  }
  ctx.lineTo(left,Math.min(bottom,horizon[0].y));
  ctx.closePath();
  ctx.clip();
}else{
  /*
    地平線が画面外なら、視線中心高度で判定。
    高く向いている場合は画面全域が空。
    低く向いていて地平線が画面外上側なら昼光を描かない。
  */
  if(SKY_PERSPECTIVE_ALT>=(getActivePerspectiveFov()/2)){
    ctx.beginPath();
    ctx.rect(left,top,right-left,bottom-top);
    ctx.clip();
  }else{
    ctx.beginPath();
    ctx.rect(0,0,0,0);
    ctx.clip();
  }
}
}

function endDaylightSkyClip(ctx){ctx.restore();}

function drawDaylightBackground(ctx,lat,lon,date,w,h,cx,cy,R){
const sun=sunPosition(toJD(date));
const aa=altAz(sun.ra,sun.dec,lat,lon,date);
const enabled=$("#skyShowDaylight")?.checked;

/* まず円外・地面側を常に従来の夜色で塗る */
ctx.fillStyle="#030711";
ctx.fillRect(0,0,w,h);

if(!enabled){
return{sunAlt:aa.alt,sunAz:aa.az};
}

const strength=daylightTwilightStrength(aa.alt);
if(strength<=0){
return{sunAlt:aa.alt,sunAz:aa.az};
}

beginDaylightSkyClip(ctx,cx,cy,R);

const base=daylightBaseColor(aa.alt);
ctx.fillStyle=rgbCss(base);
ctx.fillRect(0,0,w,h);

/*
  太陽方向の局所的な明るさ。
  日没後は太陽高度が下がるほど急速に弱め、
  -18°で完全に消える。
*/
let gx=cx,gy=cy;
if(SKY_PROJECTION==="allsky"){
  const edgeR=R*SKY_ZOOM;
  const a=aa.az*D2R;
  gx=cx+SKY_PAN_X-edgeR*Math.sin(a);
  gy=cy+SKY_PAN_Y-edgeR*Math.cos(a);
}else{
  const d=((aa.az-SKY_PERSPECTIVE_AZ+540)%360)-180;
  const horizontal=Math.max(-1.25,Math.min(1.25,d/(getActivePerspectiveFov()/2)));
  const {halfX}=getSkyPerspectiveViewport(R);
  gx=cx+horizontal*halfX*.78;
  const altVisual=Math.max(-18,Math.min(40,aa.alt));
  gy=cy+R*.78-(altVisual/58)*R*1.15;
}

const sunAbove=Math.max(0,Math.min(1,(aa.alt+1)/13));
const twilightWarm=Math.max(0,1-Math.abs(aa.alt+3)/15);
const alpha=(0.04+0.26*strength)*(0.35+0.65*Math.max(sunAbove,twilightWarm));
const radius=Math.max(w,h)*(aa.alt>0?.72:.58);

const grad=ctx.createRadialGradient(gx,gy,0,gx,gy,radius);
if(aa.alt<=3){
  grad.addColorStop(0,`rgba(255,181,103,${alpha.toFixed(3)})`);
  grad.addColorStop(.28,`rgba(255,205,143,${(alpha*.55).toFixed(3)})`);
  grad.addColorStop(.68,`rgba(132,171,207,${(alpha*.16).toFixed(3)})`);
  grad.addColorStop(1,"rgba(80,130,180,0)");
}else{
  grad.addColorStop(0,`rgba(151,210,255,${alpha.toFixed(3)})`);
  grad.addColorStop(.42,`rgba(113,184,239,${(alpha*.48).toFixed(3)})`);
  grad.addColorStop(1,"rgba(90,170,230,0)");
}
ctx.fillStyle=grad;
ctx.fillRect(0,0,w,h);

endDaylightSkyClip(ctx);
return{sunAlt:aa.alt,sunAz:aa.az};
}

function moonPhaseBrightnessRelative(date){
/*
  月相による明るさは輝面率に比例しない。
  月の位相角 alpha を使った簡易的な月面位相関数で、
  満月を1とした相対光量を求める。
*/
const ph=moonPhaseInfo(date);
const k=clamp01((ph.moonIllum||0)/100);
const alpha=Math.acos(Math.max(-1,Math.min(1,2*k-1)))*R2D;
const deltaMag=0.026*Math.abs(alpha)+4e-9*Math.pow(alpha,4);
const relative=Math.pow(10,-0.4*deltaMag);
return{relative,illum:ph.moonIllum,age:ph.moonAge,phase:ph.moonPhase,alpha};
}

function drawMoonlightBackground(ctx,lat,lon,date,w,h,cx,cy,R,sunAltDeg){
const moon=moonPosition(toJD(date));
const aa=altAz(moon.ra,moon.dec,lat,lon,date);
const enabled=$("#skyShowMoonlight")?.checked;
const phase=moonPhaseBrightnessRelative(date);

const darkness=sunAltDeg<=-18
?1
:sunAltDeg>=-6
?0
:smootherstep01((-sunAltDeg-6)/12);

const altitudeFactor=aa.alt>0
?Math.pow(Math.max(0,Math.sin(aa.alt*D2R)),0.65)
:0;

const intensity=phase.relative*altitudeFactor*darkness;

if(!enabled||intensity<=0.001){
return{
enabled:false,ra:moon.ra,dec:moon.dec,
alt:aa.alt,az:aa.az,intensity:0,
illum:phase.illum,relative:phase.relative
};
}

/* 昼光と同様に、全天円内／地平線より上だけに月光を描く */
beginDaylightSkyClip(ctx,cx,cy,R);

let gx=cx,gy=cy;
const moonPoint=skyProject(moon.ra,moon.dec,lat,lon,date,cx,cy,R);
if(moonPoint){
gx=moonPoint.x;gy=moonPoint.y;
}else if(SKY_PROJECTION==="allsky"){
const edgeR=R*SKY_ZOOM;
const a=aa.az*D2R;
gx=cx+SKY_PAN_X-edgeR*.92*Math.sin(a);
gy=cy+SKY_PAN_Y-edgeR*.92*Math.cos(a);
}else{
const d=((aa.az-SKY_PERSPECTIVE_AZ+540)%360)-180;
const {halfX}=getSkyPerspectiveViewport(R);
gx=cx+Math.max(-1.2,Math.min(1.2,d/(getActivePerspectiveFov()/2)))*halfX*.74;
gy=cy;
}

/*
  満月・高高度で最大。
  月の近傍ほど強く、離れるにつれて緩やかに減衰。
*/
const alpha=Math.min(.26,.035+.23*intensity);
const radius=Math.max(w,h)*(.34+.24*Math.sqrt(intensity));
const grad=ctx.createRadialGradient(gx,gy,0,gx,gy,radius);
grad.addColorStop(0,`rgba(205,220,238,${alpha.toFixed(3)})`);
grad.addColorStop(.18,`rgba(177,202,226,${(alpha*.68).toFixed(3)})`);
grad.addColorStop(.48,`rgba(121,157,195,${(alpha*.30).toFixed(3)})`);
grad.addColorStop(1,"rgba(80,115,160,0)");
ctx.fillStyle=grad;
ctx.fillRect(0,0,w,h);

endDaylightSkyClip(ctx);

return{
enabled:true,ra:moon.ra,dec:moon.dec,
alt:aa.alt,az:aa.az,intensity,
illum:phase.illum,relative:phase.relative
};
}

function moonlightMagnitudeLimit(baseLimit,starRa,starDec,moonState){
if(!moonState||!moonState.enabled||moonState.intensity<=0)return baseLimit;
const sep=angularSeparationRaDec(starRa,starDec,moonState.ra,moonState.dec);

/*
  満月近傍ほど暗い星を隠す。
  遠く離れた空にも弱い全体的な明るさを残す。
*/
const local=0.55+2.55*Math.exp(-sep/34);
const penalty=moonState.intensity*local;
return Math.max(1.0,baseLimit-penalty);
}

function drawSkyAsterisms(ctx,pointMap){
if(!$("#skyShowAsterisms")?.checked)return;
ctx.save();
ctx.strokeStyle="rgba(103,232,249,.80)";
ctx.fillStyle="rgba(165,243,252,.94)";
ctx.lineWidth=1.35;
ctx.setLineDash([5,4]);
ctx.font="10px sans-serif";
ctx.textAlign="center";
ctx.textBaseline="bottom";

SKY_ASTERISMS.forEach(ast=>{
const visible=[];
ast.lines.forEach(([a,b])=>{
const p1=pointMap[a],p2=pointMap[b];
if(!p1||!p2)return;
visible.push(p1,p2);
ctx.beginPath();
ctx.moveTo(p1.x,p1.y);
ctx.lineTo(p2.x,p2.y);
ctx.stroke();
});
if(visible.length>=2){
const uniq=[];
const seen=new Set();
visible.forEach(p=>{
const key=`${Math.round(p.x*10)}:${Math.round(p.y*10)}`;
if(!seen.has(key)){seen.add(key);uniq.push(p);}
});
const x=uniq.reduce((s,p)=>s+p.x,0)/uniq.length;
const y=uniq.reduce((s,p)=>s+p.y,0)/uniq.length;
ctx.setLineDash([]);
ctx.fillText(ast.name,x,y-5);
ctx.setLineDash([5,4]);
}
});
ctx.restore();
}

function renderSkyChart(interactive=false){
const canvas=$("#skyMapCanvas");
if(!canvas)return;
const lat=Number.isFinite(currentLat)?currentLat:parseFloat($("#inLat").value);
const lon=Number.isFinite(currentLon)?currentLon:parseFloat($("#inLon").value);
const dtVal=$("#inDatetime").value;
const date=getSkyViewDate();
if(!Number.isFinite(lat)||!Number.isFinite(lon)||!date||isNaN(date))return;

const fullscreen=skyPanelIsFullscreen();
const wrap=canvas.parentElement;
const cameraMode=SKY_PROJECTION==="camera";
const horizonFullscreen=fullscreen&&isHorizonProjection();

let cssWidth,cssHeight;
if(cameraMode&&!fullscreen){
  cssWidth=Math.max(280,Math.floor((wrap.clientWidth||760)));
  const portrait=window.innerHeight>window.innerWidth;
  const cameraAspect=portrait?3/4:4/3;
  cssHeight=Math.round(cssWidth/cameraAspect);
  const maxH=Math.max(360,Math.floor(window.innerHeight*0.72));
  if(cssHeight>maxH){cssHeight=maxH;cssWidth=Math.round(cssHeight*cameraAspect);}
}else if(horizonFullscreen){
  /* 地平／追尾の全画面は縦横とも利用可能領域いっぱいを使う。
     投影アスペクト比で実視野を広げるため、画像の引き伸ばしにはならない。 */
  cssWidth=Math.max(280,Math.floor(wrap.clientWidth||window.innerWidth));
  cssHeight=Math.max(280,Math.floor(wrap.clientHeight||window.innerHeight));
}else{
  const fsMax=Math.max(320,Math.min(window.innerWidth-8,window.innerHeight-8));
  const maxCanvas=fullscreen?fsMax:760;
  const parentPad=fullscreen?0:16;
  const cssSize=Math.max(320,Math.min(maxCanvas,wrap.clientWidth-parentPad||maxCanvas));
  cssWidth=cssSize;
  cssHeight=cssSize;
}

wrap.classList.toggle("sky-full-horizon",horizonFullscreen);
wrap.classList.toggle("sky-full-tracking",fullscreen&&(SKY_PROJECTION==="tracking"||SKY_PROJECTION==="camera"));
wrap.classList.toggle("camera-active",cameraMode&&!!SKY_CAMERA_STREAM);
SKY_PERSPECTIVE_ASPECT=isHorizonProjection()?cssWidth/cssHeight:1;

const dpr=Math.min(window.devicePixelRatio||1,2);
canvas.style.width=cssWidth+"px";
canvas.style.height=cssHeight+"px";
canvas.width=Math.round(cssWidth*dpr);
canvas.height=Math.round(cssHeight*dpr);
const ctx=canvas.getContext("2d");ctx.setTransform(dpr,0,0,dpr,0,0);
const w=cssWidth,h=cssHeight,cx=w/2,cy=h/2,R=Math.min(w,h)*0.44;
SKY_MAP_HITS=[];
ctx.clearRect(0,0,w,h);
let daylightState,moonlightState;
if(cameraMode){
  const sun=sunPosition(toJD(date));
  const sunAA=altAz(sun.ra,sun.dec,lat,lon,date);
  daylightState={sunAlt:sunAA.alt,sunAz:sunAA.az};
  const moon=moonPosition(toJD(date));
  const moonAA=altAz(moon.ra,moon.dec,lat,lon,date);
  moonlightState={enabled:false,ra:moon.ra,dec:moon.dec,alt:moonAA.alt,az:moonAA.az,intensity:0,illum:0,relative:0};
}else{
  daylightState=drawDaylightBackground(ctx,lat,lon,date,w,h,cx,cy,R);
  moonlightState=drawMoonlightBackground(ctx,lat,lon,date,w,h,cx,cy,R,daylightState.sunAlt);
}

if(isHorizonProjection()){
drawPerspectiveGuide(ctx,cx,cy,R);
}else{
const mapCx=cx+SKY_PAN_X,mapCy=cy+SKY_PAN_Y,mapR=R*SKY_ZOOM;
ctx.strokeStyle="#35506b";ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(mapCx,mapCy,mapR,0,Math.PI*2);ctx.stroke();
ctx.strokeStyle="#16283a";ctx.lineWidth=1;
[30,60].forEach(alt=>{const rr=mapR*(90-alt)/90;ctx.beginPath();ctx.arc(mapCx,mapCy,rr,0,Math.PI*2);ctx.stroke();});
ctx.strokeStyle="#20364c";ctx.beginPath();ctx.moveTo(mapCx-mapR,mapCy);ctx.lineTo(mapCx+mapR,mapCy);ctx.moveTo(mapCx,mapCy-mapR);ctx.lineTo(mapCx,mapCy+mapR);ctx.stroke();
ctx.fillStyle="#8ab4d4";ctx.font="bold 13px sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";
ctx.fillText("N",mapCx,mapCy-mapR-15);ctx.fillText("E",mapCx-mapR-15,mapCy);ctx.fillText("S",mapCx,mapCy+mapR+15);ctx.fillText("W",mapCx+mapR+15,mapCy);
ctx.fillStyle="#4a6a8a";
ctx.font="10px sans-serif";
ctx.textBaseline="middle";

/* 高度表示：北・東・南・西の各方向に30°刻みで表示 */
[30,60].forEach(alt=>{
  const rr=mapR*(90-alt)/90;
  const label=`${alt}°`;

  /* 北 */
  ctx.textAlign="left";
  ctx.fillText(label,mapCx+4,mapCy-rr);

  /* 東（全天図では左側） */
  ctx.textAlign="center";
  ctx.fillText(label,mapCx-rr,mapCy-8);

  /* 南 */
  ctx.textAlign="left";
  ctx.fillText(label,mapCx+4,mapCy+rr);

  /* 西（全天図では右側） */
  ctx.textAlign="center";
  ctx.fillText(label,mapCx+rr,mapCy-8);
});
}

if($("#skyShowMilkyWay")?.checked){
if(MILKYWAY_OUTLINE_DATA){
drawMilkyWay(ctx,lat,lon,date,cx,cy,R);
}else if(!MILKYWAY_LOADING){
loadMilkyWayOutline();
}
}

const userMaxMag=parseFloat($("#skyMag").value||"5");
const maxMag=$("#skyShowDaylight")?.checked
?daylightLimitingMagnitude(daylightState.sunAlt,Math.max(userMaxMag,1.0))
:userMaxMag;
const pointMap={};
SKY_STARS.forEach(star=>{
const p=skyProject(star.ra,star.dec,lat,lon,date,cx,cy,R);
if(p)pointMap[star.id]=p;
});
Object.values(WESTERN_LINE_STARS).forEach(star=>{
const p=skyProject(star.ra,star.dec,lat,lon,date,cx,cy,R);
if(p)pointMap[star.id]=p;
});
Object.entries(SKY_ASTERISM_STARS).forEach(([id,star])=>{
const p=skyProject(star.ra,star.dec,lat,lon,date,cx,cy,R);
if(p)pointMap[id]=p;
});

if($("#skyShowLines").checked){
SKY_CONSTELLATION_LINES.forEach(c=>{
const focusedConst=getConstellationById(SKY_FOCUS_CONSTELLATION_ID);
const isFocused=focusedConst&&(
c.name===focusedConst.name||
String(c.abbr||"").toLowerCase()===String(focusedConst.abbr||"").toLowerCase()
);
ctx.strokeStyle=isFocused?"rgba(255,213,79,.95)":"rgba(90,150,205,.48)";
ctx.lineWidth=isFocused?2.6:1;

c.lines.forEach(([a,b])=>{
const p1=pointMap[a],p2=pointMap[b];
if(!p1||!p2)return;
ctx.beginPath();
ctx.moveTo(p1.x,p1.y);
ctx.lineTo(p2.x,p2.y);
ctx.stroke();
});
});
}

drawSkyAsterisms(ctx,pointMap);

SKY_STARS.forEach(star=>{const localMaxMag=moonlightMagnitudeLimit(maxMag,star.ra,star.dec,moonlightState);if(star.mag>localMaxMag)return;const p=pointMap[star.id];if(!p)return;const rad=Math.max(.7,3.4-(star.mag+1.5)*.45);ctx.fillStyle=star.id==="Betelgeuse"||star.id==="Antares"||star.id==="Aldebaran"?"#ffc0a0":"#f4f7ff";ctx.beginPath();ctx.arc(p.x,p.y,rad,0,Math.PI*2);ctx.fill();SKY_MAP_HITS.push({x:p.x,y:p.y,r:Math.max(7,rad+4),kind:"star",starId:star.id,objectId:ALL_OBJECTS.some(o=>o.id===star.id)?star.id:null,name:star.name,mag:star.mag,alt:p.alt,az:p.az});if(star.mag<=1.3){ctx.fillStyle="#a9bfd3";ctx.font="9px sans-serif";ctx.textAlign="left";ctx.fillText(star.name,p.x+5,p.y-4);}});

/* 僕しか知らない星：隠しモード中だけ表示 */
if(PLANETARIUM_MODE_ACTIVE && $("#skyShowMyStars")?.checked){
  MY_STARS.forEach(star=>{
    const p=skyProject(star.ra,star.dec,lat,lon,date,cx,cy,R);
    if(!p)return;
    const mag=Number.isFinite(Number(star.mag))?Number(star.mag):5;
    const rad=Math.max(1.2,4.2-(mag+1.5)*.38);
    ctx.save();
    ctx.shadowColor="rgba(255,218,140,.65)";
    ctx.shadowBlur=8;
    ctx.fillStyle="#ffe7b0";
    ctx.beginPath();
    ctx.arc(p.x,p.y,rad,0,Math.PI*2);
    ctx.fill();
    ctx.shadowBlur=0;
    ctx.fillStyle="#f4dba2";
    ctx.font="10px sans-serif";
    ctx.textAlign="left";
    ctx.fillText(star.name,p.x+6,p.y-5);
    ctx.restore();
    SKY_MAP_HITS.push({
      x:p.x,y:p.y,r:Math.max(9,rad+5),
      kind:"custom-star",customStarId:star.id,
      name:star.name,mag,ra:star.ra,dec:star.dec,
      alt:p.alt,az:p.az,type:"僕しか知らない星"
    });
  });
}

/* Western星座線を構成するHIP恒星も表示 */
Object.values(WESTERN_LINE_STARS).forEach(star=>{
const localMaxMag=moonlightMagnitudeLimit(maxMag,star.ra,star.dec,moonlightState);
if(star.mag>localMaxMag)return;
const p=pointMap[star.id];
if(!p)return;
const rad=Math.max(.55,3.0-(star.mag+1.5)*.38);
ctx.fillStyle="rgba(225,235,255,.86)";
ctx.beginPath();
ctx.arc(p.x,p.y,rad,0,Math.PI*2);
ctx.fill();
SKY_MAP_HITS.push({x:p.x,y:p.y,r:Math.max(5,rad+3),kind:"star",starId:star.id,name:`HIP ${star.hip}`,mag:star.mag,alt:p.alt,az:p.az});
});

if($("#skyShowNames").checked){
ctx.fillStyle="rgba(126,184,232,.78)";ctx.font="10px sans-serif";ctx.textAlign="center";
getSkyConstellationLabels().forEach(c=>{const p=skyProject(c.ra,c.dec,lat,lon,date,cx,cy,R);if(!p)return;ctx.fillText(c.name,p.x,p.y);SKY_MAP_HITS.push({x:p.x,y:p.y,r:12,kind:"constellation",constellationId:c.id,name:c.name,alt:p.alt,az:p.az});});
}

if($("#skyShowSun")?.checked&&$("#skyShowEcliptic")?.checked){
drawEcliptic(ctx,lat,lon,date,cx,cy,R);
}
if($("#skyShowMoon")?.checked&&$("#skyShowLunarPath")?.checked){
drawLunarPath(ctx,lat,lon,date,cx,cy,R);
}

if($("#skyShowDSO").checked){
ALL_OBJECTS.filter(o=>o.type!=="planet"&&o.ra!==undefined&&o.dec!==undefined&&(o.messier_number||(o.mag||99)<=6.5)&&!SKY_STAR_MAP[o.id]).forEach(o=>{const p=skyProject(o.ra,o.dec,lat,lon,date,cx,cy,R);if(!p)return;ctx.strokeStyle="#4ade80";ctx.lineWidth=1;ctx.strokeRect(p.x-2.5,p.y-2.5,5,5);ctx.fillStyle="#76d99a";ctx.font="9px sans-serif";ctx.textAlign="left";ctx.fillText(o.id,p.x+5,p.y+3);SKY_MAP_HITS.push({x:p.x,y:p.y,r:8,kind:"object",objectId:o.id,name:o.name||o.id,mag:o.mag,alt:p.alt,az:p.az,type:TYPE_LABEL[o.type]||o.type});});
}

if($("#skyShowCometTrack")?.checked&&COMET_TRACK_DATA){
drawCometTrack(ctx,lat,lon,date,cx,cy,R);
}

if($("#skyShowMeteors").checked&&METEOR_SHOWERS.length){
METEOR_SHOWERS.filter(s=>isMeteorActiveOnDate(s,date)).forEach(s=>{
const p=skyProject(s.ra,s.dec,lat,lon,date,cx,cy,R);
if(!p)return;
ctx.strokeStyle="#a78bfa";ctx.lineWidth=1.5;
ctx.beginPath();
ctx.moveTo(p.x-6,p.y);ctx.lineTo(p.x+6,p.y);
ctx.moveTo(p.x,p.y-6);ctx.lineTo(p.x,p.y+6);
ctx.stroke();
ctx.beginPath();ctx.arc(p.x,p.y,4,0,Math.PI*2);ctx.stroke();
ctx.fillStyle="#c4b5fd";ctx.font="9px sans-serif";ctx.textAlign="left";
ctx.fillText(s.code||s.name,p.x+8,p.y-6);
SKY_MAP_HITS.push({
x:p.x,y:p.y,r:10,
kind:"meteor",
name:s.nameJa||s.name,
nameEn:s.name,
type:"流星群放射点",
alt:p.alt,az:p.az,
zhr:s.zhr,
code:s.code,
velocityKms:s.velocityKms,
parent:s.parent,
peakLabel:s.peakLabel,
note:s.note
});
});
}

if($("#skyShowSmallBodies").checked&&HOSHINOTORI_SELECTED){
drawHoshinotoriSelected(ctx,lat,lon,date,cx,cy,R);
}
if($("#skyShowSmallBodies").checked&&NIGHT_COMETS.length&&nightCometLocationMatches(lat,lon)){
NIGHT_COMETS.forEach(o=>{
if(COMET_TRACK_DATA&&COMET_TRACK_DATA.designation&&o.designation===COMET_TRACK_DATA.designation)return;
const pos=interpolateEphemeris(o.points,date);
if(!pos)return;
const p=skyProject(pos.ra,pos.dec,lat,lon,date,cx,cy,R);
if(!p)return;

ctx.strokeStyle="#67e8f9";
ctx.lineWidth=1.4;
ctx.beginPath();ctx.arc(p.x,p.y,3,0,Math.PI*2);ctx.stroke();
ctx.beginPath();ctx.moveTo(p.x+3,p.y-3);ctx.lineTo(p.x+7,p.y-7);ctx.stroke();

if(Number(o.mag)<=12){
ctx.fillStyle="#9debf5";
ctx.font="9px sans-serif";
ctx.textAlign="left";
ctx.fillText(o.name,p.x+6,p.y-4);
}

SKY_MAP_HITS.push({
x:p.x,y:p.y,r:9,
kind:"comet",
name:o.name,mag:Number(o.mag),alt:p.alt,az:p.az,
type:"彗星"
});
});
}

if($("#skyShowSun")?.checked){
const sun=sunPosition(toJD(date));
const p=skyProject(sun.ra,sun.dec,lat,lon,date,cx,cy,R);
if(p){
ctx.fillStyle="#ffd54f";ctx.beginPath();ctx.arc(p.x,p.y,5,0,Math.PI*2);ctx.fill();
ctx.font="10px sans-serif";ctx.textAlign="left";ctx.fillText("太陽",p.x+7,p.y);
SKY_MAP_HITS.push({x:p.x,y:p.y,r:10,kind:"solar",name:"太陽",alt:p.alt,az:p.az});
}
}

if($("#skyShowMoon")?.checked){
const moon=moonPosition(toJD(date));
const p=skyProject(moon.ra,moon.dec,lat,lon,date,cx,cy,R);
if(p){
ctx.fillStyle="#e8e8f0";ctx.beginPath();ctx.arc(p.x,p.y,5,0,Math.PI*2);ctx.fill();
ctx.font="10px sans-serif";ctx.textAlign="left";ctx.fillText("月",p.x+7,p.y);
SKY_MAP_HITS.push({x:p.x,y:p.y,r:10,kind:"solar",name:"月",alt:p.alt,az:p.az});
}
}

if($("#skyShowPlanets")?.checked){
DSO_DB.filter(o=>o.type==="planet").forEach(o=>{
const q=planetRaDec(o.planet,toJD(date));
const p=skyProject(q.ra,q.dec,lat,lon,date,cx,cy,R);
if(!p)return;
ctx.strokeStyle="#c084fc";ctx.lineWidth=1.4;
ctx.beginPath();ctx.moveTo(p.x,p.y-4);ctx.lineTo(p.x+4,p.y);ctx.lineTo(p.x,p.y+4);ctx.lineTo(p.x-4,p.y);ctx.closePath();ctx.stroke();
ctx.fillStyle="#d8b4fe";ctx.font="10px sans-serif";ctx.textAlign="left";ctx.fillText(o.name,p.x+7,p.y);
SKY_MAP_HITS.push({x:p.x,y:p.y,r:10,kind:"planet",objectId:o.id,name:o.name,mag:q.mag,alt:p.alt,az:p.az});
});
}

drawFocusedObject(ctx,lat,lon,date,cx,cy,R);

if($("#skyShowFov")?.checked){
drawCameraFov(ctx,cx,cy,R);
}

/* 追尾ナビは他の星図オーバーレイより前面に描画する */
drawTrackingTargetGuide(ctx,lat,lon,date,cx,cy,R,w,h);

if(!interactive){
const pad=n=>String(n).padStart(2,"0");
const place=$("#inPlace").value||"指定場所";
const projectionInfo=isHorizonProjection()
?(SKY_PROJECTION==="tracking"
  ?`追尾 / ${azToDir(SKY_PERSPECTIVE_AZ)}向き・仰角${Math.round(SKY_PERSPECTIVE_ALT)}°`
  :SKY_PROJECTION==="camera"
  ?`カメラ / ${azToDir(SKY_PERSPECTIVE_AZ)}向き・仰角${Math.round(SKY_PERSPECTIVE_ALT)}°`
  :`地平 / ${azToDir(SKY_PERSPECTIVE_AZ)}向き・仰角${Math.round(SKY_PERSPECTIVE_ALT)}°`)
:"全天 / 北が上・東が左";
const daylightLabel=$("#skyShowDaylight")?.checked
?daylightState.sunAlt>=0?"昼"
:daylightState.sunAlt>=-6?"市民薄明"
:daylightState.sunAlt>=-12?"航海薄明"
:daylightState.sunAlt>=-18?"天文薄明"
:"夜"
:"昼光OFF";
$("#skyMapInfo").textContent=`${date.getFullYear()}年${pad(date.getMonth()+1)}月${pad(date.getDate())}日 ${pad(date.getHours())}:${pad(date.getMinutes())} / ${place} / ${projectionInfo} / ${daylightLabel}`;
if($("#skyViewTimeLabel")){
const offset=getSkyTimeOffsetHours();
const sign=offset>0?"+":"";
$("#skyViewTimeLabel").textContent=`表示：${formatSkyViewDate(date)}（${sign}${offset.toFixed(2).replace(/\.00$/,"")}h）`;
}
if($("#skyZoomLabel"))$("#skyZoomLabel").textContent=`${Math.round(SKY_ZOOM*100)}%`;
if($("#skyZoomReset"))$("#skyZoomReset").textContent=`${Math.round(SKY_ZOOM*100)}%`;
syncSkyTimeSlider();
renderWeatherForDate(date);
updateAstroPhotoTools();
}
}

function constellationsForSkyHit(hit){
const ids=new Set();
if(hit?.constellationId)ids.add(hit.constellationId);

if(hit?.starId){
const mapped=SKY_STAR_CONSTELLATION_MAP[hit.starId];
if(mapped){
const c=constellationByAbbr(mapped);
if(c)ids.add(c.id);
}
SKY_CONSTELLATION_LINES.forEach(line=>{
if(line.lines.some(pair=>pair[0]===hit.starId||pair[1]===hit.starId)){
const c=constellationByAbbr(line.abbr);
if(c)ids.add(c.id);
}
});
}
return [...ids].map(id=>getConstellationById(id)).filter(Boolean);
}

function objectForSkyHit(hit){
if(hit?.objectId){
return currentResults.find(o=>o.id===hit.objectId)||ALL_OBJECTS.find(o=>o.id===hit.objectId)||null;
}
if(hit?.starId){
return currentResults.find(o=>o.id===hit.starId)||ALL_OBJECTS.find(o=>o.id===hit.starId)||null;
}
return null;
}

function activateResultTab(name){
switchResultTab(name);
scrollToResultSection(name);
}

function goToObjectCard(objectId){
const obj=currentResults.find(o=>o.id===objectId)||ALL_OBJECTS.find(o=>o.id===objectId);
if(!obj)return;
activateResultTab("cards");
activeFilter="all";
const allBtn=$("#filterBar")?.querySelector('[data-f="all"]');
if(allBtn){
$("#filterBar").querySelectorAll(".filter-btn").forEach(x=>x.classList.remove("on"));
allBtn.classList.add("on");
}
renderCards(currentResults);
setTimeout(()=>{
const card=document.querySelector(`.obj-card[data-object-id="${CSS.escape(objectId)}"]`);
if(card){
card.scrollIntoView({behavior:"smooth",block:"center"});
card.classList.add("active");
showDetail(currentResults.find(o=>o.id===objectId)||obj,card);
}else{
showDetail(obj,null);
}
},40);
}

function goToConstellationCard(constellationId){
const c=getConstellationById(constellationId);
if(!c)return;
activateResultTab("constellations");
$("#constSearch").value=c.name;
renderConstellations(currentDate?currentDate.getMonth()+1:null,c.name);
setTimeout(()=>{
const card=document.querySelector(`.const-card[data-constellation-id="${CSS.escape(constellationId)}"]`);
if(card)card.scrollIntoView({behavior:"smooth",block:"center"});
else $("#rtab-constellations")?.scrollIntoView({behavior:"smooth",block:"start"});
},40);
}


function openConstellationDetailModal(constellationId){
  const c=CONSTELLATIONS_ENRICHED.find(x=>x.id===constellationId);
  const modal=$("#constellationDetailModal");
  const title=$("#constellationDetailTitle");
  const body=$("#constellationDetailBody");
  if(!c||!modal||!title||!body)return;

  const co=CONST_COORD[c.id];
  let altText="—";
  if(co && Number.isFinite(currentLat) && Number.isFinite(currentLon) && currentDate instanceof Date && !isNaN(currentDate)){
    altText=`${altitude(co[0],co[1],currentLat,currentLon,currentDate).toFixed(1)}°`;
  }

  title.textContent=`${c.name} ${c.en?`（${c.en}）`:""}`;
  body.innerHTML=`
    <div class="object-popup-badges">
      <span class="season-badge ${SEASON_CLASS[c.season]||""}">${SEASON_LABEL[c.season]||c.season||"—"}</span>
      <span class="season-badge" style="background:#0a1e2e;color:#9ccbf0">現在の高度 ${altText}</span>
    </div>
    <table class="object-popup-table">
      <tr><th>略符</th><td>${escapeHTML(c.abbr||"—")}</td></tr>
      <tr><th>主な星</th><td>${escapeHTML(c.stars||"—")}</td></tr>
    </table>
    <div class="constellation-modal-section">
      <h4>🔬 科学</h4>
      <p>${c.science||"—"}</p>
    </div>
    <div class="constellation-modal-section">
      <h4>🏛 神話・由来</h4>
      <p>${c.myth||"—"}</p>
    </div>
  `;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden","false");
  document.body.classList.add("detail-popup-open");
  $("#closeConstellationDetail")?.focus();
}
function closeConstellationDetailModal(){
  const modal=$("#constellationDetailModal");
  if(!modal)return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden","true");
  if(!$("#detailPopupModal")?.classList.contains("open")){
    document.body.classList.remove("detail-popup-open");
  }
}
function appendSkyHitActions(info,hit){
const obj=objectForSkyHit(hit);
const consts=constellationsForSkyHit(hit);
if(!obj&&!consts.length)return;

const actions=document.createElement("div");
actions.className="skymap-object-actions";

if(obj){
const detailBtn=document.createElement("button");
detailBtn.type="button";
detailBtn.textContent="詳しく見る";
detailBtn.addEventListener("click",()=>showDetail(obj,null));
actions.appendChild(detailBtn);

const trackBtn=document.createElement("button");
trackBtn.type="button";
trackBtn.textContent="📱 追尾で探す";
trackBtn.addEventListener("click",async()=>{
  focusObjectOnSky(obj);
  await enableSkyTrackingMode();
});
actions.appendChild(trackBtn);
}

consts.slice(0,2).forEach(c=>{
const btn=document.createElement("button");
btn.type="button";
btn.textContent=`${c.name}を見る`;
btn.addEventListener("click",()=>openConstellationDetailModal(c.id));
actions.appendChild(btn);
});
info.appendChild(actions);
}


function customStarToObject(star){
  const lat=Number.isFinite(currentLat)?currentLat:parseFloat($("#inLat")?.value);
  const lon=Number.isFinite(currentLon)?currentLon:parseFloat($("#inLon")?.value);
  const date=getSkyViewDate();
  let alt="—",az="—",azDir="—";
  if(Number.isFinite(lat)&&Number.isFinite(lon)&&date instanceof Date&&!isNaN(date)){
    const aa=altAz(star.ra,star.dec,lat,lon,date);
    alt=Math.round(aa.alt*10)/10;
    az=Math.round(aa.az*10)/10;
    azDir=azToDir(aa.az);
  }
  const safeStory=star.story
    ? `<div class="story-topic"><h4>解説</h4><p>${escapeHTML(star.story).replace(/\n/g,"<br>")}</p></div>`
    : "";
  return{
    id:star.id,
    name:star.name,
    icon:"✦",
    type:"star",
    cat:star.cat||star.typeLabel||"—",
    ra:star.ra,
    dec:star.dec,
    mag:Number(star.mag),
    magVal:Number(star.mag),
    dist:star.dist||"—",
    distStr:star.dist||"—",
    size:star.size||"—",
    scope:star.scope||"—",
    difficulty:star.difficulty||3,
    highlight:star.highlight||"",
    story:safeStory,
    alt,az,azDir
  };
}

function showSkyMapHit(hit){
const info=$("#skyMapObjectInfo");
if(!info)return;
if(!hit){info.textContent="この位置には選択できる天体がありません。";return;}

/* 星図で選択した対象も「探す対象」として保持する。
   対応する天体カード／星座カードへの導線は下のアクションに表示する。 */
const hitObj=objectForSkyHit(hit);
const hitConsts=constellationsForSkyHit(hit);
if(hitObj){SKY_FOCUS_OBJECT_ID=hitObj.id||hitObj.name;SKY_FOCUS_CONSTELLATION_ID=null;}
else if(hit.constellationId){SKY_FOCUS_CONSTELLATION_ID=hit.constellationId;SKY_FOCUS_OBJECT_ID=null;}
else if(hitConsts.length){SKY_FOCUS_CONSTELLATION_ID=hitConsts[0].id;SKY_FOCUS_OBJECT_ID=null;}
else{SKY_FOCUS_OBJECT_ID=null;SKY_FOCUS_CONSTELLATION_ID=null;}
updateSkyTrackingTargetStatus();

const alt=Math.round(hit.alt*10)/10;
const az=Math.round(hit.az*10)/10;

if(hit.kind==="custom-star"){
const star=MY_STARS.find(s=>s.id===hit.customStarId);
info.innerHTML=`<b>${escapeHTML(hit.name)}</b><br>高度 ${alt}° / 方位 ${azToDir(az)}（${az}°） / 等級 ${Number(hit.mag).toFixed(1)}<br><span style="color:#f4dba2">${escapeHTML(star?.typeLabel||"僕しか知らない星")}</span>${star?.highlight?`<br><span style="color:#d8c18c">${escapeHTML(star.highlight)}</span>`:""}`;
if(star){
  const actions=document.createElement("div");
  actions.className="skymap-object-actions";
  const detailBtn=document.createElement("button");
  detailBtn.type="button";
  detailBtn.textContent="詳しく見る";
  detailBtn.addEventListener("click",()=>showDetail(customStarToObject(star),null));
  actions.appendChild(detailBtn);
  info.appendChild(actions);
}
return;
}

if(hit.kind==="comet-track"){
info.innerHTML=`<b>${escapeHTML(hit.name)}</b><br>選択した観測日時付近の位置：高度 ${alt}° / 方位 ${azToDir(az)}（${az}°）<br><span style="color:#9debf5">破線＝過去 / 実線＝未来 / 日付は5日ごと</span>`;
return;
}

if(hit.kind==="meteor"){
const en=hit.nameEn&&hit.nameEn!==hit.name?`<br><span style="font-size:10px;color:#8b9db3">${hit.nameEn}</span>`:"";
const zhr=hit.zhr!==null&&hit.zhr!==undefined?`ZHR ${hit.zhr}`:"ZHR —";
const velocity=Number.isFinite(hit.velocityKms)?` / ${hit.velocityKms} km/s`:"";
const parent=hit.parent?`<br>母天体：${hit.parent}`:"";
const peak=hit.peakLabel?`<br>極大：${hit.peakLabel}`:"";
const note=hit.note?`<br><span style="color:#c8dff0">${hit.note}</span>`:"";

info.innerHTML=`
<b>${hit.name}</b>${hit.code?`（${hit.code}）`:""}${en}
<br>放射点：高度 ${alt}° / 方位 ${azToDir(az)}（${az}°）
<br>${zhr}${velocity}${parent}${peak}${note}
`;
return;
}

let extra="";
if(Number.isFinite(hit.mag))extra+=` / 等級 ${Math.round(hit.mag*10)/10}`;
if(hit.type)extra+=` / ${hit.type}`;
info.innerHTML=`<b>${hit.name}</b>${hit.code?`（${hit.code}）`:""}<br>高度 ${alt}° / 方位 ${azToDir(az)}（${az}°）${extra}`;
appendSkyHitActions(info,hit);
}

/* =====================================================
流星群 オンライン取得（IMO → Cloudflare Worker）
===================================================== */
let METEOR_SHOWERS=[];
let meteorLoadedYear=null;

function parseISODateLocal(s){
if(!s)return null;
const [y,m,d]=s.split("-").map(Number);
return new Date(y,m-1,d,12,0,0,0);
}

function isMeteorActiveOnDate(shower,date){
const start=parseISODateLocal(shower.activeStart);
const end=parseISODateLocal(shower.activeEnd);
if(!start||!end)return false;
const t=new Date(date);t.setHours(12,0,0,0);
return t>=start&&t<=end;
}

function meteorLocalInfo(shower,date,lat,lon){
const aa=altAz(shower.ra,shower.dec,lat,lon,date);
const mp=moonPosition(toJD(date));
const maa=altAz(mp.ra,mp.dec,lat,lon,date);
const mi=moonPhaseInfo(date);

let grade="△",gradeClass="ok",reason="放射点高度または月明かりに注意";
if(aa.alt<0){grade="×";gradeClass="poor";reason="放射点が地平線下";}
else if(aa.alt>=45&&(maa.alt<0||mi.moonIllum<=35)){grade="◎";gradeClass="good";reason="放射点が高く月明かりも少ない";}
else if(aa.alt>=25&&(maa.alt<15||mi.moonIllum<=60)){grade="○";gradeClass="good";reason="観測しやすい条件";}
else if(aa.alt<15){grade="△";gradeClass="ok";reason="放射点が低い";}
else if(maa.alt>0&&mi.moonIllum>=70){grade="△";gradeClass="ok";reason="明るい月の影響が大きい";}

return{alt:aa.alt,az:aa.az,moonAlt:maa.alt,moonIllum:mi.moonIllum,grade,gradeClass,reason};
}

function meteorNightTime(baseDate,hour){
const d=new Date(baseDate);
d.setHours(hour,0,0,0);

/* 0〜11時は観測夜の「翌朝」として扱う */
if(hour<12){
d.setDate(d.getDate()+1);
}

return d;
}

function meteorGradeRank(grade){
if(grade==="◎")return 4;
if(grade==="○")return 3;
if(grade==="△")return 2;
return 1;
}

function meteorHourlyForecast(shower,baseDate,lat,lon){
const hours=[21,0,3,5];

const rows=hours.map(hour=>{
const time=meteorNightTime(baseDate,hour);
const info=meteorLocalInfo(shower,time,lat,lon);

return{
hour,
time,
...info
};
});

let best=null;

rows.forEach(row=>{
if(row.alt<0)return;

if(
!best ||
meteorGradeRank(row.grade)>meteorGradeRank(best.grade) ||
(
meteorGradeRank(row.grade)===meteorGradeRank(best.grade) &&
row.alt>best.alt
)
){
best=row;
}
});

return{rows,best};
}

function makeMeteorCard(s,date,lat,lon,active){
const info=meteorLocalInfo(s,date,lat,lon);
const forecast=meteorHourlyForecast(s,date,lat,lon);
const card=document.createElement("div");
card.className=`meteor-card${active?" active":""}`;

const displayName=s.nameJa||s.name||"流星群";
const englishName=s.name||"";
const peakMoon=Number.isFinite(s.peakMoonPercent)?s.peakMoonPercent+"%":"—";

const timeBoxes=forecast.rows.map(row=>{
const label=String(row.hour).padStart(2,"0")+":00";
const isBest=forecast.best&&forecast.best.hour===row.hour;
const moonText=row.moonAlt>0
?`月 ${row.moonAlt.toFixed(0)}°`
:"月 沈";

return`
<div class="meteor-time-box${isBest?" best":""}">
<div class="time">${label}</div>
<div class="grade ${row.gradeClass}">${row.grade}</div>
<div>放射点 ${row.alt.toFixed(0)}°</div>
<div>${moonText}</div>
</div>`;
}).join("");

const bestLabel=forecast.best
?`${String(forecast.best.hour).padStart(2,"0")}:00ごろ`
:"—";

card.innerHTML=`
<div class="meteor-name">${active?"✨":"🌠"} ${displayName}<span class="meteor-code">${s.code||""}</span></div>
${englishName&&englishName!==displayName?`<div class="meteor-en">${englishName}</div>`:""}
<div class="meteor-meta">
活動期間：${s.activityLabel||"—"}<br>
極大：${s.peakLabel||"—"}${s.peakUT?` / ${s.peakUT} UT`:""}<br>
ZHR：${s.zhr??"—"}　速度：${s.velocityKms??"—"} km/s<br>
母天体：${s.parent||"—"}<br>
現在の放射点：高度 ${info.alt.toFixed(1)}° / ${azToDir(info.az)}（${info.az.toFixed(1)}°）<br>
現在の月：輝面 ${info.moonIllum}% / 高度 ${info.moonAlt.toFixed(1)}°<br>
極大夜の月輝面：${peakMoon}
</div>

<div class="meteor-time-title">🕐 今夜の時間帯別観測条件</div>
<div class="meteor-time-grid">${timeBoxes}</div>
<div class="meteor-best-time">★ おすすめ時刻：${bestLabel}</div>

${s.note?`<div class="meteor-note-text">💡 ${s.note}</div>`:""}
<div class="meteor-score ${info.gradeClass}">${info.grade} ${info.reason}</div>`;
return card;
}


function meteorPeakMoonCondition(percent){
if(!Number.isFinite(percent)){
return{grade:"—",gradeClass:"",label:"月条件データなし"};
}
if(percent<=20)return{grade:"◎",gradeClass:"good",label:"月明かりの影響が小さい"};
if(percent<=45)return{grade:"○",gradeClass:"good",label:"比較的良好"};
if(percent<=70)return{grade:"△",gradeClass:"ok",label:"月明かりの影響あり"};
return{grade:"×",gradeClass:"poor",label:"強い月明かりの影響"};
}

function makeMeteorYearCard(s){
const card=document.createElement("div");
card.className="meteor-card";

const displayName=s.nameJa||s.name||"流星群";
const englishName=s.name||"";
const peakMoon=Number.isFinite(s.peakMoonPercent)?s.peakMoonPercent+"%":"—";
const moonCondition=meteorPeakMoonCondition(s.peakMoonPercent);

card.innerHTML=`
<div class="meteor-name">🌠 ${escapeHTML(displayName)}<span class="meteor-code">${escapeHTML(s.code||"")}</span></div>
${englishName&&englishName!==displayName?`<div class="meteor-en">${escapeHTML(englishName)}</div>`:""}
<div class="meteor-meta">
活動期間：${escapeHTML(s.activityLabel||"—")}<br>
極大：${escapeHTML(s.peakLabel||"—")}${s.peakUT?` / ${escapeHTML(s.peakUT)} UT`:""}<br>
ZHR：${escapeHTML(s.zhr??"—")}　速度：${escapeHTML(s.velocityKms??"—")} km/s<br>
母天体：${escapeHTML(s.parent||"—")}<br>
極大夜の月輝面：${escapeHTML(peakMoon)}
</div>
<div class="meteor-score ${moonCondition.gradeClass}">${escapeHTML(moonCondition.grade)} 極大夜の月条件：${escapeHTML(moonCondition.label)}</div>
${s.note?`<div class="meteor-note-text">💡 ${escapeHTML(s.note)}</div>`:""}`;
return card;
}

function renderMeteorShowers(){
const activeGrid=$("#meteorActiveGrid"),yearGrid=$("#meteorYearGrid");
if(!activeGrid||!yearGrid)return;
activeGrid.innerHTML="";yearGrid.innerHTML="";

const lat=parseFloat($("#inLat").value),lon=parseFloat($("#inLon").value);
const date=$("#inDatetime").value?new Date($("#inDatetime").value):new Date();

if(!Number.isFinite(lat)||!Number.isFinite(lon)||isNaN(date)){
activeGrid.innerHTML=`<div style="font-size:11px;color:#6a8aaa">観測日時・緯度・経度を設定してください。</div>`;
return;
}

const active=METEOR_SHOWERS.filter(s=>isMeteorActiveOnDate(s,date)).sort((a,b)=>(b.zhr||0)-(a.zhr||0));
const all=[...METEOR_SHOWERS].sort((a,b)=>String(a.peakStart||a.activeStart).localeCompare(String(b.peakStart||b.activeStart)));

$("#meteorActiveCount").textContent=`（${active.length}件）`;
$("#meteorYearCount").textContent=`（${all.length}件）`;

if(!active.length)activeGrid.innerHTML=`<div style="font-size:11px;color:#6a8aaa;padding:6px">この観測夜に活動中の主要流星群はありません。</div>`;
else active.forEach(s=>activeGrid.appendChild(makeMeteorCard(s,date,lat,lon,true)));

all.forEach(s=>yearGrid.appendChild(makeMeteorYearCard(s)));
}

async function loadMeteorShowers(){
const date=$("#inDatetime").value?new Date($("#inDatetime").value):new Date();
const year=date.getFullYear(),status=$("#meteorStatus");
status.className="meteor-status";
status.textContent=`IMOの${year}年流星群カレンダーを取得しています…`;
$("#meteorRefresh").disabled=true;

try{
const response=await fetch(`https://astro-nicole.hideld12.workers.dev/meteors?year=${year}`,{cache:"no-store"});
if(!response.ok)throw new Error(`Nicole API HTTP ${response.status}`);
const data=await response.json();
if(!data.ok)throw new Error(data.error||"取得失敗");
METEOR_SHOWERS=(data.showers||[]).filter(s=>Number.isFinite(s.ra)&&Number.isFinite(s.dec));
meteorLoadedYear=year;
renderMeteorShowers();
status.className="meteor-status";
status.textContent=`取得完了：${year}年の主要流星群 ${METEOR_SHOWERS.length}件 / 出典 IMO Meteor Shower Calendar`;
if($("#resultPanel-skymap")?.open)renderSkyChart();
}catch(e){
METEOR_SHOWERS=[];meteorLoadedYear=null;
status.className="meteor-status error";
status.innerHTML=`取得に失敗しました。Cloudflare Workerの /meteors を確認してください。<br><span style="font-size:10px">${escapeHTML(String(e.message||e))}</span>`;
}finally{$("#meteorRefresh").disabled=false;}
}

/* =====================================================
今夜の彗星（NASA/JPL SB Observability + Horizons）
===================================================== */
let NIGHT_COMETS=[];
let NIGHT_COMET_META=null;
const NIGHT_COMET_CACHE_KEY="nicole_night_comets_v1";

function formatLocalDateTime(value){
const d=value instanceof Date?value:new Date(value);
if(!d||isNaN(d))return "—";
const p=n=>String(n).padStart(2,"0");
return `${d.getFullYear()}/${p(d.getMonth()+1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function getNightCometCurrentConditions(){
const lat=parseFloat($("#inLat").value);
const lon=parseFloat($("#inLon").value);
const dtVal=$("#inDatetime").value;
const date=dtVal?new Date(dtVal):null;
const altM=parseFloat($("#inAlt").value||"0");
const magLimit=parseFloat($("#sbMagLimit").value||"12");
const place=$("#inPlace").value||"指定場所";
return{lat,lon,altM:Number.isFinite(altM)?altM:0,date,magLimit,place};
}

function saveNightCometCache(){
if(!NIGHT_COMET_META)return false;
try{
localStorage.setItem(NIGHT_COMET_CACHE_KEY,JSON.stringify({
version:1,
meta:NIGHT_COMET_META,
comets:NIGHT_COMETS
}));
return true;
}catch(e){
console.warn("Night comet cache save failed",e);
return false;
}
}

function readNightCometCache(){
try{
const raw=localStorage.getItem(NIGHT_COMET_CACHE_KEY);
if(!raw)return null;
const data=JSON.parse(raw);
if(!data||!Array.isArray(data.comets)||!data.meta)return null;
return data;
}catch(e){
console.warn("Night comet cache read failed",e);
return null;
}
}

function nightCometLocationMatches(lat,lon){
if(!NIGHT_COMET_META||!Number.isFinite(lat)||!Number.isFinite(lon))return false;
const altM=parseFloat($("#inAlt").value||"0");
return Math.abs(Number(NIGHT_COMET_META.lat)-lat)<0.0001
&&Math.abs(Number(NIGHT_COMET_META.lon)-lon)<0.0001
&&Math.abs(Number(NIGHT_COMET_META.altM||0)-(Number.isFinite(altM)?altM:0))<2;
}

function nightCometCacheSummary(meta){
if(!meta)return "";
const night=meta.nightLabel||formatLocalDateTime(meta.observationDate);
return `最終取得：${formatLocalDateTime(meta.fetchedAt)} / 対象夜：${night} / ${meta.place||"指定場所"} / ${meta.magLimit}等まで`;
}

function updateSmallBodyStoredStatus(prefix="保存データを表示中"){
const status=$("#sbStatus");
if(!status)return;
if(!NIGHT_COMET_META){
status.className="smallbody-status";
status.textContent="保存済みデータはありません。「今夜の彗星を取得」を押してください。";
return;
}
status.className="smallbody-status";
status.innerHTML=`${prefix}<br><span style="font-size:10px">${nightCometCacheSummary(NIGHT_COMET_META)}</span>`;
}

function restoreSmallBodyCache(){
const cached=readNightCometCache();
if(!cached){
NIGHT_COMETS=[];
NIGHT_COMET_META=null;
renderSmallBodyCards();
updateSmallBodyStoredStatus();
return false;
}
NIGHT_COMETS=cached.comets;
NIGHT_COMET_META=cached.meta;
renderSmallBodyCards();
updateSmallBodyStoredStatus();
return true;
}

function cometNightStats(comet){
const pts=Array.isArray(comet.points)?comet.points:[];
const lat=Number(NIGHT_COMET_META?.lat);
const lon=Number(NIGHT_COMET_META?.lon);
if(!pts.length||!Number.isFinite(lat)||!Number.isFinite(lon))return null;

const samples=pts.map(pt=>{
const d=new Date(pt.time);
const ra=Number(pt.ra),dec=Number(pt.dec);
if(isNaN(d)||!Number.isFinite(ra)||!Number.isFinite(dec))return null;
const aa=altAz(ra,dec,lat,lon,d);
return{date:d,alt:aa.alt,az:aa.az};
}).filter(Boolean);

const above=samples.filter(s=>s.alt>=0);
if(!above.length)return null;
const max=above.reduce((a,b)=>b.alt>a.alt?b:a,above[0]);
const first=above[0],last=above[above.length-1];
return{
first:first.date,
last:last.date,
maxDate:max.date,
maxAlt:max.alt
};
}

function renderSmallBodyCards(){
const comets=[...NIGHT_COMETS].sort((a,b)=>(Number(a.mag)||99)-(Number(b.mag)||99));
$("#sbCometCount").textContent=`（${comets.length}件）`;
const grid=$("#sbCometGrid");
grid.innerHTML="";

if(!comets.length){
grid.innerHTML=`<div style="font-size:11px;color:#6a8aaa;padding:6px">設定した条件で今夜観測可能な彗星は見つかりませんでした。</div>`;
return;
}

comets.forEach(o=>{
const card=document.createElement("div");
card.className="smallbody-card comet";
const stats=cometNightStats(o);
const mag=Number.isFinite(Number(o.mag))?Number(o.mag).toFixed(1):"—";
const statText=stats
?`地平線上：約 ${formatLocalDateTime(stats.first).slice(11)}〜${formatLocalDateTime(stats.last).slice(11)}<br>最高高度：約 ${stats.maxAlt.toFixed(1)}°（${formatLocalDateTime(stats.maxDate).slice(11)}）`
:"一晩の高度情報を計算できませんでした。";

card.innerHTML=`
<div class="sb-name">☄️ ${escapeHTML(o.name)}</div>
<div class="sb-meta">
推定V等級 ${mag}<br>
${statText}<br>
${o.designation?`符号 ${escapeHTML(o.designation)}`:""}
</div>
<div class="sb-actions">
<button type="button" class="comet-track-btn">長期軌道を追う</button>
</div>
`;
const btn=card.querySelector(".comet-track-btn");
if(btn)btn.addEventListener("click",()=>loadCometTrack(o));
grid.appendChild(card);
});
}

async function loadSmallBodies(){
const {lat,lon,altM,date,magLimit,place}=getNightCometCurrentConditions();
const status=$("#sbStatus");

if(!Number.isFinite(lat)||!Number.isFinite(lon)||!date||isNaN(date)){
status.className="smallbody-status error";
status.textContent="日時・緯度・経度を正しく入力してください。";
return;
}
status.className="smallbody-status";
status.textContent=navigator.onLine
?"JPLから今夜観測可能な彗星と一晩の軌跡を取得しています…"
:"保存済みの今夜の彗星API応答を確認しています…";
$("#sbRefresh").disabled=true;

const previousComets=NIGHT_COMETS.slice();
const previousMeta=NIGHT_COMET_META?{...NIGHT_COMET_META}:null;

try{
const p=new URLSearchParams({
lat:String(lat),
lon:String(lon),
alt_m:String(altM),
obs_time:date.toISOString(),
vmag_max:String(magLimit),
max_comets:"20",
step_minutes:"15"
});
const response=await fetch(`${NIGHT_COMETS_ENDPOINT}?${p.toString()}`,{cache:"no-store"});
if(!response.ok)throw new Error(`Nicole API HTTP ${response.status}`);
const servedFromOfflineCache=response.headers.get("X-Nicole-Offline-Cache")==="1";
const cachedAtHeader=response.headers.get("X-Nicole-Cached-At");
const data=await response.json();
if(!data.ok)throw new Error(data.error||"今夜の彗星を取得できませんでした。");

NIGHT_COMETS=(data.comets||[]).filter(c=>Array.isArray(c.points)&&c.points.length>=2);
NIGHT_COMET_META={
fetchedAt:cachedAtHeader||new Date().toISOString(),
fromOfflineCache:servedFromOfflineCache,
observationDate:date.toISOString(),
nightLabel:data.night?.label||"",
lat,lon,altM,place,magLimit,
source:data.source||"NASA/JPL"
};

renderSmallBodyCards();
const saved=saveNightCometCache();
status.className="smallbody-status";
status.innerHTML=`${servedFromOfflineCache?"保存済みAPI応答：":"取得完了："}今夜の彗星 ${NIGHT_COMETS.length}件${saved?" / ブラウザに保存しました":""}<br><span style="font-size:10px">${nightCometCacheSummary(NIGHT_COMET_META)}</span>`;

if($("#skyShowSmallBodies")?.checked)renderSkyChart();
}catch(error){
NIGHT_COMETS=previousComets;
NIGHT_COMET_META=previousMeta;
renderSmallBodyCards();
status.className="smallbody-status error";
const kept=!!NIGHT_COMET_META;
status.innerHTML=`今夜の彗星の取得に失敗しました。${kept?"前回保存したデータは保持しています。":"ネット接続とCloudflare Workerを確認してください。"}<br><span style="font-size:10px">${escapeHTML(String(error.message||error))}</span>`;
}finally{
$("#sbRefresh").disabled=false;
}
}


function objAltAz(obj,lat,lon,date){
if(obj.type==="planet"){
const p=planetRaDec(obj.planet,toJD(date));
const aa=altAz(p.ra,p.dec,lat,lon,date);
const km=p.dist*149597870.7;
const distStr=km>1e8?(km/1e8).toFixed(2)+"億km":(km/1e4).toFixed(0)+"万km";
return{alt:aa.alt,az:aa.az,magVal:p.mag,distStr};
}else{
const aa=altAz(obj.ra,obj.dec,lat,lon,date);
return{alt:aa.alt,az:aa.az,magVal:obj.mag,distStr:obj.dist};
}
}
function azToDir(az){
const d=["北","北北東","北東","東北東","東","東南東","南東","南南東","南","南南西","南西","西南西","西","西北西","北西","北北西"];
return d[Math.round(az/22.5)%16];
}
function calcDifficulty(obj){
let score=0;
const m=obj.magVal!==undefined?obj.magVal:obj.mag;
if(m<1)score+=0;else if(m<3)score+=1;else if(m<5)score+=2;else if(m<7)score+=3;else if(m<9)score+=4;else score+=5;
const a=obj.alt||0;
if(a>60)score+=0;else if(a>45)score+=1;else if(a>30)score+=2;else if(a>20)score+=3;else score+=4;
const sz=obj.size||"";
const arcMin=parseFloat(sz.replace(/[^0-9.]/g,""))||0;
if(arcMin>30)score+=0;else if(arcMin>10)score+=1;else if(arcMin>3)score+=2;else if(arcMin>1)score+=3;else score+=4;
if(obj.type==="planet")score-=2;else if(obj.type==="star")score-=2;
else if(obj.type==="cluster")score-=1;else if(obj.type==="galaxy")score+=1;
else if(obj.type==="nebula")score+=2;else if(obj.type==="snr")score+=2;
return Math.max(1,Math.min(5,Math.round(score/3)));
}
function diffLabel(d){
const s=["","★☆☆☆☆","★★☆☆☆","★★★☆☆","★★★★☆","★★★★★"];
const t=["","簡単","やや易","普通","やや難","難しい"];
return{stars:s[d],text:t[d]};
}
function calcObjects(lat,lon,date,minAlt,maxMag){
const month=date.getMonth()+1;
const seen=new Set();const results=[];
ALL_OBJECTS.forEach(obj=>{
if(seen.has(obj.id))return;seen.add(obj.id);
if(obj.type!=="planet"&&obj.months&&!obj.months.includes(month))return;
const r=objAltAz(obj,lat,lon,date);
if(r.alt<minAlt)return;if(r.magVal>maxMag)return;
const o={...obj,alt:Math.round(r.alt*10)/10,az:Math.round(r.az*10)/10,azDir:azToDir(r.az),magVal:Math.round(r.magVal*10)/10,distStr:r.distStr,score:r.alt+(10-Math.min(10,Math.abs(r.magVal)))*2};
o.difficulty=calcDifficulty(o);results.push(o);
});
results.sort((a,b)=>b.score-a.score);return results;
}
function calcAltCurve(obj,lat,lon,baseDate){
const pts=[];
for(let h=0;h<=12;h++){
const d=new Date(baseDate);d.setHours(18+h,0,0,0);
const r=objAltAz(obj,lat,lon,d);pts.push({h:18+h,alt:r.alt});
}
return pts;
}

const $=s=>document.querySelector(s);

// v2.0.1: constellation modal listeners are registered only after DOM helpers are initialized.
document.getElementById("closeConstellationDetail")?.addEventListener("click",closeConstellationDetailModal);
document.getElementById("constellationDetailModal")?.addEventListener("click",event=>{
  if(event.target===document.getElementById("constellationDetailModal"))closeConstellationDetailModal();
});

/* =====================================================
お気に入り地点
===================================================== */
const FAVORITE_LOCATIONS_KEY="nicole_favorite_locations_v1";
let FAVORITE_LOCATIONS=[];

function loadFavoriteLocations(){
try{
const data=JSON.parse(localStorage.getItem(FAVORITE_LOCATIONS_KEY)||"[]");
FAVORITE_LOCATIONS=Array.isArray(data)?data.filter(x=>
x&&Number.isFinite(Number(x.lat))&&Number.isFinite(Number(x.lon))
):[];
}catch(e){
FAVORITE_LOCATIONS=[];
}
renderFavoriteLocations();
}

function persistFavoriteLocations(){
try{
localStorage.setItem(FAVORITE_LOCATIONS_KEY,JSON.stringify(FAVORITE_LOCATIONS));
}catch(e){
console.warn("お気に入り地点の保存に失敗しました",e);
}
renderFavoriteLocations();
}

function renderFavoriteLocations(){
const sel=$("#favoriteLocationSelect");
if(!sel)return;
const selected=sel.value;
sel.innerHTML='<option value="">お気に入り地点を選択</option>';
FAVORITE_LOCATIONS.forEach((loc,i)=>{
const op=document.createElement("option");
op.value=String(i);
op.textContent=loc.name||`地点 ${i+1}`;
sel.appendChild(op);
});
if(selected!==""&&Number(selected)<FAVORITE_LOCATIONS.length)sel.value=selected;
}

function currentInputLocation(){
const lat=parseFloat($("#inLat")?.value);
const lon=parseFloat($("#inLon")?.value);
const alt=parseFloat($("#inAlt")?.value||"0");
const name=($("#inPlace")?.value||"").trim()||"現在の観測地点";
if(!Number.isFinite(lat)||!Number.isFinite(lon))return null;
return{name,lat,lon,alt:Number.isFinite(alt)?alt:0};
}

function applyLocationToInputs(loc){
if(!loc)return;
$("#inPlace").value=loc.name||"お気に入り地点";
$("#inLat").value=Number(loc.lat).toFixed(6);
$("#inLon").value=Number(loc.lon).toFixed(6);
$("#inAlt").value=Number.isFinite(Number(loc.alt))?Number(loc.alt).toFixed(1):"";
}

function favoriteLocationsForPlanner(){
const out=[];
const current=currentInputLocation();
if(current)out.push({...current,_source:"current"});
FAVORITE_LOCATIONS.forEach((loc,i)=>{
const duplicate=out.some(x=>Math.abs(x.lat-loc.lat)<1e-6&&Math.abs(x.lon-loc.lon)<1e-6);
if(!duplicate)out.push({...loc,_source:"favorite",_favoriteIndex:i});
});
return out;
}

/* =====================================================
天体・星座 逆引き
===================================================== */
let REVERSE_TARGET=null;

function reverseTargetLabel(target){
return target?.kind==="constellation" ? `${target.data.name}（星座）` : target?.data?.name||"天体";
}

function reverseTargetRaDec(target,date){
if(!target||!target.data)return null;
if(target.kind==="constellation"){
const co=CONST_COORD[target.data.id];
return co?{ra:co[0],dec:co[1]}:null;
}
const obj=target.data;
if(obj.type==="planet"){
const p=planetRaDec(obj.planet,toJD(date));
return{ra:p.ra,dec:p.dec};
}
if(Number.isFinite(Number(obj.ra))&&Number.isFinite(Number(obj.dec))){
return{ra:Number(obj.ra),dec:Number(obj.dec)};
}
return null;
}

function angularSeparationDeg(ra1,dec1,ra2,dec2){
const a1=ra1*D2R,d1=dec1*D2R,a2=ra2*D2R,d2=dec2*D2R;
const c=Math.sin(d1)*Math.sin(d2)+Math.cos(d1)*Math.cos(d2)*Math.cos(a1-a2);
return Math.acos(Math.max(-1,Math.min(1,c)))*R2D;
}

function formatReverseDate(d){
const p=n=>String(n).padStart(2,"0");
return`${d.getFullYear()}/${p(d.getMonth()+1)}/${p(d.getDate())}`;
}
function formatReverseTime(d){
const p=n=>String(n).padStart(2,"0");
return`${p(d.getHours())}:${p(d.getMinutes())}`;
}

function latitudeBandText(dec,minAlt){
const half=90-minAlt;
const low=Math.max(-90,dec-half);
const high=Math.min(90,dec+half);
const f=x=>Math.abs(x).toFixed(1);
if(low<=-90&&high>=90)return"ほぼ全緯度で条件を満たせます。";
if(low<=0&&high>0&&high<90)return`北半球では概ね北緯 ${f(high)}° 以南が目安です。`;
if(low>0&&high>=90)return`北半球では概ね北緯 ${f(low)}° 以北が目安です。`;
if(low>=0&&high<90)return`北緯 ${f(low)}°〜${f(high)}° が目安です。`;
if(high<=0&&low>-90)return`南緯 ${f(high)}°〜${f(low)}° 付近が目安です。`;
return`緯度 ${low.toFixed(1)}°〜${high.toFixed(1)}° が目安です。`;
}

function renderReverseLatitudeHint(target,minAlt){
const box=$("#reverseLatitudeHint");
if(!box)return;
const baseDate=$("#inDatetime")?.value?new Date($("#inDatetime").value):new Date();
const rd=reverseTargetRaDec(target,baseDate);
if(!rd){
box.textContent="緯度による見え方の概算を計算できません。";
return;
}
const horizon=latitudeBandText(rd.dec,0);
const useful=latitudeBandText(rd.dec,minAlt);
const note=target.kind==="constellation"
?"星座中心の代表座標から計算した概算です。星座全体の見え方とは多少異なります。"
:target.data.type==="planet"
?"惑星は日々位置が変わるため、現在の赤緯を基準にした概算です。"
:"南中高度の幾何学的条件から求めた概算です。天候・地形・光害は含みません。";
box.innerHTML=`<b>緯度の目安</b><br>地平線上に出る条件：${escapeHTML(horizon)}<br>${minAlt}°以上まで上がる条件：${escapeHTML(useful)}<br><span style="color:#607f98">${escapeHTML(note)}</span>`;
}

function plannerLocationsHtml(locations){
return locations.map(loc=>`<span class="reverse-location-chip">${escapeHTML(loc.name)} / ${loc.lat.toFixed(2)}°, ${loc.lon.toFixed(2)}°</span>`).join("");
}

function nightSamplesForTarget(target,loc,day,minAlt){
const samples=[];
const start=new Date(day.getFullYear(),day.getMonth(),day.getDate(),17,0,0,0);
const end=new Date(start.getTime()+14*3600000);

for(let t=start.getTime();t<=end.getTime();t+=30*60000){
const d=new Date(t);
const rd=reverseTargetRaDec(target,d);
if(!rd)continue;
const aa=altAz(rd.ra,rd.dec,loc.lat,loc.lon,d);
const sAlt=sunAlt(loc.lat,loc.lon,d);

const moon=moonPosition(toJD(d));
const sep=angularSeparationDeg(rd.ra,rd.dec,moon.ra,moon.dec);
const phase=moonPhaseInfo(d);

const qualifies=aa.alt>=minAlt && sAlt<=-12;
const deepDark=sAlt<=-18;
const moonPenalty=(phase.moonIllum/100)*Math.max(0,(70-sep)/70)*18;
const score=aa.alt+(deepDark?8:0)+(sep/180)*5-moonPenalty;

samples.push({
date:d,alt:aa.alt,az:aa.az,sunAlt:sAlt,moonSep:sep,
moonIllum:phase.moonIllum,qualifies,score
});
}
return samples;
}

function bestNightCandidate(target,loc,day,minAlt){
const samples=nightSamplesForTarget(target,loc,day,minAlt);
const usable=samples.filter(s=>s.qualifies);
if(!usable.length)return null;
let best=usable[0];
for(const s of usable)if(s.score>best.score)best=s;
const first=usable[0];
const last=usable[usable.length-1];
return{
loc,
date:best.date,
best,
start:first.date,
end:last.date,
score:best.score
};
}

function reverseCandidateCard(c,index){
const label=formatReverseDate(c.date);
return`
<div class="reverse-result-card">
  <div class="reverse-result-head">
    <div>
      <div class="reverse-result-place">${index+1}. ${escapeHTML(c.loc.name)}</div>
      <div class="reverse-result-date">${label}</div>
    </div>
    <div class="reverse-result-date">最大候補高度 ${c.best.alt.toFixed(1)}°</div>
  </div>
  <div class="reverse-result-main">
    見やすい時刻：<b>${formatReverseTime(c.best.date)}</b> ／ 方位 ${azToDir(c.best.az)}（${c.best.az.toFixed(0)}°）<br>
    条件を満たす時間帯：約 ${formatReverseTime(c.start)}〜${formatReverseTime(c.end)}
  </div>
  <div class="reverse-result-meta">
    月の輝面 ${c.best.moonIllum}% ／ 月との離角 ${c.best.moonSep.toFixed(0)}° ／ 太陽高度 ${c.best.sunAlt.toFixed(0)}°
  </div>
  <button type="button" class="reverse-set-btn" data-reverse-index="${index}">この日時・場所を観測条件にセット</button>
</div>`;
}

function runReversePlanner(){
if(!REVERSE_TARGET)return;
const days=parseInt($("#reverseDays").value)||30;
const minAlt=parseInt($("#reverseMinAlt").value)||20;
const locations=favoriteLocationsForPlanner();
$("#reverseLocationList").innerHTML=plannerLocationsHtml(locations);
renderReverseLatitudeHint(REVERSE_TARGET,minAlt);

if(!locations.length){
$("#reverseResults").innerHTML='<div class="reverse-empty">現在地またはお気に入り地点を登録してください。</div>';
return;
}

const baseRaw=$("#inDatetime")?.value;
const base=baseRaw?new Date(baseRaw):new Date();
const startDay=new Date(base.getFullYear(),base.getMonth(),base.getDate(),12,0,0,0);

const candidates=[];
for(const loc of locations){
for(let i=0;i<days;i++){
const day=new Date(startDay);
day.setDate(day.getDate()+i);
const c=bestNightCandidate(REVERSE_TARGET,loc,day,minAlt);
if(c)candidates.push(c);
}
}
candidates.sort((a,b)=>b.score-a.score);
const top=candidates.slice(0,8);
REVERSE_TARGET._lastCandidates=top;

if(!top.length){
$("#reverseResults").innerHTML=`<div class="reverse-empty">今後${days}日間、登録地点では最低高度${minAlt}°以上かつ薄明後に見える候補が見つかりませんでした。最低高度を下げるか、検索期間を広げてください。</div>`;
return;
}

$("#reverseResults").innerHTML=top.map(reverseCandidateCard).join("");
$("#reverseResults").querySelectorAll("[data-reverse-index]").forEach(btn=>{
btn.addEventListener("click",()=>{
const c=REVERSE_TARGET?._lastCandidates?.[Number(btn.dataset.reverseIndex)];
if(!c)return;
applyLocationToInputs(c.loc);
const p=n=>String(n).padStart(2,"0");
const d=c.best.date;
$("#inDatetime").value=`${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
closeReversePlanner();
$("#btnCalc").click();
window.scrollTo({top:0,behavior:"smooth"});
});
});
}

function openReversePlanner(kind,data){
REVERSE_TARGET={kind,data};
const modal=$("#reversePlannerModal");
$("#reversePlannerTitle").textContent=`${reverseTargetLabel(REVERSE_TARGET)} — いつ・どこで見る？`;
$("#reversePlannerSub").textContent="現在の観測地点とお気に入り地点を比較し、薄明後に見やすい日時を探します。";
$("#reverseMinAlt").value=$("#inMinAlt")?.value||"20";
$("#reverseResults").innerHTML='<div class="reverse-empty">「候補を検索」を押すと、現在地とお気に入り地点から候補を計算します。</div>';
const locs=favoriteLocationsForPlanner();
$("#reverseLocationList").innerHTML=plannerLocationsHtml(locs);
renderReverseLatitudeHint(REVERSE_TARGET,parseInt($("#reverseMinAlt").value)||20);
modal.classList.add("open");
modal.setAttribute("aria-hidden","false");
document.body.classList.add("manual-open");
}

function closeReversePlanner(){
const modal=$("#reversePlannerModal");
if(!modal)return;
modal.classList.remove("open");
modal.setAttribute("aria-hidden","true");
document.body.classList.remove("manual-open");
}

function escapeHTML(value){
return String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}
const TYPE_LABEL={galaxy:"銀河",nebula:"星雲",cluster:"星団",planet:"惑星",double:"二重星",double_star:"二重星",asterism:"アステリズム",star_cloud:"星野",star:"恒星",snr:"超新星残骸"};
const TYPE_BADGE={galaxy:"b-type-galaxy",nebula:"b-type-nebula",cluster:"b-type-cluster",planet:"b-type-planet",double:"b-type-double",double_star:"b-type-double",asterism:"b-type-cluster",star_cloud:"b-type-nebula",star:"b-type-star",snr:"b-type-snr"};
let currentResults=[],currentLat,currentLon,currentDate,activeFilter="all",currentSort="score";
let moonCalBaseDate=new Date();
let moonDatePickerBaseDate=new Date();

(function(){
const now=new Date();
$("#inDatetime").value=toDatetimeLocalValue(now);
$("#inLat").value=42.9236;
$("#inLon").value=143.1965;
$("#inPlace").value="帯広";
$("#inAlt").value="";
loadFavoriteLocations();

/* 観測現場では現在時刻を初期値とし、そのまま追従させる */
setTimeout(()=>startLiveNowMode(),0);
})();

const LOCS={
btnObihiro:{lat:42.9236,lon:143.1965,name:"帯広"},btnSapporo:{lat:43.0642,lon:141.3469,name:"札幌"},
btnSendai:{lat:38.2682,lon:140.8694,name:"仙台"},btnShinjuku:{lat:35.6895,lon:139.6917,name:"新宿"},
btnNagoya:{lat:35.1815,lon:136.9066,name:"名古屋"},btnOsaka:{lat:34.6937,lon:135.5023,name:"大阪"},
btnFukuoka:{lat:33.5904,lon:130.4017,name:"福岡"},btnNaha:{lat:26.2124,lon:127.6809,name:"那覇"}
};
Object.keys(LOCS).forEach(id=>{
const btn=$(("#"+id));
if(btn)btn.addEventListener("click",()=>{
const l=LOCS[id];
$("#inLat").value=l.lat;
$("#inLon").value=l.lon;
$("#inPlace").value=l.name;
$("#inAlt").value="";
if(navigator.onLine)loadWeatherForecast(l.lat,l.lon);
});
});
$("#obsPlaceSearchBtn").addEventListener("click",()=>searchObservationPlace($("#obsPlaceSearchInput").value));
$("#obsPlaceSearchInput").addEventListener("keydown",event=>{
if(event.key==="Enter"){
event.preventDefault();
searchObservationPlace($("#obsPlaceSearchInput").value);
}
});

$("#btnGPS").addEventListener("click",async()=>{
if(!navigator.geolocation){
alert("GPSに対応していません。");
return;
}

const btn=$("#btnGPS");
const originalHTML=btn.innerHTML;
btn.disabled=true;
btn.textContent="📡 現在地を取得中…";

navigator.geolocation.getCurrentPosition(async p=>{
const lat=p.coords.latitude;
const lon=p.coords.longitude;

$("#inLat").value=lat.toFixed(6);
$("#inLon").value=lon.toFixed(6);
$("#inPlace").value="現在地";
$("#inAlt").value="";
btn.textContent="⛰ 標高を取得中…";

if(navigator.onLine){
try{
const result=await fetchGsiElevation(lat,lon);
$("#inAlt").value=result.elevation.toFixed(1);
}catch(err){
/* 標高だけ失敗しても緯度経度はそのまま利用できる */
console.warn("標高取得失敗:",err);
}

loadWeatherForecast(lat,lon);
}

btn.disabled=false;
btn.innerHTML=originalHTML;

/* 現場用クイックスタート：取得できた地点でそのまま観測開始 */
$("#btnCalc").click();
setTimeout(()=>$("#resultArea")?.scrollIntoView({behavior:"smooth",block:"start"}),80);
},err=>{
btn.disabled=false;
btn.innerHTML=originalHTML;

let msg="位置情報の取得に失敗しました。";
if(err&&err.code===1)msg="位置情報の利用が許可されていません。Safariの位置情報設定を確認してください。";
else if(err&&err.code===2)msg="現在地を特定できませんでした。";
else if(err&&err.code===3)msg="現在地の取得がタイムアウトしました。";

alert(msg);
},{
enableHighAccuracy:true,
timeout:12000,
maximumAge:60000
});
});
$("#btnNow").addEventListener("click",()=>{
if(LIVE_NOW_MODE)stopLiveNowMode();
else startLiveNowMode();
});
$("#inDatetime").addEventListener("input",()=>{
if(LIVE_NOW_MODE)stopLiveNowMode();
});
$("#polarReticleInvert").addEventListener("change",()=>renderPolarScopeGuide());
$("#skyShowMyStars")?.addEventListener("change",()=>renderSkyChart());
$("#saveMyStar")?.addEventListener("click",saveMyStarFromForm);
$("#deleteSelectedMyStars")?.addEventListener("click",deleteSelectedMyStars);
$("#pickMyStarFromSky")?.addEventListener("click",startMyStarCoordinatePicker);
$("#planetariumExit")?.addEventListener("click",deactivatePlanetariumMode);
$("#closePlanetariumUnlock")?.addEventListener("click",closePlanetariumUnlock);
$("#planetariumUnlockModal")?.addEventListener("click",event=>{
  if(event.target===$("#planetariumUnlockModal"))closePlanetariumUnlock();
});

$("#saveFavoriteLocation").addEventListener("click",()=>{
const loc=currentInputLocation();
if(!loc){alert("場所名・緯度・経度を入力してください。");return;}
const inputName=prompt("お気に入り地点の名前",loc.name||"観測地点");
if(inputName===null)return;
loc.name=inputName.trim()||loc.name||"観測地点";
const same=FAVORITE_LOCATIONS.findIndex(x=>Math.abs(x.lat-loc.lat)<1e-6&&Math.abs(x.lon-loc.lon)<1e-6);
if(same>=0){
FAVORITE_LOCATIONS[same]=loc;
}else{
FAVORITE_LOCATIONS.push(loc);
}
persistFavoriteLocations();
$("#favoriteLocationSelect").value=String(same>=0?same:FAVORITE_LOCATIONS.length-1);
});

$("#applyFavoriteLocation").addEventListener("click",()=>{
const idx=Number($("#favoriteLocationSelect").value);
if(!Number.isInteger(idx)||!FAVORITE_LOCATIONS[idx]){alert("お気に入り地点を選択してください。");return;}
applyLocationToInputs(FAVORITE_LOCATIONS[idx]);
});

$("#deleteFavoriteLocation").addEventListener("click",()=>{
const idx=Number($("#favoriteLocationSelect").value);
if(!Number.isInteger(idx)||!FAVORITE_LOCATIONS[idx]){alert("削除するお気に入り地点を選択してください。");return;}
if(!confirm(`「${FAVORITE_LOCATIONS[idx].name}」を削除しますか？`))return;
FAVORITE_LOCATIONS.splice(idx,1);
persistFavoriteLocations();
});


/* =====================================================
プラネタリウム — 隠しモード
登録星はlocalStorageに保存。モード自体はページを閉じると終了。
===================================================== */
const MY_STAR_STORAGE_KEY="nicole_my_private_stars_v1";
let MY_STARS=[];
let PLANETARIUM_MODE_ACTIVE=false;
let PLANETARIUM_PICKING_COORDS=false;

function loadMyStars(){
  try{
    const raw=localStorage.getItem(MY_STAR_STORAGE_KEY);
    const data=raw?JSON.parse(raw):[];
    MY_STARS=Array.isArray(data)?data.filter(s=>
      s&&typeof s.name==="string"&&
      Number.isFinite(Number(s.ra))&&Number.isFinite(Number(s.dec))
    ).map(s=>({
      id:String(s.id||`my-${Date.now()}-${Math.random().toString(36).slice(2,8)}`),
      name:String(s.name).slice(0,80),
      mag:Number.isFinite(Number(s.mag))?Number(s.mag):5,
      ra:norm360(Number(s.ra)),
      dec:Math.max(-90,Math.min(90,Number(s.dec))),
      typeLabel:String(s.typeLabel||"恒星").slice(0,40),
      cat:String(s.cat||"").slice(0,60),
      dist:String(s.dist||"").slice(0,80),
      size:String(s.size||"").slice(0,80),
      scope:String(s.scope||"").slice(0,80),
      difficulty:Math.max(1,Math.min(5,Number(s.difficulty)||3)),
      highlight:String(s.highlight||"").slice(0,300),
      story:String(s.story||"").slice(0,3000)
    })) :[];
  }catch(e){MY_STARS=[];}
}
function saveMyStars(){
  try{localStorage.setItem(MY_STAR_STORAGE_KEY,JSON.stringify(MY_STARS));}catch(e){}
}
function renderMyStarList(){
  const list=$("#myStarList");
  if(!list)return;
  list.innerHTML="";
  if(!MY_STARS.length){
    list.innerHTML='<div class="my-star-empty">まだ名前を付けた星はありません。</div>';
    return;
  }
  MY_STARS.forEach(star=>{
    const row=document.createElement("label");
    row.className="my-star-row";
    row.innerHTML=`
      <input type="checkbox" class="my-star-delete-check" value="${escapeHTML(star.id)}">
      <div>
        <div class="my-star-name">${escapeHTML(star.name)}</div>
        <div class="my-star-meta">${escapeHTML(star.typeLabel||"恒星")} ／ 等級 ${Number(star.mag).toFixed(1)} ／ 赤経 ${Number(star.ra).toFixed(6)}° ／ 赤緯 ${Number(star.dec).toFixed(6)}°${star.dist?` ／ ${escapeHTML(star.dist)}`:""}</div>
      </div>`;
    list.appendChild(row);
  });
}
function setPlanetariumStatus(message,color="#7eb8e8"){
  const el=$("#planetariumStatus");
  if(el){el.textContent=message||"";el.style.color=color;}
}
function openPlanetariumUnlock(){
  const modal=$("#planetariumUnlockModal");
  if(!modal)return;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden","false");
}
function closePlanetariumUnlock(){
  const modal=$("#planetariumUnlockModal");
  if(!modal)return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden","true");
}
function activatePlanetariumMode(){
  PLANETARIUM_MODE_ACTIVE=true;
  PLANETARIUM_PICKING_COORDS=false;
  document.body.classList.remove("planetarium-picking");
  const panel=$("#planetariumPanel");
  const option=$("#skyMyStarOption");
  const toggle=$("#skyShowMyStars");
  if(panel)panel.hidden=false;
  if(option)option.hidden=false;
  if(toggle)toggle.checked=true;
  renderMyStarList();
  setPlanetariumStatus("");
  openPlanetariumUnlock();
  renderSkyChart();
}
function deactivatePlanetariumMode(){
  PLANETARIUM_MODE_ACTIVE=false;
  PLANETARIUM_PICKING_COORDS=false;
  document.body.classList.remove("planetarium-picking");
  const panel=$("#planetariumPanel");
  const option=$("#skyMyStarOption");
  const toggle=$("#skyShowMyStars");
  if(panel)panel.hidden=true;
  if(option)option.hidden=true;
  if(toggle)toggle.checked=false;
  setPlanetariumStatus("");
  renderSkyChart();
}
function saveMyStarFromForm(){
  const name=String($("#myStarName")?.value||"").trim();
  const mag=Number($("#myStarMag")?.value);
  const ra=Number($("#myStarRa")?.value);
  const dec=Number($("#myStarDec")?.value);
  const typeLabel=String($("#myStarTypeLabel")?.value||"恒星").trim()||"恒星";
  const cat=String($("#myStarCat")?.value||"").trim();
  const dist=String($("#myStarDist")?.value||"").trim();
  const size=String($("#myStarSize")?.value||"").trim();
  const scope=String($("#myStarScope")?.value||"").trim();
  const difficulty=Math.max(1,Math.min(5,Number($("#myStarDifficulty")?.value)||3));
  const highlight=String($("#myStarHighlight")?.value||"").trim();
  const story=String($("#myStarStory")?.value||"").trim();
  if(!name){setPlanetariumStatus("星の名前を入力してください。","#fb923c");return;}
  if(!Number.isFinite(mag)){setPlanetariumStatus("等級を入力してください。","#fb923c");return;}
  if(!Number.isFinite(ra)||ra<0||ra>360){setPlanetariumStatus("赤経は0〜360°で入力してください。","#fb923c");return;}
  if(!Number.isFinite(dec)||dec<-90||dec>90){setPlanetariumStatus("赤緯は-90〜+90°で入力してください。","#fb923c");return;}
  MY_STARS.push({
    id:`my-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
    name,
    mag,
    ra:norm360(ra),
    dec,
    typeLabel,
    cat,
    dist,
    size,
    scope,
    difficulty,
    highlight,
    story
  });
  saveMyStars();
  renderMyStarList();
  setPlanetariumStatus(`「${name}」を星図へ登録しました。`,"#86efac");
  $("#myStarName").value="";
  renderSkyChart();
}
function deleteSelectedMyStars(){
  const checks=[...document.querySelectorAll(".my-star-delete-check:checked")];
  if(!checks.length){setPlanetariumStatus("削除する星を選択してください。","#fb923c");return;}
  const ids=new Set(checks.map(c=>c.value));
  const removed=MY_STARS.filter(s=>ids.has(s.id)).length;
  MY_STARS=MY_STARS.filter(s=>!ids.has(s.id));
  saveMyStars();
  renderMyStarList();
  setPlanetariumStatus(`${removed}件の星を削除しました。`,"#86efac");
  renderSkyChart();
}
function horizontalToRaDec(altDeg,azDeg,latDeg,lonDeg,date){
  const alt=altDeg*D2R,az=azDeg*D2R,lat=latDeg*D2R;
  const sinDec=Math.sin(alt)*Math.sin(lat)+Math.cos(alt)*Math.cos(lat)*Math.cos(az);
  const dec=Math.asin(Math.max(-1,Math.min(1,sinDec)));
  const cosDec=Math.max(1e-12,Math.cos(dec));
  const sinH=-Math.sin(az)*Math.cos(alt)/cosDec;
  const cosH=(Math.sin(alt)-Math.sin(lat)*Math.sin(dec))/(Math.cos(lat)*cosDec);
  const H=Math.atan2(sinH,cosH)*R2D;
  const lst=norm360(gmst(toJD(date))+lonDeg);
  return{ra:norm360(lst-H),dec:dec*R2D};
}
function skyPointToAltAz(x,y){
  const canvas=$("#skyMapCanvas");
  if(!canvas)return null;
  const w=canvas.getBoundingClientRect().width;
  const h=canvas.getBoundingClientRect().height;
  const cx=w/2,cy=h/2,R=Math.min(w,h)*0.44;

  if(isHorizonProjection()){
    const {halfX,halfY}=getSkyPerspectiveViewport(R);
    if(x<cx-halfX||x>cx+halfX||y<cy-halfY||y>cy+halfY)return null;
    const halfFov=(getActivePerspectiveFov()/2)*D2R;
    const scale=halfY/Math.tan(halfFov);
    const x0=cx+(x-cx-SKY_PAN_X)/SKY_ZOOM;
    const y0=cy+(y-cy-SKY_PAN_Y)/SKY_ZOOM;
    const nx=(x0-cx)/scale;
    const ny=-(y0-cy)/scale;

    const forward=horizontalUnitVector(SKY_PERSPECTIVE_ALT,SKY_PERSPECTIVE_AZ);
    const camAz=SKY_PERSPECTIVE_AZ*D2R;
    const right={x:Math.cos(camAz),y:-Math.sin(camAz),z:0};
    const up={
      x:right.y*forward.z-right.z*forward.y,
      y:right.z*forward.x-right.x*forward.z,
      z:right.x*forward.y-right.y*forward.x
    };
    let v={
      x:forward.x+nx*right.x+ny*up.x,
      y:forward.y+nx*right.y+ny*up.y,
      z:forward.z+nx*right.z+ny*up.z
    };
    const len=Math.hypot(v.x,v.y,v.z)||1;
    v={x:v.x/len,y:v.y/len,z:v.z/len};
    const alt=Math.asin(Math.max(-1,Math.min(1,v.z)))*R2D;
    const az=norm360(Math.atan2(v.x,v.y)*R2D);
    return{alt,az};
  }

  const bx=cx+(x-cx-SKY_PAN_X)/SKY_ZOOM;
  const by=cy+(y-cy-SKY_PAN_Y)/SKY_ZOOM;
  const dx=bx-cx,dy=by-cy;
  const r=Math.hypot(dx,dy);
  if(r>R)return null;
  const alt=90-(r/R)*90;
  const az=r<1e-8?0:norm360(Math.atan2(-dx,-dy)*R2D);
  return{alt,az};
}
function selectMyStarCoordinateFromSky(x,y){
  const lat=Number.isFinite(currentLat)?currentLat:parseFloat($("#inLat").value);
  const lon=Number.isFinite(currentLon)?currentLon:parseFloat($("#inLon").value);
  const date=getSkyViewDate();
  if(!Number.isFinite(lat)||!Number.isFinite(lon)||!(date instanceof Date)||isNaN(date)){
    setPlanetariumStatus("観測日時と場所を先に設定してください。","#fb923c");
    return false;
  }
  const aa=skyPointToAltAz(x,y);
  if(!aa){
    const info=$("#skyMapObjectInfo");
    if(info)info.innerHTML='<b>座標を選択できませんでした。</b><br>星図の内側をタップしてください。';
    return false;
  }
  const rd=horizontalToRaDec(aa.alt,aa.az,lat,lon,date);
  $("#myStarRa").value=rd.ra.toFixed(6);
  $("#myStarDec").value=rd.dec.toFixed(6);
  PLANETARIUM_PICKING_COORDS=false;
  document.body.classList.remove("planetarium-picking");
  setPlanetariumStatus(`星図から座標を選びました：赤経 ${rd.ra.toFixed(6)}° / 赤緯 ${rd.dec.toFixed(6)}°`,"#86efac");
  $("#planetariumPanel")?.scrollIntoView({behavior:"smooth",block:"center"});
  return true;
}
function startMyStarCoordinatePicker(){
  if(!PLANETARIUM_MODE_ACTIVE)return;
  PLANETARIUM_PICKING_COORDS=true;
  document.body.classList.add("planetarium-picking");
  switchResultTab("skymap");
  const info=$("#skyMapObjectInfo");
  if(info)info.innerHTML='<b>僕しか知らない星の座標を選択中</b><br>星図上の好きな場所をタップしてください。';
  setPlanetariumStatus("星図上の好きな場所をタップしてください。");
  $("#skyMapPanel")?.scrollIntoView({behavior:"smooth",block:"start"});
}
loadMyStars();


$("#runReversePlanner").addEventListener("click",runReversePlanner);
$("#closeReversePlanner").addEventListener("click",closeReversePlanner);
$("#reversePlannerModal").addEventListener("click",e=>{
if(e.target===$("#reversePlannerModal"))closeReversePlanner();
});
$("#reverseMinAlt").addEventListener("change",()=>{
if(REVERSE_TARGET)renderReverseLatitudeHint(REVERSE_TARGET,parseInt($("#reverseMinAlt").value)||20);
});

$("#objSearch").addEventListener("input",function(){
const rawQuery=this.value.trim();
const q=rawQuery.toLowerCase();
const resultDiv=$("#objSearchResult");
const list=$("#objSearchList");
const countEl=$("#searchCount");

if(rawQuery==="四畳半を拡げる"){
  activatePlanetariumMode();
  this.value="";
  resultDiv.style.display="none";
  countEl.textContent="";
  return;
}

if(!q){
resultDiv.style.display="none";
countEl.textContent="";
return;
}

const objHits=ALL_OBJECTS.filter(o=>
o.name.toLowerCase().includes(q)||
(o.cat||"").toLowerCase().includes(q)||
(TYPE_LABEL[o.type]||"").includes(q)||
(o.highlight||"").toLowerCase().includes(q)||
(o.id||"").toLowerCase().includes(q)
);

const constHits=CONSTELLATIONS_ENRICHED.filter(c=>
c.name.toLowerCase().includes(q)||
c.en.toLowerCase().includes(q)||
(c.abbr||"").toLowerCase().includes(q)||
(c.stars||"").toLowerCase().includes(q)||
(c.science||"").toLowerCase().includes(q)||
(c.myth||"").toLowerCase().includes(q)
);

const total=objHits.length+constHits.length;
countEl.textContent=`${total}件ヒット`;
if(total===0){
resultDiv.style.display="block";
list.innerHTML='<div style="color:#6a8aaa;padding:10px">該当する天体・星座が見つかりませんでした。</div>';
return;
}

list.innerHTML="";
const entries=[
...objHits.map(data=>({kind:"object",data})),
...constHits.map(data=>({kind:"constellation",data}))
].slice(0,30);

entries.forEach(entry=>{
const item=document.createElement("div");
item.className="obj-search-item";

if(entry.kind==="object"){
const obj=entry.data;
item.innerHTML=`
<div class="osi-icon">${obj.icon}</div>
<div class="osi-info">
  <div class="osi-name">${obj.name}</div>
  <div class="osi-meta"><span class="badge ${TYPE_BADGE[obj.type]||""}">${TYPE_LABEL[obj.type]||obj.type}</span> ${obj.cat||""} ／ ${obj.dist||""} ／ 等級 ${obj.mag}</div>
  <div class="osi-meta" style="color:#8ab4d4;margin-top:2px">🔭 ${obj.highlight||""}</div>
  <div class="obj-search-actions">
    <button type="button" class="reverse-plan-btn search-detail-btn">詳しく見る</button>
    <button type="button" class="reverse-plan-btn search-reverse-btn">いつ・どこで見る？</button>
  </div>
</div>`;
item.querySelector(".search-detail-btn").addEventListener("click",e=>{
e.stopPropagation();
const found=currentResults.find(r=>r.id===obj.id);
const target=found||{...obj,alt:"—",az:"—",azDir:"—",magVal:obj.mag,distStr:obj.dist,difficulty:3};
showDetail(target,null);
});
item.querySelector(".search-reverse-btn").addEventListener("click",e=>{
e.stopPropagation();
openReversePlanner("object",obj);
});
}else{
const c=entry.data;
item.innerHTML=`
<div class="osi-icon">✦</div>
<div class="osi-info">
  <div class="osi-name">${c.name} <span style="font-size:11px;color:#6a8aaa">${c.en}（${c.abbr}）</span></div>
  <div class="osi-meta"><span class="badge">星座</span> ${SEASON_LABEL[c.season]||c.season} ／ 主な星：${c.stars||"—"}</div>
  <div class="obj-search-actions">
    <button type="button" class="reverse-plan-btn search-const-btn">星座パネルで見る</button>
    <button type="button" class="reverse-plan-btn search-reverse-btn">いつ・どこで見る？</button>
  </div>
</div>`;
item.querySelector(".search-const-btn").addEventListener("click",e=>{
e.stopPropagation();
if($("#resultArea").style.display==="none")$("#btnCalc").click();
$("#constSearch").value=c.name;
renderConstellations(currentDate?currentDate.getMonth()+1:null,c.name);
activateResultTab("constellations");
setTimeout(()=>$("#rtab-constellations")?.scrollIntoView({behavior:"smooth",block:"start"}),50);
});
item.querySelector(".search-reverse-btn").addEventListener("click",e=>{
e.stopPropagation();
openReversePlanner("constellation",c);
});
}
list.appendChild(item);
});

if(total>30){
const more=document.createElement("div");
more.style.cssText="color:#6a8aaa;padding:8px;font-size:12px;text-align:center";
more.textContent=`他 ${total-30} 件`;
list.appendChild(more);
}
resultDiv.style.display="block";
});

document.querySelectorAll(".result-section-panel").forEach(section=>{
  section.addEventListener("toggle",()=>{
    if(!section.open)return;
    const name=section.dataset.resultSection;
    if(name==="skymap"){
      requestAnimationFrame(()=>{
        renderSkyChart();
        syncSkyInteractionLayer();
      });
    }else if(name==="smallbodies"){
      updateSmallBodyStoredStatus();
    }else if(name==="meteors"){
      const d=$("#inDatetime").value?new Date($("#inDatetime").value):new Date();
      if(!METEOR_SHOWERS.length||meteorLoadedYear!==d.getFullYear())loadMeteorShowers();
      else renderMeteorShowers();
    }else if(name==="mooncalendar"){
      const d=currentDate instanceof Date&&!isNaN(currentDate)?currentDate:new Date();
      renderMoonCalendar(new Date(d.getFullYear(),d.getMonth(),1));
    }else if(name==="polar"){
      renderPolarScopeGuide();
    }
  });
});

["skyShowLines","skyShowNames","skyShowAsterisms","skyShowSun","skyShowDaylight","skyShowMoon","skyShowMoonlight","skyShowPlanets","skyShowEcliptic","skyShowLunarPath","skyShowDSO","skyShowMeteors"].forEach(id=>{
$("#"+id).addEventListener("change",()=>{
syncSolarPathControls();
renderSkyChart();
});
});
syncSolarPathControls();
$("#skyShowSmallBodies").addEventListener("change",function(){
if(this.checked&&!NIGHT_COMETS.length&&$("#skyMapObjectInfo")){
$("#skyMapObjectInfo").innerHTML='<b>彗星</b><br>「彗星」パネルで「今夜の彗星を取得」を押すと、その夜の彗星を時刻に合わせて星図へ表示できます。';
}
renderSkyChart();
});
$("#skyMag").addEventListener("change",renderSkyChart);
$("#skyShowCometTrack").addEventListener("change",renderSkyChart);
$("#clearCometTrack").addEventListener("click",clearCometTrack);
$("#skyShowMilkyWay").addEventListener("change",()=>{
if($("#skyShowMilkyWay").checked && !MILKYWAY_OUTLINE_DATA)loadMilkyWayOutline();
renderSkyChart();
});
$("#skyShowFov").addEventListener("change",()=>{
updateFovInfo();
if($("#skyShowFov").checked&&!isHorizonProjection()){
setSkyProjection("perspective");
}else{
renderSkyChart();
}
});
$("#skyFovSensor").addEventListener("change",()=>{updateFovInfo();renderSkyChart();});
$("#skyFovFocal").addEventListener("input",()=>{updateFovInfo();renderSkyChart();});
$("#skyFovOrientation").addEventListener("change",()=>{updateFovInfo();renderSkyChart();});

refreshAstroCameraPresetOptions();
$("#astroCameraPreset").addEventListener("change",()=>{
showAstroCustomEditorForSelection();
updateFovInfo();
renderSkyChart();
});
["astroCustomName","astroCustomSensorFormat","astroCustomMP","astroAperture","astroTrailBasis"].forEach(id=>{
$("#"+id)?.addEventListener("input",()=>{updateFovInfo();renderSkyChart();});
$("#"+id)?.addEventListener("change",()=>{updateFovInfo();renderSkyChart();});
});
$("#astroSaveCustomCamera")?.addEventListener("click",persistCurrentAstroCustomCamera);
$("#astroDeleteCustomCamera")?.addEventListener("click",deleteCurrentAstroCustomCamera);
showAstroCustomEditorForSelection();
["intervalExposure","intervalGap","intervalFrames","timelapseLength","timelapseFps","timelapseInterval","trailDegrees","trailExposure","trailGap","totalShootMinutes","totalExposure","totalGap","stackFrames","stackTarget"].forEach(id=>{
$("#"+id)?.addEventListener("input",updateContinuousShootingTools);
});
$("#astroShowMilkyWay")?.addEventListener("click",()=>{
const cb=$("#skyShowMilkyWay");
if(cb){
cb.checked=true;
if(!MILKYWAY_OUTLINE_DATA)loadMilkyWayOutline();
renderSkyChart();
}
});
updateFovInfo();
updateAstroPhotoTools();

$("#skyViewAllSky").addEventListener("click",()=>{stopSkyCameraStream();disableSkyDeviceOrientation();setSkyProjection("allsky");});
$("#skyViewPerspective").addEventListener("click",()=>{stopSkyCameraStream();disableSkyDeviceOrientation();setSkyProjection("perspective");});
$("#skyViewTracking")?.addEventListener("click",async()=>{
  stopSkyCameraStream();
  if(SKY_PROJECTION==="tracking"&&SKY_DEVICE_MODE){
    disableSkyDeviceOrientation();
    setSkyProjection("perspective");
    return;
  }
  await enableSkyTrackingMode();
});
$("#skyViewCamera")?.addEventListener("click",async()=>{
  if(SKY_PROJECTION==="camera"&&SKY_CAMERA_STREAM){exitSkyCameraMode();return;}
  await enableSkyCameraMode();
});
$("#stopSkyCamera")?.addEventListener("click",exitSkyCameraMode);
$("#cameraAzMinus")?.addEventListener("click",()=>adjustCameraAlignment(-1,0));
$("#cameraAzPlus")?.addEventListener("click",()=>adjustCameraAlignment(1,0));
$("#cameraAltMinus")?.addEventListener("click",()=>adjustCameraAlignment(0,-1));
$("#cameraAltPlus")?.addEventListener("click",()=>adjustCameraAlignment(0,1));
$("#cameraResetAlign")?.addEventListener("click",resetCameraAlignment);
$("#cameraAlignTarget")?.addEventListener("click",alignCameraToSelectedTarget);
$("#skyCameraFullscreen")?.addEventListener("click",toggleSkyFullscreen);
$("#skyCameraOverlayOpacity")?.addEventListener("input",event=>setCameraOverlayOpacity(event.target.value));
$("#skyCameraOverlayOpacityFullscreen")?.addEventListener("input",event=>setCameraOverlayOpacity(event.target.value));
$("#cameraAzMinusFullscreen")?.addEventListener("click",()=>adjustCameraAlignment(-1,0));
$("#cameraAzPlusFullscreen")?.addEventListener("click",()=>adjustCameraAlignment(1,0));
$("#cameraAltMinusFullscreen")?.addEventListener("click",()=>adjustCameraAlignment(0,-1));
$("#cameraAltPlusFullscreen")?.addEventListener("click",()=>adjustCameraAlignment(0,1));
$("#cameraResetAlignFullscreen")?.addEventListener("click",resetCameraAlignment);
$("#cameraAlignTargetFullscreen")?.addEventListener("click",alignCameraToSelectedTarget);
$("#stopSkyCameraFullscreen")?.addEventListener("click",async()=>{
  if(skyPanelIsFullscreen())await toggleSkyFullscreen();
  exitSkyCameraMode();
});
window.addEventListener("pagehide",stopSkyCameraStream);
updateSkyDeviceUI();
$("#skyPerspectiveAz").addEventListener("change",event=>{
disableSkyDeviceOrientation();
SKY_PERSPECTIVE_AZ=Number(event.target.value)||180;
SKY_ZOOM=1;SKY_PAN_X=0;SKY_PAN_Y=0;
updateSkyProjectionUI();
renderSkyChart();
});
$("#skyPerspectiveAlt").addEventListener("change",event=>{
disableSkyDeviceOrientation();
SKY_PERSPECTIVE_ALT=Number(event.target.value)||35;
SKY_ZOOM=1;SKY_PAN_X=0;SKY_PAN_Y=0;
updateSkyProjectionUI();
renderSkyChart();
});
updateSkyProjectionUI();

document.querySelectorAll("[data-sky-shift]").forEach(btn=>{
btn.addEventListener("click",()=>{
shiftSkyViewTime(Number(btn.dataset.skyShift));
});
btn.addEventListener("dblclick",event=>event.preventDefault());
});

$("#skyTimeReset").addEventListener("click",resetSkyViewTime);
$("#skyFullscreen").addEventListener("click",toggleSkyFullscreen);
$("#skyTrackingFullscreen")?.addEventListener("click",toggleSkyFullscreen);
$("#skyCanvasFullscreenExit")?.addEventListener("click",toggleSkyFullscreen);
$("#clearSkyFocusTarget")?.addEventListener("click",clearSkyFocusTarget);
document.addEventListener("fullscreenchange",()=>{
const active=skyPanelIsFullscreen();
document.body.classList.toggle("sky-fullscreen-open",active);
if(active)syncNightFullscreenFilter();
updateSkyFullscreenButton();
setTimeout(()=>{renderSkyChart();syncSkyInteractionLayer();},60);
});
document.addEventListener("keydown",event=>{
if(event.key==="Escape"){
const wrap=$("#skyMapCanvasWrap");
if(wrap?.classList.contains("sky-fullscreen-fallback")){
wrap.classList.remove("sky-fullscreen-fallback");
document.body.classList.remove("sky-fullscreen-open");
updateSkyFullscreenButton();
setTimeout(()=>{renderSkyChart();syncSkyInteractionLayer();},60);
}
}
});

$("#skyTimeSlider").addEventListener("input",event=>{
setSkyViewOffsetHours(Number(event.target.value));
});

$("#skyZoomIn").addEventListener("click",()=>setSkyZoom(SKY_ZOOM*1.35));
$("#skyZoomOut").addEventListener("click",()=>setSkyZoom(SKY_ZOOM/1.35));
$("#skyZoomReset").addEventListener("click",resetSkyZoom);

$("#nightModeToggle").addEventListener("click",toggleNightMode);
restoreNightMode();

$("#openMapSelect").addEventListener("click",openMapSelector);
$("#mapSearchForm").addEventListener("submit",event=>{
event.preventDefault();
searchMapLocation($("#mapSearchInput").value);
});
$("#closeMapSelect").addEventListener("click",closeMapSelector);
$("#useMapLocation").addEventListener("click",useMapSelectedLocation);

$("#lightPollutionToggle").addEventListener("change",event=>{
setLightPollutionLayerVisible(event.target.checked);
});
$("#lightPollutionOpacity").addEventListener("input",event=>{
if(GSI_LIGHT_LAYER)GSI_LIGHT_LAYER.setOpacity(Number(event.target.value)/100);
});
$("#findDarkerLocation").addEventListener("click",findDarkerNearby);
$("#mapSelectModal").addEventListener("click",event=>{
if(event.target===event.currentTarget)closeMapSelector();
});
document.addEventListener("keydown",event=>{
if(event.key==="Escape"&&$("#mapSelectModal").classList.contains("open"))closeMapSelector();
});

/* 天候は常に取得を試みる。オフライン時はService Workerの保存済みAPI応答へフォールバックする。 */
loadWeatherFromInputs();

window.addEventListener("online",()=>{
updatePwaConnectivityUI();
loadWeatherFromInputs();
});
window.addEventListener("offline",()=>{
updatePwaConnectivityUI();
loadWeatherFromInputs();
if(currentDate instanceof Date&&!isNaN(currentDate))renderTonightSkyWeather(skyInfoDisplayDate(currentDate));
});

$("#sbRefresh").addEventListener("click",loadSmallBodies);

$("#htCometSearch").addEventListener("input",renderHoshinotoriResults);
$("#htReloadIndex").addEventListener("click",async()=>{
try{localStorage.removeItem(HOSHINOTORI_INDEX_CACHE_KEY);}catch(e){}
await loadHoshinotoriIndex(true);
renderHoshinotoriResults();
});
$("#htPrecisionMode").addEventListener("change",()=>{
if(HOSHINOTORI_SELECTED)selectHoshinotoriComet(HOSHINOTORI_SELECTED.index);
});
$("#htShowOnSky").addEventListener("click",()=>{
if(!HOSHINOTORI_SELECTED)return;
$("#skyShowSmallBodies").checked=true;switchResultTab("skymap");renderSkyChart();
setTimeout(()=>$("#skyMapCanvas")?.scrollIntoView({behavior:"smooth",block:"center"}),40);
});
$("#htLongTrack").addEventListener("click",()=>{
if(!HOSHINOTORI_SELECTED)return;
const r=HOSHINOTORI_SELECTED.index;
loadCometTrack({name:hoshinotoriName(r),designation:r.designation||HOSHINOTORI_SELECTED.basic?.pdes||"",spkid:r.spkid||""});
});
loadHoshinotoriIndex(false).then(renderHoshinotoriResults);

/* 起動時は通信せず、ブラウザに保存した前回データだけ復元 */
restoreSmallBodyCache();

/* Western星座線は保存済みデータを優先し、未保存なら初回だけ取得して保存 */
restoreWesternLineCache();
loadWesternConstellationLines();

/* 天の川輪郭も保存済みデータを優先。なければ初回だけ取得して保存 */
restoreMilkyWayCache();
if($("#skyShowMilkyWay")?.checked && !MILKYWAY_OUTLINE_DATA && navigator.onLine){
loadMilkyWayOutline();
}

$("#meteorRefresh").addEventListener("click",loadMeteorShowers);
$("#skyRedraw").addEventListener("click",renderSkyChart);
const skyCanvas=$("#skyMapCanvas");
const skyInteraction=$("#skyMapInteraction");
requestAnimationFrame(syncSkyInteractionLayer);

function syncSkyInteractionLayer(){
const wrap=$("#skyMapCanvasWrap");
if(!wrap||!skyCanvas||!skyInteraction)return;
const wr=wrap.getBoundingClientRect();
const cr=skyCanvas.getBoundingClientRect();
const left=cr.left-wr.left,top=cr.top-wr.top,w=cr.width,h=cr.height;
if(SKY_PROJECTION==="allsky"){
const d=Math.min(w,h)*0.88;
skyInteraction.style.left=`${left+(w-d)/2}px`;
skyInteraction.style.top=`${top+(h-d)/2}px`;
skyInteraction.style.width=`${d}px`;
skyInteraction.style.height=`${d}px`;
skyInteraction.style.borderRadius="50%";
skyInteraction.style.clipPath="circle(50% at 50% 50%)";
}else{
skyInteraction.style.left=`${left}px`;
skyInteraction.style.top=`${top}px`;
skyInteraction.style.width=`${w}px`;
skyInteraction.style.height=`${h}px`;
skyInteraction.style.borderRadius="8px";
skyInteraction.style.clipPath="none";
}
}

function skyEventPoint(event){
const rect=skyCanvas.getBoundingClientRect();
return{
x:(event.clientX-rect.left)*(skyCanvas.clientWidth/rect.width),
y:(event.clientY-rect.top)*(skyCanvas.clientHeight/rect.height)
};
}

skyInteraction.addEventListener("wheel",event=>{
event.preventDefault();
const {x,y}=skyEventPoint(event);
const factor=event.deltaY<0?1.16:1/1.16;
setSkyZoom(SKY_ZOOM*factor,x,y);
},{passive:false});

/* iOS Safariではネイティブのページ拡大 gesture がPointer Eventsより優先される場合がある。
   星図上のピンチは常に星図ズームとして処理し、ページ自体の拡大を抑止する。 */
let SKY_IOS_GESTURE_ACTIVE=false;
let SKY_IOS_GESTURE_START_ZOOM=1;
skyInteraction.addEventListener("touchmove",event=>{
  if(event.touches&&event.touches.length>=2)event.preventDefault();
},{passive:false});
skyInteraction.addEventListener("gesturestart",event=>{
  event.preventDefault();
  SKY_IOS_GESTURE_ACTIVE=true;
  SKY_IOS_GESTURE_START_ZOOM=SKY_ZOOM;
},{passive:false});
skyInteraction.addEventListener("gesturechange",event=>{
  if(!SKY_IOS_GESTURE_ACTIVE)return;
  event.preventDefault();
  const scale=Number(event.scale)||1;
  SKY_ZOOM=clampSkyZoom(SKY_IOS_GESTURE_START_ZOOM*scale);
  if(SKY_ZOOM<=1.001){SKY_PAN_X=0;SKY_PAN_Y=0;}
  requestSkyInteractiveRender();
},{passive:false});
skyInteraction.addEventListener("gestureend",event=>{
  event.preventDefault();
  SKY_IOS_GESTURE_ACTIVE=false;
  if(Math.abs(SKY_ZOOM-1)<0.035)resetSkyZoom();
  else{limitSkyPan();renderSkyChart();}
},{passive:false});

skyInteraction.addEventListener("pointerdown",event=>{
const p0=skyEventPoint(event);
skyInteraction.setPointerCapture(event.pointerId);
SKY_POINTERS.set(event.pointerId,{x:p0.x,y:p0.y});
SKY_POINTER_MOVED=false;
skyInteraction.classList.add("dragging");

if(SKY_POINTERS.size===1){
if(SKY_PROJECTION==="tracking"){
SKY_GESTURE={type:"trackingtap",startX:p0.x,startY:p0.y};
}else if(SKY_PROJECTION==="perspective"){
SKY_GESTURE={
type:"rotate",
startX:p0.x,
startY:p0.y,
az:SKY_PERSPECTIVE_AZ,
alt:SKY_PERSPECTIVE_ALT
};
}else{
const fovEnabled=$("#skyShowFov")?.checked;
const onFov=fovEnabled&&pointInPolygon(p0.x,p0.y,SKY_FOV_HIT_POLYGON);

if(onFov){
SKY_GESTURE={
type:"fovmove",
startX:p0.x,
startY:p0.y
};
}else{
SKY_GESTURE={
type:"pan",
startX:p0.x,
startY:p0.y,
panX:SKY_PAN_X,
panY:SKY_PAN_Y
};
}
}
}else if(SKY_POINTERS.size===2){
if(SKY_IOS_GESTURE_ACTIVE)return;
const pts=[...SKY_POINTERS.values()];
const dx=pts[1].x-pts[0].x,dy=pts[1].y-pts[0].y;
const midX=(pts[0].x+pts[1].x)/2,midY=(pts[0].y+pts[1].y)/2;
SKY_GESTURE={
type:"pinch",
distance:Math.hypot(dx,dy)||1,
zoom:SKY_ZOOM,
panX:SKY_PAN_X,
panY:SKY_PAN_Y,
midX,midY,
az:SKY_PERSPECTIVE_AZ,
alt:SKY_PERSPECTIVE_ALT
};
}
});

skyInteraction.addEventListener("pointermove",event=>{
if(!SKY_POINTERS.has(event.pointerId))return;
const pm=skyEventPoint(event);
SKY_POINTERS.set(event.pointerId,{x:pm.x,y:pm.y});

if(SKY_POINTERS.size===1&&SKY_GESTURE&&SKY_GESTURE.type==="fovmove"&&SKY_PROJECTION==="allsky"){
const dx=pm.x-SKY_GESTURE.startX;
const dy=pm.y-SKY_GESTURE.startY;
if(Math.hypot(dx,dy)>3)SKY_POINTER_MOVED=true;

const canvas=$("#skyMapCanvas");
const cx=canvas.clientWidth/2;
const cy=canvas.clientHeight/2;
const R=Math.min(canvas.clientWidth,canvas.clientHeight)*0.44;
const aa=allSkyCanvasToAltAz(pm.x,pm.y,cx,cy,R);

if(aa){
SKY_FOV_ALLSKY_ALT=aa.alt;
SKY_FOV_ALLSKY_AZ=aa.az;
requestSkyInteractiveRender();
}
}else if(SKY_POINTERS.size===1&&SKY_GESTURE&&SKY_GESTURE.type==="rotate"&&SKY_PROJECTION==="perspective"){
const dx=pm.x-SKY_GESTURE.startX;
const dy=pm.y-SKY_GESTURE.startY;
if(Math.hypot(dx,dy)>3)SKY_POINTER_MOVED=true;

/* 右へドラッグで西側を見る／上へドラッグで見上げる */
const azSensitivity=0.28;
const altSensitivity=0.18;
SKY_PERSPECTIVE_AZ=normalizeAzimuthDeg(SKY_GESTURE.az-dx*azSensitivity);
SKY_PERSPECTIVE_ALT=clampPerspectiveAltitudeDeg(SKY_GESTURE.alt-dy*altSensitivity);

/* 操作中は星図Canvasだけ再描画する。
   方角・仰角表示や天候UIなどのDOM更新は指を離した時に一度だけ行う。 */
requestSkyInteractiveRender();
}else if(SKY_POINTERS.size===1&&SKY_GESTURE&&SKY_GESTURE.type==="pan"&&SKY_ZOOM>1.001){
const dx=pm.x-SKY_GESTURE.startX;
const dy=pm.y-SKY_GESTURE.startY;
if(Math.hypot(dx,dy)>3)SKY_POINTER_MOVED=true;
SKY_PAN_X=SKY_GESTURE.panX+dx;
SKY_PAN_Y=SKY_GESTURE.panY+dy;
limitSkyPan();
renderSkyChart();
}else if(SKY_POINTERS.size===2){
if(SKY_IOS_GESTURE_ACTIVE)return;
const pts=[...SKY_POINTERS.values()];
const dx=pts[1].x-pts[0].x,dy=pts[1].y-pts[0].y;
const dist=Math.hypot(dx,dy)||1;
const midX=(pts[0].x+pts[1].x)/2,midY=(pts[0].y+pts[1].y)/2;

if(!SKY_GESTURE||SKY_GESTURE.type!=="pinch"){
SKY_GESTURE={
type:"pinch",
distance:dist,
zoom:SKY_ZOOM,
panX:SKY_PAN_X,
panY:SKY_PAN_Y,
midX,midY,
az:SKY_PERSPECTIVE_AZ,
alt:SKY_PERSPECTIVE_ALT
};
return;
}

SKY_POINTER_MOVED=true;
const newZoom=clampSkyZoom(SKY_GESTURE.zoom*(dist/SKY_GESTURE.distance));

if(isHorizonProjection()){
SKY_ZOOM=newZoom;
requestSkyInteractiveRender();
}else{
const cx=skyCanvas.clientWidth/2,cy=skyCanvas.clientHeight/2;
const worldX=(SKY_GESTURE.midX-cx-SKY_GESTURE.panX)/SKY_GESTURE.zoom;
const worldY=(SKY_GESTURE.midY-cy-SKY_GESTURE.panY)/SKY_GESTURE.zoom;
SKY_ZOOM=newZoom;
SKY_PAN_X=midX-cx-worldX*newZoom;
SKY_PAN_Y=midY-cy-worldY*newZoom;
limitSkyPan();
renderSkyChart();
}
}
});

function finishSkyPointer(event){
SKY_POINTERS.delete(event.pointerId);
if(SKY_POINTERS.size===0){
skyInteraction.classList.remove("dragging");
const finishedGesture=SKY_GESTURE?SKY_GESTURE.type:"";
SKY_GESTURE=null;

if(isHorizonProjection()){
if(SKY_PROJECTION==="perspective")syncPerspectiveSelectors();
updateSkyProjectionUI();
renderSkyChart();
}else if(finishedGesture==="fovmove"){
renderSkyChart();
}
}else if(SKY_POINTERS.size===1){
const p=[...SKY_POINTERS.values()][0];
if(SKY_PROJECTION==="tracking"){
SKY_GESTURE={type:"trackingtap",startX:p.x,startY:p.y};
}else if(SKY_PROJECTION==="perspective"){
SKY_GESTURE={
type:"rotate",
startX:p.x,
startY:p.y,
az:SKY_PERSPECTIVE_AZ,
alt:SKY_PERSPECTIVE_ALT
};
}else{
const fovEnabled=$("#skyShowFov")?.checked;
const onFov=fovEnabled&&pointInPolygon(p.x,p.y,SKY_FOV_HIT_POLYGON);
SKY_GESTURE=onFov
?{type:"fovmove",startX:p.x,startY:p.y}
:{type:"pan",startX:p.x,startY:p.y,panX:SKY_PAN_X,panY:SKY_PAN_Y};
}
}
}
skyInteraction.addEventListener("pointerup",finishSkyPointer);
skyInteraction.addEventListener("pointercancel",finishSkyPointer);

skyInteraction.addEventListener("click",event=>{
if(SKY_POINTER_MOVED){
SKY_POINTER_MOVED=false;
return;
}
const {x,y}=skyEventPoint(event);
if(PLANETARIUM_MODE_ACTIVE&&PLANETARIUM_PICKING_COORDS){
  selectMyStarCoordinateFromSky(x,y);
  return;
}
let best=null,bestDist=Infinity;
SKY_MAP_HITS.forEach(hit=>{
const d=Math.hypot(x-hit.x,y-hit.y);
if(d<=hit.r&&d<bestDist){best=hit;bestDist=d;}
});
showSkyMapHit(best);
});
let skyResizeTimer;
function scheduleSkyViewportRefresh(delay=120){
clearTimeout(skyResizeTimer);
skyResizeTimer=setTimeout(()=>{
  if($("#resultPanel-skymap")?.open){
    renderSkyChart();
    syncSkyInteractionLayer();
  }
},delay);
}
window.addEventListener("resize",()=>scheduleSkyViewportRefresh(100));
window.addEventListener("orientationchange",()=>scheduleSkyViewportRefresh(180));
window.visualViewport?.addEventListener("resize",()=>scheduleSkyViewportRefresh(80));
document.querySelectorAll("[data-dtab]").forEach(b=>{
b.addEventListener("click",()=>{
document.querySelectorAll("[data-dtab]").forEach(x=>x.classList.remove("active"));
document.querySelectorAll(".tab-content").forEach(x=>{if(x.id.startsWith("dtab-"))x.classList.remove("active");});
b.classList.add("active");$("#dtab-"+b.dataset.dtab).classList.add("active");
});
});
document.addEventListener("keydown",event=>{
  if(event.key==="Escape"&&$("#constellationDetailModal")?.classList.contains("open")){
    closeConstellationDetailModal();
  }
});

function closeDetailPopup(){
const modal=$("#detailPopupModal");
if(modal){modal.classList.remove("open");modal.setAttribute("aria-hidden","true");}
document.body.classList.remove("detail-popup-open");
document.querySelectorAll(".obj-card").forEach(c=>c.classList.remove("active"));
}
$("#btnCloseDetail").addEventListener("click",closeDetailPopup);
$("#detailPopupModal").addEventListener("click",event=>{if(event.target===$("#detailPopupModal"))closeDetailPopup();});
$("#sortSel").addEventListener("change",()=>{currentSort=$("#sortSel").value;renderCards(currentResults);});
function sortResults(arr){
const a=[...arr];
if(currentSort==="alt")a.sort((x,y)=>y.alt-x.alt);
else if(currentSort==="mag")a.sort((x,y)=>x.magVal-y.magVal);
else if(currentSort==="diff_asc")a.sort((x,y)=>x.difficulty-y.difficulty);
else if(currentSort==="diff_desc")a.sort((x,y)=>y.difficulty-x.difficulty);
else a.sort((x,y)=>y.score-x.score);
return a;
}
function renderCards(results){
const grid=$("#objGrid");grid.innerHTML="";
const filtered=activeFilter==="all"?results:activeFilter==="messier"?results.filter(o=>o.cat==="メシエ"):activeFilter==="ngc"?results.filter(o=>o.cat==="NGC"||o.cat==="IC"):activeFilter==="star_double"?results.filter(o=>o.type==="star"||o.type==="double"):results.filter(o=>o.type===activeFilter);
const sorted=sortResults(filtered);
$("#noResult").style.display=sorted.length===0?"block":"none";
sorted.forEach(obj=>{
const vis=Math.min(100,Math.max(0,(obj.alt/90)*100));const dl=diffLabel(obj.difficulty);
const card=document.createElement("div");card.className="obj-card";card.dataset.objectId=obj.id;
card.innerHTML=`<div class="card-header"><div class="card-icon">${obj.icon}</div><div class="card-title"><div class="name">${obj.name}</div><div class="type-row"><span class="badge ${TYPE_BADGE[obj.type]||""}">${TYPE_LABEL[obj.type]||obj.type}</span><span style="font-size:11px;color:#5a7a9a">${obj.cat||""}</span><span class="diff-badge diff-${obj.difficulty}">${dl.stars} ${dl.text}</span></div></div></div><div class="card-body"><div class="card-row"><span class="badge b-alt">高度 ${obj.alt}°</span><span class="badge b-az">方位 ${obj.azDir}</span><span class="badge b-mag">等級 ${obj.magVal}</span><span class="badge b-dist">${obj.distStr}</span></div><div style="font-size:12px;color:#7ab4d4;margin-top:8px">🔭 ${obj.highlight}</div><div class="visibility-bar"><div class="visibility-fill" style="width:${vis}%"></div></div></div><div class="card-plan-actions"><button type="button" class="reverse-plan-btn object-detail-btn">詳しく見る</button><button type="button" class="reverse-plan-btn object-sky-btn">星図で見る</button><button type="button" class="reverse-plan-btn object-reverse-btn">いつ・どこで見る？</button></div>`;
card.addEventListener("click",()=>showDetail(obj,card));
const detailBtn=card.querySelector(".object-detail-btn");
detailBtn.addEventListener("click",e=>{e.stopPropagation();showDetail(obj,card);});
const skyBtn=card.querySelector(".object-sky-btn");
skyBtn.addEventListener("click",e=>{e.stopPropagation();focusObjectOnSky(obj);});
const planBtn=card.querySelector(".object-reverse-btn");
planBtn.addEventListener("click",e=>{e.stopPropagation();openReversePlanner("object",obj);});
grid.appendChild(card);
});
}
function getRecommendComment(obj){
if(obj.type==="planet")return"案内しやすく反応が良い定番天体です。";
if(obj.type==="star"||obj.type==="double")return"まず最初の導入に向く見つけやすい対象です。";
if(obj.type==="cluster")return"双眼鏡や低倍率でも楽しみやすい対象です。";
if(obj.type==="nebula")return"空の暗さが活きる、印象に残りやすい対象です。";
if(obj.type==="galaxy")return"距離スケールの話題につなげやすい対象です。";
return"今夜の観望候補としておすすめです。";
}
function getRecommendTag(obj,idx){
if(idx===0)return"最優先";
if(obj.type==="planet")return"初心者向け";
if(obj.type==="cluster")return"双眼鏡向け";
if(obj.type==="double")return"色の対比";
if(obj.type==="galaxy")return"宇宙の広がり";
if(obj.type==="nebula")return"見栄え良好";
return"おすすめ";
}
function recommendationRaDec(obj,date){
if(!obj||!(date instanceof Date)||isNaN(date))return null;
if(obj.type==="planet"){
const p=planetRaDec(obj.planet,toJD(date));
return p&&Number.isFinite(p.ra)&&Number.isFinite(p.dec)?{ra:p.ra,dec:p.dec}:null;
}
if(Number.isFinite(Number(obj.ra))&&Number.isFinite(Number(obj.dec))){
return{ra:Number(obj.ra),dec:Number(obj.dec)};
}
return null;
}

function solarRecommendationAdjustment(obj,date,lat,lon){
if(!(date instanceof Date)||isNaN(date)||!Number.isFinite(lat)||!Number.isFinite(lon)){
return{blocked:false,penalty:0,label:"太陽条件未計算",sunAlt:null,sep:null};
}
const jd=toJD(date);
const sun=sunPosition(jd);
const saa=altAz(sun.ra,sun.dec,lat,lon,date);
const rd=recommendationRaDec(obj,date);
const sep=rd?angularSeparationDeg(rd.ra,rd.dec,sun.ra,sun.dec):180;
const mag=Number.isFinite(Number(obj.magVal))?Number(obj.magVal):Number(obj.mag)||6;

if(saa.alt<=-18){
return{blocked:false,penalty:0,label:"夜空",sunAlt:saa.alt,sep};
}

const sensitivity={
planet:0.10,star:0.20,double:0.25,cluster:0.58,nebula:0.95,galaxy:1.00,snr:0.98
}[obj.type]??0.60;

let stageLabel,brightness;
if(saa.alt<=-12){stageLabel="天文薄明";brightness=(saa.alt+18)/6*0.18;}
else if(saa.alt<=-6){stageLabel="航海薄明";brightness=0.18+(saa.alt+12)/6*0.28;}
else if(saa.alt<=0){stageLabel="市民薄明";brightness=0.46+(saa.alt+6)/6*0.34;}
else{stageLabel="昼光";brightness=0.80+Math.min(0.20,saa.alt/60);}

/* 太陽から離れるほど散乱光の影響が相対的に小さい、という簡易補正 */
const sepRelief=Math.max(0,Math.min(1,(sep-12)/108));
const penalty=22*brightness*sensitivity*(1-0.42*sepRelief);

/* 星図の昼光モデルを基準にし、太陽離角が大きい場合だけ少し緩和 */
let limit=daylightLimitingMagnitude(saa.alt,7);
if(saa.alt>0)limit+=1.25*sepRelief;
else if(saa.alt>-6)limit+=0.85*sepRelief;
else limit+=0.45*sepRelief;

let blocked=false;
if(saa.alt>0){
/* 日中の深宇宙天体はおすすめから外す。明るい恒星・惑星等は離角と等級で残す */
if(!["planet","star","double"].includes(obj.type))blocked=true;
if(sep<8)blocked=true;
if(mag>limit)blocked=true;
}else if(saa.alt>-6){
if(["galaxy","nebula","snr"].includes(obj.type)&&mag>1.5)blocked=true;
if(mag>limit+1.5&&sensitivity>=0.55)blocked=true;
}else if(saa.alt>-12){
if(mag>limit+2.0&&sensitivity>=0.9)blocked=true;
}

let label=stageLabel;
if(saa.alt>0){
label=`昼光 / 太陽離角 ${Math.round(sep)}°${blocked?"":" / 明るい天体候補"}`;
}else if(saa.alt>-18){
label=`${stageLabel} / 太陽高度 ${saa.alt.toFixed(0)}°`;
}

return{blocked,penalty,label,sunAlt:saa.alt,sep,limit};
}

function moonRecommendationAdjustment(obj,date,lat,lon){
if(!(date instanceof Date)||isNaN(date)||!Number.isFinite(lat)||!Number.isFinite(lon)){
return{blocked:false,penalty:0,label:"月条件未計算",impact:0};
}
const moon=moonPosition(toJD(date));
const maa=altAz(moon.ra,moon.dec,lat,lon,date);
const phase=moonPhaseInfo(date);
const illum=Math.max(0,Math.min(100,Number(phase.moonIllum)||0))/100;
if(maa.alt<=-2||illum<0.10){
return{blocked:false,penalty:0,label:maa.alt<=-2?"月は地平線下":"月明かり 小",impact:0};
}

const rd=recommendationRaDec(obj,date);
const sep=rd?angularSeparationDeg(rd.ra,rd.dec,moon.ra,moon.dec):120;
const altitudeFactor=Math.max(0,Math.sin(Math.max(0,Math.min(90,maa.alt))*D2R));
const brightness=Math.pow(illum,0.65)*Math.pow(altitudeFactor,0.70);
const separationFactor=0.55+1.25*Math.exp(-sep/42);
const sensitivity={
planet:0.03,star:0.06,double:0.10,cluster:0.42,nebula:0.86,galaxy:1.00,snr:0.95
}[obj.type]??0.55;
const mag=Number.isFinite(Number(obj.magVal))?Number(obj.magVal):Number(obj.mag)||6;
const faint=Math.max(0,Math.min(1,(mag-2)/8));
const impact=brightness*separationFactor;
const penalty=18*impact*sensitivity*(0.55+0.65*faint);

const blocked=
penalty>=9.0 ||
(brightness>=0.72 && sensitivity>=0.85 && mag>=6.0) ||
(brightness>=0.82 && sensitivity>=0.90 && sep<70 && mag>=5.0);

let label="月明かり 小";
if(impact>=0.95)label="月明かり 大";
else if(impact>=0.48)label="月明かり 中";
return{blocked,penalty,label,impact,moonAlt:maa.alt,illum:Math.round(illum*100),sep};
}

function renderRecommendations(results){
const grid=$("#recommendGrid");
if(!grid)return;
grid.innerHTML="";
const lat=Number.isFinite(currentLat)?currentLat:parseFloat($("#inLat").value);
const lon=Number.isFinite(currentLon)?currentLon:parseFloat($("#inLon").value);
const date=currentDate instanceof Date&&!isNaN(currentDate)?currentDate:new Date($("#inDatetime").value||Date.now());
const weighted=results.map(obj=>{
const moon=moonRecommendationAdjustment(obj,date,lat,lon);
const solar=solarRecommendationAdjustment(obj,date,lat,lon);
return{obj,moon,solar,visibilityScore:obj.score-moon.penalty-solar.penalty};
});
const usable=weighted
.filter(x=>!x.moon.blocked&&!x.solar.blocked)
.sort((a,b)=>b.visibilityScore-a.visibilityScore);
const picks=usable.slice(0,8);
if(picks.length===0){
grid.innerHTML=`<div class="recommend-card"><div class="r-text">現在の太陽光・薄明・月明かり・高度条件を合わせると、おすすめできる候補がありません。時間帯を変えるか、最低高度・等級上限を見直してください。</div></div>`;
return;
}
picks.forEach((item,idx)=>{
const obj=item.obj;
const moon=item.moon;
const solar=item.solar;
const dl=diffLabel(obj.difficulty);
const div=document.createElement("div");
div.className="recommend-card";
div.innerHTML=`<div class="rec-tag">${getRecommendTag(obj,idx)}</div><div class="r-head"><div class="r-icon">${obj.icon}</div><div><div class="r-title">${obj.name}</div><div class="r-sub">${TYPE_LABEL[obj.type]||obj.type} / 高度 ${obj.alt}° / ${dl.text}</div></div></div><div class="r-text">🔭 ${obj.highlight}<br>${getRecommendComment(obj)}<br>☀️ ${solar.label}<br>🌙 ${moon.label}</div><div class="recommend-actions"><button type="button" class="reverse-plan-btn recommend-detail-btn">詳しく見る</button><button type="button" class="reverse-plan-btn recommend-sky-btn">星図で表示</button></div>`;
div.addEventListener("click",()=>{
const found=currentResults.find(r=>r.id===obj.id) || obj;
showDetail(found,null);
});
div.querySelector(".recommend-detail-btn").addEventListener("click",e=>{
e.stopPropagation();
const found=currentResults.find(r=>r.id===obj.id) || obj;
showDetail(found,null);
});
div.querySelector(".recommend-sky-btn").addEventListener("click",e=>{
e.stopPropagation();
const found=currentResults.find(r=>r.id===obj.id) || obj;
focusObjectOnSky(found);
});
grid.appendChild(div);
});
}

function moonPickerHint(illum){
if(illum<=15)return{label:"暗い空を狙いやすい",cls:"dark"};
if(illum>=85)return{label:"月明かりが強い",cls:"bright"};
return{label:"",cls:""};
}

function currentObservationTimeParts(){
const raw=$("#inDatetime")?$("#inDatetime").value:"";
const m=String(raw||"").match(/T(\d{2}):(\d{2})/);
return m?{hour:Number(m[1]),minute:Number(m[2])}:{hour:21,minute:0};
}

function setObservationDateToAstronomicalTwilightStart(date){
stopLiveNowMode();
const lat=parseFloat($("#inLat").value);
const lon=parseFloat($("#inLon").value);
const p=n=>String(n).padStart(2,"0");

/* 夕方の天文薄明開始：太陽高度 -12° を下降中に通過する時刻 */
const dayStart=new Date(date.getFullYear(),date.getMonth(),date.getDate(),0,0,0,0);
let twilightStart=null;

if(Number.isFinite(lat)&&Number.isFinite(lon)){
twilightStart=findAltCrossing(sunAlt,lat,lon,dayStart,-12,false);
}

if(twilightStart instanceof Date&&!isNaN(twilightStart)){
$("#inDatetime").value=
`${twilightStart.getFullYear()}-${p(twilightStart.getMonth()+1)}-${p(twilightStart.getDate())}T${p(twilightStart.getHours())}:${p(twilightStart.getMinutes())}`;
}else{
const t=currentObservationTimeParts();
$("#inDatetime").value=
`${date.getFullYear()}-${p(date.getMonth()+1)}-${p(date.getDate())}T${p(t.hour)}:${p(t.minute)}`;
}
}

function renderMoonDatePicker(baseDate){
const grid=$("#moonDateGrid"),label=$("#moonDateMonthLabel");
if(!grid||!label)return;
const y=baseDate.getFullYear(),m=baseDate.getMonth();
label.textContent=`${y}年${m+1}月`;
grid.innerHTML="";

const first=new Date(y,m,1,12,0,0);
const startDay=first.getDay();
const daysInMonth=new Date(y,m+1,0).getDate();
const prevLast=new Date(y,m,0).getDate();
const today=new Date();

const selectedRaw=$("#inDatetime")?$("#inDatetime").value:"";
const selected=selectedRaw?new Date(selectedRaw):null;

const cells=[];
for(let i=0;i<startDay;i++){
const n=prevLast-startDay+i+1;
cells.push({date:new Date(y,m-1,n,12,0,0),num:n,other:true});
}
for(let n=1;n<=daysInMonth;n++){
cells.push({date:new Date(y,m,n,12,0,0),num:n,other:false});
}
while(cells.length%7!==0){
const n=cells.length-(startDay+daysInMonth)+1;
cells.push({date:new Date(y,m+1,n,12,0,0),num:n,other:true});
}

cells.forEach(c=>{
const info=moonPhaseInfo(c.date);
const hint=moonPickerHint(info.moonIllum);
const isToday=
c.date.getFullYear()===today.getFullYear()&&
c.date.getMonth()===today.getMonth()&&
c.date.getDate()===today.getDate();
const isSelected=selected&&!isNaN(selected)&&
c.date.getFullYear()===selected.getFullYear()&&
c.date.getMonth()===selected.getMonth()&&
c.date.getDate()===selected.getDate();

const btn=document.createElement("button");
btn.type="button";
btn.className=`moon-picker-day${c.other?" other":""}${isToday?" today":""}${isSelected?" selected":""}`;
btn.setAttribute("aria-label",`${c.date.getFullYear()}年${c.date.getMonth()+1}月${c.date.getDate()}日、${getMoonPhaseName(info.moonAge)}、輝面${info.moonIllum}%`);
btn.innerHTML=`
<div class="moon-picker-num">${c.num}</div>
<div class="moon-picker-phase">${info.moonPhase}</div>
<div class="moon-picker-illum">${info.moonIllum}%</div>
<div class="moon-picker-hint ${hint.cls}">${hint.label}</div>`;
btn.addEventListener("click",()=>{
setObservationDateToAstronomicalTwilightStart(c.date);
closeMoonDatePicker();
});
grid.appendChild(btn);
});
}

function openMoonDatePicker(){
const modal=$("#moonDatePickerModal");
if(!modal)return;
const raw=$("#inDatetime")?$("#inDatetime").value:"";
const d=raw?new Date(raw):new Date();
moonDatePickerBaseDate=new Date(
Number.isFinite(d.getTime())?d.getFullYear():new Date().getFullYear(),
Number.isFinite(d.getTime())?d.getMonth():new Date().getMonth(),
1
);
renderMoonDatePicker(moonDatePickerBaseDate);
modal.classList.add("open");
modal.setAttribute("aria-hidden","false");
document.body.classList.add("manual-open");
}

function closeMoonDatePicker(){
const modal=$("#moonDatePickerModal");
if(!modal)return;
modal.classList.remove("open");
modal.setAttribute("aria-hidden","true");
document.body.classList.remove("manual-open");
}

function setObservationDateFromCalendar(date){
stopLiveNowMode();
const parts=currentObservationTimeParts();
const target=new Date(date.getFullYear(),date.getMonth(),date.getDate(),parts.hour,parts.minute,0,0);
$("#inDatetime").value=toDatetimeLocalValue(target);
$("#btnCalc").click();
activateResultTab("mooncalendar");
}

function renderMoonCalendar(baseDate){
const grid=$("#moonCalGrid"),title=$("#moonCalTitle"),detail=$("#moonCalDetail");
if(!grid||!title||!detail)return;
const y=baseDate.getFullYear(),m=baseDate.getMonth();
title.textContent=`月の満ち欠けカレンダー ${y}年${String(m+1).padStart(2,"0")}月`;
const first=new Date(y,m,1),startDay=first.getDay(),daysInMonth=new Date(y,m+1,0).getDate();
const prevLast=new Date(y,m,0).getDate();
const today=new Date();
const weekNames=["日","月","火","水","木","金","土"];
grid.innerHTML=weekNames.map(w=>`<div class="mooncal-week">${w}</div>`).join("");
const cells=[];
for(let i=0;i<startDay;i++){
const dnum=prevLast-startDay+i+1;
const d=new Date(y,m-1,dnum,12,0,0);
cells.push({date:d,num:dnum,other:true});
}
for(let dnum=1;dnum<=daysInMonth;dnum++){
cells.push({date:new Date(y,m,dnum,12,0,0),num:dnum,other:false});
}
while(cells.length%7!==0){
const dnum=cells.length-(startDay+daysInMonth)+1;
cells.push({date:new Date(y,m+1,dnum,12,0,0),num:dnum,other:true});
}
cells.forEach(c=>{
const info=moonPhaseInfo(c.date);

const lat=parseFloat($("#inLat").value);
const lon=parseFloat($("#inLon").value);

let skyInfo=null;

if(Number.isFinite(lat) && Number.isFinite(lon)){
skyInfo=calcSkyInfo(lat,lon,c.date);
}

const astroStart=skyInfo?fmtTime(skyInfo.astroStart):"—";
const astroEnd=skyInfo?fmtTime(skyInfo.astroEnd):"—";
const moonRise=skyInfo?fmtTime(skyInfo.moonRise):"—";
const moonSet=skyInfo?fmtTime(skyInfo.moonSet):"—";

const isToday=
c.date.getFullYear()===today.getFullYear()&&
c.date.getMonth()===today.getMonth()&&
c.date.getDate()===today.getDate();

const div=document.createElement("div");

div.className=`mooncal-day${c.other?" other":""}${isToday?" today":""}`;

div.innerHTML=`
<div class="mooncal-num">${c.num}</div>
<div class="mooncal-phase">${info.moonPhase}</div>
<div class="mooncal-age">月齢 ${info.moonAge}</div>
<div class="mooncal-illum">輝面 ${info.moonIllum}%</div>
<div class="mooncal-times">
<div class="twilight-time">🌆 終 ${astroStart}</div>
<div class="twilight-time">🌅 始 ${astroEnd}</div>
<div class="moon-time">🌙 出 ${moonRise} / 入 ${moonSet}</div>
</div>
`;

div.addEventListener("click",()=>{
detail.innerHTML=`
<b>${c.date.getFullYear()}年${String(c.date.getMonth()+1).padStart(2,"0")}月${String(c.date.getDate()).padStart(2,"0")}日</b><br>
${info.moonPhase} ${getMoonPhaseName(info.moonAge)}<br>
月齢 ${info.moonAge}日 / 輝面比 ${info.moonIllum}%<br><br>
🌆 天文薄明 終了（夕） ${astroStart}<br>
🌅 天文薄明 開始（朝） ${astroEnd}<br>
🌙 月の出 ${moonRise}<br>
🌙 月の入り ${moonSet}
<div class="mooncal-detail-actions"><button type="button" class="mooncal-apply-date">この日を観測日時に設定</button></div>
`;
const applyBtn=detail.querySelector(".mooncal-apply-date");
if(applyBtn)applyBtn.addEventListener("click",()=>setObservationDateFromCalendar(c.date));
});

grid.appendChild(div);
});
}

function renderTonightSkyWeather(date){
const weatherCard=$("#skyTonightWeather");
const gradeCard=$("#skyTonightWeatherGrade");
if(!weatherCard||!gradeCard)return;

if(WEATHER_LOADING){
weatherCard.innerHTML='<div class="sky-label">☁️ 天気</div><div class="sky-val" style="font-size:13px">取得中…</div><div class="sky-sub">Open-Meteoから予報を取得しています</div>';
gradeCard.innerHTML='<div class="sky-label">🔭 観測条件</div><div class="sky-val">…</div><div class="sky-sub">天候データ待機中</div>';
return;
}

const row=weatherRowAt(date);
if(!row){
weatherCard.innerHTML='<div class="sky-label">☁️ 天気</div><div class="sky-val" style="font-size:13px">予報なし</div><div class="sky-sub">この日時の予報は取得できません</div>';
gradeCard.innerHTML='<div class="sky-label">🔭 観測条件</div><div class="sky-val">—</div><div class="sky-sub">評価できません</div>';
return;
}

const num=v=>Number.isFinite(Number(v))?Number(v):null;
const cloud=num(row.cloud_cover);
const pp=num(row.precipitation_probability);
const wind=num(row.wind_speed_10m);
const temp=num(row.temperature_2m);
const rh=num(row.relative_humidity_2m);
const vis=num(row.visibility);

const comparison=getModelComparison(date);
const ev=integratedWeatherGrade(row,comparison);
const rainMismatchWarning=(comparison.agreement==="低" && pp!==null && pp>=20)
  ? `<div class="sky-weather-caution">予報外れの雨に打たれるかもしれません</div>`
  : "";

weatherCard.innerHTML=`
<div class="sky-label">☁️ 天気</div>
<div class="sky-val">${weatherCodeJa(row.weather_code)}</div>
<div class="sky-sub">${weatherSavedLabel(WEATHER_META)}雲量 ${cloud===null?"—":Math.round(cloud)+"%"} / 降水 ${pp===null?"—":Math.round(pp)+"%"}</div>
<div class="sky-sub">気温 ${temp===null?"—":temp.toFixed(1)+"℃"} / 風 ${wind===null?"—":wind.toFixed(1)+"m/s"}</div>
${rainMismatchWarning}`;
const extra=[];
if(vis!==null)extra.push(`視程 ${(vis/1000).toFixed(1)}km`);
if(rh!==null)extra.push(`湿度 ${Math.round(rh)}%`);

let compareHtml="";
if(WEATHER_MODEL_LOADING){
compareHtml=`<div class="model-compare">3モデルの雲量を比較中…</div>`;
}else if(comparison.count>0){
const modelLines=comparison.rows.map(m=>
`<span><b>${m.label}</b> ${Number.isFinite(m.cloud)?Math.round(m.cloud)+"%":"—"}</span>`
).join(" / ");

const modelSaved=WEATHER_MODEL_META?.fromLocalCache
  ? (WEATHER_MODEL_META?.stale?" / 保存済み比較（更新待ち）":" / 保存済み比較")
  : "";
compareHtml=`
<div class="sky-sub">雲量中央値 ${comparison.medianCloud===null?"—":Math.round(comparison.medianCloud)+"%"}</div>
<div class="sky-sub">予報一致度：<span class="${comparison.agreementClass||""}">${comparison.agreement||"—"}</span>${modelSaved}</div>
<div class="model-compare">${modelLines}</div>`;
}else{
compareHtml=`<div class="sky-sub">3モデル比較データなし</div>`;
}

gradeCard.innerHTML=`
<div class="sky-label">🔭 観測目安</div>
<div class="sky-val">${ev.grade} ${ev.label}</div>
${compareHtml}
${extra.length?`<div class="sky-sub">${extra.join(" / ")}</div>`:""}`;
}

function skyTimeCard(cls,label,dt,sub=""){
const valid=dt instanceof Date&&!isNaN(dt);
return `<button type="button" class="sky-card ${cls} sky-time-card${valid?" tappable":""}" ${valid?`data-sky-time="${dt.getTime()}"`:"disabled"}><div class="sky-label">${label}</div><div class="sky-val">${fmtTime(dt)}</div>${sub?`<div class="sky-sub">${sub}</div>`:""}${valid?'<div class="sky-tap-hint">タップで星図をこの時刻へ</div>':""}</button>`;
}


let SKY_INFO_DAY_OFFSET=0;
let SKY_INFO_TOUCH_START=null;

function skyInfoDisplayDate(baseDate=currentDate){
  const base=(baseDate instanceof Date&&!isNaN(baseDate))?baseDate:new Date();
  const d=new Date(base);
  d.setDate(d.getDate()+SKY_INFO_DAY_OFFSET);
  return d;
}
function formatSkyInfoDate(date){
  if(!(date instanceof Date)||isNaN(date))return "";
  const wd=["日","月","火","水","木","金","土"];
  return `${date.getFullYear()}年${date.getMonth()+1}月${date.getDate()}日（${wd[date.getDay()]}）`;
}
function setSkyInfoDayOffset(nextOffset,direction=0){
  SKY_INFO_DAY_OFFSET=Number.isFinite(nextOffset)?Math.trunc(nextOffset):0;
  const body=$("#skyInfoPanel .sky-info-details-body");
  if(body&&direction){
    const cls=direction>0?"sky-info-swipe-left":"sky-info-swipe-right";
    body.classList.add(cls);
    setTimeout(()=>body.classList.remove(cls),130);
  }
  if(Number.isFinite(currentLat)&&Number.isFinite(currentLon)&&currentDate instanceof Date&&!isNaN(currentDate)){
    renderSkyInfo(currentLat,currentLon,currentDate);
  }
}
function changeSkyInfoDay(delta){
  if(!Number.isFinite(delta)||!delta)return;
  setSkyInfoDayOffset(SKY_INFO_DAY_OFFSET+delta,delta);
}
function installSkyInfoSwipe(){
  const body=$("#skyInfoPanel .sky-info-details-body");
  if(!body||body.dataset.swipeReady==="1")return;
  body.dataset.swipeReady="1";
  body.addEventListener("touchstart",event=>{
    if(event.touches.length!==1){SKY_INFO_TOUCH_START=null;return;}
    const t=event.touches[0];
    SKY_INFO_TOUCH_START={x:t.clientX,y:t.clientY,time:Date.now()};
  },{passive:true});
  body.addEventListener("touchend",event=>{
    if(!SKY_INFO_TOUCH_START||event.changedTouches.length!==1)return;
    const t=event.changedTouches[0];
    const dx=t.clientX-SKY_INFO_TOUCH_START.x;
    const dy=t.clientY-SKY_INFO_TOUCH_START.y;
    const dt=Date.now()-SKY_INFO_TOUCH_START.time;
    SKY_INFO_TOUCH_START=null;
    if(dt>800||Math.abs(dx)<55||Math.abs(dx)<Math.abs(dy)*1.25)return;
    if(dx<0)changeSkyInfoDay(1);
    else changeSkyInfoDay(-1);
  },{passive:true});
}

function renderSkyInfo(lat,lon,date){
const displayDate=skyInfoDisplayDate(date);
const info=calcSkyInfo(lat,lon,displayDate);
const dateEl=$("#skyInfoDate");
if(dateEl)dateEl.textContent=formatSkyInfoDate(displayDate);
$("#skyGrid").innerHTML=`
${skyTimeCard("sun","☀️ 日の出",info.sunrise)}
${skyTimeCard("sun","🌇 日の入り",info.sunset)}
${skyTimeCard("twilight","🌆 天文薄明 終了（夕）",info.astroStart)}
${skyTimeCard("twilight","🌅 天文薄明 開始（朝）",info.astroEnd)}
${skyTimeCard("moon",`${info.moonPhase||"🌙"} 月の出`,info.moonRise)}
${skyTimeCard("moon",`${info.moonPhase||"🌙"} 月の入り`,info.moonSet)}
<div class="sky-card moon"><div class="sky-label">🌙 月齢</div><div class="sky-val">${info.moonAge!==null?info.moonAge+"日":"—"}</div><div class="sky-sub">輝面比 ${info.moonIllum!==null?info.moonIllum+"%":"—"}</div></div>
<div class="sky-card moon"><div class="sky-label">月相</div><div class="sky-val" style="font-size:28px">${info.moonPhase||"—"}</div><div class="sky-sub">${getMoonPhaseName(info.moonAge)}</div></div>
<div class="sky-card weather" id="skyTonightWeather"></div>
<div class="sky-card weather-grade" id="skyTonightWeatherGrade"></div>`;

$("#skyGrid").querySelectorAll("[data-sky-time]").forEach(card=>{
card.addEventListener("click",()=>{
const ms=Number(card.dataset.skyTime);
if(!Number.isFinite(ms))return;
SKY_VIEW_DATE=new Date(ms);
switchResultTab("skymap");
requestAnimationFrame(()=>renderSkyChart());
});
});
renderTonightSkyWeather(displayDate);
renderPolarScopeGuide(lat,lon,date);
installSkyInfoSwipe();
}
const SEASON_CLASS={spring:"s-spring",summer:"s-summer",autumn:"s-autumn",winter:"s-winter",circumpolar:"s-circumpolar"};
function renderConstellations(month,query){
const grid=$("#constGrid");grid.innerHTML="";
const q=(query||"").trim().toLowerCase();
const lat=currentLat, lon=currentLon, date=currentDate;
const hasContext=(lat!==undefined && lon!==undefined && date);
let list=CONSTELLATIONS_ENRICHED.map(c=>{
let alt=null;
if(hasContext){const co=CONST_COORD[c.id];if(co)alt=Math.round(altitude(co[0],co[1],lat,lon,date)*10)/10;}
return {...c,_alt:alt};
});
if(hasContext){list=list.filter(c=>c._alt!==null && c._alt>=10);list.sort((a,b)=>b._alt-a._alt);}
else if(month){list=list.filter(c=>c.months.includes(month));}
if(q)list=list.filter(c=>c.name.toLowerCase().includes(q)||c.en.toLowerCase().includes(q)||c.story.toLowerCase().includes(q)||c.science.toLowerCase().includes(q)||c.myth.toLowerCase().includes(q)||(c.stars||"").toLowerCase().includes(q));
$("#constCount").textContent=hasContext?`現在この空に見えている星座：${list.length}件（高度の高い順）`:`${list.length}件の星座を表示中`;
if(list.length===0){grid.innerHTML=`<div style="color:#4a6a8a;padding:20px">この条件で見えている星座が見つかりませんでした。時間帯や場所を変えてみてください。</div>`;return;}
list.forEach((c,idx)=>{
const card=document.createElement("div");card.className="const-card";card.dataset.constellationId=c.id;
let altBadge="";
if(c._alt!==null && c._alt!==undefined){
const col=c._alt>50?"#4ade80":c._alt>25?"#fbbf24":"#fb923c";
altBadge=`<span class="season-badge" style="background:#0a1e2e;color:${col}">現在の高度 ${c._alt}°</span>`;
}
const key=`const_${idx}_${c.id}`;
card.innerHTML=`
<h4>✨ ${c.name} <span style="font-size:12px;color:#6a8aaa">${c.en}（${c.abbr}）</span></h4>
<div class="const-meta"><span class="season-badge ${SEASON_CLASS[c.season]||""}">${SEASON_LABEL[c.season]||c.season}</span>${altBadge}　主な星：${c.stars}</div>
<div class="const-tabs">
<button class="const-tab-btn active" data-consttab="${key}" data-pane="science">🔬 科学</button>
<button class="const-tab-btn" data-consttab="${key}" data-pane="myth">🏛 神話・由来</button>
</div>
<div class="const-pane active" data-constpane="${key}" data-pane="science"><p>${c.science}</p></div>
<div class="const-pane" data-constpane="${key}" data-pane="myth"><p>${c.myth}</p></div>
<div class="const-plan-actions">
<button type="button" class="const-sky-btn" data-sky-const="${c.id}">🗺 星図で見る</button>
<button type="button" class="reverse-plan-btn const-reverse-btn" data-reverse-const="${c.id}">いつ・どこで見る？</button>
</div>
`;
grid.appendChild(card);
});
grid.querySelectorAll(".const-tab-btn").forEach(btn=>{
btn.addEventListener("click",()=>{
const key=btn.dataset.consttab;
const pane=btn.dataset.pane;
grid.querySelectorAll(`.const-tab-btn[data-consttab="${key}"]`).forEach(x=>x.classList.remove("active"));
grid.querySelectorAll(`.const-pane[data-constpane="${key}"]`).forEach(x=>x.classList.remove("active"));
btn.classList.add("active");
const target=grid.querySelector(`.const-pane[data-constpane="${key}"][data-pane="${pane}"]`);
if(target)target.classList.add("active");
});
});

grid.querySelectorAll(".const-sky-btn").forEach(btn=>{
btn.addEventListener("click",()=>{
focusConstellationOnSky(btn.dataset.skyConst);
});
});
grid.querySelectorAll(".const-reverse-btn").forEach(btn=>{
btn.addEventListener("click",()=>{
const c=CONSTELLATIONS_ENRICHED.find(x=>x.id===btn.dataset.reverseConst);
if(c)openReversePlanner("constellation",c);
});
});
}
function toDatetimeLocalValue(date){
if(!(date instanceof Date)||isNaN(date))return"";
const p=n=>String(n).padStart(2,"0");
return`${date.getFullYear()}-${p(date.getMonth()+1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}`;
}

$("#syncResultsToSkyTime").addEventListener("click",()=>{
stopLiveNowMode();
const skyDate=getSkyViewDate();
if(!(skyDate instanceof Date)||isNaN(skyDate))return;
$("#inDatetime").value=toDatetimeLocalValue(skyDate);
$("#btnCalc").click();
});

$("#btnCalc").addEventListener("click",()=>{
const dtVal=$("#inDatetime").value;
const lat=parseFloat($("#inLat").value);const lon=parseFloat($("#inLon").value);
const minAlt=parseInt($("#inMinAlt").value);const maxMag=parseFloat($("#inMaxMag").value);
const place=$("#inPlace").value||"指定場所";
if(!dtVal||isNaN(lat)||isNaN(lon)){alert("日時・緯度・経度を正しく入力してください。");return;}
const date=new Date(dtVal);
currentLat=lat;currentLon=lon;currentDate=date;
SKY_INFO_DAY_OFFSET=0;
SKY_VIEW_DATE=new Date(date);

/* 観測地点確定時に天候予報を取得。オフライン時は保存済みAPI応答を利用できる場合がある。 */
loadWeatherForecast(lat,lon);

/* 流星群は同じ年のデータなら観測条件だけ再計算 */
if(METEOR_SHOWERS.length){
if(meteorLoadedYear===date.getFullYear()){
renderMeteorShowers();
}else{
METEOR_SHOWERS=[];meteorLoadedYear=null;
if($("#meteorStatus")){
$("#meteorStatus").className="meteor-status";
$("#meteorStatus").textContent=`観測年が${date.getFullYear()}年に変わりました。「最新データを取得」で更新してください。`;
}
}
}

/* 今夜の彗星データは手動更新まで保持する */
if(NIGHT_COMET_META){
renderSmallBodyCards();
updateSmallBodyStoredStatus("保存データを保持中");
}else{
updateSmallBodyStoredStatus();
}

const results=calcObjects(lat,lon,date,minAlt,maxMag);currentResults=results;
const pad=n=>String(n).padStart(2,"0");
$("#resDate").textContent=`${date.getFullYear()}年${pad(date.getMonth()+1)}月${pad(date.getDate())}日 ${pad(date.getHours())}:${pad(date.getMinutes())}`;
$("#resLoc").textContent=`📍 ${place}　緯度 ${lat}° / 経度 ${lon}°　最低高度 ${minAlt}°以上 / ${maxMag}等以下`;
$("#resCount").textContent=`✅ 観測可能天体：${results.length}件（メシエ：${results.filter(o=>o.cat==="メシエ").length}件 / NGC・IC：${results.filter(o=>o.cat==="NGC"||o.cat==="IC").length}件 / 恒星・二重星：${results.filter(o=>o.type==="star"||o.type==="double").length}件 / 惑星：${results.filter(o=>o.type==="planet").length}件）`;
renderSkyInfo(lat,lon,date);
renderSkyChart();
const types=[...new Set(results.map(o=>o.type))];
const fb=$("#filterBar");fb.innerHTML=`<button class="filter-btn on" data-f="all">すべて（${results.length}）</button>`;
const cc={};results.forEach(o=>{cc[o.type]=(cc[o.type]||0)+1;});
types.forEach(t=>{fb.innerHTML+=`<button class="filter-btn" data-f="${t}">${TYPE_LABEL[t]||t}（${cc[t]}）</button>`;});
const mCnt=results.filter(o=>o.cat==="メシエ").length,nCnt=results.filter(o=>o.cat==="NGC"||o.cat==="IC").length,sCnt=results.filter(o=>o.type==="star"||o.type==="double").length;
if(mCnt>0)fb.innerHTML+=`<button class="filter-btn" data-f="messier">メシエのみ（${mCnt}）</button>`;
if(nCnt>0)fb.innerHTML+=`<button class="filter-btn" data-f="ngc">NGC/ICのみ（${nCnt}）</button>`;
if(sCnt>0)fb.innerHTML+=`<button class="filter-btn" data-f="star_double">恒星・二重星（${sCnt}）</button>`;
fb.querySelectorAll(".filter-btn").forEach(b=>{b.addEventListener("click",()=>{fb.querySelectorAll(".filter-btn").forEach(x=>x.classList.remove("on"));b.classList.add("on");activeFilter=b.dataset.f;renderCards(currentResults);});});
activeFilter="all";renderCards(results);
renderRecommendations(results);
moonCalBaseDate=new Date(date.getFullYear(),date.getMonth(),1);
renderMoonCalendar(moonCalBaseDate);
const tbody=$("#scheduleTable tbody");tbody.innerHTML="";
const baseDay=new Date(date.getFullYear(),date.getMonth(),date.getDate()).getTime();
const fmtScheduleTime=d=>{
const dayDiff=Math.round((new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime()-baseDay)/86400000);
const hh=String(d.getHours()).padStart(2,"0"),mm=String(d.getMinutes()).padStart(2,"0");
return `${dayDiff>0?`翌${dayDiff>1?dayDiff+"日":""} `:""}${hh}:${mm}`;
};
sortResults(results).slice(0,15).forEach((obj,i)=>{
const slotStart=new Date(date.getTime()+i*15*60000);
const slotEnd=new Date(slotStart.getTime()+15*60000);
const sh=fmtScheduleTime(slotStart),eh=fmtScheduleTime(slotEnd);
const dl=diffLabel(obj.difficulty);
const tr=document.createElement("tr");
tr.innerHTML=`<td style="text-align:center">${i+1}</td><td>${sh}〜${eh}</td><td><button type="button" class="schedule-object-btn">${obj.name}</button></td><td><span class="badge ${TYPE_BADGE[obj.type]||""}">${TYPE_LABEL[obj.type]||obj.type}</span></td><td><span class="diff-badge diff-${obj.difficulty}">${dl.stars}</span></td><td style="text-align:center">${obj.alt}°</td><td>${obj.azDir}</td><td>${obj.scope}</td><td style="font-size:12px;color:#7ab4d4">${obj.highlight}</td>`;
const objBtn=tr.querySelector(".schedule-object-btn");
if(objBtn)objBtn.addEventListener("click",()=>openScheduleObjectModal(obj));
tbody.appendChild(tr);
});
renderConstellations(date.getMonth()+1,"");$("#constSearch").value="";
$("#resultArea").style.display="block";closeDetailPopup();
$("#resultArea").scrollIntoView({behavior:"smooth"});
});
$("#constSearch").addEventListener("input",function(){
const month=currentDate?currentDate.getMonth()+1:null;
renderConstellations(month,this.value);
});

$("#moonPrev").addEventListener("click",()=>{
moonCalBaseDate=new Date(moonCalBaseDate.getFullYear(),moonCalBaseDate.getMonth()-1,1);
renderMoonCalendar(moonCalBaseDate);
});
$("#moonNext").addEventListener("click",()=>{
moonCalBaseDate=new Date(moonCalBaseDate.getFullYear(),moonCalBaseDate.getMonth()+1,1);
renderMoonCalendar(moonCalBaseDate);
});
$("#moonToday").addEventListener("click",()=>{
moonCalBaseDate=new Date(new Date().getFullYear(),new Date().getMonth(),1);
renderMoonCalendar(moonCalBaseDate);
});

$("#openMoonDatePicker").addEventListener("click",openMoonDatePicker);
$("#closeMoonDatePicker").addEventListener("click",closeMoonDatePicker);
$("#moonDatePrev").addEventListener("click",()=>{
moonDatePickerBaseDate=new Date(moonDatePickerBaseDate.getFullYear(),moonDatePickerBaseDate.getMonth()-1,1);
renderMoonDatePicker(moonDatePickerBaseDate);
});
$("#moonDateNext").addEventListener("click",()=>{
moonDatePickerBaseDate=new Date(moonDatePickerBaseDate.getFullYear(),moonDatePickerBaseDate.getMonth()+1,1);
renderMoonDatePicker(moonDatePickerBaseDate);
});
$("#moonDateToday").addEventListener("click",()=>{
const now=new Date();
moonDatePickerBaseDate=new Date(now.getFullYear(),now.getMonth(),1);
renderMoonDatePicker(moonDatePickerBaseDate);
});
$("#moonDatePickerModal").addEventListener("click",event=>{
if(event.target===$("#moonDatePickerModal"))closeMoonDatePicker();
});
document.addEventListener("keydown",event=>{
if(event.key==="Escape"&&$("#moonDatePickerModal")?.classList.contains("open")){
closeMoonDatePicker();
}
if(event.key==="Escape"&&$("#scheduleObjectModal")?.classList.contains("open")){
closeScheduleObjectModal();
}
if(event.key==="Escape"&&$("#detailPopupModal")?.classList.contains("open")){
closeDetailPopup();
}
if(event.key==="Escape"&&$("#reversePlannerModal")?.classList.contains("open")){
closeReversePlanner();
}
});
function openScheduleObjectModal(obj){
const modal=$("#scheduleObjectModal");
if(!modal||!obj)return;
const dl=diffLabel(obj.difficulty||3);
$("#scheduleObjectIcon").textContent=obj.icon||"";
$("#scheduleObjectTitle").textContent=obj.name||"";

const rows=[
["種類",TYPE_LABEL[obj.type]||obj.type||"—"],
["カタログ",obj.cat||"—"],
["難易度",`${dl.stars} ${dl.text}`],
["高度",obj.alt!==undefined?`${obj.alt}°`:"—"],
["方位",obj.azDir||"—"],
["等級",`${obj.magVal||obj.mag||"—"} 等`],
["距離",obj.distStr||obj.dist||"—"],
["見かけの大きさ",obj.size||"—"],
["推奨倍率",obj.scope||"—"]
];

$("#scheduleObjectBody").innerHTML=`
<div class="object-popup-badges">
<span class="badge ${TYPE_BADGE[obj.type]||""}">${TYPE_LABEL[obj.type]||obj.type||"—"}</span>
<span class="diff-badge diff-${obj.difficulty||3}">${dl.stars} ${dl.text}</span>
</div>
<div class="object-popup-highlight">${escapeHTML(obj.highlight||"")}</div>
<table class="object-popup-table">${rows.map(r=>`<tr><th>${r[0]}</th><td>${r[1]}</td></tr>`).join("")}</table>
${obj.story?`<div class="object-popup-story">${obj.story}</div>`:""}
`;
modal.classList.add("open");
modal.setAttribute("aria-hidden","false");
document.body.classList.add("manual-open");
}

function closeScheduleObjectModal(){
const modal=$("#scheduleObjectModal");
if(!modal)return;
modal.classList.remove("open");
modal.setAttribute("aria-hidden","true");
document.body.classList.remove("manual-open");
}

$("#closeScheduleObject").addEventListener("click",closeScheduleObjectModal);
$("#scheduleObjectModal").addEventListener("click",event=>{
if(event.target===$("#scheduleObjectModal"))closeScheduleObjectModal();
});

function showDetail(obj,card){
document.querySelectorAll(".obj-card").forEach(c=>c.classList.remove("active"));
if(card)card.classList.add("active");
const dl=diffLabel(obj.difficulty||3);
$("#detailTitle").textContent=obj.icon+" "+obj.name;
const rows=[
["種類",TYPE_LABEL[obj.type]||obj.type],["カタログ",obj.cat||"—"],
["難易度",`<span class="diff-badge diff-${obj.difficulty||3}">${dl.stars} ${dl.text}</span>`],
["現在の高度",obj.alt!==undefined&&obj.alt!=="—"?obj.alt+"°":"検索後に表示"],
["現在の方位",obj.azDir&&obj.azDir!=="—"?obj.azDir+(obj.az!=="—"?"（"+obj.az+"°）":""):"検索後に表示"],
["等級",(obj.magVal||obj.mag)+" 等"],["距離",obj.distStr||obj.dist||"—"],
["見かけの大きさ",obj.size||"—"],["推奨倍率",obj.scope||"—"],
];
$("#detailTable").innerHTML=rows.map(r=>`<tr><th>${r[0]}</th><td>${r[1]}</td></tr>`).join("");
let storyHtml="";
if(obj.story) storyHtml+=obj.story;
if(obj.talk){
storyHtml+=`<div class="story-section"><h4>案内トーク例</h4><div class="story-note">${obj.talk}</div></div>`;
}
$("#detailStory").innerHTML=storyHtml||"解説なし";
if(currentLat&&currentLon&&currentDate){
const canvas=$("#altChart");const ctx=canvas.getContext("2d");
canvas.width=canvas.offsetWidth||600;canvas.height=120;
const pts=calcAltCurve(obj,currentLat,currentLon,currentDate);
ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle="#060a14";ctx.fillRect(0,0,canvas.width,canvas.height);
ctx.strokeStyle="#1a2a40";ctx.lineWidth=1;
[0,30,60,90].forEach(alt=>{const y=canvas.height-(alt/90)*(canvas.height-20)-10;ctx.beginPath();ctx.moveTo(40,y);ctx.lineTo(canvas.width-10,y);ctx.stroke();ctx.fillStyle="#3a5a7a";ctx.font="10px sans-serif";ctx.fillText(alt+"°",2,y+4);});
pts.forEach((p,i)=>{if(i%2===0){const x=40+(i/(pts.length-1))*(canvas.width-50);ctx.fillStyle="#3a5a7a";ctx.font="10px sans-serif";ctx.fillText(p.h+"h",x-8,canvas.height-2);}});
ctx.strokeStyle="#4a9fd4";ctx.lineWidth=2;ctx.beginPath();
pts.forEach((p,i)=>{const x=40+(i/(pts.length-1))*(canvas.width-50);const y=canvas.height-10-(Math.max(0,p.alt)/90)*(canvas.height-20);i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);});ctx.stroke();
const nowH=currentDate.getHours()+currentDate.getMinutes()/60;const ni=(nowH-18+24)%24;
if(ni>=0&&ni<=12){const x=40+(ni/12)*(canvas.width-50);ctx.strokeStyle="#ffd54f";ctx.lineWidth=1.5;ctx.setLineDash([4,3]);ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,canvas.height-14);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle="#ffd54f";ctx.font="10px sans-serif";ctx.fillText("現在",x-10,12);}
}
document.querySelectorAll("[data-dtab]").forEach(x=>x.classList.remove("active"));
document.querySelectorAll(".tab-content").forEach(x=>{if(x.id.startsWith("dtab-"))x.classList.remove("active");});
document.querySelector("[data-dtab='data']").classList.add("active");$("#dtab-data").classList.add("active");
const detailModal=$("#detailPopupModal");
if(detailModal){
  detailModal.classList.add("open");
  detailModal.setAttribute("aria-hidden","false");
  document.body.classList.add("detail-popup-open");
  $("#btnCloseDetail")?.focus();
}
}

/* ===== 使用マニュアル ===== */
function openManual(){
  const modal=document.getElementById("manualModal");
  if(!modal)return;
  if(modal.classList.contains("open"))return;

  modal.classList.add("open");
  modal.setAttribute("aria-hidden","false");
  document.body.classList.add("manual-open");

  const closeBtn=document.getElementById("closeManual");
  if(closeBtn)closeBtn.focus();
}
function closeManual(){
  const modal=document.getElementById("manualModal");
  if(!modal)return;
  if(!modal.classList.contains("open"))return;

  modal.classList.remove("open");
  modal.setAttribute("aria-hidden","true");
  document.body.classList.remove("manual-open");

  const openBtn=document.getElementById("openManual");
  if(openBtn)openBtn.focus();
}
const manualOpenBtn=document.getElementById("openManual");
const manualCloseBtn=document.getElementById("closeManual");
if(manualOpenBtn)manualOpenBtn.addEventListener("click",openManual);
if(manualCloseBtn)manualCloseBtn.addEventListener("click",closeManual);
document.addEventListener("keydown",event=>{
  if(event.key==="Escape" && document.getElementById("manualModal")?.classList.contains("open")){
    closeManual();
  }
});



/* ===== 一般公開情報モーダル ===== */
function openPublicInfo(){
  const modal=document.getElementById("publicInfoModal");
  if(!modal||modal.classList.contains("open"))return;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden","false");
  document.body.classList.add("public-info-open");
  document.getElementById("closePublicInfo")?.focus();
}
function closePublicInfo(){
  const modal=document.getElementById("publicInfoModal");
  if(!modal||!modal.classList.contains("open"))return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden","true");
  document.body.classList.remove("public-info-open");
  document.getElementById("openPublicInfo")?.focus();
}
const publicInfoOpenBtn=document.getElementById("openPublicInfo");
const publicInfoCloseBtn=document.getElementById("closePublicInfo");
if(publicInfoOpenBtn)publicInfoOpenBtn.addEventListener("click",openPublicInfo);
if(publicInfoCloseBtn)publicInfoCloseBtn.addEventListener("click",closePublicInfo);
document.getElementById("publicInfoModal")?.addEventListener("click",event=>{
  if(event.target===document.getElementById("publicInfoModal"))closePublicInfo();
});
document.addEventListener("keydown",event=>{
  if(event.key==="Escape"&&document.getElementById("publicInfoModal")?.classList.contains("open")){
    closePublicInfo();
  }
});


/* ===== v2.0.1 PWA / Startup Stability ===== */
let NICOLE_SW_REGISTRATION=null;
let NICOLE_SW_REFRESHING=false;
let NICOLE_SW_DISMISSED=false;

function updatePwaConnectivityUI(){
  const banner=document.getElementById("pwaOfflineBanner");
  if(banner)banner.classList.toggle("show",!navigator.onLine);
}

function showPwaUpdateBanner(registration){
  if(!registration||NICOLE_SW_DISMISSED)return;
  NICOLE_SW_REGISTRATION=registration;
  const banner=document.getElementById("pwaUpdateBanner");
  if(banner)banner.hidden=false;
}
function hidePwaUpdateBanner(){
  const banner=document.getElementById("pwaUpdateBanner");
  if(banner)banner.hidden=true;
}
async function applyPwaUpdate(){
  const waiting=NICOLE_SW_REGISTRATION?.waiting;
  if(!waiting){
    hidePwaUpdateBanner();
    return;
  }
  NICOLE_SW_REFRESHING=true;
  waiting.postMessage({type:"SKIP_WAITING"});
}

function initPwaUpdateUI(){
  document.getElementById("pwaApplyUpdate")?.addEventListener("click",applyPwaUpdate);
  document.getElementById("pwaDismissUpdate")?.addEventListener("click",()=>{
    NICOLE_SW_DISMISSED=true;
    hidePwaUpdateBanner();
  });
}

async function registerNicoleServiceWorker(){
  if(!("serviceWorker" in navigator) || !(location.protocol==="https:" || location.hostname==="localhost"))return null;
  try{
    const registration=await navigator.serviceWorker.register("./sw.js",{scope:"./",updateViaCache:"none"});
    NICOLE_SW_REGISTRATION=registration;
    if(registration.waiting&&navigator.serviceWorker.controller)showPwaUpdateBanner(registration);

    registration.addEventListener("updatefound",()=>{
      const worker=registration.installing;
      if(!worker)return;
      worker.addEventListener("statechange",()=>{
        if(worker.state==="installed"&&navigator.serviceWorker.controller){
          showPwaUpdateBanner(registration);
        }
      });
    });

    navigator.serviceWorker.addEventListener("controllerchange",()=>{
      if(!NICOLE_SW_REFRESHING)return;
      location.reload();
    });

    const requestUpdate=()=>registration.update().catch(()=>{});
    document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")requestUpdate();});
    setInterval(()=>{if(document.visibilityState==="visible")requestUpdate();},60*60*1000);
    return registration;
  }catch(error){
    console.warn("Nicole Service Worker registration failed",error);
    return null;
  }
}

function runNicoleSelfCheck(){
  const requiredIds=[
    "nightModeToggle","inDatetime","inLat","inLon","btnCalc","resultArea",
    "resultPanel-skymap","skyMapCanvasWrap","skyMapCanvas","skyMapInteraction"
  ];
  const missing=requiredIds.filter(id=>!document.getElementById(id));
  const seen=new Set(),duplicates=[];
  document.querySelectorAll("[id]").forEach(el=>{
    if(seen.has(el.id))duplicates.push(el.id); else seen.add(el.id);
  });
  const report={version:"2.0.1",missing,duplicates:[...new Set(duplicates)],standalone:!!(window.navigator.standalone||matchMedia("(display-mode: standalone)").matches)};
  window.NicoleDiagnostics=Object.assign(window.NicoleDiagnostics||{},report,{cameraSettings:()=>SKY_CAMERA_SETTINGS});
  if(missing.length||report.duplicates.length){
    console.error("Nicole startup self-check failed",report);
    const error=document.getElementById("nicoleBootError");
    if(error){
      error.hidden=false;
      error.textContent=`起動チェックで問題を検出しました。missing: ${missing.join(", ")||"なし"} / duplicate IDs: ${report.duplicates.join(", ")||"なし"}`;
    }
  }else{
    console.info("Nicole startup self-check OK",report);
  }
  return report;
}

function initNicoleSystem(){
  updatePwaConnectivityUI();
  window.addEventListener("online",updatePwaConnectivityUI);
  window.addEventListener("offline",updatePwaConnectivityUI);
  initPwaUpdateUI();
  runNicoleSelfCheck();
  registerNicoleServiceWorker();
}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initNicoleSystem,{once:true});
else initNicoleSystem();

