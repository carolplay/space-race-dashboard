import {readFileSync,writeFileSync} from 'node:fs';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const d=read('data/metrics/constellation-assets.json'), itu=read('data/research/current/itu-milestones.json'), reports=read('data/research/current/filing-deployment-progress.json');
d.filings=d.filings.filter(f=>!['ctc-1','ctc-2'].includes(f.id));
for(const f of d.filings){
  const raw=itu.filings.find(r=>r.id===f.id), report=reports.groups.find(g=>g.filingId===f.id)?.latestProcessedReport;
  const events=[];
  const add=(date,kind,labelZh,labelEn,url=f.sourceUrl)=>{if(date)events.push({date,kind,labelZh,labelEn,sourceUrl:url});};
  add(raw.initialReceiptDate,'filing','申报收件','Filing received');
  for(const r of [raw.latestIndexedRecord,...(raw.additionalIndexedRecords??[])].filter(Boolean)){
    add(r.receivedAt,'filing',r.reference+' 收件',r.reference+' received');
    add(r.publishedAt,'publication',r.reference+' 公布',r.reference+' published');
  }
  for(const b of raw.biuEvents??[])add(b.biuDate,'biu','BIU 频率启用','BIU',itu.sources.find(s=>s.id===b.sourceId)?.url??report?.sourceUrl??f.sourceUrl);
  if(report){
    add(report.deploymentAsOf,'achieved',report.milestone+' 部署日期',report.milestone+' deployment',report.sourceUrl);
    add(report.receivedAt,'report',report.milestone+' 报告收件',report.milestone+' report received',report.sourceUrl);
    add(report.publicationDate,'publication',report.milestone+' 报告公布',report.milestone+' report published',report.sourceUrl);
  }
  for(const m of f.milestones)add(m.date,'deadline',m.stage+' 截止',m.stage+' deadline');
  f.events=events.filter((e,i,a)=>a.findIndex(x=>x.date===e.date&&x.labelEn===e.labelEn)===i).sort((a,b)=>a.date.localeCompare(b.date));
  f.notificationIds=raw.version?.notificationIdsInLatestProcessedReport??[];
}
const snl='https://www.itu.int/net/ITU-R/space/snl/bresult/radvance.asp?sel_satname=';
for(const name of ['CTC-1','CTC-2'])d.filings.push({id:name.toLowerCase(),constellationId:null,network:name,administration:'CHN',candidate:true,sourceUrl:snl+name,asOf:'2026-09-26',milestones:[],notificationIds:[name==='CTC-1'?'125545446':'125545445'],noteZh:'商业主体及十万级数量待技术通知核验；不归入国网/千帆',noteEn:'Operator and six-figure scale await technical-notice verification; not allocated to Guowang/Qianfan',events:[{date:'2025-12-29',kind:'filing',labelZh:'API/A 收件',labelEn:'API/A received',sourceUrl:snl+name},{date:'2026-03-17',kind:'publication',labelZh:'API/A 公布',labelEn:'API/A published',sourceUrl:snl+name}]});
d.version='1.1';
writeFileSync(new URL('../data/metrics/constellation-assets.json',import.meta.url),JSON.stringify(d,null,2)+'\n');
