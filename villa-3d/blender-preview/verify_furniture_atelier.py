import bpy,os,json
from mathutils import Vector
OUT=os.path.join(os.path.dirname(__file__),'furniture-atelier')
bpy.ops.wm.open_mainfile(filepath=os.path.join(OUT,'furniture-studies.blend'))
report={}
for c in bpy.data.collections:
 if not c.name[:2] in ['01','02','03']:continue
 points=[]
 for o in c.objects:
  if o.type in ['MESH','CURVE']:points.extend(o.matrix_world@Vector(p) for p in o.bound_box)
 minimum=[min(p[i] for p in points) for i in range(3)];maximum=[max(p[i] for p in points) for i in range(3)]
 report[c.name]={'objects':len(c.objects),'bounds_min_m':minimum,'bounds_max_m':maximum,'size_with_soft_furnishings_m':[maximum[i]-minimum[i] for i in range(3)]}
 c.hide_viewport=not c.name.startswith('01');c.hide_render=c.hide_viewport
duvet=bpy.data.objects['Naturally draped washed cotton duvet'];assert min(v.co.z for v in duvet.data.vertices)>0,'Duvet below floor'
for name in ['01-sofa','02-woven-chair','03-bed']:assert os.path.getsize(os.path.join(OUT,name+'.png'))>100000
bpy.context.scene.camera=bpy.data.objects['Sofa textile and tufting']
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'furniture-studies.blend'))
with open(os.path.join(OUT,'geometry-check.json'),'w') as f:json.dump(report,f,ensure_ascii=False,indent=2)
print(json.dumps(report,ensure_ascii=False),flush=True)
