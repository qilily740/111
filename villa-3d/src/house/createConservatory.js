import * as THREE from 'three';
import { box, mesh } from '../utils/geometry.js';

export function createConservatory(materials) {
  const root=new THREE.Group(); root.name='Conservatory'; root.position.set(-6.25,0,-2.45);
  box(root,[4.2,.22,5.4],[0,.12,0],materials.stoneDark,'terrace-floor');
  const postXs=[-2,0,2], zFaces=[-2.55,2.55];
  postXs.forEach(x=>zFaces.forEach(z=>box(root,[.11,3.1,.11],[x,1.66,z],materials.stone,'frame-post')));
  [-2,2].forEach(x=>[-1.7,0,1.7].forEach(z=>box(root,[.11,3.1,.11],[x,1.66,z],materials.stone,'side-post')));
  for(let i=0;i<4;i++){ const x=-1.5+i; box(root,[.88,2.75,.07],[x,1.55,2.57],materials.glass,'front-glass'); box(root,[.88,2.75,.07],[x,1.55,-2.57],materials.glass,'back-glass'); }
  for(let i=0;i<3;i++){ const z=-1.65+i*1.65; box(root,[.07,2.75,1.45],[-2.03,1.55,z],materials.glass,'side-glass'); }
  const roofGroup=new THREE.Group(); roofGroup.name='ConservatoryRoofGroup'; roofGroup.position.y=3.25;
  const roofA=box(roofGroup,[2.35,.1,5.55],[-1.03,.52,0],materials.glass,'glass-roof-left'); roofA.rotation.z=.45;
  const roofB=box(roofGroup,[2.35,.1,5.55],[1.03,.52,0],materials.glass,'glass-roof-right'); roofB.rotation.z=-.45;
  box(roofGroup,[.12,.14,5.65],[0,1.02,0],materials.stone,'glass-ridge'); for(let z=-2.45;z<=2.45;z+=.8) box(roofGroup,[4.35,.07,.07],[0,.5,z],materials.stone,'roof-rib'); root.add(roofGroup);
  const table=mesh(new THREE.CylinderGeometry(.6,.6,.08,24),materials.stone,{position:[0,.84,.3]}); root.add(table); box(root,[.12,.78,.12],[0,.42,.3],materials.iron);
  for(const x of [-.95,.95]){ box(root,[.55,.08,.55],[x,.48,.3],materials.wood); box(root,[.08,.9,.55],[x,.9,.58],materials.wood); }
  // Greenhouse details: a slim planting bench and varied pots make the glass
  // annex read clearly as a flower room rather than an empty side extension.
  box(root,[1.3,.12,.45],[-1.18,1.35,-1.72],materials.wood,'potting-bench-top');
  for(const x of [-1.7,-.66]) box(root,[.09,1.2,.09],[x,.72,-1.72],materials.wood,'potting-bench-leg');
  const makePot=(x,z,scale=1,flower=materials.rose[0])=>{
    const pot=mesh(new THREE.CylinderGeometry(.16*scale,.12*scale,.25*scale,12),materials.stoneDark,{position:[x,.36*scale,z]}); root.add(pot);
    const leaves=mesh(new THREE.SphereGeometry(.26*scale,9,7),materials.leaf,{position:[x,.58*scale,z]}); leaves.scale.set(1,.65,1); root.add(leaves);
    const bloom=mesh(new THREE.SphereGeometry(.16*scale,9,7),flower,{position:[x+.03,.76*scale,z+.02]}); root.add(bloom);
  };
  makePot(-1.55,-1.72,.85,materials.rose[1]); makePot(-.95,-1.72,.7,materials.rose[2]);
  makePot(1.55,-1.78,1.05,materials.rose[0]); makePot(1.45,1.65,.8,materials.rose[3]); makePot(-1.5,1.62,.75,materials.rose[1]);
  return root;
}
