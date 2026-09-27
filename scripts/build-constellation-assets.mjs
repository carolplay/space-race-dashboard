import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

// Pure builder: emit JSON to stdout, review before saving it as a dashboard snapshot.
// node scripts/build-constellation-assets.mjs /path/to/satcat.tsv
const catalog = readFileSync(process.argv[2], 'utf8');
const registry = JSON.parse(readFileSync(new URL('../data/research/current/constellation-registry.json', import.meta.url)));
const itu = JSON.parse(readFileSync(new URL('../data/research/current/itu-milestones.json', import.meta.url)));
const lines = catalog.split(/\r?\n/), header = lines[0].slice(1).split('\t');
const rows = lines.filter(l => l && !l.startsWith('#')).map(l => Object.fromEntries(l.split('\t').map((v, i) => [header[i], v.trim()])));
const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function date(value) {
  const m = value?.match(/^(\d{4})\s+(\w{3})(?:\s+(\d{1,2}))?/);
  if (!m || !months.includes(m[2])) return null;
  return Date.UTC(Number(m[1]), months.indexOf(m[2]), Number(m[3] ?? 1));
}
const reentered = new Set(['R', 'AR', 'L', 'AL']);
const classifiers = {
  starlink: r => /^Starlink[ -]/.test(r.Name) || /^Tintin [AB]$/.test(r.Name),
  'amazon-leo': r => /^Kuiper(?:-|Sat)/.test(r.Name),
  oneweb: r => /^OneWeb SL/.test(r.Name),
  guowang: r => /^WHDW /.test(r.Name),
  qianfan: r => /^Qianfan Xingzuo /.test(r.Name),
};
const first = Date.UTC(2018,0,1), lastMonth = Date.UTC(2026,8,1);
const periods = [];
for (let t=first; t<=lastMonth;) {
  const d=new Date(t), y=d.getUTCFullYear(), m=d.getUTCMonth();
  const end=Date.UTC(y,m+1,1)-1;
  // Latest point is the independently collected constellation-statistics snapshot.
  if (end < Date.UTC(2026,8,24)) periods.push({date:new Date(end).toISOString().slice(0,10), end});
  t=Date.UTC(y,m+1,1);
}
const definitions = {
  starlink: {nameZh:'星链',nameEn:'Starlink',region:'us',operator:'SpaceX',planZh:'Gen2 获批 15,000 颗；非全星链总目标',planEn:'15,000 authorized for Gen2; not the full Starlink target',planValue:'15,000',planLabelZh:'Gen2 授权规模',planLabelEn:'Gen2 authorization',sourceId:'starlink-fcc'},
  'amazon-leo': {nameZh:'Amazon Leo',nameEn:'Amazon Leo',region:'us',operator:'Amazon · Kuiper',planZh:'Gen1 3,232 颗；Gen2 与极轨计划分开记录',planEn:'3,232 for Gen1; Gen2 and Polar tracked separately',planValue:'3,232',planLabelZh:'Gen1 授权规模',planLabelEn:'Gen1 authorization',sourceId:'amazon-fcc'},
  oneweb: {nameZh:'OneWeb',nameEn:'OneWeb',region:'other',operator:'Eutelsat · UK / FR',planZh:'L5 通知规模 2,692 颗；不等于当前运营规模',planEn:'2,692 notified under L5; not the operating fleet target',planValue:'2,692',planLabelZh:'L5 通知规模',planLabelEn:'L5 notified scale',sourceId:'itu-res35'},
  guowang: {nameZh:'国网',nameEn:'Guowang',region:'cn',operator:'China SatNet',planZh:'公开设计约 12,992 颗；现行申报规模待核验',planEn:'Published design ~12,992; current filing scale unverified',planValue:'~12,992',planLabelZh:'公开设计规模',planLabelEn:'Published design',sourceId:'mega-screen'},
  qianfan: {nameZh:'千帆',nameEn:'Qianfan',region:'cn',operator:'SpaceSail · SSST',planZh:'一期 1,296 颗 / 2027；终态超过 15,000 颗',planEn:'Phase 1: 1,296 by 2027; terminal plan >15,000',planValue:'>15,000',planLabelZh:'远期计划规模',planLabelEn:'Long-term plan',sourceId:'qianfan-plan'},
};
const constellations = registry.constellations.map(c => {
  const selected=rows.filter(r=>r.Primary==='Earth' && r.Type.startsWith('P') && classifiers[c.id](r));
  const history=periods.map(p=>({date:p.date,inOrbit:selected.filter(r=>{const start=date(r.LDate),exit=reentered.has(r.Status)?date(r.DDate):null;return start!==null&&start<=p.end&&(exit===null||exit>p.end);}).length,kind:'catalog-reconstruction'}));
  history.push({date:c.orbitSnapshot.dataAsOf,inOrbit:c.orbitSnapshot.inOrbit,kind:'constellation-snapshot'});
  const definition=definitions[c.id];
  return {id:c.id,...definition,inOrbit:c.orbitSnapshot.inOrbit,asOf:c.orbitSnapshot.dataAsOf,sourceUrl:registry.sources.find(s=>s.id===c.orbitSnapshot.sourceId).url,planSourceUrl:registry.sources.find(s=>s.id===definition.sourceId).url,history,catalogPayloadRows:selected.length,scopeZh:c.id==='guowang'?'正式低轨部署子组，不含早期试验星':c.id==='qianfan'?'千帆星座子组，不含 DTC / EUHT 试验星':'含升轨、漂移与非运行卫星，不含模拟载荷',scopeEn:c.id==='guowang'?'Main low-orbit deployment subgroup; excludes early tests':c.id==='qianfan'?'Main Qianfan subgroup; excludes DTC / EUHT tests':'Includes raising, drifting and inactive spacecraft; excludes simulators'};
});
const filings=itu.filings.map(f=>({id:f.id,constellationId:f.constellationId??f.candidateConstellationId,network:f.displayName,administration:f.administration,candidate:f.brandMapping.status!=='verified',sourceUrl:itu.sources.find(s=>s.id===f.sourceId).url,asOf:f.statusAsOf,milestones:f.milestones.map(m=>({stage:m.stage,date:/^\d{2}\.\d{2}\.\d{4}$/.test(m.rawValue??'')?m.rawValue.split('.').reverse().join('-'):null,status:m.officialStatus??null})),noteZh:f.id.startsWith('chn-gw')?'未取得官方 RES35 节点':f.id==='chn-sailspace-1'?'千帆关联候选，尚待直接确认':null,noteEn:f.id.startsWith('chn-gw')?'Official RES35 dates unavailable':f.id==='chn-sailspace-1'?'Candidate Qianfan association, not confirmed':null}));
console.log(JSON.stringify({version:'1.0',collectedAt:registry.collectedAt,inventoryAsOf:'2026-09-24',ituAsOf:'2026-09-15',source:{name:'GCAT',url:'https://planet4589.org/space/gcat/tsv/cat/satcat.tsv',sha256:createHash('sha256').update(catalog).digest('hex'),updatedRaw:catalog.match(/^# Updated (.+)$/m)?.[1]},historyMethodZh:'月末在轨估算由主目录的入轨载荷及再入日期重建；最后一点来自星座统计快照。主目录可能滞后，末段虚线表示来源切换。不是运行或合规数量。',historyMethodEn:'Month-end estimates reconstructed from main-catalog orbital payloads and reentry dates. Final point uses constellation statistics; main catalog may lag, so the source transition is dashed. Not operational or compliance counts.',constellations,filings},null,2));
