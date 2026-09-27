import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../data/research/current/', import.meta.url);
const load = (name) => JSON.parse(readFileSync(new URL(name, root), 'utf8'));
const input = {
  registry: load('constellation-registry.json'),
  itu: load('itu-milestones.json'),
  deployment: load('filing-deployment-progress.json'),
};
const iso = (raw) => raw.split('.').reverse().join('-');
const addDays = (date, days) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export function validate({ registry, itu, deployment }) {
  const errors = [], warnings = [];
  let checks = 0;
  const check = (condition, message) => { checks++; if (!condition) errors.push(message); };
  const unique = (records, key, label) => check(new Set(records.map(r => r[key])).size === records.length, `Duplicate ${label}`);
  unique(registry.constellations, 'id', 'constellation');
  unique(itu.filings, 'id', 'filing');
  unique(deployment.groups, 'filingId', 'deployment group');
  const ids = new Set(registry.constellations.map(c => c.id));
  const filings = new Map(itu.filings.map(f => [f.id, f]));
  const sourceIds = new Set(registry.sources.map(s => s.id));
  for (const dataset of [registry, itu, deployment]) {
    check(dataset.collectedAt === registry.collectedAt, 'Mixed collection dates');
    check(dataset.status === 'local-review', 'Unexpected integration status');
    for (const source of dataset.sources) {
      check(/^https:\/\//.test(source.url), `Missing source URL: ${source.id}`);
      for (const field of ['dataAsOf', 'publishedAt', 'retrievedAt']) {
        if (source[field]) check(source[field] <= dataset.collectedAt, `Future source date: ${source.id}`);
      }
    }
  }
  for (const c of registry.constellations) {
    check(c.eligibility.count >= 1000 && !!c.eligibility.basis, `Inclusion basis: ${c.id}`);
    check(sourceIds.has(c.eligibility.sourceId), `Inclusion source: ${c.id}`);
    const o = c.orbitSnapshot;
    check(o.inOrbit >= o.workingEstimate && o.workingEstimate >= o.operationalOrbitEstimate, `Orbit consistency: ${c.id}`);
    check(o.launched >= o.inOrbit, `Launch inventory: ${c.id}`);
    check(o.dataAsOf <= registry.collectedAt && !!o.scope, `Orbit date/scope: ${c.id}`);
    check(sourceIds.has(o.sourceId), `Orbit source: ${c.id}`);
  }
  for (const f of itu.filings) {
    check(!f.constellationId || ids.has(f.constellationId), `Unknown brand: ${f.id}`);
    check(!f.candidateConstellationId || ids.has(f.candidateConstellationId), `Unknown candidate: ${f.id}`);
    check(sourceIds.has(f.sourceId), `Filing source: ${f.id}`);
    if (!f.raw) { warnings.push(`${f.id}: no verified RES35 dates or denominator`); continue; }
    check(f.raw.sat_name === f.networkName, `Network identity changed: ${f.id}`);
    check(f.notifiedCountInStatusTable === f.raw.nbr_notif, `Raw notified count changed: ${f.id}`);
    for (const m of f.milestones) {
      const raw = f.raw[m.stage];
      const isDate = /^\d{2}\.\d{2}\.\d{4}$/.test(raw);
      check(m.rawValue === raw, `Raw status changed: ${f.id}/${m.stage}`);
      check(m.officialStatus === (isDate ? null : raw || null), `Official status changed: ${f.id}/${m.stage}`);
      check(raw === 'Met' || m.currentComplianceConclusion === null, `Pending treated as met: ${f.id}/${m.stage}`);
      if (isDate) check(m.deploymentExpiry === iso(raw), `Official expiry changed: ${f.id}/${m.stage}`);
      if (m.stage !== 'M0') {
        const expected = f.id === 'g-l5ku' ? `${m.deploymentExpiry.slice(0, 4)}-02-01` : addDays(m.deploymentExpiry, 30);
        check(m.informationSubmissionDeadline === expected, `Submission/expiry conflation: ${f.id}/${m.stage}`);
      }
    }
    if (f.brandMapping.status !== 'verified') warnings.push(`${f.id}: candidate brand association`);
    if (f.raw.sat_name.startsWith('USASAT') && f.raw.new_sat_name !== f.raw.sat_name) warnings.push(`${f.id}: preserved upstream alias anomaly`);
  }
  check(deployment.groups.length === itu.filings.length, 'Missing filing progress record');
  for (const g of deployment.groups) {
    const f = filings.get(g.filingId);
    check(!!f, `Missing filing reference: ${g.filingId}`);
    if (!f) continue;
    if (f.raw) {
      check(g.statusTable.rawDeploymentCount === f.raw.nbr_deploy, `Raw deployment altered: ${g.filingId}`);
      check(g.statusTable.reportedDeploymentCount === (f.raw.nbr_deploy > 0 ? f.raw.nbr_deploy : null), `Unprocessed zero shown as inventory: ${g.filingId}`);
    }
    if (g.currentQualifyingSatelliteCount === null) {
      check(g.currentDeploymentPercent === null && !!g.missingReason, `Unsupported percentage: ${g.filingId}`);
      warnings.push(`${g.filingId}: current qualifying inventory not verified`);
    }
    const r = g.latestProcessedReport;
    if (!r) continue;
    check(r.publicationDate <= registry.collectedAt, `Future report: ${g.filingId}`);
    check(/^[a-f0-9]{64}$/.test(r.sha256), `Report integrity metadata: ${g.filingId}`);
    const sum = (index) => r.orbitalPlanes.reduce((n, p) => n + p[index], 0);
    check(sum(5) === r.notified && sum(6) === r.deployed, `Plane totals mismatch: ${g.filingId}`);
    unique(r.orbitalPlanes.map(p => ({ id: `${p[0]}/${p[1]}` })), 'id', `plane ${g.filingId}`);
    check(r.deploymentAsOf === null && !!r.dateCaveat, `Expiry mislabeled as inventory date: ${g.filingId}`);
    for (const b of r.frequencyBands) {
      check(b.minimum === Math.floor(b.notified * 0.1), `M1 threshold rounding: ${g.filingId}/${b.bandId}`);
      check(b.deployed >= b.minimum === b.met, `Band conclusion mismatch: ${g.filingId}/${b.bandId}`);
    }
    check(r.stationIdentityQuality.completeUniqueMapping === (r.stationNames.length === r.deployed), `Station identity QA: ${g.filingId}`);
    if (!r.stationIdentityQuality.completeUniqueMapping) warnings.push(`${g.filingId}: incomplete/duplicate station identity extraction`);
    for (const discrepancy of r.discrepancies) warnings.push(`${g.filingId}: ${discrepancy}`);
  }
  return { result: errors.length ? 'FAIL' : 'PASS_WITH_GAPS', checks, errors, warnings, integrationReady: false };
}

if (process.argv.includes('--self-test')) {
  const baseline = validate(input);
  assert.equal(baseline.errors.length, 0);
  const bad = mutate => { const fixture = structuredClone(input); mutate(fixture); assert.ok(validate(fixture).errors.length > 0); };
  bad(d => d.registry.constellations.push(d.registry.constellations[0]));
  bad(d => d.deployment.groups.find(g => g.statusTable.rawDeploymentCount === 0).statusTable.reportedDeploymentCount = 0);
  bad(d => d.deployment.groups.find(g => g.latestProcessedReport).latestProcessedReport.frequencyBands[0].minimum += 1);
  bad(d => d.itu.filings.find(f => f.id === 'g-l5ku').milestones[2].currentComplianceConclusion = 'Met');
  bad(d => d.deployment.groups[0].currentDeploymentPercent = 90);
  bad(d => d.itu.filings[0].milestones[3].informationSubmissionDeadline = d.itu.filings[0].milestones[3].deploymentExpiry);
  console.log('Regression tests: 6 invalid fixtures rejected; valid baseline accepted.');
} else if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = validate(input);
  console.log(JSON.stringify(result, null, 2));
  if (result.errors.length) process.exitCode = 1;
}
