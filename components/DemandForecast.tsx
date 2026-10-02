import forecast from "@/data/metrics/demand-forecast.json";

type Lang = "zh" | "en";
type Point = { year: number; value: number };
type Series = { label: string; color: string; points: Point[]; forecastFrom?: number };
const n = (value: number) => Math.round(value * 100) / 100;
const fmt = (value: number) => value.toLocaleString("en-US");

function ForecastChart({ title, series, start, end, max, unit, labels }: { title: string; series: Series[]; start: number; end: number; max: number; unit: string; labels: string[] }) {
  const x = (year: number) => n(58 + (year - start) / (end - start) * 770);
  const y = (value: number) => n(252 - value / max * 210);
  const line = (points: Point[]) => points.map((p, i) => `${i ? "L" : "M"}${x(p.year)},${y(p.value)}`).join(" ");
  const ticks = [0, .25, .5, .75, 1];
  return <div className="forecast-plot"><svg viewBox="0 0 860 286" role="img" aria-label={title}>
    {ticks.map(t => <g key={t}><line x1="58" x2="828" y1={y(max * t)} y2={y(max * t)} stroke="#50545a" strokeWidth="1"/><text x="50" y={y(max * t) + 3} textAnchor="end">{fmt(Math.round(max * t))}</text></g>)}
    {labels.map(label => <text key={label} x={x(Number(label))} y="273" textAnchor="middle">{label}</text>)}
    <line x1={x(2026)} x2={x(2026)} y1="42" y2="252" stroke="#bfc2c5" strokeDasharray="3 5"/>
    {series.map(s => { const actual=s.forecastFrom==null?s.points:s.points.filter(p=>p.year<=s.forecastFrom!); const projected=s.forecastFrom==null?[]:s.points.filter(p=>p.year>=s.forecastFrom!); return <g key={s.label}>
      {actual.length>1&&<path d={line(actual)} fill="none" stroke={s.color} strokeWidth="2.5"/>}
      {projected.length>1&&<path d={line(projected)} fill="none" stroke={s.color} strokeWidth="2.5" strokeDasharray="6 5"/>}
      {s.points.map(p=><circle key={p.year} cx={x(p.year)} cy={y(p.value)} r={p.year===2026?3.5:2} fill={s.color}><title>{`${s.label} · ${p.year}: ${fmt(p.value)} ${unit}`}</title></circle>)}
    </g>; })}
  </svg><div className="forecast-legend">{series.map(s=><span key={s.label}><i style={{background:s.color}}/>{s.label}</span>)}</div></div>;
}

function Intro({lang,kind}:{lang:Lang;kind:"launch"|"orbit"|"fleet"}) {
  const zh=lang==="zh";
  const title={launch:zh?"未来十年：发射节奏与履约压力":"Next decade: launch cadence and deployment pressure",orbit:zh?"在轨载荷库存：观测与条件外推":"Orbital payload stock: observation and extrapolation",fleet:zh?"星座在轨规模：惯性曲线与申报情景":"Constellation fleets: momentum and filing scenarios"}[kind];
  return <header className="forecast-heading"><div><span>MODEL / 2026—2036</span><h3>{title}</h3></div><b>{zh?"实线观测 · 虚线预测":"SOLID OBSERVED · DASHED PROJECTED"}</b></header>;
}

export function LaunchDemandForecast({lang}:{lang:Lang}) {
  const zh=lang==="zh";
  const observed=forecast.launchHistorical.map(p=>({year:p.year,value:p.global}));
  const trend=[observed.at(-1)!,...forecast.launch.map(p=>({year:p.year,value:p.global}))];
  const demand=forecast.milestoneDemand.filter(p=>p.year>=2027&&p.year<=2034);
  const points=(field:"launchEquivalents"|"launchEquivalentsLow"|"launchEquivalentsHigh")=>demand.map(p=>({year:p.year,value:p[field]}));
  return <section className="forecast-section launch-forecast" aria-labelledby="launch-forecast-title"><Intro lang={lang} kind="launch"/><p id="launch-forecast-title" className="forecast-lead">{zh?"2026 为同期进度推算的全年值，不是年内累计。2027–2036 虚线延续 2023–2025 的增量斜率并逐年放缓；它不是已安排的发射清单。":"2026 is a same-period full-year nowcast, not year-to-date. The 2027–2036 dashed path extends the 2023–2025 annual increment with yearly damping; it is not a booked manifest."}</p>
    <div className="forecast-grid"><article><h4>{zh?"全球轨道发射尝试 · 次/年":"Global orbital launch attempts · per year"}</h4><ForecastChart title={zh?"全球发射观测与十年趋势预测":"Global launch history and ten-year trend"} series={[{label:zh?"全球尝试":"Global attempts",color:"#d9ff43",points:trend,forecastFrom:2025}]} start={2020} end={2036} max={750} unit={zh?"次":"launches"} labels={["2020","2025","2030","2036"]}/><p>{zh?"2026 全年估计":"2026 full-year estimate"} <strong>{forecast.launch[0].global}</strong> · 2031 <strong>{forecast.launch[5].global}</strong> · 2036 <strong>{forecast.launch.at(-1)!.global}</strong></p></article>
    <article><h4>{zh?"选定阶段目标的部署压力 · 发射当量/年":"Selected staged targets · launch equivalents/year"}</h4><ForecastChart title={zh?"选定星座阶段目标所需发射当量情景":"Launch equivalents under selected constellation stage scenarios"} series={[{label:zh?"80颗/次":"80 sats/launch",color:"#6a9eff",points:points("launchEquivalentsLow")},{label:zh?"40颗/次":"40 sats/launch",color:"#d9ff43",points:points("launchEquivalents")},{label:zh?"20颗/次":"20 sats/launch",color:"#ff6c53",points:points("launchEquivalentsHigh")}]} start={2027} end={2034} max={250} unit={zh?"发射当量":"launch equivalents"} labels={["2027","2029","2031","2034"]}/><p>{zh?"Amazon FCC、千帆商业目标、GW-A59 假设适用 RES35；仅把现有品牌库存乐观计入。40 颗/次只是换算基准，20–80 给出敏感性。与全球发射趋势重叠，不能相加；未计补网，也未纳入无法可靠分代的 Starlink Gen2。":"Amazon FCC, Qianfan commercial goals and GW-A59 under hypothetical RES35 applicability. Current brand inventory is optimistically credited. 40 satellites/flight is only a conversion assumption; 20–80 is sensitivity. These missions overlap the global trend and must not be added to it. Replacements and Starlink Gen2 (unresolved generation split) are excluded."}</p></article></div>
    <p className="forecast-foot">{zh?"依据：GCAT 历史与当年同期、FCC / 商业目标、ITU 申报。预测是情景，绝非已批准运力或有约束力的总需求。":"Basis: GCAT history and matched-period counts, FCC/commercial goals and ITU filings. Scenarios are not approved capacity or binding aggregate demand."} <a href={forecast.source.launch} target="_blank" rel="noreferrer">GCAT ↗</a> <a href={forecast.source.itu} target="_blank" rel="noreferrer">ITU ↗</a> <a href={forecast.source.fcc} target="_blank" rel="noreferrer">FCC ↗</a></p>
  </section>;
}

export function OrbitDemandForecast({lang}:{lang:Lang}) {
  const zh=lang==="zh";
  const snapshotDate=forecast.sourceCutoffs.inventory;
  const observed=forecast.inventoryHistorical.map(p=>({year:p.year,value:p.count}));
  const projected=[observed.at(-1)!,...forecast.orbitalInventory.slice(1).map(p=>({year:p.year,value:p.count}))];
  return <section className="forecast-section orbit-forecast"><Intro lang={lang} kind="orbit"/><p className="forecast-lead">{zh?`包含活跃与失效载荷的在轨对象库存。2026 为 ${snapshotDate} 快照；此后按最近净增量衰减外推，不把申报数量加进实际库存。`:`Payload objects still in orbit, active and inactive. The 2026 snapshot is dated ${snapshotDate}; later points extrapolate damped recent net additions. Filing quantities are never added to physical stock.`}</p><ForecastChart title={zh?"全球在轨载荷库存及十年外推":"Global orbital payload stock and ten-year extrapolation"} series={[{label:zh?"在轨载荷对象":"Orbital payload objects",color:"#d9ff43",points:[...observed,...projected.slice(1)],forecastFrom:2026}]} start={2016} end={2036} max={50000} unit={zh?"对象":"objects"} labels={["2016","2021","2026","2031","2036"]}/><p className="forecast-foot">{zh?"2026 当前库存":"2026 observed stock"} {fmt(observed.at(-1)!.value)} · 2031 {fmt(forecast.orbitalInventory[5].count)} · 2036 {fmt(forecast.orbitalInventory.at(-1)!.count)} · <a href={forecast.source.inventory} target="_blank" rel="noreferrer">GCAT ↗</a></p></section>;
}

export function FleetDemandForecast({lang}:{lang:Lang}) {
  const zh=lang==="zh";
  const colors=["#d9ff43","#6a9eff","#e7b663","#ff6c53","#ba93ed"];
  const series=forecast.fleets.map((f,i)=>({label:zh?f.nameZh:f.nameEn,color:colors[i],points:f.points.map(p=>({year:p.year,value:p.count})),forecastFrom:2026}));
  const ctc=forecast.ctcConditional.filter(p=>p.threshold!=null).map(p=>({year:p.year,value:p.threshold!}));
  return <section className="forecast-section fleet-forecast"><Intro lang={lang} kind="fleet"/><p className="forecast-lead">{zh?"五个已识别星座只按各自最近一年在轨净增速度外推，不把商业计划或申请数量当作必然交付。":"Five identified fleets extend their own recent net orbital growth; plans and filings are not treated as guaranteed deliveries."}</p><ForecastChart title={zh?"五个星座在轨数量外推":"Five constellation in-orbit projections"} series={series} start={2026} end={2036} max={30000} unit={zh?"颗":"satellites"} labels={["2026","2028","2030","2032","2034","2036"]}/>
    <div className="forecast-warning"><div><strong>{zh?"CTC-1：法理压力测试（不计入上图）":"CTC-1: regulatory stress test (excluded above)"}</strong><p>{zh?"官方公开摘要为 96,714 颗，最早启用期限 2032-12-29。若整个申报获保留、适用 RES35 且到期启动：2034 约 9,672、2037 约 48,357、2039 约 96,714 颗。适用性和实际投运均未确认；轨道范围跨越 LEO 之外，不能换算为发射次数。":"The public summary lists 96,714 satellites and an earliest BIU limit of 2032-12-29. If the full notice survives, RES35 applies, and operation begins at the limit: roughly 9,672 by 2034, 48,357 by 2037, and 96,714 by 2039. Applicability and deployment are unverified; its orbits extend beyond LEO, so no launch conversion is made."}</p></div><div className="forecast-warning-figures"><span>2034 <b>{fmt(ctc.find(p=>p.year===2034)!.value)}</b></span><span>2036 <b>{fmt(ctc.find(p=>p.year===2036)!.value)}</b></span></div></div><p className="forecast-foot"><a href={forecast.source.fleets} target="_blank" rel="noreferrer">GCAT ↗</a> <a href={forecast.source.itu} target="_blank" rel="noreferrer">ITU CTC-1 ↗</a> · {zh?"虚线均为模型估计，并非 ITU 已确认进度。":"Dashed lines are model estimates, not ITU-confirmed progress."}</p></section>;
}
