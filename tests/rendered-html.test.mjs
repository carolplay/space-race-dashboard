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
  assert.match(html, /常规运载、火箭构型与研发飞行/);
  assert.match(html, /先看已经造出并送入轨道的东西/);
  assert.match(html, /基地和发射台也是发射资产/);
  assert.match(html, /谁在运营，以及轨道节点如何连成网络/);
  assert.match(html, /现存资产与对齐的中美路径/);
  assert.match(html, /常规运载之后，再看下一代火箭/);
  assert.match(html, /任务轨道图谱/);
  assert.match(html, /星舰 \/ 超重助推器/);
  assert.match(html, /2000 至今/);
  assert.match(html, /近地轨道的人类前哨/);
  assert.match(html, /真实事件/);
  assert.match(html, /ALPHA 1\.6\.3/);
  assert.match(html, /未来十年：发射节奏与履约压力/);
  assert.match(html, /在轨载荷库存：观测与条件外推/);
  assert.match(html, /星座在轨规模：惯性曲线与申报情景/);
  assert.match(html, /读懂各阶段要求/);
  assert.match(html, /逐项申报：规模、轨道与频段/);
  assert.match(html, /96,714/);
  assert.doesNotMatch(html, /NaN|Infinity/);
  const chapters=['launch-information','launch-bases','orbital-assets','crewed-cislunar','kardashev','sources'];
  chapters.forEach((id,i)=>{assert.equal((html.match(new RegExp('id="'+id+'"','g'))??[]).length,1);if(i)assert.ok(html.indexOf('id="'+id+'"')>html.indexOf('id="'+chapters[i-1]+'"'));});
  assert.match(html, /展示范式与再开发参照/);
  assert.match(html, /最近已执行任务/);
  assert.match(html, /海上发射位置/);
  assert.ok(html.indexOf('id="method"')>html.indexOf('id="sources"'));
  assert.match(html, /在轨规模，正在如何增长/);
  assert.match(html, /ITU：申报程序、BIU 与 RES35 时间线/);
  assert.match(html, /FCC：美国国家授权与履约节点/);
  assert.match(html, /线性轴 · 绝对规模与增量/);
  assert.match(html, /对数轴 · 同时看清大小星座/);
  assert.match(html, /2019-03-26/);
  assert.match(html, /未来 8 次轨道任务/);
  assert.match(html, /可复用一级台账/);
  assert.match(html, /从年度总量下钻到单次任务/);
  assert.match(html, /数据源健康度/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
  const svgTitles=[...html.matchAll(/<svg\b[\s\S]*?<\/svg>/g)].flatMap(([svg])=>[...svg.matchAll(/<title>([\s\S]*?)<\/title>/g)].map(m=>m[1]));
  assert.ok(svgTitles.length>22);
  assert.ok(svgTitles.every(s=>s.length>0&&!s.includes('<!--')),'SVG titles must render as one text node');
  assert.ok(svgTitles.some(s=>s.includes('2028-12-01')&&s.includes('7,500')));
  const fleetCharts=[...html.matchAll(/<svg\b[^>]*aria-label="在轨数量[^>]*>[\s\S]*?<\/svg>/g)];
  assert.equal(fleetCharts.length,2);
  for(const [svg] of fleetCharts)for(const [,points] of svg.matchAll(/points="([^"]+)"/g)){
    assert.ok(points.split(/[ ,]/).every(n=>/^\d+(\.\d{1,3})?$/.test(n)),'Fleet SVG points must use deterministic millipixel precision');
  }
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
  assert.match(page, /launchManifest/);
  assert.match(page, /launchRecovery/);
  assert.match(page, /sourceHealth/);
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
    readFile(new URL("../data/snapshots/orbit-assets/2026-09-26.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../data/metrics/orbit-assets.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../data/editorial/frontier.json", import.meta.url), "utf8").then(JSON.parse),
  ]);
  assert.equal(snapshot.source.name, "GCAT");
  assert.equal(metrics.current.date, metrics.snapshots.at(-1).date);
  assert.ok(metrics.current.date >= "2026-09-26");
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
  assert.equal(development.asOf, "2026-09-08");
  assert.equal(development.capabilities.length, 6);
  assert.ok(development.methodologyZh.includes("不把试验次数直接加入正式载荷发射总量"));
  assert.ok(development.programs.some((program) => program.id === "starship" && program.headline === "13"));
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

test("ships an auditable mission manifest, recovery model and source-health report", async () => {
  const [manifest, recovery, health] = await Promise.all([
    readFile(new URL("../data/metrics/launch-manifest.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../data/editorial/launch-recovery.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../data/metrics/source-health.json", import.meta.url), "utf8").then(JSON.parse),
  ]);
  assert.equal(manifest.source.name, "Launch Library 2");
  assert.ok(manifest.asOf >= "2026-09-26");
  assert.ok(manifest.upcoming.length >= 8);
  assert.ok(manifest.upcoming.every((launch) => launch.id && launch.net && launch.sourceUrl));
  assert.ok(manifest.reuse.recoveryMissions > 0);
  assert.ok(manifest.reuse.serializedVehicles.length >= 10);
  assert.ok(manifest.reuse.serializedVehicles.every((vehicle) => vehicle.serial && vehicle.sourceUrl));
  assert.equal(recovery.origin.name, "launch-recovery-viz");
  assert.ok(recovery.missions.length >= 6);
  assert.ok(recovery.missions.every((mission) => mission.pad && mission.recoveries.length && mission.events.length && mission.sources.length));
  assert.ok(recovery.missions.some((mission) => mission.id === "zhuque-3-y2"));
  assert.equal(health.summary.reviewSources, 0);
  assert.ok(health.sources.some((source) => source.id === "next-spaceflight-reference" && source.mode === "reference-only"));
  assert.ok(health.sources.filter((source) => source.mode !== "reference-only").every((source) => source.updatedAt && source.status === "fresh"));
});
