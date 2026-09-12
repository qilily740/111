import * as T from './three.module.js';

export function interiorLampLevel(hour){
  const h=((hour%24)+24)%24;
  return h>=17.5?T.MathUtils.smoothstep(h,17.5,18.75):0;
}

export function createInteriorLights(floors){
  const brass=new T.MeshStandardMaterial({color:'#b49763',metalness:.82,roughness:.30});
  const ceramic=new T.MeshStandardMaterial({color:'#eee6d7',roughness:.34});
  const shade=new T.MeshPhysicalMaterial({color:'#eee0c8',roughness:.88,side:T.DoubleSide,transmission:.08,thickness:.0015});
  const glass=new T.MeshPhysicalMaterial({color:'#fff3d8',roughness:.14,transmission:.45,transparent:true,opacity:.58,ior:1.46,depthWrite:false});
  const glow=new T.MeshStandardMaterial({color:'#fff0d2',emissive:'#ffbc72',emissiveIntensity:0,roughness:.30});
  const fixtures=[],sources=[];
  function mesh(group,geometry,material,position){const o=new T.Mesh(geometry,material);o.position.set(...position);o.castShadow=true;o.receiveShadow=true;group.add(o);return o}
  function rod(group,pts,r=.006){return mesh(group,new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p))),40,r,8,false),brass,[0,0,0])}
  function turned(group,y,profile){return mesh(group,new T.LatheGeometry(profile.map(([r,h])=>new T.Vector2(r,h)),32),brass,[0,y,0])}
  function bulb(group,x,y,z){
    const socket=mesh(group,new T.CylinderGeometry(.014,.017,.033,24),ceramic,[x,y-.03,z]);
    const b=mesh(group,new T.SphereGeometry(.021,20,14),glow,[x,y,z]);b.scale.y=1.65;b.castShadow=false;
    return socket;
  }
  function lampshade(group,x,y,z){
    // Separate inner and outer cloth surfaces with actual pleats and rolled rims.
    const positions=[],indices=[],n=96;
    for(let ring=0;ring<2;ring++)for(let i=0;i<n;i++){
      const a=i/n*Math.PI*2,r=(ring?.067:.115)+(i%2?.0018:0);positions.push(x+Math.cos(a)*r,y+ring*.15,z+Math.sin(a)*r);
    }
    for(let i=0;i<n;i++){const k=(i+1)%n;indices.push(i,k,k+n,i,k+n,i+n)}
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();mesh(group,geo,shade,[0,0,0]);
    for(const [dy,r] of [[0,.115],[.15,.067]]){const rim=mesh(group,new T.TorusGeometry(r,.002,6,64),brass,[x,y+dy,z]);rim.rotation.x=Math.PI/2}
    bulb(group,x,y+.045,z);
  }
  function source(group,pos,power,shadow=false){
    const l=new T.PointLight('#ffd1a0',0,5,2);l.position.set(...pos);l.castShadow=shadow;
    if(shadow){l.shadow.mapSize.set(512,512);l.shadow.bias=-.0001;l.shadow.normalBias=.015;l.shadow.camera.near=.05;l.shadow.camera.far=5}
    group.add(l);sources.push({light:l,power});
  }
  function chandelier(floor,x,y,z,arms=5,shadow=false){
    const g=new T.Group();g.name='FrenchBrassChandelier';g.position.set(x,y,z);floors[floor].add(g);fixtures.push(g);
    turned(g,0,[[0,0],[.075,0],[.08,-.012],[.052,-.035],[.017,-.048]]);
    // Alternating interlocking brass chain links connect the canopy to the stem.
    for(let i=0;i<6;i++){const link=mesh(g,new T.TorusGeometry(.016,.003,8,24),brass,[0,-.058-i*.023,0]);link.scale.y=1.3;link.rotation.y=i%2?Math.PI/2:0}
    turned(g,-.22,[[.015,0],[.022,-.04],[.036,-.065],[.028,-.095],[.014,-.14],[.032,-.17],[0,-.19]]);
    for(let i=0;i<arms;i++){
      const a=i/arms*Math.PI*2,dx=Math.cos(a),dz=Math.sin(a);
      rod(g,[[0,-.31,0],[dx*.12,-.40,dz*.12],[dx*.245,-.42,dz*.245],[dx*.30,-.34,dz*.30]],.007);
      const cup=mesh(g,new T.CylinderGeometry(.044,.02,.018,32),brass,[dx*.30,-.325,dz*.30]);
      lampshade(g,dx*.30,-.30,dz*.30);
      const crystal=mesh(g,new T.OctahedronGeometry(.018),glass,[dx*.245,-.455,dz*.245]);crystal.scale.y=2.1;
    }
    source(g,[0,-.43,0],14,shadow);
  }
  function sconce(floor,x,y,z,rotation){
    const g=new T.Group();g.name='FrenchBrassWallSconce';g.userData.wallMounted=true;g.position.set(x,y,z);g.rotation.y=rotation;floors[floor].add(g);fixtures.push(g);
    const plate=mesh(g,new T.SphereGeometry(1,24,16),brass,[0,0,.013]);plate.scale.set(.058,.13,.016);
    for(const dy of [-.098,.098])mesh(g,new T.SphereGeometry(.005,12,8),brass,[0,dy,.029]);
    rod(g,[[0,-.06,.025],[0,-.115,.12],[0,-.09,.22],[0,-.025,.23]],.008);
    mesh(g,new T.CylinderGeometry(.037,.025,.025,32),brass,[0,-.015,.23]);lampshade(g,0,.015,.23);
    source(g,[0,.07,.24],4.5);
  }
  chandelier(0,-1.85,3.195,.55,5,true);
  chandelier(0,-1.70,3.195,-2.3,3);
  chandelier(0,1.8,3.195,-2.6,3);
  chandelier(1,-1.6,6.38,-.4,5,true);
  chandelier(1,2.1,6.38,.9,3);
  sconce(0,-3.095,2.10,-.7,Math.PI/2);
  sconce(0,1.15,2.12,-3.295,0);
  sconce(1,-3.095,5.08,-.65,Math.PI/2);
  sconce(1,.90,5.12,-3.295,0);
  return {fixtures,sources,update(hour,cut,active){
    const level=interiorLampLevel(hour);glow.emissiveIntensity=level*3.2;
    shade.emissive.set('#ffcb91');shade.emissiveIntensity=level*.12;
    for(const {light,power} of sources)light.intensity=power*level;
    for(const fixture of fixtures)if(fixture.userData.wallMounted)fixture.visible=!active||cut.distanceToPoint(fixture.position)>=0;
    return level;
  }};
}
