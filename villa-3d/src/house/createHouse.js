import * as THREE from 'three';
import { box } from '../utils/geometry.js';
import { createGableRoof } from './roof/createGableRoof.js';
import { createArchedWindow } from './windows/createArchedWindow.js';
import { createCornice, createChimney, createWallTrim, createCornerQuoins, createRoseVine } from './details.js';
import { createGardenCar } from './createCar.js';
import { createEntrance } from './createEntrance.js';
import { createBayTower } from './createBayTower.js';
import { createWallShell } from './createWallShell.js';
import { createInterior } from './createInterior.js';

export function createHouse(materials) {
  const root=new THREE.Group(); root.name='HouseRoot'; root.position.z=-3.0;
  const main=new THREE.Group(); main.name='MainBlock';
  createWallShell(main,{width:9.2,height:6.8,depth:7.2,center:[.2,3.4,0],material:materials.wall,prefix:'main'});
  const solidRightWall=main.getObjectByName('main-right-wall'); if(solidRightWall){ main.remove(solidRightWall); solidRightWall.geometry.dispose(); }
  const addConnectorWall=(size,position,name)=>{ const wall=box(main,size,position,materials.wall,name); wall.userData.cutawayFace='right'; };
  // The bay wing overlaps this side of the main house. Two stacked openings
  // provide a real route into it from both inhabited floors.
  addConnectorWall([.24,6.8,2.25],[4.68,3.4,-2.475],'main-right-wall');
  addConnectorWall([.24,6.8,3.45],[4.68,3.4,1.875],'main-right-wall-front-section');
  addConnectorWall([.24,.3,1.5],[4.68,.15,-.6],'main-right-wall-lower-sill');
  addConnectorWall([.24,.87,1.5],[4.68,2.985,-.6],'main-right-wall-between-passages');
  addConnectorWall([.24,1.1,1.5],[4.68,6.25,-.6],'main-right-wall-upper-cap');
  box(main,[9.65,.28,7.2],[.2,.18,0],materials.stone,'main-plinth');
  createCornice(main,{width:9.65,depth:7.55,x:.2,y:3.35,materials}); createCornice(main,{width:9.75,depth:7.65,x:.2,y:6.72,materials});
  createWallTrim(main,{width:3.16,x:-2.86,y:.62,z:3.7,materials});
  createWallTrim(main,{width:3.56,x:3.06,y:.62,z:3.7,materials});
  createWallTrim(main,{width:9.28,x:.2,y:3.06,z:3.7,materials});
  createCornerQuoins(main,{x:-4.32,z:3.72,materials});
  createCornerQuoins(main,{x:4.72,z:3.72,materials});
  // 正立面只保留主入口两侧的二层窗，突出一层主入口与中央山墙。
  [[-2.55,3.63],[2.65,3.63]].forEach(([x,y])=>{ const window=createArchedWindow({width:1.32,height:2.25,materials}); window.position.set(x,y,3.64); window.userData.cutawayExteriorFace='front'; main.add(window); });
  const mainRoof=createGableRoof({width:10.1,depth:8.05,height:3.05,position:[.2,6.8,0],materials,name:'MainRoofGroup'}); main.add(mainRoof);
  const chimney=createChimney(materials); chimney.position.set(2.45,8.15,-1.1); main.add(chimney); root.add(main);
  const vine=createRoseVine(main,{x:-4.02,y:.72,z:3.78,materials}); if(vine)vine.userData.cutawayExteriorFace='front';
  root.add(createEntrance(materials),createGardenCar(materials),createBayTower(materials),createInterior(materials)); return root;
}
