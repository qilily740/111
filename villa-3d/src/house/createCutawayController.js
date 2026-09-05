import * as THREE from 'three';

export function createCutawayController(scene,house,camera) {
  const interior=house.getObjectByName('HouseInterior');
  const walls=[],facades=[],roofSides=[],roofGables=[];
  scene.traverse(object=>{
    if(object.userData.cutawayFace) walls.push(object);
    if(object.userData.cutawayExteriorFace) facades.push(object);
    if(object.userData.cutawayRoofSide) roofSides.push(object);
    if(object.userData.cutawayRoofGable) roofGables.push(object);
  });
  let enabled=false,lastFace='',lastRoofSide='';
  const center=new THREE.Vector3(),cameraPosition=new THREE.Vector3();
  function update(force=false) {
    house.getWorldPosition(center); camera.getWorldPosition(cameraPosition);
    const dx=cameraPosition.x-center.x,dy=cameraPosition.y-center.y,dz=cameraPosition.z-center.z,horizontal=Math.hypot(dx,dz);
    const face=dy>horizontal*1.25?'top':Math.abs(dz)>=Math.abs(dx)?(dz>=0?'front':'back'):(dx>=0?'right':'left');
    const roofSide=dx>=0?'right':'left';
    if(!force&&face===lastFace&&roofSide===lastRoofSide)return;
    lastFace=face; lastRoofSide=roofSide;
    walls.forEach(object=>{ object.visible=!enabled||object.userData.cutawayFace!==face; });
    facades.forEach(object=>{ object.visible=!enabled||object.userData.cutawayExteriorFace!==face; });
    roofSides.forEach(object=>{ object.visible=!enabled||(face!=='top'&&object.userData.cutawayRoofSide!==roofSide); });
    roofGables.forEach(object=>{ object.visible=!enabled||object.userData.cutawayRoofGable!==face; });
  }
  return {
    setEnabled(value){ enabled=Boolean(value); if(interior)interior.visible=enabled; lastFace=''; lastRoofSide=''; update(true); },
    getEnabled(){ return enabled; },
    update
  };
}
