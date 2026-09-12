"""Standalone Blender preview of the Ideal Machine villa.

This creates only new files inside blender-preview/ and never edits the live
Three.js house or its assets.
"""
import bpy
import math
import os
import random
from mathutils import Vector

random.seed(906)
ROOT = os.path.dirname(os.path.abspath(__file__))
OUT_BLEND = os.path.join(ROOT, "ideal-villa-preview.blend")
OUT_IMAGE = os.path.join(ROOT, "ideal-villa-preview.png")

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
bpy.context.preferences.filepaths.save_version = 0


def material(name, color, roughness=.65, metallic=0.0, transmission=0.0, emission=None):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if "Transmission Weight" in bsdf.inputs:
        bsdf.inputs["Transmission Weight"].default_value = transmission
    if emission:
        bsdf.inputs["Emission Color"].default_value = (*emission, 1)
        bsdf.inputs["Emission Strength"].default_value = 2.2
    return mat


cream = material("Warm ivory plaster", (.78, .71, .61), .88)
trim = material("Carved pale limestone", (.93, .88, .78), .62)
stone = material("Garden limestone", (.50, .43, .34), .9)
roof = material("Dusty mauve roof tile", (.28, .14, .19), .6)
frame = material("Muted lavender window frames", (.20, .15, .23), .45, .15)
glass = material("Smoky reflective glass", (.08, .12, .16), .18, .2, .25)
wood = material("Weathered pergola wood", (.25, .14, .09), .72)
iron = material("Black garden iron", (.035, .028, .032), .35, .55)
leaf_mat = material("Deep rose foliage", (.055, .19, .045), .72)
leaf_light = material("Fresh spring foliage", (.16, .32, .08), .76)
petals = [material("Rose dusty pink", (.60, .25, .34), .58), material("Rose mauve", (.38, .22, .43), .58), material("Rose ivory", (.88, .78, .67), .62), material("Rose lavender", (.45, .38, .62), .58)]
water = material("Fountain water", (.32, .60, .68), .1, .05, .55)
path_mat = material("Warm path pavers", (.45, .38, .31), .92)
grass_mat = material("Soft lawn", (.12, .27, .075), .95)
warm_glow = material("Warm interior glow", (.50, .24, .08), .3, emission=(1.0, .45, .12))


def finish(obj, name, mat, bevel=0.0):
    obj.name = name
    if mat:
        obj.data.materials.append(mat)
    if bevel:
        mod = obj.modifiers.new("Soft architectural edges", "BEVEL")
        mod.width = bevel
        mod.segments = 3
    return obj


def cube(name, loc, scale, mat, bevel=.025):
    bpy.ops.mesh.primitive_cube_add(location=loc)
    obj = bpy.context.object
    obj.scale = (scale[0] / 2, scale[1] / 2, scale[2] / 2)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj, name, mat, bevel)


def cylinder(name, loc, radius, depth, mat, vertices=24):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc)
    return finish(bpy.context.object, name, mat, .012)


def sphere(name, loc, scale, mat, segments=20, rings=12):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, location=loc)
    obj = bpy.context.object
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    for poly in obj.data.polygons:
        poly.use_smooth = True
    return finish(obj, name, mat)


def curve_tube(name, points, radius, mat):
    data = bpy.data.curves.new(name, "CURVE")
    data.dimensions = "3D"
    data.bevel_depth = radius
    data.bevel_resolution = 3
    spline = data.splines.new("BEZIER")
    spline.bezier_points.add(len(points) - 1)
    for point, co in zip(spline.bezier_points, points):
        point.co = co
        point.handle_left_type = point.handle_right_type = "AUTO"
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    return obj


def roof_mesh(name, x, y, z, width, depth, height, mat):
    ridge = max(.2, (width - depth) / 2)
    verts = [(-width/2,-depth/2,0),(width/2,-depth/2,0),(width/2,depth/2,0),(-width/2,depth/2,0),(-ridge,0,height),(ridge,0,height)]
    faces = [(0,1,5,4),(1,2,5),(2,3,4,5),(3,0,4)]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.location = (x, y, z)
    finish(obj, name, mat, .045)
    # Tile courses make the roof read as genuinely modeled.
    for row in range(9):
        t = (row + .4) / 9
        yy = y - depth/2 + t*depth/2
        zz = z + t*height
        span = width*(1-t) + 2*ridge*t
        for side in (-1, 1):
            curve_tube("Modeled roof tile course", [(-span/2+x, y+side*(depth/2*(1-t)), zz), (span/2+x, y+side*(depth/2*(1-t)), zz)], .022, roof)
    return obj


def arch_window(name, x, y, z, width, height, front=True):
    # Front-facing windows use Y thickness; side-facing windows rotate as a group.
    root = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(root)
    root.location = (x, y, z)
    panel = cube(name+" dark glazing", (0, 0, height*.38), (width, .055, height*.76), glass, .015); panel.parent = root
    glow = cube(name+" warm room", (0, .035, height*.38), (width*.9, .025, height*.68), warm_glow, 0); glow.parent = root
    radius = width/2
    arch_z = height - radius
    points = [(-radius,0,0),(-radius,0,arch_z)]
    points += [(math.cos(math.pi-i*math.pi/24)*radius,0,arch_z+math.sin(math.pi-i*math.pi/24)*radius) for i in range(25)]
    points += [(radius,0,0)]
    frame_curve = curve_tube(name+" carved arch frame", points, .085, trim); frame_curve.parent = root
    for xx in (-radius, radius):
        post = cube(name+" stone jamb", (xx,0,arch_z/2), (.16,.15,arch_z), trim, .018); post.parent=root
    mullion = cube(name+" center mullion", (0,-.035,height*.39), (.055,.05,height*.77), frame, .01); mullion.parent=root
    transom = cube(name+" transom", (0,-.035,arch_z), (width,.05,.055), frame, .01); transom.parent=root
    sill = cube(name+" projecting sill", (0,0,-.05), (width+.34,.28,.14), trim, .025); sill.parent=root
    if not front:
        root.rotation_euler[2] = math.pi/2
    return root


def balcony():
    cube("Front balcony stone slab", (0,-3.15,3.25), (3.65,1.15,.26), trim, .055)
    cube("Front balcony lower rail", (0,-3.72,3.47), (3.72,.16,.16), trim, .025)
    cube("Front balcony handrail", (0,-3.72,4.32), (3.78,.19,.18), trim, .035)
    for x in [(-1.72+i*.245) for i in range(15)]:
        cylinder("Turned balcony baluster", (x,-3.72,3.89), .055, .72, trim, 20)
        sphere("Baluster ornament", (x,-3.72,3.75), (.10,.10,.10), trim, 16, 10)
    for x in (-1.82,1.82):
        cylinder("Balcony corner post", (x,-3.72,3.88), .09,.95,trim,24)


def plant_cluster(x, y, z, scale=1, blooms=4, trailing=False):
    for i in range(9):
        a = i*2.399 + random.random()*.45
        r = (.12 + random.random()*.28)*scale
        sphere("Layered leaf", (x+math.cos(a)*r, z+math.sin(a)*r, y+random.random()*.30*scale), (.16*scale,.09*scale,.22*scale), leaf_mat if i%3 else leaf_light, 12, 8)
    for i in range(blooms):
        a = i*2.15 + random.random()
        r = (.08 + random.random()*.25)*scale
        flower = sphere("Cupped balcony rose", (x+math.cos(a)*r, z+math.sin(a)*r, y+.15*scale+random.random()*.24*scale), (.12*scale,.12*scale,.10*scale), petals[(i+int((x+5)*3))%4], 16, 10)
        for j in range(5):
            small = sphere("Layered rose petal", (flower.location.x+math.cos(j*1.257)*.055*scale,flower.location.y+math.sin(j*1.257)*.055*scale,flower.location.z+.035*scale),(.065*scale,.065*scale,.045*scale),flower.data.materials[0],12,7)
    if trailing:
        length = .55 + random.random()*.35
        pts = [(x,z,y),(x+.04,z-.03,y-length*.45),(x-.03,z,y-length)]
        # Coordinate swap: curve points remain Blender XYZ.
        curve_tube("Natural trailing flowering vine", [(p[0],p[1],p[2]) for p in pts], .018*scale, leaf_mat)
        for j in range(3):
            yy = y-length*(j+1)/4
            sphere("Trailing leaf", (x+(-1)**j*.08, z-.01, yy), (.12,.06,.18), leaf_mat, 12, 8)


# Ground and architectural masses.
cube("Garden lawn", (0,0,-.12), (26,22,.25), grass_mat, .05)
cube("Main villa", (0,0,3.0), (8.5,5.5,6.0), cream, .08)
cube("Central entrance pavilion", (0,-3.0,2.7), (3.25,1.05,5.4), cream, .07)
cube("Left wing", (-4.75,.35,2.0), (2.0,4.3,4.0), cream, .07)
cube("Right wing", (4.65,.15,2.05), (2.2,4.5,4.1), cream, .07)
roof_mesh("Main hipped mauve roof",0,0,6.0,9.1,6.2,2.2,roof)
roof_mesh("Left wing roof",-4.75,.35,4.0,2.55,4.8,1.05,roof)
roof_mesh("Right wing roof",4.65,.15,4.1,2.75,4.9,1.1,roof)

# Cornices and facade rhythm.
for z in (.35,3.12,5.86):
    cube("Continuous stone cornice", (0,-2.8,z), (8.9,.26,.18), trim, .025)
for x in (-4.02,4.02,-1.72,1.72):
    cube("Facade pilaster", (x,-2.88,3.15), (.30,.30,5.55), trim, .025)
    cube("Pilaster capital", (x,-2.9,5.82), (.48,.38,.22), trim, .035)

# Windows and entrance.
arch_window("Upper central French window",0,-3.58,3.55,1.75,2.10)
arch_window("Ground central arched door",0,-3.57,.55,1.92,2.55)
for x in (-2.75,2.75):
    arch_window("Upper arched window",x,-2.83,3.55,1.22,1.92)
    arch_window("Ground arched window",x,-2.83,.58,1.28,2.02)
arch_window("Left wing arched window",-4.76,-1.84,.62,1.28,2.05)
arch_window("Right wing arched window",4.64,-2.15,.62,1.32,2.08)

# Curved central pediment and oculus.
curve_tube("Curved central pediment", [(-1.65,-3.6,5.92),(-.95,-3.62,6.48),(0,-3.64,6.82),(.95,-3.62,6.48),(1.65,-3.6,5.92)], .13, trim)
cylinder("Pediment oculus", (0,-3.68,6.30), .24, .10, frame, 48).rotation_euler[0]=math.pi/2
cylinder("Oculus stone ring", (0,-3.72,6.30), .34, .08, trim, 48).rotation_euler[0]=math.pi/2

balcony()

# Lush continuous balcony planting: the approved dense treatment.
curve_tube("Balcony winding vine", [(-1.85,-3.82,4.28),(-1.1,-3.87,4.42),(-.35,-3.82,4.31),(.45,-3.88,4.44),(1.15,-3.83,4.32),(1.86,-3.86,4.43)], .032, leaf_mat)
for i in range(17):
    x=-1.72+i*.215
    plant_cluster(x,4.22+random.random()*.08,-3.82,.72,3,trailing=(i%3==0))

# Climbing roses on the facade.
for x in (-3.9,3.92):
    curve_tube("Facade climbing rose stem",[(x,-3.02,.35),(x+.12,-3.10,2.0),(x-.08,-3.04,3.7),(x+.1,-3.08,5.6)],.025,leaf_mat)
    for j in range(12):
        plant_cluster(x+math.sin(j)*.12,.45+j*.42,-3.12,.45,2,j%4==0)

# Glass conservatory on the front-right.
cube("Conservatory stone base", (5.15,-3.65,.34), (3.0,2.1,.55), trim, .04)
for x in (3.78,4.45,5.12,5.79,6.47):
    cube("Conservatory glazing", (x,-4.58,1.42), (.57,.045,1.75), glass, .01)
    cube("Conservatory mullion", (x-.32,-4.61,1.42), (.055,.08,2.15), frame, .01)
roof_mesh("Conservatory glass roof",5.12,-3.62,2.48,3.1,2.25,.72,frame)

# Right upper terrace and pergola.
cube("Right terrace rail", (4.85,-2.83,4.48), (2.55,.17,.17), trim, .025)
for x in (3.78,4.15,4.52,4.89,5.26,5.63,6.00):
    cylinder("Terrace baluster",(x,-2.83,4.05),.05,.72,trim,18)
for x in (3.8,6.0):
    for y in (-2.75,-.75):
        cube("Pergola post",(x,y,5.20),(.13,.13,2.0),wood,.015)
for i in range(8):
    cube("Pergola roof slat",(3.8+i*.315,-1.75,6.18),(.10,2.35,.12),wood,.015)

# Garden path and fountain.
for i in range(8):
    angle=(i-3.5)*.07
    cube("Individual garden paver",(math.sin(angle)*i*.45,-8.0+i*.72,.03),(1.1,.62,.10),path_mat,.05)
cylinder("Fountain lower basin",(-4.1,-6.1,.38),1.18,.38,stone,64)
cylinder("Fountain water",(-4.1,-6.1,.59),.98,.08,water,64)
cylinder("Fountain pedestal",(-4.1,-6.1,1.05),.20,.92,stone,36)
cylinder("Fountain upper bowl",(-4.1,-6.1,1.50),.56,.18,stone,48)
curve_tube("Fountain water jet",[(-4.1,-6.1,1.55),(-4.1,-6.1,2.30)],.035,water)

# Flower beds framing the house.
for side in (-1,1):
    for i in range(22):
        x=side*(2.0+i*.23)
        y=-4.4-random.random()*1.0
        plant_cluster(x,.1,y,.55+random.random()*.35,2)
for i in range(20):
    x=-7.0+random.random()*14
    y=-1.8+random.random()*2.4
    plant_cluster(x,.08,y,.55+random.random()*.25,2)

# Flowering cherry tree on the left.
cylinder("Cherry tree trunk",(-7.1,-.8,2.2),.23,4.4,wood,20)
for i in range(11):
    a=i*2.399
    end=(-7.1+math.cos(a)*(1.2+random.random()*1.8),-.8+math.sin(a)*(1.1+random.random()*1.4),3.2+random.random()*2.4)
    curve_tube("Cherry branch",[(-7.1,-.8,2.4),(-7.1+math.cos(a)*.7,-.8+math.sin(a)*.5,3.35),end],.055,wood)
    for j in range(7):
        sphere("Cherry blossom cloud",(end[0]+random.uniform(-.55,.55),end[1]+random.uniform(-.55,.55),end[2]+random.uniform(-.35,.45)),(.35,.35,.28),petals[j%2],14,9)

# Foreground boundary hints.
for x in (-7.4,-3.0,3.0,7.4):
    cube("Garden gate pillar",(x,-9.0,.85),(.48,.48,1.7),trim,.035)
    cube("Pillar cap",(x,-9.0,1.75),(.68,.68,.20),trim,.035)
for side in (-1,1):
    for i in range(12):
        x=side*(3.25+i*.35)
        cylinder("Wrought iron fence",(x,-9.0,.85),.022,1.35,iron,8)
    cube("Fence top rail",(side*5.2,-9.0,1.30),(4.1,.06,.06),iron,.01)

# Lighting and camera.
world=bpy.context.scene.world
world.use_nodes=True
bg=world.node_tree.nodes.get("Background")
bg.inputs["Color"].default_value=(.34,.49,.70,1)
bg.inputs["Strength"].default_value=.22
bpy.ops.object.light_add(type="SUN",location=(-8,-10,14))
sun=bpy.context.object;sun.name="Warm late afternoon sun";sun.data.energy=2.8;sun.data.angle=math.radians(7);sun.data.color=(1.0,.72,.48);sun.rotation_euler=(math.radians(28),0,math.radians(-32))
bpy.ops.object.light_add(type="AREA",location=(5,-10,10))
area=bpy.context.object;area.name="Soft sky fill";area.data.energy=1150;area.data.shape="DISK";area.data.size=8;area.data.color=(.68,.80,1.0);area.rotation_euler=(Vector((0,0,3.2))-area.location).to_track_quat('-Z','Y').to_euler()

bpy.ops.object.camera_add(location=(16,-20,11.5))
camera=bpy.context.object
camera.name="Three-quarter villa camera"
camera.data.lens=52
camera.rotation_euler=(Vector((0,-.6,3.15))-camera.location).to_track_quat('-Z','Y').to_euler()
bpy.context.scene.camera=camera

scene=bpy.context.scene
scene.render.engine="BLENDER_EEVEE"
scene.render.resolution_x=1440
scene.render.resolution_y=1080
scene.render.resolution_percentage=100
scene.render.image_settings.file_format="PNG"
scene.render.filepath=OUT_IMAGE
scene.render.film_transparent=False
scene.render.image_settings.color_mode="RGBA"
scene.view_settings.look="AgX - Medium High Contrast"

bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND)
bpy.ops.render.render(write_still=True)
print("Saved standalone Blender preview:", OUT_BLEND)
print("Rendered preview:", OUT_IMAGE)
