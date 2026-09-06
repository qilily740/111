import bpy, os, json, math
ROOT=os.path.dirname(os.path.abspath(__file__))
bpy.ops.wm.open_mainfile(filepath=os.path.join(ROOT,'fountain-art','realistic-fountain.blend'))
result=[]
for obj in list(bpy.context.scene.objects):
    if obj.type not in {'MESH','CURVE'} or obj.name=='Courtyard': continue
    bpy.ops.object.select_all(action='DESELECT'); obj.select_set(True); bpy.context.view_layer.objects.active=obj
    if obj.type=='CURVE':
        obj.data.bevel_resolution=2
        bpy.ops.object.convert(target='MESH')
        obj=bpy.context.object
    else:
        for modifier in list(obj.modifiers):
            bpy.ops.object.modifier_apply(modifier=modifier.name)
    material=obj.data.materials[0].name
    kind='water' if 'water' in material.lower() else 'bronze' if 'bronze' in material.lower() else 'stone'
    if len(obj.data.polygons)>2000:
        mod=obj.modifiers.new('Web mesh reduction','DECIMATE'); mod.ratio=.32
        bpy.ops.object.modifier_apply(modifier=mod.name)
    mesh=obj.data; mesh.calc_loop_triangles()
    positions=[]
    for v in mesh.vertices:
        p=obj.matrix_world @ v.co
        positions.extend([round(p.x,6),round(p.z,6),round(-p.y,6)])
    indices=[i for tri in mesh.loop_triangles for i in tri.vertices]
    result.append(dict(name=obj.name,kind=kind,positions=positions,indices=indices))
target=os.path.join(ROOT,'public','spring-whisper','realistic-fountain.json')
with open(target,'w') as f: json.dump(dict(meshes=result),f,separators=(',',':'))
print('Exported',len(result),'meshes;',sum(len(m['indices'])//3 for m in result),'triangles;',os.path.getsize(target),'bytes')
