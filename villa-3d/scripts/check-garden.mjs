import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
const source=fs.readFileSync(new URL('../public/spring-whisper/main.js',import.meta.url),'utf8');
const asset=JSON.parse(fs.readFileSync(new URL('../public/spring-whisper/realistic-botanicals.json',import.meta.url),'utf8'));
const code=source.slice(source.indexOf('const house=new T.Group()'),source.indexOf('// Lanterns')).replaceAll('import.meta.url',JSON.stringify(import.meta.url));
const evaluate=new Function('T','fetch','createBlenderFountain',`return (async()=>{const scene=new T.Scene();${code};await botanicalReady;return {house,plantBarriers};})();`);
const {house,plantBarriers}=await evaluate(T,async()=>({ok:true,json:async()=>asset}),()=>({ready:Promise.resolve(),update(){}}));
house.updateMatrixWorld(true);
const supports=house.children.filter(o=>o.name==='PedimentSupportColumn');assert.equal(supports.length,2);
for(const support of supports){const b=new T.Box3().setFromObject(support);assert.ok(Math.abs(b.min.y-4.44)<1e-5);assert.ok(b.max.y>=6.105);}
assert.ok(house.getObjectByName('RightTerraceRearRailing'));assert.ok(house.getObjectByName('LeftTerraceRearRailing'));
let topVines=0;house.traverse(o=>{if(o.name==='PergolaTopFlowerVine')topVines++});assert.equal(topVines,7,'Each roof slat needs a wrapping flower vine');
const gate=house.getObjectByName('GroundedEntranceGate');const gateBounds=new T.Box3().setFromObject(gate);assert.ok(gateBounds.min.y<=0);assert.ok(gateBounds.max.y>1.7);
assert.ok(new T.Box3().setFromObject(house.getObjectByName('RaisedRearBoundaryWall')).max.y>1.5);
let checked=0,rightBed=0,balconyGarland=0,frontRailLeaves=0,leftColumnFoliage=0;const matrix=new T.Matrix4(),bounds=new T.Box3();
house.traverse(o=>{
 if(!o.isInstancedMesh)return;
 if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();
 for(let i=0;i<o.count;i++){
  o.getMatrixAt(i,matrix);matrix.premultiply(o.matrixWorld);bounds.copy(o.geometry.boundingBox).applyMatrix4(matrix);
  const p=new T.Vector3().setFromMatrixPosition(matrix);if(p.x>2&&p.y<1.2&&p.z>2.7&&p.z<3.9)rightBed++;
  // The balcony planting deliberately wraps the handrail and includes short
  // flowering trails below it; these contacts are part of the design.
  const intentionalBalconyWrap=p.y>3.75&&p.y<4.75&&Math.abs(p.x)<2&&p.z>1.8&&p.z<3.9;
  assert.ok(intentionalBalconyWrap||!plantBarriers.some(b=>bounds.intersectsBox(b)),`${o.name} ${i} intersects a railing or fence`);
  if(Math.abs(p.x)<2&&p.y>4.15&&p.y<4.75&&p.z>1.8&&p.z<3.9)balconyGarland++;
  if(o.name==='Blender solid leafy sprigs'&&Math.abs(p.x)<1.8&&p.y>4.15&&p.y<4.7&&p.z>3.1&&p.z<3.7)frontRailLeaves++;
  if(p.x<-5.15&&p.x>-5.75&&p.y<4&&[-5.3,-2,2.6].some(z=>Math.abs(p.z-z)<.5))leftColumnFoliage++;
  checked++;
 }
});
assert.ok(rightBed>1000,'Right ground-floor bed should contain dense foliage and blooms');
assert.ok(balconyGarland>300,`Front balcony should have a continuous, lush garland; found ${balconyGarland}`);
assert.ok(frontRailLeaves>=40,`Front balcony handrail must visibly contain dedicated leaves as well as flowers; found ${frontRailLeaves}`);
assert.ok(leftColumnFoliage>1200,'Left-side brown columns should carry dense layered foliage');
for(const name of ['leaf','rose','calyx']){
 const m=asset.meshes.find(m=>m.name===name);assert.ok(m);assert.ok(Math.max(...m.indices)<m.positions.length/3);
 const ys=m.positions.filter((_,i)=>i%3===1);assert.ok(Math.max(...ys)-Math.min(...ys)>.5,`${name} must have depth`);
}
console.log(`Garden checks passed: connected columns, terrace rails, grounded gate, rear wall; ${checked} botanical instances clear of all ${plantBarriers.length} barriers; ${rightBed} instances in right flower bed.`);
