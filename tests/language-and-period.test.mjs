import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const languageSource=await readFile(new URL('../lib/dashboard-language.ts',import.meta.url),'utf8');
const js=ts.transpileModule(languageSource,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {sourceLabel,periodLabel,planDate}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));

test('localizes source labels, legacy bilingual fields and period qualifiers',()=>{
  assert.equal(sourceLabel('Long March 6A | Yaogan 40 Group 04','zh'),'长征6A | 遥感40号 04组');
  assert.equal(sourceLabel('Space Launch Complex 4E','zh'),'航天发射台 4E');
  assert.equal(sourceLabel('China SatNet','zh'),'中国星网');
  assert.equal(sourceLabel('朱雀三号 / Zhuque-3','en'),'Zhuque-3');
  assert.equal(sourceLabel('朱雀三号 / Zhuque-3','zh'),'朱雀三号');
  assert.equal(sourceLabel('约 T+8:19','en'),'Approx. T+8:19');
  assert.equal(sourceLabel('民勤着陆场坪','en'),'Minqin landing zone');
  assert.equal(periodLabel('2026 YTD','zh'),'2026 年内累计');
  assert.equal(periodLabel('2025 EOY','zh'),'2025 年末');
  assert.equal(planDate('2027 MID','zh'),'2027年中');
  assert.equal(planDate('BEFORE 2030','zh'),'2030年前');
});

test('history includes six-digit catalogs and auditable matched-period counts',async()=>{
  const h=JSON.parse(await readFile(new URL('../data/metrics/historical-series.json',import.meta.url),'utf8'));
  assert.ok(h.source.satcat100k.rows>0);
  assert.match(h.source.satcat100k.sha256,/^[a-f0-9]{64}$/);
  assert.equal(h.samePeriod.length,2);
  const [before,now]=h.samePeriod;
  assert.equal(now.payloadCutoff.slice(5),before.payloadCutoff.slice(5));
  assert.equal(now.launchCutoff.slice(5),before.launchCutoff.slice(5));
  for(const p of h.samePeriod)for(const k of ['attempts','success','additions','knownDeliveredMassKg'])assert.ok(Math.abs(p[k].global-p[k].us-p[k].cn-p[k].other)<1e-6);
  assert.ok(h.payloadFlow.at(-1).additions.global>=3299,'Regression: extended 2026 payload objects must not disappear');
  assert.ok(now.excludedImprecisePayloadDates>=0);
  const fleet=JSON.parse(await readFile(new URL('../data/metrics/constellation-assets.json',import.meta.url),'utf8'));
  assert.equal(fleet.source.catalogs.length,2);
  assert.ok(fleet.source.catalogs.some(s=>s.url.endsWith('/satcat100k.tsv')));
  assert.ok(fleet.constellations.find(c=>c.id==='starlink').history.find(p=>p.date==='2026-08-31').inOrbit>=11093);
});
