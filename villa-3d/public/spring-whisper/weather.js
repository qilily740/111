import * as T from './three.module.js';
import {createSurfaceWeather} from './weather-surfaces.js?v=20260907-weather-flow-2';

function seeded(index){
  const value=Math.sin(index*917.13+41.7)*43758.5453;
  return value-Math.floor(value);
}

export function createWeatherSystem(scene,house){
  const reflectiveGlass=new Set();house.traverse(o=>{if(o.isMesh&&o.material?.isMeshPhysicalMaterial&&o.material.transmission>0)reflectiveGlass.add(o.material);});
  const surfaces=createSurfaceWeather(scene,house);
  const ready=fetch(new URL('./weather-assets.json',import.meta.url)).then(r=>{if(!r.ok)throw new Error('Weather assets unavailable');return r.json();}).then(data=>{
    const assets=new Map(data.meshes.map(m=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(m.positions,3));g.setIndex(m.indices);g.computeVertexNormals();return [m.name,g];}));
    surfaces.setAssets(assets);
    snow.geometry.dispose();snow.geometry=assets.get('snowcap');
    for(const cluster of clouds.children){cluster.clear();const cloud=new T.Mesh(assets.get('cloud'),cloudMaterial);cloud.scale.set(1.6,.8,1.5);cloud.castShadow=true;cloud.receiveShadow=true;cluster.add(cloud);}
  }).catch(error=>{console.error('Blender weather assets failed to load',error);});
  const clouds=new T.Group();clouds.name='WeatherClouds';
  const cloudMaterial=new T.MeshStandardMaterial({color:0xdce1e4,roughness:1,transparent:true,opacity:.88});
  const cloudGeometry=new T.SphereGeometry(1,10,7);
  for(let i=0;i<9;i++){
    const cluster=new T.Group();cluster.position.set((seeded(i+4100)-.5)*30,10+seeded(i+4200)*4,(seeded(i+4300)-.5)*25);
    for(let j=0;j<4;j++){const puff=new T.Mesh(cloudGeometry,cloudMaterial);puff.position.set((j-1.5)*1.15,seeded(i*7+j)*.55,(seeded(i*11+j)-.5)*.8);puff.scale.set(1.5+seeded(i+j)*.8,.62+seeded(i+j+1)*.28,1);cluster.add(puff);}
    cluster.userData.speed=.08+seeded(i+4400)*.07;clouds.add(cluster);
  }
  clouds.visible=false;scene.add(clouds);
  const rainCount=650,rainPositions=new Float32Array(rainCount*6);
  for(let i=0;i<rainCount;i++){
    const x=(seeded(i)-.5)*34,y=seeded(i+700)*19,z=(seeded(i+1400)-.5)*34,j=i*6;
    rainPositions.set([x,y,z,x+.025,y-.48,z+.02],j);
  }
  const rainGeometry=new T.BufferGeometry();rainGeometry.setAttribute('position',new T.BufferAttribute(rainPositions,3));
  const rain=new T.LineSegments(rainGeometry,new T.LineBasicMaterial({color:0xb9d5e8,transparent:true,opacity:.5,depthWrite:false}));rain.name='WeatherRain';rain.visible=false;scene.add(rain);

  const snowCount=520,snowPositions=new Float32Array(snowCount*3);
  for(let i=0;i<snowCount;i++)snowPositions.set([(seeded(i+2200)-.5)*34,seeded(i+2800)*19,(seeded(i+3400)-.5)*34],i*3);
  const snowGeometry=new T.BufferGeometry();snowGeometry.setAttribute('position',new T.BufferAttribute(snowPositions,3));
  const snow=new T.InstancedMesh(new T.SphereGeometry(1,6,4),new T.MeshStandardMaterial({color:0xf5f9ff,roughness:.85}),snowCount);snow.name='WeatherSnow';snow.visible=false;snow.frustumCulled=false;scene.add(snow);const flake=new T.Object3D();

  let type='sunny';
  const rainFloor=Array.from({length:rainCount},(_,i)=>surfaces.sample(rainPositions[i*6],rainPositions[i*6+2])?.point.y??0);
  const snowFloor=Array.from({length:snowCount},(_,i)=>surfaces.sample(snowPositions[i*3],snowPositions[i*3+2])?.point.y??0);
  return {
    ready,
    set(next){type=next;clouds.visible=next!=='sunny';cloudMaterial.opacity=next==='cloudy'?.22:next==='rain'?.16:.12;rain.visible=next==='rain';snow.visible=next==='snow';},
    get(){return type;},
    update(delta,time){
      surfaces.update(delta,time,type);
      if(clouds.visible)for(const cloud of clouds.children){cloud.position.x+=cloud.userData.speed*delta;if(cloud.position.x>18)cloud.position.x=-18;}
      if(rain.visible){const p=rainGeometry.attributes.position;for(let i=0;i<rainCount;i++){const j=i*6;let y=p.array[j+1]-delta*10;if(y<rainFloor[i]+.5)y=19;p.array[j+1]=y;p.array[j+4]=y-.48;}p.needsUpdate=true;}
      if(snow.visible){const p=snowGeometry.attributes.position;for(let i=0;i<snowCount;i++){const j=i*3;p.array[j+1]-=delta*(.48+seeded(i)*.35);if(p.array[j+1]<snowFloor[i]+.12)p.array[j+1]=19;flake.position.set(p.array[j],p.array[j+1],p.array[j+2]);flake.rotation.set(time*.4+i,time*.25+i*.7,i*.9);flake.scale.setScalar(.022+seeded(i)*.02);flake.updateMatrix();snow.setMatrixAt(i,flake.matrix);}snow.instanceMatrix.needsUpdate=true;}
    },
    applyLighting(state,{scene,skyMaterial,hemi,sun,renderer}){
      const config={sunny:[1,1,45,95,1.05],cloudy:[.28,.92,28,68,1],rain:[.1,.8,20,52,.96],snow:[.22,1.05,24,60,1.02]}[type];
      sun.intensity*=config[0];hemi.intensity*=config[1];scene.fog.near=config[2];scene.fog.far=config[3];renderer.toneMappingExposure*=config[4];
      skyMaterial.uniforms.cloudiness.value={sunny:0,cloudy:.7,rain:.92,snow:.8}[type];
      skyMaterial.uniforms.storm.value=type==='rain'?1:type==='cloudy'?.42:type==='snow'?.28:0;
      skyMaterial.uniforms.snowy.value=type==='snow'?1:0;
      const day=T.MathUtils.smoothstep(state.ambient,.12,1.65);
      scene.environmentIntensity=(.025+.3*day)*config[1];
      sun.shadow.radius=type==='sunny'?2:5;
      skyMaterial.uniforms.sunset.value*=type==='sunny'?1:type==='cloudy'?.5:.2;
      reflectiveGlass.forEach(material=>material.envMapIntensity=(.04+day*1.11)*config[1]);
      if(type!=='sunny'){
        const top=new T.Color(type==='rain'?'#536474':type==='snow'?'#aebcca':'#8997a1').multiplyScalar(.025+.975*day);
        const bottom=new T.Color(type==='rain'?'#879096':type==='snow'?'#d8dfe3':'#c1c5c5').multiplyScalar(.035+.965*day);
        const strength=type==='cloudy'?.48:.7;
        skyMaterial.uniforms.top.value.lerp(top,strength);skyMaterial.uniforms.bottom.value.lerp(bottom,strength);
        scene.fog.color.copy(skyMaterial.uniforms.bottom.value);
      }
      return state;
    }
  };
}
