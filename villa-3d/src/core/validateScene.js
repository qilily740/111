import * as THREE from 'three';

export function validateScene(scene) {
  scene.updateMatrixWorld(true);
  const issues=[]; const required=['HouseRoot','HouseInterior','MainRoofGroup','BayTowerRoofGroup','GardenCar','Fountain','CherryTree'];
  required.forEach(name=>{ if(!scene.getObjectByName(name)) issues.push(`缺少 ${name}`); });
  scene.traverse(object=>{ if(!object.isMesh&&!object.isInstancedMesh) return; const box=new THREE.Box3().setFromObject(object); if(!Number.isFinite(box.min.x)||!Number.isFinite(box.max.y)) issues.push(`${object.name||object.type} 边界异常`); if(box.min.y<-.7) issues.push(`${object.name||object.type} 低于底座`); });
  const house=scene.getObjectByName('HouseRoot'), treeTrunk=scene.getObjectByName('Trunk'), fountain=scene.getObjectByName('Fountain');
  if(house&&treeTrunk&&new THREE.Box3().setFromObject(house).intersectsBox(new THREE.Box3().setFromObject(treeTrunk))) issues.push('樱花树树干与建筑边界相交');
  if(house&&fountain&&new THREE.Box3().setFromObject(house).intersectsBox(new THREE.Box3().setFromObject(fountain))) issues.push('喷泉与建筑边界相交');
  if(issues.length) console.warn('[Villa geometry audit]',issues); else console.info('[Villa geometry audit] passed'); return issues;
}
