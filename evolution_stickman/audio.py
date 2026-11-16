import numpy as np, wave
SR=48000; DUR=20.0; N=int(SR*DUR)
rng=np.random.default_rng(7)
music=np.zeros((N,2)); sfx=np.zeros((N,2)); verb_send=np.zeros(N)
def hz(m): return 440*2**((m-69)/12)
NOTE={'C':0,'D':2,'E':4,'F':5,'G':7,'A':9,'B':11}
def m(n): # 'C4'
    return 12*(int(n[-1])+1)+NOTE[n[0]]+(1 if '#' in n else 0)-(1 if 'b' in n[1:-1] else 0)
def add(buf,t,x,gain=1.0,pan=0.0,send=0.0):
    i=int(round(t*SR)); 
    if i>=N: return
    x=x[:N-i]*gain; l=np.sqrt(0.5*(1-pan)); r=np.sqrt(0.5*(1+pan))
    buf[i:i+len(x),0]+=x*l; buf[i:i+len(x),1]+=x*r
    if send: verb_send[i:i+len(x)]+=x*send
def env(n,a=0.003,d=0.4):
    t=np.arange(n)/SR; return np.minimum(1,t/a)*np.exp(-t/d)
def marimba(f,dur=0.6):
    n=int(SR*dur); t=np.arange(n)/SR
    return (np.sin(2*np.pi*f*t)*env(n,0.002,0.32)+0.35*np.sin(2*np.pi*f*3.93*t)*env(n,0.001,0.05)+0.08*np.sin(2*np.pi*f*9.2*t)*env(n,0.001,0.02))
def glock(f,dur=1.6):
    n=int(SR*dur); t=np.arange(n)/SR
    return (np.sin(2*np.pi*f*t)*env(n,0.001,0.6)+0.4*np.sin(2*np.pi*f*2.76*t)*env(n,0.001,0.25)+0.2*np.sin(2*np.pi*f*5.4*t)*env(n,0.001,0.08))
def bass(f,dur=0.45):
    n=int(SR*dur); t=np.arange(n)/SR; ph=2*np.pi*f*t
    x=np.sin(ph)+0.3*np.sin(2*ph)*np.exp(-t/0.06)+0.15*np.sign(np.sin(ph))*np.exp(-t/0.03)
    return x*env(n,0.004,0.22)
def kick():
    n=int(SR*0.35); t=np.arange(n)/SR; f=45+90*np.exp(-t/0.035)
    return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t/0.16)+0.3*rng.standard_normal(n)*np.exp(-t/0.004)
def bp(x,lo,hi):
    X=np.fft.rfft(x); fr=np.fft.rfftfreq(len(x),1/SR); X[(fr<lo)|(fr>hi)]=0; return np.fft.irfft(X,len(x))
def clap():
    n=int(SR*0.25); t=np.arange(n)/SR; nz=bp(rng.standard_normal(n),900,4000)
    e=np.exp(-t/0.06)+sum(np.exp(-np.maximum(0,t-d)/0.006)*(t>=d) for d in (0,0.011,0.022))*0.6
    return nz*e*0.9
def shaker(acc=1.0):
    n=int(SR*0.06); t=np.arange(n)/SR; return bp(rng.standard_normal(n),5000,14000)*np.minimum(1,t/0.01)*np.exp(-t/0.018)*acc
def tick(f=2500,d=0.03):
    n=int(SR*d); t=np.arange(n)/SR; return bp(rng.standard_normal(n),f*0.6,f*1.6)*np.exp(-t/(d/4))
def scratch(dur,rate=16,seed=0):  # pencil on paper
    n=int(SR*dur); t=np.arange(n)/SR; r=np.random.default_rng(seed)
    nz=bp(r.standard_normal(n),1800,9000)
    stroke=0.55+0.45*np.abs(np.sin(np.pi*rate*t+r.uniform(0,3)))  # back-and-forth strokes
    grain=1+0.6*bp(r.standard_normal(n),20,120)/0.05*0.02
    fade=np.minimum(1,t/0.02)*np.minimum(1,(dur-t)/0.04)
    return nz*stroke*np.clip(grain,0.3,2)*fade
def whoosh(dur):
    n=int(SR*dur); t=np.arange(n)/SR; nz=rng.standard_normal(n)
    out=np.zeros(n); seg=2048
    for k in range(0,n,seg):
        u=k/n; c=400+3500*np.sin(np.pi*u)**2
        out[k:k+seg]=bp(nz[k:k+seg],c*0.6,c*1.5)
    sh=np.sin(np.pi*t/dur)**2.2
    return out*sh
def blip(f0,f1,dur):
    n=int(SR*dur); t=np.arange(n)/SR; f=f0*(f1/f0)**(t/dur)
    return np.sin(2*np.pi*np.cumsum(f)/SR)*env(n,0.003,dur/2.5)
def slide(f0,f1,dur):
    n=int(SR*dur); t=np.arange(n)/SR; u=t/dur; f=f0*(f1/f0)**(u**0.8)*(1+0.012*np.sin(2*np.pi*6*t))
    x=np.sin(2*np.pi*np.cumsum(f)/SR); x+=0.15*bp(rng.standard_normal(n),f0*0.5,f0*3)
    return x*np.minimum(1,t/0.04)*np.minimum(1,(dur-t)/0.08)
def thump():
    n=int(SR*0.2); t=np.arange(n)/SR; return np.sin(2*np.pi*np.cumsum(90+60*np.exp(-t/0.02))/SR)*np.exp(-t/0.07)+0.4*bp(rng.standard_normal(n),200,1200)*np.exp(-t/0.02)
def clack():
    n=int(SR*0.12); t=np.arange(n)/SR; r=bp(rng.standard_normal(n),1500,6000)*np.exp(-t/0.012)
    return r+0.5*np.sin(2*np.pi*2300*t)*np.exp(-t/0.02)+0.4*np.sin(2*np.pi*3400*t)*np.exp(-t/0.015)

BEAT=0.625; E=BEAT/2; T0=2.0
TT=[4.5,7.0,9.5,12.0,14.5]
chords=[['C','E','G','C'],['D','F','A','D'],['E','G','B','E'],['F','A','C','F'],['G','B','D','G'],['A','C','E','A']]
roots=['C3','D3','E3','F3','G3','A3']
# ---------- MUSIC ----------
# intro: soft glock while title is written, pickup notes into downbeat
for t,n in [(0.15,'C5'),(0.45,'E5'),(0.75,'G5')]: add(music,t,glock(hz(m(n))),0.18,0.3,0.3)
for t,n in [(T0-2*E,'G4'),(T0-E,'B4')]: add(music,t,marimba(hz(m(n))),0.32,-0.2,0.25)
pat=[0,2,1,2,3,2,1,2]
for b in range(6):
    tb=T0+b*4*BEAT; ch=chords[b]
    tones=[m(ch[0]+'4'),m(ch[1]+'4'),m(ch[2]+'4'),m(ch[3]+'5')]
    tones=[x if x>=m(ch[0]+'4') else x+12 for x in tones]
    for k in range(8):
        add(music,tb+k*E,marimba(hz(tones[pat[k]])),0.30 if k%2==0 else 0.22,0.25 if k%2 else -0.15,0.25)
    # bass
    r=m(roots[b])
    for off,iv in [(0,0),(1.5,0),(2,7),(3.5,12)]: add(music,tb+off*BEAT,bass(hz(r+iv-12)),0.5)
    # drums
    for k in range(4):
        if k in (0,2): add(music,tb+k*BEAT,kick(),0.75)
        if k in (1,3): add(music,tb+k*BEAT,clap(),0.32,0.1,0.15)
    add(music,tb+3.5*BEAT,kick(),0.45)
    for k in range(16): add(music,tb+k*BEAT/4,shaker(1.0 if k%2==0 else 0.55),0.12,0.4)
    # rising glock on each downbeat = evolutionary step
    add(music,tb,glock(hz(m(['C5','D5','E5','F5','G5','A5'][b]))),0.30,0.0,0.4)
    add(music,tb+2*BEAT,glock(hz(m(['C5','D5','E5','F5','G5','A5'][b])+7)),0.12,0.2,0.4)
# final bar: F chord on 17.0, then question
tb=17.0
for k,n in enumerate(['F4','A4','C5']): add(music,tb+k*0.03,marimba(hz(m(n)),1.0),0.25,-0.2+0.2*k,0.35)
add(music,tb,bass(hz(m('F2')),0.8),0.5); add(music,tb,kick(),0.6)
for k in range(2): add(music,tb+k*BEAT/2,shaker(0.7),0.08,0.4)
# stinger G7 on the question mark
QH=18.75
add(music,QH,kick(),0.85); add(music,QH,bass(hz(m('G2')),1.2),0.6)
for k,n in enumerate(['G4','B4','D5','F5']): add(music,QH+k*0.012,marimba(hz(m(n)),1.2),0.28,-0.3+0.2*k,0.4)
add(music,QH,glock(hz(m('B5')),2.0),0.3,0.1,0.5); add(music,QH+0.16,glock(hz(m('F6')),1.8),0.14,0.3,0.5)
# ---------- SFX ----------
# title being written: one pencil stroke per letter
for k in range(8): add(sfx,0.12+k*0.1125,scratch(0.105,22,k),0.16,-0.2+0.05*k)
add(sfx,1.0,scratch(0.22,14,11),0.16,0.1)          # underline
add(sfx,1.05,whoosh(0.95),0.55)                   # camera whip
add(sfx,1.7,blip(500,180,0.25),0.06)
# footsteps: soft taps on every 8th while walking
for k in range(int((16.6-2)/E)+1):
    t=2+k*E
    if any(T-0.3<=t<=T+0.2 for T in TT): continue
    add(sfx,t,tick(900+300*(k%2),0.04),0.05,-0.1 if k%2 else 0.1)
for i,T in enumerate(TT):
    add(sfx,T-0.3,blip(320,820,0.16),0.10,0,0.1)       # jump
    add(sfx,T-0.16,scratch(0.42,26,20+i),0.20,0.0,0.15) # scribble transformation
    add(sfx,T,blip(900,1400,0.07),0.12,0.15,0.2)       # pop
    add(sfx,T+0.2,thump(),0.35)                        # landing
LAND=[2.0]+[T+0.2 for T in TT]; names=[6,13,14,20,16,19]
for i,tl in enumerate(LAND):
    for k in range(0,names[i],2): add(sfx,tl+k*0.028,tick(3000,0.02),0.035,0.3)
    add(sfx,tl+names[i]*0.028+0.05,scratch(0.25,12,40+i),0.045,0.3)
    add(sfx,tl+0.35,scratch(0.35,30,50+i),0.025,0.35)
for t in (8.25,8.875): add(sfx,t,clack(),0.45,0.1,0.2)
# torch crackle
n=int(SR*2.6); tt=np.arange(n)/SR; cr=np.zeros(n)
r2=np.random.default_rng(3)
for _ in range(70):
    p=r2.integers(0,n-2000); cr[p:p+1500]+=bp(r2.standard_normal(1500),1500,7000)*np.exp(-np.arange(1500)/120)*r2.uniform(0.3,1)
cr+=0.25*bp(r2.standard_normal(n),200,900)
cr*=np.minimum(1,tt/0.2)*np.minimum(1,(2.6-tt)/0.3)
add(sfx,9.45,cr,0.10,0.2)
# coffee steam: none. phone: ping + buzz
add(sfx,17.2,glock(1568,0.7),0.20,0.2,0.2); add(sfx,17.32,glock(2093,0.8),0.18,0.2,0.2)
n=int(SR*0.45); tt=np.arange(n)/SR; bz=np.sign(np.sin(2*np.pi*155*tt))*0.5*(0.5+0.5*np.sign(np.sin(2*np.pi*9*tt)))
add(sfx,17.22,bp(bz,100,1200)*np.minimum(1,(0.45-tt)/0.05),0.10,0.2)
add(sfx,17.45,slide(1100,330,1.2),0.12,0.0,0.3)    # hunching back down
add(sfx,18.55,scratch(0.18,18,77),0.22,0.4)         # question mark hook
add(sfx,18.74,tick(1800,0.05),0.25,0.4)             # dot
# ---------- MIX ----------
ir_n=int(SR*1.1); t=np.arange(ir_n)/SR
ir=rng.standard_normal((ir_n,2))*np.exp(-t/0.28)[:,None]; ir[:int(SR*0.012)]=0
def conv(x,h):
    L=len(x)+len(h); F=1<<int(np.ceil(np.log2(L)))
    return np.fft.irfft(np.fft.rfft(x,F)*np.fft.rfft(h,F),F)[:len(x)]
verb=np.stack([conv(verb_send,ir[:,0]),conv(verb_send,ir[:,1])],1)*0.08
mix=music*0.5+sfx*0.75+verb*0.6
# gentle fade tail to 20s
tt=np.arange(N)/SR; mix*=np.where(tt>19.4,np.clip((20-tt)/0.6,0,1)**1.5,1)[:,None]
pk=np.max(np.abs(mix)); mix=np.where(np.abs(mix)>0.6*pk, np.sign(mix)*(0.6*pk+0.4*pk*np.tanh((np.abs(mix)-0.6*pk)/(0.4*pk))), mix)
mix/=np.max(np.abs(mix))/0.89
pcm=(mix*32767).astype('<i2')
with wave.open('src/audio.wav','wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
for name,b in (('music',music),('sfx',sfx)):
    print(name,'rms',np.sqrt((b**2).mean()).round(4),'peak',np.abs(b).max().round(3))
print('done',pcm.shape)
