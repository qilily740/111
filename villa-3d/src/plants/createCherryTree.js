import * as THREE from 'three';
import { cylinderBetween, mesh } from '../utils/geometry.js';

const V=(x,y,z)=>new THREE.Vector3(x,y,z);

export function createCherryTree(materials) {
  const root=new THREE.Group(); root.name='CherryTree'; root.position.set(-9.1,.05,-6.7);
  const trunk=new THREE.Group(); trunk.name='Trunk'; root.add(trunk);
  const segments=[[V(0,0,0),V(.15,2.7,.08),.5],[V(.15,2.65,.08),V(-.08,5.15,.2),.37],[V(-.08,5.1,.2),V(.18,7.25,.05),.25]];
  segments.forEach(([a,b,r])=>trunk.add(cylinderBetween(a.toArray(),b.toArray(),r,materials.bark,14)));
  const mainBranches=new THREE.Group(); mainBranches.name='MainBranches'; root.add(mainBranches);
  const branches=[
    [V(0,3.9,.1),V(-3.15,7.8,.1)],[V(0,4.1,.1),V(3.1,7.65,.8)],[V(0,4.55,.1),V(-1.35,9.75,-1.4)],
    [V(.1,4.7,.1),V(1.85,9.9,.15)],[V(0,5.05,.1),V(-.42,10.45,1.25)],[V(.1,4.75,.1),V(2.55,8.75,-1.7)]
  ];
  const twigTips=[];
  branches.forEach(([a,b],i)=>{ mainBranches.add(cylinderBetween(a.toArray(),b.toArray(),.2,materials.bark,12)); const direction=b.clone().sub(a);
    for(let j=0;j<4;j++){ const start=a.clone().lerp(b,.43+j*.14); const side=V((j-1.5)*.56+(i%2?.35:-.35),.92+(j%2)*.42,((i+j)%3-1)*.66); const tip=start.clone().add(side); mainBranches.add(cylinderBetween(start.toArray(),tip.toArray(),.08,materials.bark,9)); twigTips.push(tip,b.clone().add(V((j-1.5)*.32,(j%2)*.3,((i+j)%2?-.42:.42)))); }
  });
  const geo=new THREE.IcosahedronGeometry(.5,2), dummy=new THREE.Object3D(), blossomAnchors=[]; const perMaterial=Math.ceil(twigTips.length*9/materials.blossom.length);
  materials.blossom.forEach((material,mi)=>{ const instanced=new THREE.InstancedMesh(geo,material,perMaterial); instanced.name='BlossomClusters'; let index=0;
    for(let i=mi;i<twigTips.length*9;i+=materials.blossom.length){ const tip=twigTips[i%twigTips.length], ring=Math.floor(i/twigTips.length); const a=i*2.399; const spread=.2+ring*.105; dummy.position.copy(tip).add(V(Math.cos(a)*spread,(ring%4-1.2)*.18,Math.sin(a)*spread)); blossomAnchors.push(dummy.position.clone()); const s=.72+(i%6)*.085; dummy.scale.set(s*1.18,s,s); dummy.rotation.set(a*.13,a*.21,a*.08); dummy.updateMatrix(); instanced.setMatrixAt(index++,dummy.matrix); }
    instanced.count=index; instanced.castShadow=true; root.add(instanced);
  });
  // Consumers such as snow effects use these actual local branch tips instead
  // of guessing scene coordinates, keeping overlays attached to the canopy.
  root.userData.snowAnchors=twigTips.map(tip=>tip.clone());
  root.userData.blossomAnchors=blossomAnchors;
  const petals=new THREE.InstancedMesh(new THREE.CircleGeometry(.08,6),materials.blossom[2],34); for(let i=0;i<34;i++){ const a=i*2.4,r=.5+(i%9)*.24; dummy.position.set(Math.cos(a)*r,.03,Math.sin(a)*r); dummy.rotation.set(-Math.PI/2,0,a); dummy.scale.set(1,.55,1); dummy.updateMatrix(); petals.setMatrixAt(i,dummy.matrix); } root.add(petals);
  return root;
}
