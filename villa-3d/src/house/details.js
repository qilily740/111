import * as THREE from 'three';
import { box, mesh } from '../utils/geometry.js';

export function createCornice(parent,{width,depth,x=0,y,z=0,materials}) { box(parent,[width,.18,depth],[x,y,z],materials.stone,'cornice'); }
export function createPilaster(parent,{x,z,y=0,height=6.6,materials}) { box(parent,[.28,height,.24],[x,y+height/2,z],materials.stone,'pilaster'); box(parent,[.44,.18,.38],[x,y+.09,z],materials.stone); box(parent,[.46,.2,.4],[x,y+height-.1,z],materials.stone); }

export function createWallTrim(parent,{width,x=0,y,z,materials}) { box(parent,[width,.075,.16],[x,y,z],materials.stone,'fine-wall-trim'); }

export function createCornerQuoins(parent,{x,z,y=.38,height=5.9,materials}) { for(let level=0;level<6;level++){ const offset=level%2?.03:0; box(parent,[.31,.34,.18],[x+offset,y+.26+level*(height/6),z],materials.stone,'corner-stone'); } }

export function createRoseVine(parent,{x,y,z,materials}) {
  const root=new THREE.Group(); root.name='RoseVine'; const points=[[0,0,0],[.12,.72,.02],[-.09,1.4,.04],[.15,2.05,.02],[.04,2.72,.03]];
  for(let i=1;i<points.length;i++){ const stem=mesh(new THREE.CylinderGeometry(.025,.04,.76,7),materials.bark,{position:[x+(points[i][0]+points[i-1][0])/2,y+(points[i][1]+points[i-1][1])/2,z]}); stem.rotation.z=(points[i][0]-points[i-1][0])*.45; root.add(stem); }
  const leafGeometry=new THREE.SphereGeometry(.09,7,5), bloomGeometry=new THREE.SphereGeometry(.12,9,6);
  for(let i=0;i<8;i++){ const px=x+Math.sin(i*2.31)*.18, py=y+.38+i*.31; const leaf=mesh(leafGeometry,materials.leaf,{position:[px,py,z+.04]}); leaf.scale.set(1.3,.55,.6); root.add(leaf); if(i===2||i===5||i===7) root.add(mesh(bloomGeometry,materials.rose[i%materials.rose.length],{position:[px+.04,py+.08,z+.08]})); }
  parent.add(root); return root;
}

export function createChimney(materials) {
  const root=new THREE.Group(); root.name='Chimney';
  box(root,[1.0,.28,.9],[0,.14,0],materials.roofEdge); box(root,[.7,2.15,.62],[0,1.32,0],materials.stone);
  box(root,[.92,.18,.82],[0,2.44,0],materials.roofEdge); box(root,[1.05,.18,.95],[0,2.65,0],materials.stone);
  for(const x of [-.23,.23]) box(root,[.16,.38,.16],[x,2.92,0],materials.roofEdge); box(root,[.85,.14,.55],[0,3.15,0],materials.stone); return root;
}

export function createLantern(materials) {
  const root=new THREE.Group(); root.name='Lantern'; box(root,[.08,.7,.08],[0,.2,0],materials.iron); const glow=mesh(new THREE.CylinderGeometry(.14,.2,.5,6),materials.warmGlass,{position:[0,-.35,0]}); root.add(glow); box(root,[.42,.08,.42],[0,-.64,0],materials.iron); return root;
}

export function createJulietBalcony(width,materials) {
  const root=new THREE.Group(); root.name='JulietBalcony'; box(root,[width,.08,.12],[0,.85,.3],materials.iron); box(root,[width,.08,.32],[0,0,.18],materials.stone);
  for(let i=0;i<7;i++){ const x=-width/2+.12+i*(width-.24)/6; const bar=mesh(new THREE.CylinderGeometry(.025,.025,.82,8),materials.iron,{position:[x,.42,.3]}); root.add(bar); }
  return root;
}
