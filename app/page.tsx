"use client";

import { useEffect, useRef, useState } from "react";

type Metric = {
  id: string;
  title: string;
  eyebrow: string;
  unit: string;
  years: string[];
  us: number[];
  cn: number[];
  decimals?: number;
  note: string;
};

const metricSeries: Metric[] = [
  { id: "mass", title: "年度入轨质量", eyebrow: "MASS TO ORBIT", unit: "吨", years: ["2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026E"], us: [214, 261, 384, 471, 612, 746, 880, 1004, 1120], cn: [96, 118, 132, 178, 213, 257, 312, 361, 415], note: "年度入轨干质量 + 推演值" },
  { id: "power", title: "地外在役功率", eyebrow: "OFF-PLANET POWER", unit: "MW", years: ["2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026E"], us: [16.2, 17.1, 18.4, 20.3, 22.6, 24.1, 26.5, 28.1, 29.4], cn: [0.3, 0.5, 1.1, 2.8, 4.9, 5.8, 6.6, 7.2, 7.8], decimals: 1, note: "在役平台装机功率衰减模型" },
  { id: "nodes", title: "地月活跃节点", eyebrow: "CISLUNAR NODES", unit: "个", years: ["2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026E"], us: [2, 2, 3, 3, 4, 5, 6, 7, 8], cn: [1, 1, 1, 2, 2, 3, 5, 5, 6], note: "L1 / L2 / NRHO / ELFO / 月面在役资产" },
  { id: "isru", title: "ISRU 验证任务", eyebrow: "ISRU DEMONSTRATIONS", unit: "项", years: ["2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026E"], us: [1, 1, 2, 2, 3, 3, 4, 5, 6], cn: [2, 3, 3, 4, 4, 5, 6, 6, 7], note: "累计完成或在役的原位资源验证" },
  { id: "mesh", title: "活跃宽带卫星", eyebrow: "ORBITAL MESH", unit: "颗", years: ["2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026E"], us: [67, 183, 1018, 1944, 3271, 4892, 6350, 7100, 7800], cn: [0, 0, 6, 24, 78, 196, 420, 760, 1100], note: "活跃宽带星座对象数" },
  { id: "human", title: "地外人类活动量", eyebrow: "OFF-PLANET HUMAN DAYS", unit: "人·日", years: ["2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026E"], us: [1288, 1354, 1431, 1610, 1728, 1840, 1965, 2050, 2114], cn: [0, 0, 0, 196, 547, 694, 731, 788, 827], note: "按国籍归属的年度在轨驻留人·日" },
];

function LineChart({ years, us, cn, label }: { years: string[]; us: number[]; cn: number[]; label: string }) {
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
      const max = Math.max(...us, ...cn, 1) * 1.08;
      ctx.clearRect(0, 0, width, height);
      ctx.font = "9px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textBaseline = "middle";
      for (let i = 0; i < 4; i++) {
        const y = pad.t + (plotH * i) / 3;
        ctx.strokeStyle = "#363a43";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(width - pad.r, y); ctx.stroke();
        ctx.fillStyle = "#747985";
        const value = max * (1 - i / 3);
        ctx.fillText(value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toFixed(value < 10 ? 1 : 0), 3, y);
      }
      const x = (i: number) => pad.l + (plotW * i) / Math.max(years.length - 1, 1);
      const y = (v: number) => pad.t + plotH - (v / max) * plotH;
      const plot = (values: number[], color: string) => {
        ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.lineJoin = "round"; ctx.lineCap = "round";
        ctx.beginPath(); values.forEach((v, i) => i ? ctx.lineTo(x(i), y(v)) : ctx.moveTo(x(i), y(v))); ctx.stroke();
        values.forEach((v, i) => { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x(i), y(v), i === values.length - 1 ? 3.5 : 2, 0, Math.PI * 2); ctx.fill(); });
      };
      plot(us, "#d9ff43"); plot(cn, "#ff6045");
      ctx.fillStyle = "#747985"; ctx.textBaseline = "bottom";
      [0, Math.floor((years.length - 1) / 2), years.length - 1].forEach((i) => { const text = years[i]; const tw = ctx.measureText(text).width; ctx.fillText(text, Math.min(Math.max(x(i) - tw / 2, pad.l), width - pad.r - tw), height - 4); });
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [years, us, cn]);

  return <canvas ref={ref} className="metric-canvas" role="img" aria-label={`${label}：美国与中国的连续时间序列`} />;
}

const launchYears = [
  { y: "1957", us: 2, cn: 0, other: 8 }, { y: "1970", us: 52, cn: 1, other: 31 },
  { y: "1985", us: 38, cn: 3, other: 57 }, { y: "2000", us: 96, cn: 18, other: 76 },
  { y: "2010", us: 112, cn: 41, other: 69 }, { y: "2015", us: 157, cn: 68, other: 73 },
  { y: "2020", us: 384, cn: 132, other: 122 }, { y: "2024", us: 880, cn: 312, other: 194 },
  { y: "2026E", us: 1120, cn: 415, other: 307 },
];

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
        <nav className="topnav" aria-label="主导航"><a className="active" href="#overview">总览</a><a href="#comparison">中美对比</a><a href="#domains">指标域</a><a href="#method">方法论</a></nav>
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
          <div className="telemetry-head"><span>2026 YTD / RAW SNAPSHOT</span><span>6 SIGNALS ONLINE</span></div>
          <div className="telemetry-country-head"><span>指标</span><b>US · 美国</b><b>CN · 中国</b></div>
          {metricSeries.slice(0, 4).map((metric) => <div className="telemetry-row" key={metric.id}><span>{metric.title}<small>{metric.unit}</small></span><strong>{metric.us.at(-1)?.toLocaleString()}</strong><strong>{metric.cn.at(-1)?.toLocaleString()}</strong></div>)}
          <div className="telemetry-foot"><span><i className="legend-us" />美国</span><span><i className="legend-cn" />中国</span><b>连续时间序列 ↓</b></div>
        </aside>
      </section>

      <section className="dashboard-toolbar" aria-label="时序看板控制栏">
        <div><span className="live-dot" /> 数据截止：2026.08.18</div>
        <div className="series-legend"><span><i className="legend-us" />US · 美国</span><span><i className="legend-cn" />CN · 中国</span></div>
        <div className="range-control" role="group" aria-label="选择时间范围"><button className={range === "5y" ? "selected" : ""} onClick={() => setRange("5y")}>近 5 年</button><button className={range === "all" ? "selected" : ""} onClick={() => setRange("all")}>全部可用</button></div>
      </section>

      <section id="comparison" className="section metric-console-section">
        <div className="section-heading">
          <div><p className="section-index">01 — CONTINUOUS METRICS</p><h2>双边时序看板</h2></div>
          <p>每个面板只表达一个工程量。纵轴使用原始单位；<br />两国曲线共享同一量程，不做归一化评分。</p>
        </div>
        <div className="metric-dashboard">
          {metricSeries.map((metric, index) => {
            const start = range === "5y" ? -5 : 0;
            const years = metric.years.slice(start);
            const us = metric.us.slice(start);
            const cn = metric.cn.slice(start);
            const format = (v: number) => v.toLocaleString("zh-CN", { minimumFractionDigits: metric.decimals ?? 0, maximumFractionDigits: metric.decimals ?? 0 });
            return <article className="metric-panel" key={metric.id}>
              <header><div><span>{String(index + 1).padStart(2, "0")} / {metric.eyebrow}</span><h3>{metric.title}</h3></div><b>{metric.unit}</b></header>
              <div className="metric-current"><div><span><i className="legend-us" />US</span><strong>{format(us.at(-1) ?? 0)}<small>{metric.unit}</small></strong></div><div><span><i className="legend-cn" />CN</span><strong>{format(cn.at(-1) ?? 0)}<small>{metric.unit}</small></strong></div></div>
              <LineChart years={years} us={us} cn={cn} label={metric.title} />
              <div className="metric-panel-foot"><span>{metric.note}</span><b>D 级 · 演示数据</b></div>
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
        <div className="section-heading"><div><p className="section-index">04 — METRIC SYSTEM</p><h2>六大核心指标域</h2></div><p>每个分数均回溯到可观察的物理量、任务事件或工程状态；<br />推演值独立标注，不与官方观测值混合。</p></div>
        <div className="domain-grid">{domains.map(([num, title, en, desc, value]) => <article className="domain-card" key={num}><div className="domain-top"><span>{num}</span><b>{en}</b></div><h3>{title}</h3><p>{desc}</p><strong>{value}</strong><a href="#method" aria-label={`查看${title}的方法`}>方法与口径 ↗</a></article>)}</div>
      </section>

      <section className="section industrial-section">
        <div className="section-heading"><div><p className="section-index">05 — INDUSTRIALIZATION</p><h2>从补给依赖到原位自给</h2></div><p>首版追踪三条最关键的闭环链路。当前均处于<br />“任务验证”而非“规模化运营”阶段。</p></div>
        <div className="industrial-grid">
          {[["水循环闭环率", "ECLSS · WATER", 94, "空间站成熟"], ["氧气再生闭环率", "ECLSS · OXYGEN", 50, "部分闭环"], ["非地球质量比", "ISRU · LOCAL MASS", 3.2, "实验阶段"]].map(([name, en, value, status]) => <div className="industrial-card" key={String(name)}><span>{en}</span><strong>{value}<small>%</small></strong><h3>{name}</h3><div className="industrial-track"><i style={{ width: `${value}%` }} /></div><p><b>{status}</b> / 规模化阈值 60%</p></div>)}
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

      <footer><div className="footer-brand"><span className="brand-mark">CI</span><div><strong>PROJECT CISLUNAR–I</strong><p>让文明进步成为可测量的工程问题。</p></div></div><div className="footer-meta"><span>VERSION 0.2 ALPHA</span><span>DATA: DEMONSTRATION MODEL</span><a href="#top">返回顶部 ↑</a></div></footer>
    </main>
  );
}
