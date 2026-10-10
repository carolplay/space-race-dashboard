"use client";

import { useState } from "react";
import taxonomy from "@/data/research/orbital-functional-taxonomy.json";
import evidence from "@/data/editorial/orbital-functional-stack.json";
import orbit from "@/data/metrics/orbit-assets.json";

type Lang = "zh" | "en";
const colors = ["#6a9eff", "#d9ff43", "#ba93ed", "#e7b663", "#ff8b76"];
const kindLabels: Record<string, [string, string]> = {
  constellation: ["星座体系", "Constellation system"], "service-user": ["服务端点", "Service endpoint"],
  spacecraft: ["航天器", "Spacecraft"], "hosted-payload": ["搭载载荷", "Hosted payload"],
  "ground-facility-group": ["地面设施组", "Ground facilities"], "mission-endpoint": ["任务端点", "Mission endpoint"],
};
const realmLabels: Record<string, [string, string]> = {
  LEO: ["近地轨道", "LEO"], MEO: ["中地球轨道", "MEO"], GEO: ["地球静止轨道", "GEO"],
  ground: ["地面", "Ground"], cislunar: ["地月空间", "Cislunar"], "lunar-surface": ["月面", "Lunar surface"],
};

export default function OrbitalFunctionalStack({ lang }: { lang: Lang }) {
  const zh = lang === "zh", tr = (a: string, b: string) => zh ? a : b;
  const [layer, setLayer] = useState<string | null>(null);
  const [caseId, setCaseId] = useState("relay");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const assets = evidence.assets.filter(a => !layer || a.layers.includes(layer));
  const cases = evidence.cases.filter(c => !layer || c.nodes.some(id => evidence.assets.find(a => a.id === id)?.layers.includes(layer)));
  const activeCase = cases.find(c => c.id === caseId) ?? cases[0];
  const nodes = activeCase.nodes.map(id => evidence.assets.find(a => a.id === id)!);
  const selected = nodes.find(a => a.id === selectedId) ?? nodes[0];
  const edges = activeCase.edges.map(id => evidence.relationships.find(e => e.id === id)!);
  const category: Record<string, string> = { L0: "导航定位", L1: "通信", L3: "地球观测" };
  const proxyNames: Record<string, [string, string]> = {
    L0: ["导航定位类活跃载荷", "Active navigation-category payloads"],
    L1: ["通信类活跃载荷", "Active communications-category payloads"],
    L3: ["对地观测类活跃载荷", "Active Earth-observation-category payloads"],
  };
  return <section id="orbital-functional-stack" className="functional-stack" aria-labelledby="functional-stack-title">
    <header className="functional-heading"><div><span>{tr("03D / 轨道基础设施功能栈", "03D / ORBITAL INFRASTRUCTURE FUNCTIONAL STACK")}</span><h3 id="functional-stack-title">{tr("从资产清单，到服务关系", "From asset inventories to service relationships")}</h3></div><p>{tr("目录快照", "Catalog snapshot")} {orbit.current.date}<br />{tr("关系核验", "Evidence reviewed")} {evidence.reviewedAt}</p></header>
    <p className="functional-intro">{tr("L0–L4 是功能标签，不是轨道高度或成熟度。目录数量只作为角色候选；下面的关系图另以官方实例核验。搭载载荷、多功能卫星与地面节点不能重复计入物理总量。", "L0–L4 describe functions, not altitude or maturity. Catalog counts are role proxies; relationships below use separate official evidence. Hosted payloads, multiple roles and ground nodes must not inflate physical totals.")}</p>
    <div className="functional-layers" role="group" aria-label={tr("按功能筛选实例", "Filter examples by function")}>
      {taxonomy.layers.map((l, i) => {
        const proxy = orbit.current.byCategory.find(c => c.name === category[l.id]);
        return <button key={l.id} style={{ borderTopColor: colors[i] }} aria-pressed={layer === l.id} onClick={() => { setLayer(layer === l.id ? null : l.id); setSelectedId(null); }}>
          <span style={{ color: colors[i] }}>{l.id}</span><h4>{zh ? l.nameZh : l.nameEn}</h4>
          <strong>{proxy ? proxy.global.toLocaleString("en-US") : "—"}</strong>
          <p>{proxy ? proxyNames[l.id][zh ? 0 : 1] : tr("全球可比总量尚未采集", "Comparable global total not collected")}</p>
          <small>{proxy ? tr("GCAT 分类代理 · 非完整功能层普查", "GCAT category proxy · not a full layer census") : l.id === "L2" ? tr("能源 / 算力分开；未知不等于零", "Power / compute separate; unknown is not zero") : tr("按已完成服务事件追踪", "Track completed service events")}</small>
        </button>;
      })}
    </div>
    <div className="functional-filter"><span>{layer ? tr(`${layer} 的核验实例`, `Verified ${layer} examples`) : tr("全部功能实例", "All functional examples")}</span><button onClick={() => { setLayer(null); setSelectedId(null); }} disabled={!layer}>{tr("显示全部", "Show all")}</button><p>{tr("L3 还包括天文与空间感知，当前代理数仅覆盖对地观测。L2 的一般处理器不自动视为商业算力。", "L3 also includes astronomy and space sensing; this proxy covers Earth observation only. Ordinary processors do not establish commercial compute capacity.")}</p></div>
    <div className="functional-explorer">
      <div className="functional-case-picker" role="group" aria-label={tr("选择关系实例", "Choose a relationship example")}>{cases.map(c => <button key={c.id} aria-pressed={activeCase.id === c.id} onClick={() => { setCaseId(c.id); setSelectedId(null); }}>{zh ? c.nameZh : c.nameEn}</button>)}</div>
      <div className="functional-graph" aria-label={tr("有证据的功能关系图", "Evidence-backed functional relationship graph")}>
        {nodes.map((a, i) => <div className="functional-graph-step" key={a.id}>
          {i > 0 && <button className="functional-edge" onClick={() => setSelectedId(a.id)} aria-label={tr("选择接收端节点", "Select recipient node")}><span>{zh ? edges[i - 1].labelZh : edges[i - 1].labelEn}</span><b aria-hidden="true">→</b><small>{edges[i - 1].asOf ?? tr("官方架构 · 日期未列", "Official architecture · date unspecified")}</small></button>}
          <button className="functional-node" aria-pressed={selected.id === a.id} onClick={() => setSelectedId(a.id)}><span>{a.layers.join(" / ") || tr("端点", "Endpoint")} · {realmLabels[a.realm]?.[zh ? 0 : 1] ?? a.realm}</span><strong>{zh ? a.nameZh : a.nameEn}</strong><small>{kindLabels[a.kind]?.[zh ? 0 : 1]}</small></button>
        </div>)}
      </div>
      <p className="functional-case-note">{zh ? activeCase.noteZh : activeCase.noteEn}</p>
      <div className="functional-detail"><article><span>{tr("选中资产 / 功能节点", "SELECTED ASSET / FUNCTIONAL NODE")}</span><h4>{zh ? selected.nameZh : selected.nameEn}</h4><p>{zh ? selected.detailZh : selected.detailEn}</p><dl><div><dt>{tr("证据状态", "Evidence status")}</dt><dd>{zh ? selected.statusZh : selected.statusEn}</dd></div><div><dt>{tr("证据对应日期", "Evidence as of")}</dt><dd>{selected.asOf ?? tr("未列明", "Not specified")}</dd></div><div><dt>{tr("归属物理实体", "Parent physical entity")}</dt><dd>{selected.parentAssetId ?? tr("不另设父实体", "No separate parent")}</dd></div></dl><a href={selected.sourceUrl} target="_blank" rel="noreferrer">{tr("查看原始证据", "Read original evidence")} ↗</a></article><article><span>{tr("本例关系证据", "RELATIONSHIP EVIDENCE")}</span>{edges.map(e => <div className="functional-edge-record" key={e.id}><b>{zh ? e.labelZh : e.labelEn}</b><p>{tr("事件 / 架构日期", "Event / architecture date")}: {e.asOf ?? tr("未列明", "Not specified")}<br />{tr("原文发布日期", "Source publication date")}: {e.publishedAt ?? tr("未列明", "Not specified")}</p><a href={e.sourceUrl} target="_blank" rel="noreferrer">{tr("原始来源", "Original source")} ↗</a></div>)}</article></div>
    </div>
    <details className="functional-register"><summary>{tr(`展开核验实例清单（${assets.length} 个功能节点，非卫星总数）`, `Evidence register (${assets.length} functional ${assets.length === 1 ? "node" : "nodes"}, not a satellite total)`)}</summary><div>{assets.map(a => <article key={a.id}><span>{a.layers.join(" / ") || tr("端点", "Endpoint")} · {realmLabels[a.realm]?.[zh ? 0 : 1]}</span><h4>{zh ? a.nameZh : a.nameEn}</h4><p>{zh ? a.detailZh : a.detailEn}</p><small>{zh ? a.statusZh : a.statusEn} · {a.asOf ?? tr("未列明日期", "Undated")}</small><a href={a.sourceUrl} target="_blank" rel="noreferrer">{tr("证据", "Evidence")} ↗</a></article>)}</div></details>
    <footer>{tr("这些是已记录的架构、成果或历史事件，不是当前全网运行状态。没有证据的依赖线不绘制；能源供应、跨星共享计算、制造与加注通量仍待采集。功能栈为本项目综合框架，非行业统一标准。", "These are recorded architectures, results or historical events, not current network telemetry. Unverified dependencies are not drawn. Power supply, shared cross-satellite compute, manufacturing and refuelling throughput remain uncollected. The stack is a project synthesis, not an industry standard.")} <a href="#sources">{tr("框架参考与数据协议", "Framework references and data protocol")}</a></footer>
  </section>;
}
