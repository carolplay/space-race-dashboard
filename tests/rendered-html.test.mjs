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
  assert.match(html, /当前资产与历史存量/);
  assert.match(html, /当前产能与十五年斜率/);
  assert.match(html, /现存资产与中美计划节点/);
  assert.match(html, /2011 至今/);
  assert.match(html, /近地轨道的人类前哨/);
  assert.match(html, /真实事件/);
  assert.match(html, /产品样例/);
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
  assert.match(page, /dual-roadmap/);
  assert.match(page, /lunar-asset-grid/);
  assert.match(page, /火箭构型/);
  assert.match(page, /Rocket configurations/);
  assert.match(page, /frontierData/);
  assert.match(page, /station-grid/);
  assert.match(page, /平均单位重量入轨成本/);
  assert.match(page, /Average cost to orbit/);
  assert.match(page, /BOOSTER TURNAROUND/);
  assert.match(page, /kardashevSeries/);
  assert.match(page, /regionLabel\[lang\]/);
  assert.match(page, /metric-canvas/);
  assert.match(page, /2011 至今/);
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
    readFile(new URL("../data/snapshots/orbit-assets/2026-08-19.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../data/metrics/orbit-assets.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../data/editorial/frontier.json", import.meta.url), "utf8").then(JSON.parse),
  ]);
  assert.equal(snapshot.source.name, "GCAT");
  assert.equal(metrics.current.date, "2026-08-19");
  assert.ok(snapshot.activePayloads.global > 10_000);
  assert.ok(snapshot.catalogObjects.global > snapshot.activePayloads.global);
  assert.equal(snapshot.activePayloads.global, snapshot.activePayloads.us + snapshot.activePayloads.cn + snapshot.activePayloads.other);
  assert.equal(snapshot.catalogObjects.global, snapshot.catalogObjects.us + snapshot.catalogObjects.cn + snapshot.catalogObjects.other);
  assert.equal(snapshot.massCoverage.totalObjects, snapshot.activePayloads.global);
  assert.ok(snapshot.massCoverage.knownObjects <= snapshot.massCoverage.totalObjects);
  for (const rows of [snapshot.byOrbit, snapshot.byCategory, snapshot.byObjectType]) {
    for (const row of rows) assert.equal(row.global, row.us + row.cn + row.other);
  }
  assert.equal(editorial.cislunar.assets.length, 3);
  assert.ok(editorial.cislunar.assets.every((asset) => asset.nameZh && asset.nameEn && asset.image && asset.source.startsWith("https://")));
  assert.ok(editorial.cislunar.plans.us.length >= 4);
  assert.ok(editorial.cislunar.plans.cn.length >= 4);
  assert.ok([...editorial.cislunar.plans.us, ...editorial.cislunar.plans.cn].every((event) => event.titleZh && event.titleEn && event.source.startsWith("https://")));
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

test("ships a continuous and internally consistent 2011-present history", async () => {
  const history = await readFile(new URL("../data/metrics/historical-series.json", import.meta.url), "utf8").then(JSON.parse);
  assert.equal(history.coverage.fromYear, 2011);
  assert.equal(history.coverage.toYear, 2026);
  assert.equal(history.launchActivity.length, 16);
  assert.equal(history.orbitInventory.length, 16);
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
});
