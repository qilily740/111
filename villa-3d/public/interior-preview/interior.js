import * as T from './three.module.js';

// Metres, Y-up. A separate study: the original house remains untouched.
export function createInteriorPreview(scene, house, renderer, camera) {
  renderer.localClippingEnabled = true;
  const cut = new T.Plane(new T.Vector3(0, 0, -1), .1);
  const exterior = [], original = [];
  house.updateMatrixWorld(true);
  house.traverse(o => {
    if (!o.isMesh || o.isInstancedMesh) return;
    const bounds = new T.Box3().setFromObject(o), c = bounds.getCenter(new T.Vector3()), s = bounds.getSize(new T.Vector3());
    if (Math.abs(c.x) > 4.95 || c.z < -4.4 || c.z > 3.7 || c.y < .12) return;
    const solid = (s.x > 6 && s.y > 6) || (s.y > 2.6 && s.x > 1.7 && s.z > 2.3) || (s.x > 6 && s.z > 5) || (c.x > 3.3 && s.y > 2.5);
    original.push({o, visible:o.visible, solid, roof:c.y > 6.3});
    o.material = Array.isArray(o.material) ? o.material.map(m=>m.clone()) : o.material.clone();
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
      m.clippingPlanes=[cut]; m.clipShadows=true; m.side=T.DoubleSide;
    }
    exterior.push(o);
  });
  const root = new T.Group(); root.name='InteriorPreview'; scene.add(root);
  const floors = [new T.Group(), new T.Group()]; floors.forEach((g,i)=>{g.name=`Floor${i+1}`;root.add(g)});
  const make=(color,roughness=.7,extra={})=>new T.MeshStandardMaterial({color,roughness,...extra});
  function texture(kind) {
    const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
    const ctx=canvas.getContext('2d');ctx.fillStyle=kind==='wood'?'#cdb59b':'#f0e5db';ctx.fillRect(0,0,256,256);
    let seed=71;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
    for(let i=0;i<3500;i++){ctx.strokeStyle=`rgba(95,68,48,${random()*.12})`;ctx.beginPath();const x=random()*256,y=random()*256;ctx.moveTo(x,y);ctx.lineTo(x+(kind==='wood'?random()*70:2),y+random()*2);ctx.stroke();}
    const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.repeat.set(3,3);return map;
  }
  const grain=texture('wood'),weave=texture('fabric');
  const m={cream:make('#ece2d1',.48), wood:make('#dcc4a7',.55,{map:grain}), fabric:make('#eee2d5',.96,{map:weave,bumpMap:weave,bumpScale:.008}),pink:make('#d7a6b1',.95,{map:weave}),sage:make('#9ca58b'),gold:make('#b39454',.28,{metalness:.78}),stone:make('#f4ece1',.25),dark:make('#302e30'),wall:make('#e9dfd0'),glass:new T.MeshPhysicalMaterial({color:'#d8e3dc',metalness:.75,roughness:.08}),green:make('#61734b')};
  const cube=new T.BoxGeometry(1,1,1);
  function box(g,x,y,z,w,h,d,mat=m.cream,name=''){const o=new T.Mesh(cube,mat);o.position.set(x,y,z);o.scale.set(w,h,d);o.name=name;o.castShadow=o.receiveShadow=true;g.add(o);return o}
  function ell(g,x,y,z,w,h,d,mat=m.fabric){const o=new T.Mesh(new T.SphereGeometry(1,24,16),mat);o.position.set(x,y,z);o.scale.set(w/2,h/2,d/2);o.castShadow=o.receiveShadow=true;g.add(o);return o}
  function cyl(g,x,y,z,rt,rb,h,mat=m.cream){const o=new T.Mesh(new T.CylinderGeometry(rt,rb,h,32),mat);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;g.add(o);return o}
  function rod(g,a,b,r=.018,mat=m.gold){const v=new T.Vector3(...a),end=new T.Vector3(...b),d=end.clone().sub(v);const o=cyl(g,0,0,0,r,r,d.length(),mat);o.position.copy(v.add(end).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return o}
  function group(name,x,z,f=0,rot=0,dimensions){const g=new T.Group();g.name=name;g.position.set(x,f?3.4:.48,z);g.rotation.y=rot;g.userData.dimensions=dimensions;floors[f].add(g);return g}
  function leg(g,x,z,h){cyl(g,x,h/2,z,.026,.038,h,m.wood);ell(g,x,h*.72,z,.09,.11,.09,m.cream);cyl(g,x,.045,z,.045,.035,.09,m.gold)}
  function legs(g,w,d,h){for(const x of [-w/2+.08,w/2-.08])for(const z of [-d/2+.08,d/2-.08])leg(g,x,z,h)}
  function molding(g,w,h,z){for(const x of [-w/2,w/2])box(g,x,h/2,z,.018,h,.015);for(const y of [.025,h-.025])box(g,0,y,z,w,.018,.015)}
  function cabinet(name,x,z,w,d,h,f=0,rot=0){const g=group(name,x,z,f,rot,[w,d,h]);box(g,0,h/2,0,w-.04,h-.08,d-.035);box(g,0,h-.025,0,w,.05,d,m.stone);box(g,0,.055,0,w,.11,d);
    const count=w>1.4?3:2;for(let i=0;i<count;i++){const panel=new T.Group();panel.position.set(-w/2+(i+.5)*w/count,.13,d/2);g.add(panel);molding(panel,w/count-.07,h-.25,0);ell(g,-.04,(h-.25)*.5,.026,.03,.03,.03,m.gold)}return g}
  function vase(g,x,y,z){cyl(g,x,y+.10,z,.055,.08,.20,m.stone);for(let i=0;i<7;i++){const a=i*2.4,dx=Math.cos(a)*.12,dz=Math.sin(a)*.12;rod(g,[x,y+.18,z],[x+dx,y+.38+(i%3)*.035,z+dz],.005,m.green);for(let j=0;j<5;j++)ell(g,x+dx+Math.cos(j*1.26)*.025,y+.39+(i%3)*.035,z+dz+Math.sin(j*1.26)*.025,.055,.04,.055,i%2?m.pink:m.fabric)}}
  function lamp(g,x,y,z){cyl(g,x,y+.02,z,.09,.09,.04,m.gold);cyl(g,x,y+.15,z,.016,.025,.26,m.gold);cyl(g,x,y+.34,z,.09,.15,.22,m.fabric)}
  function table(name,x,z,w,d,h,f=0,round=false){const g=group(name,x,z,f,0,[w,d,h]);if(round){cyl(g,0,h-.03,0,w/2,w/2,.06,m.stone);cyl(g,0,(h-.06)/2,0,.075,.14,h-.06);for(let i=0;i<4;i++){const a=i*Math.PI/2;rod(g,[0,.13,0],[Math.cos(a)*w*.33,.045,Math.sin(a)*w*.33],.045,m.cream)}}else{box(g,0,h-.035,0,w,.07,d,m.wood);legs(g,w,d,h-.07);box(g,0,h-.12,0,w-.12,.10,d-.12)}return g}
  function chair(x,z,f=0,rot=0){const g=group('Dining chair · 48×52×88 cm',x,z,f,rot,[.48,.52,.88]);legs(g,.48,.52,.42);ell(g,0,.46,0,.48,.12,.48);ell(g,0,.70,-.21,.44,.36,.075,m.wood);ell(g,0,.70,-.164,.36,.29,.02,m.fabric);for(let i=-3;i<=3;i++)rod(g,[i*.045,.60,-.15],[i*.045,.8,-.15],.005,m.wood);return g}
  // Ground-floor circulation remains open along x=0. Stair occupies east side.
  const sofa=group('Sofa · 185×90×88 cm',-2.60,.60,0,Math.PI/2,[1.85,.90,.88]);legs(sofa,1.75,.8,.18);box(sofa,0,.29,0,1.7,.25,.8);ell(sofa,0,.65,-.32,1.65,.46,.24);for(const x of [-.82,.82])ell(sofa,x,.53,0,.21,.42,.90);for(const x of [-.40,.40]){ell(sofa,x,.46,.07,.78,.20,.63);ell(sofa,x,.65,-.16,.45,.35,.16,x<0?m.pink:m.fabric);for(const dx of [-.16,.16])ell(sofa,x+dx,.75,-.20,.02,.02,.02,m.gold)}
  const coffee=table('Coffee table · Ø80×42 cm',-1.47,.6,.8,.8,.42,0,true);vase(coffee,0,.42,0);
  box(floors[0],-1.9,.493,.6,2.25,.02,2.35,m.pink,'Living room rug');
  const dining=table('Dining table · 160×85×75 cm',-1.68,-2.36,1.6,.85,.75);vase(dining,0,.75,0);for(const x of [-2.12,-1.24]){chair(x,-3.03);chair(x,-1.66,0,Math.PI)}
  const island=cabinet('Kitchen island · 180×80×92 cm',1.82,-2.59,1.8,.8,.92);box(island,-.35,.925,0,.55,.012,.39,m.dark,'Sink basin');box(island,-.35,.932,0,.44,.012,.29,m.glass);rod(island,[-.35,.92,-.27],[-.35,1.22,-.27]);rod(island,[-.35,1.22,-.27],[-.35,1.22,-.08]);vase(island,.61,.92,.08);
  const entry=cabinet('Entry console · 120×35×85 cm',3.75,1.9,1.2,.35,.85,0,Math.PI);vase(entry,.3,.85,0);lamp(entry,-.35,.85,0);
  const fire=group('Fireplace · 140×35×100 cm',-2.27,1.80,0,Math.PI,[1.4,.35,1]);box(fire,0,.48,0,1.20,.86,.25,m.dark);for(const x of [-.59,.59])box(fire,x,.46,0,.20,.92,.33);box(fire,0,.95,0,1.4,.1,.35);box(fire,0,.08,0,1.4,.16,.35,m.stone);for(const x of [-.25,0,.25])cyl(fire,x,.23,.04,.045,.045,.25,m.wood);
  const cafe=table('Conservatory table · Ø75×75 cm',-3.85,1.02,.75,.75,.75,0,true);vase(cafe,0,.75,0);chair(-3.85,.35);chair(-3.85,1.75,0,Math.PI);
  // Upper bedroom: wardrobes at the rear, desk at the window, open landing east.
  const bed=group('Master bed · 180×200×110 cm',-1.7,-.62,1,0,[1.8,2,1.1]);legs(bed,1.7,1.9,.18);box(bed,0,.28,0,1.8,.24,2,m.wood);ell(bed,0,.46,0,1.78,.28,1.94);ell(bed,0,.59,.28,1.8,.14,1.4,m.pink);ell(bed,0,.71,-.91,1.8,.78,.18,m.cream);ell(bed,0,.78,-.79,1.65,.55,.09);for(const x of [-.48,.48]){ell(bed,x,.65,-.58,.67,.19,.42);ell(bed,x,.75,-.68,.43,.25,.13,m.pink)}for(let x=-.6;x<=.6;x+=.3)ell(bed,x,.85,-.73,.025,.025,.02,m.gold);
  for(const x of [-2.87,-.53]){const bedside=cabinet('Bedside · 50×40×55 cm',x,-1.33,.5,.4,.55,1);lamp(bedside,0,.55,0)}
  cabinet('Wardrobe · 180×60×240 cm',-1.7,-2.91,1.8,.6,2.4,1);
  const desk=table('Desk · 140×60×75 cm',-1.9,1.52,1.4,.6,.75,1);lamp(desk,-.45,.75,0);vase(desk,.43,.75,0);chair(-1.9,.86,1);
  const vanity=cabinet('Bathroom vanity · 100×55×85 cm',1.7,-2.98,1,.55,.85,1);ell(vanity,0,.853,0,.53,.02,.32,m.glass);ell(vanity,0,1.42,-.22,.67,.83,.05,m.gold);ell(vanity,0,1.42,-.185,.59,.75,.03,m.glass);
  const toilet=group('WC',2.7,-2.4,1,Math.PI/2);ell(toilet,0,.35,0,.4,.38,.6,m.stone);box(toilet,0,.55,-.23,.4,.50,.14,m.stone);
  box(floors[1],1.6,3.415,-2.55,2.75,.025,1.35,m.stone,'Bathroom tile');
  // Floor slabs surround (not cover) a 2.1 × 2.95 m stair opening.
  box(floors[0],0,.40,-.7,6.6,.16,5.6,m.wood,'Ground floor');
  box(floors[0],3.7,.40,.98,1.9,.16,3.11,m.wood);box(floors[0],-3.8,.40,1.15,2.2,.16,2.9,m.wood);
  box(floors[1],-1.2,3.30,-.7,4.2,.20,5.6,m.wood,'Upper floor west');
  box(floors[1],2.05,3.30,-2.2575,2.3,.20,2.485,m.wood,'Upper floor rear landing');
  const stairs=group('U staircase · 18 risers · 16.22 cm',0,0);stairs.userData.stair={risers:18,rise:2.92/18,tread:.27,width:.94,opening:[.9,3.2,-1.12,2.1]};
  const rise=2.92/18;
  // First flight goes towards +Z; second returns to the rear landing.
  for(let i=0;i<9;i++){const z=-.88+i*.27,y=(i+1)*rise;box(stairs,1.43,y/2,z,.94,y,.27,m.wood,`Lower tread ${i+1}`);box(stairs,1.43,y+.008,z,.96,.016,.28,m.cream);rod(stairs,[.94,y,z],[.94,y+.85,z],.018,m.cream)}
  box(stairs,2.02,9*rise-.065,1.76,2.1,.13,.68,m.wood,'Turning landing');
  for(let i=0;i<9;i++){const z=1.28-i*.27,y=(10+i)*rise;box(stairs,2.58,y-.08,z,.94,.16,.27,m.wood,`Upper tread ${i+10}`);rod(stairs,[3.07,y,z],[3.07,y+.85,z],.018,m.cream)}
  rod(stairs,[.94,rise+.85,-.88],[.94,9*rise+.85,1.28],.035,m.wood);rod(stairs,[3.07,10*rise+.85,1.28],[3.07,18*rise+.85,-.88],.035,m.wood);
  for(let i=0;i<9;i++)rod(floors[1],[.9,3.4,-.8+i*.32],[.9,4.25,-.8+i*.32],.018,m.cream);rod(floors[1],[.9,4.25,-.8],[.9,4.25,1.8],.035,m.wood);
  // Low internal partitions keep all four cutaway views readable.
  box(floors[1],.20,3.85,-1.80,.12,.90,2.8,m.wall,'Bedroom partition');
  box(floors[1],.65,3.85,-1.8,.9,.90,.12,m.wall,'Bathroom door left jamb');box(floors[1],2.75,3.85,-1.8,.9,.90,.12,m.wall,'Bathroom door right jamb');
  const shell=new T.Group();root.add(shell);
  for(const y of [1.78,4.89]){
    for(const x of [-3.2,3.2])box(shell,x,y,-.7,.2,2.6,5.4,m.wall);
    for(const z of [-3.4,2.0])box(shell,0,y,z,6.4,2.6,.2,m.wall);
  }
  shell.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.clippingPlanes=[cut];o.material.clipShadows=true}});
  const light=new T.HemisphereLight('#fff3df','#a58c7c',1.4);root.add(light);
  let active=true, floor='both';
  const panel=document.createElement('div');panel.style.cssText='position:fixed;top:16px;left:16px;right:16px;z-index:50;display:flex;gap:8px;flex-wrap:wrap;font:13px system-ui';
  const label=document.createElement('span');label.textContent='独立室内预览 · 未替换原小屋';label.style.cssText='background:#fff9edee;padding:10px;border-radius:10px';panel.append(label);
  function button(text,fn){const b=document.createElement('button');b.textContent=text;b.style.cssText='border:1px solid #ccbda9;background:#fff9edee;color:#594d47;border-radius:10px;padding:10px;cursor:pointer';b.onclick=fn;panel.append(b);return b}
  const toggle=button('剖视：开',()=>{active=!active;toggle.textContent=`剖视：${active?'开':'关'}`});
  for(const [v,text] of [['both','两层'],['1','一楼'],['2','二楼']])button(text,()=>{floor=v;camera.position.set(11,10,16)});
  document.body.append(panel);
  return {root,floors,stairs,update(){
    const v=camera.position.clone();v.y=0;v.normalize().negate();cut.normal.copy(v);cut.constant=-.05;
    root.visible=active;floors[0].visible=floor!=='2';floors[1].visible=floor!=='1';
    for(const {o,visible,solid,roof} of original){o.visible=visible&&(!active||(!solid&&!roof&&(floor!=='1'||o.position.y<3.3)));for(const mat of Array.isArray(o.material)?o.material:[o.material])mat.clippingPlanes=active?[cut]:[]}
    shell.visible=active&&floor==='both';
  }};
}
