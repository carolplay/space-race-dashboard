import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const readJson = async (path) => JSON.parse(await readFile(resolve(projectRoot, path), "utf8"));
const [orbit, history, launches, infrastructure, manifest, frontier, development, industrial, recovery] = await Promise.all([
  readJson("data/metrics/orbit-assets.json"),
  readJson("data/metrics/historical-series.json"),
  readJson("data/metrics/launch-activity.json"),
  readJson("data/metrics/launch-infrastructure.json"),
  readJson("data/metrics/launch-manifest.json"),
  readJson("data/editorial/frontier.json"),
  readJson("data/editorial/launch-development.json"),
  readJson("data/editorial/industrial-capability.json"),
  readJson("data/editorial/launch-recovery.json"),
]);

const generatedAt = new Date().toISOString();
const today = generatedAt.slice(0, 10);
const daysSince = (value) => value ? Math.max(0, Math.floor((Date.parse(today) - Date.parse(value)) / 86_400_000)) : null;
const statusFor = (value, threshold = 45) => {
  const age = daysSince(value);
  return age == null ? "unknown" : age <= threshold ? "fresh" : "review";
};
const editorialAsOf = [frontier.asOf, development.asOf, industrial.asOf, recovery.asOf].sort()[0];

const sources = [
  {
    id: "gcat-active",
    grade: "B",
    mode: "structured",
    name: "GCAT Active / Current Catalog",
    roleZh: "当前在轨资产、类型、轨道与运营者",
    roleEn: "Current orbital assets, type, orbit and operator",
    updatedAt: orbit.source.activeCatalog.updated?.iso ?? orbit.current.retrievedAt,
    retrievedAt: orbit.current.retrievedAt,
    cadence: "weekly",
    status: statusFor(orbit.source.activeCatalog.updated?.iso ?? orbit.current.retrievedAt),
    coverageZh: `${orbit.current.activePayloads.global.toLocaleString()} 个活跃载荷；质量字段覆盖 ${orbit.current.massCoverage.percent}%`,
    coverageEn: `${orbit.current.activePayloads.global.toLocaleString()} active payloads; ${orbit.current.massCoverage.percent}% mass-field coverage`,
    noteZh: "已兼容 1.8.8 的 DryMass / LaunchMass 字段；快照日期与上游更新时间分开保存。",
    noteEn: "Compatible with GCAT 1.8.8 DryMass / LaunchMass fields; snapshot and upstream update times are stored separately.",
    url: orbit.source.url,
  },
  {
    id: "gcat-history",
    grade: "B",
    mode: "structured",
    name: "GCAT SATCAT / LaunchLog",
    roleZh: "2000 年以来发射、在轨库存与交付历史",
    roleEn: "Launch, inventory and delivery history since 2000",
    updatedAt: history.source.satcat.updated?.iso ?? history.generatedAt,
    retrievedAt: history.generatedAt,
    cadence: "weekly",
    status: statusFor(history.source.satcat.updated?.iso ?? history.generatedAt),
    coverageZh: `${history.coverage.fromYear}—${history.coverage.toYear}；${history.orbitInventory.at(-1).payloadObjects.global.toLocaleString()} 个年内在轨载荷对象`,
    coverageEn: `${history.coverage.fromYear}—${history.coverage.toYear}; ${history.orbitInventory.at(-1).payloadObjects.global.toLocaleString()} payload objects in current-year inventory`,
    noteZh: "历史为 SATCAT＋SATCAT100K（不含辅助/临时目录）；含活跃与失效载荷。年内累计与全年分开，同期比较排除日期不完整的对象。",
    noteEn: "SATCAT + SATCAT100K, excluding auxiliary/temporary catalogs; active and inactive payloads. Partial/full years are separate, and matched periods exclude imprecise dates.",
    url: history.source.url,
  },
  {
    id: "ll2-launches",
    grade: "B",
    mode: "structured",
    name: "Launch Library 2",
    roleZh: "近期轨道任务、发射台、未来清单与一级复用记录",
    roleEn: "Recent orbital missions, pads, manifest and reusable-stage records",
    updatedAt: launches.generatedAt,
    retrievedAt: launches.generatedAt,
    cadence: "weekly",
    status: statusFor(launches.generatedAt),
    coverageZh: `${launches.coverage.from}—${launches.coverage.to}；${infrastructure.summary.orbitalAttempts} 次已观测尝试；${manifest.upcoming.length} 个未来任务`,
    coverageEn: `${launches.coverage.from}—${launches.coverage.to}; ${infrastructure.summary.orbitalAttempts} observed attempts; ${manifest.upcoming.length} upcoming missions`,
    noteZh: "未来日期保留 LL2 精度；详细模式的一级序列号与回收字段从 2026 年开始完整积累。",
    noteEn: "Future dates retain LL2 precision; detailed stage serial and landing fields accumulate comprehensively from 2026.",
    url: launches.source.url,
  },
  {
    id: "official-editorial",
    grade: "A",
    mode: "editorial",
    name: "NASA / CNSA / CMSE / provider releases",
    roleZh: "地月、空间站、制造披露与研发飞行状态",
    roleEn: "Cislunar, stations, manufacturing disclosures and development status",
    updatedAt: editorialAsOf,
    retrievedAt: generatedAt,
    cadence: "weekly + event",
    status: statusFor(editorialAsOf, 30),
    coverageZh: `${frontier.cislunar.assets.length} 个地月资产、${frontier.stations.length} 个空间站、${development.programs.length} 个研发项目`,
    coverageEn: `${frontier.cislunar.assets.length} cislunar assets, ${frontier.stations.length} stations and ${development.programs.length} development programs`,
    noteZh: "手工核验的状态数据；每条记录保留原始发布者链接，不生成伪时序。",
    noteEn: "Manually verified state data; every record retains its publisher link and no synthetic time series is created.",
    url: "https://www.nasa.gov/humans-in-space/artemis/",
  },
  {
    id: "next-spaceflight-reference",
    grade: "R",
    mode: "reference-only",
    name: "Next Spaceflight",
    roleZh: "产品结构参考：任务清单、台址清单、复用载具卡片",
    roleEn: "Product reference: manifests, pad manifests and reusable-vehicle cards",
    updatedAt: recovery.asOf,
    retrievedAt: generatedAt,
    cadence: "review-only",
    status: "reference",
    coverageZh: "不摄取数据；公开 API 仍处于征集反馈阶段",
    coverageEn: "No data ingestion; its public API remains at the feedback-gathering stage",
    noteZh: "只借鉴信息架构，生产数据继续来自 GCAT、LL2 与官方任务来源。",
    noteEn: "Used only for information architecture; production data remains sourced from GCAT, LL2 and official mission sources.",
    url: "https://nextspaceflight.com/api_access/",
  },
];

const output = {
  schemaVersion: 1,
  generatedAt,
  summary: {
    productionSources: sources.filter((source) => source.mode !== "reference-only").length,
    freshSources: sources.filter((source) => source.status === "fresh").length,
    reviewSources: sources.filter((source) => source.status === "review").length,
    referenceOnly: sources.filter((source) => source.mode === "reference-only").length,
  },
  sources,
};

await writeFile(resolve(projectRoot, "data/metrics/source-health.json"), `${JSON.stringify(output, null, 2)}\n`);
console.log(`Stored source health: ${output.summary.freshSources}/${output.summary.productionSources} production sources fresh.`);
