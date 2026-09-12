import bpy,json,os,math
from mathutils import Matrix,Vector
root=os.path.dirname(os.path.abspath(__file__))
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
data=json.load(open(os.path.join(root,'current-house.json')))
mats={}
for key,v in data['materials'].items():
 m=bpy.data.materials.new(key);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF')
 p.inputs['Base Color'].default_value=(*v['color'],1);p.inputs['Roughness'].default_value=v['roughness'];p.inputs['Metallic'].default_value=v['metalness'];p.inputs['Transmission Weight'].default_value=v['transmission']
 mats[key]=m
meshes={}
for key,v in data['geometries'].items():
 mesh=bpy.data.meshes.new(key);p=v['positions'];idx=v['indices'];mesh.from_pydata(list(zip(p[::3],p[1::3],p[2::3])),[],list(zip(idx[::3],idx[1::3],idx[2::3])));mesh.update();meshes[key]=mesh
conversion=Matrix(((1,0,0,0),(0,0,-1,0),(0,1,0,0),(0,0,0,1)))
variants={}
for group in data['objects']:
 key=(group['geometry'],group['material'])
 if key not in variants:
  mesh=meshes[key[0]].copy();mesh.materials.clear();mesh.materials.append(mats[key[1]]);variants[key]=mesh
 for a in group['transforms']:
  obj=bpy.data.objects.new(group['name'],variants[key]);bpy.context.collection.objects.link(obj);obj.matrix_world=conversion@Matrix([a[i::4] for i in range(4)])
print('Imported actual house geometry',flush=True)
floor=bpy.data.materials.new('Neutral warm studio ground');floor.diffuse_color=(.32,.29,.26,1)
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.76));bpy.context.object.data.materials.append(floor)
world=bpy.context.scene.world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.65,.76,.9,1);world.node_tree.nodes['Background'].inputs[1].default_value=.45
bpy.ops.object.light_add(type='AREA',location=(-9,-12,17));light=bpy.context.object;light.data.energy=2600;light.data.size=9;light.data.color=(1,.85,.68);light.rotation_euler=(Vector((0,0,3))-light.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.light_add(type='SUN');sun=bpy.context.object;sun.data.energy=1.8;sun.data.angle=.15;sun.rotation_euler=(.45,-.5,-.5)
bpy.ops.object.camera_add(location=(16,-23,13));camera=bpy.context.object;camera.rotation_euler=(Vector((0,0,3.1))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=21
scene=bpy.context.scene;scene.camera=camera;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True;scene.render.resolution_x=1500;scene.render.resolution_y=1300;scene.render.resolution_percentage=100
scene.render.filepath=os.path.join(root,'current-house-render.png');bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(root,'current-house.blend'))
bpy.ops.render.render(write_still=True)
