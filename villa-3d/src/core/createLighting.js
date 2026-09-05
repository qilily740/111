import * as THREE from 'three';

export function createLighting(scene) {
  const ambient=new THREE.AmbientLight(0xffffff,.42); scene.add(ambient);
  const hemi = new THREE.HemisphereLight(0xfffdf8,0x938b91,1.65); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfffbf3,2.25); sun.position.set(12,20,15); sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048); Object.assign(sun.shadow.camera,{left:-20,right:20,top:20,bottom:-20,near:1,far:60}); sun.shadow.bias=-.00015; scene.add(sun);
  return { ambient, hemi, sun };
}

export function setLightingMode(scene,lights,mode) {
  const evening=mode==='evening';
  scene.background.set(evening?0xe3dce0:0xfaf9f7);
  lights.ambient.intensity=evening?.24:.42;
  lights.hemi.intensity=evening?.88:1.65;
  lights.hemi.color.set(evening?0xe6dce3:0xfffdf8);
  lights.sun.intensity=evening?.72:2.25;
  lights.sun.color.set(evening?0xffd2ad:0xfffbf3);
}

export function setLightingFromLocalTime(scene,lights,date,weather='sunny') {
  const hour=date.getHours()+date.getMinutes()/60,solarProgress=THREE.MathUtils.clamp((hour-6)/12,0,1),daylight=hour>=6&&hour<=18?Math.sin(solarProgress*Math.PI):0;
  const cloudFactor=weather==='cloudy'?.68:weather==='rain'?.42:weather==='snow'?.76:1;
  const nightSky=new THREE.Color(weather==='rain'?0x222a31:0x292630),morningSky=new THREE.Color(0xf5e8df),daySky=new THREE.Color(0xfaf9f7),afternoonSky=new THREE.Color(0xf3e1d3),duskSky=new THREE.Color(0x8f7b86); let sky;
  if(hour<5.5||hour>=20)sky=nightSky.clone();
  else if(hour<7)sky=nightSky.clone().lerp(morningSky,(hour-5.5)/1.5);
  else if(hour<10)sky=morningSky.clone().lerp(daySky,(hour-7)/3);
  else if(hour<15)sky=daySky.clone();
  else if(hour<17.5)sky=daySky.clone().lerp(afternoonSky,(hour-15)/2.5);
  else if(hour<19)sky=afternoonSky.clone().lerp(duskSky,(hour-17.5)/1.5);
  else sky=duskSky.clone().lerp(nightSky,hour-19);
  if(daylight>.03&&weather==='rain')sky.lerp(new THREE.Color(0xaeb8bf),.36); if(daylight>.03&&weather==='snow')sky.lerp(new THREE.Color(0xeaf0f3),.5);
  const twilight=hour>=5.5&&hour<6?(hour-5.5)*2:hour>18&&hour<20?(20-hour)/2:0,ambientDay=Math.max(daylight,twilight*.32);
  scene.background.copy(sky); lights.ambient.intensity=.045+ambientDay*.36*cloudFactor; lights.hemi.intensity=.18+ambientDay*1.5*cloudFactor;
  const afternoonWarm=THREE.MathUtils.smoothstep(hour,14,18),morningWarm=1-THREE.MathUtils.smoothstep(hour,7,10),warmth=Math.max(afternoonWarm,morningWarm);
  lights.hemi.color.copy(new THREE.Color(0xcfd8e4).lerp(new THREE.Color(0xfffdf8),ambientDay)); lights.sun.intensity=(daylight*2.3)*cloudFactor; lights.sun.color.copy(new THREE.Color(0xfffbf3).lerp(new THREE.Color(0xffc89f),warmth));
  lights.sun.position.set(-22+solarProgress*44,3+daylight*23,14-Math.abs(solarProgress-.5)*8);
  return daylight;
}
