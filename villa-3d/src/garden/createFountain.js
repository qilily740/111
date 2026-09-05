import * as THREE from 'three';
import { mesh } from '../utils/geometry.js';

export function createFountain(materials) {
  const root=new THREE.Group(); root.name='Fountain'; root.position.set(4.25,0,5.15);
  const basin=mesh(new THREE.CylinderGeometry(1.55,1.68,.34,48),materials.stone,{position:[0,.25,0]}); basin.scale.z=.72; root.add(basin);
  const inset=mesh(new THREE.CylinderGeometry(1.3,1.3,.12,48),materials.pavingWet,{position:[0,.44,0]}); inset.scale.z=.72; root.add(inset);
  const water=mesh(new THREE.CylinderGeometry(1.18,1.18,.07,48),materials.water,{position:[0,.53,0]}); water.scale.z=.72; root.add(water);
  const pedestal=mesh(new THREE.CylinderGeometry(.25,.46,1.05,24),materials.stone,{position:[0,1.0,0]}); root.add(pedestal);
  const lower=mesh(new THREE.CylinderGeometry(.68,.36,.2,32),materials.stone,{position:[0,1.5,0]}); root.add(lower);
  const stem=mesh(new THREE.CylinderGeometry(.1,.16,.72,20),materials.stone,{position:[0,1.9,0]}); root.add(stem);
  const upper=mesh(new THREE.CylinderGeometry(.4,.2,.16,28),materials.stone,{position:[0,2.24,0]}); root.add(upper);
  const nozzle=new THREE.Vector3(0,2.43,0);
  for(let i=0;i<8;i++){ const a=i*Math.PI/4; const end=new THREE.Vector3(Math.cos(a)*.98,.58,Math.sin(a)*.66); const control=new THREE.Vector3(Math.cos(a)*.48,3.15,Math.sin(a)*.32); const curve=new THREE.QuadraticBezierCurve3(nozzle,control,end); const stream=mesh(new THREE.TubeGeometry(curve,18,.025,6,false),materials.waterJet); stream.name='parabolic-water-stream'; root.add(stream); }
  return root;
}
