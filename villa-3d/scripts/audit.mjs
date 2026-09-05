import * as THREE from 'three';
import { createMaterials } from '../src/materials/materials.js';
import { createHouse } from '../src/house/createHouse.js';
import { createGarden } from '../src/garden/createGarden.js';
import { createCherryTree } from '../src/plants/createCherryTree.js';
import { validateScene } from '../src/core/validateScene.js';
import { createCutawayController } from '../src/house/createCutawayController.js';

const materials=createMaterials(), scene=new THREE.Scene();
const house=createHouse(materials), garden=createGarden(materials), tree=createCherryTree(materials); scene.add(house,garden,tree); scene.updateMatrixWorld(true);
const issues=validateScene(scene), required=['MainRoofGroup','BayTowerRoofGroup','GardenCar'];
for(const name of required){ const roof=scene.getObjectByName(name); if(!roof||new THREE.Box3().setFromObject(roof).isEmpty()) issues.push(`${name} 为空`); }
const fountain=scene.getObjectByName('Fountain'), trunk=scene.getObjectByName('Trunk');
const houseBox=new THREE.Box3().setFromObject(house), fountainBox=new THREE.Box3().setFromObject(fountain), trunkBox=new THREE.Box3().setFromObject(trunk);
if(houseBox.intersectsBox(fountainBox)) issues.push('喷泉与房屋相交'); if(houseBox.intersectsBox(trunkBox)) issues.push('树干与房屋相交');
const camera=new THREE.PerspectiveCamera(); camera.position.set(0,9,30); const cutaway=createCutawayController(scene,house,camera); cutaway.setEnabled(true); cutaway.update(true);
if(!house.getObjectByName('HouseInterior')?.visible) issues.push('室内模式未显示室内模型');
const interior=house.getObjectByName('HouseInterior'),interiorLights=[]; interior?.traverse(object=>{ if(object.isPointLight)interiorLights.push(object); });
if(interiorLights.length<4) issues.push('室内有效灯光数量不足');
if(interiorLights.length>6) issues.push('室内点光源过多，可能增加手机发热');
for(const name of ['MainStaircase','ground-bay-passage-arched-trim','upper-bay-passage-arched-trim','GardenCar','car-long-bonnet','car-vertical-grille','car-independent-tire','car-multi-spoke-wheel','LivingRoomSofa','UpstairsBed','BookShelf','BedroomVanity','BedroomWardrobe','bedroom-wall-mirror','EntranceShoeCabinet','entrance-rug','sofa-back-console-top','BaySmallLounge','BayBathroom','bathroom-bathtub','bathroom-tub-water','bathroom-sink','bathroom-toilet-bowl','bathroom-mirror','LivingRoomTelevision','KitchenRefrigerator','built-in-oven','cooktop-burner','bedside-phone','living-pendant-light','dining-pendant-light','kitchen-pendant-light','left-bedside-lamp-light','study-desk-lamp-light']) if(!scene.getObjectByName(name)) issues.push(`室内缺少 ${name}`);
if(!scene.getObjectByName('spiral-stair-step-17')||!scene.getObjectByName('spiral-stair-center-column')) issues.push('欧式旋转楼梯结构不完整');
if(scene.getObjectByName('CentralGableRoofGroup')) issues.push('主屋顶内部仍存在中央小屋顶');
if(scene.getObjectByName('central-upper-gable')) issues.push('二楼至屋顶仍存在中央长方体残留');
if(scene.getObjectByName('main-front-wall')?.visible) issues.push('正面剖面未隐藏主楼前墙');
if(!scene.getObjectByName('main-back-wall')?.visible) issues.push('正面剖面错误隐藏主楼背墙');
if(scene.getObjectByName('EntranceBlock')?.visible) issues.push('正面剖面未隐藏入口立面');
for(const [face,position,wallName] of [['back',[0,9,-32],'main-back-wall'],['left',[-31,9,-3],'main-left-wall'],['right',[31,9,-3],'main-right-wall']]) { camera.position.set(...position); cutaway.update(true); if(scene.getObjectByName(wallName)?.visible) issues.push(`${face} 剖面未隐藏对应墙体`); }
camera.position.set(0,38,-3); cutaway.update(true); if(scene.getObjectByName('roof-left-slope')?.visible||scene.getObjectByName('roof-right-slope')?.visible) issues.push('俯视剖面未移除两侧屋面');
cutaway.setEnabled(false);
if(!scene.getObjectByName('main-front-wall')?.visible||house.getObjectByName('HouseInterior')?.visible) issues.push('切回室外后模型状态未恢复');
console.log(JSON.stringify({issues,house:{min:houseBox.min.toArray(),max:houseBox.max.toArray()},fountain:{min:fountainBox.min.toArray(),max:fountainBox.max.toArray()},trunk:{min:trunkBox.min.toArray(),max:trunkBox.max.toArray()}},null,2));
if(issues.length) process.exitCode=1;
