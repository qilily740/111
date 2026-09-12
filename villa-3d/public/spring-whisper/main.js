import * as T from './three.module.js';
import {createInteriorPreview} from './interior.js?v=20260908-scene-perf-7';
import {createSkyMaterial} from './sky.js?v=20260907-reference-sky-5';
import {OrbitControls} from './OrbitControls.js';
import {createBlenderFountain} from './fountain.js';
import {applyDaylight} from './daylight.js?v=20260907-reference-sky-5';
import {createWeatherSystem} from './weather.js?v=20260907-reference-sky-5';
const scene=new T.Scene();scene.background=null;scene.fog=new T.Fog('#d9d9d9',45,95);
const skyMaterial=createSkyMaterial();const sky=new T.Mesh(new T.SphereGeometry(78,48,24),skyMaterial);sky.name='SpringWhisperSky';scene.add(sky);
const renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});renderer.setClearColor(0x000000,0);renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<700?1.15:1.35));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=T.SRGBColorSpace;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;document.querySelector('#scene').appendChild(renderer.domElement);
const camera=new T.PerspectiveCamera(36,innerWidth/innerHeight,.1,140);camera.position.set(16,12,22);const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,3,0);controls.enableDamping=true;controls.minDistance=10;controls.maxDistance=43;controls.maxPolarAngle=Math.PI/2-.025;controls.autoRotateSpeed=.5;
const hemi=new T.HemisphereLight(0xfff3e7,0x8d8b99,2.3);scene.add(hemi);const sun=new T.DirectionalLight(0xffead9,3.2);sun.position.set(-10,18,12);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-13,right:13,top:13,bottom:-13,near:1,far:50});sun.shadow.bias=-.0005;sun.shadow.normalBias=.03;scene.add(sun);
const house=new T.Group();scene.add(house);const plantBarriers=[];function plantBarrier(object){object.updateWorldMatrix(true,true);plantBarriers.push(new T.Box3().setFromObject(object));return object;}
function surfaceTexture(base,accent,repeatX=4,repeatY=4){const size=128,c=new T.Color(base).convertLinearToSRGB(),a=new T.Color(accent).convertLinearToSRGB(),data=new Uint8Array(size*size*4);for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=(y*size+x)*4,grain=(Math.sin(x*12.7+y*3.1)+Math.sin(y*19.3-x*4.7))*.025,line=(y%18<1||x%32===0)?.24:0,col=c.clone().lerp(a,Math.max(0,Math.min(.34,line+grain+.025)));data[i]=Math.round(col.r*255);data[i+1]=Math.round(col.g*255);data[i+2]=Math.round(col.b*255);data[i+3]=255;}const texture=new T.DataTexture(data,size,size,T.RGBAFormat);texture.wrapS=T.RepeatWrapping;texture.wrapT=T.RepeatWrapping;texture.repeat.set(repeatX,repeatY);texture.colorSpace=T.SRGBColorSpace;texture.needsUpdate=true;return texture;}
function reflectionEnvironment(){const w=256,h=128,data=new Uint8Array(w*h*4),sky=new T.Color('#86a8c8'),horizon=new T.Color('#ddd8ce');for(let y=0;y<h;y++)for(let x=0;x<w;x++){const t=y/(h-1),cloud=Math.max(0,Math.sin(x*.11+y*.07)+Math.sin(x*.037-y*.13)-.8),col=sky.clone().lerp(horizon,t).lerp(new T.Color('#f1eee7'),Math.min(.55,cloud*.2)).convertLinearToSRGB(),i=(y*w+x)*4;data[i]=Math.round(col.r*255);data[i+1]=Math.round(col.g*255);data[i+2]=Math.round(col.b*255);data[i+3]=255;}const texture=new T.DataTexture(data,w,h,T.RGBAFormat);texture.mapping=T.EquirectangularReflectionMapping;texture.colorSpace=T.SRGBColorSpace;texture.needsUpdate=true;return texture;}
const environmentMap=reflectionEnvironment();scene.environment=environmentMap;scene.environmentIntensity=.7;
const wallTexture=surfaceTexture('#cfc7b7','#8f887d',3.5,4.5),trimTexture=surfaceTexture('#e3dacb','#aaa092',5,7),roofTexture=surfaceTexture('#8e8398','#625870',7,5);
const wallBump=surfaceTexture('#777777','#bcbcbc',3.5,4.5);wallBump.colorSpace=T.NoColorSpace;const roofBump=surfaceTexture('#888888','#333333',7,5);roofBump.colorSpace=T.NoColorSpace;
const mats={};function mat(n,c,extra={}){return mats[n]=new T.MeshStandardMaterial({color:c,roughness:.82,...extra})}
const cream=mat('cream','#d7cfbf',{map:wallTexture,bumpMap:wallBump,bumpScale:.075,roughness:.7}),trim=mat('trim','#eee5d7',{map:trimTexture,bumpMap:wallBump,bumpScale:.035,roughness:.58}),roof=mat('roof','#8e8398',{map:roofTexture,bumpMap:roofBump,bumpScale:.045,roughness:.42}),frame=mat('frame','#3d3541',{metalness:.58,roughness:.29}),glass=new T.MeshPhysicalMaterial({color:'#7897a3',metalness:.06,roughness:.09,transparent:true,opacity:.82,transmission:.16,ior:1.5,clearcoat:.9,clearcoatRoughness:.045,envMap:environmentMap,envMapIntensity:1.15,depthWrite:false}),dark=mat('dark','#27262b',{metalness:.78,roughness:.3}),stone=mat('stone','#aaa194',{map:trimTexture,bumpMap:wallBump,bumpScale:.045,roughness:.72}),wood=mat('wood','#6f513d',{roughness:.58}),water=mat('water','#97b6b8',{metalness:.45,roughness:.12}),warm=mat('warm','#f6d6a0',{emissive:'#ffb856',emissiveIntensity:0}),interiorGlow=new T.MeshStandardMaterial({color:'#7d4f2e',emissive:'#ff9f45',emissiveIntensity:0,roughness:.42,transparent:true,opacity:0,side:T.DoubleSide}),green=mat('green','#536344'),leaf2=mat('leaf2','#78855a'),pink=mat('pink','#e6afbf'),rose=mat('rose','#c881a0'),lilac=mat('lilac','#b3a0c6'),ivory=mat('ivory','#f5e5dc');
const boxGeo=new T.BoxGeometry(1,1,1);function mesh(g,m,x=0,y=0,z=0,p=house){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;p.add(o);return o}function box(x,y,z,w,h,d,m=cream,p=house){let o=mesh(boxGeo,m,x,y,z,p);o.scale.set(w,h,d);return o}function cyl(x,y,z,r1,r2,h,m=trim,p=house,n=16){return mesh(new T.CylinderGeometry(r1,r2,h,n),m,x,y,z,p)}function ball(x,y,z,r,m,p=house){return mesh(new T.SphereGeometry(r,8,6),m,x,y,z,p)}function line(points,r,m,p=house){return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v))),Math.max(8,points.length*4),r,6,false),m,0,0,0,p)}
// All dimensions share the same floor levels and footprint. Front is +Z.
box(0,-.28,0,13.4,.55,14.8,stone);box(0,-.59,0,13.55,.1,14.95,trim);const ground=null;
box(0,3.25,-.7,6.6,6.5,5.6);box(0,.23,-.7,6.9,.46,5.9,stone);
for(const y of [.55,3.22,6.38,6.55]){box(0,y,-.7,6.85,.15,5.85,trim)}
for(const x of [-3.25,3.25])for(const z of [-3.45,2.05]){const bottom=x>0&&z>0?3.5:.2;box(x,(bottom+6.4)/2,z,.24,6.4-bottom,.2,trim).name='CornerPilaster';for(let y=bottom+.24;y<6.2;y+=.36)box(x,y,z,.28,.025,.24,stone)}
function hip(x,z,w,d,y,h){const v=[[-w/2,0,d/2],[w/2,0,d/2],[w/2,0,-d/2],[-w/2,0,-d/2],[-Math.max(0,(w-d)/2),h,0],[Math.max(0,(w-d)/2),h,0]];const ix=[0,1,5,0,5,4,1,2,5,2,3,4,2,4,5,3,0,4];const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(ix.flatMap(i=>v[i]),3));g.computeVertexNormals();mesh(g,roof,x,y,z);box(x,y-.03,z,w+.1,.13,d+.1,trim);
// Individually modelled shingle courses follow each roof slope.
for(let j=0;j<13;j++){let t=(j+.3)/13,ww=w*(1-t)+Math.max(0,w-d)*t,dd=d*(1-t),yy=y+h*t;for(const s of [-1,1]){box(x,yy,z+s*dd/2,ww,.035,.045,roof);for(let k=-ww/2+.12;k<ww/2;k+=.34){const a=box(x+k+(j%2)*.12,yy+.025,z+s*dd/2,.013,.018,.19,roof);a.rotation.x=s*Math.atan2(h,d/2)}}for(const s of [-1,1])box(x+s*ww/2,yy,z,.04,.035,dd,roof)}for(const xx of [-1,1])for(const zz of [-1,1])line([[x+xx*w/2,y+.04,z+zz*d/2],[x+xx*Math.max(0,(w-d)/2),y+h+.04,z]],.055,roof)}
hip(0,-.7,7.2,6.2,6.65,1.65);box(2.1,7.95,-1.7,.58,1.6,.65,cream);box(2.1,8.73,-1.7,.72,.15,.77,trim);box(2.1,8.95,-1.7,.4,.3,.44,dark);box(2.1,9.12,-1.7,.63,.1,.65,roof);
function archShape(w,h){const s=new T.Shape(),r=w/2;s.moveTo(-r,0);s.lineTo(r,0);s.lineTo(r,h-r);s.absarc(0,h-r,r,0,Math.PI,false);s.lineTo(-r,0);return s}
// Openings have a recessed dark reveal, a glass surface and a proud stone surround.
// All dimensions below are local to the wall, including the rotated side windows.
function opening(x,y,z,w,h,rot=0,arched=false,p=house){
  const group=new T.Group();group.name=arched?'ArchedOpening':'RectangularOpening';
  group.position.set(x,y,z);group.rotation.y=rot;p.add(group);
  const spring=arched?h-w/2:h;
  const shape=arched?archShape(w,h):new T.Shape().moveTo(-w/2,0).lineTo(w/2,0).lineTo(w/2,h).lineTo(-w/2,h).lineTo(-w/2,0);
  const recess=mesh(new T.ShapeGeometry(shape),dark,0,0,.025,group);recess.name='WindowRecess';
  const roomGlow=mesh(new T.ShapeGeometry(shape),interiorGlow,0,0,.045,group);roomGlow.castShadow=false;roomGlow.name='InteriorWindowGlow';
  const pane=mesh(new T.ShapeGeometry(shape),glass,0,0,.065,group);pane.castShadow=false;pane.name='RecessedGlass';
  for(const xx of [-w/2,w/2]){
    box(xx,spring/2,.12,.075,spring,.11,frame,group);
    const jamb=box(xx+Math.sign(xx)*.105,spring/2,.145,.16,spring,.29,trim,group);jamb.name='StoneJamb';
  }
  box(0,-.035,.19,w+.4,.14,.42,trim,group).name='ProjectingSill';
  box(0,spring*.48,.13,w,.045,.09,frame,group);
  box(0,spring,.13,w,.055,.09,frame,group);
  box(0,h/2,.13,.055,h,.09,frame,group);
  if(arched){
    // A continuous masonry arch, with no rectangular trim above its spring line.
    const ring=new T.Shape();const r=w/2+.185,inner=w/2+.025;
    ring.absarc(0,spring,r,0,Math.PI,false);
    ring.lineTo(-inner,spring);ring.absarc(0,spring,inner,Math.PI,0,true);ring.closePath();
    const surround=mesh(new T.ExtrudeGeometry(ring,{depth:.29,bevelEnabled:false,curveSegments:40}),trim,0,0,0,group);surround.name='StoneArch';
    const pts=[];for(let i=0;i<=40;i++){const a=i/40*Math.PI;pts.push([Math.cos(a)*w/2,spring+Math.sin(a)*w/2,.13]);}
    line(pts,.035,frame,group);
    for(const a of [Math.PI/4,Math.PI*3/4])line([[0,spring,.13],[Math.cos(a)*w/2,spring+Math.sin(a)*w/2,.13]],.018,frame,group);
  }else box(0,h+.095,.145,w+.37,.19,.29,trim,group);
  return group;
}
opening(0,.48,2.115,1.8,2.55,0,true);opening(0,3.8,2.115,1.75,2.2);for(const z of [-2,.8])opening(-3.32,4.25,z,.8,1.45,-Math.PI/2);opening(3.32,4.2,-1.42,.8,1.5,Math.PI/2);
opening(-.65,.5,-3.515,2.8,2.45,Math.PI);opening(-.65,3.8,-3.515,1.65,2.15,Math.PI);opening(2.1,4,-3.515,.72,1.65,Math.PI);opening(2.1,.8,-3.515,.72,1.5,Math.PI);
// Solid front pediment masks the eaves; the oculus sits on its own front face.
const pedimentProfile=new T.Shape().moveTo(-1.5,6.18).lineTo(1.5,6.18)
  .bezierCurveTo(1.1,6.43,.48,7.02,0,7.02)
  .bezierCurveTo(-.48,7.02,-1.1,6.43,-1.5,6.18);
pedimentProfile.closePath();
const pediment=mesh(new T.ExtrudeGeometry(pedimentProfile,{depth:.42,bevelEnabled:false,curveSegments:48}),cream,0,0,2.38);pediment.name='SolidFrontPediment';
line([[-1.5,6.2,2.85],[-1,6.53,2.85],[0,7.04,2.85],[1,6.53,2.85],[1.5,6.2,2.85]],.105,trim).name='PedimentCrown';
box(0,6.19,2.64,3.18,.17,.6,trim);
mesh(new T.CircleGeometry(.18,48),dark,0,6.59,2.815).name='OculusRecess';
mesh(new T.TorusGeometry(.205,.055,16,64),trim,0,6.59,2.86).name='OculusStoneRing';
function rail(x,y,z,len,rot=0){const g=new T.Group();g.name='BalconyRailing';g.position.set(x,y,z);g.rotation.y=rot;house.add(g);box(0,.85,0,len,.14,.2,trim,g);box(0,.09,0,len,.16,.19,trim,g);for(let t=-len/2+.14;t<len/2;t+=.27){cyl(t,.45,0,.045,.045,.62,trim,g,10);ball(t,.37,0,.082,trim,g);cyl(t,.18,0,.09,.06,.12,trim,g,10)}plantBarrier(g);return g;}
function balcony(x,z,w,d,y,back=false){box(x,y,z,w,.23,d,trim);rail(x,y+.12,z+(back?-1:1)*d/2,w);for(let s of [-1,1])rail(x+s*w/2,y+.12,z,d,Math.PI/2);for(let s of [-1,1]){box(x+s*(w/2-.16),y/2,z+(back?-1:1)*(d/2-.13),.22,y,.25,trim);box(x+s*(w/2-.16),y-.35,z,.4,.32,d,trim)}}
balcony(0,2.65,3.1,1.35,3.4);
// Corner newels close the two joints between the front rail and its side returns.
const frontBalconyCorners=new T.Group();frontBalconyCorners.name='ConnectedFrontBalconyCorners';house.add(frontBalconyCorners);
for(const x of [-1.55,1.55]){cyl(x,4.02,3.325,.075,.075,.96,trim,frontBalconyCorners,16);ball(x,4.53,3.325,.105,trim,frontBalconyCorners);}
// Two stone columns rest on the side handrails and support the pediment cornice.
for(const x of [-1.5,1.5]){
 const column=new T.Group();column.name='PedimentSupportColumn';house.add(column);
 box(x,4.49,2.8,.31,.1,.34,trim,column);
 cyl(x,5.29,2.8,.105,.125,1.5,trim,column,24);
 box(x,6.07,2.8,.32,.1,.34,trim,column);
}
const beforeRearBalcony=new Set(house.children);
balcony(-.65,-4.05,3.5,1.2,3.4,true);
for(const object of house.children)if(!beforeRearBalcony.has(object)&&object.name==='BalconyRailing')object.userData.hideInCutaway=true;
// Low side rooms with usable roof terraces.
box(3.7,1.65,.98,1.9,3.3,3.11);opening(3.7,.48,2.55,1.35,2.4,0,true);opening(4.66,.6,.82,1.25,2.2,Math.PI/2,true);box(3.7,3.35,.98,2.1,.2,3.26,trim);rail(3.7,3.45,2.61,2.05);rail(4.74,3.45,.98,3.26,Math.PI/2);rail(3.7,3.45,-.65,2.05).name='RightTerraceRearRailing';
box(-3.65,1.6,-1.6,1.8,3.2,2.4);box(-3.65,3.27,-1.6,2,.2,2.6,trim);rail(-4.6,3.4,-1.6,2.5,Math.PI/2);rail(-3.65,3.4,-.3,1.9);rail(-3.65,3.4,-2.9,1.9).name='LeftTerraceRearRailing';
// Glass conservatory, with separate panes and slender mullions.
box(-3.8,.26,1.15,2.2,.32,2.9,trim);for(let x of [-4.87,-2.73])for(let z of [-.27,1.05,2.57])box(x,1.62,z,.085,2.6,.09,trim);for(let x of [-4.87,-2.73])box(x,1.6,2.57,.09,2.6,.09,trim);for(let z of [.38,1.73]){box(-4.88,1.6,z,.04,2.45,1.23,glass);for(let y of [.65,2.1,2.83])box(-4.92,y,z,.075,.065,1.3,trim)}for(let x of [-4.76,-2.84]){box(x,1.6,2.58,.16,2.45,.04,glass);for(let y of [.65,2.1,2.83])box(x,y,2.61,.16,.065,.09,trim)}hip(-3.8,1.15,2.5,3.2,2.95,.66);opening(-3.8,.4,2.64,1.55,2.37,0,true);
// Right side shallow bay and its own small hipped roof.
box(3.55,1.35,-1.2,.6,2.7,1.3);opening(3.87,.5,-1.2,.9,1.85,Math.PI/2);hip(3.55,-1.2,1.05,1.6,2.77,.4);
for(let i=0;i<3;i++)box(0,.1+i*.11,3.52-i*.25,2.4,.2,.95,trim);
// Compact pergola begins well beyond the main wall so its inner beam clears the upper window surround.
for(let x of [4.02,4.48])for(let z of [-.3,1.68]){box(x,4.3,z,.075,1.8,.075,wood);box(x,5.2,z,.17,.13,.17,trim)}for(let i=0;i<7;i++)box(3.36+i*1.12/6,5.22,.69,.065,.09,2.4,wood);for(let z of [-.4,1.8])box(4.25,5.15,z,.64,.11,.09,wood);
// Garden boundary, stone pillars and wrought iron fencing.
function fence(x,z,len,rot=0){const g=new T.Group();g.name='GardenFence';g.position.set(x,0,z);g.rotation.y=rot;house.add(g);box(0,.2,0,len,.4,.22,cream,g);for(let y of [.48,1.25])box(0,y,0,len,.04,.045,dark,g);for(let a=-len/2;a<=len/2;a+=.19){cyl(a,.92,0,.018,.018,1.1,dark,g,6);mesh(new T.ConeGeometry(.042,.11,6),dark,a,1.52,0,g);line([[a,.6,0],[a+.09,.77,0],[a,.94,0],[a-.09,.77,0],[a,.6,0]],.009,dark,g)}plantBarrier(g);return g;}
for(let x of [-6,-3.4,-1.25,1.25,3.4,6]){plantBarrier(box(x,.78,6.6,.45,1.56,.45,cream));plantBarrier(box(x,1.57,6.6,.6,.14,.6,trim));plantBarrier(box(x,.15,6.6,.55,.3,.55,trim))}fence(-4.7,6.6,2.15);fence(-2.3,6.6,1.7);fence(2.3,6.6,1.7);fence(4.7,6.6,2.15);// Grounded two-leaf iron gate, with a flush threshold and visible lower panels.
const gate=new T.Group();gate.name='GroundedEntranceGate';house.add(gate);
box(0,.025,6.6,2.08,.06,.46,stone,gate).name='GateThreshold';
for(const sign of [-1,1]){
 const x=sign*.51;
 box(x,.15,6.6,1.0,.18,.08,dark,gate);
 for(const dx of [-.49,.49])box(x+dx,.79,6.6,.035,1.46,.07,dark,gate);
 for(const y of [.25,1.32])box(x,y,6.6,1,.04,.07,dark,gate);
 for(let dx=-.35;dx<.45;dx+=.175)cyl(x+dx,.79,6.6,.017,.017,1.1,dark,gate,8);
 for(const y of [.32,1.22])cyl(sign*1.04,y,6.6,.045,.045,.13,dark,gate,10);
}
line([[-1.01,1.48,6.6],[-.5,1.65,6.6],[0,1.72,6.6],[.5,1.65,6.6],[1.01,1.48,6.6]],.028,dark,gate);plantBarrier(gate);
for(let x of [-6,6]){plantBarrier(box(x,.36,-.1,.22,.72,13.4));for(let z of [-6.6,-3.3,0,3.3]){plantBarrier(box(x,.73,z,.4,1.46,.4));plantBarrier(box(x,1.48,z,.55,.13,.55,trim))}for(let z of [-4.95,-1.65,1.65,4.95])fence(x,z,2.9,Math.PI/2)}plantBarrier(box(0,.77,-6.65,12,1.55,.26)).name='RaisedRearBoundaryWall';plantBarrier(box(0,1.58,-6.65,12.15,.12,.4,trim));
// Pavers: seeded variation, restrained joints.
let seed=519;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}const paving=[mat('p1','#d8cbbd'),mat('p2','#ded3c6'),mat('p3','#cbbcaf')];for(let x=-5.7;x<5.8;x+=.48)for(let z=-6.3;z<6.4;z+=.45){if((Math.abs(x)<1.16&&z>2.6)||(z>3&&z<5.55)||(x< -4.9)||(z< -4.6))box(x,.026,z,.455,.045,.425,paving[Math.floor(rand()*3)])}
// Blender fountain replaces the original courtyard fountain.
const blenderFountain=createBlenderFountain(house);
blenderFountain.ready.catch(error=>{
  console.error('Fountain could not load',error);
  const note=document.createElement('button');
  note.textContent='喷泉加载失败，点击重试';
  note.style.cssText='position:fixed;top:18px;left:18px;z-index:10';
  note.onclick=()=>location.reload(); document.body.append(note);
});
function updateFountain(time){blenderFountain.update(time);}
// Efficient instanced foliage and blossoms, distributed as planted beds and climbing roses.
const exteriorGardenStart=new Set(house.children);
const leaves=[],flowers=[];function plant(x,y,z,size=.45,bloom=true){for(let i=0;i<18;i++){let a=rand()*Math.PI*2,r=Math.cbrt(rand())*size;leaves.push([x+Math.cos(a)*r,y+rand()*size*1.4,z+Math.sin(a)*r,.09+rand()*.065,rand()]);}if(bloom)for(let i=0;i<10;i++){let a=rand()*Math.PI*2,r=rand()*size;flowers.push([x+Math.cos(a)*r,y+.2+rand()*size*1.4,z+Math.sin(a)*r,.055+rand()*.055,Math.floor(rand()*4)])}}
function railPlant(x,y,z,angle,side=false,bloom=false){
  // Build a full, layered spray around the rail instead of a pair of isolated leaves.
  for(let i=0;i<7;i++){
    const a=angle+i*2.17,r=.11+(i%4)*.045,drop=i%3===0?-.09:0;
    leaves.push([x+(side?Math.cos(a)*r:Math.sin(a)*.12),y+Math.sin(a)*.16+drop,z+(side?Math.sin(a)*.12:Math.cos(a)*r),.13+(i%3)*.018,a,true]);
  }
  if(bloom)for(let i=0;i<3;i++){
    const a=angle+.7+i*2.05,r=.13+(i%2)*.07;
    flowers.push([x+(side?Math.cos(a)*r:Math.sin(a)*.1),y+.02+Math.sin(a)*.17,z+(side?Math.sin(a)*.1:Math.cos(a)*r),.072+(i%2)*.014,Math.floor(rand()*4),true]);
  }
}
for(let x=-5.25;x<5.3;x+=.34)for(let z of [5.75,-5.92]){if(z>0&&Math.abs(x)<1.4)continue;plant(x,.15,z,.38)}for(let z=-5.5;z<5.7;z+=.34)for(let x of [-5.3,5.3])plant(x,.2,z,.3);for(let x=-4.7;x<4.9;x+=.3){if(Math.abs(x)>1.35)plant(x,.12,3.1,.32)}
// A lush, flower-rich garland wraps the front balcony while leaving its white balusters legible.
function trailingRailSprig(x,z,side=false,phase=0){
  const pts=[];for(let i=0;i<=5;i++){
    const y=4.34-i*.105,a=phase+i*1.55;
    pts.push([x+(side?Math.sin(a)*.055:0),y,z+(side?0:Math.sin(a)*.055)]);
    if(i>0){leaves.push([x+(side?Math.sin(a)*.09:Math.cos(a)*.075),y,z+(side?Math.cos(a)*.075:Math.sin(a)*.09),.115+(i%2)*.018,a,true]);if(i===2||i===4)flowers.push([x+(side?Math.sin(a)*.07:Math.cos(a)*.055),y+.015,z+(side?Math.cos(a)*.055:Math.sin(a)*.07),.068,(i+Math.round(phase))%4,true]);}
  }line(pts,.013,green).name='BalconyTrailingFlowerSprig';
}
function wrapFrontRail(){const pts=[];let i=0;for(let x=-1.78;x<=1.78;x+=.07,i++){const a=(x+1.78)*8.5;pts.push([x,4.37+Math.sin(a)*.1,3.325+Math.cos(a)*.13]);if(i%2===0)railPlant(x,4.39,3.325,a,false,true);if(i%5===0)trailingRailSprig(x,3.36,false,a);}line(pts,.02,green).name='BalconyFrontWindingVine';}
function wrapSideRail(x){const pts=[];let i=0;for(let z=2.02;z<=3.5;z+=.07,i++){const a=(z-2.02)*8.5;pts.push([x+Math.cos(a)*.13,4.37+Math.sin(a)*.1,z]);if(i%2===0)railPlant(x,4.39,z,a,true,true);if(i%6===0)trailingRailSprig(x,z,true,a);}line(pts,.02,green).name='BalconySideWindingVine';}
wrapFrontRail();wrapSideRail(-1.74);wrapSideRail(1.74);
for(const x of [-1.74,1.74]){const pts=[];for(let i=0;i<=12;i++){const t=i/12;const a=t*Math.PI;pts.push([x+(x<0?-1:1)*Math.sin(a)*.12,4.38+Math.sin(a)*.07,3.34+(x<0?-1:1)*(.16*(1-Math.cos(a)))]);if(i%2===0)railPlant(x,4.39,3.34,a,true,true);}line(pts,.02,green).name='BalconyRailCornerVine';}
for(let x=-2.3;x<1.2;x+=.35)plant(x,4.13,-5.02,.22);// Continuous climbing stems with dense sprigs wrapping the columns on several sides.
function climber(x,z,bottom,top,radius=.2){
 const pts=[];
 for(let y=bottom;y<=top;y+=.12){const a=y*4.3;pts.push([x+Math.cos(a)*radius,y,z+Math.sin(a)*radius]);
   if(Math.round((y-bottom)/.12)%2===0)plant(x+Math.cos(a)*radius,y,z+Math.sin(a)*radius,.18,true);
 }
 line(pts,.018,green).name='ClimbingRoseStem';
}
climber(-1.9,2.46,.2,5.65,.16);climber(2.5,2.48,.2,5.65,.16);
for(const x of [4.02,4.48])for(const z of [-.3,1.68])climber(x,z,3.45,5.2,.105);
function topBeamVine(x){const pts=[];for(let z=-.4;z<=1.8;z+=.11){const a=(z+1.1)*13;pts.push([x+Math.cos(a)*.085,5.27+Math.sin(a)*.085,z]);if(Math.round((z+.4)/.11)%3===0)plant(x+Math.cos(a)*.1,5.27+Math.sin(a)*.1,z,.105,true);}line(pts,.012,green).name='PergolaTopFlowerVine';}
for(let i=0;i<7;i++)topBeamVine(3.36+i*1.12/6);
// Layered planting in front of and beside the right-hand ground-floor wing.
for(let x=2.2;x<4.85;x+=.25)for(const z of [3.05,3.43])plant(x,.12,z,.25);
for(let z=-.3;z<2.7;z+=.27)plant(5.08,.15,z,.24);

function pot(x,z,y=0,s=1){cyl(x,y+.24*s,z,.24*s,.16*s,.48*s,trim);cyl(x,y+.48*s,z,.26*s,.26*s,.06*s,trim);plant(x,y+.5*s,z,.29*s)}for(let x of [-1.4,1.4])pot(x,2.95,.23,1.1);for(let x of [-2.1,2.1])pot(x,3.65,0,.8);pot(4.2,.3,3.5,.8);
function tree(x,z,h,blossom=false){cyl(x,h*.4,z,.07,.16,h*.8,wood);for(let i=0;i<10;i++){let a=rand()*Math.PI*2;let xx=x+Math.cos(a)*(.4+rand()*.7),zz=z+Math.sin(a)*(.4+rand()*.7),yy=h*.6+rand()*h*.4;line([[x,h*.3,z],[x+(xx-x)*.3,yy*.8,z+(zz-z)*.3],[xx,yy,zz]],.035,wood);for(let k=0;k<5;k++)plant(xx+(rand()-.5)*.7,yy+(rand()-.5)*.6,zz+(rand()-.5)*.7,.34,blossom)}}tree(-5,-3.8,5.8,true);tree(5,-3.9,4.4);for(let z of [-5.3,-2,2.6]){let x=-5.45;cyl(x,1.6,z,.1,.2,3.2,wood);for(let y=.42;y<3.82;y+=.18)for(const a of [y*4.2,y*4.2+Math.PI])plant(x+Math.cos(a)*.13,y,z+Math.sin(a)*.13,Math.max(.16,.34*(1-y/4)),false)}
// Low planting skirts the pool, leaving the stone rim visible.
for(let i=0;i<15;i++){const a=i/15*Math.PI*2;plant(-3.5+Math.cos(a)*1.04,.08,4.3+Math.sin(a)*.98,.19,true);}
for(const object of house.children)if(!exteriorGardenStart.has(object))object.userData.exteriorPlant=true;
const dummy=new T.Object3D();
function botanicalInstances(arr,geometry,material,index){
  const data=index===undefined?arr:arr.filter(a=>a[4]===index);
  if(!geometry.boundingBox)geometry.computeBoundingBox();
  const inst=new T.InstancedMesh(geometry,material,data.length);
  inst.name=index===undefined?'Blender solid leafy sprigs':'Blender cupped roses';
  inst.userData.exteriorPlant=true;
  const bounds=new T.Box3();let accepted=0;
  data.forEach(a=>{
    dummy.position.set(a[0],a[1],a[2]);
    // Broad orientations expose blooms and compound leaves from all viewing directions.
    dummy.rotation.set((rand()-.5)*2.8,rand()*Math.PI*2,(rand()-.5)*2.8);
    dummy.scale.setScalar(a[3]*(index===undefined?1.25:1.35));dummy.updateMatrix();
    bounds.copy(geometry.boundingBox).applyMatrix4(dummy.matrix).expandByScalar(.035);
    if(!a[5]&&plantBarriers.some(barrier=>bounds.intersectsBox(barrier)))return;
    inst.setMatrixAt(accepted,dummy.matrix);
    inst.setColorAt(accepted,new T.Color().setHSL(index===undefined?.23:0,index===undefined?.16:0,.72+rand()*.28));accepted++;
  });inst.count=accepted;inst.castShadow=false;inst.receiveShadow=true;house.add(inst);return inst;
}
const botanicalReady=fetch(new URL('./realistic-botanicals.json',import.meta.url)).then(r=>{if(!r.ok)throw new Error(`Botanical asset HTTP ${r.status}`);return r.json()}).then(asset=>{
  const geometries={};
  for(const item of asset.meshes){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(item.positions,3));g.setIndex(item.indices);g.computeVertexNormals();geometries[item.name]=g;}
  const leafMaterial=new T.MeshStandardMaterial({color:'#3f682d',roughness:.53,side:T.DoubleSide});
  botanicalInstances(leaves,geometries.leaf,leafMaterial);
  geometries.rose.computeBoundingBox();geometries.calyx.computeBoundingBox();
  geometries.rose.boundingBox.union(geometries.calyx.boundingBox);
  for(let i=0;i<4;i++){
    const material=[pink,rose,lilac,ivory][i].clone();material.side=T.DoubleSide;material.roughness=.61;
    const blooms=botanicalInstances(flowers,geometries.rose,material,i);
    const bases=new T.InstancedMesh(geometries.calyx,leafMaterial,blooms.count);
    bases.name='Blender flower calyx and stalk';bases.userData.exteriorPlant=true;bases.instanceMatrix=blooms.instanceMatrix;bases.castShadow=false;bases.receiveShadow=true;house.add(bases);
  }
}).catch(error=>{console.error('Plants could not load',error);const note=document.createElement('button');note.textContent='花草加载失败，点击重试';note.style.cssText='position:fixed;top:54px;left:18px;z-index:10';note.onclick=()=>location.reload();document.body.append(note);});
// Lanterns with warm luminous glass.
const lampLights=[];function lamp(x,y,z,rot=0){const g=new T.Group();g.position.set(x,y,z);g.rotation.y=rot;house.add(g);box(0,0,0,.12,.34,.06,dark,g);line([[0,.05,0],[0,.2,.18],[0,.1,.29]],.025,dark,g);box(0,-.15,.29,.19,.3,.16,warm,g);const light=new T.PointLight(0xffb45f,0,5,2);light.position.set(0,-.04,.3);g.add(light);lampLights.push(light);for(let xx of [-.1,.1])for(let zz of [.2,.38])box(xx,-.15,zz,.018,.32,.018,dark,g);mesh(new T.ConeGeometry(.19,.16,4),dark,0,.08,.29,g);box(0,-.32,.29,.24,.045,.21,dark,g)}for(let x of [-1.3,1.3])lamp(x,1.95,2.18);for(let x of [-2.1,2.1])lamp(x,5.08,2.18);
// Small garden table, two chairs and parasol.
function chair(x,z,rot=0){let g=new T.Group();g.position.set(x,0,z);g.rotation.y=rot;house.add(g);cyl(0,.49,0,.25,.25,.065,trim,g);for(let xx of [-.17,.17])for(let zz of [-.15,.15])cyl(xx,.25,zz,.018,.018,.5,trim,g,8);line([[-.23,.5,-.15],[-.23,1,-.15],[0,1.08,-.15],[.23,1,-.15],[.23,.5,-.15]],.025,trim,g);for(let x of [-.1,0,.1])box(x,.78,-.15,.02,.42,.02,trim,g)}cyl(-4.5,.69,-4.9,.52,.52,.08,trim);cyl(-4.5,.34,-4.9,.035,.065,.68,trim);chair(-5.2,-4.9,-Math.PI/2);chair(-3.8,-4.9,Math.PI/2);cyl(-4.5,1.55,-4.9,.025,.025,3.1,wood);mesh(new T.ConeGeometry(1.03,.4,8,1,true),ivory,-4.5,2.99,-4.9);for(let i=0;i<8;i++){let a=i*Math.PI/4;line([[-4.5,3.19,-4.9],[-4.5+Math.cos(a)*1.03,2.79,-4.9+Math.sin(a)*1.03]],.015,wood)}
const views={home:[16,12,22],front:[0,7,26],back:[0,7,-27],left:[-27,7,0],right:[27,7,0],top:[0,31,.01]};let goal=null;document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{goal=new T.Vector3(...views[b.dataset.view]);if(innerWidth<600)goal.multiplyScalar(1.18);document.querySelectorAll('[data-view]').forEach(x=>x.classList.toggle('active',x===b));controls.autoRotate=false});controls.addEventListener('start',()=>goal=null);
const weatherSystem=createWeatherSystem(scene,house);
const houseInterior=createInteriorPreview(scene,house,renderer,camera);
const renderHouse=renderer.render.bind(renderer);renderer.render=(...args)=>{houseInterior.update(selectedHour);renderHouse(...args)};
const sceneControls=document.querySelector('.scene-controls'),sceneDock=document.querySelector('#scene-dock'),toolButtons=[...document.querySelectorAll('[data-tool]')],panels=[...document.querySelectorAll('[data-panel]')];let openTool='';
function selectTool(name){const open=openTool!==name;openTool=open?name:'';sceneControls.classList.toggle('open',open);sceneDock.setAttribute('aria-hidden',String(!open));toolButtons.forEach(button=>{const active=open&&button.dataset.tool===name;button.classList.toggle('active',active);button.setAttribute('aria-expanded',String(active));});panels.forEach(panel=>panel.classList.toggle('active',open&&panel.dataset.panel===name));}
toolButtons.forEach(button=>button.onclick=()=>selectTool(button.dataset.tool));
const updateControlTone=()=>sceneControls.dataset.tone=(selectedHour<6||selectedHour>=18.5||weatherSystem.get()==='rain')?'dark':'light';
document.querySelectorAll('[data-weather]').forEach(button=>button.onclick=()=>{weatherSystem.set(button.dataset.weather);renderer.shadowMap.needsUpdate=true;document.querySelectorAll('[data-weather]').forEach(item=>item.classList.toggle('active',item===button));updateControlTone();});
const timeRange=document.querySelector('#time-range'),timeOutput=document.querySelector('#time-output'),localHour=()=>{const now=new Date();return now.getHours()+now.getMinutes()/60+now.getSeconds()/3600};let followActualTime=true,selectedHour=localHour();timeRange.value=selectedHour;
function showTime(){const value=Number(timeRange.value),hour=Math.floor(value),minute=value===24?0:Math.min(59,Math.round((value%1)*60));selectedHour=value;timeOutput.value=`${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`;updateControlTone();}timeRange.oninput=()=>{followActualTime=false;renderer.shadowMap.needsUpdate=true;lastLightingAt=-Infinity;showTime();};showTime();
const musicFile=document.querySelector('#music-file'),musicAudio=document.querySelector('#music-audio'),musicPlay=document.querySelector('#music-play'),musicStatus=document.querySelector('#music-status');let musicUrl='';
const setMusicPlaying=playing=>{musicPlay.classList.toggle('playing',playing);musicPlay.querySelector('span').textContent=playing?'暂停':'播放';musicPlay.setAttribute('aria-label',playing?'暂停背景音乐':'播放背景音乐');};
musicFile.onchange=()=>{const file=musicFile.files?.[0];if(!file)return;if(musicUrl)URL.revokeObjectURL(musicUrl);musicUrl=URL.createObjectURL(file);musicAudio.src=musicUrl;musicPlay.disabled=false;musicStatus.textContent=file.name;musicAudio.play().then(()=>setMusicPlaying(true)).catch(()=>{});};
musicPlay.onclick=()=>{if(!musicAudio.src)return;if(musicAudio.paused)musicAudio.play().then(()=>setMusicPlaying(true)).catch(()=>{});else{musicAudio.pause();setMusicPlaying(false);}};musicAudio.onended=()=>setMusicPlaying(false);
// Pinch gestures adjust the Three.js camera only. They must never zoom the iframe or its parent page.
const stopPageZoom=event=>{if(event.touches?.length>1||event.type.startsWith('gesture')||event.ctrlKey)event.preventDefault();};for(const type of ['touchstart','touchmove','wheel','gesturestart','gesturechange','gestureend'])document.addEventListener(type,stopPageZoom,{passive:false});
let lastLightingAt=-Infinity,lastClockLabel='';
function updateTimeOfDay(now=performance.now()){
  if(now-lastLightingAt<120)return;lastLightingAt=now;
  const date=new Date();if(followActualTime){selectedHour=localHour();timeRange.value=selectedHour;const label=`${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;if(label!==lastClockLabel){lastClockLabel=label;timeOutput.value=label;updateControlTone();}}else{const hour=selectedHour>=24?24:Math.floor(selectedHour),minute=selectedHour>=24?0:Math.min(59,Math.round((selectedHour%1)*60));date.setHours(hour,minute,0,0);}const state=applyDaylight({scene,skyMaterial,hemi,sun,warm,interiorGlow,lampLights,renderer,ground},date);return weatherSystem.applyLighting(state,{scene,skyMaterial,hemi,sun,renderer});
}
function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<700?1.15:1.35));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.needsUpdate=true}addEventListener('resize',resize);if(innerWidth<600)camera.position.multiplyScalar(1.18);const introDuration=2.8,introStart=performance.now(),introEndPosition=camera.position.clone(),introStartPosition=introEndPosition.clone().multiplyScalar(1.42),introEndTarget=controls.target.clone(),introStartTarget=introEndTarget.clone().add(new T.Vector3(0,1.1,0));camera.position.copy(introStartPosition);controls.target.copy(introStartTarget);controls.enabled=false;const loading=document.querySelector('#loading'),animationClock=new T.Clock();renderer.setAnimationLoop(()=>{if(document.hidden)return;const now=performance.now(),delta=Math.min(.05,animationClock.getDelta()),time=(now-introStart)/1000,progress=Math.min(1,time/introDuration),eased=1-Math.pow(1-progress,3);updateTimeOfDay(now);weatherSystem.update(delta,time);updateFountain(time);if(goal){camera.position.lerp(goal,.07);if(camera.position.distanceTo(goal)<.03)goal=null}if(progress<1){camera.position.lerpVectors(introStartPosition,introEndPosition,eased);controls.target.lerpVectors(introStartTarget,introEndTarget,eased)}else if(!controls.enabled){controls.enabled=true;loading.classList.add('is-hidden')}controls.update();renderer.render(scene,camera)});
if(window.parent!==window){window.parent.postMessage({type:'ideal-house-ready'},'*');window.parent.postMessage({type:'ideal-house-ambience',weather:'sunny',tone:'day',daylight:1},'*')}
