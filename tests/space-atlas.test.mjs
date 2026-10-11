import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {normalizeGroup} from '../scripts/update-constellation-space.mjs';
import {prepareElements,positionAt,displayPoint,projectPoint,groupOrbitStructure,EARTH_RADIUS_KM} from '../lib/space-atlas.mjs';
const manifest=JSON.parse(await readFile(new URL('../data/metrics/constellation-space.json',import.meta.url)));
test('GP files preserve six-digit identifiers, orbital epochs and separate catalogue counts',async()=>{
 assert.equal(manifest.groups.length,5);
 for(const group of manifest.groups){
  const data=JSON.parse(await readFile(new URL('../public'+group.file,import.meta.url)));
  assert.equal(data.elements.length,group.records);assert.equal(data.source.sha256,group.sha256);
  assert.equal(new Set(data.elements.map(r=>r.NORAD_CAT_ID)).size,group.records);
  const parsed=normalizeGroup(data.elements);assert.equal(parsed.rejected.length,0);
  assert.equal(groupOrbitStructure(data.elements).reduce((sum,g)=>sum+g.count,0),group.records);
  const prepared=prepareElements(data.elements.slice(0,6));
  for(const rec of prepared){
   const point=positionAt(rec,Date.parse(manifest.retrievedAt));
   assert.ok(point&&point.every(Number.isFinite));assert.ok(Math.hypot(...point)>EARTH_RADIUS_KM);
   const projected=projectPoint(displayPoint(point),.3,.4);
   assert.ok(Math.abs(Math.hypot(...projected)-Math.hypot(...point)/EARTH_RADIUS_KM)<1e-9);
  }
 }
});
test('invalid GP rows are rejected, missing orbital elements are never synthesized',async()=>{
 const {elements}=JSON.parse(await readFile(new URL('../public/data/orbits/oneweb.json',import.meta.url)));
 const valid={...elements[0],NORAD_CAT_ID:100123},bad={...valid,INCLINATION:null},badEpoch={...valid,EPOCH:'unknown'};
 const data=normalizeGroup([valid,valid,bad,badEpoch,null]);
 assert.equal(data.valid.length,1);assert.equal(data.valid[0].NORAD_CAT_ID,100123);assert.equal(data.rejected.length,3);
});
test('altitude exaggeration is geometric only; true scale preserves radius',()=>{
 const point=[7000,0,0];assert.equal(displayPoint(point)[0],7000/EARTH_RADIUS_KM);
 assert.equal(displayPoint(point,3)[0],(EARTH_RADIUS_KM+(7000-EARTH_RADIUS_KM)*3)/EARTH_RADIUS_KM);
});
test('space route server-renders stable state without fake positions',async()=>{
 const {default:worker}=await import('../dist/server/index.js');
 const res=await worker.fetch(new Request('http://localhost/constellations',{headers:{accept:'text/html'}}),{ASSETS:{fetch:async()=>new Response('Not found',{status:404})}},{waitUntil(){},passThroughOnException(){}});
 assert.equal(res.status,200);const html=await res.text();
 assert.match(html,/SPACE ATLAS/);assert.match(html,/从万颗卫星/);assert.match(html,/轨道推算时间/);
 assert.match(html,/返回数字看板/);assert.doesNotMatch(html,/NaN|Infinity/);
});
