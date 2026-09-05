import * as THREE from 'three';

export function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xfaf9f7);
  scene.environment = null;
  return scene;
}
