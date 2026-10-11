"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import {EARTH_RADIUS_KM,prepareElements,positionAt,displayPoint,projectPoint} from "@/lib/space-atlas.mjs";
export type ElementRow={OBJECT_NAME:string;NORAD_CAT_ID:number;EPOCH:string;INCLINATION:number;RA_OF_ASC_NODE:number;MEAN_MOTION:number;[key:string]:unknown};
export type SpaceGroup={id:string;color:string;elements:ElementRow[]};
type Point={id:string;row:ElementRow;p:number[];color:string};
export default function SpaceGlobe({groups,time,selected,onSelect,exaggeration,lang,onCounts}:{groups:SpaceGroup[];time:number;selected:ElementRow|null;onSelect:(row:ElementRow)=>void;exaggeration:number;lang:"zh"|"en";onCounts:(n:number,stale:number,failed:number)=>void}){
 const canvas=useRef<HTMLCanvasElement>(null),points=useRef<Point[]>([]),hit=useRef<{x:number;y:number;row:ElementRow}[]>([]),paths=useRef<number[][]>([]);
 const camera=useRef({yaw:.7,pitch:.32,zoom:1}),drag=useRef<{x:number;y:number;moved:boolean}|null>(null);
 const [revision,setRevision]=useState(0),[busy,setBusy]=useState(false),[zoom,setZoom]=useState(1);
 const tr=(a:string,b:string)=>lang==="zh"?a:b;
 const preparedGroups=useMemo(()=>groups.map(g=>({...g,prepared:prepareElements(g.elements)})),[groups]);
 useEffect(()=>{
  let cancelled=false;setBusy(true);
  (async()=>{
   const next:Point[]=[];let stale=0,failed=0,n=0;
   for(const group of preparedGroups){
    for(const record of group.prepared){
     if(Math.abs(time-record.epoch)>7*86400000){stale++;continue;}
     const p=positionAt(record,time);
     if(p&&Math.hypot(...p)>EARTH_RADIUS_KM)next.push({id:group.id,row:record.row,p,color:group.color});else failed++;
     if(++n%512===0){await new Promise(r=>setTimeout(r,0));if(cancelled)return;}
    }
   }
   if(cancelled)return;points.current=next;onCounts(next.length,stale,failed);setBusy(false);setRevision(r=>r+1);
  })();
  return()=>{cancelled=true};
 },[preparedGroups,time,onCounts]);
 useEffect(()=>{
  paths.current=[];
  if(selected&&Math.abs(time-Date.parse(selected.EPOCH.endsWith("Z")?selected.EPOCH:selected.EPOCH+"Z"))<=7*86400000){
   const rec=prepareElements([selected])[0],period=86400000/selected.MEAN_MOTION;
   for(let i=0;i<=120;i++){const p=positionAt(rec,time+i/120*period);if(p)paths.current.push(p);}
  }
  setRevision(r=>r+1);
 },[selected,time]);
 useEffect(()=>{
  const el=canvas.current;if(!el)return;
  function draw(){
   if(!el)return;const rect=el.getBoundingClientRect(),w=rect.width,h=rect.height,dpr=Math.min(window.devicePixelRatio||1,2);
   el.width=w*dpr;el.height=h*dpr;const ctx=el.getContext("2d");if(!ctx)return;ctx.scale(dpr,dpr);ctx.clearRect(0,0,w,h);
   const radius=Math.min(w*.37,h*.36)*camera.current.zoom,cx=w/2,cy=h/2;
   const convert=(p:number[])=>{const v=projectPoint(displayPoint(p,exaggeration),camera.current.yaw,camera.current.pitch);return [cx+v[0]*radius,cy-v[1]*radius,v[2]];};
   ctx.fillStyle="#060c17";ctx.fillRect(0,0,w,h);
   // Decorative background dots are fixed, not orbital objects.
   for(let i=0;i<90;i++){ctx.fillStyle="rgba(148,174,207,.24)";ctx.fillRect((i*239.17)%w,(i*i*31.7)%h,1,1);}
   const glow=ctx.createRadialGradient(cx,cy,radius*.6,cx,cy,radius*1.12);glow.addColorStop(0,"#102b4c");glow.addColorStop(.87,"#092038");glow.addColorStop(.91,"#1b5378");glow.addColorStop(1,"rgba(10,52,82,0)");ctx.fillStyle=glow;ctx.beginPath();ctx.arc(cx,cy,radius*1.12,0,Math.PI*2);ctx.fill();
   const globe=ctx.createRadialGradient(cx-radius*.3,cy-radius*.35,0,cx,cy,radius);globe.addColorStop(0,"#183958");globe.addColorStop(1,"#081525");ctx.fillStyle=globe;ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.fill();
   ctx.lineWidth=.6;ctx.strokeStyle="#32607b";
   const line=(coords:number[][],color:string)=>{ctx.strokeStyle=color;ctx.beginPath();let active=false;for(const raw of coords){const [x,y,z]=convert(raw);if(z<0&&Math.hypot(x-cx,y-cy)<radius){active=false;continue;}if(active)ctx.lineTo(x,y);else ctx.moveTo(x,y);active=true;}ctx.stroke();};
   const surface=(lat:number,lon:number)=>[Math.cos(lat)*Math.cos(lon)*EARTH_RADIUS_KM,Math.sin(lat)*EARTH_RADIUS_KM,-Math.cos(lat)*Math.sin(lon)*EARTH_RADIUS_KM];
   for(let lat=-60;lat<=60;lat+=30)line(Array.from({length:181},(_,i)=>surface(lat*Math.PI/180,i*2*Math.PI/180)),"#31526e");
   for(let lon=0;lon<360;lon+=30)line(Array.from({length:91},(_,i)=>surface((i*2-90)*Math.PI/180,lon*Math.PI/180)),"#31526e");
   ctx.lineWidth=1.3;line(paths.current,"#eef4ff");
   hit.current=[];
   for(const group of groups){ctx.fillStyle=group.color;ctx.beginPath();for(const point of points.current){if(point.id!==group.id)continue;const [x,y,z]=convert(point.p);if(z<0&&Math.hypot(x-cx,y-cy)<radius)continue;ctx.moveTo(x+1.3,y);ctx.arc(x,y,1.3,0,Math.PI*2);hit.current.push({x,y,row:point.row});}ctx.fill();}
   if(selected){const p=points.current.find(p=>p.row.NORAD_CAT_ID===selected.NORAD_CAT_ID);if(p){const [x,y,z]=convert(p.p);if(z>=0||Math.hypot(x-cx,y-cy)>=radius){ctx.strokeStyle="#fff";ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,7,0,Math.PI*2);ctx.stroke();}}}
  }
  draw();const obs=new ResizeObserver(draw);obs.observe(el);return()=>obs.disconnect();
 },[revision,groups,selected,exaggeration,zoom]);
 const redraw=()=>setRevision(r=>r+1);
 return <div className="atlas-globe-wrap">
  <canvas ref={canvas} role="img" aria-label={tr("星座三维轨道推算视图；可拖动，方向键旋转，对象也可从右侧列表选择","3D propagated constellation view; drag or arrow keys to rotate, or select objects in the adjacent list")} tabIndex={0}
   onKeyDown={e=>{if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key)){e.preventDefault();camera.current.yaw+=(e.key==="ArrowLeft"?-.15:e.key==="ArrowRight"?.15:0);camera.current.pitch=Math.max(-1.4,Math.min(1.4,camera.current.pitch+(e.key==="ArrowUp"?.1:e.key==="ArrowDown"?-.1:0)));redraw();}}}
   onPointerDown={e=>{drag.current={x:e.clientX,y:e.clientY,moved:false};e.currentTarget.setPointerCapture(e.pointerId);}}
   onPointerMove={e=>{const d=drag.current;if(!d)return;const dx=e.clientX-d.x,dy=e.clientY-d.y;if(Math.abs(dx)+Math.abs(dy)>2)d.moved=true;camera.current.yaw+=dx*.006;camera.current.pitch=Math.max(-1.4,Math.min(1.4,camera.current.pitch+dy*.006));d.x=e.clientX;d.y=e.clientY;redraw();}}
   onPointerCancel={()=>{drag.current=null;}}
   onPointerUp={e=>{const d=drag.current;drag.current=null;if(!d||d.moved)return;const rect=e.currentTarget.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top;const nearest=hit.current.map(p=>({p,d:Math.hypot(p.x-x,p.y-y)})).filter(p=>p.d<12).sort((a,b)=>a.d-b.d)[0];if(nearest)onSelect(nearest.p.row);}}/>
  <div className="atlas-space-caption"><span>{busy?tr("计算轨道…","Propagating…"):tr("SGP4 推算 · 非遥测","SGP4 PROPAGATION · NOT TELEMETRY")}</span><b>{tr("拖动旋转 · 点选对象","Drag to orbit · select a node")}</b></div>
  <div className="atlas-camera-controls"><button onClick={()=>{camera.current={yaw:.7,pitch:.32,zoom:1};setZoom(1);redraw();}}>{tr("重置视角","Reset camera")}</button><label>{tr("缩放","Zoom")}<input aria-label={tr("视图缩放","View zoom")} type="range" min=".6" max="1.6" step=".05" value={zoom} onChange={e=>{const z=Number(e.target.value);camera.current.zoom=z;setZoom(z);}}/></label></div>
 </div>;
}
