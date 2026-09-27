import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
const source=await readFile(new URL('../lib/chart-axis.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
const {axisTransform,logarithmicTicks}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
test('log scale has decade ticks and does not silently offset zero or negative values',()=>{
 assert.equal(axisTransform(100,'log'),2);assert.equal(axisTransform(1,'log'),0);
 for(const value of [0,-1,null,Infinity,NaN])assert.equal(axisTransform(value,'log'),null);
 assert.equal(axisTransform(0,'linear'),0);assert.equal(axisTransform(-10,'linear'),-10);
 assert.deepEqual(logarithmicTicks(0,4),[1,10,100,1000,10000]);
});
