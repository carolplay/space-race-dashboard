"use client";

import { useState } from "react";

const capability = {
  us: [
    ["运力吞吐", 91, "1,284 t"], ["地外能源", 88, "29.4 MW"], ["地月节点", 82, "8 ACTIVE"],
    ["原位利用", 54, "6 DEMOS"], ["轨道算力", 96, "7,800+ SAT"], ["深空驻留", 86, "2,114 人·日"],
  ],
  cn: [
    ["运力吞吐", 71, "462 t"], ["地外能源", 64, "7.8 MW"], ["地月节点", 77, "6 ACTIVE"],
    ["原位利用", 62, "7 DEMOS"], ["轨道算力", 58, "1,100+ SAT"], ["深空驻留", 49, "827 人·日"],
  ],
} as const;

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
  const [selected, setSelected] = useState<"us" | "cn">("us");
  const [orbit, setOrbit] = useState<"nrho" | "elfo">("nrho");
  const profile = capability[selected];

  return (
    <main id="top" className="dashboard-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Project Cislunar-I 首页"><span className="brand-mark">CI</span><span>PROJECT CISLUNAR–I</span></a>
        <nav className="topnav" aria-label="主导航"><a className="active" href="#overview">总览</a><a href="#comparison">中美对比</a><a href="#domains">指标域</a><a href="#method">方法论</a></nav>
        <div className="signal"><span /> 模型在线 · 2026</div>
      </header>

      <section id="overview" className="hero-grid">
        <div className="hero-copy">
          <p className="eyebrow">CIVILIZATION STATUS · 地月工业化追踪</p>
          <h1>人类距离<br />I 型文明还有多远？</h1>
          <p className="dek">从进入轨道的每一千克质量，到地外捕获的每一瓦能量。用可核验的工程数据，观察地月空间从探索前沿转向工业疆域。</p>
          <div className="hero-actions"><a className="primary-button" href="#comparison">进入任务控制台 <span>↗</span></a><span className="updated">数据版本<br /><strong>ALPHA 0.1 · 示例模型</strong></span></div>
        </div>
        <aside className="k-card" aria-label="卡尔达肖夫文明等级">
          <div className="k-head"><span>卡尔达肖夫指数</span><span>MODEL / EST.</span></div>
          <div className="k-number">0.73042</div><div className="k-delta">↗ +0.00018 <span>/ 年</span></div>
          <div className="progress-track"><span /></div>
          <div className="scale-labels"><span>K 0.70</span><strong>当前：近地轨道工业化</strong><span>K 1.00</span></div>
          <div className="formula">K = ( log₁₀ P − 6 ) / 10</div>
        </aside>
      </section>

      <section className="mission-strip" aria-label="关键任务读数">
        <div><span>01 / 年入轨质量</span><strong>1,842<small> t</small></strong><em>+31.4% YOY</em></div>
        <div><span>02 / 地外在役功率</span><strong>38.6<small> MW</small></strong><em>+8.7% YOY</em></div>
        <div><span>03 / 地月节点</span><strong>14<small> 个</small></strong><em>6 ACTIVE</em></div>
        <div><span>04 / 地外人类活动</span><strong>2,941<small> 人·日</small></strong><em>2026 YTD</em></div>
      </section>

      <section id="comparison" className="section comparison-section">
        <div className="section-heading">
          <div><p className="section-index">01 — BILATERAL CAPABILITY</p><h2>双边能力剖面</h2></div>
          <p>同一物理口径下的中美地月工业能力比较。<br />指数以该指标域的可观察全球前沿为 100。</p>
        </div>
        <div className="comparison-grid">
          <div className="profile-panel">
            <div className="country-tabs" role="group" aria-label="选择国家">
              <button className={selected === "us" ? "selected" : ""} onClick={() => setSelected("us")}><span>US</span> 美国</button>
              <button className={selected === "cn" ? "selected" : ""} onClick={() => setSelected("cn")}><span>CN</span> 中国</button>
            </div>
            <div className="profile-summary"><strong>{selected === "us" ? "83.0" : "63.5"}</strong><span>综合工业能力指数<br /><b>{selected === "us" ? "领先：运力 / 轨道算力" : "领先：地月任务密度"}</b></span></div>
            <div className="capability-list">
              {profile.map(([label, score, metric]) => <div className="cap-row" key={label}><div><span>{label}</span><b>{metric}</b></div><div className="cap-track"><i style={{ width: `${score}%` }} /></div><em>{score}</em></div>)}
            </div>
          </div>
          <div className="versus-panel" aria-label="中美能力总览">
            <div className="versus-title"><span>US</span><b>能力差值</b><span>CN</span></div>
            <div className="orbit-rings"><div className="ring ring-a" /><div className="ring ring-b" /><div className="planet-dot">Δ</div><span className="sat-dot sat-one" /><span className="sat-dot sat-two" /></div>
            <div className="versus-score"><div><strong>83.0</strong><span>美国</span></div><div className="delta-box">+19.5<br /><small>指数点</small></div><div><strong>63.5</strong><span>中国</span></div></div>
            <p>差距正在从“能否抵达”转向“能否高频、低成本、持续运营”。</p>
          </div>
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

      <section id="method" className="section method-section">
        <div className="method-intro"><p className="section-index">06 — DATA PROTOCOL</p><h2>每一个数字，<br />都有证据等级。</h2><p>首版建立统一口径与置信度协议。在真实数据管道接入前，界面读数均作为产品演示样例，不代表实时官方统计。</p></div>
        <div className="confidence-list">
          <div><span className="grade grade-a">A</span><strong>官方观测</strong><p>任务公报、对象目录、能源年鉴</p><em>可直接引用</em></div>
          <div><span className="grade grade-b">B</span><strong>多源校验</strong><p>公开数据库交叉比对后的工程值</p><em>置信度 ≥ 80%</em></div>
          <div><span className="grade grade-c">C</span><strong>确定性推演</strong><p>运力包线、平台匹配与衰减模型</p><em>必须展示区间</em></div>
          <div><span className="grade grade-d">D</span><strong>产品样例</strong><p>用于验证界面结构与叙事的占位值</p><em>当前版本</em></div>
        </div>
      </section>

      <footer><div className="footer-brand"><span className="brand-mark">CI</span><div><strong>PROJECT CISLUNAR–I</strong><p>让文明进步成为可测量的工程问题。</p></div></div><div className="footer-meta"><span>VERSION 0.1 ALPHA</span><span>DATA: DEMONSTRATION MODEL</span><a href="#top">返回顶部 ↑</a></div></footer>
    </main>
  );
}
