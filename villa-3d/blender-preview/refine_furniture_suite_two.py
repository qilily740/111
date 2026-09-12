import bpy,os,math
from mathutils import Vector
BASE=os.path.dirname(__file__);OUT=os.path.join(BASE,'furniture-suite-two')
bpy.ops.wm.open_mainfile(filepath=os.path.join(OUT,'furniture-suite-two.blend'))
S=bpy.context.scene;cream=bpy.data.materials['Warm aged ivory lacquer']
for o in bpy.data.objects:
 if o.type=='CURVE':o.data.use_fill_caps=True
def box(name,loc,size,col):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.scale=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(cream)
 for c in list(o.users_collection):c.objects.unlink(o)
 col.objects.link(o);mod=o.modifiers.new('Soft edge','BEVEL');mod.width=.007;mod.segments=3;return o
desk=bpy.data.collections['08 Desk']
for x in [-.45,0,.45]:box('Drawer box and support',(x,-.035,.63),(.42,.47,.14),desk)
# Nonperiodic, subtle stone veins.
m=bpy.data.materials['Honed ivory marble'];n=m.node_tree.nodes;l=m.node_tree.links;p=n.get('Principled BSDF');noise=n.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=3.2;noise.inputs['Detail'].default_value=6;noise.inputs['Roughness'].default_value=.72;tc=n.new('ShaderNodeTexCoord');l.new(tc.outputs['Generated'],noise.inputs['Vector']);r=n.new('ShaderNodeValToRGB');r.color_ramp.elements[0].position=.48;r.color_ramp.elements[0].color=(.86,.83,.77,1);r.color_ramp.elements[1].position=.531;r.color_ramp.elements[1].color=(.86,.83,.77,1);mid=r.color_ramp.elements.new(.514);mid.color=(.72,.71,.68,1);l.new(noise.outputs['Fac'],r.inputs[0]);l.new(r.outputs[0],p.inputs['Base Color'])
# Remove solid material behind the island sink opening.
island=bpy.data.collections['05 Kitchen island'];bpy.ops.mesh.primitive_cube_add(size=1,location=(0,0,.91));cutter=bpy.context.object;cutter.scale=(.45,.36,.32);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
for o in list(island.objects):
 if o.name.startswith('Island cabinet carcass') or o.name.startswith('Overhanging top'):
  bpy.context.view_layer.objects.active=o;mod=o.modifiers.new('True sink cavity','BOOLEAN');mod.operation='DIFFERENCE';mod.object=cutter;bpy.ops.object.modifier_apply(modifier=mod.name)
bpy.data.objects.remove(cutter,do_unlink=True)
# Cafe chair backs face outward, seats face the table. A connected outer frame.
cafe=bpy.data.collections['09 Cafe set']
for o in cafe.objects:
 if o.name.startswith('Cafe chair placement'):o.rotation_euler.z=math.pi/2 if o.location.x<0 else -math.pi/2
for parent in [o for o in cafe.objects if o.name.startswith('Cafe chair placement')]:
 cu=bpy.data.curves.new('Cafe chair connected crest','CURVE');cu.dimensions='3D';cu.bevel_depth=.010;cu.bevel_resolution=3;cu.use_fill_caps=True;sp=cu.splines.new('POLY');sp.points.add(80)
 for i,p in enumerate(sp.points):a=i*math.pi/80;p.co=(.18*math.cos(a),.19,.70+.14*math.sin(a),1)
 ob=bpy.data.objects.new('Cafe chair connected crest',cu);cafe.objects.link(ob);ob.parent=parent;cu.materials.append(cream)
for colname in ['02 Coffee table','09 Cafe set']:
 for o in bpy.data.collections[colname].objects:
  if o.name.startswith('Turned pedestal'):o.data.materials.clear();o.data.materials.append(cream)
cols=[c for c in bpy.data.collections if c.name[:2].isdigit()]
camera=bpy.data.objects['Product camera']
def fit(col):
 bpy.context.view_layer.update();pts=[o.matrix_world@Vector(v) for o in col.objects if o.type in ['MESH','CURVE'] for v in o.bound_box];lo=Vector(tuple(min(p[i] for p in pts) for i in range(3)));hi=Vector(tuple(max(p[i] for p in pts) for i in range(3)));center=(lo+hi)/2;span=max(hi.x-lo.x,(hi.z-lo.z)*1.2,(hi.y-lo.y)*1.2);camera.location=center+Vector((.4,-1,.39)).normalized()*span*2.8;camera.rotation_euler=(center-camera.location).to_track_quat('-Z','Y').to_euler()
for c in cols:c.hide_render=c.name!='01 Entry console';c.hide_viewport=False
fit(bpy.data.collections['01 Entry console']);bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'furniture-suite-two.blend'))
for slug,colname in [('02-coffee-table','02 Coffee table'),('03-fireplace','03 Fireplace'),('05-kitchen-island','05 Kitchen island'),('08-desk','08 Desk'),('09-cafe-set','09 Cafe set'),('10-bathroom-vanity','10 Bathroom vanity')]:
 for c in cols:c.hide_render=c.name!=colname
 fit(bpy.data.collections[colname]);S.render.filepath=os.path.join(OUT,slug+'.png');bpy.ops.render.render(write_still=True)
for c in cols:c.hide_render=c.name!='01 Entry console';c.hide_viewport=c.hide_render
fit(bpy.data.collections['01 Entry console']);bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'furniture-suite-two.blend'))
print('REFINEMENT COMPLETE',flush=True)
