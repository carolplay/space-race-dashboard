export type DashboardLanguage = 'zh' | 'en';

// Source identifiers stay intact in storage. Only presentation labels are localized.
const names: Record<string, string> = {
  'China Aerospace Science and Technology Corporation':'中国航天科技集团',
  'Korea Aerospace Research Institute':'韩国航空宇宙研究院',
  'Indian Space Research Organization':'印度空间研究组织',
  'CAS Space':'中科宇航', 'LandSpace':'蓝箭航天',
  'China SatNet':'中国星网', 'Shanghai Spacecom Satellite Technology':'上海垣信',
  'Amazon · Kuiper':'亚马逊 · Kuiper', 'Eutelsat · UK / FR':'Eutelsat · 英国 / 法国', 'SpaceSail · SSST':'千帆 · 上海垣信',
  'NASA · LRO rendering':'NASA · 月球勘测轨道器示意图',
  'CNSA / CLEP · Queqiao-2 deployment view':'国家航天局 / 探月工程 · 鹊桥二号展开状态',
  'CNSA / CLEP · Yutu-2 on the lunar far side':'国家航天局 / 探月工程 · 月背玉兔二号',
  'China Manned Space':'中国载人航天', 'Tiangong':'天宫',
  'Cape Canaveral SFS, FL, USA':'美国卡纳维拉尔角太空军基地',
  'Vandenberg SFB, CA, USA':'美国范登堡太空军基地',
  'Kennedy Space Center, FL, USA':'美国肯尼迪航天中心',
  "Jiuquan Satellite Launch Center, People's Republic of China":'中国酒泉卫星发射中心',
  "Wenchang Space Launch Site, People's Republic of China":'中国文昌航天发射场',
  "Xichang Satellite Launch Center, People's Republic of China":'中国西昌卫星发射中心',
  "Taiyuan Satellite Launch Center, People's Republic of China":'中国太原卫星发射中心',
  'Rocket Lab Launch Complex 1, Mahia Peninsula, New Zealand':'新西兰马希亚半岛 Rocket Lab 发射基地',
  'SpaceX Starbase, TX, USA':'美国得克萨斯州 SpaceX 星舰基地',
  'Satish Dhawan Space Centre, India':'印度萨蒂什·达万航天中心',
  'Naro Space Center, South Korea':'韩国罗老宇宙中心',
  'Haiyang Oriental Spaceport':'海阳东方航天港',
  'Haiyang offshore launch location':'海阳海上发射位置',
  'Rizhao offshore launch location':'日照海上发射位置',
  'Plesetsk Cosmodrome, Russian Federation':'俄罗斯普列谢茨克发射场',
  'Baikonur Cosmodrome, Republic of Kazakhstan':'哈萨克斯坦拜科努尔发射场',
  'Guiana Space Centre, French Guiana':'法属圭亚那航天中心',
  'Tanegashima Space Center, Japan':'日本种子岛宇宙中心',
  'South China Sea (launch location 3)':'南海发射位置 3',
  'South China Sea (launch location 2)':'南海发射位置 2',
  'Yellow Sea (launch location 5)':'黄海发射位置 5',
  'Atlantic Ocean':'大西洋', 'active':'在用', 'expended':'已消耗', 'retired':'已退役',
  'Launch Successful':'发射成功','Launch Failure':'发射失败','Partial Failure':'部分失败','In Flight':'飞行中',
  'Minute':'分钟','Second':'秒','Hour':'小时','Day':'日期','Month':'月份','Quarter':'季度','Year':'年份',
  'TBD':'待定','NET':'不早于','N/A':'未公布',
  'Satish Dhawan Space Centre First Launch Pad':'萨蒂什·达万航天中心第一发射台',
  'Satish Dhawan Space Centre Second Launch Pad':'萨蒂什·达万航天中心第二发射台',
  'Flight':'飞行阶段', 'Falcon':'猎鹰系列','Smart Dragon':'捷龙系列','Kuaizhou':'快舟系列',
  'Space Launch System':'太空发射系统', 'Gravity-1':'引力一号',
  '5 / day':'5 / 日', '100+ / month':'100+ / 月',
  'M0':'M0 · 启用','M1':'M1 · 10% 部署','M2':'M2 · 50% 部署','M3':'M3 · 100% 部署',
  'GCAT Active / Current Catalog':'GCAT 活跃 / 当前对象目录',
  'GCAT SATCAT / LaunchLog':'GCAT 对象目录 / 发射日志',
  'NASA / CNSA / CMSE / provider releases':'NASA / 国家航天局 / 载人航天工程 / 运营商公报',
};
const replacements: Array<[RegExp, string]> = [
  [/Long March (\d+)([A-Z]?)/g, '长征$1$2'], [/Smart Dragon (\d+)/g,'捷龙$1'],
  [/Kinetica (\d+)/g,'力箭$1'], [/Ceres-(\d+)/g,'谷神星$1'], [/Zhuque-(\d+)/g,'朱雀$1'],
  [/Falcon Heavy/g,'猎鹰重型'], [/Falcon 9/g,'猎鹰9号'], [/Starship/g,'星舰'], [/Super Heavy/g,'超重助推器'],
  [/Queqiao-2/g,'鹊桥二号'], [/POLAR/g,'极轨'], [/SUBORBITAL/g,'亚轨道'],
  [/Space Launch Complex ([\w-]+)/g,'航天发射台 $1'], [/Launch Complex ([\w-]+)/g,'发射台 $1'],
  [/Launch Area ([\w-]+)/g,'发射区 $1'], [/Orbital Launch Pad ?(\d*)/g,'轨道发射台 $1'],
  [/Commercial LC-(\d+)/g,'商业发射台 $1'], [/Block (\d+)/g,'第$1批次'],
  [/Starlink Group ([\d-]+)/g,'星链组 $1'], [/SatNet LEO Group (\d+)/g,'星网低轨组 $1'],
  [/Yaogan (\d+) Group (\d+)/g,'遥感$1号 $2组'], [/Dedicated SSO Rideshare/g,'专用太阳同步拼车任务'],
  [/(\d+) satellites/g,'$1颗卫星'], [/ Flight (\d+)/g,' 第$1次飞行'],
];
export function sourceLabel(value: string | null | undefined, lang: DashboardLanguage): string {
  if (!value) return '—';
  // Legacy editorial records contained both languages in a single field.
  if (/[\u3400-\u9fff]/.test(value) && value.includes(' / ')) {
    const [zh, en] = value.split(' / ');
    return lang === 'zh' ? zh : en;
  }
  if (lang === 'en') return ({'东风商业航天创新试验区':'Dongfeng commercial aerospace test zone','民勤着陆场坪':'Minqin landing zone'} as Record<string,string>)[value] ?? value.replace(/^约 /,'Approx. ');
  if (names[value]) return names[value];
  return replacements.reduce((label,[pattern,translated])=>label.replace(pattern,translated),value);
}
export function periodLabel(value: string, lang: DashboardLanguage) {
  return lang === 'en' ? value : value.replace(' YTD',' 年内累计').replace(' EOY',' 年末').replace(' NOW',' 当前').replace('2026E','2026 估算');
}
export function planDate(value: string, lang: DashboardLanguage) {
  if(lang==='en')return value;
  if(value.startsWith('BEFORE '))return value.slice(7)+'年前';
  return value.replace(/^(\d{4})$/,'$1年').replace(/^(\d{4}) MID$/,'$1年中').replace(/^(\d{4}) H2$/,'$1年下半年');
}
