import data from "@/data/metrics/constellation-assets.json";
import ConstellationTiers from "./ConstellationTiers";
import ConstellationGrowth from "./ConstellationGrowth";
import ConstellationFCC from "./ConstellationFCC";
import ITUProcedureDates from "./ITUProcedureDates";
type Lang = "zh" | "en";
const colors = ["#d9ff43", "#6a9eff", "#e7b663", "#ff6c53", "#ba93ed"];
const epoch=(d:string)=>Date.parse(d+"T00:00:00Z");
export default function ConstellationAssets({lang}:{lang:Lang}){
  const zh=lang==='zh', tr=(a:string,b:string)=>zh?a:b;
  const tx=(d:string)=>(epoch(d)-epoch('2016-01-01'))/(epoch('2038-01-01')-epoch('2016-01-01'))*100;
  return <section id="constellation-assets" className="constellation-assets" aria-labelledby="constellation-title">
    <div className="constellation-heading"><div><span className="constellation-eyebrow">{tr('03C / 星座资产与申报','03C / FLEETS & FILINGS')}</span><h3 id="constellation-title">{tr('在轨规模，正在如何增长','How orbital fleets are growing')}</h3></div><p>{tr('在轨数量估算 · 线性 / 对数双视图','Estimated orbital counts · linear / log views')}<br/>{data.inventoryAsOf}</p></div>
    <ConstellationTiers lang={lang}/>
    <ConstellationGrowth lang={lang}/>
    <div className="fleet-scope-grid">{data.constellations.map((c,i)=><article key={c.id} style={{borderTopColor:colors[i]}}><h4>{zh?c.nameZh:c.nameEn}</h4><p>{c.operator}</p><strong>{c.planValue}</strong><p>{zh?c.planZh:c.planEn}</p><a href={c.planSourceUrl} target="_blank" rel="noreferrer">{tr('目标来源','Target source')} ↗</a><a href={c.sourceUrl} target="_blank" rel="noreferrer">GCAT · {c.asOf} ↗</a></article>)}</div>
    <p className="constellation-method">{zh?data.historyMethodZh:data.historyMethodEn} {tr('目标性质分别为授权、通知或商业计划，不能相加，也不作为 ITU 完成率分母。其他运营者和通信/导航网络在下方保留。','Targets represent authorization, notification or commercial plans: not additive, not ITU completion denominators. Other operators and communications/navigation networks remain below.')}</p>
    <ConstellationFCC lang={lang}/>
    <div className="itu-heading"><h4>{tr('ITU：申报程序、BIU 与 RES35 时间线','ITU: filing procedure, BIU and RES35 timeline')}</h4><p>2016–2038 · {data.ituAsOf}</p></div>
    <p className="itu-explainer">{tr('有效收件 → API / CR 公布 → 通知审查 / MIFR 登记，不能合并为一个“申请通过日”。七年期限通常从具体频率组的有效收件日起算；RES35 的 2 / 5 / 7 年阶段以监管期终点（或过渡锚点）起算，而非公布或 BIU 日。BIU 是独立的频率启用事件；报告收件不等于实际达成。','Effective receipt → API / CR publication → notification examination / MIFR recording are not a single approval date. The seven-year limit normally follows effective receipt per frequency group. RES35 stages follow the regulatory limit or transitional anchor, not publication or BIU. BIU is a separate frequency-use event; report receipt is not achievement.')}</p>
    <ITUProcedureDates lang={lang}/>
    <div className="filing-history-scroll" tabIndex={0}><div className="filing-history">
      <div className="filing-axis"><span>{tr('商业名称 → 申报网络','COMMERCIAL NAME → NETWORK')}</span><div>{[2016,2020,2024,2028,2032,2036,2038].map(n=><span key={n} style={{left:tx(n+'-01-01')+'%'}}>{n}</span>)}</div></div>
      {data.filings.map(f=>{const brand=data.constellations.find(c=>c.id===f.constellationId);return <div className="filing-history-row" key={f.id}><div className="filing-identity"><h5>{brand?(zh?brand.nameZh:brand.nameEn):tr('未归属商业星座','Unassigned commercial fleet')}{f.candidate?' ?':''}</h5><p>{brand?.operator??tr('主体待核验','Operator unverified')}</p><a href={f.sourceUrl} target="_blank" rel="noreferrer">{f.network} · {f.administration} ↗</a><small>{f.notificationIds.join(' / ')||tr('版本身份未取得','Version identity unavailable')}</small></div><div className="filing-event-lanes">{f.events.map((e,i)=><a key={e.date+e.labelEn+i} className={'filing-event event-'+e.kind} href={e.sourceUrl} target="_blank" rel="noreferrer" style={{left:tx(e.date)+'%',top:16+i*49}}><b>{zh?e.labelZh:e.labelEn}</b><span>{e.date}</span><i/></a>)}<div className="filing-undated" style={{marginTop:Math.max(70,f.events.length*49+16)}}>{f.milestones.filter(m=>!m.date&&m.status).map(m=>`${m.stage}: ${m.status==='Met'?tr('已达标 · 日期待核验','met · date unverified'):m.status==='As Received'?tr('已收件 · 日期待核验','received · date unverified'):m.status}`).join(' / ')|| (zh?f.noteZh:f.noteEn)||tr('暂无已达成日期','No achievement dates available')}</div></div></div>})}
    </div></div>
    <p className="constellation-method">{tr('CTC-1 / CTC-2 已收录 2025 年申报与 2026 年公布日期；十万级数量及商业主体尚待原始技术通知核验，不归入国网或千帆。Starlink Gen3 十万级申请线索指向 2026 年，未作为已批准目标绘入本图。未公开的完成日期保持未知。','CTC-1 / CTC-2 include 2025 receipt and 2026 publication dates. Six-figure counts and operators await technical notices; neither is allocated to Guowang/Qianfan. The six-figure Starlink Gen3 application lead points to 2026 and is not plotted as an approved target. Undisclosed achievement dates remain unknown.')}</p>
  </section>;
}
