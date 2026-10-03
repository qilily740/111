import struct, sys, zlib
from collections import deque

def paeth(a,b,c):
    p=a+b-c; pa=abs(p-a); pb=abs(p-b); pc=abs(p-c)
    return a if pa<=pb and pa<=pc else b if pb<=pc else c

def read_png(path):
    b=open(path,'rb').read(); pos=8; idat=b''; w=h=ct=None
    while pos<len(b):
        n=struct.unpack('>I',b[pos:pos+4])[0]; t=b[pos+4:pos+8]; d=b[pos+8:pos+8+n]; pos+=12+n
        if t==b'IHDR': w,h,depth,ct,_,_,inter=struct.unpack('>IIBBBBB',d)
        elif t==b'IDAT': idat+=d
        elif t==b'IEND': break
    if depth!=8 or ct!=2 or inter!=0: raise ValueError('expected RGB PNG')
    raw=zlib.decompress(idat); stride=w*3; rows=[]; prev=bytearray(stride); off=0
    for _ in range(h):
        f=raw[off]; off+=1; row=bytearray(raw[off:off+stride]); off+=stride
        for i in range(stride):
            a=row[i-3] if i>=3 else 0; u=prev[i]; ul=prev[i-3] if i>=3 else 0
            if f==1: row[i]=(row[i]+a)&255
            elif f==2: row[i]=(row[i]+u)&255
            elif f==3: row[i]=(row[i]+((a+u)//2))&255
            elif f==4: row[i]=(row[i]+paeth(a,u,ul))&255
            elif f!=0: raise ValueError('unsupported filter')
        rows.append(row); prev=row
    return w,h,rows

def write_png(path,w,h,rows):
    raw=bytearray()
    for row in rows: raw.append(0); raw.extend(row)
    def ch(t,d): return struct.pack('>I',len(d))+t+d+struct.pack('>I',zlib.crc32(t+d)&0xffffffff)
    ihdr=struct.pack('>IIBBBBB',w,h,8,6,0,0,0)
    open(path,'wb').write(b'\x89PNG\r\n\x1a\n'+ch(b'IHDR',ihdr)+ch(b'IDAT',zlib.compress(bytes(raw),9))+ch(b'IEND',b''))

def pix(rows,w,idx):
    x=idx%w; y=idx//w; i=x*3; return rows[y][i:i+3]

def d(a,b): return sum(abs(int(a[i])-int(b[i])) for i in range(3))/3.0

def process(src,dst):
    w,h,rows=read_png(src); n=w*h; fg=bytearray(n)
    # Identify the repeating 16 px checkerboard, rejecting irregular background artifacts.
    for y in range(32,h-32):
        row=rows[y]
        for x in range(32,w-32):
            i=y*w+x; rgb=row[x*3:x*3+3]
            same=max(d(rgb,rows[y][(x+32)*3:(x+32)*3+3]), d(rgb,rows[y+32][x*3:x*3+3]))
            opp=min(d(rgb,rows[y][(x+16)*3:(x+16)*3+3]), d(rgb,rows[y+16][x*3:x*3+3]))
            if not (same < 18 and opp > 25 and max(rgb)-min(rgb) < 14): fg[i]=1
    # Keep the outer border only when it is clearly non-background colored content.
    for y in list(range(32))+list(range(h-32,h)):
        for x in range(w):
            i=y*w+x; rgb=pix(rows,w,i)
            if max(rgb)-min(rgb)>24: fg[i]=1
    for y in range(32,h-32):
        for x in list(range(32))+list(range(w-32,w)):
            i=y*w+x; rgb=pix(rows,w,i)
            if max(rgb)-min(rgb)>24: fg[i]=1

    seen=bytearray(n); comps=[]; largest=[]
    for start in range(n):
        if not fg[start] or seen[start]: continue
        seen[start]=1; q=[start]; comp=[]; saturated=False
        while q:
            cur=q.pop(); comp.append(cur); rgb=pix(rows,w,cur)
            if max(rgb)-min(rgb)>24: saturated=True
            x=cur%w; y=cur//w
            for nx,ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1),(x-1,y-1),(x+1,y-1),(x-1,y+1),(x+1,y+1)):
                if 0<=nx<w and 0<=ny<h:
                    ni=ny*w+nx
                    if fg[ni] and not seen[ni]: seen[ni]=1; q.append(ni)
        comps.append((comp,saturated))
        if len(comp)>len(largest): largest=comp
    keep=bytearray(n)
    for idx in largest: keep[idx]=1
    largest_set=set(largest)
    # Preserve colored floating petals/ribbons and small low-saturation pieces touching the subject.
    for comp,saturated in comps:
        if comp is largest: continue
        if saturated:
            for idx in comp: keep[idx]=1
            continue
        near=False
        for idx in comp:
            x=idx%w; y=idx//w
            for yy in range(max(0,y-3),min(h,y+4)):
                for xx in range(max(0,x-3),min(w,x+4)):
                    if yy*w+xx in largest_set: near=True; break
                if near: break
            if near: break
        if near:
            for idx in comp: keep[idx]=1
    out=[]
    for y,row in enumerate(rows):
        o=bytearray()
        for x in range(w):
            i=y*w+x; rgb=row[x*3:x*3+3]; o.extend(rgb); o.append(255 if keep[i] else 0)
        out.append(o)
    write_png(dst,w,h,out)

if __name__=='__main__': process(sys.argv[1],sys.argv[2])
