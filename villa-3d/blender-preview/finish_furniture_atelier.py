import bpy,os,math
from math import sin,pi
OUT=os.path.join(os.path.dirname(__file__),'furniture-atelier')
bpy.ops.wm.open_mainfile(filepath=os.path.join(OUT,'furniture-studies.blend'))
S=bpy.context.scene;sofa=bpy.data.collections['01 Sofa — 185 x 90 x 88 cm'];bed=bpy.data.collections['03 Bed — 180 x 200 x 110 cm'];chair=bpy.data.collections['02 Chair — 48 x 52 x 88 cm']
# Support the rolled arms down to the deck; nailheads no longer hang in empty space.
for sign in [-1,1]:
 bpy.ops.mesh.primitive_cube_add(size=1,location=(sign*.813,-.394,.335));o=bpy.context.object;o.name='Upholstered arm front support';o.scale=(.177,.114,.29);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 for col in list(o.users_collection):col.objects.unlink(o)
 sofa.objects.link(o);o.data.materials.append(bpy.data.materials['Natural cream linen']);mod=o.modifiers.new('Rounded arm support','BEVEL');mod.width=.038;mod.segments=6;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
# Piecewise hanging cloth outside the mattress footprint, rather than through it.
def drape(x,y):
 u=(x+1.10)/2.2;v=(y+1.15)/1.74;s=max(0,abs(x)-.90);f=max(0,-y-.99)
 folds=(.006+.017*min(1,(s+f)*6))*sin(x*39+sin(y*7)*1.3)+.003*sin(y*34+x*12)
 z=.542-max(1.6*s,2.8*f)+folds+.007*sin(pi*u)*sin(pi*v)
 xx=math.copysign(.90+min(s,.08)*.40,x) if s else x;yy=-1.012-min(f,.16)*.26 if f else y
 return xx,yy,z
o=bpy.data.objects['Naturally draped washed cotton duvet']
for v in o.data.vertices:v.co=drape(v.co.x,v.co.y)
for ob in bed.objects:
 if ob.type=='CURVE' and ob.name.startswith('Duvet'):
  for p in ob.data.splines[0].points:p.co=(*drape(p.co.x,p.co.y),1)
runner=bpy.data.objects['Ivory linen foot runner']
for v in runner.data.vertices:
 x,y,z=drape(v.co.x,v.co.y);v.co=(x,y,z+.017)
for ob in bed.objects:
 if ob.type=='CURVE' and ob.name.startswith('Stitched blanket hem'):
  for p in ob.data.splines[0].points:
   x,y,z=drape(p.co.x,p.co.y);p.co=(x,y,z+.017,1)
# Remove detached seat-piping arcs left from the first box-based cushions.
for ob in list(bpy.data.objects):
 if ob.type=='CURVE' and 'sewn welt' in ob.name:bpy.data.objects.remove(ob,do_unlink=True)
for ob in chair.objects:ob.location.z-=.025
bpy.data.lights['Large left window'].size=2.5
S.cycles.samples=48;sofa.hide_render=False;bed.hide_render=True;chair.hide_render=True;S.camera=bpy.data.objects['Sofa textile and tufting']
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'furniture-studies.blend'))
for name,col,cam in [('01-sofa',sofa,'Sofa textile and tufting'),('02-woven-chair',chair,'Chair rattan detail'),('03-bed',bed,'Bed linen and headboard')]:
 sofa.hide_render=col!=sofa;bed.hide_render=col!=bed;chair.hide_render=col!=chair;S.camera=bpy.data.objects[cam];S.render.filepath=os.path.join(OUT,name+'.png');bpy.ops.render.render(write_still=True)
print('FINISHED',flush=True)
