import * as THREE from 'three';

const targetNames={living_sofa:'LivingRoomSofa',living_tv:'LivingRoomTelevision',kitchen_fridge:'KitchenRefrigerator',bedroom_bed:'UpstairsBed',bedroom_wardrobe:'BedroomWardrobe',bedroom_vanity:'BedroomVanity',study_bookshelf:'BookShelf',bay_lounge:'BaySmallLounge',bathroom_set:'BayBathroom',garden_car:'SmallEuropeanLuxurySedan'};
const tones={pink:0xcdaeb4,cream:0xe7ddd0,purple:0x8c8191,wood:0xa98772,blue:0xaebdcc,green:0x99aa98,peach:0xc59c8f,yellow:0xd8c69a};
const schemes={
  '3d-sofa-cream':{primary:0xd9d0c7,accent:0xeee9e1,wood:0x8c7468},'3d-sofa-mauve':{primary:0x8f818d,accent:0xcfc2cb,wood:0x66565f},
  '3d-bed-rose':{primary:0xb98591,accent:0xeee5e0,wood:0x9d766f},'3d-bed-lavender':{primary:0xa69baa,accent:0xe8e2e8,wood:0x8f7775},
  '3d-wardrobe-cream':{primary:0xeeeae5,accent:0xc9b8aa,wood:0xaa8978},'3d-wardrobe-mauve':{primary:0xaaa0ad,accent:0xeee9e5,wood:0x817079},
  '3d-shelf-oak':{primary:0xa98772,accent:0xeee4d8,wood:0x94725f},'3d-shelf-cream':{primary:0xeeeae5,accent:0xc4afb5,wood:0xc0a38e},
  '3d-tv-gallery':{primary:0xeeeae5,accent:0x9f806d,wood:0x8f7160},'3d-tv-console':{primary:0x827681,accent:0xd9d2cf,wood:0x62575e},
  '3d-fridge-french':{primary:0xe4dfd8,accent:0xb9b1aa,wood:0x9b8176},'3d-fridge-mauve':{primary:0x918590,accent:0xd8d0ce,wood:0x6f626a},
  '3d-vanity-rose':{primary:0xb98591,accent:0xeee5e0,wood:0x9d766f},'3d-vanity-cream':{primary:0xeeeae5,accent:0xc7aeb5,wood:0xaa8978},
  '3d-lounge-curved':{primary:0xc8a7af,accent:0xeee7e2,wood:0x9a796b},'3d-lounge-club':{primary:0x8f818d,accent:0xd9ccd2,wood:0x78646a},
  '3d-bath-clawfoot':{primary:0xeeeae5,accent:0xb9d0d2,wood:0xa88a79},'3d-bath-rose':{primary:0xc9aab1,accent:0xc2d5d7,wood:0x92757a},
  '3d-car-aubergine':{primary:0x625a65,accent:0xe7e0d8},'3d-car-pearl':{primary:0xd9d4ce,accent:0xb7a9a3}
};

function mat(color,roughness=.84,metalness=0){return new THREE.MeshStandardMaterial({color,roughness,metalness});}
function box(root,size,position,material,name=''){const object=new THREE.Mesh(new THREE.BoxGeometry(...size,2,2,2),material);object.position.set(...position);object.name=name;object.castShadow=true;object.receiveShadow=true;root.add(object);return object;}
function cylinder(root,{radius=.1,height=.2,position=[0,0,0],material,rotation=[0,0,0],segments=20,name=''}){const object=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,height,segments),material);object.position.set(...position);object.rotation.set(...rotation);object.name=name;object.castShadow=true;object.receiveShadow=true;root.add(object);return object;}
function materials(scheme){return{primary:mat(scheme.primary,.91),accent:mat(scheme.accent,.9),wood:mat(scheme.wood||0x92766b,.78),metal:mat(0x9b918a,.4,.46),dark:mat(0x514b50,.9)};}
function legs(root,width,depth,mats,height=.32){for(const x of[-1,1])for(const z of[-1,1])box(root,[.09,height,.09],[x*(width/2-.12),height/2,z*(depth/2-.11)],mats.wood,'variant-leg');}

function createSofaVariant(itemId,scheme){
  const root=new THREE.Group(),mats=materials(scheme),channelled=itemId==='3d-sofa-mauve';root.name='EquippedSofaVariant';
  box(root,[2.5,.42,.84],[0,.42,0],mats.primary,'variant-sofa-base');legs(root,2.45,.8,mats,.3);
  if(channelled){
    for(const x of[-.88,-.29,.29,.88])box(root,[.52,.78,.22],[x,.92,-.32],mats.primary,'variant-sofa-channel');
    for(const x of[-.58,.58])box(root,[1,.17,.61],[x,.69,.06],mats.accent,'variant-sofa-seat');
    for(const x of[-1.14,1.14])box(root,[.24,.6,.82],[x,.64,0],mats.primary,'variant-sofa-square-arm');
  }else{
    box(root,[2.25,.68,.2],[0,.88,-.32],mats.primary,'variant-sofa-back');
    for(const x of[-.76,0,.76])box(root,[.67,.17,.61],[x,.69,.06],mats.accent,'variant-sofa-cushion');
    for(const x of[-1.13,1.13]){const arm=cylinder(root,{radius:.3,height:.82,position:[x,.66,0],material:mats.primary,rotation:[Math.PI/2,0,0],segments:24,name:'variant-sofa-roll-arm'});arm.scale.x=.72;}
  }
  return root;
}

function createBedVariant(itemId,scheme){
  const root=new THREE.Group(),mats=materials(scheme),wing=itemId==='3d-bed-lavender';root.name='EquippedBedVariant';
  box(root,[2.55,.34,2.75],[0,.35,0],mats.wood,'variant-bed-frame');box(root,[2.34,.3,2.55],[0,.63,0],mats.accent,'variant-mattress');box(root,[2.28,.13,1.72],[0,.86,.4],mats.primary,'variant-bed-cover');
  for(const x of[-.58,.58])box(root,[.94,.2,.58],[x,.9,-.78],mats.accent,'variant-pillow');
  if(wing){
    box(root,[2.48,1.45,.2],[0,1.08,-1.28],mats.primary,'variant-wing-headboard');
    for(const x of[-1.3,1.3]){const side=box(root,[.25,1.35,.46],[x,1.04,-1.14],mats.primary,'variant-headboard-wing');side.rotation.y=x<0?-.18:.18;}
    for(const x of[-.75,0,.75])box(root,[.035,1.18,.22],[x,1.08,-1.15],mats.accent,'variant-headboard-channel');
    box(root,[1.72,.2,.55],[0,.24,1.68],mats.primary,'variant-bed-bench');legs(root,1.65,.5,mats,.24);
  }else{
    box(root,[2.5,.88,.2],[0,.91,-1.28],mats.primary,'variant-arched-headboard');
    const crown=new THREE.Mesh(new THREE.TorusGeometry(1.18,.12,8,32,Math.PI),mats.primary);crown.position.set(0,1.34,-1.28);crown.rotation.z=Math.PI;crown.scale.y=.48;crown.castShadow=true;root.add(crown);
    for(const x of[-.65,.65])cylinder(root,{radius:.045,height:.2,position:[x,1.02,-1.14],material:mats.accent,rotation:[Math.PI/2,0,0],segments:12,name:'variant-headboard-button'});
  }
  return root;
}

function createWardrobeVariant(itemId,scheme){
  const root=new THREE.Group(),mats=materials(scheme),panelled=itemId==='3d-wardrobe-mauve';root.name='EquippedWardrobeVariant';
  box(root,[1.45,2.32,.7],[0,1.18,0],mats.primary,'variant-wardrobe-body');box(root,[1.6,.12,.82],[0,2.4,0],mats.accent,'variant-wardrobe-cornice');box(root,[1.54,.1,.76],[0,.06,0],mats.accent,'variant-wardrobe-plinth');
  for(const x of[-.36,.36]){
    box(root,[.65,2.02,.04],[x,1.2,.37],mats.primary,'variant-wardrobe-door');
    if(panelled){box(root,[.5,.7,.055],[x,1.64,.4],mats.accent,'variant-wardrobe-upper-panel');box(root,[.5,.72,.055],[x,.78,.4],mats.accent,'variant-wardrobe-lower-panel');}
    else box(root,[.48,1.72,.055],[x,1.25,.4],mats.wood,'variant-wardrobe-inset');
    cylinder(root,{radius:.025,height:.11,position:[x>0?.06:-.06,1.2,.44],material:mats.metal,segments:12,name:'variant-wardrobe-handle'});
  }
  if(!panelled){const crown=new THREE.Mesh(new THREE.TorusGeometry(.7,.075,8,28,Math.PI),mats.accent);crown.position.set(0,2.33,.02);crown.rotation.z=Math.PI;crown.scale.y=.45;root.add(crown);}
  return root;
}

function createShelfVariant(itemId,scheme){
  const root=new THREE.Group(),mats=materials(scheme),arched=itemId==='3d-shelf-cream';root.name='EquippedShelfVariant';
  box(root,[1.62,2.12,.48],[0,1.06,-.04],mats.primary,'variant-shelf-back');for(const x of[-.79,.79])box(root,[.11,2.18,.6],[x,1.09,.02],mats.wood,'variant-shelf-side');
  for(const y of[.13,.68,1.23,1.78,2.12])box(root,[1.72,.11,.58],[0,y,.02],arched?mats.accent:mats.wood,'variant-shelf-board');
  if(arched){const crown=new THREE.Mesh(new THREE.TorusGeometry(.79,.09,8,28,Math.PI),mats.primary);crown.position.set(0,2.1,0);crown.rotation.z=Math.PI;crown.scale.y=.5;root.add(crown);box(root,[1.48,.5,.05],[0,.39,.29],mats.primary,'variant-shelf-lower-cabinet');}
  else box(root,[1.85,.18,.68],[0,2.24,0],mats.wood,'variant-shelf-heavy-cornice');
  const bookMats=[mats.accent,mats.wood,mat(0x99a095,.9),mat(0xb99da5,.9)];for(let row=0;row<3;row++)for(let col=0;col<5;col++)box(root,[.16+(col%2)*.05,.34+(col%3)*.04,.22],[-.55+col*.27,.36+row*.55,.34],bookMats[(row+col)%bookMats.length],'variant-book');
  return root;
}

function createTVVariant(itemId,scheme){
  const root=new THREE.Group(),mats=materials(scheme),gallery=itemId==='3d-tv-gallery';root.name='EquippedTVVariant';
  box(root,[1.8,1.08,.12],[0,.58,0],gallery?mats.wood:mats.dark,'variant-tv-frame');box(root,[1.65,.92,.035],[0,.58,.075],mats.dark,'variant-tv-screen');
  if(gallery){box(root,[2.2,.12,.42],[0,-.08,0],mats.primary,'variant-tv-gallery-console');for(const x of[-.82,.82])box(root,[.08,.28,.08],[x,-.28,0],mats.wood,'variant-tv-gallery-leg');}
  else{box(root,[.1,.36,.1],[0,-.09,0],mats.metal,'variant-tv-stand');box(root,[.78,.07,.38],[0,-.29,0],mats.metal,'variant-tv-foot');for(const x of[-1.15,1.15]){box(root,[.3,.95,.24],[x,.3,0],mats.primary,'variant-tv-speaker');for(const y of[.05,.48])cylinder(root,{radius:.08,height:.03,position:[x,y,.14],material:mats.accent,rotation:[Math.PI/2,0,0],name:'variant-speaker-driver'});}}
  return root;
}

function createFridgeVariant(itemId,scheme){
  const root=new THREE.Group(),mats=materials(scheme),retro=itemId==='3d-fridge-mauve';root.name='EquippedFridgeVariant';
  box(root,[1.34,2.35,.72],[0,1.18,0],mats.primary,'variant-fridge-body');box(root,[1.42,.1,.78],[0,2.39,0],mats.accent,'variant-fridge-cap');
  if(retro){box(root,[1.2,1.37,.035],[0,1.6,.38],mats.primary,'variant-retro-upper-door');box(root,[1.2,.72,.035],[0,.48,.38],mats.primary,'variant-retro-lower-door');for(const y of[.55,1.55])box(root,[.07,.58,.06],[.38,y,.43],mats.metal,'variant-retro-handle');}
  else{for(const x of[-.31,.31]){box(root,[.58,1.42,.035],[x,1.6,.38],mats.primary,'variant-french-door');box(root,[.035,.75,.055],[x<0?-.08:.08,1.6,.43],mats.metal,'variant-french-handle');}box(root,[1.2,.64,.035],[0,.45,.38],mats.primary,'variant-freezer-drawer');box(root,[.5,.035,.055],[0,.66,.43],mats.metal,'variant-freezer-handle');}
  return root;
}

function createVanityVariant(itemId,scheme){
  const root=new THREE.Group(),mats=materials(scheme),folding=itemId==='3d-vanity-cream';root.name='EquippedVanityVariant';
  box(root,[1.52,.12,.46],[0,.68,0],mats.primary,'variant-vanity-top');for(const x of[-.48,0,.48])box(root,[.42,.4,.38],[x,.44,0],mats.primary,'variant-vanity-drawer');for(const x of[-.6,.6])box(root,[.09,.62,.09],[x,.32,0],mats.wood,'variant-vanity-leg');
  if(folding){for(const x of[-.43,0,.43]){const mirror=box(root,[x?.38:.48,.82,.055],[x,1.18,-.18],mats.accent,'variant-folding-mirror');if(x)mirror.rotation.y=x<0?.22:-.22;}}
  else{const rim=new THREE.Mesh(new THREE.TorusGeometry(.42,.055,8,28),mats.accent);rim.position.set(0,1.22,-.18);rim.scale.y=1.18;root.add(rim);box(root,[.66,.92,.025],[0,1.22,-.15],mats.dark,'variant-oval-mirror');}
  box(root,[.78,.08,.38],[0,.07,.45],mats.accent,'variant-vanity-stool');return root;
}

function createLoungeVariant(itemId,scheme){
  const root=new THREE.Group(),mats=materials(scheme),club=itemId==='3d-lounge-club';root.name='EquippedLoungeVariant';
  if(club){for(const x of[4.55,5.85]){box(root,[.92,.4,.72],[x,.49,-.82],mats.primary,'variant-club-seat');box(root,[.85,.68,.18],[x,.9,-1.08],mats.primary,'variant-club-back');for(const dx of[-.43,.43])box(root,[.16,.5,.74],[x+dx,.67,-.82],mats.primary,'variant-club-arm');}}
  else{for(const x of[4.3,5.2,6.1]){const seat=box(root,[.98,.42,.72],[x,.49,-.78+Math.abs(x-5.2)*.08],mats.primary,'variant-curved-seat');seat.rotation.y=-(x-5.2)*.13;const back=box(root,[.92,.66,.18],[x,.88,-1.06+Math.abs(x-5.2)*.08],mats.primary,'variant-curved-back');back.rotation.y=seat.rotation.y;}}
  cylinder(root,{radius:.48,height:.09,position:[5.2,.89,.08],material:mats.wood,segments:28,name:'variant-lounge-table'});cylinder(root,{radius:.07,height:.52,position:[5.2,.62,.08],material:mats.metal,name:'variant-lounge-table-leg'});return root;
}

function createBathroomVariant(itemId,scheme){
  const root=new THREE.Group(),mats=materials(scheme),inset=itemId==='3d-bath-rose';root.name='EquippedBathroomVariant';
  box(root,[1.3,.5,1.72],[6.1,3.82,-1.22],mats.primary,'variant-bathtub');box(root,[1.05,.055,1.44],[6.1,4.1,-1.22],mats.accent,'variant-bath-water');
  if(!inset)for(const[x,z]of[[5.55,-1.9],[6.65,-1.9],[5.55,-.54],[6.65,-.54]])cylinder(root,{radius:.08,height:.3,position:[x,3.57,z],material:mats.metal,name:'variant-claw-foot'});
  box(root,[1.2,.1,.5],[4.15,4.0,-2.12],mats.accent,'variant-bath-sink');box(root,[.75,inset?.72:1.05,.42],[4.15,3.6,-2.12],inset?mats.primary:mats.wood,'variant-bath-vanity');
  cylinder(root,{radius:.32,height:.42,position:[6.8,3.8,.92],material:mats.accent,segments:24,name:'variant-toilet'});box(root,[.54,.58,.16],[6.8,4.13,1.16],mats.accent,'variant-toilet-tank');box(root,[1.08,.9,.035],[4.15,4.84,-2.38],mats.dark,'variant-bath-mirror');return root;
}

function rememberCar(target){target.traverse(object=>{if(object.isMesh&&object.material)object.userData.houseOriginalMaterial=object.material;});}
function resetCar(target){target.getObjectByName('EquippedCarDetails')?.removeFromParent();target.traverse(object=>{if(object.isMesh&&object.userData.houseOriginalMaterial)object.material=object.userData.houseOriginalMaterial;});}
function paintCar(target,color){target.traverse(object=>{if(!object.isMesh||!object.material?.color)return;if(/car-(lower-body|long-bonnet|short-trunk|roof-shell|door-seam)/.test(object.name)){object.material=object.material.clone();object.material.color.setHex(color);}});}
function addCarDetails(target,itemId,scheme){
  const root=new THREE.Group();root.name='EquippedCarDetails';const metal=mat(0xb7b0aa,.3,.62),body=mat(scheme.primary,.31,.08),pearl=itemId==='3d-car-pearl';
  if(pearl){box(root,[.08,.07,3.35],[0,.69,0],metal,'pearl-rocker-trim');box(root,[.34,.09,.06],[-2.15,1.18,0],metal,'pearl-hood-ornament');for(const z of[-.55,-.27,0,.27,.55])box(root,[.08,.43,.025],[-2.48,.72,z],metal,'pearl-grille-vane');}
  else{box(root,[1.65,.06,.06],[.72,1.82,0],metal,'aubergine-roof-spine');for(const z of[-.62,.62])box(root,[.38,.08,.08],[-2.42,.95,z],body,'aubergine-lamp-brow');box(root,[.09,.12,1.4],[2.44,.8,0],metal,'aubergine-rear-trim');}
  target.add(root);
}
function disposeGroup(group){group.traverse(object=>{if(!object.isMesh)return;object.geometry?.dispose?.();const mats=Array.isArray(object.material)?object.material:[object.material];mats.forEach(material=>material?.dispose?.());});group.removeFromParent();}

export function createFurnitureController(scene){
  const targets=Object.fromEntries(Object.entries(targetNames).map(([slot,name])=>[slot,scene.getObjectByName(name)]));if(targets.garden_car)rememberCar(targets.garden_car);const active={},vanityMirror=scene.getObjectByName('bedroom-wall-mirror');
  return{apply(items={}){
    for(const[slot,target]of Object.entries(targets)){
      if(!target)continue;
      if(slot==='garden_car'){
        resetCar(target);const selection=items[slot];if(!selection)continue;const base=schemes[selection.itemId]||schemes['3d-car-aubergine'];const scheme={...base,primary:tones[selection.tone]||base.primary};paintCar(target,scheme.primary);addCarDetails(target,selection.itemId,scheme);continue;
      }
      if(active[slot]){disposeGroup(active[slot]);active[slot]=null;}target.visible=true;if(slot==='bedroom_vanity'&&vanityMirror)vanityMirror.visible=true;const selection=items[slot];if(!selection)continue;const base=schemes[selection.itemId];if(!base)continue;
      const scheme={...base,primary:tones[selection.tone]||base.primary};const factories={living_sofa:createSofaVariant,living_tv:createTVVariant,kitchen_fridge:createFridgeVariant,bedroom_bed:createBedVariant,bedroom_wardrobe:createWardrobeVariant,bedroom_vanity:createVanityVariant,study_bookshelf:createShelfVariant,bay_lounge:createLoungeVariant,bathroom_set:createBathroomVariant};const factory=factories[slot];if(!factory)continue;
      const replacement=factory(selection.itemId,scheme);replacement.position.copy(target.position);replacement.rotation.copy(target.rotation);replacement.scale.copy(target.scale);replacement.userData.equippedItemId=selection.itemId;target.parent.add(replacement);target.visible=false;active[slot]=replacement;
      if(slot==='bedroom_vanity'&&vanityMirror)vanityMirror.visible=false;
    }
  }};
}
