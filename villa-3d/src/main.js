import * as THREE from 'three';
import './style.css';
import './ui/ui.css';
import { createScene } from './core/createScene.js';
import { createRenderer } from './core/createRenderer.js';
import { createCamera } from './core/createCamera.js';
import { createControls } from './core/createControls.js';
import { createLighting, setLightingFromLocalTime } from './core/createLighting.js';
import { validateScene } from './core/validateScene.js';
import { createMaterials } from './materials/materials.js';
import { createHouse } from './house/createHouse.js';
import { createCutawayController } from './house/createCutawayController.js';
import { createFurnitureController } from './house/createFurnitureController.js';
import { createGarden } from './garden/createGarden.js';
import { createCherryTree } from './plants/createCherryTree.js';
import { populateGardenPlants } from './plants/createPlants.js';
import { createLivingEnvironment } from './environment/createLivingEnvironment.js';
import { createInterface } from './ui/interface.js';

const container=document.querySelector('#app');
const scene=createScene(); const renderer=createRenderer(container); const camera=createCamera(container); const controls=createControls(camera,renderer.domElement); const materials=createMaterials(); const lights=createLighting(scene);
const garden=createGarden(materials); scene.add(garden); const house=createHouse(materials); scene.add(house); const cherry=createCherryTree(materials); scene.add(cherry); populateGardenPlants(garden,materials);
const livingEnvironment=createLivingEnvironment(scene,materials,cherry);
const cutaway=createCutawayController(scene,house,camera);
const furnitureController=createFurnitureController(scene);
addEventListener('message',event=>{ const payload=event.data; if(payload?.type==='ideal-house-furnishing')furnitureController.apply(payload.items||{}); });
const interiorLights=[]; house.getObjectByName('HouseInterior')?.traverse(object=>{ if(object.isPointLight&&object.userData.interiorBaseIntensity)interiorLights.push(object); });
const warmLight=new THREE.PointLight(0xffc77d,4.2,10,2); warmLight.position.set(0,4,-.6); scene.add(warmLight);
const views={default:{p:[20,15,22],t:[0,4,-1.4]},front:{p:[0,9,30],t:[0,4,-2]},back:{p:[0,9,-32],t:[0,4,-2]},left:{p:[-31,9,-1],t:[0,4,-2]},right:{p:[31,9,-1],t:[0,4,-2]},top:{p:[0,38,-2],t:[0,0,-2]}};
function setView(name){ const view=views[name]||views.default; camera.position.set(...view.p); controls.target.set(...view.t); controls.update(); }
views.garden={p:[17,9,19],t:[2.6,1.3,3.2]};
let lastAmbienceKey='';
function getTimeTone(date){ const hour=date.getHours()+date.getMinutes()/60; if(hour<5.5||hour>=20)return 'night'; if(hour<10)return 'morning'; if(hour<15)return 'day'; if(hour<18)return 'afternoon'; return 'evening'; }
function publishAmbience(weather,daylight,date=new Date(),force=false){ const tone=getTimeTone(date), level=Math.round(daylight*10)/10, key=`${weather}:${tone}:${level}`; if(!force&&key===lastAmbienceKey)return; lastAmbienceKey=key; if(window.parent!==window)window.parent.postMessage({type:'ideal-house-ambience',weather,tone,daylight:level},'*'); }
const ui=createInterface({onViewChange:setView,onWeatherChange:weather=>{ livingEnvironment.setWeather(weather); publishAmbience(weather,0,new Date(),true); },onModeChange:mode=>cutaway.setEnabled(mode==='interior'),initialWeather:livingEnvironment.getWeather(),initialMode:'exterior'});
if(window.parent!==window)window.parent.postMessage({type:'ideal-house-ready'},'*');
function resize(){ const w=container.clientWidth,h=container.clientHeight; camera.aspect=w/h; camera.updateProjectionMatrix(); renderer.setSize(w,h); }
addEventListener('resize',resize); validateScene(scene);
let firstFrame=true; const clock=new THREE.Clock();
renderer.setAnimationLoop(()=>{ const time=clock.getElapsedTime(), weather=livingEnvironment.update(time), now=new Date(), daylight=setLightingFromLocalTime(scene,lights,now,weather); publishAmbience(weather,daylight,now); warmLight.intensity=1.7+(1-daylight)*4.4; interiorLights.forEach(light=>{ light.intensity=light.userData.interiorBaseIntensity*(.62+(1-daylight)*.72); }); controls.update(); cutaway.update(); renderer.render(scene,camera); if(firstFrame){firstFrame=false; requestAnimationFrame(()=>ui.hideLoading());} });
