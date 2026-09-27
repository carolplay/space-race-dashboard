import data from '@/data/metrics/launch-infrastructure.json';
export default function MarineLaunchBases({lang}:{lang:'zh'|'en'}){
 const zh=lang==='zh',tr=(a:string,b:string)=>zh?a:b;
 const sea=data.sites.find(s=>s.name==='Haiyang Oriental Spaceport');
 if(!sea)return null;
 return <div className="marine-bases"><div className="section-heading"><div><p className="section-index">02B — {tr('海洋发射','MARITIME LAUNCH')}</p><h3>{tr('海阳东方航天港与海上发射位置','Haiyang Oriental Spaceport and offshore launch locations')}</h3></div><p>{tr('按 LL2 基地归属汇总，不把海域位置当固定陆地台位，也不把坐标当作每次任务的实际发射点。','Aggregated by LL2 site association. Offshore locations are not fixed land pads, and catalog coordinates are not mission-specific launch points.')}</p></div><div className="marine-summary"><strong>{sea.attempts}<small>{tr(' 次轨道发射尝试',' orbital attempts')}</small></strong><span>{data.coverage.from} — {data.coverage.to}</span><p>{sea.rocketFamilies.join(' · ')}</p></div><div className="marine-pad-grid">{data.pads.filter(p=>p.siteId===sea.id).map(p=><article key={p.id}><h4>{p.name}</h4><strong>{p.attempts}<small>{tr(' 次尝试',' attempts')}</small></strong><p>{tr('最近记录','Latest record')} · {p.lastLaunch}</p><p>{p.rocketFamilies.join(' · ')}</p></article>)}</div></div>;
}
