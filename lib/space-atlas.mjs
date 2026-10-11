import {json2satrec,propagate,gstime,eciToEcf} from 'satellite.js';
export const EARTH_RADIUS_KM=6378.137;
export function elementEpoch(row){return Date.parse(row.EPOCH.endsWith('Z')?row.EPOCH:row.EPOCH+'Z');}
export function prepareElements(elements){return elements.map(row=>({row,epoch:elementEpoch(row),satrec:json2satrec(row)}));}
export function positionAt(record,time){
 try{
  const date=new Date(time),result=propagate(record.satrec,date);
  if(!result||!result.position||typeof result.position!=='object')return null;
  const p=eciToEcf(result.position,gstime(date));
  return [p.x,p.z,-p.y].every(Number.isFinite)?[p.x,p.z,-p.y]:null;
 }catch{return null;}
}
export function displayPoint(p,exaggeration=1){
 const r=Math.hypot(...p),scaled=(EARTH_RADIUS_KM+(r-EARTH_RADIUS_KM)*exaggeration)/r;
 return p.map(v=>v*scaled/EARTH_RADIUS_KM);
}
export function projectPoint(p,yaw,pitch){
 const x=p[0]*Math.cos(yaw)-p[2]*Math.sin(yaw),z=p[0]*Math.sin(yaw)+p[2]*Math.cos(yaw);
 return [x,p[1]*Math.cos(pitch)-z*Math.sin(pitch),p[1]*Math.sin(pitch)+z*Math.cos(pitch)];
}
export function groupOrbitStructure(elements){
 const groups=new Map();
 for(const e of elements){
  const altitude=Math.pow(398600.4418/Math.pow(e.MEAN_MOTION*2*Math.PI/86400,2),1/3)-EARTH_RADIUS_KM;
  const key=Math.round(altitude/25)*25+':'+Math.round(e.INCLINATION);
  const b=groups.get(key)??{altitudeKm:Math.round(altitude/25)*25,inclinationDeg:Math.round(e.INCLINATION),count:0};
  b.count++;groups.set(key,b);
 }
 return [...groups.values()].sort((a,b)=>b.count-a.count);
}
