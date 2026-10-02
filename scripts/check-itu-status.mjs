import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';

// Official status observations only. Never derive BIU, achievement dates or new filings.
const url='https://www.itu.int/net/ITU-R/space/res35/build/bundle.js';
const response=await fetch(url,{signal:AbortSignal.timeout(60000)});
if(!response.ok)throw Error(`ITU HTTP ${response.status}`);
const text=await response.text();
// Parse the flat static data literals, without executing the downloaded JavaScript.
const rows=[...text.matchAll(/\{sat_name:"[^{}]+\}/g)].map(m=>JSON.parse(m[0].replace(/([{,])([A-Za-z_][A-Za-z_0-9]*):/g,'$1"$2":')));
if(rows.length<20)throw Error('ITU table schema changed');
const original=JSON.parse(readFileSync(new URL('../data/research/current/itu-milestones.json',import.meta.url),'utf8'));
const path=new URL('../data/metrics/constellation-assets.json',import.meta.url);
const assets=JSON.parse(readFileSync(path,'utf8'));
const retrievedAt=new Date().toISOString();
const sha256=createHash('sha256').update(text).digest('hex');
const observations=[],changes=[];
for(const filing of original.filings.filter(f=>f.raw)){
  // L5 has two rows; use the regulatory anchor rather than a mutable display alias.
  const matches=rows.filter(r=>r.sat_name===filing.raw.sat_name&&r.adm===filing.raw.adm&&r.M===filing.raw.M);
  if(matches.length!==1)throw Error(`${filing.id}: ambiguous official row`);
  const raw=matches[0],current=assets.filings.find(f=>f.id===filing.id);
  if(!current)throw Error(`${filing.id}: dashboard filing absent`);
  const previous=current.statusObservation?.raw??filing.raw;
  const fields=['M','M0','M1','M2','M3','nbr_notif','nbr_deploy','wic_no_M0','ssn_no_M0','new_sat_name'];
  const differences=fields.filter(k=>(raw[k]??'')!==(previous[k]??'')).map(field=>({field,previous:previous[field]??null,current:raw[field]??null}));
  observations.push({filingId:filing.id,raw,differences});
  if(!differences.length)continue;
  for(const milestone of current.milestones){
    const value=raw[milestone.stage];
    if(value==='Met'||value==='As Received'){
      milestone.status=value;
      milestone.date=null; // Status table does not publish an achievement date.
    }else if(/^\d{2}\.\d{2}\.\d{4}$/.test(value??'')){
      milestone.date=value.split('.').reverse().join('-');
      milestone.status=null;
    }else throw Error(`${filing.id}: unknown milestone encoding`);
  }
  current.statusObservation={sourceUrl:url,retrievedAt,upstreamUpdatedAt:null,sha256,raw};
  changes.push({filingId:filing.id,differences});
}
if(changes.length){
  const directory=new URL('../data/snapshots/itu-status/',import.meta.url);
  mkdirSync(directory,{recursive:true});
  writeFileSync(new URL(`${retrievedAt.slice(0,10)}.json`,directory),JSON.stringify({sourceUrl:url,retrievedAt,upstreamUpdatedAt:null,sha256,observations,changes},null,2)+'\n');
  writeFileSync(path,JSON.stringify(assets,null,2)+'\n');
}
console.log(JSON.stringify({sha256,checked:observations.length,changes}));
