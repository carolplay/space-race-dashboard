import watch from "@/data/research/priority-watchlist.json";
import comparison from "@/data/research/current/reference-reconciliation.json";
import fleets from "@/data/metrics/constellation-assets.json";
const descriptions:Record<string,{zh:string;en:string;learnZh:string;learnEn:string}>={
 "starlink-mission-control":{zh:"壳层与生命周期范式；公开数据集仅用于次级对照。高度推断的运行状态不等于商业服务，模拟路由不是真实遥测。",en:"Shell and lifecycle reference; public datasets support secondary checks only. Altitude-inferred status is not commercial service, and simulated routing is not telemetry.",learnZh:"星座整体 → 壳层 → 生命周期；观测与模拟分离",learnEn:"Fleet → shells → lifecycle; separate observation from simulation"},
 "orbital-radar":{zh:"多星座专题与中国星座展示范式。持续数据提取待许可；目前只复核已署名保存的记录，不每日抓取。",en:"Multi-fleet topics, including Chinese constellations. Ongoing extraction requires permission; only attributed saved records are reconciled, with no daily scraping.",learnZh:"多星座组织、部署节奏、专题导航",learnEn:"Multi-fleet organization, deployment cadence, topic navigation"}
};
export default function PriorityReferences({lang}:{lang:"zh"|"en"}){
 const zh=lang==="zh",tr=(a:string,b:string)=>zh?a:b,fmt=(n:number)=>n.toLocaleString(zh?"zh-CN":"en-US");
 const label=(status:string)=>({
  "count-agreement":tr("数量一致 · 非独立认证","Count agreement · not independent certification"),
  "coverage-difference-review":tr("覆盖差异待复核","Coverage difference · review"),
  "date-mismatch":tr("日期不同 · 不计算差值","Different dates · no delta"),
  "unknown-date":tr("日期未知","Unknown date"),
  "missing-count":tr("数量未知","Unknown count")
 }[status]??tr("待核验","Pending verification"));
 return <section className="priority-references" id="priority-references" aria-labelledby="priority-title">
  <header><div><span>{tr("重点学习目录 / 次级对照","PRIORITY WATCHLIST / SECONDARY CHECKS")}</span><h3 id="priority-title">{tr("向谁学习，如何对照","What we study—and how we reconcile")}</h3></div><b>{tr("非生产数据源","NOT PRODUCTION SOURCES")}</b></header>
  <p>{tr("这些项目是学习参照，不是看板事实的最终裁判。记录每项口径与日期：相同数字不证明完全可靠，不同数字也不自动代表错误。","These projects are learning references, not the final authority for dashboard facts. Definitions and dates are preserved: agreement is not proof of reliability, and a difference is not automatically an error.")}</p>
  <div className="priority-cards">{watch.projects.map(p=><article key={p.id}><span>P{p.priority} · {p.name}</span><h4>{zh?descriptions[p.id].learnZh:descriptions[p.id].learnEn}</h4><p>{zh?descriptions[p.id].zh:descriptions[p.id].en}</p><div><a href={p.url} target="_blank" rel="noreferrer">{tr("项目","Project")} ↗</a><a href={p.dataUrl} target="_blank" rel="noreferrer">{tr("数据 / 对照页","Dataset / reference page")} ↗</a><a href={p.licenseUrl} target="_blank" rel="noreferrer">{tr("许可边界","Usage terms")} ↗</a></div></article>)}</div>
  <details className="priority-comparison"><summary>{tr("展开已保存的数量对照","Saved count reconciliation")} · {comparison.summary.observations} {tr("条记录","records")}</summary><div className="priority-table-scroll"><table><thead><tr>{[tr("参考项目 / 星座","Project / fleet"),tr("参考数量 / 日期","Peer count / date"),tr("本地库存 / 日期","Local stock / date"),tr("差值与解释","Delta and interpretation")].map(t=><th key={t}>{t}</th>)}</tr></thead><tbody>{comparison.rows.map(r=><tr key={r.projectId+r.entityId}><td><a href={r.url} target="_blank" rel="noreferrer">{watch.projects.find(p=>p.id===r.projectId)?.name} ↗</a><strong>{zh?fleets.constellations.find(f=>f.id===r.entityId)?.nameZh:fleets.constellations.find(f=>f.id===r.entityId)?.nameEn}</strong></td><td>{r.value==null?"—":fmt(r.value)}<small>{r.asOf??"—"} · {tr("目录可追踪对象","tracked catalogue objects")}</small></td><td>{r.localValue==null?"—":fmt(r.localValue)}<small>{r.localAsOf??"—"} · {tr("物理在轨估算","physical in-orbit estimate")}</small></td><td><b>{r.deltaPeerMinusLocal==null?"—":(r.deltaPeerMinusLocal>0?"+":"")+fmt(r.deltaPeerMinusLocal)}</b><small>{label(r.status)}</small></td></tr>)}</tbody></table></div><p>{tr("差值 = 参考目录 − 本地库存，仅同日比较，未保证精确历元或覆盖一致。获取日不等于来源日；旧记录不被重算成新观测。HF 的最新日仅有四个壳层行；缺行不能猜成零。Orbital Radar 的保存记录不随本站日更自动刷新。","Delta = peer catalogue − local inventory, same-day only; exact epochs and coverage may differ. Retrieval date is not source date, and recomputation does not create a new observation. HF's latest day contains four shell rows; missing rows are not assumed zero. Saved Orbital Radar observations do not automatically refresh with our daily update.")}</p></details>
 </section>;
}
