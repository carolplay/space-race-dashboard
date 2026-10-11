import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildConstellationOrbits} from '../scripts/build-constellation-orbits.mjs';
const assets={constellations:[{id:'starlink',nameZh:'星链',nameEn:'Starlink',inOrbit:4,asOf:'2026-10-09'}]};
const header='#JCAT\tName\tType\tDDate\tPerigee\tApogee\tInc\tOpOrbit\tPF\tAF\tIF\tODate\n# Updated 2026 Oct  9 1843:16\n';
test('catalogue grouping excludes reentered objects and preserves missing fields',()=>{
 const rows=['S1\tStarlink-1\tP\t-\t500\t550\t53.2\tLEO\t?\t\t\t2026 Oct 9',
 'S2\tStarlink-2\tP\t-\t-\t-\t53\tLEO\t\t\t\t-',
 'S3\tStarlink-3\tP\t2026 Oct 8\t500\t550\t53\tLEO\t\t\t\t-',
 'S4\tStarlink rocket\tR\t-\t500\t550\t53\tLEO\t\t\t\t-'];
 const d=buildConstellationOrbits(header+rows.join('\n'),assets,'2026-10-10T12:00:00Z'),f=d.fleets[0];
 assert.equal(f.catalogMatched,2);assert.equal(f.plotted,1);assert.equal(f.missingOrbit,1);assert.equal(f.flaggedOrbit,1);
 assert.equal(f.bins[0].altitudeKm,525);assert.equal(f.inventoryDifference,-2);assert.equal(d.source.updatedAt,'2026-10-09T18:43:16.000Z');
 assert.equal(f.orbitDateCoverage.datedRows,1);assert.equal(f.orbitDateCoverage.olderThan7Days,0);
 assert.throws(()=>buildConstellationOrbits('broken',assets,'date'));
});
test('all plotted catalogue objects are accounted for; no invented planes or links',async()=>{
 const d=JSON.parse(await readFile(new URL('../data/metrics/constellation-orbits.json',import.meta.url),'utf8'));
 assert.equal(d.fleets.length,5);
 for(const f of d.fleets){
  assert.equal(f.bins.reduce((s,b)=>s+b.count,0),f.plotted);
  assert.equal(f.plotted+f.missingOrbit,f.catalogMatched);
  assert.equal(f.orbitDateCoverage.datedRows+f.orbitDateCoverage.undatedRows,f.plotted);
  for(const b of f.bins){assert.ok(Number.isFinite(b.altitudeKm));assert.ok(Number.isFinite(b.inclinationDeg));assert.ok(b.count>0);}
 }
 assert.ok(d.method.notAvailable.includes('actual ISL topology'));
 assert.match(d.source.sha256,/^[a-f0-9]{64}$/);
});
