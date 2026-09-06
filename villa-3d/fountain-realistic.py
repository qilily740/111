import bpy, math, random, os
from mathutils import Vector

random.seed(19)
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fountain-art')
os.makedirs(OUT, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def material(name, color, roughness):
    m=bpy.data.materials.new(name); m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Roughness'].default_value=roughness
    return m,p

stone,p=material('Weathered warm limestone',(.48,.40,.29),.62)
nodes=stone.node_tree.nodes; links=stone.node_tree.links
noise=nodes.new('ShaderNodeTexNoise'); noise.inputs['Scale'].default_value=7
noise.inputs['Detail'].default_value=5
ramp=nodes.new('ShaderNodeValToRGB')
ramp.color_ramp.elements[0].color=(.22,.18,.12,1)
ramp.color_ramp.elements[1].color=(.64,.56,.43,1)
links.new(noise.outputs['Fac'],ramp.inputs[0]); links.new(ramp.outputs[0],p.inputs['Base Color'])
grain=nodes.new('ShaderNodeTexNoise'); grain.inputs['Scale'].default_value=180
bump=nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value=.24; bump.inputs['Distance'].default_value=.016
links.new(grain.outputs['Fac'],bump.inputs['Height']); links.new(bump.outputs[0],p.inputs['Normal'])
water,p=material('Clear water IOR 1.333',(.88,.97,.98),.055)
p.inputs['Transmission Weight'].default_value=1
p.inputs['IOR'].default_value=1.333
bronze,p=material('Aged bronze nozzle',(.12,.075,.027),.28); p.inputs['Metallic'].default_value=.8
ground,p=material('Courtyard stone',(.22,.23,.20),.85)

def finish(obj,name,mat):
    obj.name=name; obj.data.materials.append(mat)
    if obj.type=='MESH':
        for poly in obj.data.polygons: poly.use_smooth=True
    return obj

def lathe(name,profile,mat):
    verts=[]; faces=[]; n=160
    for r,z in profile:
        for i in range(n):
            a=2*math.pi*i/n; verts.append((r*math.cos(a),r*math.sin(a),z))
    for j in range(len(profile)-1):
        for i in range(n):
            k=j*n+i; q=j*n+(i+1)%n
            faces.append((k,q,q+n,k+n))
    mesh=bpy.data.meshes.new(name); mesh.from_pydata(verts,[],faces); mesh.update()
    obj=bpy.data.objects.new(name,mesh); bpy.context.collection.objects.link(obj)
    finish(obj,name,mat)
    bevel=obj.modifiers.new('Soft worn stone edges','BEVEL'); bevel.width=.012; bevel.segments=3
    return obj

lathe('Carved basin with thick rim and hollow interior',[(0,.02),(.98,.02),(1.04,.06),(1.06,.12),(1.03,.18),(1.01,.32),(1.06,.36),(1.07,.40),(1.04,.44),(.95,.44),(.91,.40),(.90,.23),(.83,.17),(0,.17)],stone)
lathe('Turned central pedestal',[(0,.17),(.30,.17),(.31,.22),(.27,.28),(.23,.32),(.18,.42),(.13,.71),(.16,.83),(.23,.88),(.25,.95),(0,.95)],stone)
lathe('Upper scalloped bowl profile',[(0,.88),(.16,.88),(.24,.94),(.37,1.02),(.51,1.10),(.55,1.17),(.54,1.21),(.49,1.22),(.46,1.17),(.37,1.11),(.21,1.06),(0,1.06)],stone)
lathe('Crown spindle',[(0,1.06),(.13,1.06),(.14,1.11),(.10,1.18),(.065,1.41),(.095,1.49),(.075,1.54),(0,1.56)],stone)
lathe('Bronze outlet',[(0,1.53),(.045,1.53),(.045,1.60),(.026,1.61),(.024,1.56)],bronze)

def surface(name,radius,z):
    verts=[(0,0,z)]; faces=[]; rings=70; n=160
    for j in range(1,rings+1):
        r=radius*j/rings
        for i in range(n):
            a=2*math.pi*i/n
            h=.0025*math.sin(r*73)+.0018*math.sin(r*45+a*7)
            verts.append((r*math.cos(a),r*math.sin(a),z+h))
    for i in range(n): faces.append((0,1+i,1+(i+1)%n))
    for j in range(rings-1):
        for i in range(n):
            k=1+j*n+i; q=1+j*n+(i+1)%n
            faces.append((k,k+n,q+n,q))
    mesh=bpy.data.meshes.new(name); mesh.from_pydata(verts,[],faces); mesh.update()
    obj=bpy.data.objects.new(name,mesh); bpy.context.collection.objects.link(obj); finish(obj,name,water)
    mod=obj.modifiers.new('Water depth','SOLIDIFY'); mod.thickness=.07
surface('Lower pool rippling surface',.905,.345)
surface('Upper pool rippling surface',.475,1.175)

def stream(name,points,radius):
    curve=bpy.data.curves.new(name,'CURVE'); curve.dimensions='3D'; curve.resolution_u=2
    curve.bevel_depth=radius; curve.bevel_resolution=5
    spline=curve.splines.new('POLY'); spline.points.add(len(points)-1)
    for i,point in enumerate(points):
        spline.points[i].co=(*point,1); spline.points[i].radius=1+.07*math.sin(i*.65)
    obj=bpy.data.objects.new(name,curve); bpy.context.collection.objects.link(obj); finish(obj,name,water)

# Continuous streams, deliberately no spherical droplets.
for j in range(8):
    a=j*math.tau/8
    points=[]
    for i in range(100):
        t=i/99; r=.018+.79*t; z=1.605+1.25*t-2.51*t*t
        points.append((r*math.cos(a),r*math.sin(a),z))
    stream('Continuous clear arcing jet %02d'%j,points,.012)
for j in range(12):
    a=j*math.tau/12+.14
    points=[]
    for i in range(64):
        t=i/63; r=.50+.15*t
        points.append((r*math.cos(a),r*math.sin(a),1.18-.835*t*t))
    stream('Thin upper bowl overflow %02d'%j,points,.007)

bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.005)); finish(bpy.context.object,'Courtyard',ground)
world=bpy.context.scene.world; world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.55,.66,.80,1)
world.node_tree.nodes['Background'].inputs[1].default_value=.35
def area(name,loc,power,size,color):
    bpy.ops.object.light_add(type='AREA',location=loc); o=bpy.context.object; o.name=name
    o.data.energy=power; o.data.shape='DISK'; o.data.size=size; o.data.color=color
    o.rotation_euler=(Vector((0,0,.8))-o.location).to_track_quat('-Z','Y').to_euler()
area('Warm daylight',(-3,-4,6),1000,4,(1,.86,.68))
area('Water rim reflection',(2,2,4),1400,3,(.72,.85,1))
area('Soft frontal fill',(1,-4,2.5),220,2,(1,.97,.9))
bpy.ops.object.camera_add(location=(3.2,-4.7,3.25)); camera=bpy.context.object
camera.rotation_euler=(Vector((0,0,.88))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.lens=57; bpy.context.scene.camera=camera
scene=bpy.context.scene; scene.render.engine='CYCLES'; scene.cycles.samples=64
scene.cycles.use_denoising=True; scene.cycles.max_bounces=10; scene.cycles.transmission_bounces=8
scene.render.resolution_x=1000; scene.render.resolution_y=1000; scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'; scene.render.filepath=os.path.join(OUT,'fountain-preview.png')
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'realistic-fountain.blend'))
bpy.ops.render.render(write_still=True)
