import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function createControls(camera,domElement) {
  const controls = new OrbitControls(camera,domElement);
  controls.target.set(0,4,-1.4); controls.enableDamping=true; controls.dampingFactor=.07;
  controls.minDistance=16; controls.maxDistance=48; controls.maxPolarAngle=Math.PI*.49;
  controls.enablePan=true; controls.screenSpacePanning=false; controls.update();
  return controls;
}
