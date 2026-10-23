"""Social card for /papers/virtual-summer-camp/. Data: Table 4 unique views.
Run: python3 -I make-share.py <fonts dir> <output png>"""
import sys
from PIL import Image, ImageDraw, ImageFont
F = sys.argv[1].rstrip('/') + '/'
def font(name, size, w=None):
    f = ImageFont.truetype(F + name, size)
    if w is not None: f.set_variation_by_axes([w])
    return f
BG='#060d1f'; TX='#e0eafc'; AC='#22d3ee'; PR='#60a5fa'; MU='#6b8fc4'; GR='#16213d'
W,H=1200,630
im=Image.new('RGB',(W,H),BG); d=ImageDraw.Draw(im)
mono=lambda s: font('IBMPlexMono-Regular.ttf', s)
d.text((60,58),'INTERACTIVE PAPER · ASEE 2022',font=mono(20),fill=AC)
tf=font('Orbitron%5Bwght%5D.ttf',54,800); y=100
for line in ['CAMP ON','SCREEN']:
    d.text((60,y),line,font=tf,fill=TX); y+=66
sf=font('Exo2%5Bwght%5D.ttf',25,500); y+=16
for line in ['Two virtual summers of a camp\'s','computer science course: who','kept watching, and for how long']:
    d.text((60,y),line,font=sf,fill=MU); y+=34
bf=font('Exo2%5Bwght%5D.ttf',22,600)
d.text((60,H-142),'Mike Borowczak, Andrea C. Borowczak,',font=bf,fill=TX)
d.text((60,H-112),'Shawna M. Wolf, Shaya Wolf, and Hui Hu',font=bf,fill=TX)
d.text((60,H-72),'thedracolab.com/papers',font=mono(22),fill=AC)
U20=[63,25,17,12,5]; U21=[50,34,33,23,25]
x0,y0,x1,y1=650,120,1150,470
sy=lambda v: y1-(y1-y0)*v/70
for v in range(0,71,10):
    d.line([(x0,sy(v)),(x1,sy(v))],fill=GR,width=1)
    d.text((x0-10,sy(v)-9),str(v),font=mono(15),fill=MU,anchor='ra')
gw=(x1-x0)/5; bw=34
for i in range(5):
    gx=x0+gw*i+gw/2
    for side,(vals,col) in enumerate([(U20,MU),(U21,PR)]):
        bx=gx-bw-3 if side==0 else gx+3
        d.rectangle([bx,sy(vals[i]),bx+bw,y1],fill=col)
        d.text((bx+bw/2,sy(vals[i])-6),str(vals[i]),font=mono(15),fill=TX,anchor='md')
    d.text((gx,y1+12),'A%d'%(i+1),font=mono(15),fill=MU,anchor='ma')
d.text((x0,y0-62),'Unique viewers of each camp video',font=mono(18),fill=TX)
d.rectangle([x0,y0-30,x0+14,y0-18],fill=MU); d.text((x0+22,y0-33),'2020',font=mono(16),fill=MU)
d.rectangle([x0+90,y0-30,x0+104,y0-18],fill=PR); d.text((x0+112,y0-33),'2021',font=mono(16),fill=PR)
d.text((x0,y1+40),'Activities 1 to 5 · paper, Table 4',font=mono(14),fill=MU)
im.save(sys.argv[2],optimize=True)
