import data from '@/data/metrics/constellation-assets.json';
export default function FilingBasics({lang}:{lang:'zh'|'en'}) {
 const zh=lang==='zh',tr=(a:string,b:string)=>zh?a:b,unknown=tr('未取得','Not acquired');
 return <>
  <div className="itu-heading"><h4>{tr('逐项申报：规模、轨道与频段','Filing by filing: scale, orbits and bands')}</h4><p>{tr('复核','Reviewed')} {data.reviewedAt}</p></div>
  <p className="constellation-method">{tr('申报数量不是在轨数量，也不是国家监管批准数量。同名网络的频率组、API、协调和通知版本可能重叠，不可直接相加。频率范围为摘要包络，不表示连续占用；RES35 部署数量为报告时点，不是当前库存。','Filed counts are neither orbital inventory nor national authorizations. Frequency groups and notice versions can overlap: do not add rows. Frequency envelopes do not imply continuous occupancy. RES35 deployment counts refer to the report date, not current inventory.')}</p>
  <div className="itu-procedure-scroll"><table className="itu-procedure filing-basics">
   <thead><tr>{[tr('商业星座 / 网络与通知版本','Fleet / network and notice'),tr('申报 / 通知数量','Filed / notified count'),tr('轨道参数','Orbit parameters'),tr('频率范围 · MHz','Frequency ranges · MHz'),tr('原始报告 / 数据范围','Source report / scope')].map(s=><th key={s}>{s}</th>)}</tr></thead>
   <tbody>{data.filings.map(f=>{const b=f.basic,c=data.constellations.find(c=>c.id===f.constellationId);return <tr key={f.id}>
    <th><a href={b.sourceUrl} target="_blank" rel="noreferrer">{c?(zh?c.nameZh:c.nameEn):tr('商业主体未核实','Commercial operator unverified')}{f.candidate?' ?':''}<br/>{f.network} ↗</a><small>{f.administration} · {b.noticeIds.join(' / ')||unknown}</small><small>{tr('版本收件','Version receipt')}: {b.noticeReceiptDate??unknown}</small></th>
    <td>{b.notifiedCount?.toLocaleString('en-US')??unknown}{b.countRange&&<small>{tr('公开摘要范围','Public summary range')}: {b.countRange.map(n=>n.toLocaleString('en-US')).join('–')}</small>}<small>{b.reportCount===null?tr('部署报告数量未取得','Deployment report count unavailable'):`${tr('报告部署','Reported deployed')}: ${b.reportCount.toLocaleString('en-US')} · ${b.reportDate}`}</small></td>
    <td>{b.perigeeKm===null?unknown:`${b.perigeeKm.toLocaleString('en-US')}–${b.apogeeKm?.toLocaleString('en-US')} km`}<small>{b.planeCount===null?tr('轨道面未取得','Planes unavailable'):`${b.planeCount} ${tr('轨道面','planes')}`}{b.inclinationRange?` · ${b.inclinationRange.join('–')}°`:''}</small></td>
    <td>{b.frequencySummary??unknown}</td><td><p>{zh?b.noteZh:b.noteEn}</p><a href={b.sourceUrl} target="_blank" rel="noreferrer">{tr('原始依据','Primary evidence')} ↗</a><small>{tr('依据时点','Evidence date')}: {b.asOf}</small></td>
   </tr>})}</tbody>
  </table></div>
  <div className="itu-heading"><h4>{tr('十万级申请：单独标识监管体系','Six-figure applications: regulatory systems kept separate')}</h4></div>
  <div className="fleet-stage-list">{data.largeApplications.map(a=><article key={a.id}><h4>{zh?a.nameZh:a.nameEn}</h4><strong>{a.count.toLocaleString('en-US')}</strong><p>{a.authority} · {a.receivedAt} · {a.fileNumber}</p><p>{a.altitudeSummary} · {a.inclinationSummary} · {a.bands}</p><p>{zh?a.statusZh:a.statusEn}</p><a href={a.sourceUrl} target="_blank" rel="noreferrer">{tr('官方申请公告','Official application notice')} ↗</a></article>)}</div>
 </>;
}
