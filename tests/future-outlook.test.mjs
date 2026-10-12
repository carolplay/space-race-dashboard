import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {clampK,powerAtK,sampleOutlook,outlookSeries,interpolateLog} from "../lib/future-outlook.mjs";
const model=JSON.parse(await readFile(new URL("../data/research/future-outlook.json",import.meta.url)));
test("K axis has thirty cells and thirty-one endpoints, with exponential power",()=>{
 assert.equal(model.axis.cells,30);assert.equal(model.axis.step,.01);
 assert.equal(clampK("unknown"),.8);assert.equal(clampK(.2),.7);assert.equal(clampK(1.3),1);
 assert.ok(Math.abs(powerAtK(.8)/powerAtK(.7)-10)<1e-9);
 assert.equal(powerAtK(1),1e16);
 assert.ok(Math.abs(interpolateLog([.7,.8],[10,1000],.75)-100)<1e-9);
});
test("scenario curves remain explicit, finite, separated and independent of observed datasets",()=>{
 assert.equal(model.status,"editorial-scenario-not-prediction");
 for(const scenario of model.scenarios){
  const points=outlookSeries(model,scenario.id);assert.equal(points.length,31);
  assert.equal(points[0].k,.7);assert.equal(points.at(-1).k,1);
  for(const p of points)for(const m of model.metrics){
   const v=p.metrics[m.id];assert.ok(v.low>0&&v.low<v.value&&v.value<v.high&&Number.isFinite(v.high));
  }
 }
 assert.equal(sampleOutlook(model,.73,"frontier").metrics.mass.value,sampleOutlook(model,.73,"earthbound").metrics.mass.value);
 assert.ok(sampleOutlook(model,1,"frontier").metrics.mass.value>sampleOutlook(model,1,"earthbound").metrics.mass.value);
 assert.equal(sampleOutlook(model,1,"network").orbitalRing,false);
 assert.equal(sampleOutlook(model,.94,"frontier").orbitalRing,false);
 assert.equal(sampleOutlook(model,.95,"frontier").orbitalRing,true);
 assert.equal(sampleOutlook(model,.8).liftEquivalent,sampleOutlook(model,.8).metrics.delivery.value/100);
});
test("downloaded assumptions exactly match model; observed data is never relabeled",async()=>{
 const publicModel=JSON.parse(await readFile(new URL("../public/data/future-outlook.json",import.meta.url)));
 assert.deepEqual(publicModel,model);assert.ok(model.sources.every(s=>s.url.startsWith("https://")));
 const lock=JSON.parse(await readFile(new URL("../package-lock.json",import.meta.url)));
 const pkg=JSON.parse(await readFile(new URL("../package.json",import.meta.url)));
 assert.equal(lock.version,pkg.version);assert.equal(lock.packages[""].version,pkg.version);
 for(const id of ["core","runtime"]){const p=lock.packages["node_modules/@emnapi/"+id];assert.equal(p.version,"1.10.0");assert.ok(p.resolved.endsWith(id+"-1.10.0.tgz"));}
});
test("future route server-renders deterministic content with explicit uncertainty and mirror chapters",async()=>{
 const {default:worker}=await import("../dist/server/index.js");
 const fetchPage=async()=>{const r=await worker.fetch(new Request("http://localhost/future",{headers:{accept:"text/html"}}),{ASSETS:{fetch:async()=>new Response("Not found",{status:404})}},{waitUntil(){},passThroughOnException(){}});assert.equal(r.status,200);return r.text();};
 const a=await fetchPage(),b=await fetchPage();
 for(const svg of a.matchAll(/<svg class="future-chart"[\s\S]*?<\/svg>/g)){
  for(const p of svg[0].matchAll(/points="([^"]+)"/g))assert.doesNotMatch(p[1],/\.\d{4}/,"SVG points must use canonical precision across server/browser engines");
 }
 // RSC transport identifiers may differ; the rendered scenario values do not.
 for(const h of [a,b]){assert.match(h,/未来展望/);assert.match(h,/K 0.80/);assert.match(h,/非置信区间/);assert.match(h,/future-launch/);assert.match(h,/future-bases/);assert.match(h,/future-assets/);assert.match(h,/future-human/);assert.match(h,/future-kardashev/);assert.doesNotMatch(h,/NaN|Infinity/);}
});
