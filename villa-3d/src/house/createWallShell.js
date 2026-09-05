import { box } from '../utils/geometry.js';

function taggedWall(parent,size,position,material,name,face) {
  const wall=box(parent,size,position,material,name);
  wall.userData.cutawayFace=face;
  return wall;
}

export function createWallShell(parent,{width,height,depth,center=[0,0,0],material,prefix='house',thickness=.24}) {
  const [x,y,z]=center;
  taggedWall(parent,[width,height,thickness],[x,y,z+depth/2-thickness/2],material,`${prefix}-front-wall`,'front');
  taggedWall(parent,[width,height,thickness],[x,y,z-depth/2+thickness/2],material,`${prefix}-back-wall`,'back');
  taggedWall(parent,[thickness,height,depth-thickness*2],[x-width/2+thickness/2,y,z],material,`${prefix}-left-wall`,'left');
  taggedWall(parent,[thickness,height,depth-thickness*2],[x+width/2-thickness/2,y,z],material,`${prefix}-right-wall`,'right');
}
