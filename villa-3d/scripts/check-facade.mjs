import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
// Instantiate the actual architecture without a renderer, DOM, or garden assets.
const source=fs.readFileSync(new URL('../public/spring-whisper/main.js',import.meta.url),'utf8');
const architecture=source.slice(source.indexOf('const house=new T.Group()'),source.indexOf('// Garden boundary'));
const house=new Function('T',`const scene=new T.Scene();${architecture};return house;`)(T);
house.updateMatrixWorld(true);
const ray=new T.Raycaster();
function frontHit(x,y){ray.set(new T.Vector3(x,y,15),new T.Vector3(0,0,-1));return ray.intersectObject(house,true)[0]?.object;}
assert.equal(frontHit(0,6.59).name,'OculusRecess','The circular recess must be in front of the roof and pediment');
assert.equal(frontHit(.5,6.65).name,'SolidFrontPediment','The solid pediment must mask the roof/eaves');
const arches=[];house.traverse(o=>{if(o.name==='ArchedOpening')arches.push(o)});
assert.equal(arches.length,4);
for(const arch of arches){
 const stone=arch.getObjectByName('StoneArch');assert.ok(stone);
 const spring=stone.geometry.parameters.shapes.getPoints()[0].y;
 for(const jamb of arch.children.filter(o=>o.name==='StoneJamb'))assert.ok(jamb.position.y+jamb.scale.y/2<=spring+1e-6,'Arch jamb stops at the spring line');
 const pane=arch.getObjectByName('RecessedGlass');
 assert.ok(arch.getObjectByName('ProjectingSill').position.z>pane.position.z);
}
const removedWindow=house.children.find(o=>o.name==='RectangularOpening'&&Math.abs(o.position.x-3.32)<.01&&Math.abs(o.position.y-.6)<.01&&Math.abs(o.position.z+2)<.01);
assert.equal(removedWindow,undefined,'The intersecting lower right rectangular window must remain removed');
const upperRightWindow=house.children.find(o=>o.name==='RectangularOpening'&&Math.abs(o.position.x-3.32)<.01&&Math.abs(o.position.y-4.2)<.01);
assert.ok(upperRightWindow,'The upper right window should remain');
assert.ok(upperRightWindow.position.z<-1.3,'The upper right window must move clear of the right balcony rail');
const pergolaPosts=house.children.filter(o=>o.isMesh&&Math.abs(o.scale?.y-1.8)<.01&&[-.3,1.68].some(z=>Math.abs(o.position.z-z)<.01)&&o.position.x>3);
assert.ok(pergolaPosts.every(o=>o.position.x>=4),'The shortened pergola must clear the upper right window surround');
assert.equal(pergolaPosts.length,4,'The pergola keeps all four vertical posts');
const roofSlats=house.children.filter(o=>o.isMesh&&Math.abs(o.position.y-5.22)<.01&&Math.abs(o.scale.z-2.4)<.01);
assert.equal(roofSlats.length,7,'The pergola keeps seven evenly spaced roof slats');
const slatXs=roofSlats.map(o=>o.position.x).sort((a,b)=>a-b);
assert.ok(Math.abs(slatXs[0]-3.36)<.001,'The first roof slat must sit directly against the wall');
assert.ok(Math.abs(slatXs.at(-1)-4.48)<.001,'The seventh roof slat keeps its outer position');
for(let i=1;i<slatXs.length-1;i++)assert.ok(Math.abs((slatXs[i]-slatXs[i-1])-(slatXs[i+1]-slatXs[i]))<.001,'The five middle roof-slat gaps must be equal');
assert.ok(house.getObjectByName('ConnectedFrontBalconyCorners'),'Front and side balcony rails must have closing corner newels');
// Confirm the rotated side arch also has a clear glass surface.
ray.set(new T.Vector3(12,1.6,1.02),new T.Vector3(-1,0,0));
assert.equal(ray.intersectObject(house,true)[0].object.name,'RecessedGlass');
console.log('Facade checks passed: roof occlusion, four arches, recessed glazing, front and side window clearance.');
