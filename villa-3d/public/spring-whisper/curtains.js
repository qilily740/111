import * as T from './three.module.js';

export function createWindowCurtains(openings,floors){
  const linen=new T.MeshStandardMaterial({color:'#b8a4b8',roughness:.97,side:T.DoubleSide});
  const sheer=new T.MeshStandardMaterial({color:'#fff9ef',roughness:.96,transparent:true,opacity:.24,depthWrite:false,side:T.DoubleSide});
  const gold=new T.MeshStandardMaterial({color:'#b69861',metalness:.75,roughness:.32});
  const curtains=[];
  function add(g,geometry,material,x,y,z){const o=new T.Mesh(geometry,material);o.position.set(x,y,z);o.castShadow=material!==sheer;o.receiveShadow=true;g.add(o);return o}
  for(const opening of openings){
    const outline=opening.getObjectByName('WindowRecess')?.geometry.parameters?.shapes;if(!outline)continue;
    const points=outline.getPoints(32),w=Math.max(...points.map(p=>p.x))-Math.min(...points.map(p=>p.x)),h=Math.max(...points.map(p=>p.y));
    const position=opening.getWorldPosition(new T.Vector3()),floor=position.y>=3.4?1:0;
    const top=Math.min(h+.13,(floor?6.32:3.16)-position.y),bottom=(floor?3.46:.54)-position.y;
    if(top-bottom<.45)continue;
    const g=new T.Group();g.name='EuropeanWindowCurtains';g.position.copy(position);g.quaternion.copy(opening.getWorldQuaternion(new T.Quaternion()));g.translateZ(-.26);g.userData.window=opening.uuid;floors[floor].add(g);curtains.push(g);
    const rod=add(g,new T.CylinderGeometry(.011,.011,w+.46,20),gold,0,top,-.01);rod.rotation.z=Math.PI/2;
    for(const sign of [-1,1]){
      add(g,new T.SphereGeometry(.024,16,12),gold,sign*(w/2+.23),top,-.01);
      for(const [material,width,depth] of [[sheer,Math.min(.32,w*.25),.025],[linen,Math.min(.36,w*.28),.065]]){
        const vertices=[],indices=[],nx=32,ny=40;
        for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
          const u=i/nx,v=j/ny,tie=Math.exp(-Math.pow((v-.38)/.13,2));
          const spread=width*(1-.52*tie),x=sign*(w/2+.025)+(u-.5)*spread+sign*.04*tie;
          vertices.push(x,bottom+v*(top-bottom-.035),depth+Math.sin(u*Math.PI*12)*.012*(1-.4*tie));
        }
        for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const k=j*(nx+1)+i;indices.push(k,k+1,k+nx+2,k,k+nx+2,k+nx+1)}
        const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();add(g,geo,material,0,0,0);
      }
      const tie=add(g,new T.TorusGeometry(Math.min(.06,w*.075),.004,6,32),gold,sign*(w/2+.065),bottom+.38*(top-bottom),.07);tie.scale.y=.35;
      const tassel=add(g,new T.ConeGeometry(.014,.075,16),gold,sign*(w/2+.10),bottom+.38*(top-bottom)-.065,.08);
      for(let i=0;i<5;i++){const ring=add(g,new T.TorusGeometry(.016,.002,6,16),gold,sign*(w/2+.025)+(i-2)*.04,top-.012,.01);ring.rotation.y=Math.PI/2}
    }
  }
  return {curtains,update(cut,active){for(const curtain of curtains)curtain.visible=!active||cut.distanceToPoint(curtain.position)>=0}};
}
