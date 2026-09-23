import struct, sys, zlib

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

def pix(rows,x,y):
    i=x*3; r=rows[y]; return r[i:i+3]

def dist(a,b): return sum(abs(int(a[i])-int(b[i])) for i in range(3))/3.0

def process(src,dst):
    w,h,rows=read_png(src); out=[]
    for y,row in enumerate(rows):
        o=bytearray()
        for x in range(w):
            rgb=pix(rows,x,y)
            enough=x>=32 and y>=32 and x+32<w and y+32<h
            if enough:
                same=max(dist(rgb,pix(rows,x+32,y)), dist(rgb,pix(rows,x,y+32)))
                opp=min(dist(rgb,pix(rows,x+16,y)), dist(rgb,pix(rows,x,y+16)))
                # A true checker pixel repeats after 32 px and flips color after 16 px.
                bg = same < 18 and opp > 25 and max(rgb)-min(rgb) < 14
            else:
                bg=False
            o.extend(rgb); o.append(0 if bg else 255)
        out.append(o)
    write_png(dst,w,h,out)

if __name__=='__main__': process(sys.argv[1],sys.argv[2])
