import * as T from './three.module.js';

// Local device time. These are artistic daylight reference hours, not a
// location-specific sunrise forecast; no location permission is requested.
const stops=[
  [0,'#080f20','#172235',.12,0,1,'#b9caff'],
  [5,'#101c33','#344557',.16,0,1,'#b9caff'],
  [6,'#667f9e','#d8b69a',.48,.25,.7,'#ffd2a4'],
  [7.5,'#83b3da','#dbe7eb',1.25,1.7,0,'#ffead1'],
  [12,'#3289e0','#a6d5ef',1.65,2.5,0,'#fff8ee'],
  [16,'#4489d0','#e7d2aa',1.35,1.9,0,'#fff0dc'],
  [17,'#487cbc','#f3cb88',1.05,1.25,.1,'#ffdb9e'],
  [17.8,'#73859e','#ecad70',.75,.65,.35,'#ffc17e'],
  [18.3,'#74758f','#df906b',.49,.23,.7,'#ffae70'],
  [18.8,'#666483','#bb8294',.32,0,1,'#b9caff'],
  [19.3,'#394c72','#796d91',.22,0,1,'#b9caff'],
  [19.8,'#203554','#45506b',.17,0,1,'#b9caff'],
  [21,'#080f20','#172235',.12,0,1,'#b9caff'],
  [24,'#080f20','#172235',.12,0,1,'#b9caff']
].map(([hour,top,bottom,ambient,sun,lamps,sunColor])=>({hour,top:new T.Color(top),bottom:new T.Color(bottom),ambient,sun,lamps,sunColor:new T.Color(sunColor)}));

export function sampleDaylight(date=new Date()){
  const hour=date.getHours()+date.getMinutes()/60+date.getSeconds()/3600+date.getMilliseconds()/3600000;
  const index=stops.findIndex(s=>s.hour>hour);
  const a=stops[Math.max(0,index-1)],b=stops[index];
  const t=T.MathUtils.smoothstep(hour,a.hour,b.hour);
  const mix=key=>T.MathUtils.lerp(a[key],b[key],t);
  return {hour,top:a.top.clone().lerp(b.top,t),bottom:a.bottom.clone().lerp(b.bottom,t),
    sunColor:a.sunColor.clone().lerp(b.sunColor,t),ambient:mix('ambient'),sun:mix('sun'),lamps:mix('lamps')};
}

export function applyDaylight({scene,skyMaterial,hemi,sun,warm,interiorGlow,lampLights,renderer,ground},date=new Date()){
  const state=sampleDaylight(date);
  skyMaterial.uniforms.top.value.copy(state.top);
  skyMaterial.uniforms.bottom.value.copy(state.bottom);
  const dawn=Math.max(0,1-Math.abs(state.hour-6.3)/1.7),dusk=Math.max(0,1-Math.abs(state.hour-18.1)/1.7);
  skyMaterial.uniforms.sunset.value=Math.max(dawn,dusk);
  skyMaterial.uniforms.night.value=state.hour<12?1-T.MathUtils.smoothstep(state.hour,5,6.5):T.MathUtils.smoothstep(state.hour,18.8,20.5);
  scene.background=null; scene.fog.color.copy(state.bottom);
  // Directional sunlight supplies the highlights; sky fill keeps shade legible.
  hemi.color.copy(state.top).lerp(new T.Color('#dceaff'),.45);
  hemi.groundColor.set('#857d70'); hemi.intensity=state.ambient*.48;
  sun.color.copy(state.sunColor); sun.intensity=state.sun*1.55;
  const angle=T.MathUtils.clamp((state.hour-6)/12.75,0,1)*Math.PI;
  // Keep a frontal component so afternoon light grazes the visible facade.
  sun.position.set(-Math.cos(angle)*22,3+Math.max(.5,Math.sin(angle)*18),16);
  sun.target.position.set(0,3,0);
  sun.target.updateMatrixWorld();
  skyMaterial.uniforms.sunDirection?.value.copy(sun.position).sub(sun.target.position).normalize();
  scene.environmentIntensity=T.MathUtils.lerp(.025,.65,T.MathUtils.smoothstep(state.ambient,.12,1.65));
  const evening=state.hour>=17.5&&state.hour<24?T.MathUtils.smoothstep(state.hour,17.5,18.75):0;
  warm.emissiveIntensity=evening*1.8;
  interiorGlow.emissiveIntensity=evening*3.2;
  interiorGlow.opacity=evening*.76;
  lampLights.forEach(light=>light.intensity=evening*1.65);
  renderer.toneMappingExposure=1.05;
  // Keep the distant ground and the lower sky on the same color ramp so the
  // horizon dissolves naturally instead of forming a hard painted line.
  if(ground?.material)ground.material.color.copy(state.bottom);
  return state;
}
