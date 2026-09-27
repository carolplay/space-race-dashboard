import model from "@/data/metrics/constellation-model.json";
export default function ConstellationTiers({lang}:{lang:'zh'|'en'}){
  const tr=(a:string,b:string)=>lang==='zh'?a:b;
  return <div className="constellation-tiers">
    <article><span>{tr('在轨实物 · 追踪样本','PHYSICAL INVENTORY · TRACKED SAMPLE')}</span><strong>{model.kpis.trackedInventory.value.toLocaleString()}</strong><p>{tr('五个星座，含非运行对象；不是全球活跃星座总量。','Five fleets, including inactive objects; not the global active constellation total.')} · {model.kpis.trackedInventory.asOf}</p></article>
    <article><span>{tr('国家授权 · 部分样本','NATIONAL AUTHORIZATION · PARTIAL SAMPLE')}</span><strong>{model.kpis.verifiedAuthorizationSample.value.toLocaleString()}</strong><p>{tr('仅 Starlink Gen2 + Amazon Gen1；不是确定性排产，也不包括所有获批星座。','Starlink Gen2 + Amazon Gen1 only; not committed production or all authorized fleets.')}</p></article>
    <article><span>{tr('远期申请 · 不汇总','LONG-TERM APPLICATIONS · NO TOTAL')}</span><strong>—</strong><p>{tr('CTC-1 / 2 各 96,714 颗已有官方摘要；商业归属和重叠未确认。FCC Gen3 十万颗另列，不算获批或在轨。','CTC-1 / 2 each list 96,714 in official summaries; operator/overlap unconfirmed. FCC Gen3’s 100,000 stays separate, neither granted nor in orbit.')}</p></article>
  </div>;
}
