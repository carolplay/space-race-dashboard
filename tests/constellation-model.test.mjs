import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const m=JSON.parse(readFileSync(new URL('../data/metrics/constellation-model.json',import.meta.url)));
test('standard constellation model separates inventory, targets and unverified claims',()=>{
  const ids=new Set(m.entities.map(e=>e.entityId));
  assert.equal(ids.size,m.entities.length);
  for(const o of m.observations){assert.ok(ids.has(o.entityId));assert.equal(o.unit,'satellite');assert.ok(Number.isInteger(o.value)&&o.value>=0);}
  assert.equal(m.kpis.trackedInventory.value,m.entities.reduce((s,e)=>s+e.inventoryCount,0));
  assert.equal(m.kpis.verifiedAuthorizationSample.value,18232);
  assert.equal(m.kpis.ituReserveTotal.value,null);
  assert.equal(m.kpis.launchDeficit.value,null);
  assert.ok(m.candidates.every(c=>c.inventoryCount===null));
  assert.equal(m.candidates.find(c=>c.entityId==='ctc-1').verifiedCount,96714);
  assert.equal(m.candidates.find(c=>c.entityId==='spacex-gen3').verifiedCount,100000);
  assert.equal(m.scenarios.forecastValues.length,0);
  assert.equal(m.rules.res35.deploymentAnchor,'end_of_seven_year_regulatory_period_not_actual_BIU');
  assert.ok(m.regulatoryEvents.some(e=>e.count===1616));
  const stages=m.stagedTargets.series.find(s=>s.entityId==='qianfan').stages;
  assert.deepEqual(stages.map(s=>s.count),[324,1296,11296]);
  assert.ok(stages.every((s,i)=>!i||s.date>stages[i-1].date));
});
