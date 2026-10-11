import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
export const groups=[['starlink','starlink'],['oneweb','oneweb'],['amazon-leo','kuiper'],['guowang','hulianwang'],['qianfan','qianfan']];
export function normalizeGroup(rows){
 if(!Array.isArray(rows)||!rows.length)throw Error('Empty or invalid GP response');
 const seen=new Set(),valid=[],rejected=[];
 for(const r of rows){
  const fields=['NORAD_CAT_ID','MEAN_MOTION','ECCENTRICITY','INCLINATION','RA_OF_ASC_NODE','ARG_OF_PERICENTER','MEAN_ANOMALY','BSTAR','MEAN_MOTION_DOT','MEAN_MOTION_DDOT'];
  if(!r||typeof r.EPOCH!=='string'){rejected.push(r?.NORAD_CAT_ID??null);continue;}
  const epoch=Date.parse(r.EPOCH.endsWith('Z')?r.EPOCH:r.EPOCH+'Z');
  if(fields.some(k=>typeof r[k]!=='number'||!Number.isFinite(r[k]))||!Number.isFinite(epoch)||r.MEAN_MOTION<=0||r.ECCENTRICITY<0||r.ECCENTRICITY>=1||r.INCLINATION<0||r.INCLINATION>180||!Number.isInteger(r.NORAD_CAT_ID)||r.NORAD_CAT_ID<=0){rejected.push(r.NORAD_CAT_ID??null);continue;}
  if(seen.has(r.NORAD_CAT_ID))continue;
  seen.add(r.NORAD_CAT_ID);valid.push(r);
 }
 if(!valid.length)throw Error('No valid GP elements');
 return {valid,rejected};
}
export async function updateConstellationSpace(){
 const root=new URL('../',import.meta.url),path=new URL('data/metrics/constellation-space.json',root);
 let previous;try{previous=JSON.parse(await readFile(path,'utf8'));}catch{}
 // Shared published cache. Never refetch on page loads; at most one retrieval per group / 2 hours.
 if(previous&&Date.now()-Date.parse(previous.retrievedAt)<2*3600000){console.log('Using GP snapshot under two hours old');return;}
 await mkdir(new URL('public/data/orbits/',root),{recursive:true});
 const manifest={schemaVersion:1,retrievedAt:new Date().toISOString(),method:'CelesTrak OMM-compatible JSON → satellite.js SGP4 → TEME / earth-fixed display. Not live telemetry.',groups:[]},pending=[];
 for(const [id,group] of groups){
  const url='https://celestrak.org/NORAD/elements/gp.php?GROUP='+group+'&FORMAT=JSON';
  const response=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(45000)});
  if(response.status!==200)throw Error('CelesTrak HTTP '+response.status+'; stopping without retries');
  const text=await response.text(),{valid,rejected}=normalizeGroup(JSON.parse(text));
  const epochs=valid.map(r=>r.EPOCH.endsWith('Z')?r.EPOCH:r.EPOCH+'Z').sort();
  const entry={id,group,url,records:valid.length,rejected:rejected.length,epochOldest:epochs[0],epochNewest:epochs.at(-1),sha256:createHash('sha256').update(text).digest('hex'),retrievedAt:manifest.retrievedAt,file:'/data/orbits/'+id+'.json'};
  pending.push({entry,elements:valid});
  manifest.groups.push(entry);console.log(JSON.stringify({id,count:entry.records,oldest:entry.epochOldest,newest:entry.epochNewest}));
 }
 // No previous published files change if any upstream request fails.
 for(const {entry,elements} of pending)await writeFile(new URL('public'+entry.file,root),JSON.stringify({source:entry,elements})+'\n');
 await writeFile(path,JSON.stringify(manifest,null,2)+'\n');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await updateConstellationSpace();
