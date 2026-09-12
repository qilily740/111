import * as T from './three.module.js';

export function createSkyMaterial(){
 return new T.ShaderMaterial({side:T.BackSide,depthWrite:false,toneMapped:true,
  uniforms:{top:{value:new T.Color('#70a9d6')},bottom:{value:new T.Color('#d3e5ee')},sunset:{value:0},cloudiness:{value:0},storm:{value:0},snowy:{value:0},night:{value:0},sunDirection:{value:new T.Vector3(1,.1,.7).normalize()}},
  vertexShader:`varying vec3 skyDirection;
  void main(){skyDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader:`
  uniform vec3 top,bottom,sunDirection;
  uniform float sunset,cloudiness,storm,snowy,night;
  varying vec3 skyDirection;
  float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
  float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
   return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
  float fbm(vec3 p){float v=0.0,a=.53;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.03+vec3(3.1,7.2,1.9);a*=.48;}return v;}
  void main(){
   vec3 d=normalize(skyDirection);float h=max(0.0,d.y);
   vec3 color=mix(bottom,top,smoothstep(0.0,.7,h));
   vec3 horizontal=normalize(vec3(d.x,.001,d.z));
   vec3 sunHorizontal=normalize(vec3(sunDirection.x,.001,sunDirection.z));
   float facing=pow(max(0.0,dot(horizontal,sunHorizontal)),2.5);
   float glow=exp(-pow((h-.045)/.16,2.0))*facing*sunset;
   color+=vec3(.32,.095,.015)*glow;
   float field=fbm(d*vec3(8.0,3.0,8.0));
   float wisps=fbm(d*vec3(7.0,22.0,7.0)+vec3(6.0,1.0,2.0));
   float cover=smoothstep(mix(.52,.32,cloudiness),mix(.72,.66,cloudiness),field);
   cover=max(cover,smoothstep(.49,.7,wisps)*.35);
   cover*=smoothstep(.0,.16,h);
   vec3 cloud=mix(vec3(.82,.88,.94),mix(bottom,top,.32),min(1.0,sunset*.7+night));
   cloud*=mix(1.0,.57,storm);
   cloud*=mix(.8,1.18,field);
   cloud+=vec3(.24,.085,.018)*glow*(1.0-storm*.8);
   color=mix(color,cloud,cover*.88);
   vec3 cell=floor(d*420.0),local=fract(d*420.0);
   vec3 center=vec3(hash(cell),hash(cell+11.7),hash(cell+24.2));
   float star=(1.0-smoothstep(.035,.12,length(local-center)))*step(.997,hash(cell+38.1));
   color+=vec3(.24,.29,.37)*star*night*(1.0-cover)*(1.0-cloudiness)*smoothstep(.12,.45,h);
   gl_FragColor=vec4(color,1.0);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
  }`
 });
}
