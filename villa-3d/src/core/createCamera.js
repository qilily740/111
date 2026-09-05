import * as THREE from 'three';

export function createCamera(container) {
  const camera = new THREE.PerspectiveCamera(36,container.clientWidth/container.clientHeight,.1,120);
  camera.position.set(20,15,22);
  return camera;
}
