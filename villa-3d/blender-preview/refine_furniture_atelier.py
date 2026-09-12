import bpy,os,math
from mathutils import Vector
from math import sin,cos,pi,exp
OUT=os.path.join(os.path.dirname(__file__),'furniture-atelier')
bpy.ops.wm.open_mainfile(filepath=os.path.join(OUT,'furniture-studies.blend'))
S=bpy.context.scene
# Replace overlaid surfaces with single closed, sewn soft bodies.
for o in list(bpy.data.objects):
 if any(s in o.name for s in ['compressed linen surface','Pillow soft front','Pillow perimeter seam']):bpy.data.objects.remove(o,do_unlink=True)
def signed(v,e):return math.copysign(abs(v)**e,v)
def softbody(o,vertical=False):
 coords=[v.co for v in o.data.vertices];w=max(v.x for v in coords)-min(v.x for v in coords);d=max(v.y for v in coords)-min(v.y for v in coords);h=max(v.z for v in coords)-min(v.z for v in coords)
 vs=[];fs=[];nt,np=64,100
 for j in range(nt+1):
  theta=.00001+(pi-.00002)*j/nt
  for i in range(np):
   phi=2*pi*i/np
   if vertical:
    x=w/2*signed(cos(phi),.36)*sin(theta)**.48;z=h/2*signed(sin(phi),.36)*sin(theta)**.48;y=d*.65*signed(cos(theta),.60)
    y+=(.0017*sin(phi*29+theta*4)+.001*sin(phi*47))*sin(theta)**9
   else:
    x=w/2*signed(cos(phi),.28)*sin(theta)**.48;y=d/2*signed(sin(phi),.28)*sin(theta)**.48;z=h/2*signed(cos(theta),.45)
    z+=.0015*sin(phi*31+theta*6)*sin(theta)**8
   vs.append((x,y,z))
 for j in range(nt):
  for i in range(np):a=j*np+i;b=j*np+(i+1)%np;fs.append((a,b,b+np,a+np))
 me=bpy.data.meshes.new(o.name+' sculpted closed linen');me.from_pydata(vs,[],fs);me.update();m=o.data.materials[0];o.data=me;me.materials.append(m)
 for mod in list(o.modifiers):o.modifiers.remove(mod)
 for p in me.polygons:p.use_smooth=True
 if vertical:
  c=bpy.data.curves.new('Sewn cushion welt','CURVE');c.dimensions='3D';c.bevel_depth=.0017;c.bevel_resolution=3;sp=c.splines.new('POLY');sp.points.add(159)
  for i,p in enumerate(sp.points):a=i*2*pi/160;p.co=(w/2*signed(cos(a),.36),0,h/2*signed(sin(a),.36),1)
  sp.use_cyclic_u=True;ob=bpy.data.objects.new('Soft pillow stitched edge',c);o.users_collection[0].objects.link(ob);ob.parent=o;c.materials.append(bpy.data.materials['Linen piping'])
for o in list(bpy.data.objects):
 if o.type!='MESH':continue
 if 'filled body' in o.name:softbody(o)
 elif any(o.name.startswith(s) for s in ['Rose cushion left','Sage centre cushion','Rose cushion right','Floral bed cushion']):softbody(o,True)
# Prevent additive side/foot drape from putting the duvet's corner below the floor.
duvet=bpy.data.objects['Naturally draped washed cotton duvet']
for v in duvet.data.vertices:
 x,y=v.co.x,v.co.y;u=(x+1.10)/2.2;vv=(y+1.15)/1.74;side=max(0,abs(x)-.84);foot=max(0,-y-.83)
 folds=(.009+.024*min(1,(side+foot)*5))*sin(x*39+sin(y*7)*1.3)+.006*sin(y*34+x*12)+.004*sin(x*71-y*11)
 v.co.z=.528-max(1.72*side,1.35*foot)+folds+.012*sin(pi*u)*sin(pi*vv)
for o in bpy.data.objects:
 if o.type=='CURVE' and (o.name.startswith('Duvet stitched foot hem') or o.name.startswith('Duvet side stitched hem')):
  for p in o.data.splines[0].points:
   x,y=p.co.x,p.co.y;u=(x+1.10)/2.2;vv=(y+1.15)/1.74;side=max(0,abs(x)-.84);foot=max(0,-y-.83);folds=(.009+.024*min(1,(side+foot)*5))*sin(x*39+sin(y*7)*1.3)+.006*sin(y*34+x*12)+.004*sin(x*71-y*11);p.co.z=.528-max(1.72*side,1.35*foot)+folds+.012*sin(pi*u)*sin(pi*vv)
camera=bpy.data.objects['Chair rattan detail'];target=Vector((0,.04,.45));camera.location=target+(camera.location-target)*1.37;camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler()
bpy.data.lights['Cool room fill'].energy=110;S.world.node_tree.nodes.get('Background').inputs[1].default_value=.20
S.cycles.samples=64
jobs=[('01-sofa','01 Sofa — 185 x 90 x 88 cm','Sofa textile and tufting'),('02-woven-chair','02 Chair — 48 x 52 x 88 cm','Chair rattan detail'),('03-bed','03 Bed — 180 x 200 x 110 cm','Bed linen and headboard')]
for _,c,_ in jobs:bpy.data.collections[c].hide_render=c!=jobs[0][1]
S.camera=bpy.data.objects[jobs[0][2]]
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'furniture-studies.blend'))
for name,col,cam in jobs:
 for _,c,_ in jobs:bpy.data.collections[c].hide_render=c!=col
 S.camera=bpy.data.objects[cam];S.render.filepath=os.path.join(OUT,name+'.png');bpy.ops.render.render(write_still=True)
print('REFINED COMPLETE',flush=True)
