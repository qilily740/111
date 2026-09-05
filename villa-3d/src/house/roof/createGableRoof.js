import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { box, mesh } from '../../utils/geometry.js';

function createGableWall(width,height,depth,material,z) {
  const shape=new THREE.Shape(); shape.moveTo(-width/2,0); shape.lineTo(width/2,0); shape.lineTo(0,height); shape.closePath();
  return mesh(new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false}),material,{position:[0,0,z]});
}

function addTiles(parent,{width,depth,height,materials}) {
  const slope=Math.hypot(width/2,height),angle=Math.atan2(height,width/2),tileAlong=THREE.MathUtils.clamp(slope/13,.28,.44),tileAcross=THREE.MathUtils.clamp(depth/16,.25,.4),cols=Math.max(8,Math.ceil(slope/(tileAlong*.88))+1),rows=Math.max(9,Math.ceil(depth/(tileAcross*.9))+1);
  const slabSource=new RoundedBoxGeometry(tileAlong*1.01,.072,tileAcross*1.01,3,Math.min(.028,tileAlong*.075)),lipSource=new RoundedBoxGeometry(tileAlong*.12,.035,tileAcross*1.015,2,.012),dummy=new THREE.Object3D();
  for(const side of [-1,1]) { const parts=[]; for(let row=0;row<rows;row++) for(let col=0;col<cols;col++){
    const u=col/(cols-1),v=row/(rows-1),distance=u*slope,x=side*distance*Math.cos(angle),y=height-distance*Math.sin(angle),normalX=side*Math.sin(angle),normalY=Math.cos(angle),stagger=col%2?tileAcross*.44:0;
    dummy.position.set(x+normalX*.145,y+normalY*.145,(v-.5)*depth+stagger); dummy.rotation.set(0,0,-side*angle); dummy.scale.set(1,1,1); dummy.updateMatrix(); const slab=slabSource.clone(); slab.applyMatrix4(dummy.matrix); parts.push(slab);
    const lip=lipSource.clone(); lip.translate(side*tileAlong*.43,.052,0); lip.applyMatrix4(dummy.matrix); parts.push(lip);
  }
  const merged=mergeGeometries(parts,false),tiles=mesh(merged,materials.roofTile,{name:`refined-ceramic-roof-tiles-${side<0?'left':'right'}`}); tiles.userData.cutawayRoofSide=side<0?'left':'right'; tiles.frustumCulled=false; parent.add(tiles); }
}

export function createGableRoof({width,depth,height,position=[0,0,0],materials,name='GableRoof',tiles=true,gableMaterial=materials.gableWall}) {
  const root=new THREE.Group(); root.name=name; root.position.set(...position);
  const slope=Math.hypot(width/2,height), angle=Math.atan2(height,width/2);
  const leftSlope=box(root,[slope,.22,depth+.35],[-width/4,height/2,0],materials.roof,'roof-left-slope'); leftSlope.rotation.z=angle; leftSlope.userData.cutawayRoofSide='left';
  const rightSlope=box(root,[slope,.22,depth+.35],[width/4,height/2,0],materials.roof,'roof-right-slope'); rightSlope.rotation.z=-angle; rightSlope.userData.cutawayRoofSide='right';
  box(root,[.2,.22,depth+.55],[0,height+.02,0],materials.roofEdge,'ridge');
  box(root,[.16,.22,depth+.48],[-width/2-.04,-.02,0],materials.roofEdge,'left-eave').rotation.z=angle;
  box(root,[.16,.22,depth+.48],[width/2+.04,-.02,0],materials.roofEdge,'right-eave').rotation.z=-angle;
  for(const z of [-depth/2-.06,depth/2+.06]){ const left=box(root,[slope,.11,.13],[-width/4,height/2,z],materials.roofEdge,'fascia'); left.rotation.z=angle; const right=box(root,[slope,.11,.13],[width/4,height/2,z],materials.roofEdge,'fascia'); right.rotation.z=-angle; }
  for(let i=0;i<Math.max(5,Math.round(depth/.45));i++){ const tile=mesh(new THREE.CylinderGeometry(.13,.13,.32,8),materials.roofEdge,{position:[0,height+.14,-depth/2+.25+i*.45],rotation:[Math.PI/2,0,0],name:'ridge-tile'}); root.add(tile); }
  const front=createGableWall(width-.08,height-.03,.16,gableMaterial,depth/2+.08); front.name='front-gable-wall'; front.userData.cutawayRoofGable='front'; const back=createGableWall(width-.08,height-.03,.16,gableMaterial,-depth/2-.24); back.name='back-gable-wall'; back.userData.cutawayRoofGable='back'; root.add(front,back);
  if(tiles) addTiles(root,{width,depth,height,materials}); return root;
}
