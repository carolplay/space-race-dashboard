import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ACTIVE_URL = "https://planet4589.org/space/gcat/tsv/derived/active.tsv";
const CURRENT_URL = "https://planet4589.org/space/gcat/tsv/derived/currentcat.tsv";
const RELEASE_URL = "https://planet4589.org/space/gcat/web/rel.html";
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const snapshotsDir = resolve(projectRoot, "data/snapshots/orbit-assets");
const metricsPath = resolve(projectRoot, "data/metrics/orbit-assets.json");
const ORBIT_ORDER = ["LEO", "MEO", "GEO", "HEO"];
const CATEGORY_ORDER = ["通信", "地球观测", "导航定位", "科学", "技术验证", "载人航天", "国防/未公开", "其他"];

function arg(name) {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length);
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

function regionFor(state) {
  const code = (state ?? "").replaceAll("[", "").replaceAll("]", "").replaceAll("*", "");
  if (code === "US") return "us";
  if (["CN", "PRC", "HK"].includes(code)) return "cn";
  return "other";
}

function orbitFor(opOrbit, perigeeValue, apogeeValue) {
  const code = opOrbit ?? "";
  if (/^(LEO|LLEO)/.test(code)) return "LEO";
  if (/^MEO/.test(code)) return "MEO";
  if (/^GEO/.test(code)) return "GEO";
  if (/^(GTO|HEO|VHEO|MOL)/.test(code)) return "HEO";
  const perigee = Number.parseFloat(perigeeValue);
  const apogee = Number.parseFloat(apogeeValue);
  if (!Number.isFinite(perigee) || !Number.isFinite(apogee)) return null;
  if (perigee < -100 || /^(EEO|HCO|LLO|L[1-5])/.test(code)) return null;
  if (apogee <= 2_000) return "LEO";
  if (perigee >= 34_000 && apogee <= 38_000) return "GEO";
  if (perigee >= 2_000 && apogee < 34_000) return "MEO";
  return "HEO";
}

function categoryFor(value) {
  const category = (value ?? "").split("/")[0].replaceAll("?", "").replaceAll("*", "");
  if (category === "COM") return "通信";
  if (["EOSCI", "IMG", "IMG-R", "MET", "MET-RO"].includes(category)) return "地球观测";
  if (category === "NAV") return "导航定位";
  if (["AST", "BIO", "GEOD", "MGRAV", "SCI"].includes(category)) return "科学";
  if (["CAL", "EDU", "TECH"].includes(category)) return "技术验证";
  if (["INF", "RV", "SS"].includes(category)) return "载人航天";
  if (["EW", "SIG", "TARG", "WEAPON"].includes(category)) return "国防/未公开";
  return "其他";
}

function emptyRegions() {
  return { us: 0, cn: 0, other: 0, global: 0 };
}

function firstPositiveNumber(...values) {
  for (const value of values) {
    const number = Number.parseFloat(value);
    if (Number.isFinite(number) && number > 0) return number;
  }
  return null;
}

function addCount(map, key, region, amount = 1) {
  if (!map.has(key)) map.set(key, emptyRegions());
  const bucket = map.get(key);
  bucket[region] += amount;
  bucket.global += amount;
}

function mapToRows(map, order) {
  return [...map.entries()]
    .map(([name, values]) => ({ name, ...values }))
    .sort((a, b) => {
      const ai = order.indexOf(a.name);
      const bi = order.indexOf(b.name);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi) || b.global - a.global;
    });
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "space-race-dashboard/0.6 (github.com/carolplay/space-race-dashboard)" },
  });
  if (!response.ok) throw new Error(`GCAT returned ${response.status} for ${url}`);
  return response.text();
}

const date = arg("date") ?? new Date().toISOString().slice(0, 10);
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Expected --date=YYYY-MM-DD");
const [activeText, currentText, releaseText] = await Promise.all([fetchText(ACTIVE_URL), fetchText(CURRENT_URL), fetchText(RELEASE_URL)]);
const activeRows = parseTsv(activeText);
const currentRows = parseTsv(currentText);
const release = latestRelease(releaseText);

const activeByRegion = emptyRegions();
const knownMassByRegionKg = emptyRegions();
const categoryMap = new Map();
const orbitMap = new Map();
let knownMassObjects = 0;

const earthActive = activeRows.filter((row) => orbitFor(row.OpOrbit, row.Perigee, row.Apogee));
for (const row of earthActive) {
  const region = regionFor(row.OwnState);
  activeByRegion[region] += 1;
  activeByRegion.global += 1;
  addCount(categoryMap, categoryFor(row.Category), region);
  addCount(orbitMap, orbitFor(row.OpOrbit, row.Perigee, row.Apogee), region);
  const mass = firstPositiveNumber(row.DryMass, row.Mass, row.LaunchMass);
  if (mass != null) {
    knownMassObjects += 1;
    knownMassByRegionKg[region] += mass;
    knownMassByRegionKg.global += mass;
  }
}

const catalogByRegion = emptyRegions();
const objectTypeMap = new Map();
for (const row of currentRows) {
  if (row.DDate !== "-") continue;
  const orbit = orbitFor(row.OpOrbit, row.Perigee, row.Apogee);
  if (!orbit) continue;
  const region = regionFor(row.State);
  catalogByRegion[region] += 1;
  catalogByRegion.global += 1;
  const kind = row.Type?.startsWith("P") ? "有效载荷/失效载荷"
    : row.Type?.startsWith("R") ? "火箭体"
      : row.Type?.startsWith("D") ? "碎片"
        : "任务组件/其他";
  addCount(objectTypeMap, kind, region);
}

const operatorMap = new Map();
for (const row of earthActive) {
  const owner = (row.Owner || "Unknown").replaceAll("?", "").replaceAll("*", "").trim() || "Unknown";
  const region = regionFor(row.OwnState);
  addCount(operatorMap, owner, region);
}
const byOperator = mapToRows(operatorMap, []).slice(0, 20);

const retrievedAt = new Date().toISOString();
const snapshot = {
  schemaVersion: 1,
  date,
  retrievedAt,
  source: {
    name: "GCAT",
    publisher: "Jonathan C. McDowell",
    release: release.version,
    releaseDate: release.date,
    license: "CC-BY-4.0",
    url: "https://planet4589.org/space/gcat/",
    activeCatalog: { url: ACTIVE_URL, sha256: checksum(activeText), updated: catalogUpdatedAt(activeText) },
    currentCatalog: { url: CURRENT_URL, sha256: checksum(currentText), updated: catalogUpdatedAt(currentText) },
  },
  validation: {
    esaEnvironmentMassTonnes: 17_000,
    esaAsOf: "2026-07-31",
    esaUrl: "https://sdup.esoc.esa.int/discosweb/statistics/",
  },
  activePayloads: activeByRegion,
  catalogObjects: catalogByRegion,
  knownActivePayloadMassKg: knownMassByRegionKg,
  massCoverage: {
    knownObjects: knownMassObjects,
    totalObjects: earthActive.length,
    percent: Number(((knownMassObjects / Math.max(earthActive.length, 1)) * 100).toFixed(1)),
    field: "DryMass with legacy Mass / LaunchMass fallback",
    caveat: "Dry mass is preferred for current in-orbit inventory; LaunchMass is used only when no dry-mass field is present.",
  },
  byCategory: mapToRows(categoryMap, CATEGORY_ORDER),
  byOrbit: mapToRows(orbitMap, ORBIT_ORDER),
  byObjectType: mapToRows(objectTypeMap, ["有效载荷/失效载荷", "火箭体", "任务组件/其他", "碎片"]),
  byOperator,
};

await mkdir(snapshotsDir, { recursive: true });
await mkdir(dirname(metricsPath), { recursive: true });
await writeFile(resolve(snapshotsDir, `${date}.json`), `${JSON.stringify(snapshot, null, 2)}\n`);

const snapshotFiles = (await readdir(snapshotsDir)).filter((name) => /^\d{4}-\d{2}-\d{2}\.json$/.test(name)).sort();
const snapshots = await Promise.all(snapshotFiles.map(async (name) => JSON.parse(await readFile(resolve(snapshotsDir, name), "utf8"))));
const metrics = {
  schemaVersion: 1,
  generatedAt: retrievedAt,
  source: snapshot.source,
  snapshots: snapshots.map((item) => ({
    date: item.date,
    activePayloads: item.activePayloads,
    catalogObjects: item.catalogObjects,
    knownActivePayloadMassKg: item.knownActivePayloadMassKg,
    massCoverage: item.massCoverage,
  })),
  current: snapshots.at(-1),
};
await writeFile(metricsPath, `${JSON.stringify(metrics, null, 2)}\n`);

console.log(`Stored GCAT orbit snapshot ${date}: ${activeByRegion.global} active payloads, ${catalogByRegion.global} catalog objects.`);
console.log(`Known active-payload mass: ${(knownMassByRegionKg.global / 1_000).toFixed(1)} t (${snapshot.massCoverage.percent}% object coverage).`);
