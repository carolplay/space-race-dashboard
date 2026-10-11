import test from 'node:test';
import assert from 'node:assert/strict';
import { reconcileReferences } from '../scripts/reconcile-reference-projects.mjs';
const watch = {projects:[{id:'peer',entities:['fleet']}]};
const inventory = {constellations:[{id:'fleet',inventoryObservation:{inOrbit:100,dataAsOf:'2026-10-09',url:'https://example.com/primary'}}]};
const obs = {projectId:'peer',entityId:'fleet',metric:'tracked-payloads',unit:'satellites',value:98,asOf:'2026-10-09'};
const run = o => reconcileReferences(watch,{observations:[o]},inventory);
test('same-date counts produce a coverage review, never a production correction',()=>{
  const before=JSON.stringify(inventory);
  const r=run(obs);
  assert.equal(r.rows[0].deltaPeerMinusLocal,-2);
  assert.equal(r.rows[0].status,'coverage-difference-review');
  assert.equal(r.productionDataModified,false);
  assert.equal(JSON.stringify(inventory),before);
});
test('different or unknown dates do not produce a numeric discrepancy',()=>{
  assert.equal(run({...obs,asOf:'2026-09-10'}).rows[0].deltaPeerMinusLocal,null);
  assert.equal(run({...obs,asOf:null}).rows[0].status,'unknown-date');
});
test('unknown counts are not zero and reruns cannot create a fresh source date',()=>{
  assert.equal(run({...obs,value:null}).rows[0].status,'missing-count');
  assert.deepEqual(run(obs),run(obs));
  assert.equal(run(obs).rows[0].exactEpochAligned,false);
});
test('unsupported planned/operational metrics and bad mappings are rejected',()=>{
  assert.throws(()=>run({...obs,metric:'planned'}));
  assert.throws(()=>run({...obs,entityId:'unknown'}));
  assert.throws(()=>run({...obs,value:-1}));
});
