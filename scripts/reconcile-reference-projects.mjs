import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

// Deliberately no HTTP: collection is an attributed query/public-dataset workflow,
// not a scraper. This report cannot modify the production inventory.
export function reconcileReferences(watchlist, observations, inventory) {
  const projects = new Map(watchlist.projects.map(p => [p.id, p]));
  const fleets = new Map(inventory.constellations.map(c => [c.id, c]));
  const rows = observations.observations.map(o => {
    if (!projects.has(o.projectId)) throw new Error('Unknown reference project: ' + o.projectId);
    if (!projects.get(o.projectId).entities.includes(o.entityId)) throw new Error('Unknown entity mapping: ' + o.entityId);
    if (o.metric !== 'tracked-payloads' || o.unit !== 'satellites') throw new Error('Unsupported reference metric/unit');
    if (o.value !== null && (!Number.isInteger(o.value) || o.value < 0)) throw new Error('Invalid reference count');
    const fleet = fleets.get(o.entityId);
    const ours = fleet?.inventoryObservation;
    const localDate = ours?.dataAsOf ?? null;
    const localValue = ours?.inOrbit ?? null;
    const dated = /^\d{4}-\d{2}-\d{2}$/.test(o.asOf ?? '') && /^\d{4}-\d{2}-\d{2}$/.test(localDate ?? '');
    const sameDate = dated && o.asOf === localDate;
    const hasCounts = Number.isInteger(o.value) && Number.isInteger(localValue);
    const status = !hasCounts ? 'missing-count'
      : !dated ? 'unknown-date'
      : !sameDate ? 'date-mismatch'
      : o.value === localValue ? 'count-agreement'
      : 'coverage-difference-review';
    return {
      ...o, localValue, localAsOf:localDate, localSource:ours?.url ?? null,
      localScope:'physical-in-orbit-estimate', peerScope:'catalogue-tracked-payloads',
      status, deltaPeerMinusLocal:sameDate && hasCounts ? o.value - localValue : null,
      exactEpochAligned:false,
      interpretation:'Secondary coverage comparison only; page date may differ from catalogue epoch. Agreement is not proof, difference is not a verified inventory error.',
      action:status === 'coverage-difference-review' ? 'Check primary source, newest launch batches and naming coverage; do not overwrite automatically.' : 'Retain provenance and date; no automatic inventory correction.'
    };
  });
  return {
    schemaVersion:1, mode:'reference-only', productionDataModified:false,
    inputDates:[...new Set(rows.map(r=>r.asOf).filter(Boolean))].sort(),
    summary:{observations:rows.length,agreements:rows.filter(r=>r.status==='count-agreement').length,coverageReviews:rows.filter(r=>r.status==='coverage-difference-review').length,dateMismatches:rows.filter(r=>r.status==='date-mismatch').length},
    projects:watchlist.projects.map(p=>({id:p.id,name:p.name,accessMode:p.accessMode,status:rows.some(r=>r.projectId===p.id)?'observations-recorded':'awaiting-permitted-observation'})),
    rows
  };
}
async function main() {
  const read = async p => JSON.parse(await readFile(new URL('../' + p, import.meta.url), 'utf8'));
  const report = reconcileReferences(await read('data/research/priority-watchlist.json'), await read('data/research/current/reference-observations.json'), await read('data/metrics/constellation-assets.json'));
  // Deterministic: rerunning an old observation does not manufacture freshness.
  await writeFile(new URL('../data/research/current/reference-reconciliation.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report.summary));
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
