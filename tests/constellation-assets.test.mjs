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
  assert.equal(data.filings.length,14);
  assert.ok(data.filings.some(f=>f.events.some(e=>e.kind==='biu'&&e.date<'2026-01-01')));
  for(const f of data.filings){assert.ok(f.sourceUrl.startsWith('https://'));for(const m of f.milestones)assert.ok(m.date===null||/^\d{4}-\d{2}-\d{2}$/.test(m.date));}
  assert.ok(data.filings.some(f=>f.milestones.every(m=>m.date===null)));
  assert.equal(data.filings.find(f=>f.id==='usa-usasat-ngso-8a').procedure.initialReceiptDate,'2019-03-26');
  assert.equal(data.filings.find(f=>f.id==='chn-sailspace-1').procedure.mifrRecordedDate,'2026-04-28');
  assert.ok(data.filings.some(f=>f.events.some(e=>e.kind==='anchor')));
});
test('filing enrichment separates notice quantities, original dates and large applications',()=>{
 for(const f of data.filings){assert.ok(f.basic);assert.ok(f.basic.notifiedCount>0);assert.ok(f.basic.sourceUrl.startsWith('https://'));if(f.events.some(e=>e.kind==='biu'))assert.ok(f.procedure.initialReceiptDate);}
 assert.equal(data.filings.find(f=>f.id==='nor-steam-1').procedure.initialReceiptDate,'2014-06-27');
 assert.equal(data.filings.find(f=>f.id==='g-l5ka').procedure.initialReceiptDate,'2012-11-27');
 for(const id of ['ctc-1','ctc-2']){const f=data.filings.find(f=>f.id===id);assert.equal(f.basic.notifiedCount,96714);assert.equal(f.constellationId,null);assert.equal(f.basic.apogeeKm,39700);}
 const api=data.filings.find(f=>f.id==='chn-sailspace-1-api2025');assert.equal(api.basic.notifiedCount,1296);assert.equal(api.procedure.regulatoryLimitDate,null);
 assert.equal(data.largeApplications[0].authority,'FCC');assert.equal(data.largeApplications[0].receivedAt,'2026-07-07');
});
