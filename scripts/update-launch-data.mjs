import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const API_ROOT = "https://ll.thespacedevs.com/2.3.0/launches/";
const SUCCESS_STATUS_IDS = new Set([3]);
const ATTEMPT_STATUS_IDS = new Set([3, 4, 7]);
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const snapshotPath = resolve(projectRoot, "data/snapshots/launch-library-2.json");
const metricsPath = resolve(projectRoot, "data/metrics/launch-activity.json");

function readArg(name) {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length);
}

function isoDate(value, name) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? "")) {
    throw new Error(`Expected --${name}=YYYY-MM-DD`);
  }
  return value;
}

function defaultWindow() {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  const fromDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  return { from: fromDate.toISOString().slice(0, 10), to };
}

function regionFor(countryCode) {
  if (countryCode === "US") return "us";
  if (countryCode === "CN") return "cn";
  return "other";
}

function countryFor(launch) {
  const providerId = launch.launch_service_provider?.id;
  const providerAtPad = launch.pad?.agencies?.find((agency) => agency.id === providerId);
  const providerCountry = providerAtPad?.country?.[0]?.alpha_2_code;
  if (providerCountry) {
    return { countryCode: providerCountry, classificationBasis: "lsp_agency_country" };
  }

  const padCountry = launch.pad?.country?.alpha_2_code
    ?? launch.pad?.location?.country?.alpha_2_code
    ?? null;
  return { countryCode: padCountry, classificationBasis: "pad_country_fallback" };
}

function normalize(launch) {
  const { countryCode, classificationBasis } = countryFor(launch);
  const configuration = launch.rocket?.configuration;
  return {
    id: launch.id,
    name: launch.name,
    net: launch.net,
    statusId: launch.status?.id ?? null,
    status: launch.status?.name ?? null,
    launchDesignator: launch.launch_designator ?? null,
    providerId: launch.launch_service_provider?.id ?? null,
    provider: launch.launch_service_provider?.name ?? null,
    countryCode,
    region: regionFor(countryCode),
    classificationBasis,
    orbit: launch.mission?.orbit?.abbrev ?? null,
    rocketConfigurationId: configuration?.id ?? null,
    rocketConfiguration: configuration?.name ?? null,
    rocketFullName: configuration?.full_name ?? configuration?.name ?? null,
    rocketFamily: configuration?.families?.at(-1)?.name ?? configuration?.name ?? "未分类",
    lastUpdated: launch.last_updated ?? null,
    sourceUrl: launch.url,
  };
}

function resolveProviderCountries(records) {
  const countryByProvider = new Map();
  for (const record of records) {
    if (record.providerId && record.countryCode && record.classificationBasis === "lsp_agency_country") {
      countryByProvider.set(record.providerId, record.countryCode);
    }
  }
  return records.map((record) => {
    const providerCountry = record.providerId ? countryByProvider.get(record.providerId) : null;
    if (!providerCountry || record.classificationBasis === "lsp_agency_country") return record;
    return {
      ...record,
      countryCode: providerCountry,
      region: regionFor(providerCountry),
      classificationBasis: "lsp_country_inferred_from_peer",
    };
  });
}

function inferRocketFields(record) {
  if (record.rocketFamily) return record;
  const configuration = record.name?.split("|")[0]?.trim() || "未分类";
  let family = configuration;
  if (/^Falcon 9\b/.test(configuration)) family = "Falcon 9";
  else if (/^Falcon Heavy\b/.test(configuration)) family = "Falcon Heavy";
  else if (/^Soyuz 2\b/.test(configuration)) family = "Soyuz 2";
  else if (/^Electron\b/.test(configuration)) family = "Electron";
  else if (/^Atlas V\b/.test(configuration)) family = "Atlas V";
  else if (/^Vulcan\b/.test(configuration)) family = "Vulcan";
  else if (/^Ariane 6\b/.test(configuration)) family = "Ariane 6";
  else if (/^Ariane 5\b/.test(configuration)) family = "Ariane 5";
  else if (/^Vega[ -]/.test(configuration)) family = "Vega";
  else if (/^PSLV\b/.test(configuration)) family = "PSLV";
  else if (/^GSLV\b/.test(configuration)) family = "GSLV";
  else if (/^H-?IIA\b/.test(configuration)) family = "H-IIA";
  else if (/^H3\b/.test(configuration)) family = "H3";
  return {
    ...record,
    rocketConfiguration: configuration,
    rocketFullName: configuration,
    rocketFamily: family,
    rocketClassificationBasis: "launch_name_prefix",
  };
}

async function fetchLaunches(from, to) {
  const url = new URL(API_ROOT);
  url.searchParams.set("format", "json");
  url.searchParams.set("mode", "normal");
  url.searchParams.set("limit", "100");
  url.searchParams.set("ordering", "net");
  url.searchParams.set("include_suborbital", "false");
  url.searchParams.set("net__gte", `${from}T00:00:00Z`);
  url.searchParams.set("net__lte", `${to}T23:59:59Z`);

  const records = [];
  let next = url.toString();
  let requestCount = 0;
  while (next) {
    requestCount += 1;
    const response = await fetch(next, {
      headers: {
        Accept: "application/json",
        "User-Agent": "space-race-dashboard/0.5 (github.com/carolplay/space-race-dashboard)",
      },
    });
    if (!response.ok) {
      const retryAfter = response.headers.get("retry-after");
      throw new Error(`Launch Library 2 returned ${response.status}${retryAfter ? `; retry after ${retryAfter}s` : ""}`);
    }
    const page = await response.json();
    records.push(...page.results.map(normalize));
    next = page.next;
  }
  return { records, requestCount };
}

async function readExisting() {
  try {
    return JSON.parse(await readFile(snapshotPath, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return { records: [] };
    throw error;
  }
}

function aggregate(records, generatedAt, from, to) {
  const byYear = new Map();
  const rocketFamilies = new Map();
  for (const record of records) {
    if (!ATTEMPT_STATUS_IDS.has(record.statusId)) continue;
    const year = record.net.slice(0, 4);
    if (!byYear.has(year)) {
      byYear.set(year, {
        attempts: { us: 0, cn: 0, other: 0 },
        success: { us: 0, cn: 0, other: 0 },
      });
    }
    const bucket = byYear.get(year);
    bucket.attempts[record.region] += 1;
    if (SUCCESS_STATUS_IDS.has(record.statusId)) bucket.success[record.region] += 1;

    const familyKey = `${year}\t${record.region}\t${record.rocketFamily ?? "未分类"}`;
    if (!rocketFamilies.has(familyKey)) {
      rocketFamilies.set(familyKey, {
        year,
        region: record.region,
        family: record.rocketFamily ?? "未分类",
        attempts: 0,
        success: 0,
      });
    }
    const family = rocketFamilies.get(familyKey);
    family.attempts += 1;
    if (SUCCESS_STATUS_IDS.has(record.statusId)) family.success += 1;
  }

  const currentYear = to.slice(0, 4);
  const makeSeries = (metric) => [...byYear.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([year, values]) => ({
      year,
      label: year === currentYear ? `${year} YTD` : year,
      ...values[metric],
      global: values[metric].us + values[metric].cn + values[metric].other,
    }));

  return {
    schemaVersion: 1,
    generatedAt,
    coverage: { from, to },
    source: {
      name: "Launch Library 2",
      publisher: "The Space Devs",
      url: "https://thespacedevs.com/llapi",
      apiVersion: "2.3.0",
      license: "Apache-2.0",
    },
    methodology: {
      orbitalOnly: true,
      attemptStatusIds: [...ATTEMPT_STATUS_IDS],
      successStatusIds: [...SUCCESS_STATUS_IDS],
      grouping: "Launch service provider country when present in pad agency data; pad country fallback otherwise.",
    },
    metrics: {
      attempts: makeSeries("attempts"),
      success: makeSeries("success"),
      rocketFamilies: [...rocketFamilies.values()].sort((a, b) =>
        a.year.localeCompare(b.year)
        || a.region.localeCompare(b.region)
        || b.attempts - a.attempts
        || a.family.localeCompare(b.family)),
    },
  };
}

const defaults = defaultWindow();
const rebuildOnly = process.argv.includes("--rebuild-only");
const from = isoDate(readArg("from") ?? defaults.from, "from");
const to = isoDate(readArg("to") ?? defaults.to, "to");
if (from > to) throw new Error("--from must be earlier than or equal to --to");

const generatedAt = new Date().toISOString();
const existing = await readExisting();
const fetched = rebuildOnly ? { records: [], requestCount: 0 } : await fetchLaunches(from, to);
const retained = rebuildOnly ? (existing.records ?? []) : (existing.records ?? []).filter((record) => {
    const date = record.net.slice(0, 10);
    return date < from || date > to;
  });
const merged = resolveProviderCountries([...retained, ...fetched.records]
  .filter((record, index, all) => all.findIndex((candidate) => candidate.id === record.id) === index)
  .sort((a, b) => a.net.localeCompare(b.net)))
  .map(inferRocketFields);

const snapshot = {
  schemaVersion: 1,
  source: "Launch Library 2",
  retrievedAt: generatedAt,
  lastQuery: rebuildOnly ? existing.lastQuery : { from, to, requestCount: fetched.requestCount },
  records: merged,
};
const availableFrom = merged[0]?.net.slice(0, 10) ?? from;
const availableTo = merged.at(-1)?.net.slice(0, 10) ?? to;
const metrics = aggregate(merged, generatedAt, availableFrom, availableTo);

await mkdir(dirname(snapshotPath), { recursive: true });
await mkdir(dirname(metricsPath), { recursive: true });
await writeFile(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`);
await writeFile(metricsPath, `${JSON.stringify(metrics, null, 2)}\n`);

console.log(rebuildOnly
  ? `Rebuilt aggregates from ${merged.length} stored launches without network requests.`
  : `Stored ${fetched.records.length} fetched launches (${merged.length} total) from ${fetched.requestCount} requests.`);
console.log(`Updated ${snapshotPath}`);
console.log(`Updated ${metricsPath}`);
