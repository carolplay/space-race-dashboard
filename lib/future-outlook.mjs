// Editorial capability scenarios, deliberately isolated from observed metrics.
export function clampK(value){const n=Number(value);return Number.isFinite(n)?Math.max(.7,Math.min(1,Math.round(n*100)/100)):.8;}
export function powerAtK(k){return 10**(10*clampK(k)+6);}
export function interpolateLog(knots,values,k){
 const x=clampK(k);let i=knots.findIndex(v=>v>=x);if(i<=0)return values[0];
 const f=(x-knots[i-1])/(knots[i]-knots[i-1]);
 return 10**(Math.log10(values[i-1])*(1-f)+Math.log10(values[i])*f);
}
export function sampleOutlook(model,k,scenario="network"){
 const x=clampK(k),id=model.scenarioFactors[scenario]?scenario:"network";
 // Alternatives converge on the same starting regime, diverging with capability.
 const divergence=Math.max(0,(x-.73)/.27),width=10**(.08+1.12*divergence);
 const metrics=Object.fromEntries(model.metrics.map(m=>{
  const value=interpolateLog(model.k,m.anchors,x)*model.scenarioFactors[id][m.id]**divergence;
  return [m.id,{value,low:value/width,high:value*width}];
 }));
 const localShare=Math.max(0,(x-.76)/.24)*(id==="earthbound"?.25:id==="frontier"?.85:.65);
 const deliveries=metrics.delivery.value;
 return {k:x,scenario:id,powerW:powerAtK(x),metrics,localShare,
  liftEquivalent:deliveries/100, // Mass equivalent, NOT a launch-count prediction.
  offworldManufacturingT:deliveries*localShare/Math.max(.01,1-localShare),
  orbitalRing:id==="frontier"&&x>=.95};
}
export function outlookSeries(model,scenario){return Array.from({length:31},(_,i)=>sampleOutlook(model,(70+i)/100,scenario));}
