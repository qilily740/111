import * as THREE from 'three';
import { box, mesh } from '../utils/geometry.js';

export function createEntrance(materials) {
  const root=new THREE.Group(); root.name='EntranceBlock'; root.userData.cutawayExteriorFace='front';
  // Keep the entrance flush with the main facade. The former upper-gable box
  // became an exposed rectangular column after its small roof was removed.
  const door=new THREE.Group(); door.name='FlushMainDoor';
  const archShape=(width,height)=>{ const radius=width/2,straight=height-radius,shape=new THREE.Shape(); shape.moveTo(-radius,0); shape.lineTo(radius,0); shape.lineTo(radius,straight); shape.absarc(0,straight,radius,0,Math.PI,false); shape.closePath(); return shape; };
  const shape=archShape(2.16,2.58), surround=archShape(2.44,2.8); surround.holes.push(archShape(2.22,2.64));
  door.add(mesh(new THREE.ExtrudeGeometry(surround,{depth:.055,bevelEnabled:true,bevelSize:.015,bevelThickness:.015,bevelSegments:2}),materials.stone,{position:[0,.09,3.605],name:'white-arched-door-frame'}));
  door.add(mesh(new THREE.ExtrudeGeometry(shape,{depth:.045,bevelEnabled:true,bevelSize:.012,bevelThickness:.012,bevelSegments:2}),materials.stoneDark,{position:[0,.12,3.615],name:'grey-white-arched-double-door'}));
  box(door,[.075,2.61,.035],[-.055,1.425,3.705],materials.stone,'left-center-door-edge');
  box(door,[.075,2.61,.035],[.055,1.425,3.705],materials.stone,'right-center-door-edge');
  root.add(door);
  return root;
}
