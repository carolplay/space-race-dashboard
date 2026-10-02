import {readFileSync,writeFileSync} from 'node:fs';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const history=read('data/metrics/historical-series.json');
const fleets=read('data/metrics/constellation-assets.json');
const stages=read('data/editorial/constellation-stages.json');
const years=Array.from({length:11},(_,i)=>2026+i);
const round=(n,step=1)=>Math.round(n/step)*step;
const annual=history.launchActivity;
const p25=annual.find(p=>p.year==='2025');
const [same25,same26]=history.samePeriod;
const regions=['us','cn','other'];
const launchAnchor=Object.fromEntries(regions.map(r=>[r,p25.attempts[r]*same26.attempts[r]/same25.attempts[r]]));
launchAnchor.global=regions.reduce((s,r)=>s+launchAnchor[r],0);
const y23=annual.find(p=>p.year==='2023');
const rawIncrement=Object.fromEntries(regions.map(r=>[r,(p25.attempts[r]-y23.attempts[r])/2]));
const totals={...launchAnchor};
const launch=years.map((year,index)=>{
  if(index)for(const r of regions)totals[r]+=rawIncrement[r]*0.85**(index-1);
  totals.global=regions.reduce((s,r)=>s+totals[r],0);
  const regional=Object.fromEntries(regions.map(r=>[r,round(totals[r],5)]));
  return {year,global:regions.reduce((s,r)=>s+regional[r],0),...regional,kind:year===2026?'same-period-nowcast':'damped-linear-trend'};
});
const cutoff=fleets.inventoryAsOf;
const fleetSeries=fleets.constellations.map(c=>{
  const fleetCutoff=c.asOf;
  const yearAgo=new Date(Date.parse(fleetCutoff+'T00:00:00Z')-365*864e5).toISOString().slice(0,10);
  const prior=c.history.filter(p=>p.date<=yearAgo).at(-1);
  if(!prior)throw Error(`No prior-year history for ${c.id}`);
  const days=(Date.parse(fleetCutoff+'T00:00:00Z')-Date.parse(prior.date+'T00:00:00Z'))/864e5;
  const pace=Math.max(0,(c.inOrbit-prior.inOrbit)*365/days);
  let count=c.inOrbit;
  const points=years.map((year,i)=>{if(i)count+=pace*0.88**(i-1);return {year,count:i?round(count,10):c.inOrbit};});
  return {entityId:c.id,nameZh:c.nameZh,nameEn:c.nameEn,observed:c.inOrbit,pacePerYear:round(pace),priorDate:prior.date,points};
});
const inventory=history.orbitInventory;
const o24=inventory.find(p=>p.year==='2024'),o25=inventory.find(p=>p.year==='2025'),o26=inventory.find(p=>p.year==='2026');
const observedGlobal=o26.payloadObjects?.global;
if(!Number.isFinite(observedGlobal))throw Error('Historical inventory schema changed');
const getStock=p=>p.payloadObjects?.global;
const inventoryCutoff=history.coverage.payloadCutoff;
const inventoryDays=(Date.parse(inventoryCutoff+'T00:00:00Z')-Date.UTC(Number(inventoryCutoff.slice(0,4)),0,1))/864e5+1;
if(!Number.isFinite(inventoryDays)||inventoryDays<1||inventoryDays>366)throw Error('Invalid inventory cutoff');
const stockPace=Math.max(0,(getStock(o25)-getStock(o24))*.4+(getStock(o26)-getStock(o25))*.6*365/inventoryDays);
let stock=observedGlobal;
const orbitalInventory=years.map((year,i)=>{if(i)stock+=stockPace*.88**(i-1);return {year,count:i?round(stock,50):observedGlobal};});
const linearTarget=(current,atYear,targets,year)=>{
 let previous={year:atYear,count:current};
 for(const target of targets){
  if(year<=target.year){const frac=Math.max(0,Math.min(1,(year-previous.year)/(target.year-previous.year)));return previous.count+(target.count-previous.count)*frac;}
  previous=target;
 }
 return previous.count;
};
const find=id=>fleets.constellations.find(c=>c.id===id).inOrbit;
const amazonTargets=stages.series.find(s=>s.entityId==='amazon-leo').stages.map(s=>({year:Number(s.date.slice(0,4)),count:s.count}));
const qianfanTargets=stages.series.find(s=>s.entityId==='qianfan').stages.filter(s=>Number(s.date.slice(0,4))>2026).map(s=>({year:Number(s.date.slice(0,4)),count:s.count}));
const gw=read('data/metrics/constellation-assets.json').filings.find(f=>f.id==='chn-gw-a59');
const gwTargets=[{year:2029,count:Math.ceil(gw.basic.notifiedCount*.1)},{year:2032,count:Math.ceil(gw.basic.notifiedCount*.5)},{year:2034,count:gw.basic.notifiedCount}];
const assumptions={perLaunchSatellites:40,scope:'Amazon Gen1 FCC target, Qianfan commercial plan, GW-A59 conditional RES35 case; one brand/notice per series; current brand inventory optimistically credited in full',excluded:'CTC-1/2, Starlink Gen2, replacements, non-LEO transfers; satellite sizes and effective regulatory assignments not established'};
const targets=[{id:'amazon-leo',current:find('amazon-leo'),stages:amazonTargets,authority:'FCC'},{id:'qianfan',current:find('qianfan'),stages:qianfanTargets,authority:'commercial_plan'},{id:'guowang',current:find('guowang'),stages:gwTargets,authority:'conditional_ITU_RES35'}];
const milestoneDemand=years.map((year,i)=>{const byFleet=Object.fromEntries(targets.map(t=>{const now=linearTarget(t.current,2026,t.stages,year),prior=i?linearTarget(t.current,2026,t.stages,year-1):t.current;return [t.id,round(Math.max(0,now-prior))];}));const satellites=Object.values(byFleet).reduce((a,b)=>a+b,0);return {year,byFleet,satellites,launchEquivalents:round(satellites/assumptions.perLaunchSatellites),launchEquivalentsLow:round(satellites/80),launchEquivalentsHigh:round(satellites/20)};});
const ctc=fleets.filings.find(f=>f.id==='ctc-1');
const ctcCount=ctc.basic.notifiedCount;
const ctcTargets=[{year:2032,count:0},{year:2034,count:Math.ceil(ctcCount*.1)},{year:2037,count:Math.ceil(ctcCount*.5)},{year:2039,count:ctcCount}];
const ctcConditional=years.map(year=>({year,threshold:year<2032?null:round(linearTarget(0,2032,ctcTargets.slice(1),year))}));
const result={schemaVersion:'1.0.0',asOf:cutoff,years,source:{launch:history.source.url,inventory:history.source.url,fleets:fleets.source.url,itu:ctc.sourceUrl,fcc:stages.series.find(s=>s.entityId==='amazon-leo').sourceUrl,commercial:stages.series.find(s=>s.entityId==='qianfan').sourceUrl},method:{launch:'2026 nowcast uses same-period 2025/2026 ratio applied to full-year 2025; 2027 onward adds the 2023–2025 mean annual increment, damped 15% each year',inventory:'2026 stock is a partial-year snapshot; future net additions use weighted 2024–2025 full-year change and annualized 2026 YTD change, damped 12% annually',fleets:'recent positive net pace is annualized from the latest snapshot and a previous snapshot at least 365 days earlier, then damped 12% yearly; no compliance or commercial-stage targets imposed',milestone:'conditional straight-line on-time build-out to selected goals; current brand physical inventory optimistically credited, though it may not qualify for a particular notice/generation; not a verified regulatory minimum',ctc:'one CTC network only; hypothetical RES35 full-notification retention after 2032 network BIU limit, 10/50/100% at +2/+5/+7 years; applicability and credit unverified; never add to physical inventory or convert to launches'},assumptions,launchHistorical:annual.filter(p=>Number(p.year)>=2020&&Number(p.year)<=2025).map(p=>({year:Number(p.year),global:p.attempts.global,us:p.attempts.us,cn:p.attempts.cn,other:p.attempts.other})),launch,inventoryHistorical:inventory.filter(p=>Number(p.year)>=2016&&Number(p.year)<=2026).map(p=>({year:Number(p.year),count:getStock(p),partial:p.year==='2026'})),orbitalInventory,fleets:fleetSeries,milestoneDemand,ctcConditional,targets};
result.sourceCutoffs={launch:history.coverage.launchCutoff,inventory:inventoryCutoff,fleets:cutoff};
writeFileSync(new URL('../data/metrics/demand-forecast.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
console.log('Updated transparent 2026–2036 demand scenarios.');
