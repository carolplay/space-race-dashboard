"use client";

import { useEffect, useRef, useState } from "react";

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
  grade: "B" | "C" | "D";
};

const metricSeries: Metric[] = [
  { id: "attempts", title: "轨道发射尝试", eyebrow: "ORBITAL ATTEMPTS", unit: "次/年", years: ["2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026E"], us: [29, 31, 27, 44, 51, 87, 116, 158, 181, 205], cn: [18, 39, 34, 39, 56, 64, 67, 68, 76, 88], other: [44, 44, 41, 31, 38, 35, 40, 36, 42, 48], global: [91, 114, 102, 114, 145, 186, 223, 262, 299, 341], note: "按发射服务商控制主体归属", grade: "B" },
  { id: "success", title: "成功入轨任务", eyebrow: "SUCCESSFUL MISSIONS", unit: "次/年", years: ["2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026E"], us: [29, 31, 26, 40, 48, 84, 113, 153, 176, 199], cn: [16, 38, 32, 35, 53, 62, 66, 66, 74, 85], other: [41, 43, 40, 29, 36, 33, 38, 34, 39, 45], global: [86, 112, 98, 104, 137, 179, 217, 253, 289, 329], note: "成功完成预定轨道注入的任务", grade: "B" },
  { id: "mass", title: "年度入轨质量", eyebrow: "MASS TO ORBIT", unit: "吨", years: ["2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026E"], us: [160, 204, 261, 384, 471, 612, 746, 880, 1004, 1120], cn: [55, 78, 96, 132, 178, 213, 257, 312, 361, 415], other: [85, 89, 97, 122, 135, 154, 172, 194, 238, 307], global: [300, 371, 454, 638, 784, 979, 1175, 1386, 1603, 1842], note: "年度入轨干质量 + 未公开载荷推演", grade: "C" },
  { id: "mass-per-launch", title: "单次平均入轨质量", eyebrow: "MASS PER SUCCESS", unit: "吨/次", years: ["2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026E"], us: [5.5, 6.6, 10, 9.6, 9.8, 7.3, 6.6, 5.8, 5.7, 5.6], cn: [3.4, 2.1, 3, 3.8, 3.4, 3.4, 3.9, 4.7, 4.9, 4.9], other: [2.1, 2.1, 2.4, 4.2, 3.8, 4.7, 4.5, 5.7, 6.1, 6.8], global: [3.5, 3.3, 4.6, 6.1, 5.7, 5.5, 5.4, 5.5, 5.5, 5.6], decimals: 1, note: "年度入轨质量 ÷ 成功任务数", grade: "C" },
  { id: "reflight-share", title: "飞行验证一级使用率", eyebrow: "FLIGHT-PROVEN SHARE", unit: "%", years: ["2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026E"], us: [12, 45, 59, 62, 71, 79, 88, 92, 95, 96], cn: [null, null, null, null, null, null, 2, 8, 18, 33], other: [null, null, null, null, null, null, null, 2, 3, 4], global: [4, 13, 16, 22, 28, 36, 48, 58, 65, 70], note: "飞行验证一级任务数 ÷ 可判定轨道发射数", grade: "B" },
  { id: "recovery", title: "一级回收成功率", eyebrow: "BOOSTER RECOVERY", unit: "%", years: ["2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026E"], us: [73, 85, 92, 91, 95, 96, 97, 98, 98, 99], cn: [null, null, null, null, null, null, 75, 82, 88, 92], other: [null, null, null, null, null, null, null, 60, 67, 72], global: [73, 85, 92, 91, 95, 96, 96, 96, 97, 98], note: "成功回收次数 ÷ 回收尝试次数", grade: "B" },
  { id: "turnaround", title: "助推器中位周转时间", eyebrow: "BOOSTER TURNAROUND", unit: "天", years: ["2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026E"], us: [225, 180, 128, 106, 74, 52, 42, 31, 25, 21], cn: [null, null, null, null, null, null, null, 180, 120, 92], other: [null, null, null, null, null, null, null, null, 210, 165], global: [225, 180, 128, 106, 74, 52, 42, 35, 29, 25], note: "同一一级序列号两次轨道任务的中位天数", grade: "B" },
  { id: "flight-number", title: "助推器中位飞行轮次", eyebrow: "MEDIAN FLIGHT NUMBER", unit: "第 N 飞", years: ["2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026E"], us: [2, 2, 3, 4, 5, 7, 10, 13, 16, 19], cn: [null, null, null, null, null, null, null, 2, 2, 3], other: [null, null, null, null, null, null, null, null, 2, 2], global: [2, 2, 3, 4, 5, 7, 9, 12, 15, 18], note: "仅统计飞行验证一级参与的任务", grade: "B" },
  { id: "cost-per-kg", title: "平均单位重量入轨成本", eyebrow: "EST. COST TO ORBIT", unit: "2026 USD/kg", years: ["2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026E"], us: [5600, 4600, 3800, 3100, 2500, 2100, 1800, 1550, 1350, 1200], cn: [7200, 6800, 6300, 5900, 5400, 4900, 4500, 4100, 3800, 3500], other: [11800, 11200, 10600, 10100, 9600, 9200, 8900, 8600, 8200, 7900], global: [7600, 6800, 6000, 5300, 4600, 4000, 3400, 2900, 2500, 2200], note: "Σ估算任务价格 ÷ Σ入轨质量；恒定 2026 美元", grade: "C" },
];

type ChartSeries = { name: string; color: string; values: Array<number | null>; dashed?: boolean };

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
      for (let i = 0; i < 4; i++) {
        const y = pad.t + (plotH * i) / 3;
        ctx.strokeStyle = "#363a43";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(width - pad.r, y); ctx.stroke();
        ctx.fillStyle = "#747985";
        const value = max - ((max - min) * i) / 3;
        ctx.fillText(value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toFixed(axisDecimals ?? (value < 10 ? 1 : 0)), 3, y);
      }
      const x = (i: number) => pad.l + (plotW * i) / Math.max(years.length - 1, 1);
      const y = (v: number) => pad.t + plotH - ((v - min) / Math.max(max - min, 0.0001)) * plotH;
      const plot = ({ values, color, dashed }: ChartSeries) => {
        ctx.strokeStyle = color; ctx.lineWidth = color === "#f4f2ec" ? 2.4 : 1.8; ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.setLineDash(dashed ? [6, 4] : []);
        let started = false;
        ctx.beginPath(); values.forEach((v, i) => { if (v === null) { started = false; return; } if (!started) { ctx.moveTo(x(i), y(v)); started = true; } else ctx.lineTo(x(i), y(v)); }); ctx.stroke();
        ctx.setLineDash([]);
        values.forEach((v, i) => { if (v === null) return; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x(i), y(v), i === values.length - 1 ? 3.2 : 1.8, 0, Math.PI * 2); ctx.fill(); });
      };
      series.forEach(plot);
      ctx.fillStyle = "#747985"; ctx.textBaseline = "bottom";
      [0, Math.floor((years.length - 1) / 2), years.length - 1].forEach((i) => { const text = years[i]; const tw = ctx.measureText(text).width; ctx.fillText(text, Math.min(Math.max(x(i) - tw / 2, pad.l), width - pad.r - tw), height - 4); });
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [years, series, zeroBased, axisDecimals]);

  return <canvas ref={ref} className="metric-canvas" role="img" aria-label={`${label}连续时间序列`} />;
}

const launchYears = [
  { y: "1957", us: 2, cn: 0, other: 8 }, { y: "1970", us: 52, cn: 1, other: 31 },
  { y: "1985", us: 38, cn: 3, other: 57 }, { y: "2000", us: 96, cn: 18, other: 76 },
  { y: "2010", us: 112, cn: 41, other: 69 }, { y: "2015", us: 157, cn: 68, other: 73 },
  { y: "2020", us: 384, cn: 132, other: 122 }, { y: "2024", us: 880, cn: 312, other: 194 },
  { y: "2026E", us: 1120, cn: 415, other: 307 },
];

const kardashevSeries = {
  years: ["1965", "1975", "1985", "1995", "2005", "2015", "2020", "2024", "2026E"],
  values: [0.7131, 0.7184, 0.7215, 0.7242, 0.7271, 0.7290, 0.7297, 0.7302, 0.73042],
};

const domains = [
  ["01", "质量通量与物流", "MASS FLUX", "入轨吨位 · 发射成本 · 复用周转 · 推进剂转运", "1,842 t"],
  ["02", "地外功率与能源", "OFF-PLANET POWER", "光伏装机 · 核动力 · 无线能量传输", "38.6 MW"],
  ["03", "地月战略节点", "CISLUNAR NODES", "月球极区 · 拉格朗日点 · 通信与 PNT", "14 个"],
  ["04", "原位资源与生态", "ISRU + BIOSPHERE", "水冰提取 · 生保闭环 · 非地球质量比", "3.2%"],
  ["05", "轨道数字化基座", "COMPUTE + SSA", "星座规模 · 激光骨干 · 碎片治理", "9.4k sat"],
  ["06", "驻留与治理体系", "HUMAN + GOVERNANCE", "人类活动量 · 协作网络 · 规则覆盖", "2,941 人·日"],
] as const;

export default function Home() {
  const [orbit, setOrbit] = useState<"nrho" | "elfo">("nrho");
  const [range, setRange] = useState<"5y" | "all">("all");

  return (
    <main id="top" className="dashboard-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Project Cislunar-I 首页"><span className="brand-mark">CI</span><span>PROJECT CISLUNAR–I</span></a>
        <nav className="topnav" aria-label="主导航"><a className="active" href="#overview">总览</a><a href="#comparison">发射工业</a><a href="#domains">指标域</a><a href="#method">方法论</a></nav>
        <div className="signal"><span /> 模型在线 · 2026</div>
      </header>

      <section id="overview" className="rivalry-hero">
        <div className="hero-copy">
          <p className="eyebrow">US × CHINA · RAW TELEMETRY</p>
          <h1>中美地月<br />工业竞速</h1>
          <p className="dek">拒绝主观打分，只追踪可以回到任务、载荷和工程状态的原始数字。每项能力单独成图，用连续时间序列观察真实差距与发展斜率。</p>
          <div className="hero-actions"><a className="primary-button" href="#comparison">进入时序看板 <span>↓</span></a><span className="updated">数据模式<br /><strong>RAW VALUES · D 级样例</strong></span></div>
        </div>
        <aside className="hero-telemetry" aria-label="中美关键原始数据快照">
          <div className="telemetry-head"><span>2026 YTD / RAW SNAPSHOT</span><span>9 SIGNALS ONLINE</span></div>
          <div className="telemetry-country-head"><span>指标</span><b>US · 美国</b><b>CN · 中国</b></div>
          {metricSeries.slice(0, 4).map((metric) => <div className="telemetry-row" key={metric.id}><span>{metric.title}<small>{metric.unit}</small></span><strong>{metric.us.at(-1)?.toLocaleString()}</strong><strong>{metric.cn.at(-1)?.toLocaleString()}</strong></div>)}
          <div className="telemetry-foot"><span><i className="legend-us" />美国</span><span><i className="legend-cn" />中国</span><b>连续时间序列 ↓</b></div>
        </aside>
      </section>

      <section className="dashboard-toolbar" aria-label="时序看板控制栏">
        <div><span className="live-dot" /> 数据截止：2026.08.18</div>
        <div className="series-legend"><span><i className="legend-global" />全球</span><span><i className="legend-us" />美国</span><span><i className="legend-cn" />中国</span><span><i className="legend-other" />其他</span></div>
        <div className="range-control" role="group" aria-label="选择时间范围"><button className={range === "5y" ? "selected" : ""} onClick={() => setRange("5y")}>近 5 年</button><button className={range === "all" ? "selected" : ""} onClick={() => setRange("all")}>全部可用</button></div>
      </section>

      <section id="comparison" className="section metric-console-section">
        <div className="section-heading">
          <div><p className="section-index">01 — LAUNCH OPERATIONS</p><h2>全球发射工业看板</h2></div>
          <p>每个面板只表达一个工程量。全球、美国、中国和其他<br />共享同一原始量程；空缺代表尚未形成有效运营数据。</p>
        </div>
        <div className="metric-dashboard">
          {metricSeries.map((metric, index) => {
            const start = range === "5y" ? -5 : 0;
            const years = metric.years.slice(start);
            const us = metric.us.slice(start);
            const cn = metric.cn.slice(start);
            const other = metric.other.slice(start);
            const global = metric.global.slice(start);
            const format = (v: number | null | undefined) => v === null || v === undefined ? "—" : v.toLocaleString("zh-CN", { minimumFractionDigits: metric.decimals ?? 0, maximumFractionDigits: metric.decimals ?? 0 });
            const chartSeries: ChartSeries[] = [
              { name: "全球", color: "#f4f2ec", values: global, dashed: true },
              { name: "美国", color: "#d9ff43", values: us },
              { name: "中国", color: "#ff6045", values: cn },
              { name: "其他", color: "#6a9eff", values: other },
            ];
            return <article className="metric-panel" key={metric.id}>
              <header><div><span>{String(index + 1).padStart(2, "0")} / {metric.eyebrow}</span><h3>{metric.title}</h3></div><b>{metric.unit}</b></header>
              <div className="metric-current four-series"><div><span><i className="legend-global" />GLOBAL</span><strong>{format(global.at(-1))}</strong></div><div><span><i className="legend-us" />US</span><strong>{format(us.at(-1))}</strong></div><div><span><i className="legend-cn" />CN</span><strong>{format(cn.at(-1))}</strong></div><div><span><i className="legend-other" />OTHER</span><strong>{format(other.at(-1))}</strong></div></div>
              <LineChart years={years} series={chartSeries} label={metric.title} />
              <div className="metric-panel-foot"><span>{metric.note}</span><b>{metric.grade} 级 · {metric.grade === "C" ? "模型估算" : "多源校验"}</b></div>
            </article>;
          })}
        </div>
      </section>

      <section className="section dark-section">
        <div className="section-heading inverse"><div><p className="section-index">02 — MASS TO ORBIT</p><h2>穿透引力势阱</h2></div><div className="legend"><span><i className="us-color" />美国</span><span><i className="cn-color" />中国</span><span><i className="other-color" />其他</span></div></div>
        <div className="chart-layout">
          <div className="mass-chart" aria-label="1957 至 2026 年全球入轨质量示例图">
            <div className="y-axis"><span>1,800t</span><span>1,200t</span><span>600t</span><span>0</span></div>
            <div className="chart-bars">{launchYears.map((d) => <div className="bar-year" key={d.y}><div className="bar-stack"><i className="bar-us" style={{ height: `${d.us / 7}px` }} /><i className="bar-cn" style={{ height: `${d.cn / 7}px` }} /><i className="bar-other" style={{ height: `${d.other / 7}px` }} /></div><span>{d.y}</span></div>)}</div>
          </div>
          <aside className="chart-note"><span>关键跃迁</span><strong>可复用火箭改变了质量通量的斜率。</strong><p>2015 年后，单位质量成本下降与高频复用共同推动年度入轨吨位进入指数式增长区间。</p><div className="note-metric"><b>−84%</b><small>2015—2026E<br />估算边际成本变化</small></div><div className="source-tag">口径：入轨干质量 + 推演值</div></aside>
        </div>
      </section>

      <section className="section topology-section">
        <div className="section-heading"><div><p className="section-index">03 — CISLUNAR TOPOLOGY</p><h2>地月战略节点</h2></div><div className="orbit-toggle" role="group" aria-label="选择轨道"><button className={orbit === "nrho" ? "selected" : ""} onClick={() => setOrbit("nrho")}>NRHO</button><button className={orbit === "elfo" ? "selected" : ""} onClick={() => setOrbit("elfo")}>ELFO</button></div></div>
        <div className="topology-grid">
          <div className={`space-map ${orbit}`}>
            <div className="earth"><span>地球</span></div><div className="trajectory"><span className="node l1">L1</span><span className="node l2">L2</span></div><div className="moon"><i /><span>月球</span></div>
            <div className="active-orbit"><span>{orbit === "nrho" ? "GATEWAY · NRHO" : "QUEQIAO-2 · ELFO"}</span></div>
            <p className="map-caption">EARTH–MOON DISTANCE · 384,400 KM / NOT TO SCALE</p>
          </div>
          <div className="node-list"><div className="node-head"><span>运行节点</span><span>STATUS</span></div>{[
            ["地月 L1", "中继 / 观测", "02"], ["地月 L2", "中继 / 深空", "04"], ["NRHO", "载人前哨", orbit === "nrho" ? "03" : "02"], ["ELFO", "月背通信", orbit === "elfo" ? "04" : "03"], ["南极表面", "资源勘探", "05"],
          ].map(([name, use, count]) => <div className="node-row" key={name}><b>{name}</b><span>{use}</span><strong>{count}</strong><i /></div>)}</div>
        </div>
      </section>

      <section id="domains" className="section domains-section">
        <div className="section-heading"><div><p className="section-index">04 — METRIC SYSTEM</p><h2>六大核心指标域</h2></div><p>每个读数均回溯到可观察的物理量、任务事件或工程状态；<br />推演值独立标注，不与官方观测值混合。</p></div>
        <div className="domain-grid">{domains.map(([num, title, en, desc, value]) => <article className="domain-card" key={num}><div className="domain-top"><span>{num}</span><b>{en}</b></div><h3>{title}</h3><p>{desc}</p><strong>{value}</strong><a href="#method" aria-label={`查看${title}的方法`}>方法与口径 ↗</a></article>)}</div>
      </section>

      <section className="section industrial-section">
        <div className="section-heading"><div><p className="section-index">05 — FRONTIER READINESS</p><h2>尚未发生的，不画零线</h2></div><p>未进入连续运营阶段的能力改用准备度和下一里程碑；<br />首次形成有效年通量后，才转入上方时序看板。</p></div>
        <div className="readiness-grid">
          {[["在轨推进剂转运", "IN-ORBIT REFUELING", "飞行验证", "下一门槛：吨级低温推进剂转运"], ["月面水冰开采", "LUNAR WATER", "未验证", "下一门槛：原位提取可称量 H₂O"], ["月面原位建造", "LOCAL CONSTRUCTION", "技术验证", "下一门槛：10 m² 级功能构筑物"]].map(([name, en, status, next], index) => <div className="readiness-card" key={name}><div><span>{String(index + 1).padStart(2, "0")}</span><b>{en}</b></div><em>{status}</em><h3>{name}</h3><p>{next}</p><small>事件驱动 · 暂无连续时序</small></div>)}
        </div>
      </section>

      <section className="section civilization-section" aria-labelledby="civilization-title">
        <div className="civilization-copy"><p className="section-index">06 — CIVILIZATION OUTCOME</p><h2 id="civilization-title">竞争是过程。<br />文明进阶是结果。</h2><p>中美能力对比回答“谁正在建立地月工业链”；卡尔达肖夫指数则把全人类掌控的总能流压缩为最终文明读数。它是六大能力长期积累后的结果，而不是看板的起点。</p><div className="outcome-flow"><span>运力</span><i>→</i><span>能源</span><i>→</i><span>工业</span><i>→</i><strong>K</strong></div></div>
        <aside className="k-card final-k-card" aria-label="卡尔达肖夫文明等级">
          <div className="k-head"><span>卡尔达肖夫指数</span><span>MODEL / EST.</span></div>
          <div className="k-number">0.73042</div><div className="k-delta">↗ +0.00018 <span>/ 年</span></div>
          <div className="progress-track"><span /></div>
          <div className="scale-labels"><span>K 0.70</span><strong>当前：近地轨道工业化</strong><span>K 1.00</span></div>
          <div className="formula">K = ( log₁₀ P − 6 ) / 10</div>
          <div className="k-history-head"><span>历史演进</span><b>1965—2026E · GLOBAL</b></div>
          <LineChart years={kardashevSeries.years} series={[{ name: "全球 K", color: "#d9ff43", values: kardashevSeries.values }]} label="卡尔达肖夫指数" zeroBased={false} axisDecimals={4} />
        </aside>
      </section>

      <section id="method" className="section method-section">
        <div className="method-intro"><p className="section-index">07 — DATA PROTOCOL</p><h2>每一个数字，<br />都有证据等级。</h2><p>首版建立统一口径与置信度协议。在真实数据管道接入前，界面读数均作为产品演示样例，不代表实时官方统计。</p></div>
        <div className="confidence-list">
          <div><span className="grade grade-a">A</span><strong>官方观测</strong><p>任务公报、对象目录、能源年鉴</p><em>可直接引用</em></div>
          <div><span className="grade grade-b">B</span><strong>多源校验</strong><p>公开数据库交叉比对后的工程值</p><em>置信度 ≥ 80%</em></div>
          <div><span className="grade grade-c">C</span><strong>确定性推演</strong><p>运力包线、平台匹配与衰减模型</p><em>必须展示区间</em></div>
          <div><span className="grade grade-d">D</span><strong>产品样例</strong><p>用于验证界面结构与叙事的占位值</p><em>当前版本</em></div>
        </div>
      </section>

      <footer><div className="footer-brand"><span className="brand-mark">CI</span><div><strong>PROJECT CISLUNAR–I</strong><p>让文明进步成为可测量的工程问题。</p></div></div><div className="footer-meta"><span>VERSION 0.4 ALPHA</span><span>DATA: DEMONSTRATION MODEL</span><a href="#top">返回顶部 ↑</a></div></footer>
    </main>
  );
}
