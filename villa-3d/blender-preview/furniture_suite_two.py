"""Ten additional furniture studies. Independent Blender assets and real Cycles renders."""
import os
BASE=os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(BASE,'furniture_atelier.py')) as f:helpers=f.read().split('# SOFA —')[0]
exec(compile(helpers,'atelier_helpers','exec'))
OUT=os.path.join(BASE,'furniture-suite-two');os.makedirs(OUT,exist_ok=True)
marble=mat('Honed ivory marble',(.85,.81,.73),.27)
n=marble.node_tree.nodes;l=marble.node_tree.links;p=n.get('Principled BSDF');tex=n.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=3.8;tex.inputs['Roughness'].default_value=.7
wave=n.new('ShaderNodeTexWave');wave.wave_type='BANDS';wave.bands_direction='DIAGONAL';wave.inputs['Scale'].default_value=4;wave.inputs['Distortion'].default_value=7;wave.inputs['Detail Scale'].default_value=1.3
coord=n.new('ShaderNodeTexCoord');l.new(coord.outputs['Generated'],wave.inputs['Vector']);r=n.new('ShaderNodeValToRGB');r.color_ramp.elements[0].position=.87;r.color_ramp.elements[0].color=(.88,.84,.76,1);r.color_ramp.elements[1].position=.97;r.color_ramp.elements[1].color=(.59,.57,.53,1);l.new(wave.outputs[0],r.inputs[0]);l.new(r.outputs[0],p.inputs['Base Color'])
mirror=mat('Silvered mirror',(.80,.85,.87),.055,.96);ceramic=mat('Glazed ivory ceramic',(.89,.86,.79),.20);wax=mat('Ivory beeswax',(.91,.80,.59),.62);black=mat('Sooted fireplace interior',(.035,.027,.02),.90)
jobs=[]
def begin(name):return set(bpy.data.objects),collection(name)
def end(before,col,slug,title,dimensions):
 collect_since(before,col);col.hide_render=True;col['reference_dimensions_cm']=dimensions;jobs.append((slug,col,title,dimensions));print('BUILT',slug,flush=True)
def cylinder(name,x,y,z,r,h,m=cream):
 bpy.ops.mesh.primitive_cylinder_add(vertices=64,radius=r,depth=h,location=(x,y,z));return finish(bpy.context.object,name,m)
def panel(cx,y,z,w,h,m=cream):
 box('Recessed door field',(cx,y,z),(w,.018,h),m,.009)
 for inset,rr,mm in [(0,.004,m),(.017,.0025,m)]:
  pts=outline(0,0,w-2*inset,h-2*inset,0,min(.026,w/8));tube('Raised panel molding',[(cx+x,y-.012,z+yy) for x,yy,_ in pts],rr,mm,True)
def ornament(cx,y,z,w=.24,h=.12):
 for s in [-1,1]:
  pts=[]
  for i in range(70):
   t=i/69;a=t*2.1*pi;rr=.012+.034*(1-t);pts.append((cx+s*(.02+t*w*.36+rr*cos(a)),y,z+h*.30*sin(t*pi)+rr*sin(a)))
  tube('Carved acanthus scroll',pts,.0045,cream)
  for j in range(5):
   t=j/5;xx=cx+s*(.035+t*w*.33);zz=z+sin(t*pi)*h*.25
   o=ball('Acanthus carved leaf',(xx,y-.001,zz),(.020,.008,.009),cream);o.rotation_euler.y=s*(-.8+t*.7)
 ball('Central rosette',(cx,y-.006,z+.01),(.014,.008,.021),cream)
def knob(x,y,z):ball('Brass knob',(x,y-.015,z),(.011,.010,.011),brass)
def drawer(x,y,z,w,h):
 panel(x,y,z,w,h);knob(x,y-.016,z)
def cabinet(name,w,d,h,doors=3,drawers=True):
 box(name+' carcass',(0,0,h/2),(w-.04,d-.035,h-.08),cream,.018)
 box('Overhanging top',(0,0,h-.027),(w,d,.054),cream,.012);box('Stepped plinth',(0,0,.075),(w-.015,d,.08),cream,.012)
 doorh=h-(.31 if drawers else .23);zc=.14+doorh/2
 for i in range(doors):
  x=-w/2+(i+.5)*w/doors;panel(x,-d/2-.007,zc,w/doors-.047,doorh);knob(x+min(.07,w/doors*.15),-d/2-.024,zc+.025)
  if drawers:drawer(x,-d/2-.009,h-.135,w/doors-.045,.105)
 for x in [-w/2+.045,w/2-.045]:
  box('Fluted corner stile',(x,-d/2-.014,h/2),(.045,.04,h-.16),cream,.006)
  for dx in [-.011,0,.011]:tube('Fine stile flute',[(x+dx,-d/2-.036,.18),(x+dx,-d/2-.036,h-.19)],.0015,wood)
 for x in [-w/2+.08,w/2-.08]:
  for y in [-d/2+.06,d/2-.06]:turned('Turned bun foot',x,y,0,.055,.024)
 # Side panels are modelled as well as the presentation face.
 for s in [-1,1]:
  box('Side inset panel',(s*(w/2-.017),0,h*.48),(.012,d-.10,h-.27),cream,.012)
def vase(x,y,z,scale=1):
 # Revolved ceramic silhouette, followed by individually layered flower petals.
 profile=[(0,.045),(.018,.06),(.07,.068),(.13,.046),(.17,.027),(.19,.035)];vs=[];fs=[]
 for zz,rr in profile:
  for i in range(48):a=i*2*pi/48;vs.append((x+rr*cos(a)*scale,y+rr*sin(a)*scale,z+zz*scale))
 for j in range(len(profile)-1):
  for i in range(48):a=j*48+i;b=j*48+(i+1)%48;fs.append((a,b,b+48,a+48))
 mesh('Ceramic flower vase',vs,fs,ceramic)
 for j in range(7):
  a=j*2.4;xx=x+cos(a)*.085*scale;yy=y+sin(a)*.085*scale;zz=z+(.31+.025*(j%3))*scale;tube('Flower stem',[(x,y,z+.14*scale),(xx,yy,zz)],.0019*scale,sage)
  for k in range(12):
   aa=k*2.4;rad=.009*(k/12);o=ball('Layered rose petal',(xx+cos(aa)*rad*scale,yy+sin(aa)*rad*scale,zz+.001*k*scale),(.015*scale,.009*scale,.006*scale),blush if j%3 else linen);o.rotation_euler.z=aa
def lamp(x,y,z):
 cylinder('Lamp brass foot',x,y,z+.012,.07,.024,brass);tube('Lamp stem',[(x,y,z+.02),(x,y,z+.22)],.009,brass)
 vs=[];fs=[]
 for j in range(2):
  for i in range(96):a=i*2*pi/96;rr=(.115 if j==0 else .065)+.0018*(i%2);vs.append((x+rr*cos(a),y+rr*sin(a),z+.21+j*.18))
 for i in range(96):fs.append((i,(i+1)%96,(i+1)%96+96,i+96))
 mesh('Pleated linen lamp shade',vs,fs,linen)
def picture(x,y,z,w=.15,h=.20):
 panel(x,y,z+h/2,w,h,cream);box('Framed botanical print',(x,y-.022,z+h/2),(w-.025,.004,h-.025),floral,.001)
def leg(x,y,h):
 pts=[]
 for i in range(50):t=i/49;pts.append((x+math.copysign(.026*sin(t*pi),x),y+math.copysign(.024*sin(t*pi),y),.012+t*(h-.012)))
 tube('French cabriole leg',pts,.018,cream);ball('Carved leg knee',(x,y,h*.85),(.026,.024,.045),cream)
def roundtable(d=.8,h=.42):
 cylinder('Round carved top',0,0,h-.021,d/2,.042,cream);cylinder('Tabletop lower bead',0,0,h-.05,d/2-.015,.022,cream)
 turned('Turned pedestal',0,0,.07,h-.13,.060)
 for a in range(4):
  pts=[]
  for i in range(40):t=i/39;rr=.035+t*d*.35;pts.append((cos(a*pi/2)*rr,sin(a*pi/2)*rr,.12*(1-t)+.017))
  tube('Carved pedestal foot',pts,.023,cream)
 for a in range(16):
  angle=a*2*pi/16;ball('Apron rosette',(cos(angle)*(d/2-.014),sin(angle)*(d/2-.014),h-.051),(.010,.010,.011),cream)
# 1: Entry console, 120 x 35 x 85 cm.
b,c=begin('01 Entry console');cabinet('Entry console',1.20,.35,.85,3);ornament(0,-.186,.70,.23,.08);vase(.28,0,.85);lamp(-.36,.01,.85);picture(-.12,.035,.85)
end(b,c,'01-entry-console','玄关柜','120 × 35 × 85')
# 2: Carved round coffee table.
b,c=begin('02 Coffee table');roundtable();vase(.12,.04,.42,.65);cylinder('Brass candle dish',-.14,-.05,.43,.06,.014,brass);cylinder('Pillar candle',-.14,-.05,.475,.022,.075,wax)
end(b,c,'02-coffee-table','雕花圆茶几','直径 80，高 42')
# 3: Fireplace, carved jambs, layered mantel, actual open firebox.
b,c=begin('03 Fireplace');box('Fireplace rear',(0,.13,.46),(1.14,.055,.83),black,.005);box('Stone hearth',(0,0,.035),(1.4,.35,.07),marble,.01)
for x in [-.59,.59]:
 box('Mantel upright',(x,0,.47),(.20,.30,.88),cream,.016);panel(x,-.161,.46,.13,.69);ornament(x,-.177,.74,.15,.12)
box('Mantel carved frieze',(0,0,.88),(1.30,.31,.16),cream,.012);ornament(0,-.17,.875,.46,.10)
for z,w,d,h in [(.978,1.4,.35,.044),(.944,1.36,.33,.025)]:box('Layered mantel shelf',(0,0,z),(w,d,h),cream,.01)
for i in range(5):
 x=-.30+i*.145;h=.11+(i%3)*.045;cylinder('Hearth candle',x,-.025,.07+h/2,.031,h,wax);tube('Candle wick',[(x,-.025,.07+h),(x,-.025,.079+h)],.0014,black)
vase(-.42,.01,1.0,.8);picture(.30,.055,1.0,.25,.32)
end(b,c,'03-fireplace','法式壁炉柜','140 × 35 × 100')
# 4: Pale ash dining table.
b,c=begin('04 Dining table');box('Pale ash table top',(0,0,.723),(1.6,.85,.054),wood,.022)
for x in [-.68,.68]:
 for y in [-.31,.31]:leg(x,y,.695)
for y in [-.35,.35]:box('Carved table apron',(0,y,.647),(1.42,.045,.09),cream,.01)
ornament(0,-.379,.65,.33,.07);vase(0,0,.75,.8)
for x in [-.49,.49]:
 cylinder('Porcelain place setting',x,-.04,.758,.115,.012,ceramic);cylinder('Plate rim',x,-.04,.766,.102,.005,ceramic)
 for dx in [-.145,.145]:tube('Brass cutlery',[(x+dx,-.15,.758),(x+dx,.03,.758)],.003,brass)
end(b,c,'04-dining-table','餐桌','160 × 85 × 75')
# 5: Island with separately modelled sink opening and a curved brass faucet.
b,c=begin('05 Kitchen island');cabinet('Island cabinet',1.76,.76,.87,3)
box('Stone top left',(-.565,0,.895),(.67,.8,.05),marble,.008);box('Stone top right',(.565,0,.895),(.67,.8,.05),marble,.008)
for y in [-.295,.295]:box('Stone top sink surround',(0,y,.895),(.46,.21,.05),marble,.008)
box('Sink base',(0,0,.75),(.445,.37,.035),ceramic,.014)
for x in [-.217,.217]:box('Sink side wall',(x,0,.822),(.018,.37,.14),ceramic,.006)
for y in [-.18,.18]:box('Sink side wall',(0,y,.822),(.445,.018,.14),ceramic,.006)
tube('Swan neck brass tap',[(0,.28,.92),(0,.28,1.10)]+[(0,.17+.11*cos(i*pi/40),1.10+.11*sin(i*pi/40)) for i in range(41)],.009,brass)
for x in [-.11,.11]:cylinder('Brass tap control',x,.28,.94,.013,.04,brass)
vase(.60,.09,.92,.75)
end(b,c,'05-kitchen-island','厨房岛台','180 × 80 × 92（龙头另计）')
# 6: Bedside table with three individual drawers.
b,c=begin('06 Bedside');box('Bedside carcass',(0,0,.29),(.46,.37,.48),cream,.015);box('Bedside top',(0,0,.528),(.50,.40,.044),cream,.012)
for z in [.17,.30,.43]:drawer(0,-.195,z,.41,.105)
for x in [-.19,.19]:
 for y in [-.14,.14]:turned('Bedside foot',x,y,0,.075,.018)
lamp(-.07,.02,.55);picture(.13,.045,.55,.12,.16)
end(b,c,'06-bedside','三抽床头柜','50 × 40 × 55')
# 7: Four-door wardrobe, panel borders and cornice relief.
b,c=begin('07 Wardrobe');cabinet('Wardrobe',1.8,.60,2.34,4,False);box('Wardrobe crown',(0,0,2.375),(1.8,.60,.05),cream,.012)
for i in range(4):
 x=-.9+(i+.5)*.45;tube('Long brass door pull',[(x+.075,-.335,.97),(x+.075,-.335,1.10)],.005,brass)
ornament(0,-.324,2.28,.43,.09)
end(b,c,'07-wardrobe','四门法式衣柜','180 × 60 × 240')
# 8: Desk with real drawers and curved legs.
b,c=begin('08 Desk');box('Ash writing surface',(0,0,.725),(1.4,.60,.05),wood,.015)
for x in [-.59,.59]:
 for y in [-.21,.21]:leg(x,y,.70)
for x in [-.45,0,.45]:drawer(x,-.28,.635,.40,.105)
lamp(-.48,.05,.75);picture(.41,.06,.75,.16,.21);box('Notebook',(0,-.04,.76),(.23,.17,.016),sage,.005)
end(b,c,'08-desk','法式书桌','140 × 60 × 75')
# 9: Conservatory cafe set with curled painted-metal chair backs.
b,c=begin('09 Cafe set');roundtable(.75,.75);vase(0,0,.75,.7)
for sx,rot in [(-.69,-pi/2),(.69,pi/2)]:
 before=set(bpy.data.objects)
 for x in [-.17,.17]:
  for y in [-.17,.17]:leg(x,y,.42)
 cushion('Cafe linen cushion',0,0,.445,.43,.43,.07)
 for sign in [-1,1]:tube('Scroll chair back',[(sign*(.13+.045*cos(t*2*pi/80)),.19,.61+.18*sin(t*pi/80)) for t in range(81)],.008,cream)
 for x in [-.18,.18]:tube('Cafe back upright',[(x,.18,.41),(x,.19,.73)],.009,cream)
 parent=bpy.data.objects.new('Cafe chair placement',None);bpy.context.collection.objects.link(parent)
 for ob in set(bpy.data.objects)-before-{parent}:ob.parent=parent
 parent.location.x=sx;parent.rotation_euler.z=rot
end(b,c,'09-cafe-set','阳台／温室桌椅','圆桌直径 75，高 75')
# 10: Vanity with bowl sink and ornate oval mirror.
b,c=begin('10 Bathroom vanity');cabinet('Vanity',1,.55,.80,2)
box('Vanity stone top',(0,0,.825),(1,.55,.05),marble,.012)
# Thin-walled open bowl; the inner surface and lip are distinct geometry.
vs=[];fs=[]
for j in range(18):
 t=j/17;rad=.075+.145*t;zz=.852+.07*t*t
 for i in range(80):a=i*2*pi/80;vs.append((rad*cos(a),rad*.65*sin(a)-.035,zz))
for j in range(17):
 for i in range(80):a=j*80+i;bb=j*80+(i+1)%80;fs.append((a,bb,bb+80,a+80))
ob=mesh('Glazed oval basin',vs,fs,ceramic);mod=ob.modifiers.new('Ceramic thickness','SOLIDIFY');mod.thickness=.007
cylinder('Sink drain',0,-.035,.852,.026,.008,brass)
tube('Vanity curved tap',[(.26,.13,.85),(.26,.13,1.06),(.22,.13,1.08),(.18,.13,1.06)],.008,brass)
for rr,mm in [(.021,cream),(.004,brass)]:tube('Oval mirror carved frame',[(.28*cos(i*2*pi/140),.19,1.40+.37*sin(i*2*pi/140)) for i in range(140)],rr,mm,True)
ball('Mirror glass',(0,.195,1.40),(.268,.008,.357),mirror);ornament(0,.16,1.78,.22,.08);vase(-.34,.06,.85,.6)
end(b,c,'10-bathroom-vanity','浴室柜与镜子','柜体 100 × 55 × 85（台盆、镜子另计）')
# Studio and automatic fit: use each furniture collection's evaluated bounds.
stage=mat('Warm studio sweep',(.73,.70,.64),.88);box('Studio ground',(0,0,-.055),(200,200,.1),stage,0)
def area(name,loc,energy,size):
 d=bpy.data.lights.new(name,'AREA');d.energy=energy;d.shape='DISK';d.size=size;o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector((0,0,.6))-o.location).to_track_quat('-Z','Y').to_euler()
area('Large window',(-3,-4,5),400,3);area('Soft fill',(3,-1,3),100,3);area('Rim',(0,3,4),190,3)
S.world.use_nodes=True;S.world.node_tree.nodes.get('Background').inputs[1].default_value=.22;S.render.engine='CYCLES';S.cycles.samples=32;S.cycles.use_denoising=True;S.render.resolution_x=1200;S.render.resolution_y=1000;S.render.resolution_percentage=100;S.view_settings.view_transform='AgX';S.render.image_settings.file_format='PNG'
data=bpy.data.cameras.new('Product camera');data.lens=55;camera=bpy.data.objects.new('Product camera',data);bpy.context.collection.objects.link(camera);S.camera=camera
def fit(col):
 bpy.context.view_layer.update();points=[o.matrix_world@Vector(v) for o in col.objects if o.type in ['MESH','CURVE'] for v in o.bound_box];lo=Vector(tuple(min(p[i] for p in points) for i in range(3)));hi=Vector(tuple(max(p[i] for p in points) for i in range(3)));center=(lo+hi)/2;span=max(hi.x-lo.x,(hi.z-lo.z)*1.2,(hi.y-lo.y)*1.2);distance=span*2.8;camera.location=center+Vector((.40,-1,.39)).normalized()*distance;camera.rotation_euler=(center-camera.location).to_track_quat('-Z','Y').to_euler()
jobs[0][1].hide_render=False;fit(jobs[0][1]);bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'furniture-suite-two.blend'))
for slug,col,title,dimensions in jobs:
 for _,c,_,_ in jobs:c.hide_render=c!=col
 fit(col);S.render.filepath=os.path.join(OUT,slug+'.png');print('RENDER',slug,flush=True);bpy.ops.render.render(write_still=True)
print('ALL TEN RENDERS COMPLETE',flush=True)
