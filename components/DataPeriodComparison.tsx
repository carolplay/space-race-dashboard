import history from '@/data/metrics/historical-series.json';

export default function DataPeriodComparison({lang}:{lang:'zh'|'en'}) {
  const zh=lang==='zh',tr=(a:string,b:string)=>zh?a:b;
  const [previous,current]=history.samePeriod;
  const regions=['global','us','cn','other'] as const;
  const labels=zh?{global:'全球',us:'美国',cn:'中国',other:'其他'}:{global:'Global',us:'United States',cn:'China',other:'Other'};
  const metrics=[
    {key:'attempts',zh:'轨道发射尝试',en:'Orbital launch attempts',divisor:1},
    {key:'success',zh:'成功入轨任务',en:'Successful orbital missions',divisor:1},
    {key:'additions',zh:'新增载荷对象',en:'New payload objects',divisor:1},
    {key:'knownDeliveredMassKg',zh:'已知交付质量 · 吨',en:'Known delivered mass · tonnes',divisor:1000},
  ] as const;
  const format=(n:number)=>n.toLocaleString(zh?'zh-CN':'en-US',{maximumFractionDigits:0});
  return <section className="period-comparison" aria-labelledby="period-comparison-title">
    <header><h3 id="period-comparison-title">{tr('2025 / 2026 同期比较','2025 / 2026 same-period comparison')}</h3><p>{tr('两年均从 1 月 1 日统计至','Both years from January 1 through')} {current.payloadCutoff.slice(5)} · GCAT</p></header>
    <p>{tr('年度图的 2025 点是全年，2026 点是年内累计；虚线末段不能作为全年同比。下方才是相同时间长度的比较，不作全年外推。','Annual charts show full-year 2025 versus partial 2026; the dashed final segment is not an annual year-over-year comparison. Below are matched periods, without annualization.')}</p>
    <div className="period-comparison-grid">{metrics.map(m=><article key={m.key}><h4>{zh?m.zh:m.en}</h4><div className="period-row period-row-head"><span>{tr('范围','Scope')}</span><span>{previous.year}</span><span>{current.year}</span><span>{tr('同期变化','Change')}</span></div>{regions.map(r=>{const before=previous[m.key][r],now=current[m.key][r],change=before?(now-before)/before*100:null;return <div className="period-row" key={r}><span>{labels[r]}</span><b>{format(before/m.divisor)}</b><strong>{format(now/m.divisor)}</strong><small>{change===null?'—':`${change>0?'+':''}${change.toFixed(1)}%`}</small></div>;})}</article>)}</div>
    <footer>{tr('发射按 GCAT 运载国归属，LL2 当前任务卡按运营商国归属；因此中美/其他分项可能不同，不混接曲线。历史为标准目录＋高编号目录，仍不包含辅助/临时目录。同期载荷统计排除日期精度不足的对象：','Launches use GCAT vehicle-state grouping; LL2 current mission cards use provider nationality, so regional splits may differ and are not spliced. History includes standard and extended catalogs, not auxiliary/temporary catalogs. Payloads excluded from same-period counts for imprecise dates:')} {previous.year}: {previous.excludedImprecisePayloadDates} · {current.year}: {current.excludedImprecisePayloadDates}.</footer>
  </section>;
}
