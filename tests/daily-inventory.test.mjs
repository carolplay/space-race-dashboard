import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));

test('latest fleet observations retain subgroup scopes and upstream dates',()=>{
  const assets=read('data/metrics/constellation-assets.json');
  const labels={starlink:'Total','amazon-leo':'Kuiper satellites',oneweb:'OneWeb',guowang:'HW Digui',qianfan:'Qianfan Xingzuo'};
  for(const c of assets.constellations){
    const o=c.inventoryObservation;
    assert.equal(o.rowLabel,labels[c.id]);
    assert.equal(o.launched-o.totalDown,o.inOrbit);
    assert.equal(c.inOrbit,o.inOrbit);
    assert.equal(c.asOf,o.updatedAt.slice(0,10));
    assert.ok(o.operationalOrbitEstimate<=o.workingEstimate&&o.workingEstimate<=o.inOrbit);
    assert.ok(Date.parse(o.updatedAt)<=Date.parse(assets.inventoryRetrievedAt));
    assert.equal(c.history.at(-1).inOrbit,c.inOrbit);
  }
});

test('forecast uses actual inventory cutoff, not fixed September day count',()=>{
  const h=read('data/metrics/historical-series.json'),f=read('data/metrics/demand-forecast.json');
  assert.equal(f.sourceCutoffs.inventory,h.coverage.payloadCutoff);
  const stock=y=>h.orbitInventory.find(p=>p.year===String(y)).payloadObjects.global;
  const days=(Date.parse(h.coverage.payloadCutoff+'T00:00:00Z')-Date.UTC(2026,0,1))/864e5+1;
  const pace=Math.max(0,(stock(2025)-stock(2024))*.4+(stock(2026)-stock(2025))*.6*365/days);
  assert.equal(f.orbitalInventory[1].count,Math.round((stock(2026)+pace)/50)*50);
});

test('official status observations do not invent BIU or achievement dates',()=>{
  const assets=read('data/metrics/constellation-assets.json');
  for(const f of assets.filings.filter(f=>f.statusObservation)){
    assert.ok(f.statusObservation.raw.sat_name);
    assert.equal(f.statusObservation.upstreamUpdatedAt,null);
    const m0=f.milestones.find(m=>m.stage==='M0');
    assert.equal(m0.status,f.statusObservation.raw.M0);
    assert.equal(m0.date,null);
    if(f.id.startsWith('usa-usasat-ngso-8'))assert.equal(f.basic.biuConfirmed,false);
  }
});
