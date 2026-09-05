import * as THREE from 'three';

function createPlasterTexture(baseColor=[203,197,206]) {
  const size=48, data=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++) for(let x=0;x<size;x++){ const index=(y*size+x)*4; const grain=((x*17+y*31+x*y*3)%9)-4; data[index]=baseColor[0]+grain; data[index+1]=baseColor[1]+grain; data[index+2]=baseColor[2]+grain; data[index+3]=255; }
  const texture=new THREE.DataTexture(data,size,size,THREE.RGBAFormat); texture.colorSpace=THREE.SRGBColorSpace; texture.wrapS=texture.wrapT=THREE.RepeatWrapping; texture.repeat.set(3,3); texture.needsUpdate=true; return texture;
}

export function createMaterials() {
  const standard = (color, roughness=.85, metalness=0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const plaster=createPlasterTexture(),pinkPlaster=createPlasterTexture([185,133,145]);
  return {
    wall: new THREE.MeshStandardMaterial({ color:0xffffff, map:plaster, roughness:.94 }),
    gableWall: new THREE.MeshStandardMaterial({color:0xffffff,map:pinkPlaster,roughness:.94}),
    stone: standard(0xeeeae5,.82),
    stoneDark: standard(0xd8d1ca,.9),
    roof: new THREE.MeshStandardMaterial({color:0xa97984,roughness:.8}),
    roofTile: new THREE.MeshPhysicalMaterial({color:0xb98591,roughness:.58,metalness:0,clearcoat:.22,clearcoatRoughness:.5}),
    roofEdge: standard(0xe7d9d8,.82),
    wood: standard(0xad817b,.72),
    doorEdge: standard(0xaaa5a2,.76),
    iron: standard(0x50494d,.5,.42),
    glass: new THREE.MeshPhysicalMaterial({ color:0xcfe1df, transparent:true, opacity:.42, roughness:.12, transmission:.35, thickness:.08 }),
    warmGlass: new THREE.MeshPhysicalMaterial({ color:0xffd9a6, transparent:true, opacity:.58, roughness:.18, transmission:.12, emissive:0xffb86f, emissiveIntensity:.26 }),
    water: new THREE.MeshPhysicalMaterial({ color:0x9fcbd1, transparent:true, opacity:.72, roughness:.12, transmission:.22 }),
    waterJet: new THREE.MeshPhysicalMaterial({ color:0xe8fbff, transparent:true, opacity:.68, roughness:.05, transmission:.3 }),
    paving: standard(0xded8d1,.95),
    pavingWet: standard(0xcfcbd0,.55),
    sage: standard(0x8f9b87,.96),
    leaf: standard(0x667961,.92),
    bark: standard(0x67514f,1),
    rose: [0xd8a8b6,0xe8bdc7,0xc8a9c3,0xf0d8d8].map(c=>standard(c,.88)),
    blossom: [0xf3c5d5,0xefb5ca,0xf7d7e1,0xfae8ec].map(c=>standard(c,.9)),
    brass: standard(0xa88d68,.42,.48),
  };
}
