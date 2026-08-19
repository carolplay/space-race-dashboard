"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import launchActivity from "@/data/metrics/launch-activity.json";
import orbitAssets from "@/data/metrics/orbit-assets.json";
import frontierData from "@/data/editorial/frontier.json";

type Metric = {
  id: string;
  title: string;
  eyebrow: string;
  unit: string;
  years: string[];
  us: Array<number | null>;
  cn: Array<number | null>;
  other: Array<number | null>;
  global: Array<number | null>;
  decimals?: number;
  note: string;
  grade: "B" | "D";
  dataState: "observed" | "sample";
  sourceUrl?: string;
};

type LaunchActivityPoint = {
  year: string;
  label: string;
  us: number;
  cn: number;
  other: number;
  global: number;
};

type ChartSeries = { name: string; color: string; values: Array<number | null>; dashed?: boolean };

const orbitCurrent = orbitAssets.current;
const launchDataCutoff = (launchActivity.coverage.to as string | null)?.replaceAll("-", ".") ?? "尚未导入";

function observedLaunchSeries(metric: "attempts" | "success") {
  const points = launchActivity.metrics[metric] as LaunchActivityPoint[];
  return {
    years: points.map((point) => point.label),
    us: points.map((point) => point.us),
    cn: points.map((point) => point.cn),
    other: points.map((point) => point.other),
    global: points.map((point) => point.global),
  };
}

const metricSeries: Metric[] = [
  { id: "attempts", title: "轨道发射尝试", eyebrow: "ORBITAL ATTEMPTS", unit: "次/年", ...observedLaunchSeries("attempts"), note: "LL2 任务事件；按服务商国家优先归属", grade: "B", dataState: "observed", sourceUrl: launchActivity.source.url },
  { id: "success", title: "成功入轨任务", eyebrow: "SUCCESSFUL MISSIONS", unit: "次/年", ...observedLaunchSeries("success"), note: "LL2 状态 ID 3：成功完成目标轨道注入", grade: "B", dataState: "observed", sourceUrl: launchActivity.source.url },
  { id: "mass", title: "年度入轨质量", eyebrow: "MASS TO ORBIT", unit: "吨", years: ["2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026E"], us: [160, 204, 261, 384, 471, 612, 746, 880, 1004, 1120], cn: [55, 78, 96, 132, 178, 213, 257, 312, 361, 415], other: [85, 89, 97, 122, 135, 154, 172, 194, 238, 307], global: [300, 371, 454, 638, 784, 979, 1175, 1386, 1603, 1842], note: "年度入轨干质量 + 未公开载荷推演", grade: "D", dataState: "sample" },
  { id: "mass-per-launch", title: "单次平均入轨质量", eyebrow: "MASS PER SUCCESS", unit: "吨/次", years: ["2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026E"], us: [5.5, 6.6, 10, 9.6, 9.8, 7.3, 6.6, 5.8, 5.7, 5.6], cn: [3.4, 2.1, 3, 3.8, 3.4, 3.4, 3.9, 4.7, 4.9, 4.9], other: [2.1, 2.1, 2.4, 4.2, 3.8, 4.7, 4.5, 5.7, 6.1, 6.8], global: [3.5, 3.3, 4.6, 6.1, 5.7, 5.5, 5.4, 5.5, 5.5, 5.6], decimals: 1, note: "年度入轨质量 ÷ 成功任务数", grade: "D", dataState: "sample" },
  { id: "reflight-share", title: "飞行验证一级使用率", eyebrow: "FLIGHT-PROVEN SHARE", unit: "%", years: ["2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026E"], us: [12, 45, 59, 62, 71, 79, 88, 92, 95, 96], cn: [null, null, null, null, null, null, 2, 8, 18, 33], other: [null, null, null, null, null, null, null, 2, 3, 4], global: [4, 13, 16, 22, 28, 36, 48, 58, 65, 70], note: "飞行验证一级任务数 ÷ 可判定轨道发射数", grade: "D", dataState: "sample" },
  { id: "recovery", title: "一级回收成功率", eyebrow: "BOOSTER RECOVERY", unit: "%", years: ["2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026E"], us: [73, 85, 92, 91, 95, 96, 97, 98, 98, 99], cn: [null, null, null, null, null, null, 75, 82, 88, 92], other: [null, null, null, null, null, null, 60, 67, 72], global: [73, 85, 92, 91, 95, 96, 96, 96, 97, 98], note: "成功回收次数 ÷ 回收尝试次数", grade: "D", dataState: "sample" },
  { id: "turnaround", title: "助推器中位周转时间", eyebrow: "BOOSTER TURNAROUND", unit: "天", years: ["2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026E"], us: [225, 180, 128, 106, 74, 52, 42, 31, 25, 21], cn: [null, null, null, null, null, null, null, 180, 120, 92], other: [null, null, null, null, null, null, null, null, 210, 165], global: [225, 180, 128, 106, 74, 52, 42, 35, 29, 25], note: "同一一级序列号两次轨道任务的中位天数", grade: "D", dataState: "sample" },
  { id: "flight-number", title: "助推器中位飞行轮次", eyebrow: "MEDIAN FLIGHT NUMBER", unit: "第 N 飞", years: ["2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026E"], us: [2, 2, 3, 4, 5, 7, 10, 13, 16, 19], cn: [null, null, null, null, null, null, null, 2, 2, 3], other: [null, null, null, null, null, null, null, null, 2, 2], global: [2, 2, 3, 4, 5, 7, 9, 12, 15, 18], note: "仅统计飞行验证一级参与的任务", grade: "D", dataState: "sample" },
  { id: "cost-per-kg", title: "平均单位重量入轨成本", eyebrow: "EST. COST TO ORBIT", unit: "2026 USD/kg", years: ["2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026E"], us: [5600, 4600, 3800, 3100, 2500, 2100, 1800, 1550, 1350, 1200], cn: [7200, 6800, 6300, 5900, 5400, 4900, 4500, 4100, 3800, 3500], other: [11800, 11200, 10600, 10100, 9600, 9200, 8900, 8600, 8200, 7900], global: [7600, 6800, 6000, 5300, 4600, 4000, 3400, 2900, 2500, 2200], note: "Σ估算任务价格 ÷ Σ入轨质量；恒定 2026 美元", grade: "D", dataState: "sample" },
];

const kardashevSeries = { years: ["1965", "1975", "1985", "1995", "2005", "2015", "2020", "2024", "2026E"], values: [0.7131, 0.7184, 0.7215, 0.7242, 0.7271, 0.729, 0.7297, 0.7302, 0.73042] };

function LineChart({ years, series, label, zeroBased = true, axisDecimals }: { years: string[]; series: ChartSeries[]; label: string; zeroBased?: boolean; axisDecimals?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, rect.width * dpr);
      canvas.height = Math.max(1, rect.height * dpr);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      const width = rect.width;
      const height = rect.height;
      const pad = { l: 42, r: 16, t: 18, b: 28 };
      const plotW = width - pad.l - pad.r;
      const plotH = height - pad.t - pad.b;
      const numeric = series.flatMap((item) => item.values.filter((value): value is number => value !== null));
      const rawMax = Math.max(...numeric, 1);
      const rawMin = Math.min(...numeric);
      const span = Math.max(rawMax - rawMin, rawMax * 0.01, 0.0001);
      const min = zeroBased ? 0 : rawMin - span * 0.18;
      const max = rawMax + span * 0.08;
      ctx.clearRect(0, 0, width, height);
      ctx.font = "9px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textBaseline = "middle";
      for (let index = 0; index < 4; index += 1) {
        const gridY = pad.t + (plotH * index) / 3;
        ctx.strokeStyle = "#363a43";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pad.l, gridY);
        ctx.lineTo(width - pad.r, gridY);
        ctx.stroke();
        ctx.fillStyle = "#747985";
        const value = max - ((max - min) * index) / 3;
        ctx.fillText(value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toFixed(axisDecimals ?? (value < 10 ? 1 : 0)), 3, gridY);
      }
      const x = (index: number) => pad.l + (plotW * index) / Math.max(years.length - 1, 1);
      const y = (value: number) => pad.t + plotH - ((value - min) / Math.max(max - min, 0.0001)) * plotH;
      series.forEach(({ values, color, dashed }) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = color === "#f4f2ec" ? 2.4 : 1.8;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.setLineDash(dashed ? [6, 4] : []);
        let started = false;
        ctx.beginPath();
        values.forEach((value, index) => {
          if (value === null) { started = false; return; }
          if (!started) { ctx.moveTo(x(index), y(value)); started = true; }
          else ctx.lineTo(x(index), y(value));
        });
        ctx.stroke();
        ctx.setLineDash([]);
        values.forEach((value, index) => {
          if (value === null) return;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(x(index), y(value), index === values.length - 1 ? 3.2 : 1.8, 0, Math.PI * 2);
          ctx.fill();
        });
      });
      ctx.fillStyle = "#747985";
      ctx.textBaseline = "bottom";
      [0, Math.floor((years.length - 1) / 2), years.length - 1].forEach((index) => {
        const value = years[index];
        const textWidth = ctx.measureText(value).width;
        ctx.fillText(value, Math.min(Math.max(x(index) - textWidth / 2, pad.l), width - pad.r - textWidth), height - 4);
      });
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [years, series, zeroBased, axisDecimals]);
  return <canvas ref={ref} className="metric-canvas" role="img" aria-label={`${label}连续时间序列`} />;
}

function SegmentedBar({ us, cn, other, total }: { us: number; cn: number; other: number; total: number }) {
  return <div className="segment-bar" aria-label={`美国 ${us}，中国 ${cn}，其他 ${other}`}><i className="segment-us" style={{ width: `${(us / total) * 100}%` }} /><i className="segment-cn" style={{ width: `${(cn / total) * 100}%` }} /><i className="segment-other" style={{ width: `${(other / total) * 100}%` }} /></div>;
}

const observedMetricCount = metricSeries.filter((metric) => metric.dataState === "observed").length;
const launch2026 = (launchActivity.metrics.attempts as LaunchActivityPoint[]).find((point) => point.year === "2026")!;
const regionLabels = { us: "美国", cn: "中国", other: "其他" } as const;
const regionCodes = { us: "US", cn: "CN", other: "OTHER" } as const;
const rocketFamilies2026 = (launchActivity.metrics.rocketFamilies as Array<{ year: string; region: "us" | "cn" | "other"; family: string; attempts: number; success: number }>).filter((item) => item.year === "2026");
function topRocketFamilies(region: "us" | "cn" | "other") { return rocketFamilies2026.filter((item) => item.region === region).sort((a, b) => b.attempts - a.attempts).slice(0, 6); }

export default function Home() {
  const [range, setRange] = useState<"5y" | "all">("all");
  return <main id="top" className="dashboard-shell">
    <header className="topbar">
      <a className="brand" href="#top" aria-label="Project Cislunar-I 首页"><span className="brand-mark">CI</span><span>PROJECT CISLUNAR–I</span></a>
      <nav className="topnav" aria-label="主导航"><a className="active" href="#overview">总览</a><a href="#orbit-assets">在轨资产</a><a href="#launch-industry">发射工业</a><a href="#cislunar">地月</a><a href="#stations">空间站</a><a href="#method">方法</a></nav>
      <div className="signal"><span /> 数据截止 · 2026</div>
    </header>

    <section id="overview" className="rivalry-hero">
      <div className="hero-copy"><p className="eyebrow">US × CHINA × WORLD · RAW TELEMETRY</p><h1>太空工业<br />连续看板</h1><p className="dek">主视角仍是中美对比，同时把全球与其他参与者放回同一坐标系。这里只展示可复算的原始数字；未形成连续运营的能力，则改用状态与事件。</p><div className="hero-actions"><a className="primary-button" href="#orbit-assets">进入全景看板 <span>↓</span></a><span className="updated">数据模式<br /><strong>OBSERVED + LABELED SAMPLE</strong></span></div></div>
      <aside className="hero-telemetry" aria-label="中美关键原始数据快照"><div className="telemetry-head"><span>2026 / RAW SNAPSHOT</span><span>US × CN</span></div><div className="telemetry-country-head"><span>指标</span><b>US · 美国</b><b>CN · 中国</b></div><div className="telemetry-row"><span>活跃在轨载荷<small>GCAT · OBJECTS</small></span><strong>{orbitCurrent.activePayloads.us.toLocaleString()}</strong><strong>{orbitCurrent.activePayloads.cn.toLocaleString()}</strong></div><div className="telemetry-row"><span>已知活跃载荷质量<small>KNOWN MASS · TONNES</small></span><strong>{(orbitCurrent.knownActivePayloadMassKg.us / 1e3).toFixed(0)}</strong><strong>{(orbitCurrent.knownActivePayloadMassKg.cn / 1e3).toFixed(0)}</strong></div><div className="telemetry-row"><span>轨道发射尝试<small>2026 YTD · MISSIONS</small></span><strong>{launch2026.us}</strong><strong>{launch2026.cn}</strong></div><div className="telemetry-foot"><span><i className="legend-us" />美国</span><span><i className="legend-cn" />中国</span><b>四模块连续展示 ↓</b></div></aside>
    </section>

    <section id="orbit-assets" className="section orbital-section">
      <div className="section-heading"><div><p className="section-index">01 — ORBITAL ASSETS</p><h2>谁把什么放在轨道上</h2></div><p>“活跃载荷”与“全部目录对象”严格分开。今天是首个按月快照；此后每月追加，不回填虚构历史。</p></div>
      <div className="asset-kpis"><article><span>ACTIVE PAYLOADS</span><strong>{orbitCurrent.activePayloads.global.toLocaleString()}</strong><p>活跃有效载荷</p></article><article><span>CATALOG OBJECTS</span><strong>{orbitCurrent.catalogObjects.global.toLocaleString()}</strong><p>在轨目录对象 · 含碎片与火箭体</p></article><article><span>KNOWN ACTIVE MASS</span><strong>{(orbitCurrent.knownActivePayloadMassKg.global / 1e3).toLocaleString("zh-CN", { maximumFractionDigits: 1 })}<small> t</small></strong><p>有质量字段的活跃载荷</p></article><article><span>MASS COVERAGE</span><strong>{orbitCurrent.massCoverage.knownObjects.toLocaleString()}<small> / {orbitCurrent.massCoverage.totalObjects.toLocaleString()}</small></strong><p>有质量数据的对象数</p></article></div>
      <div className="asset-country-strip">{(["us", "cn", "other"] as const).map((region) => <div key={region}><span>{regionCodes[region]}</span><strong>{orbitCurrent.activePayloads[region].toLocaleString()}</strong><p>{regionLabels[region]} · 活跃载荷</p></div>)}<div className="snapshot-start"><span>MONTHLY HISTORY</span><strong>01</strong><p>时序积累始于 {orbitCurrent.date.replaceAll("-", ".")}</p></div></div>
      <div className="distribution-grid">
        <article className="distribution-card"><header><div><span>ORBIT DISTRIBUTION</span><h3>轨道分布</h3></div><b>ACTIVE PAYLOADS</b></header><div className="distribution-list">{orbitCurrent.byOrbit.map((item) => <div className="distribution-row" key={item.name}><div><b>{item.name}</b><strong>{item.global.toLocaleString()}</strong></div><SegmentedBar {...item} total={item.global} /><small>US {item.us.toLocaleString()} · CN {item.cn.toLocaleString()} · OTHER {item.other.toLocaleString()}</small></div>)}</div></article>
        <article className="distribution-card"><header><div><span>MISSION CATEGORY</span><h3>卫星类型</h3></div><b>GCAT CATEGORY</b></header><div className="distribution-list compact">{orbitCurrent.byCategory.map((item) => <div className="distribution-row" key={item.name}><div><b>{item.name}</b><strong>{item.global.toLocaleString()}</strong></div><SegmentedBar {...item} total={item.global} /><small>US {item.us.toLocaleString()} · CN {item.cn.toLocaleString()} · OTHER {item.other.toLocaleString()}</small></div>)}</div></article>
      </div>
      <div className="object-ledger"><div><span>目录对象构成</span><b>全部当前目录对象，不等同于有效卫星</b></div>{orbitCurrent.byObjectType.map((item) => <div key={item.name}><span>{item.name}</span><strong>{item.global.toLocaleString()}</strong><small>全球</small></div>)}<a href={orbitCurrent.validation.esaUrl} target="_blank" rel="noreferrer"><span>ESA 交叉参照</span><strong>&gt;{orbitCurrent.validation.esaEnvironmentMassTonnes.toLocaleString()} t</strong><small>所有在轨物体总质量 ↗</small></a></div>
    </section>

    <div className="dashboard-toolbar" aria-label="时序看板控制栏"><div><span className="live-dot" /> 发射数据截止：{launchDataCutoff}</div><div className="series-legend"><span><i className="legend-global" />全球</span><span><i className="legend-us" />美国</span><span><i className="legend-cn" />中国</span><span><i className="legend-other" />其他</span></div><div className="range-control" role="group" aria-label="选择时间范围"><button className={range === "5y" ? "selected" : ""} onClick={() => setRange("5y")}>近 5 年</button><button className={range === "all" ? "selected" : ""} onClick={() => setRange("all")}>全部可用</button></div></div>

    <section id="launch-industry" className="section metric-console-section">
      <div className="section-heading"><div><p className="section-index">02 — LAUNCH INDUSTRY</p><h2>发射工业与火箭家族</h2></div><p>先看真实任务频次与构型，再看仍待数据化的质量、复用和成本。样例指标始终明确标为 D 级。</p></div>
      <div className="rocket-family-grid">{(["us", "cn", "other"] as const).map((region) => { const families = topRocketFamilies(region); const max = Math.max(...families.map((item) => item.attempts), 1); return <article className={`family-column ${region}`} key={region}><header><div><span>{regionCodes[region]} · 2026 YTD</span><h3>{regionLabels[region]}火箭构型</h3></div><strong>{families.reduce((sum, item) => sum + item.attempts, 0)}<small> TOP-6 发射</small></strong></header><div>{families.map((item, index) => <div className="family-row" key={item.family}><span>{String(index + 1).padStart(2, "0")}</span><b>{item.family}</b><div><i style={{ width: `${(item.attempts / max) * 100}%` }} /></div><strong>{item.attempts}</strong><small>{item.success}/{item.attempts} 成功</small></div>)}</div></article>; })}</div>
      <p className="family-method">本期火箭家族由已存 LL2 任务名中的构型前缀归并；下一次月度抓取将优先用正式 configuration ID 回填。</p>
      <div className="metric-dashboard">{metricSeries.map((metric, index) => { const start = range === "5y" ? -5 : 0; const years = metric.years.slice(start); const us = metric.us.slice(start); const cn = metric.cn.slice(start); const other = metric.other.slice(start); const global = metric.global.slice(start); const format = (value: number | null | undefined) => value === null || value === undefined ? "—" : value.toLocaleString("zh-CN", { minimumFractionDigits: metric.decimals ?? 0, maximumFractionDigits: metric.decimals ?? 0 }); const chartSeries: ChartSeries[] = [{ name: "全球", color: "#f4f2ec", values: global, dashed: true }, { name: "美国", color: "#d9ff43", values: us }, { name: "中国", color: "#ff6045", values: cn }, { name: "其他", color: "#6a9eff", values: other }]; return <article className="metric-panel" key={metric.id}><header><div><span>{String(index + 1).padStart(2, "0")} / {metric.eyebrow}</span><h3>{metric.title}</h3></div><b>{metric.unit}</b></header><div className="metric-current four-series"><div><span><i className="legend-global" />GLOBAL</span><strong>{format(global.at(-1))}</strong></div><div><span><i className="legend-us" />US</span><strong>{format(us.at(-1))}</strong></div><div><span><i className="legend-cn" />CN</span><strong>{format(cn.at(-1))}</strong></div><div><span><i className="legend-other" />OTHER</span><strong>{format(other.at(-1))}</strong></div></div><LineChart years={years} series={chartSeries} label={metric.title} /><div className="metric-panel-foot"><span>{metric.note}</span>{metric.sourceUrl ? <a href={metric.sourceUrl} target="_blank" rel="noreferrer">{metric.grade} 级 · 真实事件 ↗</a> : <b>{metric.grade} 级 · 产品样例</b>}</div></article>; })}</div>
    </section>

    <section id="cislunar" className="section topology-section">
      <div className="section-heading"><div><p className="section-index">03 — CISLUNAR FRONTIER</p><h2>地月专题：节点与事件</h2></div><p>这一阶段没有足够密度的连续工业数据。用真实运行节点、计划状态和事件时间轴表达，不把“未发生”画成零。</p></div>
      <div className="cislunar-layout"><div className="space-map elfo"><div className="earth"><span>地球</span></div><div className="trajectory"><span className="node l1">L1</span><span className="node l2">L2</span></div><div className="moon"><i /><span>月球</span></div><div className="active-orbit"><span>QUEQIAO-2 · ELFO</span></div><p className="map-caption">EARTH–MOON DISTANCE · 384,400 KM / NOT TO SCALE</p></div><div className="asset-ledger"><header><span>ACTIVE / OPERATIONAL</span><b>{frontierData.cislunar.assets.length} 个公开节点</b></header>{frontierData.cislunar.assets.map((asset) => <article key={asset.shortName}><div><span className={`country-pill ${asset.country.toLowerCase()}`}>{asset.country}</span><em>{asset.status}</em></div><h3>{asset.name}</h3><p>{asset.type} · {asset.location}</p><small>SINCE {asset.since} · {asset.next}</small><a href={asset.source} target="_blank" rel="noreferrer">{asset.publisher} 来源 ↗</a></article>)}</div></div>
      <div className="event-timeline"><header><span>MISSION TIMELINE</span><h3>已发生、计划与政策不确定性</h3></header>{frontierData.cislunar.events.map((event) => <article key={`${event.date}-${event.title}`}><time>{event.date}</time><i /><div><span>{event.status}</span><h4>{event.title}</h4><p>{event.detail}</p><a href={event.source} target="_blank" rel="noreferrer">官方 / 项目来源 ↗</a></div></article>)}</div>
    </section>

    <section id="stations" className="section station-section">
      <div className="section-heading"><div><p className="section-index">04 — SPACE STATIONS</p><h2>近地轨道的人类前哨</h2></div><p>空间站是状态型基础设施：展示当前构型、质量、轨道和驻留能力，并保留来源，而不是强行生成月度曲线。</p></div>
      <div className="station-grid">{frontierData.stations.map((station) => <article className="station-card" key={station.shortName}><figure><img src={station.image} alt={`${station.name}官方图片`} /><figcaption>{station.imageCredit}</figcaption></figure><header><div><span>{station.shortName} · {station.country}</span><h3>{station.name}</h3></div><em><i />{station.status}</em></header><div className="station-data-grid"><div><span>质量</span><strong>{station.mass}</strong></div><div><span>轨道高度</span><strong>{station.altitude}</strong></div><div><span>轨道倾角</span><strong>{station.inclination}</strong></div><div><span>额定乘员</span><strong>{station.nominalCrew}</strong></div><div><span>加压容积</span><strong>{station.pressurizedVolume}</strong></div><div><span>供电能力</span><strong>{station.power}</strong></div></div><div className="station-foot"><p><b>构型</b>{station.configuration}</p><p><b>寿命 / 历史</b>{station.designLife}</p><a href={station.source} target="_blank" rel="noreferrer">官方技术资料 ↗</a></div></article>)}</div>
    </section>

    <section className="section civilization-section" aria-labelledby="civilization-title"><div className="civilization-copy"><p className="section-index">05 — CIVILIZATION OUTCOME</p><h2 id="civilization-title">竞争是过程。<br />文明进阶是结果。</h2><p>中美对比回答“谁正在建立太空工业链”；卡尔达肖夫指数把全人类掌控的总能流压缩为最终文明读数。它是长期积累后的结果，不是看板的起点。</p><div className="outcome-flow"><span>在轨资产</span><i>→</i><span>运力</span><i>→</i><span>基础设施</span><i>→</i><strong>K</strong></div></div><aside className="k-card final-k-card" aria-label="卡尔达肖夫文明等级"><div className="k-head"><span>卡尔达肖夫指数</span><span>MODEL / EST.</span></div><div className="k-number">0.73042</div><div className="k-delta">↗ +0.00018 <span>/ 年</span></div><div className="progress-track"><span /></div><div className="scale-labels"><span>K 0.70</span><strong>当前：近地轨道工业化</strong><span>K 1.00</span></div><div className="formula">K = ( log₁₀ P − 6 ) / 10</div><div className="k-history-head"><span>历史演进</span><b>1965—2026E · GLOBAL</b></div><LineChart years={kardashevSeries.years} series={[{ name: "全球 K", color: "#d9ff43", values: kardashevSeries.values }]} label="卡尔达肖夫指数" zeroBased={false} axisDecimals={4} /></aside></section>

    <section id="method" className="section method-section"><div className="method-intro"><p className="section-index">06 — DATA PROTOCOL</p><h2>每一个数字，<br />都有来源与边界。</h2><p>在轨资产来自 GCAT 月度快照，发射事件来自 Launch Library 2；地月与空间站采用 NASA、CNSA、CMSE 等官方项目页。质量覆盖按“有质量字段对象数 / 活跃载荷数”同时展示，不用四舍五入后的百分比掩盖缺口。</p></div><div className="confidence-list"><div><span className="grade grade-a">A</span><strong>官方观测</strong><p>任务公报、机构事实页与工程状态</p><em>地月 / 空间站</em></div><div><span className="grade grade-b">B</span><strong>结构化公共数据</strong><p>GCAT 对象目录与 LL2 任务级数据库，可复算</p><em>轨道 / 发射</em></div><div><span className="grade grade-c">C</span><strong>确定性推演</strong><p>运力包线、平台匹配与衰减模型</p><em>必须展示区间</em></div><div><span className="grade grade-d">D</span><strong>产品样例</strong><p>尚未接入来源的质量、复用与成本序列</p><em>{metricSeries.length - observedMetricCount} 个面板</em></div></div></section>

    <footer><div className="footer-brand"><span className="brand-mark">CI</span><div><strong>PROJECT CISLUNAR–I</strong><p>让文明进步成为可测量的工程问题。</p></div></div><div className="footer-meta"><span>VERSION 0.6 ALPHA</span><span>GCAT {orbitCurrent.date} · LL2 {launchDataCutoff}</span><a href="#top">返回顶部 ↑</a></div></footer>
  </main>;
}
