"""Build and render reusable solid weather assets with Blender Cycles."""
import bpy, math, json, os, random
from mathutils import Vector
random.seed(72)
root=os.path.dirname(os.path.abspath(__file__))
out=os.path.join(root,'weather-art');os.makedirs(out,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.context.preferences.filepaths.save_version=0
def material(name,color,roughness):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=roughness
 return m
cloudmat=material('Cloud scattered light',(.78,.83,.88),1)
snowmat=material('Fresh snow',(.94,.97,1),.82)
watermat=material('Rain water',(.49,.73,.85),.08)
watermat.node_tree.nodes.get('Principled BSDF').inputs['Transmission Weight'].default_value=.7
assets=[]
for name,count,mat in [('cloud',23,cloudmat),('snowcap',12,snowmat)]:
 data=bpy.data.metaballs.new(name);data.resolution=.13;data.render_resolution=.09;data.threshold=.62
 obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj)
 for i in range(count):
  e=data.elements.new();e.co=((random.random()-.5)*3,(random.random()-.5)*1.4,(random.random()*.65 if name=='cloud' else random.random()*.14));e.radius=(.65+random.random()*.6 if name=='cloud' else .4+random.random()*.25)
 bpy.context.view_layer.objects.active=obj;obj.select_set(True);bpy.ops.object.convert(target='MESH');obj=bpy.context.object;obj.name=name
 modifier=obj.modifiers.new('Realtime polygon budget','DECIMATE');modifier.ratio=.3;bpy.ops.object.modifier_apply(modifier=modifier.name)
 if name=='snowcap':
  for v in obj.data.vertices:v.co.z=max(0,v.co.z*.3)
 obj.data.materials.append(mat)
 for p in obj.data.polygons:p.use_smooth=True
 obj.select_set(False);assets.append(obj)
bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=8)
drop=bpy.context.object;drop.name='raindrop'
for v in drop.data.vertices:
 z=v.co.z;v.co.x*=.12*(1-.3*z);v.co.y*=.12*(1-.3*z);v.co.z*=.45
drop.data.materials.append(watermat)
for p in drop.data.polygons:p.use_smooth=True
assets.append(drop)
result=[]
for obj in assets:
 obj.data.calc_loop_triangles()
 result.append(dict(name=obj.name,positions=[round(c,6) for v in obj.data.vertices for c in (v.co.x,v.co.z,-v.co.y)],indices=[i for t in obj.data.loop_triangles for i in t.vertices]))
with open(os.path.join(root,'public/spring-whisper/weather-assets.json'),'w') as f:json.dump({'meshes':result},f,separators=(',',':'))
for i,obj in enumerate(assets):obj.location.x=(i-1)*4
bpy.ops.object.camera_add(location=(7,-12,8));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,0))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=13;bpy.context.scene.camera=cam
bpy.ops.object.light_add(type='AREA',location=(0,-4,8));bpy.context.object.data.energy=1800;bpy.context.object.data.shape='DISK';bpy.context.object.data.size=8
s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=24;s.render.resolution_x=1200;s.render.resolution_y=650;s.render.resolution_percentage=100;s.render.film_transparent=True;s.render.filepath=os.path.join(out,'weather-preview.png')
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out,'weather-assets.blend'));bpy.ops.render.render(write_still=True)
