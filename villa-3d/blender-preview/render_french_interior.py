"""Independent three-storey cutaway study; never reads or overwrites live house."""
import bpy, math, random, os
from mathutils import Vector
random.seed(1800)
OUT=os.path.join(os.path.dirname(__file__),'french-interior-review')
os.makedirs(OUT,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def material(name,color,rough=.65,metal=0,kind=None):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 n=m.node_tree.nodes;p=n.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
 if kind:
  tex=n.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=5 if kind=='wood' else 100;tex.inputs['Detail'].default_value=3
  coord=n.new('ShaderNodeTexCoord');mapping=n.new('ShaderNodeVectorMath');mapping.operation='MULTIPLY';mapping.inputs[1].default_value=(2,35,4) if kind=='wood' else (1,1,1)
  m.node_tree.links.new(coord.outputs['Generated'],mapping.inputs[0]);m.node_tree.links.new(mapping.outputs[0],tex.inputs['Vector'])
  ramp=n.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].color=(*[v*.72 for v in color],1);ramp.color_ramp.elements[1].color=(*color,1);m.node_tree.links.new(tex.outputs['Fac'],ramp.inputs[0]);m.node_tree.links.new(ramp.outputs[0],p.inputs['Base Color'])
  bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.16;bump.inputs['Distance'].default_value=.012 if kind=='wood' else .003;m.node_tree.links.new(tex.outputs['Fac'],bump.inputs['Height']);m.node_tree.links.new(bump.outputs[0],p.inputs['Normal'])
 return m
ivory=material('Ivory painted timber',(.88,.82,.71),.48,kind='wood');wall=material('Fine ivory plaster',(.82,.77,.67),.86,kind='plaster');oak=material('Pale oak grain',(.65,.46,.29),.54,kind='wood');linen=material('Ivory woven linen',(.9,.83,.73),.94,kind='linen');pink=material('Washed blush cotton',(.72,.43,.49),.97,kind='linen');purple=material('Lavender linen',(.46,.37,.52),.95,kind='linen');sage=material('Sage',(.36,.43,.28));gold=material('Antique brass',(.52,.32,.12),.28,.78);stone=material('Pale limestone',(.85,.79,.69),.27,kind='plaster');roofmat=material('Grey lavender slate',(.34,.30,.39),.62,kind='plaster');dark=material('Firebox',(.04,.03,.025),.9);leaf=material('Rose foliage',(.10,.24,.055),.72)
glass=material('Clear glazing',(.94,.98,1),.06);glass.node_tree.nodes.get('Principled BSDF').inputs['Transmission Weight'].default_value=1
glow=material('Warm lamp diffuser',(.98,.77,.44),.55);p=glow.node_tree.nodes.get('Principled BSDF');p.inputs['Emission Color'].default_value=(1,.58,.25,1);p.inputs['Emission Strength'].default_value=1.5
def finish(o,name,mat):
 o.name=name;o.data.materials.append(mat);return o
def box(name,loc,size,mat=ivory,bevel=.025):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.scale=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);finish(o,name,mat)
 if bevel:mod=o.modifiers.new('Soft crafted edges','BEVEL');mod.width=bevel;mod.segments=3;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 return o
def ell(name,loc,size,mat=linen):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=20,ring_count=12,location=loc);o=bpy.context.object;o.scale=[s/2 for s in size];finish(o,name,mat)
 for p in o.data.polygons:p.use_smooth=True
 return o
def cyl(name,loc,r,h,mat=ivory,r2=None):
 bpy.ops.mesh.primitive_cone_add(vertices=24,radius1=r,radius2=r if r2 is None else r2,depth=h,location=loc);return finish(bpy.context.object,name,mat)
def rod(a,b,r=.018,mat=gold):
 a,b=Vector(a),Vector(b);o=cyl('Turned rail',(a+b)/2,r,(b-a).length,mat);o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler();return o
def light(name,loc,power,size=1,color=(1,.76,.52),target=None):
 d=bpy.data.lights.new(name,'AREA' if target else 'POINT');d.energy=power;d.color=color
 if target:d.shape='DISK';d.size=size
 else:d.shadow_soft_size=size
 o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);o.location=loc
 if target:o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
 return o
def legs(x,y,z,w,d,h):
 for dx in [-w/2+.09,w/2-.09]:
  for dy in [-d/2+.09,d/2-.09]:
   rod((x+dx,y+dy,z+.04),(x+dx*.92,y+dy*.92,z+h),.032,ivory);ell('Turned leg collar',(x+dx,y+dy,z+h*.65),(.09,.09,.13),ivory)
def cabinet(name,x,y,z,w,d,h,doors=3):
 box(name,(x,y,z+h/2),(w-.04,d-.03,h-.06));box('Stone top',(x,y,z+h-.025),(w,d,.05),stone);box('Plinth',(x,y,z+.065),(w,d,.13))
 for i in range(doors):
  xx=x-w/2+(i+.5)*w/doors;ww=w/doors-.05;box('Raised panel',(xx,y-d/2-.005,z+h*.48),(ww,.022,h-.24),ivory,.018)
  for dx in [-ww/2+.035,ww/2-.035]:box('Panel stile',(xx+dx,y-d/2-.025,z+h*.48),(.016,.016,h-.3),ivory,.003)
  ell('Brass knob',(xx+.04,y-d/2-.047,z+h*.58),(.03,.03,.03),gold)
def table(x,y,z,w=.8,d=.8,h=.42,round=True):
 if round:
  cyl('Carved round tabletop',(x,y,z+h-.025),w/2,.05,stone);cyl('Pedestal',(x,y,z+h/2),.065,h-.05,ivory,r2=.11)
  for a in range(4):rod((x,y,z+.14),(x+math.cos(a*math.pi/2)*w*.34,y+math.sin(a*math.pi/2)*w*.34,z+.04),.045,ivory)
 else:box('Oak table top',(x,y,z+h-.035),(w,d,.07),oak);legs(x,y,z,w,d,h-.07)
def chair(x,y,z,rot=0,high=False):
 before=set(bpy.data.objects);h=.70 if high else .44;legs(x,y,z,.48,.52,h);ell('Linen seat',(x,y,z+h),(.48,.49,.12));ell('Oval cane frame',(x,y+.20,z+h+.27),(.45,.07,.43),oak)
 for i in range(-3,4):rod((x+i*.047,y+.158,z+h+.12),(x+i*.047,y+.158,z+h+.40),.008,ivory)
 for i in range(5):rod((x-.16,y+.152,z+h+.14+i*.052),(x+.16,y+.152,z+h+.14+i*.052),.006,oak)
 if rot:
  for o in set(bpy.data.objects)-before:
   dx,dy=o.location.x-x,o.location.y-y;o.location.x=x+dx*math.cos(rot)-dy*math.sin(rot);o.location.y=y+dx*math.sin(rot)+dy*math.cos(rot);o.rotation_euler.z+=rot
def vase(x,y,z):
 cyl('Ceramic vase',(x,y,z+.11),.085,.22,stone,r2=.055)
 for i in range(9):
  a=i*2.4;xx=x+math.cos(a)*.14;yy=y+math.sin(a)*.14;zz=z+.35+(i%3)*.05;rod((x,y,z+.18),(xx,yy,zz),.004,leaf)
  for j in range(5):ell('Rose petal',(xx+math.cos(j*1.256)*.023,yy+math.sin(j*1.256)*.023,zz),(.066,.05,.035),pink if i%2 else linen)
def lamp(x,y,z):
 cyl('Lamp base',(x,y,z+.018),.10,.035,gold);rod((x,y,z+.03),(x,y,z+.28),.018,gold);cyl('Linen lampshade',(x,y,z+.37),.16,.23,linen,r2=.095);light('Warm table lamp',(x,y,z+.35),12,.08)
def sofa(x,y,z,w=1.85):
 legs(x,y,z,w,.82,.16);box('Upholstered sofa base',(x,y,z+.29),(w-.12,.82,.28),linen,.12);ell('Soft sofa back',(x,y+.32,z+.63),(w-.12,.24,.50))
 for dx in [-w/2+.105,w/2-.105]:ell('Rolled arm',(x+dx,y,z+.53),(.21,.90,.46))
 for dx in [-w*.24,w*.24]:
  box('Seat cushion',(x+dx,y-.06,z+.47),(w*.43,.65,.16),linen,.07);ell('Throw pillow',(x+dx,y+.18,z+.67),(.39,.16,.35),pink)
def bed(x,y,z,w=1.8):
 legs(x,y,z,w,2,.15);box('Bed frame 180x200',(x,y,z+.27),(w,2,.24),ivory,.065);box('Linen mattress',(x,y,z+.46),(w-.04,1.94,.22),linen,.1);box('Pink duvet',(x,y-.25,z+.61),(w,1.44,.13),pink,.065)
 box('Upholstered headboard',(x,y+.93,z+.64),(w,.14,.92),linen,.10)
 for dx in [-w*.24,w*.24]:ell('Pillow',(x+dx,y+.56,z+.64),(w*.42,.43,.18));ell('Blush cushion',(x+dx,y+.64,z+.78),(w*.29,.13,.30),purple)
 for dx in [-.60,-.3,0,.3,.6]:
  if abs(dx)<w/2:ell('Tuft button',(x+dx,y+.85,z+.87),(.024,.02,.024),ivory)
def frame(x,y,z,w=1,h=.7):
 box('Gilt picture frame',(x,y,z),(w,.06,h),gold);box('Sage artwork',(x,y-.036,z),(w-.08,.012,h-.08),sage)
 for i in range(7):ell('Painted floral relief',(x+random.uniform(-w*.34,w*.34),y-.05,z+random.uniform(-h*.3,h*.3)),(.10,.015,.12),pink if i%2 else linen)
def rail(x1,x2,y,z):
 box('Balcony handrail',((x1+x2)/2,y,z+.88),(x2-x1,.10,.10),ivory)
 for i in range(int((x2-x1)/.22)+1):
  x=x1+i*.22;rod((x,y,z+.08),(x,y,z+.84),.024,ivory);ell('Baluster',(x,y,z+.40),(.10,.10,.18),ivory)
# Shell: front is negative Y; real dimensions, 3.15 m floor-to-floor.
box('Garden ground',(0,0,-.12),(200,200,.20),material('Warm backdrop',(.65,.67,.59),.95),0)
box('Foundation',(0,0,.18),(11.6,6.4,.36),stone)
for f in range(3):
 z=.4+f*3.15
 # Hole in east rear floor accommodates each full flight.
 box('Floor west',( -1.0,0,z-.08),(9.0,6,.16),oak)
 box('East front landing',(4.5,-2.37,z-.08),(2,.96,.16),oak)
 box('East rear landing',(4.5,2.45,z-.08),(2,1.1,.16),oak)
 box('Rear plaster wall',(0,2.98,z+1.43),(11,.18,2.86),wall)
 for x in [-5.48,5.48]:box('Side wall',(x,0,z+1.43),(.18,6,2.86),wall)
 for x in [-5.55,-1.72,1.72,5.55]:
  box('Facade pilaster',(x,-2.9,z+1.4),(.23,.28,2.8));box('Column capital',(x,-2.9,z+2.74),(.39,.40,.15))
 for zz in [z+.06,z+2.82]:box('Cornice',(0,-2.94,zz),(11.4,.30,.13))
 for x in [-4,-2,0,2,4]:
  for dx in [-.65,.65]:box('Wall panel stile',(x+dx,2.86,z+1.5),(.025,.025,2.3))
  for zz in [z+.35,z+2.65]:box('Wall panel rail',(x,2.86,zz),(1.3,.025,.025))
 for i in range(22):box('Oak floor board',( -5.25+i*.49,-.1,z+.007),(.475,5.7,.018),oak,.002)
 # Keep board geometry out of the stair opening.
 for o in list(bpy.context.scene.objects):
  if o.name.startswith('Oak floor board') and o.location.x>3.5 and abs(o.location.z-z)<.04:o.hide_render=True
 # Warm pendants.
 for x in [-3.4,0,3.1]:
  rod((x,0,z+2.80),(x,0,z+2.38),.012,gold)
  for a in range(5):
   xx=x+math.cos(a*math.tau/5)*.27;yy=math.sin(a*math.tau/5)*.27;rod((x,0,z+2.4),(xx,yy,z+2.26),.018,gold);cyl('Candle pendant',(xx,yy,z+2.33),.027,.14,glow)
  light('Chandelier warm',(x,0,z+2.35),48,.35)
# Full right-side flights: 18 risers, 175 mm, 240 mm tread; landings at both ends.
for f in range(2):
 z=.4+f*3.15
 for i in range(18):
  yy=-1.90+i*.225;zz=z+(i+1)*.175;box('Oak stair tread',(4.52,yy,zz-.06),(1.10,.235,.12),oak,.015);box('White stair riser',(4.52,yy-.105,zz-.13),(1.05,.025,.15))
  rod((3.94,yy,zz),(3.94,yy,zz+.87),.023,ivory)
 rod((3.94,-1.90,z+1.045),(3.94,1.925,z+4.02),.035,oak)
 # Upper landing links to the open gallery along the rear.
 rail(1.8,3.9,1.65,z+3.15)
# Living room.
sofa(-3.55,.50,.4);table(-3.55,-.72,.4);vase(-3.55,-.72,.82)
chair(-4.65,-.60,.4,-.55);chair(-2.43,-.60,.4,.55)
cyl('Living rug',(-3.55,-.40,.415),1.40,.014,linen)
box('Firebox',(-3.55,2.67,.88),(1.10,.25,.80),dark)
for x in [-4.16,-2.94]:box('Carved fireplace upright',(x,2.62,.87),(.18,.35,.94))
box('Fireplace mantel',(-3.55,2.62,1.37),(1.40,.35,.10));frame(-3.55,2.77,2.12,1.30,.9)
for x in [-3.85,-3.55,-3.3]:cyl('Hearth candle',(x,2.47,.66),.04,.28,glow)
lamp(-4.9,1.8,1.20);rod((-4.9,1.8,.4),(-4.9,1.8,1.2),.025,gold)
# Foyer with uncluttered entry axis.
table(0,-.3,.4,.85,.85,.72);vase(0,-.3,1.12);cyl('Foyer round rug',(0,-.3,.415),1.05,.016,purple)
cabinet('Entry console 120x35x85',0,2.55,.4,1.2,.35,.85);vase(.3,2.55,1.25);frame(0,2.77,2.10,.90,1.1)
for i in range(4):box('Entry limestone step',(0,-3.12-i*.28,.35-i*.085),(2.6,.60,.15),stone)
# Central arched stone entrance, intentionally open for the cutaway.
for i in range(25):
 a=math.pi*i/24;xx=1.30*math.cos(a);zz=2.02+1.30*math.sin(a);o=box('Arch voussoir',(xx,-2.96,zz),(.18,.34,.22));o.rotation_euler.y=a-math.pi/2
# Kitchen and dining, separate circulation to stairs.
cabinet('Kitchen island 180x80x92',2.55,.55,.4,1.8,.8,.92);box('Sink',(2.95,.55,1.323),(.46,.34,.018),dark);rod((2.95,.75,1.32),(2.95,.75,1.59),.017,gold);rod((2.95,.75,1.59),(2.95,.55,1.59),.017,gold)
for x in [1.92,2.55,3.18]:chair(x,-.10,.4,math.pi,True)
table(2.55,-1.72,.4,1.6,.85,.75,False);chair(1.5,-1.72,.4,-math.pi/2);chair(3.6,-1.72,.4,math.pi/2);vase(2.55,-1.72,1.15)
for x in [2.10,3.0]:cyl('Dinner plate',(x,-1.72,1.164),.14,.018,stone)
cabinet('Rear kitchen cabinets',2.35,2.6,.4,2.5,.55,.92,4)
# Bedroom on second storey, guest to right.
bed(0,.35,3.55);cyl('Bedroom rug',(0,.10,3.567),1.48,.018,linen)
for x in [-1.20,1.20]:cabinet('Bedside 50x40x55',x,1.02,3.55,.5,.4,.55,2);lamp(x,1.02,4.10)
frame(0,2.77,5.25,1.25,.75)
cabinet('Four-door wardrobe 180x60x240',-3.85,2.57,3.55,1.8,.60,2.40,4)
table(-3.80,-.25,3.55,1.4,.6,.75,False);chair(-3.8,-.90,3.55,math.pi);lamp(-4.25,-.25,4.3)
bed(2.60,.48,3.55,.96);cabinet('Guest bedside',3.35,1.0,3.55,.4,.4,.55,2);lamp(3.35,1,4.1)
cabinet('Guest bookcase base',2.70,2.57,3.55,1.2,.32,.7,2)
for zz in [4.35,4.8,5.25]:
 box('Book shelf',(2.7,2.55,zz),(1.2,.32,.04))
 for i in range(6):box('Linen-bound book',(2.24+i*.16,2.55,zz+.17),(.11,.22,.28),purple if i%2 else sage)
# Third floor: study and reading salon, not an extra roof masquerading as a storey.
table(0,.35,6.7,1.4,.6,.75,False);chair(0,1.1,6.7);lamp(-.45,.35,7.45);vase(.45,.35,7.45)
sofa(-3.3,.65,6.7);table(-3.3,-.55,6.7);vase(-3.3,-.55,7.12);frame(-3.3,2.77,8.4,1.3,.9)
cabinet('Library base',2.55,2.6,6.7,1.8,.4,.8,3)
for zz in [7.6,8.1,8.6]:
 box('Library shelf',(2.55,2.6,zz),(1.8,.4,.055))
 for i in range(10):box('Library book',(1.78+i*.16,2.58,zz+.19),(.105,.27,.31),pink if i%3 else sage)
chair(2.2,-.2,6.7);table(2.8,-.4,6.7,.6,.6,.6)
# Balcony, grey-lavender hip roof and chimney.
box('Second floor balcony',(0,-3.42,3.43),(3.45,1.15,.22),stone);rail(-1.7,1.7,-3.96,3.55)
for x in [-1.7,1.7]:box('Balcony newel',(x,-3.96,4.03),(.24,.24,1.0))
verts=[(-5.85,-3.3,9.67),(5.85,-3.3,9.67),(5.85,3.3,9.67),(-5.85,3.3,9.67),(-2.7,0,11.30),(2.7,0,11.30)]
me=bpy.data.meshes.new('Hip roof');me.from_pydata(verts,[],[(0,1,5,4),(1,2,5),(2,3,4,5),(3,0,4)]);me.update();o=bpy.data.objects.new('Lavender hipped roof',me);bpy.context.collection.objects.link(o);finish(o,'Lavender hipped roof',roofmat)
for j in range(18):
 t=j/18;yy=-3.3*(1-t);zz=9.67+1.63*t;ww=11.7-6.3*t;rod((-ww/2,yy,zz+.018),(ww/2,yy,zz+.018),.021,roofmat)
box('Chimney',(3.5,1.4,10.65),(.65,.70,2.0),wall);box('Chimney crown',(3.5,1.4,11.7),(.83,.85,.16))
# Conservatory: visible transparent glass and white mullions, left-front annex.
box('Conservatory floor',(-6.65,-1.35,.32),(2.2,3.25,.20),stone)
for x in [-7.75,-5.55]:
 for y in [-2.95,-1.9,-.85,.25]:rod((x,y,.4),(x,y,2.9),.035,ivory)
 box('Conservatory glazing',(x,-1.35,1.65),(.012,3.2,2.5),glass,0)
for x in [-7.75,-7.2,-6.65,-6.1,-5.55]:rod((x,-2.95,.4),(x,-2.95,2.9),.025,ivory);rod((x,-2.95,2.9),(x,.25,3.3),.03,ivory)
o=box('Glass greenhouse roof',(-6.65,-1.35,3.1),(2.2,3.23,.016),glass,0);o.rotation_euler.x=.124
table(-6.65,-1.35,.42,.75,.75,.75);chair(-6.65,-2.1,.42,math.pi);chair(-6.65,-.6,.42);vase(-6.65,-1.35,1.17)
# Flowers via Geometry Nodes instancing: limited density preserves the facade.
petal=ell('Flower prototype',(0,0,-10),(.14,.14,.08),pink)
for j in range(5):ell('Petal detail',(math.cos(j*1.256)*.045,math.sin(j*1.256)*.045,-10),(.09,.07,.04),pink)
flowerparts=[o for o in bpy.context.scene.objects if o.location.z < -9]
bpy.ops.object.select_all(action='DESELECT')
for o in flowerparts:o.select_set(True)
bpy.context.view_layer.objects.active=petal;bpy.ops.object.join();petal.hide_render=True
for x in [-4.5,4.5]:
 box('Garden bed',(x,-4.4,.18),(3.0,1.0,.36),stone)
 points=[]
 for i in range(180):
  xx=x+random.uniform(-1.4,1.4);yy=-4.4+random.uniform(-.4,.4);zz=random.uniform(.4,1.05);points.append((xx,yy,zz))
  if i%5==0:ell('Shrub foliage',(xx,yy,zz-.15),(.45,.4,.4),leaf)
 mesh=bpy.data.meshes.new('Flower points');mesh.from_pydata(points,[],[]);ob=bpy.data.objects.new('Instanced garden flowers',mesh);bpy.context.collection.objects.link(ob)
 ng=bpy.data.node_groups.new('Flower scattering','GeometryNodeTree');ng.interface.new_socket(name='Geometry',in_out='INPUT',socket_type='NodeSocketGeometry');ng.interface.new_socket(name='Geometry',in_out='OUTPUT',socket_type='NodeSocketGeometry')
 inp=ng.nodes.new('NodeGroupInput');out=ng.nodes.new('NodeGroupOutput');info=ng.nodes.new('GeometryNodeObjectInfo');info.inputs['Object'].default_value=petal;info.inputs['As Instance'].default_value=True;inst=ng.nodes.new('GeometryNodeInstanceOnPoints');ng.links.new(inp.outputs['Geometry'],inst.inputs['Points']);ng.links.new(info.outputs['Geometry'],inst.inputs['Instance']);ng.links.new(inst.outputs['Instances'],out.inputs['Geometry']);mod=ob.modifiers.new('Geometry Nodes flower scatter','NODES');mod.node_group=ng
for x in [-1.4,-.7,0,.7,1.4]:
 cyl('Balcony flower pot',(x,-3.88,4.50),.14,.22,ivory);vase(x,-3.88,4.6)
 for j in range(4):ell('Trailing foliage',(x+.06*math.sin(j),-4.02,4.42-j*.15),(.20,.14,.25),leaf)
# Rendering setup: real Cycles GI and contact shadows, restrained warm fixtures.
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True;scene.cycles.max_bounces=7
scene.world.use_nodes=True;scene.world.node_tree.nodes.get('Background').inputs[0].default_value=(.72,.80,1,1);scene.world.node_tree.nodes.get('Background').inputs[1].default_value=.45
light('Spring afternoon softbox',(-9,-9,15),2200,8,(1,.87,.72),(0,0,4));light('Front sky fill',(6,-12,10),1600,10,(.79,.86,1),(0,0,4))
sun=bpy.data.lights.new('Afternoon sunlight','SUN');sun.energy=1.5;sun.angle=.12;o=bpy.data.objects.new('Afternoon sunlight',sun);bpy.context.collection.objects.link(o);o.rotation_euler=(math.radians(28),math.radians(-24),math.radians(-35))
scene.render.resolution_x=1440;scene.render.resolution_y=1080;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX';scene.render.image_settings.file_format='PNG';scene.render.film_transparent=False
scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=1
def camera(name,loc,target,lens):
 d=bpy.data.cameras.new(name);d.lens=lens;o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler();return o
cameras=[('01-front-cutaway',camera('Front cutaway 50mm',(-.9,-29,14.2),(-.8,0,5.25),50)),('02-master-bedroom',camera('Master bedroom',(.3,-6.1,5.45),(0,.60,4.35),48)),('03-living-room',camera('Living room',(-3.9,-5.45,2.4),(-3.5,.60,1.12),45))]
scene.camera=cameras[0][1];bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'french-three-storey.blend'))
for name,cam in cameras:
 scene.camera=cam;scene.render.filepath=os.path.join(OUT,name+'.png');bpy.ops.render.render(write_still=True)
print('DELIVERED',OUT,flush=True)
