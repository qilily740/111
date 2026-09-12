import assert from 'node:assert/strict';
import * as T from '../public/interior-preview/three.module.js';
import {createInteriorPreview} from '../public/interior-preview/interior.js';
const buttons=[];
globalThis.document={createElement(tag){if(tag==='canvas')return {width:0,height:0,getContext(){return {fillRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){}}}};const el={style:{},append(){},textContent:'',onclick:null};if(tag==='button')buttons.push(el);return el;},body:{append(){}}};
const scene=new T.Scene(),house=new T.Group(),renderer={},camera=new T.PerspectiveCamera();scene.add(house);
const original=new T.Mesh(new T.BoxGeometry(6.6,6.5,5.6),new T.MeshStandardMaterial());original.position.set(0,3.25,-.7);house.add(original);
const preview=createInteriorPreview(scene,house,renderer,camera);
for(const position of [[0,7,26],[0,7,-26],[-26,7,0],[26,7,0]]){camera.position.set(...position);preview.update();assert.equal(original.visible,false);assert.equal(preview.root.visible,true)}
const names=[];let count=0;preview.root.traverse(o=>{if(o.isMesh){count++;const a=o.geometry.attributes.position.array;assert.ok(Array.from(a).every(Number.isFinite))}if(o.userData.dimensions)names.push(o.name)});
assert.ok(names.length>=13);
const stair=preview.stairs.userData.stair;assert.ok(Math.abs(stair.risers*stair.rise+.48-3.4)<1e-9);
assert.equal(preview.stairs.children.filter(o=>/tread/.test(o.name)).length,18);
buttons.find(b=>b.textContent==='一楼').onclick();preview.update();assert.equal(preview.floors[1].visible,false);
buttons.find(b=>b.textContent==='二楼').onclick();preview.update();assert.equal(preview.floors[0].visible,false);assert.equal(preview.floors[1].visible,true);
buttons.find(b=>b.textContent==='剖视：开').onclick();preview.update();assert.equal(original.visible,true);assert.equal(preview.root.visible,false);
console.log(`PASS: ${count} interior meshes, ${names.length} dimensioned furniture instances; four camera directions, floor switching, 18 stair risers and exterior restore.`);
