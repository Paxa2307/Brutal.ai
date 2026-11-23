import sys,glob
from PIL import Image,ImageDraw
fs=sorted(glob.glob(sys.argv[1]+'/*.jpg'),key=lambda f:float(f.split('/t')[-1][:-4]))
cols=int(sys.argv[3]) if len(sys.argv)>3 else 8; cw=270; ch=480
rows=(len(fs)+cols-1)//cols
S=Image.new('RGB',(cols*cw,rows*ch))
for i,f in enumerate(fs):
    im=Image.open(f).resize((cw,ch)); d=ImageDraw.Draw(im); d.text((6,6),f.split('/t')[-1][:-4],fill=(255,0,0))
    S.paste(im,((i%cols)*cw,(i//cols)*ch))
S.save(sys.argv[2],quality=88)
