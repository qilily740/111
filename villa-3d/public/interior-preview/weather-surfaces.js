import * as T from './three.module.js';

// Sample the actual visible architecture from above: roofs hide everything below them.
export function createSurfaceWeather(scene,house){
 const group=new T.Group();group.name='SurfaceWeather';scene.add(group);
 const ray=new T.Raycaster(),up=new T.Vector3(0,1,0),normal=new T.Vector3(),normalMatrix=new T.Matrix3();
 house.updateWorldMatrix(true,true);
 const targets=[];house.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh&&o.material&&!o.material.transparent)targets.push(o);});
 const sample=(x,z)=>{ray.set(new T.Vector3(x,20,z),new T.Vector3(0,-1,0));const hit=ray.intersectObjects(targets,false)[0];if(!hit)return null;normal.copy(hit.face.normal).applyMatrix3(normalMatrix.getNormalMatrix(hit.object.matrixWorld)).normalize();return normal.y>.22?{point:hit.point.clone(),normal:normal.clone()}:null;};
 const sites=[];
 for(let x=-6.6;x<=6.6;x+=.24)for(let z=-7.3;z<=7.3;z+=.24){const s=sample(x,z);if(s)sites.push(s);}
 // Narrow handrails and pergola beams get explicit samples in addition to the ground grid.
 for(let i=0;i<7;i++)for(let z=-.48;z<1.9;z+=.15){const s=sample(3.36+i*1.12/6,z);if(s)sites.push(s);}
 const snowMaterial=new T.MeshStandardMaterial({color:0xf3f7ff,roughness:.92});
 const wetMaterial=new T.MeshPhysicalMaterial({color:0x809cac,roughness:.12,metalness:.15,transparent:true,opacity:0,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});
 const wet=new T.InstancedMesh(new T.CircleGeometry(.16,8),wetMaterial,sites.length);wet.name='RainWetSurfaces';group.add(wet);
 const dummy=new T.Object3D();
 sites.forEach((s,i)=>{dummy.position.copy(s.point).addScaledVector(s.normal,.014);dummy.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),s.normal);dummy.scale.setScalar(1);dummy.updateMatrix();wet.setMatrixAt(i,dummy.matrix);});
 let snow=null,accumulation=0,wetness=0;
 const waterMaterial=new T.MeshPhysicalMaterial({color:0xc0deec,roughness:.08,metalness:.15,transparent:true,opacity:.65,depthWrite:false});
 const drops=new T.InstancedMesh(new T.SphereGeometry(.028,6,4),waterMaterial,144);drops.name='RoofRunoffDrops';group.add(drops);
 const paths=[];
 // The cottage's hipped roof: follow its measured slope to the eave on all four sides.
 for(let i=0;i<144;i++){
  const side=i%4,t=(Math.floor(i/4)+.5)/36;
  const end=new T.Vector3(side<2?-3.6+t*7.2:(side===2?-3.6:3.6),6.70,side<2?(side===0?2.4:-3.8):-3.8+t*6.2);
  const height=1.65*Math.max(0,1-(side<2?Math.max(0,Math.abs(end.x)-.5):Math.abs(end.z+.7))/3.1);
  const start=end.clone();start.y+=height;
  if(side<2)start.z-=Math.sign(end.z+.7)*height*3.1/1.65;
  else start.x-=Math.sign(end.x)*height*3.1/1.65;
  const outward=side<2?new T.Vector3(0,0,Math.sign(end.z+.7)):new T.Vector3(Math.sign(end.x),0,0);
  const edge=end.clone().addScaledVector(outward,.14),landing=sample(edge.x,edge.z);
  const ground=landing?Math.min(landing.point.y,6.5):0;
  paths.push({start,end,edge,direction:end.clone().sub(start).normalize(),ground,normal:landing?.normal||up,fallTime:Math.sqrt(2*(edge.y-ground)/9.81)});
 }
 const splashes=new T.InstancedMesh(new T.RingGeometry(.035,.045,12),waterMaterial,paths.length);splashes.name='EaveRainSplashes';group.add(splashes);
 return {
  sample,
  setAssets(assets){
   const geometry=assets.get('snowcap');if(!geometry)return;
   snow=new T.InstancedMesh(geometry,snowMaterial,sites.length);snow.name='AccumulatedBlenderSnow';snow.castShadow=true;snow.receiveShadow=true;snow.visible=false;group.add(snow);
   // Keep millimetre-scale drops; the shared asset is an oversized display model.
  },
  update(delta,time,type){
   accumulation=T.MathUtils.clamp(accumulation+delta*(type==='snow'?.055:-.08),0,1);
   wetness=T.MathUtils.clamp(wetness+delta*(type==='rain'?.4:-.09),0,1);wetMaterial.opacity=wetness*.28;wet.visible=wetness>.001;
   if(snow){snow.visible=accumulation>.001;if(snow.visible){sites.forEach((s,i)=>{dummy.position.copy(s.point).addScaledVector(s.normal,.012);dummy.quaternion.setFromUnitVectors(up,s.normal);dummy.scale.set(.13,.1+accumulation*.65,.22);dummy.updateMatrix();snow.setMatrixAt(i,dummy.matrix);});snow.instanceMatrix.needsUpdate=true;}}
   drops.visible=splashes.visible=type==='rain';if(type!=='rain')return;
   paths.forEach((p,i)=>{const slide=1.1+(i%7)*.13,cycle=slide+p.fallTime+.32,age=(time+i*.618)%cycle;
    if(age<slide){const t=age/slide;dummy.position.lerpVectors(p.start,p.end,t*t);dummy.quaternion.setFromUnitVectors(up,p.direction);dummy.scale.set(.18,1.7,.12);}
    else{const fall=age-slide;dummy.position.copy(p.edge);dummy.position.y=Math.max(p.ground,p.edge.y-.5*9.81*fall*fall);dummy.quaternion.identity();dummy.scale.setScalar(fall<p.fallTime?.3:0);}
    dummy.updateMatrix();drops.setMatrixAt(i,dummy.matrix);
    const impact=age-slide-p.fallTime;dummy.position.copy(p.edge);dummy.position.y=p.ground+.02;dummy.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),p.normal);dummy.scale.setScalar(impact>=0&&impact<.28?Math.sin(impact/.28*Math.PI)*1.6:0);dummy.updateMatrix();splashes.setMatrixAt(i,dummy.matrix);
   });drops.instanceMatrix.needsUpdate=true;splashes.instanceMatrix.needsUpdate=true;
  }
 };
}
