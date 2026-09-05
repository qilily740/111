import * as THREE from 'three';
import { box, mesh, roundedIrregularPatch } from '../utils/geometry.js';
import { createFountain } from './createFountain.js';

function createBench(materials) { const root=new THREE.Group(); root.name='GardenBench'; for(const y of [.72,1.08,1.42]) box(root,[2.4,.13,.18],[0,y,0],materials.stone); box(root,[2.5,.18,.62],[0,.62,.32],materials.stone); for(const x of [-1.05,1.05]) box(root,[.15,.65,.15],[x,.32,.28],materials.stone); return root; }
function createLamp(materials) { const root=new THREE.Group(); box(root,[.12,2.6,.12],[0,1.3,0],materials.iron); root.add(mesh(new THREE.CylinderGeometry(.2,.28,.48,6),materials.warmGlass,{position:[0,2.68,0]})); box(root,[.56,.1,.56],[0,2.95,0],materials.iron); return root; }
export const GATE_LAMP_POSITIONS=[[-2.55,11.25],[2.55,11.25]];

function createFenceSection(parent,materials,{length,x,z,rotation=0}) {
  const section=new THREE.Group(); section.name='CreamEuropeanFence'; section.position.set(x,0,z); section.rotation.y=rotation;
  box(section,[length,.18,.24],[0,.48,0],materials.stone,'fence-base');
  box(section,[length,.14,.22],[0,1.62,0],materials.stone,'fence-top-rail');
  const count=Math.max(2,Math.floor(length/.48)); for(let i=0;i<=count;i++){ const px=-length/2+i*(length/count); const spindle=mesh(new THREE.CylinderGeometry(.055,.075,1.0,10),materials.stone,{position:[px,1.05,0]}); section.add(spindle); }
  parent.add(section);
}

function createFrontGate(parent,materials) {
  const gate=new THREE.Group(); gate.name='EuropeanIronGate'; gate.position.set(0,0,10.62);
  for(const x of [-1.78,1.78]){ box(gate,[.42,2.05,.42],[x,1.08,0],materials.stone,'gate-pillar'); box(gate,[.58,.16,.58],[x,2.14,0],materials.stone,'gate-pillar-cap'); }
  box(gate,[3.12,.09,.12],[0,.55,0],materials.iron,'gate-lower-rail'); box(gate,[3.12,.09,.12],[0,1.62,0],materials.iron,'gate-upper-rail');
  for(let i=0;i<9;i++){ const x=-1.42+i*.355, height=1.28+(1-Math.abs(x)/1.42)*.48; box(gate,[.055,height,.07],[x,.55+height/2,0],materials.iron,'arched-gate-bar'); }
  box(gate,[.055,1.45,.09],[-.055,1.25,.02],materials.iron,'left-gate-edge'); box(gate,[.055,1.45,.09],[.055,1.25,.02],materials.iron,'right-gate-edge'); parent.add(gate);
}

export function createGarden(materials) {
  const root=new THREE.Group(); root.name='Garden';
  box(root,[26,.65,24],[0,-.34,0],materials.stoneDark,'diorama-base'); box(root,[25.3,.18,23.3],[0,.03,0],materials.paving,'courtyard-paving');
  const lawn=roundedIrregularPatch([[-11,-8],[-4.8,-9.2],[-3.2,-4.4],[-5.5,-1.6],[-10.8,-2.4]],.12,materials.sage); lawn.position.y=.13; root.add(lawn);
  const bed=roundedIrregularPatch([[5.6,2.1],[10.8,1.4],[11.2,7.1],[7.4,8.4],[5.4,6.2]],.16,materials.sage); bed.position.y=.13; root.add(bed);
  const pathPoints=[[-.6,11],[-1.4,8.6],[-.5,6.5],[-1.2,4.3],[0,2.2]]; for(let i=0;i<pathPoints.length;i++){ const [x,z]=pathPoints[i]; const stone=mesh(new THREE.CylinderGeometry(1.05+(i%2)*.15,1.05+(i%2)*.15,.11,10),materials.stone,{position:[x,.2,z],rotation:[0,(i%3)*.18,0]}); stone.scale.z=.62; root.add(stone); }
  const fountain=createFountain(materials); root.add(fountain);
  const bench=createBench(materials); bench.position.set(-7.7,.18,6.6); bench.rotation.y=-.22; root.add(bench);
  const lamp=createLamp(materials); lamp.position.set(-9.7,.18,5.0); root.add(lamp);
  GATE_LAMP_POSITIONS.forEach(([x,z])=>{ const gateLamp=createLamp(materials); gateLamp.name='GateLamp'; gateLamp.position.set(x,.18,z); gateLamp.scale.setScalar(.9); root.add(gateLamp); });
  createFenceSection(root,materials,{length:9.8,x:-6.85,z:10.7}); createFenceSection(root,materials,{length:9.8,x:6.85,z:10.7});
  createFenceSection(root,materials,{length:24,x:0,z:-10.7}); createFenceSection(root,materials,{length:21.4,x:-11.8,z:0,rotation:Math.PI/2}); createFenceSection(root,materials,{length:21.4,x:11.8,z:0,rotation:Math.PI/2});
  createFrontGate(root,materials);
  return root;
}
