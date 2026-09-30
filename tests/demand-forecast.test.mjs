import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const data=JSON.parse(readFileSync(new URL('../data/metrics/demand-forecast.json',import.meta.url)));
const history=JSON.parse(readFileSync(new URL('../data/metrics/historical-series.json',import.meta.url)));
const fleets=JSON.parse(readFileSync(new URL('../data/metrics/constellation-assets.json',import.meta.url)));

test('forecast anchors to observed data without treating YTD as a full year',()=>{
  assert.equal(data.launchHistorical.at(-1).global,history.launchActivity.find(p=>p.year==='2025').attempts.global);
  assert.ok(data.launch[0].global>history.launchActivity.find(p=>p.year==='2026').attempts.global);
  assert.equal(data.inventoryHistorical.at(-1).count,history.orbitInventory.find(p=>p.year==='2026').payloadObjects.global);
  assert.equal(data.orbitalInventory[0].count,data.inventoryHistorical.at(-1).count);
  assert.equal(data.fleets.length,fleets.constellations.length);
  for(const f of data.fleets)assert.equal(f.points[0].count,f.observed);
});

test('conditional filing pressure is not counted as physical stock or baseline launches',()=>{
  assert.equal(data.years.at(-1),2036);
  assert.equal(data.ctcConditional.find(p=>p.year===2034).threshold,9672);
  assert.ok(!data.targets.some(t=>t.id==='ctc-1'));
  assert.ok(data.milestoneDemand.every(p=>p.launchEquivalentsLow<=p.launchEquivalents&&p.launchEquivalents<=p.launchEquivalentsHigh));
  assert.ok(data.launch.every(p=>p.global===p.us+p.cn+p.other));
  assert.ok(data.orbitalInventory.every(p=>p.count<96714));
});
