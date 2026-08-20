import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Cislunar-I dashboard", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /Project Cislunar/);
  assert.match(html, /太空工业/);
  assert.match(html, /2026 \/ 当前快照/);
  assert.match(html, />中文</);
  assert.match(html, />EN</);
  assert.match(html, /0\.73042/);
  assert.match(html, /资产、运营者与数据网络/);
  assert.match(html, /实际交付、发射网络与常规运载/);
  assert.match(html, /先看已经造出并送入轨道的东西/);
  assert.match(html, /基地和发射台也是发射资产/);
  assert.match(html, /谁在运营，以及轨道节点如何连成网络/);
  assert.match(html, /现存资产与对齐的中美路径/);
  assert.match(html, /常规运载之后，再看下一代火箭/);
  assert.match(html, /任务轨道图谱/);
  assert.match(html, /Starship \/ Super Heavy/);
  assert.match(html, /2000 至今/);
  assert.match(html, /近地轨道的人类前哨/);
  assert.match(html, /真实事件/);
  assert.match(html, /ALPHA 1\.0/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("ships product UI without starter dependencies", async () => {
  const [page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);
  assert.match(page, /useState/);
  assert.match(page, /historicalSeries/);
  assert.match(page, /language-switch/);
  assert.match(page, /document\.documentElement\.lang/);
  assert.match(page, /scaled-chronology/);
  assert.match(page, /orbit-atlas/);
  assert.match(page, /rocketPerformance/);
  assert.ok(page.indexOf("development-label") > page.indexOf("metric-dashboard"));
  assert.match(page, /launchDevelopment/);
  assert.match(page, /capability-matrix/);
  assert.match(page, /lunar-asset-grid/);
  assert.match(page, /火箭构型/);
  assert.match(page, /Rocket configurations/);
  assert.match(page, /frontierData/);
  assert.match(page, /station-grid/);
  assert.match(page, /平均单位重量入轨成本/);
  assert.match(page, /Average cost to orbit/);
  assert.doesNotMatch(page, /BOOSTER TURNAROUND/);
  assert.match(page, /kardashevSeries/);
  assert.match(page, /regionLabel\[lang\]/);
  assert.match(page, /metric-canvas/);
  assert.match(page, /2000 至今/);
  assert.match(page, /launchInfrastructure/);
  assert.match(page, /industrialCapability/);
  assert.match(page, /payloadFlow/);
  assert.doesNotMatch(page, /83\.0|63\.5|综合工业能力指数/);
  assert.doesNotMatch(page, /aria-label="选择国家"/);
  assert.match(layout, /lang="zh-CN"/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)));
});

test("ships auditable launch snapshots and internally consistent aggregates", async () => {
  const [snapshot, metrics] = await Promise.all([
    readFile(new URL("../data/snapshots/launch-library-2.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../data/metrics/launch-activity.json", import.meta.url), "utf8").then(JSON.parse),
  ]);
  assert.equal(snapshot.source, "Launch Library 2");
  assert.ok(snapshot.records.length >= 700);
  assert.ok(snapshot.records.every((record) => record.id && record.net && record.sourceUrl));
  assert.deepEqual(metrics.methodology.attemptStatusIds, [3, 4, 7]);
  assert.deepEqual(metrics.methodology.successStatusIds, [3]);
  for (const series of [metrics.metrics.attempts, metrics.metrics.success]) {
    assert.ok(series.length >= 3);
    for (const point of series) {
      assert.equal(point.global, point.us + point.cn + point.other);
    }
  }
});

test("ships auditable orbit snapshots with consistent regional totals", async () => {
  const [snapshot, metrics, editorial] = await Promise.all([
    readFile(new URL("../data/snapshots/orbit-assets/2026-08-20.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../data/metrics/orbit-assets.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../data/editorial/frontier.json", import.meta.url), "utf8").then(JSON.parse),
  ]);
  assert.equal(snapshot.source.name, "GCAT");
  assert.equal(metrics.current.date, "2026-08-20");
  assert.ok(snapshot.activePayloads.global > 10_000);
  assert.ok(snapshot.catalogObjects.global > snapshot.activePayloads.global);
  assert.equal(snapshot.activePayloads.global, snapshot.activePayloads.us + snapshot.activePayloads.cn + snapshot.activePayloads.other);
  assert.equal(snapshot.catalogObjects.global, snapshot.catalogObjects.us + snapshot.catalogObjects.cn + snapshot.catalogObjects.other);
  assert.equal(snapshot.massCoverage.totalObjects, snapshot.activePayloads.global);
  assert.ok(snapshot.massCoverage.knownObjects <= snapshot.massCoverage.totalObjects);
  for (const rows of [snapshot.byOrbit, snapshot.byCategory, snapshot.byObjectType]) {
    for (const row of rows) assert.equal(row.global, row.us + row.cn + row.other);
  }
  assert.ok(snapshot.byOperator.length >= 10);
  assert.ok(snapshot.byOperator.every((row) => row.global === row.us + row.cn + row.other));
  assert.equal(editorial.cislunar.assets.length, 3);
  assert.ok(editorial.cislunar.assets.every((asset) => asset.nameZh && asset.nameEn && asset.image && asset.source.startsWith("https://")));
  assert.ok(editorial.cislunar.timeline.length >= 13);
  assert.equal(editorial.cislunar.timeline[0].date, "2007-10");
  assert.ok(editorial.cislunar.timeline.every((row) => Number(row.date.match(/\d{4}/)?.[0]) >= 2007));
  assert.ok(editorial.cislunar.timeline.every((row) => Array.isArray(row.us) && Array.isArray(row.cn)));
  const timelineEvents = editorial.cislunar.timeline.flatMap((row) => [...row.us, ...row.cn]);
  assert.ok(timelineEvents.every((event) => event.titleZh && event.titleEn && event.source.startsWith("https://")));
  assert.ok(editorial.cislunar.timeline.some((row) => row.us.some((event) => event.tone === "done")));
  assert.ok(editorial.cislunar.timeline.some((row) => row.cn.some((event) => event.tone === "done")));
  assert.equal(editorial.stations.length, 2);
  assert.ok(editorial.stations.every((station) => station.nameZh && station.nameEn && station.source.startsWith("https://")));
  await Promise.all([
    access(new URL("../public/lro.jpg", import.meta.url)),
    access(new URL("../public/queqiao-2.jpg", import.meta.url)),
    access(new URL("../public/change-4.jpg", import.meta.url)),
    access(new URL("../public/iss.jpg", import.meta.url)),
    access(new URL("../public/tiangong.jpg", import.meta.url)),
  ]);
});

test("keeps development validation separate from payload launch capacity", async () => {
  const development = await readFile(new URL("../data/editorial/launch-development.json", import.meta.url), "utf8").then(JSON.parse);
  assert.equal(development.asOf, "2026-08-19");
  assert.equal(development.capabilities.length, 6);
  assert.ok(development.methodologyZh.includes("不把试验次数直接加入正式载荷发射总量"));
  assert.ok(development.programs.some((program) => program.id === "starship" && program.headline === "12"));
  assert.ok(development.programs.some((program) => program.id === "zhuque-3" && program.capabilities.recovery === true));
  assert.ok(development.programs.some((program) => program.id === "zhuque-3" && program.milestones.some((milestone) => milestone.date === "2026-08" && milestone.tone === "done")));
  assert.ok(development.programs.every((program) => program.statusZh && program.statusEn && program.source.startsWith("https://")));
  assert.ok(development.programs.flatMap((program) => program.milestones).every((milestone) => milestone.titleZh && milestone.titleEn && milestone.source.startsWith("https://")));
});

test("ships a continuous and internally consistent 2000-present history", async () => {
  const history = await readFile(new URL("../data/metrics/historical-series.json", import.meta.url), "utf8").then(JSON.parse);
  assert.equal(history.coverage.fromYear, 2000);
  assert.equal(history.coverage.toYear, 2026);
  assert.equal(history.launchActivity.length, 27);
  assert.equal(history.orbitInventory.length, 27);
  assert.equal(history.payloadFlow.length, 27);
  assert.ok(history.recentManufacturers.length >= 10);
  assert.equal(history.coverage.currentYearIsPartial, true);
  assert.ok([history.source.satcat.sha256, history.source.launchlog.sha256].every((checksum) => /^[a-f0-9]{64}$/.test(checksum)));
  for (const point of history.launchActivity) {
    for (const metric of [point.attempts, point.success]) {
      assert.equal(metric.global, metric.us + metric.cn + metric.other);
    }
  }
  for (const point of history.orbitInventory) {
    for (const metric of [point.payloadObjects, point.catalogObjects]) {
      assert.equal(metric.global, metric.us + metric.cn + metric.other);
    }
    assert.ok(Math.abs(point.knownPayloadMassKg.global - (point.knownPayloadMassKg.us + point.knownPayloadMassKg.cn + point.knownPayloadMassKg.other)) < 1e-6);
  }
  for (const point of history.payloadFlow) {
    for (const metric of [point.additions, point.retirements, point.knownDeliveredMassKg]) {
      assert.ok(Math.abs(metric.global - (metric.us + metric.cn + metric.other)) < 1e-6);
    }
  }
});

test("tracks launch sites and pads as auditable launch assets", async () => {
  const infrastructure = await readFile(new URL("../data/metrics/launch-infrastructure.json", import.meta.url), "utf8").then(JSON.parse);
  const editorial = await readFile(new URL("../data/editorial/industrial-capability.json", import.meta.url), "utf8").then(JSON.parse);
  assert.equal(infrastructure.source.name, "Launch Library 2");
  assert.ok(infrastructure.summary.observedSites >= 20);
  assert.ok(infrastructure.summary.observedPads >= 50);
  assert.ok(infrastructure.pads.every((pad) => pad.id && pad.name && pad.site && pad.attempts > 0));
  assert.ok(infrastructure.sites.some((site) => site.countryCode === "US"));
  assert.ok(infrastructure.sites.some((site) => site.countryCode === "CN"));
  assert.ok(editorial.manufacturingEvents.every((event) => event.source.startsWith("https://")));
  assert.ok(editorial.networkSignals.every((event) => event.source.startsWith("https://")));
});
