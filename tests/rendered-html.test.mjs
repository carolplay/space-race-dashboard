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
  assert.match(html, /US · 美国/);
  assert.match(html, /CN · 中国/);
  assert.match(html, /0\.73042/);
  assert.match(html, /在轨资产/);
  assert.match(html, /发射工业与火箭家族/);
  assert.match(html, /地月专题/);
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
  assert.match(page, /谁把什么放在轨道上/);
  assert.match(page, /火箭构型/);
  assert.match(page, /frontierData/);
  assert.match(page, /station-grid/);
  assert.match(page, /平均单位重量入轨成本/);
  assert.match(page, /BOOSTER TURNAROUND/);
  assert.match(page, /kardashevSeries/);
  assert.match(page, /legend-global/);
  assert.match(page, /legend-other/);
  assert.match(page, /metric-canvas/);
  assert.match(page, /选择时间范围/);
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
  assert.equal(editorial.stations.length, 2);
  assert.ok(editorial.stations.every((station) => station.source.startsWith("https://")));
  await Promise.all([
    access(new URL("../public/iss.jpg", import.meta.url)),
    access(new URL("../public/tiangong.jpg", import.meta.url)),
  ]);
});
