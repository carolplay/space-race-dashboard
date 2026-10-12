"use client";
import {useEffect,useRef,useState} from "react";
type Domain="earth"|"moon"|"sun";
const palette=["#9ac7ff","#b8ed74","#ffcf81","#baabff","#ff91a5"];
export default function FutureSpaceScene({k,domain,layer,ring,lang,scenario}:{k:number;domain:Domain;layer:number;ring:boolean;lang:"zh"|"en";scenario:string}){
 const canvas=useRef<HTMLCanvasElement>(null),camera=useRef({yaw:.5,pitch:.5}),drag=useRef<{x:number;y:number}|null>(null),[revision,setRevision]=useState(0);
 const tr=(zh:string,en:string)=>lang==="zh"?zh:en;
 useEffect(()=>{
  const el=canvas.current;if(!el)return;
  const draw=()=>{
   const rect=el.getBoundingClientRect(),w=rect.width,h=rect.height,dpr=Math.min(devicePixelRatio||1,2);el.width=w*dpr;el.height=h*dpr;
   const c=el.getContext("2d");if(!c)return;c.scale(dpr,dpr);c.fillStyle="#080e1b";c.fillRect(0,0,w,h);
   const size=Math.min(w*.31,h*.34),cx=w/2,cy=h/2;
   const project=([x,y,z]:number[])=>{const a=camera.current.yaw,b=camera.current.pitch,u=x*Math.cos(a)-z*Math.sin(a),v=x*Math.sin(a)+z*Math.cos(a);return [cx+u*size,cy-(y*Math.cos(b)-v*Math.sin(b))*size,y*Math.sin(b)+v*Math.cos(b)];};
   const path=(p:number[][],color:string,dash=false)=>{c.strokeStyle=color;c.lineWidth=1;c.setLineDash(dash?[5,6]:[]);c.beginPath();p.forEach((point,i)=>{const [x,y]=project(point);if(i)c.lineTo(x,y);else c.moveTo(x,y);});c.stroke();c.setLineDash([]);};
   // Representative function groups; not generated satellite positions or counts.
   const body=(p:number[],radius:number,color:string,label:string)=>{const [x,y]=project(p);const g=c.createRadialGradient(x-radius*.3,y-radius*.3,1,x,y,radius);g.addColorStop(0,color);g.addColorStop(1,"#152236");c.fillStyle=g;c.beginPath();c.arc(x,y,radius,0,Math.PI*2);c.fill();c.fillStyle="#dae2f0";c.font="12px sans-serif";c.fillText(label,x+radius+8,y+4);};
   for(let i=0;i<65;i++){c.fillStyle="#31405b";c.fillRect((i*277.7)%w,(i*i*17.3)%h,1,1);}
   if(domain==="earth")body([0,0,0],size*.47,"#366384",tr("地球","Earth"));
   if(domain==="moon"){body([-.7,0,0],size*.25,"#366384",tr("地球","Earth"));body([1.1,.05,0],size*.12,"#ada9a3",tr("月球","Moon"));path([[-.65,.2,0],[0,.45,.3],[1.1,.15,0]],"#4f627e",true);}
   if(domain==="sun"){body([0,0,0],size*.28,"#eab965",tr("太阳","Sun"));body([1.35,0,0],size*.07,"#366384",tr("地球","Earth"));}
   const slower=scenario==="earthbound"?.07:0;
   const start=domain==="earth"?.7:domain==="moon"?.8+slower:.9+slower;
   if(k>=start){
    for(let l=0;l<5;l++){
     if(k<([.7,.7,.76,.7,.78][l]+(l===2||l===4?slower:0)))continue;
     const active=layer===-1||layer===l,color=palette[l],r=(domain==="earth"?.72:domain==="moon"?.6:.7)+l*.22;
     const tilt=domain==="earth"?(l===0?.75:l===2?1.4:.35+l*.16):.15+l*.12,center=domain==="moon"?[.9,0,0]:[0,0,0];
     const p=(theta:number)=>[center[0]+r*Math.cos(theta),center[1]+r*Math.sin(theta)*Math.sin(tilt),center[2]+r*Math.sin(theta)*Math.cos(tilt)];
     path(Array.from({length:97},(_,i)=>p(i/96*Math.PI*2)),active?color+"85":"#293143",l===4);
     const intensity=scenario==="earthbound"?.5:scenario==="frontier"?1.3:1;
     const n=Math.max(3,Math.round((domain==="earth"?6+(k-.7)*35:4+(k-start)*25)*intensity));
     const pts=[];
     for(let i=0;i<n;i++){
      const raw=p(i/n*Math.PI*2+l*.5),[x,y]=project(raw);pts.push(raw);c.fillStyle=active?color:"#2c3546";
      if(l===2){
       const d=k>=.85?6:3;c.fillRect(x-d,y-d,d*2,d*2);
       // Solar wings and radiators are facility glyphs, not engineering dimensions.
       c.strokeStyle=active?color+"99":"#293143";c.lineWidth=1;
       c.strokeRect(x-d*3.7,y-d*.7,d*2,d*1.4);c.strokeRect(x+d*1.7,y-d*.7,d*2,d*1.4);
       c.beginPath();c.moveTo(x-d*1.7,y);c.lineTo(x+d*1.7,y);c.stroke();
       if(k>=.85){c.strokeStyle=active?"#93a7cf":"#293143";c.beginPath();c.moveTo(x,y+d);c.lineTo(x,y+d*2.8);c.moveTo(x-d,y+d*2.2);c.lineTo(x+d,y+d*2.2);c.stroke();}
      }
      else if(l===4){c.beginPath();c.moveTo(x,y-5);c.lineTo(x+5,y+4);c.lineTo(x-5,y+4);c.closePath();c.fill();}
      else{c.beginPath();c.arc(x,y,l===3?2.5:3.5,0,Math.PI*2);c.fill();}
     }
     if(active&&l===1)for(let i=0;i<pts.length-1;i++)path([pts[i],pts[i+1]],color+"55",true);
    }
    if(domain==="earth"&&ring){path(Array.from({length:181},(_,i)=>[.61*Math.cos(i*Math.PI/90),0,.61*Math.sin(i*Math.PI/90)]),"#ffcf81");c.fillStyle="#ffcf81";c.font="12px sans-serif";c.fillText(tr("条件性轨道环构想","Conditional orbital-ring concept"),24,h-55);}
    if(k>=.85&&(layer===-1||layer===4)){
     const hub=domain==="moon"?[1.15,.5,.8]:domain==="sun"?[1.4,.4,.7]:[1.2,.35,.5];
     const wheel=Array.from({length:61},(_,i)=>[hub[0]+.14*Math.cos(i*Math.PI/30),hub[1]+.14*Math.sin(i*Math.PI/30),hub[2]]);
     path(wheel,"#ff91a5");for(let i=0;i<4;i++)path([hub,wheel[i*15]],"#ff91a5");
     const [hx,hy]=project(hub);c.fillStyle="#ffb4c2";c.font="11px sans-serif";c.fillText(tr("旋转居住 / 拼装设施构想","Rotating habitat / assembly concept"),Math.max(20,Math.min(w-255,hx-55)),hy-35);
    }
   }else{c.fillStyle="#a8b5cc";c.font="14px sans-serif";c.fillText(tr("此空间域在当前情景阶段尚未展开","This domain has not expanded at this scenario stage"),24,h-55);}
   c.fillStyle="#91a2be";c.font="11px sans-serif";c.fillText(w<500?tr("功能群示意 · 非轨道推算","SCHEMATIC · NO PROPAGATION"):tr("功能群示意 · 节点数量不按比例 · 非轨道推算","FUNCTION GROUPS · NODE COUNTS NOT TO SCALE · NO ORBIT PROPAGATION"),24,h-25);
  };
  draw();const obs=new ResizeObserver(draw);obs.observe(el);return()=>obs.disconnect();
 },[k,domain,layer,ring,lang,scenario,revision]);
 const rotate=(x:number,y:number)=>{camera.current.yaw+=x;camera.current.pitch=Math.max(-1.4,Math.min(1.4,camera.current.pitch+y));setRevision(v=>v+1);};
 return <div className="future-scene"><canvas ref={canvas} tabIndex={0} role="img" aria-label={tr("可旋转的三维功能群示意；方向键旋转。详细功能在旁边列出。","Rotatable 3D function-group schematic; arrow keys rotate. Functions are listed alongside.")}
 onKeyDown={e=>{if(e.key.startsWith("Arrow")){e.preventDefault();rotate(e.key==="ArrowLeft"?-.15:e.key==="ArrowRight"?.15:0,e.key==="ArrowUp"?.1:e.key==="ArrowDown"?-.1:0);}}}
 onPointerDown={e=>{drag.current={x:e.clientX,y:e.clientY};e.currentTarget.setPointerCapture(e.pointerId);}}
 onPointerMove={e=>{if(drag.current){rotate((e.clientX-drag.current.x)*.006,(e.clientY-drag.current.y)*.006);drag.current={x:e.clientX,y:e.clientY};}}}
 onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}/>
 <button onClick={()=>{camera.current={yaw:.5,pitch:.5};setRevision(v=>v+1);}}>{tr("重置视角","Reset view")}</button><span>{tr("拖动 / 方向键旋转","Drag / arrow keys to rotate")}</span></div>;
}
