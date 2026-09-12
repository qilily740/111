"""Blender solid botanical assets, exported for real-time instances and rendered from three angles."""
import bpy, math, json, os
from mathutils import Vector, Matrix
ROOT=os.path.dirname(os.path.abspath(__file__))
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
bpy.context.preferences.filepaths.save_version=0
materials={}
def material(name,color):
    m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
    b=m.node_tree.nodes.get('Principled BSDF');b.inputs['Base Color'].default_value=(*color,1);b.inputs['Roughness'].default_value=.5
    materials[name]=m;return m
leafmat=material('Living green',(.19,.32,.085));petalmat=material('Dusty rose',(.68,.28,.37));stemmat=material('Calyx green',(.11,.23,.06))
def surface(name,verts,faces,mat,thickness=0):
    data=bpy.data.meshes.new(name);data.from_pydata(verts,[],faces);data.update()
    obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj);obj.data.materials.append(mat)
    bpy.context.view_layer.objects.active=obj;obj.select_set(True)
    if thickness:
        mod=obj.modifiers.new('Real front back and edge thickness','SOLIDIFY');mod.thickness=thickness;mod.offset=0
        bpy.ops.object.modifier_apply(modifier=mod.name)
    for p in obj.data.polygons:p.use_smooth=True
    obj.select_set(False);return obj

def tube(name,points,radius,mat):
    v=[];f=[]
    for j,p in enumerate(points):
        tangent=Vector(points[min(j+1,len(points)-1)])-Vector(points[max(0,j-1)])
        basis=tangent.to_track_quat('Z','Y').to_matrix()
        for k in range(6):
            a=k*math.tau/6;v.append(Vector(p)+basis@Vector((math.cos(a)*radius,math.sin(a)*radius,0)))
    for j in range(len(points)-1):
        for k in range(6):a=j*6+k;b=j*6+(k+1)%6;f.append((a,b,b+6,a+6))
    f.extend([tuple(reversed(range(6))),tuple((len(points)-1)*6+k for k in range(6))])
    return surface(name,v,f,mat)

def join(name,objects):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:o.select_set(True)
    bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();o=bpy.context.object;o.name=name;o.select_set(False);return o
# Three leaf blades at different angles along a curved stem: volume remains visible edge-on.
parts=[tube('branch',[(0,0,-.7),(.03,0,-.15),(0,.02,.35),(.02,0,.75)],.026,leafmat)]
for i,(angle,height,length) in enumerate([(0,-.25,.83),(2.45,.02,.86),(4.9,.34,.78)]):
    v=[];f=[];direction=Vector((math.cos(angle),math.sin(angle),.52)).normalized();side=Vector((-math.sin(angle),math.cos(angle),0))
    base=Vector((0,0,height))
    for j in range(9):
        t=j/8;width=max(.004,math.sin(math.pi*t)**.75*.27)
        for k in range(5):
            u=(k-2)/2;v.append(base+direction*(t*length)+side*(u*width)+Vector((0,0,.16*math.sin(math.pi*t)*(1-u*u)+.11*t*t)))
    for j in range(8):
        for k in range(4):a=j*5+k;f.append((a,a+1,a+6,a+5))
    parts.append(surface('curled blade',v,f,leafmat,.018))
    points=[base+direction*(j/6*length)+Vector((0,0,.16*math.sin(math.pi*j/6)+.11*(j/6)**2+.012)) for j in range(7)]
    parts.append(tube('raised midrib',points,.009,leafmat))
leaf=join('leaf',parts)
# Cupped rose petals rise from a narrow base. Four whorls make a rounded, closed-looking bloom.
v=[];f=[]
for layer,count,radius,height in [(0,7,.84,.68),(1,6,.65,.86),(2,5,.44,.99),(3,4,.23,1.04)]:
    for petal in range(count):
        angle=petal*math.tau/count+layer*.57;offset=len(v)
        for j in range(7):
            t=j/6
            for k in range(5):
                u=(k-2)/2;width=math.sin(math.pi*t)**.5
                a=angle+u*width*(math.pi/count)*1.34
                r=.10+radius*math.sin(t*math.pi*.64)+.06*u*u*t
                z=-.2+t*height-.16*u*u*width+.035*math.sin(petal*2+t*5)*t
                v.append((math.cos(a)*r,math.sin(a)*r,z))
        for j in range(6):
            for k in range(4):a=offset+j*5+k;f.append((a,a+1,a+6,a+5))
rose=surface('rose',v,f,petalmat,.012)
# Calyx and short pedicel are visible from underneath the bloom.
parts=[tube('flower stalk',[(0,0,-.8),(.035,0,-.45),(0,0,-.18)],.045,stemmat)]
for k in range(5):
    a=k*math.tau/5;v=[(0,0,-.31)]
    for r,da,z in [(.34,-.24,-.2),(.63,0,.12),(.34,.24,-.2)]:v.append((math.cos(a+da)*r,math.sin(a+da)*r,z))
    parts.append(surface('sepal',v,[(0,1,2,3)],stemmat,.018))
calyx=join('calyx',parts)
assets=[leaf,rose,calyx];result=[]
for obj in assets:
    # Keep the full rounded silhouettes while limiting the cost of thousands of instances.
    if obj.name=='leaf':
        bpy.context.view_layer.objects.active=obj
        reduction=obj.modifiers.new('Web instance polygon budget','DECIMATE');reduction.ratio=.45
        bpy.ops.object.modifier_apply(modifier=reduction.name)
    data=obj.data;data.calc_loop_triangles()
    result.append(dict(name=obj.name,positions=[round(c,6) for v in data.vertices for c in (v.co.x,v.co.z,-v.co.y)],indices=[i for t in data.loop_triangles for i in t.vertices]))
outdir=os.path.join(ROOT,'botanical-art');os.makedirs(outdir,exist_ok=True)
with open(os.path.join(ROOT,'public','spring-whisper','realistic-botanicals.json'),'w') as out:json.dump({'meshes':result},out,separators=(',',':'))
# Three linked studies, all showing the exported geometry: front, side and underside.
for obj in assets:obj.hide_render=True
for panel,rotation in enumerate([(math.radians(22),0,0),(0,math.radians(78),0),(math.radians(165),0,.3)]):
    parent=bpy.data.objects.new('Study '+['front','side','underside'][panel],None);bpy.context.collection.objects.link(parent)
    parent.location=( (panel-1)*3.7,0,0);parent.rotation_euler=rotation
    for original,x in [(leaf,-.95),(rose,.7),(calyx,.7)]:
        obj=bpy.data.objects.new(original.name+' study',original.data);bpy.context.collection.objects.link(obj);obj.parent=parent;obj.location.x=x;obj.hide_render=False
bpy.ops.object.camera_add(location=(0,-9,9));camera=bpy.context.object;camera.rotation_euler=(Vector((0,0,0))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=11.6;bpy.context.scene.camera=camera
for loc,energy,size in [((-3,-4,7),1100,5),((4,2,5),850,4)]:
    bpy.ops.object.light_add(type='AREA',location=loc);light=bpy.context.object;light.data.energy=energy;light.data.shape='DISK';light.data.size=size;light.rotation_euler=(-light.location).to_track_quat('-Z','Y').to_euler()
scene=bpy.context.scene;scene.world.color=(.28,.28,.28);scene.render.engine='CYCLES';scene.cycles.samples=32;scene.render.resolution_x=1600;scene.render.resolution_y=650;scene.render.resolution_percentage=100;scene.render.filepath=os.path.join(outdir,'botanical-preview.png');scene.render.film_transparent=True
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(outdir,'realistic-botanicals.blend'));bpy.ops.render.render(write_still=True)
print('Exported solid botanical meshes:',[(m['name'],len(m['indices'])//3) for m in result])
