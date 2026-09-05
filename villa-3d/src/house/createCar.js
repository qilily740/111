import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { box, mesh, cylinderBetween } from '../utils/geometry.js';

export function createGardenCar(materials) {
  // Calibrated against the entrance: about 5.5m long, 2.1m wide, 1.5m tall.
  const root=new THREE.Group(); root.name='GardenCar'; root.position.set(-6.25,0,.3); root.scale.set(1.08,1.2,1.62);
  const car=new THREE.Group(); car.name='SmallEuropeanLuxurySedan'; car.position.y=.24; car.rotation.y=Math.PI;
  const paint=new THREE.MeshPhysicalMaterial({color:0x625a65,roughness:.28,metalness:.12,clearcoat:.72,clearcoatRoughness:.24});
  const paintDark=new THREE.MeshStandardMaterial({color:0x4d4650,roughness:.48,metalness:.16});
  const trim=new THREE.MeshStandardMaterial({color:0xe7e0d8,roughness:.3,metalness:.7});
  const tire=new THREE.MeshStandardMaterial({color:0x29272b,roughness:.8,metalness:.04});
  const windowGlass=new THREE.MeshPhysicalMaterial({color:0x3c4249,transparent:true,opacity:.76,roughness:.12,metalness:.15,transmission:.12});
  const leather=new THREE.MeshStandardMaterial({color:0xe8ded1,roughness:.86});
  const lamp=new THREE.MeshStandardMaterial({color:0xfff2c9,emissive:0xffd78a,emissiveIntensity:1.05,roughness:.25});
  const tailLamp=new THREE.MeshStandardMaterial({color:0x8f4c59,emissive:0x4c1d2a,emissiveIntensity:.45,roughness:.35});

  // Long, low three-box silhouette: bonnet, passenger cell and short trunk.
  const lowerBody=new THREE.Mesh(new RoundedBoxGeometry(1.82,.48,3.28,5,.13),paint); lowerBody.name='car-lower-body'; lowerBody.castShadow=true; lowerBody.receiveShadow=true; car.add(lowerBody);
  box(car,[1.62,.25,.92],[0,.56,-1.05],paint,'car-long-bonnet');
  box(car,[1.55,.22,.62],[0,.55,1.18],paint,'car-short-trunk');
  box(car,[1.56,.52,1.72],[0,.78,.02],paintDark,'car-roof-shell');
  box(car,[1.46,.36,1.56],[0,.82,.01],windowGlass,'car-cabin-glass');
  box(car,[1.88,.1,3.0],[0,.48,.02],trim,'car-waist-chrome');

  // Four distinct doors and restrained silver handles.
  for(const x of [-.915,.915]){
    for(const z of [-.52,.48]){
      box(car,[.025,.3,.84],[x,.53,z],paintDark,'car-door-seam');
      box(car,[.035,.035,.2],[x*1.008,.69,z-.02],trim,'car-door-handle');
    }
    box(car,[.035,.38,1.28],[x,.8,.02],windowGlass,'car-side-window');
    for(const z of [-.66,.68]) box(car,[.045,.04,.08],[x,.93,z],trim,'car-window-pillar');
    box(car,[.14,.12,.3],[x*1.02,.67,-.84],trim,'car-side-mirror');
  }
  box(car,[1.38,.04,.05],[0,.94,-.8],trim,'car-windshield-trim');
  box(car,[1.3,.04,.05],[0,.94,.84],trim,'car-rear-glass-trim');

  // Deep grille, thin lamps and a real bumper, with no emblem or logo.
  box(car,[.86,.34,.08],[0,.45,-1.68],paintDark,'car-front-bumper');
  box(car,[.62,.36,.09],[0,.49,-1.73],trim,'car-vertical-grille');
  for(let i=-2;i<=2;i++) box(car,[.045,.3,.1],[i*.11,.5,-1.79],paintDark,'car-grille-bar');
  for(const x of [-.58,.58]) box(car,[.34,.12,.06],[x,.66,-1.69],lamp,'car-slim-led-headlamp');
  box(car,[1.16,.08,.06],[0,.43,1.69],paintDark,'car-rear-bumper');
  for(const x of [-.55,.55]) box(car,[.38,.12,.055],[x,.6,1.7],tailLamp,'car-tail-lamp');
  box(car,[.74,.05,.04],[0,.62,1.73],trim,'car-trunk-chrome');

  // Four independent rubber tires with visible multi-spoke silver wheels.
  for(const x of [-.98,.98]) for(const z of [-.98,.98]){
    car.add(mesh(new THREE.CylinderGeometry(.32,.32,.18,24),tire,{position:[x,.08,z],rotation:[0,0,Math.PI/2],name:'car-independent-tire'}));
    car.add(mesh(new THREE.CylinderGeometry(.2,.2,.19,20),trim,{position:[x,.08,z],rotation:[0,0,Math.PI/2],name:'car-multi-spoke-wheel'}));
    car.add(mesh(new THREE.CylinderGeometry(.075,.075,.2,16),paintDark,{position:[x,.08,z],rotation:[0,0,Math.PI/2],name:'car-wheel-hub'}));
    for(let spoke=0;spoke<8;spoke++){ const a=spoke*Math.PI/4; car.add(cylinderBetween([x,.08+Math.cos(a)*.15,z+Math.sin(a)*.15],[x,.08+Math.cos(a)*.06,z+Math.sin(a)*.06],.018,paintDark,6)); }
  }

  // Cream interior visible through the smoked glass: seats, dash and wheel.
  for(const z of [-.48,.52]) box(car,[1.18,.18,.38],[0,.53,z],leather,'car-leather-seat');
  box(car,[1.35,.2,.32],[0,.7,-.72],leather,'car-dashboard');
  box(car,[1.0,.12,.28],[0,.57,-.76],leather,'car-center-console');
  car.add(mesh(new THREE.TorusGeometry(.13,.025,8,18),trim,{position:[-.42,.75,-.68],rotation:[Math.PI/2,0,0],name:'car-steering-wheel'}));
  root.add(car);
  return root;
}
