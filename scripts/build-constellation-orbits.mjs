import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
export const CURRENT_URL = 'https://planet4589.org/space/gcat/tsv/derived/currentcat.tsv';
const matchers = {
 starlink: r => /^Starlink[ -]/.test(r.Name) || /^Tintin [AB]$/.test(r.Name),
 'amazon-leo': r => /^Kuiper(?:-|Sat)/.test(r.Name),
 oneweb: r => /^OneWeb SL/.test(r.Name),
 guowang: r => /^WHDW /.test(r.Name),
 qianfan: r => /^Qianfan Xingzuo /.test(r.Name),
};
const numeric = s => /^[+-]?\d+(?:\.\d+)?$/.test(s ?? '') ? Number(s) : null;
const round = n => Math.round(n * 1000) / 1000;
export function buildConstellationOrbits(text, assets, retrievedAt) {
 const lines=text.split(/\r?\n/), header=lines.find(l=>l.startsWith('#JCAT\t'))?.slice(1).split('\t');
 if(!header || !['JCAT','Name','Type','DDate','Perigee','Apogee','Inc','OpOrbit'].every(k=>header.includes(k))) throw Error('GCAT orbit schema changed');
 const rows=[...new Map(lines.filter(l=>l && !l.startsWith('#')).map(l=>{
  const values=l.split('\t');return Object.fromEntries(header.map((k,i)=>[k,(values[i]??'').trim()]));
 }).map(r=>[r.JCAT,r])).values()];
 const stamp=text.match(/^# Updated\s+(.+)$/m)?.[1] ?? null;
 if(!stamp) throw Error('Missing upstream catalogue date');
 const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
 const m=stamp.match(/^(\d{4})\s+(\w{3})\s+(\d{1,2})\s+(\d{2})(\d{2}):(\d{2})$/);
 if(!m||!months.includes(m[2])) throw Error('Unrecognized upstream date');
 const updatedAt=new Date(Date.UTC(+m[1],months.indexOf(m[2]),+m[3],+m[4],+m[5],+m[6])).toISOString();
 const fleets=assets.constellations.map(f=>{
  const selected=rows.filter(r=>r.Type.startsWith('P')&&r.DDate==='-'&&/^(LEO|LLEO)/.test(r.OpOrbit)&&matchers[f.id]?.(r));
  const bins=new Map();let missingOrbit=0,flaggedOrbit=0;
  const orbitDates=[], datedOrbits=[];
  for(const r of selected){
   const p=numeric(r.Perigee),a=numeric(r.Apogee),i=numeric(r.Inc);
   if(p===null||a===null||i===null||p<0||a<p||i<0||i>180){missingOrbit++;continue;}
   const altitude=(p+a)/2, incBin=Math.round(i),altBin=Math.round(altitude/25)*25,key=incBin+':'+altBin;
   const bin=bins.get(key)??{id:key,count:0,altSum:0,incSum:0,perigeeMin:p,apogeeMax:a,flaggedCount:0};
   bin.count++;bin.altSum+=altitude;bin.incSum+=i;bin.perigeeMin=Math.min(bin.perigeeMin,p);bin.apogeeMax=Math.max(bin.apogeeMax,a);
   if([r.PF,r.AF,r.IF].some(v=>v&&v!=='-')){flaggedOrbit++;bin.flaggedCount++;}
   if(r.ODate&&r.ODate!=='-') orbitDates.push(r.ODate);
   const om=r.ODate?.match(/^(\d{4})\s+(\w{3})\s+(\d{1,2})(?:\s|$)/);
   if(om&&months.includes(om[2])) datedOrbits.push(new Date(Date.UTC(+om[1],months.indexOf(om[2]),+om[3])).toISOString().slice(0,10));
   bins.set(key,bin);
  }
  return {id:f.id,nameZh:f.nameZh,nameEn:f.nameEn,inventory:f.inOrbit,inventoryAsOf:f.asOf,
   catalogMatched:selected.length,plotted:selected.length-missingOrbit,missingOrbit,flaggedOrbit,
   orbitalDateLabels:[...new Set(orbitDates)].sort(),
   orbitDateCoverage:{datedRows:datedOrbits.length,undatedRows:selected.length-missingOrbit-datedOrbits.length,oldest:datedOrbits.sort()[0]??null,newest:datedOrbits.at(-1)??null,olderThan7Days:datedOrbits.filter(d=>Date.parse(updatedAt.slice(0,10)+'T00:00:00Z')-Date.parse(d+'T00:00:00Z')>7*86400000).length},
   inventoryDifference:selected.length-f.inOrbit,
   scope:'Name-matched payloads without exit dates in LEO/LLEO; subgroup catalogue coverage is not the independent fleet inventory.',
   bins:[...bins.values()].map(b=>({id:b.id,count:b.count,altitudeKm:round(b.altSum/b.count),inclinationDeg:round(b.incSum/b.count),perigeeMinKm:b.perigeeMin,apogeeMaxKm:b.apogeeMax,flaggedCount:b.flaggedCount})).sort((a,b)=>b.count-a.count),
  };
 });
 return {schemaVersion:1,source:{url:CURRENT_URL,updatedAt,updatedRaw:stamp,retrievedAt,sha256:createHash('sha256').update(text).digest('hex')},
  method:{altitude:'Arithmetic mean of catalogued perigee and apogee; not an instantaneous position.',inclinationBinDegrees:1,altitudeBinKm:25,notAvailable:['RAAN','orbital-plane membership','actual ISL topology','service coverage','live positions']},fleets};
}
async function main(){
 const r=await fetch(CURRENT_URL,{signal:AbortSignal.timeout(60000)});if(!r.ok)throw Error('GCAT HTTP '+r.status);
 const assets=JSON.parse(await readFile(new URL('../data/metrics/constellation-assets.json',import.meta.url),'utf8'));
 const data=buildConstellationOrbits(await r.text(),assets,new Date().toISOString());
 await writeFile(new URL('../data/metrics/constellation-orbits.json',import.meta.url),JSON.stringify(data,null,2)+'\n');
 console.log(JSON.stringify(data.fleets.map(f=>({id:f.id,matched:f.catalogMatched,plotted:f.plotted,missing:f.missingOrbit}))));
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) await main();
