import data from '@/data/metrics/constellation-assets.json';
import goals from '@/data/editorial/constellation-stages.json';
const colors=['#d9ff43','#6a9eff','#e7b663','#ff6c53','#ba93ed'];
const epoch=(s:string)=>Date.parse(s+'T00:00:00Z');
const x=(s:string)=>65+(epoch(s)-epoch('2018-01-01'))/(epoch('2032-01-01')-epoch('2018-01-01'))*790;
export default function ConstellationGrowth({lang}:{lang:'zh'|'en'}){
 const zh=lang==='zh',tr=(a:string,b:string)=>zh?a:b;
 return <>
 <div className="fleet-chart-panel"><div className="fleet-legend">{data.constellations.map((c,i)=><div key={c.id}><i style={{background:colors[i]}}/><b>{zh?c.nameZh:c.nameEn}</b><strong>{c.inOrbit.toLocaleString()}</strong><span>{tr('在轨估算','Estimated in orbit')} · {c.asOf}</span></div>)}</div>
 <div className="fleet-dual-charts">{(['linear','log'] as const).map(scale=>{
 const y=(n:number)=>300-(scale==='log'?Math.log10(n+1)/Math.log10(20001):n/20000)*270;
 const ticks=scale==='log'?[0,10,100,1000,10000,20000]:[0,5000,10000,15000,20000];
 return <div key={scale}><h4>{scale==='linear'?tr('线性轴 · 绝对规模与增量','Linear · absolute scale and additions'):tr('对数轴 · 同时看清大小星座','Logarithmic · large and small fleets')}</h4><div className="fleet-chart-scroll"><svg viewBox="0 0 900 350" role="img" aria-label={scale==='linear'?tr('在轨数量线性轴图及阶段目标','Linear inventory chart with staged targets'):tr('在轨数量对数轴图及阶段目标','Log inventory chart with staged targets')}>
 <rect x={x(data.inventoryAsOf)} y="20" width={855-x(data.inventoryAsOf)} height="280" fill="#333842"/><text x={x(data.inventoryAsOf)+10} y="18" fill="#c0c3ca" fontSize="14">{tr('未来目标区 · 无库存预测','Future targets · no inventory forecast')}</text>
 {ticks.map(n=><g key={n}><line x1="65" x2="855" y1={y(n)} y2={y(n)} stroke="#454954"/><text x="55" y={y(n)+5} textAnchor="end" fill="#c0c3ca" fontSize="14">{n.toLocaleString()}</text></g>)}
 {[2018,2020,2022,2024,2026,2028,2030,2032].map(n=><text key={n} x={x(n+'-01-01')} y="330" textAnchor="middle" fill="#c0c3ca" fontSize="14">{n}</text>)}
 {goals.series.map(g=>{const i=data.constellations.findIndex(c=>c.id===g.entityId);let start=g.announcedAt;const points:string[]=[];g.stages.forEach(s=>{points.push(`${x(start)},${y(s.count)}`,`${x(s.date)},${y(s.count)}`);start=s.date;});return <g key={g.entityId}><polyline points={points.join(' ')} fill="none" stroke={colors[i]} strokeDasharray="8 7" strokeWidth="2" opacity=".65"/>{g.stages.map(s=><circle key={s.date} cx={x(s.date)} cy={y(s.count)} r="4" fill="#20232a" stroke={colors[i]}><title>{data.constellations[i].nameEn} · {s.date} · {s.count.toLocaleString()} · {zh?s.labelZh:s.labelEn} · {g.authority}</title></circle>)}</g>})}
 {data.constellations.map((c,i)=><g key={c.id}><polyline points={c.history.slice(0,-1).map(p=>`${x(p.date)},${y(p.inOrbit)}`).join(' ')} fill="none" stroke={colors[i]} strokeWidth="2.5"/><line x1={x(c.history.at(-2)!.date)} y1={y(c.history.at(-2)!.inOrbit)} x2={x(c.asOf)} y2={y(c.inOrbit)} stroke={colors[i]} strokeWidth="2.5" strokeDasharray="4 3"/><circle cx={x(c.asOf)} cy={y(c.inOrbit)} r="4" fill={colors[i]}><title>{zh?c.nameZh:c.nameEn} · {c.asOf}: {c.inOrbit}</title></circle></g>)}
 </svg></div></div>;})}</div></div>
 <p className="constellation-method">{tr('两图使用相同数据和时间范围。实线为库存，末段短虚线为来源切换；长虚线为阶段目标阶梯，空心点为目标截止日期，不是库存预测。对数轴采用 log10(数量 + 1)，以容纳零值。FCC Gen2 / Gen1 的目标仅对应各自代际，不代表整个品牌的履约完成率。','Both charts use the same data and dates. Solid: inventory; short final dash: source transition; long dash: staged target schedule; hollow points: target deadlines, not inventory forecasts. Log scale uses log10(count + 1) to include zero. FCC Gen2 / Gen1 targets apply only to those generations, not whole-brand compliance.')}</p>
 <div className="fleet-stage-list">{goals.series.map(g=><article key={g.entityId}><h4>{zh?data.constellations.find(c=>c.id===g.entityId)?.nameZh:data.constellations.find(c=>c.id===g.entityId)?.nameEn} · {g.authority==='FCC'?'FCC':tr('商业计划','Commercial plan')}</h4><p>{zh?g.scopeZh:g.scopeEn}</p>{g.stages.map(s=><a key={s.date} href={g.sourceUrl} target="_blank" rel="noreferrer"><time>{'datePrecision' in s&&s.datePrecision==='year'?s.date.slice(0,4):s.date}</time><span>{zh?s.labelZh:s.labelEn} · {'approximate' in s&&s.approximate?'≈':''}{s.count.toLocaleString()} ↗</span></a>)}</article>)}</div>
 <p className="constellation-method">{goals.undated.map(g=>`${zh?data.constellations.find(c=>c.id===g.entityId)?.nameZh:data.constellations.find(c=>c.id===g.entityId)?.nameEn}：${zh?g.reasonZh:g.reasonEn}`).join('；')}{tr('。未指定日期的远期规模保留在下方资料卡，不贯穿整段历史。','. Undated references remain in the cards below, not across the whole historical chart.')}</p>
 </>;
}
