import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const data=JSON.parse(readFileSync(new URL('../data/metrics/constellation-assets.json',import.meta.url)));
test('constellation inventory has distinct, dated monthly estimates and snapshots',()=>{
  assert.equal(data.constellations.length,5);
  for(const c of data.constellations){
    assert.ok(c.history.length>100);
    assert.equal(c.history.at(-1).inOrbit,c.inOrbit);
    assert.equal(c.history.at(-1).kind,'constellation-snapshot');
    c.history.forEach((p,i)=>{assert.ok(Number.isInteger(p.inOrbit)&&p.inOrbit>=0);if(i)assert.ok(p.date>c.history[i-1].date);});
  }
  assert.ok(data.constellations[0].history.at(-2).inOrbit>10000);
});
test('ITU filings preserve unknown dates and do not infer compliance',()=>{
  assert.equal(data.filings.length,13);
  assert.ok(data.filings.some(f=>f.events.some(e=>e.kind==='biu'&&e.date<'2026-01-01')));
  for(const f of data.filings){assert.ok(f.sourceUrl.startsWith('https://'));for(const m of f.milestones)assert.ok(m.date===null||/^\d{4}-\d{2}-\d{2}$/.test(m.date));}
  assert.ok(data.filings.some(f=>f.milestones.every(m=>m.date===null)));
});
