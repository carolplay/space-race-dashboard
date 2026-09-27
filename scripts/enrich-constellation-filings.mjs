import {readFileSync,writeFileSync} from 'node:fs';
const read=path=>JSON.parse(readFileSync(new URL('../'+path,import.meta.url),'utf8'));
const data=read('data/metrics/constellation-assets.json');
const review=read('data/research/current/filing-enrichment.json');
const progress=read('data/research/current/filing-deployment-progress.json');
for(const a of review.additionalFilings??[]){
 review.overrides[a.id]=a;
 if(!data.filings.some(f=>f.id===a.id))data.filings.push({id:a.id,constellationId:a.constellationId,network:a.network,administration:a.administration,candidate:a.candidate,sourceUrl:a.sourceUrl,asOf:review.officialDataAsOf,notificationIds:a.noticeIds,milestones:[],events:[],procedure:{initialReceiptDate:null,initialPublicationDate:null,mifrRecordedDate:null,regulatoryLimitDate:null,anchorType:null,sourceUrl:a.sourceUrl},noteZh:a.noteZh,noteEn:a.noteEn});
}
for(const f of data.filings){
  const patch=review.overrides[f.id]??{},g=progress.groups.find(g=>g.filingId===f.id),r=g?.latestProcessedReport;
  for(const key of ['initialReceiptDate','initialPublicationDate','mifrRecordedDate','regulatoryLimitDate'])if(patch[key])f.procedure[key]=patch[key];
  f.procedure.initialReference=patch.initialReference??null;
  f.procedure.initialSourceUrl=patch.initialSourceUrl??patch.sourceUrl??f.procedure.sourceUrl;
  if(patch.regulatoryLimitDate)f.procedure.anchorType='seven-year-limit';
  if(patch.sourceUrl){f.sourceUrl=patch.sourceUrl;f.procedure.sourceUrl=patch.sourceUrl;}
  if(patch.noticeIds)f.notificationIds=patch.noticeIds;
  const planes=r?.orbitalPlanes??[];
  const values=i=>planes.map(p=>p[i]).filter(Number.isFinite);
  const range=i=>values(i).length?[Math.min(...values(i)),Math.max(...values(i))]:null;
  const bands=r?.frequencyBands??[];
  f.basic={
    notifiedCount:patch.notifiedCount??g?.statusTable.notified??null,
    countRange:patch.countRange??null,
    countScope:patch.sourceUrl?'public-notice-summary':r?'RES35 effective/report notification':'RES35-status-table',
    countSourceUrl:patch.sourceUrl??r?.sourceUrl??f.sourceUrl,
    sourceUrl:patch.sourceUrl??r?.sourceUrl??f.sourceUrl,
    asOf:patch.sourceUrl?review.officialDataAsOf:r?.publicationDate??g?.statusTable.asOf??f.asOf,
    noticeIds:patch.noticeIds??f.notificationIds,
    noticeReceiptDate:patch.noticeReceiptDate??null,
    frequencySummary:patch.frequencySummary??(bands.length?bands.map(b=>`${b.minMHz}–${b.maxMHz} MHz`).join('; '):null),
    planeCount:new Set(planes.map(p=>`${p[0]}:${p[1]}`)).size||null,
    perigeeKm:patch.perigeeKm??range(4)?.[0]??null,
    apogeeKm:patch.apogeeKm??range(3)?.[1]??null,
    inclinationRange:range(2),
    biuConfirmed:patch.biuConfirmed??null,inMifr:patch.inMifr??null,
    reportCount:r?.deployed??null,reportDate:r?.publicationDate??null,
    noteZh:patch.noteZh??'数量对应该通知/报告版本，不是品牌总规划；频段和轨道参数为已取得文件范围，不能跨行相加。',
    noteEn:patch.noteEn??'Count belongs to this notice/report version, not the brand plan. Bands/orbits cover acquired documents; do not sum rows.'
  };
  if(patch.noteZh){f.noteZh=patch.noteZh;f.noteEn=patch.noteEn;}
  const add=(date,kind,labelZh,labelEn,url)=>{if(date&&!f.events.some(e=>e.date===date&&e.labelEn===labelEn))f.events.push({date,kind,labelZh,labelEn,sourceUrl:url});};
  if(patch.initialReceiptDate)add(patch.initialReceiptDate,'filing','网络最早申报收件','Earliest network filing',f.procedure.initialSourceUrl);
  if(patch.initialPublicationDate)add(patch.initialPublicationDate,'publication','网络初始公布','Initial network publication',f.procedure.initialSourceUrl);
  if(patch.mifrRecordedDate)add(patch.mifrRecordedDate,'recording','PART II-S 登记公布','PART II-S recording publication',f.procedure.initialSourceUrl);
  if(patch.regulatoryLimitDate){f.events=f.events.filter(e=>!(e.kind==='anchor'&&e.date===patch.regulatoryLimitDate));add(patch.regulatoryLimitDate,'anchor','官方最早启用期限','Official earliest BIU limit',f.sourceUrl);}
  f.events.sort((a,b)=>a.date.localeCompare(b.date));
}
data.largeApplications=review.largeApplications;
data.reviewedAt=review.asOf;
writeFileSync(new URL('../data/metrics/constellation-assets.json',import.meta.url),JSON.stringify(data,null,2)+'\n');
console.log(`Enriched ${data.filings.length} filing groups without changing inventory or compliance counts.`);
