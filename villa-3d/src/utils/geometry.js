import * as THREE from 'three';

export function mesh(geometry,material,{position=[0,0,0],rotation=[0,0,0],name=''}={}) {
  const object = new THREE.Mesh(geometry,material); object.position.set(...position); object.rotation.set(...rotation); object.name=name;
  object.castShadow=true; object.receiveShadow=true; return object;
}

export function box(parent,size,position,material,name='') {
  const object=mesh(new THREE.BoxGeometry(...size),material,{position,name}); parent.add(object); return object;
}

export function cylinderBetween(a,b,radius,material,radial=10) {
  const start=new THREE.Vector3(...a), end=new THREE.Vector3(...b), delta=end.clone().sub(start);
  const object=mesh(new THREE.CylinderGeometry(radius*.72,radius,delta.length(),radial),material,{position:start.clone().add(end).multiplyScalar(.5).toArray()});
  object.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize()); return object;
}

export function roundedIrregularPatch(points,height,material) {
  const shape=new THREE.Shape(); shape.moveTo(points[0][0],points[0][1]); points.slice(1).forEach(p=>shape.lineTo(p[0],p[1])); shape.closePath();
  const object=mesh(new THREE.ExtrudeGeometry(shape,{depth:height,bevelEnabled:true,bevelSize:.08,bevelThickness:.05,bevelSegments:2}),material);
  object.rotation.x=-Math.PI/2; return object;
}
