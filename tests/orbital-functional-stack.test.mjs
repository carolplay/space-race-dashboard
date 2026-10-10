import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("functional graph keeps evidence, entity scope and unknowns separate", async () => {
  const data = JSON.parse(await readFile(new URL("../data/editorial/orbital-functional-stack.json", import.meta.url), "utf8"));
  const taxonomy = JSON.parse(await readFile(new URL("../data/research/orbital-functional-taxonomy.json", import.meta.url), "utf8"));
  const ids = new Set(data.assets.map(a => a.id));
  assert.equal(ids.size, data.assets.length);
  assert.equal(data.scope, "curated-evidence-examples-not-a-global-census");
  for (const a of data.assets) {
    assert.ok(a.nameZh && a.nameEn && a.statusZh && a.statusEn && a.sourceUrl.startsWith("https://"));
    assert.ok(a.layers.every(l => taxonomy.layers.some(t => t.id === l)));
    if (a.kind === "hosted-payload") assert.ok(a.parentAssetId);
  }
  const edges = new Map(data.relationships.map(e => [e.id, e]));
  for (const e of edges.values()) {
    assert.ok(ids.has(e.from) && ids.has(e.to));
    assert.ok(e.sourceUrl && e.labelZh && e.labelEn && e.basis);
    assert.ok(e.asOf === null || /^\d{4}-\d{2}-\d{2}$/.test(e.asOf));
    assert.ok(e.publishedAt === null || e.publishedAt >= e.asOf);
  }
  for (const c of data.cases) {
    assert.equal(c.edges.length, c.nodes.length - 1);
    for (let i = 0; i < c.edges.length; i++) {
      const edge = edges.get(c.edges[i]);
      assert.equal(edge.from, c.nodes[i]);
      assert.equal(edge.to, c.nodes[i + 1]);
    }
  }
  assert.equal(data.assets.find(a => a.id === "phisat-imager").parentAssetId, data.assets.find(a => a.id === "phisat-compute").parentAssetId);
  assert.equal(data.relationships.find(e => e.id === "gps-pnt").asOf, null);
  assert.equal(data.relationships.filter(e => e.type === "supplies_power_to").length, 0);
});
