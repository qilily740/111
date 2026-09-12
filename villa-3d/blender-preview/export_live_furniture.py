import bpy,os,collections
BASE=os.path.dirname(__file__)
OUT=os.path.abspath(os.path.join(BASE,'../public/spring-whisper/furniture'))
os.makedirs(OUT,exist_ok=True)
sources=[('furniture-atelier/furniture-studies.blend',{'01':'sofa','02':'chair','03':'bed'}),('furniture-suite-two/furniture-suite-two.blend',{'01':'entry','02':'coffee','03':'fireplace','04':'dining','05':'island','06':'bedside','07':'wardrobe','08':'desk','09':'cafe','10':'vanity'})]
for filename,mapping in sources:
 bpy.ops.wm.open_mainfile(filepath=os.path.join(BASE,filename))
 for col in bpy.data.collections:col.hide_viewport=False;col.hide_render=False;col.hide_select=False
 for prefix,slug in mapping.items():
  col=next(c for c in bpy.data.collections if c.name.startswith(prefix+' '))
  objects=[o for o in col.objects if o.type in ['MESH','CURVE']]
  for o in objects:
   o.hide_set(False);matrix=o.matrix_world.copy();o.parent=None;o.matrix_world=matrix
  bpy.ops.object.select_all(action='DESELECT')
  for o in objects:o.select_set(True)
  bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.convert(target='MESH')
  objects=list(bpy.context.selected_objects)
  # Preserve the original rose print with explicit UVs for the web renderer.
  for o in objects:
   if any(m and 'Rose botanical' in m.name for m in o.data.materials):
    xs=[v.co.x for v in o.data.vertices];zs=[v.co.z for v in o.data.vertices];xmin,xmax=min(xs),max(xs);zmin,zmax=min(zs),max(zs);uv=o.data.uv_layers.new(name='FloralUV')
    for p in o.data.polygons:
     for li in p.loop_indices:
      v=o.data.vertices[o.data.loops[li].vertex_index].co;uv.data[li].uv=((v.x-xmin)/max(1e-6,xmax-xmin),(v.z-zmin)/max(1e-6,zmax-zmin))
  groups=collections.defaultdict(list)
  for o in objects:groups[o.data.materials[0].name if o.data.materials else 'empty'].append(o)
  joined=[]
  for name,items in groups.items():
   bpy.ops.object.select_all(action='DESELECT')
   for o in items:o.select_set(True)
   bpy.context.view_layer.objects.active=items[0];bpy.ops.object.join();o=bpy.context.object;o.name=slug+'__'+name
   if len(o.data.polygons)>9000:
    mod=o.modifiers.new('Web mesh optimization','DECIMATE');mod.ratio=.45;bpy.ops.object.modifier_apply(modifier=mod.name)
   joined.append(o)
  for m in bpy.data.materials:
   if not m.use_nodes:continue
   p=m.node_tree.nodes.get('Principled BSDF')
   if not p:continue
   color=tuple(m.diffuse_color)
   for socket in ['Base Color','Normal']:
    for link in list(p.inputs[socket].links):m.node_tree.links.remove(link)
   p.inputs['Base Color'].default_value=color
   if 'Rose botanical' in m.name:
    tex=next((n for n in m.node_tree.nodes if n.type=='TEX_IMAGE'),None)
    if tex:
     for link in list(tex.inputs['Vector'].links):m.node_tree.links.remove(link)
     m.node_tree.links.new(tex.outputs['Color'],p.inputs['Base Color'])
  bpy.ops.object.select_all(action='DESELECT')
  for o in joined:o.select_set(True)
  bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,slug+'.glb'),export_format='GLB',use_selection=True,export_apply=True,export_animations=False,export_cameras=False,export_lights=False)
  print('EXPORTED',slug,flush=True)
