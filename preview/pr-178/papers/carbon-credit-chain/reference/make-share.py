import json
from PIL import Image, ImageDraw, ImageFont
F='/home/claude/fonts/'
def font(name, size, w=None):
    f = ImageFont.truetype(F+name, size)
    if w is not None:
        try: f.set_variation_by_axes([w])
        except Exception as e: print(e)
    return f
BG='#060d1f'; TX='#e0eafc'; AC='#22d3ee'; PR='#60a5fa'; MU='#6b8fc4'
W,H=1200,630
im=Image.new('RGB',(W,H),BG); d=ImageDraw.Draw(im)
d.text((60,58),'INTERACTIVE PAPER · ARXIV 2021',font=font('IBMPlexMono-Regular.ttf',20),fill=AC)
tf=font('Orbitron%5Bwght%5D.ttf',52,800)
y=100
for line in ['CARBON CREDITS','ON A SHARED','LEDGER']:
    d.text((60,y),line,font=tf,fill=TX); y+=64
sf=font('Exo2%5Bwght%5D.ttf',25,500)
y+=14
for line in ['Verify, mint, trade in a 0.3% pool,','and burn a ton of CO₂, in your browser']:
    d.text((60,y),line,font=sf,fill=MU); y+=34
bf=font('Exo2%5Bwght%5D.ttf',24,600)
d.text((60,H-118),'Soheil Saraji and Mike Borowczak',font=bf,fill=TX)
d.text((60,H-78),'thedracolab.com/papers',font=font('IBMPlexMono-Regular.ttf',22),fill=AC)
# right panel: cost of buying n tokens, pool vs 5% broker
data=json.load(open('/home/claude/card/data.json'))
x0,y0,x1,y1=700,90,1150,470
mf=font('IBMPlexMono-Regular.ttf',16)
nmax=650; cmax=26000
sx=lambda n: x0+(x1-x0)*n/nmax
sy=lambda c: y1-(y1-y0)*c/cmax
for c in range(0,26001,5000):
    d.line([(x0,sy(c)),(x1,sy(c))],fill='#16213d',width=1)
    d.text((x0-10,sy(c)-9),f'{c//1000}k',font=mf,fill=MU,anchor='ra')
for n in range(0,651,200):
    d.text((sx(n),y1+10),str(n),font=mf,fill=MU,anchor='ma')
d.line([(sx(0),sy(0)),(sx(650),sy(650*25*1.05))],fill=MU,width=3)
pts=[(sx(n),sy(c)) for n,c in data['pts']]
d.line(pts,fill=AC,width=4)
cross=90
d.ellipse([sx(cross)-6,sy(cross*26.25)-6,sx(cross)+6,sy(cross*26.25)+6],outline=TX,width=2)
d.text((sx(cross)+12,sy(cross*26.25)+4),'equal cost at 90 tokens',font=mf,fill=TX)
d.text((x0,y0-40),'DAI to buy n carbon tokens',font=font('IBMPlexMono-Regular.ttf',18),fill=TX)
d.text((sx(220),sy(19500)),'pool, 0.3% fee',font=mf,fill=AC)
d.text((sx(470),sy(470*26.25)+10),'broker, 5%',font=mf,fill=MU)
d.text((x0,y1+38),'tokens bought (page\'s pool: 50,000 DAI / 2,000 tokens)',font=font('IBMPlexMono-Regular.ttf',14),fill=MU)
im.save('/home/claude/draco-website/papers/carbon-credit-chain/share.png',optimize=True)
