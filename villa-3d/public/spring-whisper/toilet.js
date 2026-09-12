import * as T from './three.module.js';

// Full-size sanitary ware, metres; front is +Z. Open seat and bowl are
// continuous elliptical profile surfaces, not solid overlapping spheres.
export function createToilet() {
  const root=new T.Group();root.name='Glazed ceramic toilet';
  const ceramic=new T.MeshPhysicalMaterial({color:'#faf8f2',roughness:.19,clearcoat:.65,clearcoatRoughness:.12,side:T.DoubleSide});
  const seatMaterial=new T.MeshPhysicalMaterial({color:'#fffdf8',roughness:.27,clearcoat:.35,side:T.DoubleSide});
  const brass=new T.MeshStandardMaterial({color:'#b99a63',metalness:.85,roughness:.23});
  const water=new T.MeshPhysicalMaterial({color:'#c4dfdf',roughness:.09,transparent:true,opacity:.65,metalness:.08});
  function add(name,geo,mat){const mesh=new T.Mesh(geo,mat);mesh.name=name;mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);return mesh;}
  // Each section: height, X radius, Z radius, Z centre. Profiles return
  // inward/downward where needed, keeping a genuine cavity in the basin.
  function loft(name,profile,mat){
    const positions=[],indices=[],n=96;
    for(const [y,rx,rz,cz] of profile)for(let i=0;i<=n;i++){
      const a=i/n*Math.PI*2;positions.push(rx*Math.cos(a),y,cz+rz*Math.sin(a));
    }
    for(let j=0;j<profile.length-1;j++)for(let i=0;i<n;i++){
      const a=j*(n+1)+i,b=a+n+1;indices.push(a,b,a+1,b,b+1,a+1);
    }
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();return add(name,geo,mat);
  }
  loft('Sculpted ceramic pedestal',[
    [.004,0,0,-.055],[.004,.118,.185,-.055],[.014,.133,.199,-.055],
    [.035,.135,.20,-.055],[.07,.125,.19,-.055],[.16,.105,.155,-.065],
    [.25,.108,.16,-.055],[.32,.137,.20,-.015],[.34,.14,.21,-.01]
  ],ceramic);
  loft('Open glazed bowl',[
    [.23,.075,.105,.07],[.25,.115,.16,.065],[.29,.151,.216,.07],
    [.35,.18,.257,.068],[.393,.187,.27,.068],[.407,.183,.267,.068],
    [.411,.169,.249,.068],[.408,.149,.228,.068],[.397,.142,.218,.068],
    [.367,.135,.203,.068],[.33,.113,.168,.065],[.285,.078,.11,.06],
    [.26,.054,.075,.045],[.255,0,0,.045]
  ],ceramic);
  loft('Slim oval seat with open centre',[
    [.421,.181,.263,.068],[.418,.173,.255,.068],[.418,.142,.216,.068],
    [.424,.138,.212,.068],[.439,.14,.214,.068],[.445,.149,.227,.068],
    [.445,.172,.255,.068],[.438,.183,.266,.068],[.421,.181,.263,.068]
  ],seatMaterial);
  // Rounded rectangular water tank, with bevelled ceramic edge instead of a cube.
  function roundedBox(name,w,h,d,x,y,z,mat,r=.025){
    const s=new T.Shape(),a=-w/2,b=-h/2;
    s.moveTo(a+r,b);s.lineTo(a+w-r,b);s.quadraticCurveTo(a+w,b,a+w,b+r);
    s.lineTo(a+w,b+h-r);s.quadraticCurveTo(a+w,b+h,a+w-r,b+h);
    s.lineTo(a+r,b+h);s.quadraticCurveTo(a,b+h,a,b+h-r);
    s.lineTo(a,b+r);s.quadraticCurveTo(a,b,a+r,b);
    const geo=new T.ExtrudeGeometry(s,{depth:d-.012,bevelEnabled:true,bevelThickness:.006,bevelSize:.006,bevelSegments:3,steps:1,curveSegments:12});
    geo.translate(0,0,-(d-.012)/2);const o=add(name,geo,mat);o.position.set(x,y,z);return o;
  }
  roundedBox('Rounded porcelain cistern',.338,.345,.155,0,.578,-.222,ceramic);
  roundedBox('Cistern lid',.354,.026,.171,0,.766,-.222,ceramic,.011);
  // Raised lid leaves the basin visible. Hinge rests just behind the seat.
  const lid=add('Raised soft-close lid',new T.SphereGeometry(1,48,32),seatMaterial);
  lid.scale.set(.175,.235,.018);lid.position.set(0,.668,-.137);lid.rotation.x=-.08;
  for(const x of [-.085,.085]){
    const hinge=add('Brass soft-close hinge',new T.CylinderGeometry(.015,.015,.065,24),brass);
    hinge.rotation.z=Math.PI/2;hinge.position.set(x,.435,-.156);
  }
  const button=add('Dual flush button',new T.CylinderGeometry(.029,.029,.007,48),brass);button.position.set(.095,.788,-.233);
  const split=add('Flush button divider',new T.BoxGeometry(.0015,.001,.048),ceramic);split.position.set(.095,.792,-.233);
  const pool=add('Recessed water surface',new T.CircleGeometry(1,48),water);pool.rotation.x=-Math.PI/2;pool.scale.set(.056,.079,1);pool.position.set(0,.269,.045);pool.castShadow=false;
  root.userData.dimensions=[.374,.622,.921];
  return root;
}
