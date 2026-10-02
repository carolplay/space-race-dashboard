import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';

// Inventory observations only: regulatory filings and review dates stay immutable.
const target=new URL('../data/metrics/constellation-assets.json',import.meta.url);
const assets=JSON.parse(readFileSync(target,'utf8'));
const definitions=[['starlink','star','Total'],['amazon-leo','kp','Kuiper satellites'],['oneweb','ow','OneWeb'],['guowang','xw','HW Digui'],['qianfan','qf','Qianfan Xingzuo']];
const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const retrievedAt=new Date().toISOString();
const observations=await Promise.all(definitions.map(async([id,group,label])=>{
  const url=`https://planet4589.org/space/con/${group}/stats.html`;
  const response=await fetch(url,{signal:AbortSignal.timeout(60000)});
  if(!response.ok)throw Error(`${id}: HTTP ${response.status}`);
  const html=await response.text();
  const stamp=html.match(/Data last updated:\s*(\d{4})\s+(\w{3})\s+(\d{1,2})\s+(\d{2})(\d{2}):(\d{2})/);
  if(!stamp||!months.includes(stamp[2]))throw Error(`${id}: missing upstream timestamp`);
  const updatedAt=new Date(Date.UTC(+stamp[1],months.indexOf(stamp[2]),+stamp[3],+stamp[4],+stamp[5],+stamp[6])).toISOString();
  const section=html.slice(stamp.index).split('Note:')[0];
  const rows=[...section.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(m=>[...m[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(c=>c[1].replace(/<[^>]+>/g,'').replace(/&nbsp;/g,' ').trim()));
  const matching=rows.filter(r=>r[0]===label&&/^\d+$/.test(r[1]??'')&&r.length>=20);
  if(matching.length!==1)throw Error(`${id}: ambiguous or missing inventory row`);
  const row=matching[0];
  const keys={launched:1,failedToOrbit:2,totalDown:6,inOrbit:7,workingEstimate:11,operationalOrbitEstimate:19};
  const counts=Object.fromEntries(Object.entries(keys).map(([key,index])=>{
    if(!/^\d+$/.test(row[index]))throw Error(`${id}: invalid ${key}`);
    return [key,Number(row[index])];
  }));
  if(counts.launched-counts.totalDown!==counts.inOrbit||counts.workingEstimate>counts.inOrbit||counts.operationalOrbitEstimate>counts.workingEstimate)throw Error(`${id}: inconsistent totals`);
  const previous=assets.constellations.find(c=>c.id===id);
  if(!previous||updatedAt.slice(0,10)<previous.asOf||Date.parse(updatedAt)>Date.parse(retrievedAt))throw Error(`${id}: invalid source date`);
  return {id,url,rowLabel:label,updatedRaw:stamp[0],updatedAt,dataAsOf:updatedAt.slice(0,10),sha256:createHash('sha256').update(html).digest('hex'),...counts};
}));
const directory=new URL('../data/snapshots/constellation-assets/',import.meta.url);
mkdirSync(directory,{recursive:true});
writeFileSync(new URL(`${retrievedAt.slice(0,10)}.json`,directory),JSON.stringify({retrievedAt,observations},null,2)+'\n');
for(const observation of observations){
  const item=assets.constellations.find(c=>c.id===observation.id);
  item.inOrbit=observation.inOrbit;
  item.asOf=observation.dataAsOf;
  item.sourceUrl=observation.url;
  item.inventoryObservation=observation;
  const points=new Map(item.history.map(p=>[p.date,p]));
  points.set(item.asOf,{date:item.asOf,inOrbit:item.inOrbit,kind:'constellation-snapshot'});
  item.history=[...points.values()].sort((a,b)=>a.date.localeCompare(b.date));
}
assets.inventoryAsOf=observations.map(o=>o.dataAsOf).sort()[0];
assets.inventoryRetrievedAt=retrievedAt;
writeFileSync(target,JSON.stringify(assets,null,2)+'\n');
console.log(JSON.stringify({inventoryAsOf:assets.inventoryAsOf,counts:Object.fromEntries(observations.map(o=>[o.id,o.inOrbit]))}));
