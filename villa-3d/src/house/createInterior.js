import * as THREE from 'three';
import { box, mesh, cylinderBetween } from '../utils/geometry.js';

function interiorMaterials() {
  const make=(color,roughness=.88)=>new THREE.MeshStandardMaterial({color,roughness});
  return {
    floor:make(0xd9c4ad,.82), floorLight:make(0xe9ded2,.9), wall:make(0xe9e3e3,.94),
    blush:make(0xcdaeb4,.88), cream:make(0xeee9e1,.9), wood:make(0xa98772,.82),
    sage:make(0x9aa394,.92), fabric:make(0xd8ced4,.96), dark:make(0x625a5d,.72), gold:make(0xa88d68,.5),
    glass:new THREE.MeshPhysicalMaterial({color:0xf2d8bd,transparent:true,opacity:.68,roughness:.18,transmission:.2,emissive:0xffb765,emissiveIntensity:.72}),
    glow:new THREE.MeshStandardMaterial({color:0xffe0ad,emissive:0xffb45e,emissiveIntensity:1.3,roughness:.38}),
    screen:new THREE.MeshPhysicalMaterial({color:0x26333a,roughness:.2,metalness:.08,clearcoat:.45,emissive:0x293943,emissiveIntensity:.24}),
    appliance:new THREE.MeshStandardMaterial({color:0xd9d9d5,roughness:.34,metalness:.34}),
    applianceDark:new THREE.MeshStandardMaterial({color:0x34383a,roughness:.24,metalness:.32})
  };
}

function addLegs(root,x,y,z,width,depth,height,material) {
  for(const dx of [-1,1]) for(const dz of [-1,1]) box(root,[.09,height,.09],[x+dx*(width/2-.12),y-height/2,z+dz*(depth/2-.12)],material,'furniture-leg');
}

function table(root,{x,y,z,width=1.5,depth=.9,material}) {
  box(root,[width,.12,depth],[x,y,z],material,'table-top');
  addLegs(root,x,y-.06,z,width,depth,.72,material);
}

function chair(root,{x,y,z,rotation=0,material}) {
  const group=new THREE.Group(); group.name='DiningChair'; group.position.set(x,y,z); group.rotation.y=rotation;
  box(group,[.55,.1,.55],[0,.5,0],material,'chair-seat');
  box(group,[.55,.68,.09],[0,.86,-.23],material,'chair-back');
  addLegs(group,0,.45,0,.55,.55,.48,material); root.add(group);
}

function sofa(root,{x,y,z,rotation=0,mats}) {
  const group=new THREE.Group(); group.name='LivingRoomSofa'; group.position.set(x,y,z); group.rotation.y=rotation;
  box(group,[2.45,.48,.82],[0,.48,0],mats.fabric,'sofa-base');
  box(group,[2.35,.78,.22],[0,.92,-.34],mats.blush,'sofa-back');
  for(const dx of [-1.08,1.08]) box(group,[.26,.62,.84],[dx,.7,0],mats.blush,'sofa-arm');
  for(const dx of [-.58,.58]) box(group,[.92,.18,.62],[dx,.78,.05],mats.cream,'sofa-cushion');
  root.add(group);
}

function bed(root,{x,y,z,mats}) {
  const group=new THREE.Group(); group.name='UpstairsBed'; group.position.set(x,y,z);
  box(group,[2.55,.36,2.75],[0,.42,0],mats.wood,'bed-frame');
  box(group,[2.35,.3,2.55],[0,.7,0],mats.cream,'mattress');
  box(group,[2.38,.13,1.7],[0,.91,.42],mats.blush,'bed-cover');
  for(const dx of [-.58,.58]) box(group,[.95,.2,.58],[dx,.96,-.78],mats.fabric,'pillow');
  box(group,[2.55,1.18,.18],[0,1.03,-1.3],mats.wood,'headboard'); root.add(group);
}

function shelf(root,{x,y,z,mats}) {
  const group=new THREE.Group(); group.name='BookShelf'; group.position.set(x,y,z);
  // Deep cabinet body and thick shelves keep the bookcase readable from an
  // oblique interior view, rather than looking like a flat wall decal.
  box(group,[1.72,2.15,.58],[0,1.08,0],mats.wood,'shelf-back');
  for(const sy of [.15,.72,1.29,1.88]) box(group,[1.82,.12,.52],[0,sy,.06],mats.cream,'shelf-board');
  box(group,[.1,2.05,.62],[-.84,1.08,.02],mats.wood,'shelf-left-side');
  box(group,[.1,2.05,.62],[.84,1.08,.02],mats.wood,'shelf-right-side');
  for(let row=0;row<3;row++) for(let col=0;col<5;col++) box(group,[.17,.38,.25],[-.55+col*.27,.38+row*.57,.37],row%2?mats.blush:mats.sage,'book'); root.add(group);
}

function vanity(root,{x,y,z,mats}) {
  const group=new THREE.Group(); group.name='BedroomVanity'; group.position.set(x,y,z);
  box(group,[1.52,.12,.46],[0,.68,0],mats.wood,'vanity-top');
  box(group,[.54,.42,.38],[-.42,.45,0],mats.wood,'vanity-left-drawer');
  box(group,[.54,.42,.38],[.42,.45,0],mats.wood,'vanity-right-drawer');
  for(const dx of [-.58,.58]) box(group,[.1,.62,.1],[dx,.32,0],mats.wood,'vanity-leg');
  box(group,[.78,.08,.38],[0,.07,.32],mats.cream,'vanity-stool-seat');
  for(const dx of [-.28,.28]) box(group,[.07,.42,.07],[dx,-.16,.32],mats.wood,'vanity-stool-leg');
  root.add(group); return group;
}

function wallMirror(root,{x,y,z,rotation=0,mats,name='wall-mirror'}) {
  const group=new THREE.Group(); group.name=name; group.position.set(x,y,z); group.rotation.y=rotation;
  box(group,[1.34,1.18,.08],[0,0,0],mats.wood,`${name}-frame`);
  box(group,[1.17,1.0,.025],[0,0,.055],mats.glass,`${name}-glass`);
  root.add(group); return group;
}

function shoeCabinet(root,{x,y,z,mats}) {
  const group=new THREE.Group(); group.name='EntranceShoeCabinet'; group.position.set(x,y,z);
  box(group,[1.3,.82,.42],[0,.42,0],mats.wood,'shoe-cabinet-body');
  // The opening faces the room (negative Z), with the cabinet back toward
  // the entrance wall.
  box(group,[.6,.68,.035],[-.32,.43,-.23],mats.cream,'shoe-cabinet-left-door');
  box(group,[.6,.68,.035],[.32,.43,-.23],mats.cream,'shoe-cabinet-right-door');
  for(const dx of [-.05,.05]) box(group,[.03,.1,.035],[dx,.43,-.27],mats.gold,'shoe-cabinet-handle');
  box(group,[1.42,.1,.5],[0,.9,0],mats.cream,'shoe-cabinet-top');
  root.add(group); return group;
}

function wardrobe(root,{x,y,z,mats}) {
  const group=new THREE.Group(); group.name='BedroomWardrobe'; group.position.set(x,y,z);
  box(group,[1.45,2.35,.7],[0,1.22,0],mats.wood,'wardrobe-body');
  box(group,[.66,2.12,.035],[-.36,1.24,.37],mats.cream,'wardrobe-left-door');
  box(group,[.66,2.12,.035],[.36,1.24,.37],mats.cream,'wardrobe-right-door');
  for(const dx of [-.055,.055]) box(group,[.035,.12,.04],[dx,1.25,.41],mats.gold,'wardrobe-handle');
  box(group,[1.58,.12,.78],[0,2.43,0],mats.cream,'wardrobe-cornice');
  root.add(group); return group;
}

function bayLounge(root,mats) {
  const group=new THREE.Group(); group.name='BaySmallLounge';
  box(group,[2.35,.46,.8],[5.2,.49,-.82],mats.fabric,'bay-lounge-sofa');
  box(group,[2.2,.7,.18],[5.2,.91,-1.14],mats.blush,'bay-lounge-back');
  for(const x of [4.2,6.2]) box(group,[.25,.58,.82],[x,.7,-.82],mats.blush,'bay-lounge-arm');
  for(const x of [4.65,5.75]) box(group,[.86,.16,.58],[x,.78,-.78],mats.cream,'bay-lounge-cushion');
  const tableTop=mesh(new THREE.CylinderGeometry(.5,.5,.09,28),mats.wood,{position:[5.2,.94,.08],name:'bay-lounge-table'}); group.add(tableTop);
  group.add(mesh(new THREE.CylinderGeometry(.08,.1,.58,14),mats.dark,{position:[5.2,.64,.08],name:'bay-lounge-table-leg'}));
  plant(group,{x:6.55,y:.36,z:.48,scale:.82,mats,name:'bay-lounge-plant'});
  root.add(group);
}

function bayBathroom(root,mats) {
  const group=new THREE.Group(); group.name='BayBathroom';
  // Wall-mounted sink: no unexplained cabinet below it, with the rear edge
  // aligned to the bay's inside wall.
  box(group,[1.25,.08,.5],[4.15,3.96,-2.12],mats.cream,'bathroom-sink-counter');
  box(group,[.58,.055,.32],[4.15,4.04,-2.11],mats.glass,'bathroom-sink');
  group.add(mesh(new THREE.TorusGeometry(.15,.018,6,16,Math.PI),mats.gold,{position:[4.15,4.15,-2.27],rotation:[Math.PI/2,0,0],name:'bathroom-sink-faucet'}));

  // Complete freestanding bathtub: low outer shell, visible inner basin,
  // water surface and a continuous raised rim.
  box(group,[1.3,.48,1.72],[6.1,3.82,-1.22],mats.cream,'bathroom-bathtub');
  box(group,[1.06,.06,1.45],[6.1,4.08,-1.22],mats.glass,'bathroom-tub-water');
  for(const [x,z,size] of [[5.49,-1.22,[.12,1.86]],[6.71,-1.22,[.12,1.86]],[6.1,-2.05,[1.34,.12]],[6.1,-.39,[1.34,.12]]]) box(group,[size[0],.12,size[1]],[x,4.08,z],mats.cream,'bathroom-tub-rim');
  group.add(mesh(new THREE.CylinderGeometry(.07,.09,.22,12),mats.gold,{position:[5.55,4.31,-.55],name:'bathroom-tub-faucet'}));
  group.add(mesh(new THREE.TorusGeometry(.12,.018,6,16,Math.PI),mats.gold,{position:[5.55,4.22,-.55],rotation:[Math.PI/2,0,0],name:'bathroom-tub-handle'}));

  // Toilet tucked into the far-right corner, with the tank aligned to the
  // rear wall instead of floating in the middle of the room.
  group.add(mesh(new THREE.CylinderGeometry(.34,.39,.42,20),mats.cream,{position:[6.8,3.82,.92],name:'bathroom-toilet-bowl'}));
  group.add(mesh(new THREE.TorusGeometry(.27,.045,8,20),mats.cream,{position:[6.8,4.05,.92],rotation:[Math.PI/2,0,0],name:'bathroom-toilet-seat'}));
  box(group,[.56,.62,.16],[6.8,4.14,1.16],mats.cream,'bathroom-toilet-tank');
  box(group,[1.2,1.0,.035],[4.15,4.92,-2.37],mats.glass,'bathroom-mirror');
  pendant(group,{x:5.2,y:6.0,z:-.55,mats,light:false,name:'bathroom-pendant'});
  root.add(group);
}

function lamp(root,{x,y,z,mats}) {
  box(root,[.08,1.65,.08],[x,y+.82,z],mats.dark,'floor-lamp-post');
  const shade=mesh(new THREE.ConeGeometry(.38,.5,20,1,true),mats.cream,{position:[x,y+1.72,z],name:'floor-lamp-shade'}); shade.rotation.x=Math.PI; root.add(shade);
  addWarmLight(root,{x,y:y+1.58,z,intensity:2.4,distance:4.2,mats,name:'living-floor-lamp'});
}

function addWarmLight(root,{x,y,z,intensity=3,distance=5,mats,name='interior-light'}) {
  const bulb=mesh(new THREE.SphereGeometry(.09,12,9),mats.glow,{position:[x,y,z],name:`${name}-bulb`}); root.add(bulb);
  const light=new THREE.PointLight(0xffc27a,intensity,distance,2); light.name=name; light.position.set(x,y,z); light.userData.interiorBaseIntensity=intensity; root.add(light); return light;
}

function pendant(root,{x,y,z,length=.55,mats,light=true,name='pendant'}) {
  box(root,[.035,length,.035],[x,y+length/2,z],mats.dark,`${name}-cord`);
  const shade=mesh(new THREE.SphereGeometry(.24,18,12,0,Math.PI*2,0,Math.PI*.62),mats.glass,{position:[x,y,z],rotation:[Math.PI,0,0],name:`${name}-shade`}); shade.scale.y=.72; root.add(shade);
  box(root,[.22,.055,.22],[x,y+.17,z],mats.gold,`${name}-cap`);
  if(light)addWarmLight(root,{x,y:y-.04,z,intensity:3.15,distance:5.4,mats,name:`${name}-light`});
}

function tableLamp(root,{x,y,z,mats,name='table-lamp',light=true}) {
  root.add(mesh(new THREE.CylinderGeometry(.14,.19,.08,18),mats.gold,{position:[x,y,z],name:`${name}-base`}));
  box(root,[.045,.38,.045],[x,y+.22,z],mats.gold,`${name}-stem`);
  const shade=mesh(new THREE.ConeGeometry(.24,.34,20,1,true),mats.glass,{position:[x,y+.52,z],name:`${name}-shade`}); shade.rotation.x=Math.PI; root.add(shade);
  if(light)addWarmLight(root,{x,y:y+.45,z,intensity:1.8,distance:3.2,mats,name:`${name}-light`});
}

function plant(root,{x,y,z,scale=1,mats,name='house-plant'}) {
  root.add(mesh(new THREE.CylinderGeometry(.19*scale,.14*scale,.28*scale,14),mats.blush,{position:[x,y+.14*scale,z],name:`${name}-pot`}));
  for(let i=0;i<7;i++){ const angle=i*Math.PI*2/7,leaf=mesh(new THREE.SphereGeometry(.18*scale,9,6),mats.sage,{position:[x+Math.cos(angle)*.16*scale,y+.38*scale+(i%3)*.1*scale,z+Math.sin(angle)*.16*scale],name:`${name}-leaf`}); leaf.scale.set(.72,1.55,.42); leaf.rotation.z=Math.cos(angle)*.55; root.add(leaf); }
}

function cup(root,{x,y,z,mats}) {
  root.add(mesh(new THREE.CylinderGeometry(.09,.075,.14,14),mats.cream,{position:[x,y,z],name:'ceramic-cup'}));
  const handle=mesh(new THREE.TorusGeometry(.065,.018,6,12,Math.PI*1.5),mats.gold,{position:[x+.09,y,z],rotation:[Math.PI/2,0,0],name:'cup-handle'}); root.add(handle);
}

function framedArt(root,{x,y,z,width=.9,height=.65,mats,name='wall-art'}) {
  box(root,[width+.12,height+.12,.055],[x,y,z],mats.gold,`${name}-frame`);
  box(root,[width,height,.065],[x,y,z+.035],mats.blush,`${name}-print`);
}

function television(root,{x,y,z,mats}) {
  const group=new THREE.Group(); group.name='LivingRoomTelevision'; group.position.set(x,y,z);
  box(group,[1.72,1.02,.11],[0,.58,0],mats.dark,'television-frame');
  box(group,[1.57,.87,.035],[0,.58,.075],mats.screen,'television-screen');
  box(group,[.1,.34,.09],[0,.02,0],mats.dark,'television-stand');
  box(group,[.72,.07,.34],[0,-.14,.02],mats.dark,'television-foot');
  root.add(group);
}

function refrigerator(root,{x,y,z,mats}) {
  const group=new THREE.Group(); group.name='KitchenRefrigerator'; group.position.set(x,y,z);
  box(group,[1.34,2.35,.72],[0,1.18,0],mats.appliance,'refrigerator-body');
  box(group,[1.2,1.36,.035],[0,1.57,.38],mats.appliance,'refrigerator-upper-door');
  box(group,[1.2,.73,.035],[0,.47,.38],mats.appliance,'refrigerator-freezer-door');
  box(group,[.035,1.02,.055],[-.13,1.58,.42],mats.dark,'refrigerator-left-handle');
  box(group,[.035,1.02,.055],[.13,1.58,.42],mats.dark,'refrigerator-right-handle');
  box(group,[.27,.18,.045],[.38,1.65,.43],mats.screen,'refrigerator-display');
  root.add(group);
}

function kitchenElectronics(root,{mats}) {
  box(root,[.72,.57,.045],[2.4,.79,-2.295],mats.applianceDark,'built-in-oven');
  box(root,[.54,.35,.025],[2.4,.82,-2.265],mats.screen,'oven-glass');
  for(const x of [2.17,2.33,2.49,2.65]) root.add(mesh(new THREE.CylinderGeometry(.026,.026,.025,10),mats.gold,{position:[x,1.06,-2.25],rotation:[Math.PI/2,0,0],name:'oven-control'}));
  for(const x of [2.15,2.58]) for(const z of [-2.53,-2.78]) { const burner=mesh(new THREE.TorusGeometry(.14,.018,6,18),mats.applianceDark,{position:[x,1.325,z],rotation:[Math.PI/2,0,0],name:'cooktop-burner'}); root.add(burner); }
  box(root,[1.18,.16,.65],[2.38,2.42,-2.62],mats.appliance,'range-hood');
  box(root,[.58,.72,.42],[2.38,2.8,-2.78],mats.appliance,'range-hood-flue');
  box(root,[.62,.5,.4],[.88,.83,-2.28],mats.applianceDark,'dishwasher-panel');
  box(root,[.38,.035,.035],[.88,1.0,-2.245],mats.gold,'dishwasher-handle');
}

function compactSpeaker(root,{x,y,z,mats,name='speaker'}) {
  box(root,[.28,.64,.26],[x,y,z],mats.applianceDark,name);
  for(const sy of [-.16,.16]) { const cone=mesh(new THREE.CylinderGeometry(.085,.085,.025,18),mats.screen,{position:[x,y+sy,z+.145],rotation:[Math.PI/2,0,0],name:`${name}-driver`}); root.add(cone); }
}

function phone(root,{x,y,z,rotation=0,mats,name='phone'}) {
  const device=box(root,[.22,.025,.4],[x,y,z],mats.applianceDark,name); device.rotation.y=rotation;
  const display=box(root,[.18,.01,.34],[x,y+.018,z],mats.screen,`${name}-screen`); display.rotation.y=rotation;
}

function secondFloorWithStairwell(root,mats) {
  const y=3.42;
  // Compact square well for the spiral stair. It replaces the long slot that
  // belonged to the former straight flight and frees more usable floor area.
  box(root,[2.96,.18,6.56],[-2.63,y,0],mats.floorLight,'second-floor-left');
  box(root,[3.36,.18,6.56],[2.83,y,0],mats.floorLight,'second-floor-right');
  box(root,[2.3,.18,2.13],[0,y,-2.215],mats.floorLight,'second-floor-stair-back');
  box(root,[2.3,.18,2.13],[0,y,2.215],mats.floorLight,'second-floor-stair-front');
}

function spiralTreadGeometry(innerRadius,outerRadius,startAngle,endAngle,thickness) {
  const shape=new THREE.Shape(),segments=8;
  shape.moveTo(Math.cos(startAngle)*outerRadius,Math.sin(startAngle)*outerRadius);
  for(let i=1;i<=segments;i++){ const angle=THREE.MathUtils.lerp(startAngle,endAngle,i/segments); shape.lineTo(Math.cos(angle)*outerRadius,Math.sin(angle)*outerRadius); }
  for(let i=segments;i>=0;i--){ const angle=THREE.MathUtils.lerp(startAngle,endAngle,i/segments); shape.lineTo(Math.cos(angle)*innerRadius,Math.sin(angle)*innerRadius); }
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape,{depth:thickness,bevelEnabled:true,bevelSize:.018,bevelThickness:.012,bevelSegments:2,curveSegments:8});
}

function staircase(root,mats) {
  const group=new THREE.Group(); group.name='MainStaircase';
  const centerX=0,centerZ=0,steps=17,inner=.24,outer=1.0;
  const start=-Math.PI*.72,stepAngle=THREE.MathUtils.degToRad(24),rise=2.92/(steps-1),baseY=.4;
  const railPoints=[];

  // A pale central column and stepped collars give the stair a residential,
  // European character instead of an exposed industrial spiral.
  group.add(mesh(new THREE.CylinderGeometry(.16,.2,3.22,18),mats.cream,{position:[centerX,1.93,centerZ],name:'spiral-stair-center-column'}));
  for(const y of [.42,3.45]) group.add(mesh(new THREE.TorusGeometry(.23,.045,8,24),mats.gold,{position:[centerX,y,centerZ],rotation:[Math.PI/2,0,0],name:'spiral-column-collar'}));

  for(let i=0;i<steps;i++){
    const angle=start+i*stepAngle,stepY=baseY+i*rise;
    const tread=mesh(spiralTreadGeometry(inner,outer,angle-.035,angle+stepAngle+.04,.145),mats.wood,{position:[centerX,stepY,centerZ],rotation:[-Math.PI/2,0,0],name:`spiral-stair-step-${i+1}`});
    group.add(tread);

    const outerAngle=angle+stepAngle*.72,x=centerX+Math.cos(outerAngle)*.94,z=centerZ-Math.sin(outerAngle)*.94;
    const postBottom=stepY+.13,postTop=postBottom+.72;
    group.add(mesh(new THREE.CylinderGeometry(.028,.035,.72,10),mats.gold,{position:[x,postBottom+.36,z],name:'spiral-stair-baluster'}));
    railPoints.push([x,postTop,z]);
  }
  for(let i=1;i<railPoints.length;i++) group.add(cylinderBetween(railPoints[i-1],railPoints[i],.043,mats.gold,10));

  // Heavier newel posts visually finish both ends of the curved handrail.
  for(const point of [railPoints[0],railPoints.at(-1)]){
    group.add(mesh(new THREE.CylinderGeometry(.065,.08,.84,12),mats.cream,{position:[point[0],point[1]-.3,point[2]],name:'spiral-stair-newel'}));
    group.add(mesh(new THREE.SphereGeometry(.09,12,9),mats.gold,{position:[point[0],point[1]+.13,point[2]],name:'spiral-stair-newel-cap'}));
  }
  root.add(group);
}

function bayPassage(root,{baseY,mats,name}) {
  const x=4.54,z=-.6,straight=1.45,radius=.72;
  box(root,[.16,straight,.12],[x,baseY+straight/2,z-radius],mats.cream,`${name}-rear-trim`);
  box(root,[.16,straight,.12],[x,baseY+straight/2,z+radius],mats.cream,`${name}-front-trim`);
  const arch=mesh(new THREE.TorusGeometry(radius,.065,8,28,Math.PI),mats.cream,{position:[x,baseY+straight,z],rotation:[0,Math.PI/2,0],name:`${name}-arched-trim`}); root.add(arch);
  box(root,[.18,.12,1.58],[x,baseY+.04,z],mats.cream,`${name}-threshold`);
}

export function createInterior() {
  const root=new THREE.Group(); root.name='HouseInterior'; root.visible=false;
  const mats=interiorMaterials();
  box(root,[8.62,.2,6.56],[.2,.34,0],mats.floor,'ground-floor');
  secondFloorWithStairwell(root,mats);
  box(root,[3.62,.2,3.38],[5.2,.34,-.55],mats.floorLight,'bay-ground-floor');
  box(root,[3.62,.18,3.38],[5.2,3.42,-.55],mats.floor,'bay-second-floor');
  box(root,[.15,3,1.12],[.78,4.96,-2.58],mats.wall,'upper-room-divider');
  box(root,[8.55,.12,.18],[.2,3.18,-3.14],mats.cream,'interior-ceiling-trim');
  staircase(root,mats);
  bayPassage(root,{baseY:.36,mats,name:'ground-bay-passage'});
  bayPassage(root,{baseY:3.5,mats,name:'upper-bay-passage'});

  const rug=mesh(new THREE.CylinderGeometry(1.72,1.72,.035,48),mats.blush,{position:[-2.45,.48,-1.05],name:'living-room-rug'}); rug.scale.z=.68; root.add(rug);
  const entranceRug=mesh(new THREE.CylinderGeometry(.86,.86,.035,40),mats.fabric,{position:[0,.43,2.78],name:'entrance-rug'}); entranceRug.scale.z=.7; root.add(entranceRug);
  shoeCabinet(root,{x:-2.05,y:.34,z:3.3,mats});
  sofa(root,{x:-2.5,y:.34,z:.15,rotation:Math.PI,mats});
  table(root,{x:-2.45,y:.83,z:-1.18,width:1.38,depth:.72,material:mats.wood});
  lamp(root,{x:-3.7,y:.34,z:-1.15,mats});
  cup(root,{x:-2.72,y:.98,z:-1.2,mats});
  root.add(mesh(new THREE.CylinderGeometry(.23,.23,.045,24),mats.cream,{position:[-2.18,.93,-1.15],name:'coffee-table-tray'}));
  box(root,[2.25,.48,.42],[-2.45,.72,-2.74],mats.wood,'living-console');
  television(root,{x:-2.45,y:.98,z:-2.91,mats});
  compactSpeaker(root,{x:-3.55,y:1.28,z:-2.68,mats,name:'left-tv-speaker'});
  compactSpeaker(root,{x:-1.35,y:1.28,z:-2.68,mats,name:'right-tv-speaker'});
  plant(root,{x:-1.35,y:.98,z:-2.65,scale:.82,mats,name:'living-console-plant'});
  framedArt(root,{x:-3.25,y:2.35,z:-3.15,width:.78,height:.58,mats,name:'living-art-one'});
  framedArt(root,{x:-2.15,y:2.45,z:-3.15,width:.94,height:.7,mats,name:'living-art-two'});
  // A slim console behind the sofa uses the otherwise empty circulation
  // space without entering the sofa-to-TV viewing axis.
  box(root,[2.05,.12,.38],[-2.45,.9,1.15],mats.wood,'sofa-back-console-top');
  for(const x of [-3.28,-1.62]) box(root,[.1,.72,.1],[x,.51,1.15],mats.wood,'sofa-back-console-leg');
  root.add(mesh(new THREE.CylinderGeometry(.13,.16,.2,16),mats.cream,{position:[-2.9,1.08,1.15],name:'sofa-back-console-vase'}));
  plant(root,{x:-2.0,y:.98,z:1.15,scale:.62,mats,name:'sofa-back-console-plant'});
  pendant(root,{x:-2.45,y:2.72,z:.55,mats,name:'living-pendant'});

  table(root,{x:2.15,y:1.12,z:1.18,width:1.65,depth:1.12,material:mats.wood});
  chair(root,{x:1.08,y:.36,z:1.18,rotation:-Math.PI/2,material:mats.cream});
  chair(root,{x:3.22,y:.36,z:1.18,rotation:Math.PI/2,material:mats.cream});
  chair(root,{x:2.15,y:.36,z:2.02,rotation:Math.PI,material:mats.cream});
  for(const [x,z] of [[1.82,1.02],[2.48,1.02]]) { root.add(mesh(new THREE.CylinderGeometry(.2,.2,.025,24),mats.cream,{position:[x,1.2,z],name:'dining-plate'})); cup(root,{x:x+.18,y:1.28,z:z+.12,mats}); }
  const vase=mesh(new THREE.CylinderGeometry(.11,.17,.32,16),mats.blush,{position:[2.15,1.34,1.42],name:'dining-vase'}); root.add(vase);
  for(const dx of [-.14,0,.14]) { const flower=mesh(new THREE.SphereGeometry(.09,9,7),mats.cream,{position:[2.15+dx,1.66+Math.abs(dx),1.42],name:'table-flower'}); root.add(flower); }
  pendant(root,{x:2.15,y:2.7,z:1.18,mats,name:'dining-pendant'});
  box(root,[2.5,.92,.72],[1.6,.84,-2.68],mats.cream,'kitchen-counter');
  refrigerator(root,{x:3.55,y:.34,z:-2.62,mats});
  for(const x of [.72,1.72]) box(root,[.78,.62,.36],[x,2.27,-2.84],mats.wood,'wall-cabinet');
  root.add(mesh(new THREE.CylinderGeometry(.24,.18,.3,18),mats.blush,{position:[2.22,1.48,-2.53],name:'kitchen-pot'}));
  box(root,[.74,.055,.45],[1.65,1.32,-2.45],mats.dark,'kitchen-sink');
  const faucet=mesh(new THREE.TorusGeometry(.18,.025,8,18,Math.PI),mats.gold,{position:[1.65,1.5,-2.68],rotation:[0,0,Math.PI/2],name:'kitchen-faucet'}); root.add(faucet);
  for(const x of [.72,1.72,2.72]) box(root,[.64,.035,.08],[x,1.91,-2.61],mats.glow,'under-cabinet-light');
  plant(root,{x:.52,y:1.31,z:-2.42,scale:.7,mats,name:'kitchen-herb'});
  kitchenElectronics(root,{mats});
  pendant(root,{x:1.85,y:2.72,z:-1.8,mats,name:'kitchen-pendant'});

  bed(root,{x:-2.3,y:3.5,z:-.55,mats});
  box(root,[.65,.55,.65],[-3.82,3.82,-1.15],mats.wood,'bedside-table');
  box(root,[.65,.55,.65],[-.78,3.82,-1.15],mats.wood,'bedside-table');
  tableLamp(root,{x:-3.82,y:4.13,z:-1.15,mats,name:'left-bedside-lamp'});
  tableLamp(root,{x:-.78,y:4.13,z:-1.15,mats,name:'right-bedside-lamp',light:false});
  phone(root,{x:-.8,y:4.115,z:-1.12,rotation:.12,mats,name:'bedside-phone'});
  const bedroomRug=mesh(new THREE.CylinderGeometry(1.55,1.55,.035,44),mats.fabric,{position:[-2.3,3.58,1.15],name:'bedroom-rug'}); bedroomRug.scale.z=.52; root.add(bedroomRug);
  framedArt(root,{x:-2.3,y:5.7,z:-3.14,width:1.4,height:.72,mats,name:'bedroom-landscape'});
  pendant(root,{x:-2.3,y:6.08,z:.7,mats,light:false,name:'bedroom-ceiling-fixture'});
  table(root,{x:2.25,y:4.28,z:.8,width:1.9,depth:.75,material:mats.wood});
  chair(root,{x:2.25,y:3.52,z:1.55,rotation:Math.PI,material:mats.blush});
  // Bring the bookcase into the study sightline and turn its broad face toward
  // the interior camera, instead of leaving it almost hidden at the bay edge.
  shelf(root,{x:2.4,y:3.5,z:-3.42,mats});
  // Rotate the vanity onto the bedroom's left wall; its mirror/back now sit
  // against the wall instead of floating in the room.
  const bedroomVanity=vanity(root,{x:-3.96,y:3.5,z:1.15,mats}); bedroomVanity.rotation.y=Math.PI/2;
  wallMirror(root,{x:-4.16,y:4.86,z:1.15,rotation:Math.PI/2,mats,name:'bedroom-wall-mirror'});
  wardrobe(root,{x:-.15,y:3.5,z:-3.22,mats});
  box(root,[1.5,.09,.8],[.95,3.58,-2.45],mats.sage,'upper-reading-rug');
  box(root,[.92,.06,.56],[2.18,4.4,.68],mats.dark,'desk-laptop-base');
  box(root,[.78,.48,.055],[2.18,4.68,.42],mats.dark,'desk-laptop-screen');
  box(root,[.32,.08,.12],[2.18,4.45,1.02],mats.applianceDark,'desk-keyboard');
  compactSpeaker(root,{x:3.02,y:4.57,z:.55,mats,name:'study-speaker'});
  cup(root,{x:2.82,y:4.43,z:.72,mats});
  tableLamp(root,{x:1.48,y:4.36,z:.72,mats,name:'study-desk-lamp'});
  for(const [x,z,s] of [[.65,-2.65,.82],[3.15,-1.85,.72]]) plant(root,{x,y:3.57,z,scale:s,mats,name:'study-plant'});
  framedArt(root,{x:1.2,y:5.62,z:-3.14,width:.72,height:.9,mats,name:'study-art'});

  bayLounge(root,mats);
  bayBathroom(root,mats);

  root.traverse(object=>{ if(object.isMesh){ object.castShadow=true; object.receiveShadow=true; } });
  return root;
}
