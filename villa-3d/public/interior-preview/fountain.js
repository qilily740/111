import * as T from './three.module.js';

// Geometry is exported from realistic-fountain.blend, in Three.js Y-up coordinates.
export function createBlenderFountain(parent){
  const root=new T.Group(); root.name='BlenderRealisticFountain';
  root.position.set(-3.5,.03,4.3); root.scale.setScalar(.75); parent.add(root);
  const animated=[];
  const stone=new T.MeshStandardMaterial({color:'#dfd2ba',roughness:.72});
  // Recreate the Blender procedural limestone grain for the real-time renderer.
  const size=128,data=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const grain=((x*73+y*151+x*y*19)%29)-14;
    const vein=9*Math.sin(x*.09+Math.sin(y*.055)*2);
    const i=(y*size+x)*4;
    data[i]=data[i+1]=data[i+2]=Math.round(210+grain+vein); data[i+3]=255;
  }
  const texture=new T.DataTexture(data,size,size,T.RGBAFormat);
  texture.wrapS=texture.wrapT=T.RepeatWrapping; texture.needsUpdate=true;
  stone.bumpMap=texture; stone.bumpScale=.012;
  const water=new T.MeshPhysicalMaterial({color:'#d5ebea',roughness:.07,metalness:0,
    transmission:.35,transparent:true,opacity:.82,ior:1.333,clearcoat:1,depthWrite:false});
  const bronze=new T.MeshStandardMaterial({color:'#8c7040',metalness:.8,roughness:.3});
  const ready=fetch(new URL('./realistic-fountain.json',import.meta.url)).then(response=>{
    if(!response.ok)throw new Error(`Fountain asset HTTP ${response.status}`);
    return response.json();
  }).then(asset=>{
    for(const item of asset.meshes){
      const geometry=new T.BufferGeometry();
      geometry.setAttribute('position',new T.Float32BufferAttribute(item.positions,3));
      geometry.setIndex(item.indices); geometry.computeVertexNormals();
      const uv=[];
      for(let i=0;i<item.positions.length;i+=3){
        uv.push(Math.atan2(item.positions[i+2],item.positions[i])/Math.PI*2,item.positions[i+1]*3);
      }
      geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
      const mesh=new T.Mesh(geometry,{stone,water,bronze}[item.kind]);
      mesh.name=item.name; mesh.castShadow=item.kind!=='water'; mesh.receiveShadow=true;
      root.add(mesh);
      if(item.kind==='water'){
        geometry.attributes.position.setUsage(T.DynamicDrawUsage);
        animated.push({geometry,base:geometry.attributes.position.array.slice(),pool:item.name.includes('pool')});
      }
    }
    return root;
  });
  return {root,ready,update(time){
    for(const {geometry,base,pool} of animated){
      const position=geometry.attributes.position;
      for(let i=0;i<position.count;i++){
        const x=base[i*3],y=base[i*3+1],z=base[i*3+2],r=Math.hypot(x,z);
        if(pool){
          position.setXYZ(i,x,y+.0015*Math.sin(r*45-time*3),z);
        }else{
          const envelope=Math.sin(Math.PI*T.MathUtils.clamp((y-.345)/1.42,0,1));
          const wave=.0016*envelope*Math.sin(y*25-time*5+Math.atan2(z,x));
          position.setXYZ(i,x+x*wave,y,z+z*wave);
        }
      }
      position.needsUpdate=true;
    }
  }};
}
