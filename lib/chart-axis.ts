export type AxisScale = 'linear' | 'log';
export function axisTransform(value:number|null,scale:AxisScale):number|null {
  if(value===null||!Number.isFinite(value))return null;
  return scale==='log'?(value>0?Math.log10(value):null):value;
}
export function logarithmicTicks(min:number,max:number):number[] {
  const ticks:number[]=[];
  for(let exponent=Math.ceil(min);exponent<=Math.floor(max);exponent++)ticks.push(10**exponent);
  return ticks;
}
