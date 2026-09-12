"""Three independent, metre-scale furniture studies. Blender-native geometry/materials.
Run with Blender -b --python furniture_atelier.py. No existing house is opened.
"""
import bpy, math, random, os
from mathutils import Vector
from math import sin, cos, pi, exp, sqrt
random.seed(43)
OUT=os.path.join(os.path.dirname(__file__),'furniture-atelier')
os.makedirs(OUT,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
S=bpy.context.scene;S.unit_settings.system='METRIC'
def mat(name,col,rough=.55,metal=0,texture=None):
 m=bpy.data.materials.new(name);m.diffuse_color=(*col,1);m.use_nodes=True;n=m.node_tree.nodes;l=m.node_tree.links;p=n.get('Principled BSDF');p.inputs['Base Color'].default_value=(*col,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
 if texture:
  tc=n.new('ShaderNodeTexCoord');noise=n.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=155 if texture=='linen' else 5;noise.inputs['Detail'].default_value=3
  mapping=n.new('ShaderNodeVectorMath');mapping.operation='MULTIPLY';mapping.inputs[1].default_value=(1,1,1) if texture=='linen' else (3,34,3);l.new(tc.outputs['Generated'],mapping.inputs[0]);l.new(mapping.outputs[0],noise.inputs['Vector'])
  ramp=n.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].color=(*[v*.82 for v in col],1);ramp.color_ramp.elements[1].color=(*col,1);l.new(noise.outputs['Fac'],ramp.inputs[0]);l.new(ramp.outputs[0],p.inputs['Base Color'])
  bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.18;bump.inputs['Distance'].default_value=.0007 if texture=='linen' else .001;l.new(noise.outputs['Fac'],bump.inputs['Height']);l.new(bump.outputs[0],p.inputs['Normal'])
  if texture=='linen':
   p.inputs['Sheen Weight'].default_value=.28;p.inputs['Sheen Roughness'].default_value=.8
   wave=n.new('ShaderNodeTexWave');wave.wave_type='BANDS';wave.bands_direction='X';wave.inputs['Scale'].default_value=240;l.new(tc.outputs['Generated'],wave.inputs['Vector']);weft=n.new('ShaderNodeTexWave');weft.bands_direction='Z';weft.inputs['Scale'].default_value=240;l.new(tc.outputs['Generated'],weft.inputs['Vector']);mix=n.new('ShaderNodeMath');mix.operation='MULTIPLY';l.new(wave.outputs['Color'],mix.inputs[0]);l.new(weft.outputs['Color'],mix.inputs[1]);b2=n.new('ShaderNodeBump');b2.inputs['Strength'].default_value=.12;b2.inputs['Distance'].default_value=.00025;l.new(mix.outputs[0],b2.inputs['Height']);l.new(bump.outputs[0],b2.inputs['Normal']);l.new(b2.outputs[0],p.inputs['Normal'])
 return m
cream=mat('Warm aged ivory lacquer',(.79,.72,.60),.4,texture='wood');wood=mat('Honey ash exposed edges',(.38,.23,.105),.5,texture='wood');linen=mat('Natural cream linen',(.83,.77,.66),.92,texture='linen');seam=mat('Linen piping',(.69,.61,.49),.9,texture='linen');blush=mat('Dusty rose washed cotton',(.63,.37,.39),.95,texture='linen');sage=mat('Sage linen',(.37,.43,.30),.95,texture='linen');brass=mat('Antique brass',(.46,.28,.09),.3,.75);cane=mat('Split rattan fibres',(.55,.39,.20),.7,texture='wood');dark=mat('Shadowed wood recess',(.23,.17,.10),.85)
def finish(o,name,m):
 o.name=name;o.data.materials.append(m)
 for p in getattr(o.data,'polygons',[]):p.use_smooth=True
 return o
def box(name,loc,size,m=cream,b=.01):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.scale=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);finish(o,name,m)
 if b:
  mod=o.modifiers.new('Hand softened edge','BEVEL');mod.width=b;mod.segments=4;o.modifiers.new('Weighted surface normals','WEIGHTED_NORMAL')
 return o
def mesh(name,verts,faces,m):
 me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);finish(o,name,m);return o
def tube(name,pts,r=.003,m=cream,closed=False):
 c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.resolution_u=12;c.bevel_depth=r;c.bevel_resolution=3;s=c.splines.new('POLY');s.points.add(len(pts)-1)
 for p,v in zip(s.points,pts):p.co=(*v,1)
 s.use_cyclic_u=closed;o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);o.data.materials.append(m);return o
def ball(name,loc,scale,m):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=20,ring_count=12,location=loc);o=bpy.context.object;o.scale=scale;return finish(o,name,m)
def turned(name,x,y,z,h=.13,r=.035):
 profile=[(0,.65),(.04,.85),(.08,1),(.14,.85),(.19,.65),(.30,.53),(.52,.8),(.67,1),(.80,.8),(.87,.62),(.93,.94),(1,1)]
 vs=[];fs=[]
 for t,k in profile:
  for j in range(32):a=j*2*pi/32;vs.append((x+cos(a)*r*k,y+sin(a)*r*k,z+t*h))
 for i in range(len(profile)-1):
  for j in range(32):a=i*32+j;b=i*32+(j+1)%32;fs.append((a,b,b+32,a+32))
 mesh(name,vs,fs,wood)
 for t in [.10,.83,.96]:tube('Fine brass collar',[(x+r*.88*cos(a*2*pi/40),y+r*.88*sin(a*2*pi/40),z+h*t) for a in range(40)],.0018,brass,True)
def outline(cx,cy,w,d,z,r=.08):
 pts=[]
 for x,y,a0 in [(cx+w/2-r,cy+d/2-r,0),(cx-w/2+r,cy+d/2-r,pi/2),(cx-w/2+r,cy-d/2+r,pi),(cx+w/2-r,cy-d/2+r,3*pi/2)]:
  for i in range(16):a=a0+i*pi/30;pts.append((x+r*cos(a),y+r*sin(a),z))
 return pts
def cushion(name,x,y,z,w,d,h,m=linen):
 # Rounded box gives filled sides; sculpted top carries compression and seam wrinkles.
 box(name+' filled body',(x,y,z),(w,d,h),m,min(h*.4,.065));vs=[];fs=[];nx,ny=64,44
 for j in range(ny+1):
  v=j/ny;yy=(v-.5)*d
  for i in range(nx+1):
   u=i/nx;xx=(u-.5)*w;edge=min(u,1-u,v,1-v);bulge=.018*sin(pi*u)*sin(pi*v);wr=.003*sin(u*85+v*13)*exp(-edge*30)*sin(pi*v)+.002*sin(v*65)*exp(-edge*24)*sin(pi*u)
   vs.append((x+xx,y+yy,z+h/2-.016+bulge+wr))
 for j in range(ny):
  for i in range(nx):a=j*(nx+1)+i;fs.append((a,a+1,a+nx+2,a+nx+1))
 mesh(name+' compressed linen surface',vs,fs,m);tube(name+' sewn welt',outline(x,y,w-.018,d-.018,z+h*.20,.07),.0026,seam,True)
def tufted(name,cx,y,z,w,h,m=linen):
 # Diamond channels and recessed buttons are actual displaced upholstery geometry.
 vs=[];fs=[];nx,nz=160,76;buttons=[]
 for row in range(3):
  for col in range(7):
   xx=(col-3)*w/7+(row%2)*w/14
   if abs(xx)<w*.46:buttons.append((xx,.12+row*(h-.22)/2))
 for j in range(nz+1):
  zz=j/nz*h
  for i in range(nx+1):
   xx=(i/nx-.5)*w;d=min(sqrt(((xx-bx)*1.05)**2+(zz-bz)**2) for bx,bz in buttons);puff=.030*(1-exp(-(d/.080)**2));channels=0
   for sign in [-1,1]:
    a=(xx/(w/7)+sign*zz/((h-.22)/2))%1;channels+=.003*exp(-(min(a,1-a)/.045)**2)
   inset=.017*exp(-(d/.018)**2);edge=sin(pi*i/nx)*sin(pi*j/nz);vs.append((cx+xx,y-puff*edge+inset+channels,z+zz))
 for j in range(nz):
  for i in range(nx):a=j*(nx+1)+i;fs.append((a,a+nx+1,a+nx+2,a+1))
 mesh(name,vs,fs,m)
 for xx,zz in buttons:ball('Fabric covered tuft button',(cx+xx,y+.005,z+zz),(.008,.004,.008),seam)
def floral_material():
 # Original procedural rose-print textile, generated in Blender (not a reference-image edit).
 size=512;pixels=[.84,.79,.68,1]*(size*size);rng=random.Random(51)
 def dab(cx,cy,rx,ry,ang,color):
  ca,sa=cos(ang),sin(ang)
  for yy in range(max(0,int(cy-max(rx,ry)-1)),min(size,int(cy+max(rx,ry)+2))):
   for xx in range(max(0,int(cx-max(rx,ry)-1)),min(size,int(cx+max(rx,ry)+2))):
    dx,dy=xx-cx,yy-cy;q=((dx*ca+dy*sa)/rx)**2+((-dx*sa+dy*ca)/ry)**2
    if q<1:
     alpha=min(1,(1-q)*6)*.87;k=(yy*size+xx)*4
     for c in range(3):pixels[k+c]=pixels[k+c]*(1-alpha)+color[c]*alpha
 for k in range(18):
  cx=rng.uniform(25,487);cy=rng.uniform(25,487)
  for j in range(4):a=rng.random()*2*pi;dab(cx+cos(a)*21,cy+sin(a)*21,14,5,a,(.28,.39,.20))
  for ring in [3,2,1]:
   for j in range(7):a=j*2*pi/7+ring;dab(cx+cos(a)*ring*3,cy+sin(a)*ring*3,ring*4.2,ring*2.5,a+pi/2,(.62+ring*.045,.28+ring*.06,.34+ring*.055))
 image=bpy.data.images.new('Hand-painted rose linen print',width=size,height=size);image.pixels=pixels;image.pack()
 m=linen.copy();m.name='Rose botanical print on linen';n=m.node_tree.nodes;l=m.node_tree.links;tex=n.new('ShaderNodeTexImage');tex.image=image;coord=n.new('ShaderNodeTexCoord');sep=n.new('ShaderNodeSeparateXYZ');combine=n.new('ShaderNodeCombineXYZ');l.new(coord.outputs['Generated'],sep.inputs[0]);l.new(sep.outputs['X'],combine.inputs['X']);l.new(sep.outputs['Z'],combine.inputs['Y']);l.new(combine.outputs[0],tex.inputs['Vector']);l.new(tex.outputs['Color'],n.get('Principled BSDF').inputs['Base Color']);return m
floral=floral_material()
def pillow(name,x,y,z,w=.36,h=.34,m=floral,angle=0):
 before=set(bpy.data.objects);o=box(name,(x,y,z),(w,.115,h),m,.054)
 # Front fabric bulges, but its perimeter is sewn rather than spherical.
 vs=[];fs=[];n=38
 for j in range(n+1):
  v=j/n
  for i in range(n+1):
   u=i/n;edge=min(u,1-u,v,1-v);deform=.027*sin(pi*u)*sin(pi*v)+.0025*sin(u*95+v*16)*exp(-edge*22);vs.append((x+(u-.5)*(w-.025),y-.057-deform,z+(v-.5)*(h-.025)))
 for j in range(n):
  for i in range(n):a=j*(n+1)+i;fs.append((a,a+1,a+n+2,a+n+1))
 mesh('Pillow soft front',vs,fs,m)
 pts=outline(0,0,w-.022,h-.022,0,.05);tube('Pillow perimeter seam',[(x+px,y-.042,z+py) for px,py,pz in pts],.002,seam,True)
 for ob in set(bpy.data.objects)-before:
  if angle:
   dx,dz=ob.location.x-x,ob.location.z-z
   # Geometry mesh world coordinates: rotate as a group around an empty below.
 parent=bpy.data.objects.new('Pillow placement',None);bpy.context.collection.objects.link(parent);parent.location=(x,y,z)
 for ob in set(bpy.data.objects)-before-{parent}:ob.parent=parent;ob.matrix_parent_inverse=parent.matrix_world.inverted() if False else __import__('mathutils').Matrix.Translation(Vector((-x,-y,-z)))
 parent.rotation_euler.y=angle
def throw_mesh(name,cx,cy,basez,width,length,m,drop=.40):
 vs=[];fs=[];nx,ny=64,100
 for j in range(ny+1):
  v=j/ny;yy=cy+(v-.5)*length
  for i in range(nx+1):
   u=i/nx;xx=cx+(u-.5)*width;hang=max(0,(.32-v)/.32);zz=basez-drop*hang+.008*sin(u*62+v*11)+.005*sin(u*113-v*9)+.009*sin(v*17)*sin(pi*u);vs.append((xx,yy,zz))
 for j in range(ny):
  for i in range(nx):a=j*(nx+1)+i;fs.append((a,a+1,a+nx+2,a+nx+1))
 o=mesh(name,vs,fs,m);sol=o.modifiers.new('Cloth thickness','SOLIDIFY');sol.thickness=.0012
 tube('Stitched blanket hem',[vs[i] for i in range(nx+1)],.0014,m)
def collection(name):
 c=bpy.data.collections.new(name);S.collection.children.link(c);return c
def collect_since(before,c):
 for o in set(bpy.data.objects)-before:
  for old in list(o.users_collection):old.objects.unlink(o)
  c.objects.link(o)
# SOFA — 185 × 90 × 88 cm, rolled arms, separate cushions, tufted back.
before=set(bpy.data.objects);sofacol=collection('01 Sofa — 185 x 90 x 88 cm')
for x in [-.78,.78]:
 for y in [-.32,.29]:turned('Sofa turned foot',x,y,0,.13,.034)
box('Carved lower rail',(0,-.01,.16),(1.68,.76,.10),cream,.025)
for z in [.134,.19]:tube('Sofa apron bead',[(-.80,-.397,z),(-.40,-.41,z-.012),(0,-.412,z-.016),(.4,-.41,z-.012),(.80,-.397,z)],.004,cream)
box('Sofa upholstered deck',(0,0,.27),(1.65,.77,.16),linen,.06)
box('Back upholstered volume',(0,.337,.63),(1.62,.16,.49),linen,.075)
tufted('Diamond tufted sofa back',0,.251,.46,1.50,.38)
for x in [-.405,.405]:cushion('Separate seat cushion',x,-.035,.395,.78,.66,.13)
for s in [-1,1]:
 # Rolled arm as a shaped elliptical sweep with piping at its front end.
 vs=[];fs=[];na,ny=48,45
 for j in range(ny+1):
  t=j/ny;yy=-.44+t*.86;zc=.52+.12*t;rad=.102*(.90+.10*sin(pi*t))
  for i in range(na):a=i*2*pi/na;vs.append((s*.813+cos(a)*rad,yy,zc+sin(a)*.135))
 for j in range(ny):
  for i in range(na):a=j*na+i;b=j*na+(i+1)%na;fs.append((a,b,b+na,a+na))
 fs.append(tuple(range(na-1,-1,-1)));fs.append(tuple(ny*na+i for i in range(na)));mesh('Upholstered rolled arm',vs,fs,linen)
 tube('Rolled arm face welt',[(s*.813+.092*cos(a*2*pi/96),-.443,.52+.125*sin(a*2*pi/96)) for a in range(96)],.0025,seam,True)
 for i in range(18):ball('Antique nailhead',(s*.818,-.448,.245+i*.013),(.0025,.0018,.0025),brass)
pillow('Rose cushion left',-.52,.06,.61,.33,.31,floral,-.12);pillow('Sage centre cushion',-.12,.12,.60,.31,.30,sage,.10);pillow('Rose cushion right',.50,.07,.62,.33,.32,floral,.12)
throw_mesh('Rose linen throw draped over right seat',.55,-.30,.47,.32,.68,blush,.27)
collect_since(before,sofacol);print('SOFA BUILT',flush=True)
# DINING CHAIR — 48 × 52 × 88 cm; genuinely woven open rattan back.
before=set(bpy.data.objects);chaircol=collection('02 Chair — 48 x 52 x 88 cm')
def cabriole(x,y,rear=False):
 pts=[]
 for i in range(50):
  t=i/49;pts.append((x+math.copysign(.018*sin(pi*t)-.009*t,x),y+(.028*sin(pi*t) if rear else -.018*sin(pi*t)),.02+t*.39))
 tube('Cabriole ash leg',pts,.018,cream);ball('Carved knee',(x,y,.345),(.024,.027,.046),cream)
 for k in [-1,1]:tube('Knee carved vein',[(x+k*.009*cos(t*pi/16),y-.022,.315+t*.005) for t in range(14)],.0015,wood)
for x in [-.195,.195]:
 for y in [-.20,.17]:cabriole(x,y,y>0)
box('Chair seat apron',(0,-.01,.395),(.455,.475,.055),cream,.03);cushion('Chair linen seat',0,-.015,.448,.475,.49,.083)
for x in [-.196,.196]:tube('Back upright',[(x,.195,.40),(x*1.04,.22,.55),(x*.96,.23,.70)],.016,cream)
def backedge(a,scale=1):
 # Rounded French shield silhouette, narrower at its lower lobes.
 z=.69+.19*sin(a);x=.215*cos(a)*(1+.13*sin(a));return (x*scale,.23,.69+(z-.69)*scale)
for r,offset,m in [(.018,1,cream),(.004,.87,wood),(.004,1.11,cream)]:tube('Carved shield frame',[backedge(a*2*pi/160,offset) for a in range(160)],r,m,True)
# Each strand is independent geometry, with alternating over/under offsets at crossings.
for axis in [0,1]:
 for k in range(-18,19):
  fixed=k*.010;pts=[]
  for j in range(161):
   t=-.19+j*.38/160;x=fixed if axis==0 else t;dz=t if axis==0 else fixed
   if (x/(.183*(1+.13*dz/.165)))**2+(dz/.165)**2<1:
    depth=.23+.0016*sin(t*pi/.010+(0 if axis==0 else pi));pts.append((x,depth,.69+dz))
  if len(pts)>1:tube('Over under woven rattan',pts,.00155,cane)
for sign in [-1,1]:
 for k in range(-11,12):
  pts=[]
  for j in range(121):
   x=-.18+j*.36/120;dz=sign*x+k*.027
   if (x/.18)**2+(dz/.16)**2<1:pts.append((x,.234,.69+dz))
  if len(pts)>1:tube('Diagonal cane binder',pts,.0011,cane)
for s in [-1,1]:
 tube('Crest acanthus curl',[(s*(.008+.04*t/49),.207,.889-.014*t/49+.007*sin(t*pi/49)) for t in range(50)],.003,cream)
collect_since(before,chaircol);print('CHAIR BUILT',flush=True)
# BED — 180 × 200 × 110 cm; upholstered carved headboard and draped bedding.
before=set(bpy.data.objects);bedcol=collection('03 Bed — 180 x 200 x 110 cm')
for x in [-.78,.78]:
 for y in [-.82,.81]:turned('Bed foot',x,y,0,.15,.034)
box('Bed timber frame',(0,0,.22),(1.8,2,.20),cream,.045)
for zz in [.16,.28]:tube('Footboard molding',[(-.86,-1.01,zz),(-.45,-1.02,zz-.008),(0,-1.022,zz-.015),(.45,-1.02,zz-.008),(.86,-1.01,zz)],.006,cream)
cushion('Linen mattress',0,-.01,.385,1.77,1.96,.19)
box('Headboard supporting timber',(0,.935,.74),(1.8,.12,.60),cream,.09)
tufted('Deep buttoned headboard',0,.858,.53,1.64,.48)
pts=[]
for i in range(121):
 x=-.88+i*1.76/120;z=1.04+.035*cos(x*pi/1.76)+.008*cos(x*10);pts.append((x,.851,z))
tube('Headboard carved crown',pts,.018,cream);tube('Headboard gilt inner bead',[(x,y-.006,z-.03) for x,y,z in pts],.003,wood)
for s in [-1,1]:tube('Headboard side scroll',[(s*(.855+.012*sin(t*pi/60)),.856,.54+t*.49/60) for t in range(61)],.014,cream)
# Continuous duvet surface: smooth top, side overhangs, foot drop and narrow hem.
vs=[];fs=[];nx,ny=140,155
for j in range(ny+1):
 v=j/ny;y=-1.15+v*1.74
 for i in range(nx+1):
  u=i/nx;x=-1.10+u*2.20;side=max(0,abs(x)-.84);foot=max(0,-y-.83);drop=max(1.72*side,1.35*foot)
  folds=(.009+.024*min(1,(side+foot)*5))*sin(x*39+sin(y*7)*1.3)+.006*sin(y*34+x*12)+.004*sin(x*71-y*11)
  zz=.528-drop+folds+.012*sin(pi*u)*sin(pi*v);vs.append((x,y,zz))
for j in range(ny):
 for i in range(nx):a=j*(nx+1)+i;fs.append((a,a+1,a+nx+2,a+nx+1))
o=mesh('Naturally draped washed cotton duvet',vs,fs,blush);sol=o.modifiers.new('Cotton thickness','SOLIDIFY');sol.thickness=.0015
tube('Duvet stitched foot hem',[vs[i] for i in range(nx+1)],.0025,blush)
for index in [0,nx]:tube('Duvet side stitched hem',[vs[j*(nx+1)+index] for j in range(ny+1)],.002,blush)
for x in [-.43,.43]:
 cushion('Sleeping pillow',x,.63,.555,.72,.42,.13)
 pillow('Floral bed cushion',x,.48,.70,.56,.34,floral,(-.06 if x<0 else .07))
# Folded ivory runner with fine pleats at foot.
throw_mesh('Ivory linen foot runner',0,-.70,.555,1.80,.35,linen,.02)
collect_since(before,bedcol);print('BED BUILT',flush=True)
# Seamless photographic studio: neutral backdrop, broad soft light and real GI.
stage=mat('Warm photographic sweep',(.76,.73,.67),.88)
box('Studio floor',(0,0,-.055),(200,200,.1),stage,0)
def area(name,loc,power,size,color,target=(0,0,.45)):
 d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='DISK';d.size=size;d.color=color;o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
area('Large left window',(-3,-4,5),450,4,(1,.91,.80));area('Cool room fill',(3,-1,3),170,3,(.87,.92,1));area('Gentle back rim',(0,3,4),260,3,(1,.92,.84))
S.world.use_nodes=True;S.world.node_tree.nodes.get('Background').inputs[0].default_value=(.75,.81,.9,1);S.world.node_tree.nodes.get('Background').inputs[1].default_value=.28
S.render.engine='CYCLES';S.cycles.samples=48;S.cycles.use_denoising=True;S.cycles.max_bounces=8;S.render.resolution_x=1400;S.render.resolution_y=1050;S.render.resolution_percentage=100;S.view_settings.view_transform='AgX';S.render.image_settings.file_format='PNG'
def cam(name,loc,target,lens):
 d=bpy.data.cameras.new(name);d.lens=lens;o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler();return o
cams=[('01-sofa',sofacol,cam('Sofa textile and tufting',(2.25,-3.55,1.85),(0,0,.43),58)),('02-woven-chair',chaircol,cam('Chair rattan detail',(1.05,-1.5,1.20),(0,.04,.45),62)),('03-bed',bedcol,cam('Bed linen and headboard',(2.8,-3.9,2.6),(0,0,.47),55))]
for _,c,_ in cams:c.hide_render=True
cams[0][1].hide_render=False;S.camera=cams[0][2]
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'furniture-studies.blend'))
for name,col,camera in cams:
 for _,c,_ in cams:c.hide_render=c!=col
 S.camera=camera;S.render.filepath=os.path.join(OUT,name+'.png');print('RENDER',name,flush=True);bpy.ops.render.render(write_still=True)
print('COMPLETE',OUT,flush=True)
