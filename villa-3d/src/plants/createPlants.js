import * as THREE from 'three';
import { mesh } from '../utils/geometry.js';

export function createFlowerCluster(materials,{position=[0,0,0],scale=1,color=0}={}) {
  const root=new THREE.Group(); root.position.set(...position); root.scale.setScalar(scale); root.name='FlowerCluster';
  const leafGeo=new THREE.IcosahedronGeometry(.38,1); for(const p of [[0,.3,0],[-.28,.25,.12],[.25,.34,-.1]]){ const leaf=mesh(leafGeo,materials.leaf,{position:p}); leaf.scale.set(1.25,.8,1); root.add(leaf); }
  const bloomGeo=new THREE.SphereGeometry(.13,10,7); for(let i=0;i<9;i++){ const a=i*2.4, r=.16+(i%3)*.13; const flower=mesh(bloomGeo,materials.rose[(color+i)%materials.rose.length],{position:[Math.cos(a)*r,.48+(i%4)*.09,Math.sin(a)*r]}); flower.scale.set(1.15,.72,1.05); root.add(flower); }
  return root;
}

export function populateGardenPlants(parent,materials) {
  const clusters=[[-9,-1.3,1.35,0],[-7.6,-.9,1,2],[-8.5,8.2,1.25,3],[2.8,3.7,.8,1],[5.6,3.3,1.3,0],[7.2,4.3,1.1,1],[8.8,3.7,.9,3],[9.8,6.2,1.25,0],[7.4,7.2,1.05,2],[10,-5,.95,1]];
  clusters.forEach(([x,z,s,c])=>parent.add(createFlowerCluster(materials,{position:[x,.22,z],scale:s,color:c})));
}
