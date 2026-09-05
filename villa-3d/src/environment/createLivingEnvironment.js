import * as THREE from 'three';
import { box, roundedIrregularPatch } from '../utils/geometry.js';
import { GATE_LAMP_POSITIONS } from '../garden/createGarden.js';

const WEATHER_ROOFS=[
  {w:10.1,h:3.05,x:.2,y:6.8,z:-3,d:8.05},
  {w:4.55,h:1.7,x:5.2,y:6.5,z:-3.55,d:4.28},
];

function roofSurfaceAt(x,z) {
  let surface=null;
  WEATHER_ROOFS.forEach(roof=>{ if(Math.abs(z-roof.z)<=roof.d/2&&Math.abs(x-roof.x)<=roof.w/2){ const y=roof.y+roof.h*(1-Math.abs(x-roof.x)/(roof.w/2))+.15; if(surface===null||y>surface)surface=y; } });
  return surface;
}

function createPetalDrift(scene) {
  const count=108, geometry=new THREE.PlaneGeometry(.13,.085), material=new THREE.MeshStandardMaterial({color:0xf4c8d6,transparent:true,opacity:.84,side:THREE.DoubleSide,roughness:.9});
  const petals=new THREE.InstancedMesh(geometry,material,count); petals.name='DriftingCherryPetals'; const seeds=[]; const dummy=new THREE.Object3D();
  for(let i=0;i<count;i++){ seeds.push({phase:i*.087,s:.65+(i%5)*.11,offset:((i*7)%15-7)*.28}); dummy.position.set(-9,6,-6); dummy.scale.setScalar(seeds[i].s); dummy.updateMatrix(); petals.setMatrixAt(i,dummy.matrix); }
  scene.add(petals);
  return time=>{ for(let i=0;i<count;i++){ const p=seeds[i], progress=(time*.055+p.phase)%1, wind=time*1.4+i*.5; const x=-10.2+progress*21.7+Math.sin(wind)*.45+p.offset; const z=-8.1+progress*18.6+Math.cos(wind*.72)*.38-p.offset*.72; const y=.18+Math.pow(1-progress,1.25)*8.8+Math.sin(wind)*.18; dummy.position.set(x,y,z); dummy.rotation.set(.5+Math.sin(wind)*.7,wind,Math.cos(wind)*.8); dummy.scale.setScalar(p.s); dummy.updateMatrix(); petals.setMatrixAt(i,dummy.matrix); } petals.instanceMatrix.needsUpdate=true; };
}

function createSnowAccumulation(scene,cherry) {
  const snowMaterial=new THREE.MeshStandardMaterial({color:0xf7fbfc,roughness:.96}); const root=new THREE.Group(); root.name='SnowAccumulation';
  box(root,[25.35,.065,23.35],[0,.17,0],snowMaterial,'snow-covered-ground');
  const addRoof=(width,depth,height,x,y,z)=>{ const slope=Math.hypot(width/2,height),angle=Math.atan2(height,width/2),offset=.255,group=new THREE.Group(); group.position.set(x,y,z); group.name='SnowCoveredRoof';
    const left=box(group,[slope+.12,.115,depth+.34],[-width/4-Math.sin(angle)*offset,height/2+Math.cos(angle)*offset,0],snowMaterial,'snow-roof-left'); left.rotation.z=angle; left.userData.cutawayRoofSide='left';
    const right=box(group,[slope+.12,.115,depth+.34],[width/4+Math.sin(angle)*offset,height/2+Math.cos(angle)*offset,0],snowMaterial,'snow-roof-right'); right.rotation.z=-angle; right.userData.cutawayRoofSide='right';
    box(group,[.38,.16,depth+.42],[0,height+.26,0],snowMaterial,'snow-covered-ridge'); root.add(group); };
  addRoof(10.1,8.05,3.05,.2,6.8,-3);
  addRoof(4.55,4.28,1.7,5.2,6.5,-3.55);
  // Match the real raised grass geometry and place the snow above its top face.
  // The previous flat circles sat below the grass extrusion and were invisible.
  const lawnSnow=roundedIrregularPatch([[-11,-8],[-4.8,-9.2],[-3.2,-4.4],[-5.5,-1.6],[-10.8,-2.4]],.045,snowMaterial); lawnSnow.name='SnowOnLeftLawn'; lawnSnow.position.y=.265; root.add(lawnSnow);
  const rightSnow=roundedIrregularPatch([[5.6,2.1],[10.8,1.4],[11.2,7.1],[7.4,8.4],[5.4,6.2]],.045,snowMaterial); rightSnow.name='SnowOnRightLawn'; rightSnow.position.y=.305; root.add(rightSnow);
  const benchSnowGround=roundedIrregularPatch([[-10.7,4.1],[-5.5,4.25],[-4.9,8.65],[-8.9,9.25],[-10.9,7.45]],.04,snowMaterial); benchSnowGround.name='SnowUnderGardenBench'; benchSnowGround.position.y=.225; root.add(benchSnowGround);
  // The bench has three exposed snow-catching rails, matching the actual seat
  // and back slats from the garden model.
  const benchSnow=new THREE.Group(); benchSnow.name='SnowOnGardenBench'; benchSnow.position.set(-7.7,.18,6.6); benchSnow.rotation.y=-.22;
  for(const y of [.8,1.16,1.5]) box(benchSnow,[2.45,.04,.21],[0,y,0],snowMaterial,'snowy-bench-slat'); root.add(benchSnow);
  const lampSnowPositions=[[-9.7,5,1],...GATE_LAMP_POSITIONS.map(([x,z])=>[x,z,.9])];
  lampSnowPositions.forEach(([x,z,scale],index)=>{ const lampSnow=new THREE.Mesh(new THREE.CylinderGeometry(.48*scale,.34*scale,.075,12),snowMaterial); lampSnow.name=index?'SnowOnPathLamp':'SnowOnGardenLamp'; lampSnow.position.set(x,.18+3.01*scale,z); root.add(lampSnow); });
  // Use the tree's real branch tips in its own local space. This makes every
  // snow clump follow the canopy instead of floating beside it in world space.
  const anchors=(cherry.userData.blossomAnchors||cherry.userData.snowAnchors||[]).filter((_,index)=>index%3===0); const treeSnow=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.23,1),snowMaterial,Math.max(1,anchors.length)); treeSnow.name='SnowOnCherryTree'; const dummy=new THREE.Object3D(); let snowIndex=0;
  anchors.forEach((anchor,anchorIndex)=>{ const angle=anchorIndex*1.71; dummy.position.copy(anchor).add(new THREE.Vector3(Math.cos(angle)*.035,.36,Math.sin(angle)*.035)); dummy.scale.set(1.65,.34,1.35); dummy.rotation.y=angle; dummy.updateMatrix(); treeSnow.setMatrixAt(snowIndex++,dummy.matrix); }); treeSnow.count=snowIndex; treeSnow.visible=false; cherry.add(treeSnow);
  const flowerSnowPositions=[[-9,-1.3],[-7.6,-.9],[-8.5,8.2],[2.8,3.7],[5.6,3.3],[7.2,4.3],[8.8,3.7],[9.8,6.2],[7.4,7.2],[10,-5]];
  const flowerSnow=new THREE.InstancedMesh(new THREE.SphereGeometry(.13,8,6),snowMaterial,flowerSnowPositions.length*5); flowerSnow.name='SnowOnFlowerBeds'; let flowerIndex=0;
  flowerSnowPositions.forEach(([x,z],cluster)=>{ for(let n=0;n<5;n++){ const a=n*1.257+cluster; dummy.position.set(x+Math.cos(a)*(.22+n*.035),.72+(n%3)*.12,z+Math.sin(a)*(.22+n*.035)); dummy.scale.set(1.3,.42,1.05); dummy.updateMatrix(); flowerSnow.setMatrixAt(flowerIndex++,dummy.matrix); } }); flowerSnow.count=flowerIndex; root.add(flowerSnow);
  const car=scene.getObjectByName('SmallEuropeanLuxurySedan');
  let carSnow=null;
  if(car){
    carSnow=new THREE.Group(); carSnow.name='SnowOnLuxuryCar';
    box(carSnow,[1.56,.08,.82],[0,.72,-1.05],snowMaterial,'snow-car-hood');
    box(carSnow,[1.48,.06,1.68],[0,1.08,.02],snowMaterial,'snow-car-roof');
    box(carSnow,[1.46,.07,.55],[0,.7,1.18],snowMaterial,'snow-car-trunk');
    carSnow.visible=false; car.add(carSnow);
  }
  root.visible=false; scene.add(root); return weather=>{ const snowy=weather==='snow'; root.visible=snowy; treeSnow.visible=snowy; if(carSnow)carSnow.visible=snowy; };
}

function createRoofRunoff(scene) {
  const geometry=new THREE.BoxGeometry(.035,.48,.035), material=new THREE.MeshStandardMaterial({color:0xb9d9e3,transparent:true,opacity:.72,roughness:.2}); const count=42, drops=new THREE.InstancedMesh(geometry,material,count); drops.name='RoofRainRunoff'; const dummy=new THREE.Object3D(), lanes=[];
  for(let i=0;i<count;i++){ const roof=WEATHER_ROOFS[i%WEATHER_ROOFS.length]; lanes.push({roof,side:i%2?1:-1,phase:i*.113,zOffset:((i%7)/6-.5)*roof.d*.78}); }
  scene.add(drops);
  return (weather,time)=>{ drops.visible=weather==='rain'; if(weather!=='rain')return; lanes.forEach((lane,index)=>{ const p=(time*.9+lane.phase)%1, {roof,side,zOffset}=lane; const x=roof.x+side*(p*roof.w/2), y=roof.y+roof.h*(1-p)+.1, z=roof.z+zOffset; dummy.position.set(x,y,z); dummy.rotation.z=-side*Math.atan2(roof.h,roof.w/2); dummy.scale.y=.62+p*.65; dummy.updateMatrix(); drops.setMatrixAt(index,dummy.matrix); }); drops.instanceMatrix.needsUpdate=true; };
}

function createWeatherParticles(scene) {
  const rainCount=220,rainMaterial=new THREE.MeshStandardMaterial({color:0xb8d1dc,transparent:true,opacity:.72,roughness:.18,depthWrite:false}),rain=new THREE.InstancedMesh(new THREE.BoxGeometry(.025,.62,.025),rainMaterial,rainCount); rain.name='VerticalRainfall'; rain.instanceMatrix.setUsage(THREE.DynamicDrawUsage); rain.visible=false; scene.add(rain);
  const splashCount=rainCount*2,splash=new THREE.InstancedMesh(new THREE.SphereGeometry(.035,7,5),rainMaterial,splashCount); splash.name='RoofRainSplashes'; splash.instanceMatrix.setUsage(THREE.DynamicDrawUsage); splash.visible=false; scene.add(splash);
  const seeds=[]; for(let i=0;i<rainCount;i++){ const x=-12+((i*73)%241)/10,z=-11+((i*97)%221)/10; seeds.push({x,z,roofY:roofSurfaceAt(x,z),phase:(i*1.731)%15,speed:8.6+(i%6)*.55}); }

  const snowCount=150,snowGeometry=new THREE.BufferGeometry(),snowPositions=new Float32Array(snowCount*3),snowVelocity=[];
  for(let i=0;i<snowCount;i++){ snowPositions[i*3]=(i%15-7)*1.8; snowPositions[i*3+1]=3+(i%13)*.9; snowPositions[i*3+2]=(Math.floor(i/15)-5)*1.8; snowVelocity.push(.16+(i%5)*.025); }
  snowGeometry.setAttribute('position',new THREE.BufferAttribute(snowPositions,3)); const snow=new THREE.Points(snowGeometry,new THREE.PointsMaterial({color:0xffffff,size:.11,transparent:true,opacity:.9,depthWrite:false})); snow.name='Snowfall'; snow.visible=false; scene.add(snow);

  const dummy=new THREE.Object3D();
  return (weather,time)=>{
    const raining=weather==='rain'; rain.visible=raining; splash.visible=raining; snow.visible=weather==='snow';
    if(raining){ let splashIndex=0; seeds.forEach((seed,index)=>{ const targetY=seed.roofY??.12,distance=16-targetY,travel=(time*seed.speed+seed.phase)%distance,progress=travel/distance; dummy.position.set(seed.x,16-travel,seed.z); dummy.rotation.set(0,0,0); dummy.scale.set(1,1,1); dummy.updateMatrix(); rain.setMatrixAt(index,dummy.matrix);
        for(const side of [-1,1]){ if(seed.roofY!==null&&progress>.91){ const life=(progress-.91)/.09; dummy.position.set(seed.x+side*life*.15,seed.roofY+.04+Math.sin(life*Math.PI)*.13,seed.z+side*Math.sin(index)*life*.08); dummy.scale.setScalar(Math.max(.05,1-life)); } else { dummy.position.set(seed.x,-2,seed.z); dummy.scale.setScalar(0); } dummy.rotation.set(0,0,0); dummy.updateMatrix(); splash.setMatrixAt(splashIndex++,dummy.matrix); }
      }); rain.instanceMatrix.needsUpdate=true; splash.instanceMatrix.needsUpdate=true; }
    if(weather==='snow'){ const pos=snow.geometry.attributes.position; for(let i=0;i<snowCount;i++){ const n=i*3; pos.array[n+1]-=snowVelocity[i]*1.05; pos.array[n]+=Math.sin(time*1.8+i)*.012; pos.array[n+2]+=Math.cos(time+i)*.016; if(pos.array[n+1]<.08){ pos.array[n+1]=12+(i%7); pos.array[n]=(i%15-7)*1.8; pos.array[n+2]=(Math.floor(i/15)-5)*1.8; } } pos.needsUpdate=true; }
  };
}

function createWildlife(scene,materials) {
  const butterflies=new THREE.Group(); butterflies.name='GardenButterflies';
  for(let i=0;i<5;i++){
    const butterfly=new THREE.Group(), wingMaterial=new THREE.MeshStandardMaterial({color:i%2?0xf0c4d5:0xe9df9d,side:THREE.DoubleSide,roughness:.75});
    butterfly.add(new THREE.Mesh(new THREE.SphereGeometry(.035,8,6),materials.iron));
    for(const side of [-1,1]) for(const [radius,y] of [[.125,.06],[.085,-.075]]) { const wing=new THREE.Mesh(new THREE.CircleGeometry(radius,12),wingMaterial); wing.name='ButterflyWing'; wing.position.set(side*(radius*.72),y,0); wing.userData.side=side; butterfly.add(wing); }
    butterfly.userData={x:5.2+(i%3)*1.4,z:3.5+Math.floor(i/3)*1.25,phase:i*1.32}; butterflies.add(butterfly);
  }
  scene.add(butterflies);
  return time=>{ butterflies.children.forEach((butterfly,i)=>{ const p=butterfly.userData,a=time*1.15+p.phase; butterfly.position.set(p.x+Math.cos(a)*.56,.85+Math.sin(a*2)*.22,p.z+Math.sin(a)*.5); butterfly.rotation.y=-a; butterfly.children.filter(item=>item.name==='ButterflyWing').forEach(wing=>wing.rotation.y=wing.userData.side*(.28+Math.sin(time*10+i)*.48)); }); };
}

export function createLivingEnvironment(scene,materials,cherry) {
  const petals=createPetalDrift(scene), weatherParticles=createWeatherParticles(scene), snow=createSnowAccumulation(scene,cherry), runoff=createRoofRunoff(scene), wildlife=createWildlife(scene,materials); const weatherKey='cherry-conservatory-weather'; let weather='sunny';
  try { const saved=localStorage.getItem(weatherKey); if(['sunny','cloudy','rain','snow'].includes(saved))weather=saved; } catch { /* storage can be disabled in embedded previews */ }
  return { getWeather(){ return weather; }, setWeather(value){ if(['sunny','cloudy','rain','snow'].includes(value)){ weather=value; try { localStorage.setItem(weatherKey,weather); } catch { /* continue without persistence */ } } }, update(time) { cherry.rotation.z=Math.sin(time*.48)*.012; cherry.rotation.x=Math.cos(time*.37)*.006; petals(time); weatherParticles(weather,time); snow(weather); runoff(weather,time); wildlife(time); return weather; } };
}
