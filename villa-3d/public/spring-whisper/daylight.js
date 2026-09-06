import * as T from './three.module.js';

// Local device time. These are artistic daylight reference hours, not a
// location-specific sunrise forecast; no location permission is requested.
const stops=[
  [0,'#080f20','#172235',.12,0,1,'#b9caff'],
  [5,'#101c33','#344557',.16,0,1,'#b9caff'],
  [6,'#667f9e','#d8b69a',.48,.25,.7,'#ffd2a4'],
  [7.5,'#83b3da','#dbe7eb',1.25,1.7,0,'#ffead1'],
  [12,'#70a9d6','#d3e5ee',1.65,2.5,0,'#fff8ee'],
  [16,'#81b0d1','#dce4e5',1.35,1.9,0,'#fff0dc'],
  [17.5,'#8cabc5','#e7c5a4',.85,.85,.22,'#ffd2a2'],
  [18.5,'#566b8b','#b99285',.4,.12,.8,'#ffbd8a'],
  [19.5,'#1b2a46','#3b4b63',.19,0,1,'#b9caff'],
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

export function applyDaylight({scene,skyMaterial,hemi,sun,warm,lampLights,renderer,ground},date=new Date()){
  const state=sampleDaylight(date);
  skyMaterial.uniforms.top.value.copy(state.top);
  skyMaterial.uniforms.bottom.value.copy(state.bottom);
  skyMaterial.uniforms.sunset.value=0;
  scene.background.copy(state.bottom); scene.fog.color.copy(state.bottom);
  hemi.color.set('#dceaff'); hemi.groundColor.set('#857d70'); hemi.intensity=state.ambient;
  sun.color.copy(state.sunColor); sun.intensity=state.sun;
  const angle=(state.hour-6)/12*Math.PI;
  sun.position.set(-Math.cos(angle)*18,Math.max(.5,Math.sin(angle)*22),8);
  warm.emissiveIntensity=.025+state.lamps*1.8;
  lampLights.forEach(light=>light.intensity=state.lamps*1.65);
  renderer.toneMappingExposure=1.05;
  // Keep the distant ground and the lower sky on the same color ramp so the
  // horizon dissolves naturally instead of forming a hard painted line.
  ground.material.color.copy(state.bottom);
  return state;
}
