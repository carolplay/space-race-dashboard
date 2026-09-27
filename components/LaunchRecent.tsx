import { sourceLabel } from "@/lib/dashboard-language";
import data from '@/data/metrics/launch-manifest.json';
export default function LaunchRecent({lang}:{lang:'zh'|'en'}){
 const zh=lang==='zh',tr=(a:string,b:string)=>zh?a:b;
 const status=(s:string)=>zh?({'Launch Successful':'发射成功','Launch Failure':'发射失败','Partial Failure':'部分失败','In Flight':'飞行中'} as Record<string,string>)[s]??s:s;
 return <div className="recent-launches"><header><h3>{tr('最近已执行任务','Recently executed missions')}</h3><span>LL2 · {data.asOf} · UTC</span></header><div>{data.recent.slice(0,6).map(m=><article key={m.id}><time>{m.net.replace('T',' ').slice(0,16)} UTC</time><span>{status(m.status)}</span><h4><a href={m.infoUrl??m.sourceUrl} target="_blank" rel="noreferrer">{sourceLabel(m.name,lang)} ↗</a></h4><p>{sourceLabel(m.provider,lang)} · {sourceLabel(m.rocket,lang)}</p><p>{sourceLabel(m.pad,lang)} · {sourceLabel(m.location,lang)}</p><div><a href={m.sourceUrl} target="_blank" rel="noreferrer">{tr('任务记录','Mission record')} ↗</a>{m.webcastUrl?<a href={m.webcastUrl} target="_blank" rel="noreferrer">{tr('直播 / 回放','Webcast / replay')} ↗</a>:null}</div></article>)}</div></div>;
}
