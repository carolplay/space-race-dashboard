import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SATCAT_URL = "https://planet4589.org/space/gcat/tsv/cat/satcat.tsv";
const EXTENDED_URL = "https://planet4589.org/space/gcat/tsv/cat/satcat100k.tsv";
const LAUNCHLOG_URL = "https://planet4589.org/space/gcat/tsv/derived/launchlog.tsv";
const RELEASE_URL = "https://planet4589.org/space/gcat/web/rel.html";
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = resolve(projectRoot, "data/metrics/historical-series.json");

function arg(name, fallback) {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length) ?? fallback;
}

function parseTsv(text) {
  const lines = text.split(/\r?\n/);
  const headerLine = lines.find((line) => line.startsWith("#") && line.includes("\t"));
  if (!headerLine) throw new Error("GCAT TSV header not found");
  const headers = headerLine.slice(1).split("\t").map((value) => value.trim());
  return lines
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const values = line.split("\t");
      return Object.fromEntries(headers.map((header, index) => [header, (values[index] ?? "").trim()]));
    });
}

function checksum(text) {
  return createHash("sha256").update(text).digest("hex");
}

function catalogUpdatedAt(text) {
  const value = text.match(/^# Updated\s+(.+)$/m)?.[1]?.trim();
  if (!value) return { raw: null, iso: null };
  const match = value.match(/^(\d{4})\s+([A-Z][a-z]{2})\s+(\d{1,2})\s+(\d{2})(\d{2}):(\d{2})$/);
  if (!match) return { raw: value, iso: null };
  const months = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
  const [, year, month, day, hour, minute, second] = match;
  return { raw: value, iso: new Date(Date.UTC(Number(year), months[month], Number(day), Number(hour), Number(minute), Number(second))).toISOString() };
}

function latestRelease(text) {
  const rows = [...text.matchAll(/<TR><TD>GCAT\s+([^<]+)<TD>([^<]+)/g)];
  const latest = rows.at(-1);
  return latest ? { version: latest[1].trim(), date: latest[2].trim() } : { version: null, date: null };
}

function yearFromVagueDate(value) {
  const match = value?.match(/^(\d{4})/);
  return match ? Number(match[1]) : null;
}

function regionFor(state) {
  const code = (state ?? "").replaceAll("[", "").replaceAll("]", "").replaceAll("*", "");
  if (code === "US") return "us";
  if (["CN", "PRC", "HK"].includes(code)) return "cn";
  return "other";
}

function emptyRegions() {
  return { us: 0, cn: 0, other: 0, global: 0 };
}

function add(bucket, region, amount = 1) {
  bucket[region] += amount;
  bucket.global += amount;
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "space-race-dashboard/0.7 (github.com/carolplay/space-race-dashboard)" },
  });
  if (!response.ok) throw new Error(`GCAT returned ${response.status} for ${url}`);
  return response.text();
}

const fromYear = Number(arg("from", "2000"));
const currentYear = new Date().getUTCFullYear();
const toYear = Number(arg("to", String(currentYear)));
if (!Number.isInteger(fromYear) || !Number.isInteger(toYear) || fromYear > toYear) throw new Error("Expected integer --from and --to years");

const [satcatText, extendedText, launchlogText, releaseText] = await Promise.all([fetchText(SATCAT_URL), fetchText(EXTENDED_URL), fetchText(LAUNCHLOG_URL), fetchText(RELEASE_URL)]);
// Standard and extended catalogs are disjoint by number; deduplicate by JCAT anyway.
const satelliteRows = [...new Map([...parseTsv(satcatText), ...parseTsv(extendedText)].map(row => [row.JCAT, row])).values()];
const launchRows = parseTsv(launchlogText);
const release = latestRelease(releaseText);
const uniqueLaunches = [...new Map(launchRows.map((row) => [row.Launch_Tag, row])).values()];
const years = Array.from({ length: toYear - fromYear + 1 }, (_, index) => fromYear + index);

const launchActivity = years.map((year) => {
  const attempts = emptyRegions();
  const success = emptyRegions();
  for (const row of uniqueLaunches) {
    if (yearFromVagueDate(row.Launch_Date) !== year) continue;
    if (!/^[OD]/.test(row.Launch_Code)) continue;
    const region = regionFor(row.LVState);
    add(attempts, region);
    if (!row.Launch_Code.includes("F")) add(success, region);
  }
  return { year: String(year), label: year === currentYear ? `${year} YTD` : String(year), attempts, success };
});

const orbitInventory = years.map((year) => {
  const payloadObjects = emptyRegions();
  const catalogObjects = emptyRegions();
  const knownPayloadMassKg = emptyRegions();
  let knownPayloadMassObjects = 0;
  for (const row of satelliteRows) {
    if (row.Primary !== "Earth") continue;
    const startYear = yearFromVagueDate(row.SDate) ?? yearFromVagueDate(row.LDate);
    const decayYear = yearFromVagueDate(row.DDate);
    if (!startYear || startYear > year || (decayYear && decayYear <= year)) continue;
    const region = regionFor(row.State);
    add(catalogObjects, region);
    if (!row.Type?.startsWith("P")) continue;
    add(payloadObjects, region);
    const mass = Number.parseFloat(row.Mass);
    if (Number.isFinite(mass) && mass > 0) {
      add(knownPayloadMassKg, region, mass);
      knownPayloadMassObjects += 1;
    }
  }
  return {
    year: String(year),
    label: year === currentYear ? `${year} NOW` : `${year} EOY`,
    payloadObjects,
    catalogObjects,
    knownPayloadMassKg,
    knownPayloadMassObjects,
  };
});

const payloadFlow = years.map((year) => {
  const additions = emptyRegions();
  const retirements = emptyRegions();
  const knownDeliveredMassKg = emptyRegions();
  let knownDeliveredMassObjects = 0;
  for (const row of satelliteRows) {
    if (row.Primary !== "Earth" || !row.Type?.startsWith("P")) continue;
    const startYear = yearFromVagueDate(row.SDate) ?? yearFromVagueDate(row.LDate);
    const decayYear = yearFromVagueDate(row.DDate);
    const region = regionFor(row.State);
    if (startYear === year) {
      add(additions, region);
      const mass = Number.parseFloat(row.Mass);
      if (Number.isFinite(mass) && mass > 0) {
        add(knownDeliveredMassKg, region, mass);
        knownDeliveredMassObjects += 1;
      }
    }
    if (decayYear === year) add(retirements, region);
  }
  return {
    year: String(year),
    label: year === currentYear ? `${year} YTD` : String(year),
    additions,
    retirements,
    netChange: Object.fromEntries(Object.keys(additions).map((region) => [region, additions[region] - retirements[region]])),
    knownDeliveredMassKg,
    knownDeliveredMassObjects,
  };
});

function codeLabel(value) {
  return (value || "Unknown").replaceAll("?", "").replaceAll("*", "").trim() || "Unknown";
}

const manufacturerMap = new Map();
for (const row of satelliteRows) {
  if (row.Primary !== "Earth" || !row.Type?.startsWith("P")) continue;
  const startYear = yearFromVagueDate(row.SDate) ?? yearFromVagueDate(row.LDate);
  if (!startYear || startYear < Math.max(fromYear, toYear - 4) || startYear > toYear) continue;
  const manufacturer = codeLabel(row.Manufacturer);
  const region = regionFor(row.State);
  if (!manufacturerMap.has(manufacturer)) manufacturerMap.set(manufacturer, { manufacturer, ...emptyRegions(), knownMassKg: 0, knownMassObjects: 0 });
  const item = manufacturerMap.get(manufacturer);
  item[region] += 1;
  item.global += 1;
  const mass = Number.parseFloat(row.Mass);
  if (Number.isFinite(mass) && mass > 0) {
    item.knownMassKg += mass;
    item.knownMassObjects += 1;
  }
}
const recentManufacturers = [...manufacturerMap.values()]
  .sort((a, b) => b.global - a.global || b.knownMassKg - a.knownMassKg || a.manufacturer.localeCompare(b.manufacturer))
  .slice(0, 16);

const generatedAt = new Date().toISOString();
const launchCutoff = catalogUpdatedAt(launchlogText).iso?.slice(0, 10);
const payloadCutoff = catalogUpdatedAt(satcatText).iso?.slice(0, 10);
if (!launchCutoff || !payloadCutoff) throw new Error('Missing upstream cutoff: cannot construct a same-period comparison');
const months = { Jan:'01', Feb:'02', Mar:'03', Apr:'04', May:'05', Jun:'06', Jul:'07', Aug:'08', Sep:'09', Oct:'10', Nov:'11', Dec:'12' };
function preciseDate(value) {
  const match = value?.match(/^(\d{4})\s+([A-Z][a-z]{2})\s+(\d{1,2})(?:\s|$)/);
  return match && months[match[2]] ? `${match[1]}-${months[match[2]]}-${match[3].padStart(2,'0')}` : null;
}
const comparisonYear = Number(payloadCutoff.slice(0,4));
const samePeriod = [comparisonYear - 1, comparisonYear].map(year => {
  const attempts=emptyRegions(), success=emptyRegions(), additions=emptyRegions(), knownDeliveredMassKg=emptyRegions();
  let excludedImprecisePayloadDates=0;
  for (const row of uniqueLaunches) {
    const date=preciseDate(row.Launch_Date);
    if (!date || !date.startsWith(String(year)) || date.slice(5)>launchCutoff.slice(5) || !/^[OD]/.test(row.Launch_Code)) continue;
    add(attempts,regionFor(row.LVState));
    if (!row.Launch_Code.includes('F')) add(success,regionFor(row.LVState));
  }
  for (const row of satelliteRows) {
    if (row.Primary!=='Earth' || !row.Type?.startsWith('P')) continue;
    const value=row.SDate && row.SDate!=='-' ? row.SDate : row.LDate;
    if(yearFromVagueDate(value)!==year)continue;
    const date=preciseDate(value);
    if(!date){excludedImprecisePayloadDates++;continue;}
    if(date.slice(5)>payloadCutoff.slice(5))continue;
    const region=regionFor(row.State);add(additions,region);
    const mass=Number.parseFloat(row.Mass);if(Number.isFinite(mass)&&mass>0)add(knownDeliveredMassKg,region,mass);
  }
  return {year:String(year),launchCutoff:`${year}-${launchCutoff.slice(5)}`,payloadCutoff:`${year}-${payloadCutoff.slice(5)}`,attempts,success,additions,knownDeliveredMassKg,excludedImprecisePayloadDates};
});
const output = {
  schemaVersion: 3,
  generatedAt,
  coverage: { fromYear, toYear, currentYearIsPartial: toYear === currentYear, launchCutoff, payloadCutoff },
  source: {
    name: "GCAT",
    publisher: "Jonathan C. McDowell",
    release: release.version,
    releaseDate: release.date,
    license: "CC-BY-4.0",
    url: "https://planet4589.org/space/gcat/",
    satcat: { url: SATCAT_URL, sha256: checksum(satcatText), updated: catalogUpdatedAt(satcatText) },
    satcat100k: { url: EXTENDED_URL, sha256: checksum(extendedText), updated: catalogUpdatedAt(extendedText), rows: parseTsv(extendedText).length },
    launchlog: { url: LAUNCHLOG_URL, sha256: checksum(launchlogText), updated: catalogUpdatedAt(launchlogText) },
  },
  methodology: {
    launchAttempts: "Unique Launch_Tag rows whose Launch_Code begins O or D; failure codes remain attempts.",
    launchSuccess: "Attempt rows whose Launch_Code does not contain F.",
    orbitInventory: "Earth-primary objects present at calendar year end from separation and descent years. Current year is as-of source update.",
    payloadDefinition: "GCAT object Type beginning P; includes active and inactive payload objects, unlike the current Active Catalog KPI.",
    catalogCoverage: "Standard SATCAT plus SATCAT100K, deduplicated by JCAT. Auxiliary and temporary catalogs are not included; this remains a catalog-based lower bound.",
    samePeriod: "Previous/current year through the same upstream month/day; imprecise payload dates excluded and counted explicitly. GCAT LVState groups launches, unlike LL2 provider nationality.",
    payloadFlow: "Earth-primary payload starts, descents, and known mass by GCAT separation/descent year. Mass totals include only objects with a positive published mass.",
    recentManufacturers: `Payload objects first present during ${Math.max(fromYear, toYear - 4)}-${toYear}, grouped by GCAT Manufacturer code; this measures observed delivery, not factory capacity.`,
  },
  launchActivity,
  samePeriod,
  orbitInventory,
  payloadFlow,
  recentManufacturers,
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(`Stored GCAT historical series ${fromYear}-${toYear}: ${uniqueLaunches.length} unique launch tags, ${satelliteRows.length} object rows.`);
await import('./build-demand-forecast.mjs');
