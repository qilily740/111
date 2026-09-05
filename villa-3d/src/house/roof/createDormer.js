import * as THREE from 'three';
import { box } from '../../utils/geometry.js';
import { createGableRoof } from './createGableRoof.js';
import { createArchedWindow } from '../windows/createArchedWindow.js';

// A small independent roof projection: it breaks the main roof surface without
// sharing faces or creating a hole in the primary roof group.
export function createDormer(materials) {
  const root=new THREE.Group(); root.name='Dormer';
  box(root,[1.5,1.12,.72],[0,.54,0],materials.wall,'dormer-wall');
  const sill=box(root,[1.32,.1,.16],[0,.1,.4],materials.stone,'dormer-sill');
  const window=createArchedWindow({width:.68,height:.82,materials}); window.position.set(0,.22,.39); window.scale.setScalar(.8); root.add(window,sill);
  const roof=createGableRoof({width:1.84,depth:.94,height:.64,position:[0,1.08,0],materials,name:'DormerRoofGroup',tiles:false}); root.add(roof);
  return root;
}
