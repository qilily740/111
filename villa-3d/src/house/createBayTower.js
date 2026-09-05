import * as THREE from 'three';
import { box } from '../utils/geometry.js';
import { createArchedWindow } from './windows/createArchedWindow.js';
import { createGableRoof } from './roof/createGableRoof.js';
import { createWallShell } from './createWallShell.js';

export function createBayTower(materials) {
  const root=new THREE.Group(); root.name='BayTower'; root.position.set(5.2,0,-.55);
  createWallShell(root,{width:4.05,height:6.5,depth:3.85,center:[0,3.25,0],material:materials.wall,prefix:'bay'});
  const sharedWall=root.getObjectByName('bay-left-wall'); if(sharedWall){ root.remove(sharedWall); sharedWall.geometry.dispose(); }
  box(root,[4.35,.2,4.15],[0,.12,0],materials.stone,'bay-plinth'); box(root,[4.32,.22,4.12],[0,6.45,0],materials.stone,'bay-cornice');
  for(const y of [.55,3.55]){ const window=createArchedWindow({width:1.18,height:2.25,materials}); window.position.set(.58,y,1.98); window.userData.cutawayExteriorFace='front'; root.add(window); }
  const roof=createGableRoof({width:4.55,depth:4.28,height:1.7,position:[0,6.5,0],materials,name:'BayTowerRoofGroup'}); root.add(roof);
  return root;
}
