import fs from 'node:fs';
import * as T from 'three';
const base=new URL('../public/spring-whisper/',import.meta.url);
const fetchLocal=async url=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(new URL(url),'utf8'))});
const fountainSource=fs.readFileSync(new URL('fountain.js',base),'utf8').replace(/import \* as T[^\n]*\n/,'').replace('export function','function').replaceAll('import.meta.url',JSON.stringify(new URL('fountain.js',base).href));
const fountain=new Function('T','fetch',fountainSource+';return createBlenderFountain;')(T,fetchLocal);
const source=fs.readFileSync(new URL('main.js',base),'utf8');
const code=source.slice(source.indexOf('const house=new T.Group()'),source.indexOf('const views=')).replaceAll('import.meta.url',JSON.stringify(new URL('main.js',base).href));
const house=await new Function('T','fetch','createBlenderFountain',`return(async()=>{const scene=new T.Scene();${code};await botanicalReady;await blenderFountain.ready;return house;})();`)(T,fetchLocal,fountain);
house.updateMatrixWorld(true);
const geometries={},materials={},objects=[];
house.traverse(o=>{
 if(!o.isMesh)return;
 const g=o.geometry,m=o.material;
 if(!geometries[g.uuid])geometries[g.uuid]={positions:Array.from(g.attributes.position.array),indices:g.index?Array.from(g.index.array):Array.from({length:g.attributes.position.count},(_,i)=>i)};
 if(!materials[m.uuid])materials[m.uuid]={color:m.color.toArray(),roughness:m.roughness??.7,metalness:m.metalness??0,transmission:m.transmission??0,emissive:m.emissive?.toArray()??[0,0,0]};
 const transforms=[];
 if(o.isInstancedMesh){for(let i=0;i<o.count;i++){const matrix=new T.Matrix4();o.getMatrixAt(i,matrix);matrix.premultiply(o.matrixWorld);transforms.push(matrix.toArray());}}
 else transforms.push(o.matrixWorld.toArray());
 objects.push({name:o.name||'Architecture',geometry:g.uuid,material:m.uuid,transforms});
});
fs.writeFileSync(new URL('current-house.json',import.meta.url),JSON.stringify({geometries,materials,objects}));
console.log('Exported actual house:',objects.length,'mesh groups');
