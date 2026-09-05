import * as THREE from 'three';
import { box, mesh, cylinderBetween } from '../../utils/geometry.js';

function archShape(width,height) { const r=width/2, straight=height-r; const s=new THREE.Shape(); s.moveTo(-r,0); s.lineTo(r,0); s.lineTo(r,straight); s.absarc(0,straight,r,0,Math.PI,false); s.closePath(); return s; }

export function createArchedWindow({width=1.35,height=2.3,materials,warm=true,name='ArchedWindow'}) {
  const root=new THREE.Group(); root.name=name; const outer=archShape(width+.34,height+.28), inner=archShape(width,height); outer.holes.push(inner);
  root.add(mesh(new THREE.ExtrudeGeometry(outer,{depth:.18,bevelEnabled:true,bevelSize:.035,bevelThickness:.035,bevelSegments:2}),materials.stone,{position:[0,0,-.05],name:'stone-surround'}));
  const fineOuter=archShape(width+.52,height+.46), fineInner=archShape(width+.42,height+.36); fineOuter.holes.push(fineInner);
  root.add(mesh(new THREE.ExtrudeGeometry(fineOuter,{depth:.055,bevelEnabled:false}),materials.stone,{position:[0,-.09,.025],name:'fine-stone-molding'}));
  root.add(mesh(new THREE.ExtrudeGeometry(inner,{depth:.07,bevelEnabled:false}),warm?materials.warmGlass:materials.glass,{position:[0,0,-.08],name:'recessed-glass'}));
  const r=width/2, straight=height-r, mullionZ=.14;
  box(root,[.065,straight+.02,.09],[0,straight/2,mullionZ],materials.stone,'vertical-mullion');
  box(root,[width-.12,.065,.09],[0,straight*.53,mullionZ],materials.stone,'horizontal-mullion');
  const hub=[0,straight,mullionZ]; [[-r*.82,straight+r*.55,mullionZ],[0,straight+r*.94,mullionZ],[r*.82,straight+r*.55,mullionZ]].forEach(end=>root.add(cylinderBetween(hub,end,.028,materials.stone,8)));
  box(root,[width+.48,.16,.35],[0,-.06,0],materials.stone,'sill'); return root;
}

export function createRoundWindow({radius=.48,materials}) {
  const root=new THREE.Group(); root.name='RoundWindow';
  const pane=mesh(new THREE.CylinderGeometry(radius,radius,.08,40),materials.warmGlass,{rotation:[Math.PI/2,0,0],position:[0,0,-.06]}); root.add(pane);
  const ring=mesh(new THREE.TorusGeometry(radius+.09,.09,10,40),materials.stone,{position:[0,0,-.12]}); root.add(ring);
  for(let i=0;i<8;i++){ const a=i*Math.PI/4; root.add(cylinderBetween([0,0,-.15],[Math.cos(a)*radius*.82,Math.sin(a)*radius*.82,-.15],.018,materials.stone,7)); }
  return root;
}
