import bpy,os,math
from mathutils import Vector
OUT=os.path.join(os.path.dirname(__file__),'french-interior-review')
bpy.ops.wm.open_mainfile(filepath=os.path.join(OUT,'french-three-storey.blend'))
for ng in bpy.data.node_groups:
 for n in ng.nodes:
  if n.bl_idname=='GeometryNodeInstanceOnPoints':n.inputs['Scale'].default_value=(.065,.065,.065)
ivory=bpy.data.materials['Ivory painted timber'];linen=bpy.data.materials['Ivory woven linen'];purple=bpy.data.materials['Lavender linen'];glass=bpy.data.materials['Clear glazing']
def box(name,loc,size,mat):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.scale=size;o.data.materials.append(mat);return o
# Recessed rear windows with softly folded curtains, kept outside furniture bays.
for f in range(3):
 z=.4+3.15*f
 for x in [-4.9,1.50]:
  box('Window pale sky backing',(x,2.85,z+1.65),(.72,.015,1.30),glass)
  for dx in [-.38,0,.38]:box('White window mullion',(x+dx,2.80,z+1.65),(.035,.06,1.4),ivory)
  for zz in [z+.95,z+1.65,z+2.35]:box('Window transom',(x,2.80,zz),(.8,.06,.04),ivory)
  for side in [-1,1]:
   for i in range(5):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=8,location=(x+side*(.37+i*.032),2.72+(i%2)*.018,z+1.49));o=bpy.context.object;o.name='Soft lavender curtain fold';o.scale=(.035,.045,.90);o.data.materials.append(purple)
for z in [3.37,6.52]:box('Continuous storey fascia',(0,-2.94,z),(11.4,.30,.27),ivory)
for f in [1,2]:
 for x in [-1.72,1.72]:box('Room separating wall',(x,1.30,.4+f*3.15+1.40),(.12,3.2,2.8),bpy.data.materials['Fine ivory plaster'])
# Cloth surface with fine, nonuniform folds and a soft drop over the bed edges.
verts=[];faces=[]
for j in range(41):
 for i in range(51):
  x=-.94+i*1.88/50;y=-.98+j*1.36/40
  zz=4.237+.012*math.sin(x*38+y*5)+.006*math.sin(y*53+x*8)-max(0,abs(x)-.85)*2.4
  verts.append((x,y,zz))
for j in range(40):
 for i in range(50):
  k=j*51+i;faces.append((k,k+1,k+52,k+51))
me=bpy.data.meshes.new('Folded cotton surface');me.from_pydata(verts,[],faces);me.update();ob=bpy.data.objects.new('Soft rumpled master duvet',me);bpy.context.collection.objects.link(ob);ob.data.materials.append(bpy.data.materials['Washed blush cotton'])
for p in me.polygons:p.use_smooth=True
scene=bpy.context.scene;cam=bpy.data.objects['Front cutaway 50mm'];cam.location=(-.85,-31,12.2);cam.rotation_euler=(Vector((-.75,0,5.1))-cam.location).to_track_quat('-Z','Y').to_euler()
close=bpy.data.objects['Master bedroom'];close.location=(.05,-3.0,5.25);close.data.lens=38;close.rotation_euler=(Vector((0,.40,4.40))-close.location).to_track_quat('-Z','Y').to_euler()
scene.cycles.samples=24;scene.render.resolution_x=1200;scene.render.resolution_y=900;scene.camera=cam;bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'french-three-storey.blend'))
for name,camname in [('01-front-cutaway','Front cutaway 50mm'),('02-master-bedroom','Master bedroom'),('03-living-room','Living room')]:
 scene.camera=bpy.data.objects[camname];scene.render.filepath=os.path.join(OUT,name+'.png');bpy.ops.render.render(write_still=True)
