"""Video 02 mix: processed voice + accent-word echo + score (music.wav) + SFX.
Usage: python3 audio2.py <build_dir> <duration>"""
import json, subprocess, sys, wave
import numpy as np
from scipy import signal
SR = 48000; B = sys.argv[1]; DUR = float(sys.argv[2]); N = int(DUR * SR)
rng = np.random.default_rng(3)

def ff(x, af, ch=1):
    p = subprocess.run(['ffmpeg','-loglevel','error','-f','f32le','-ar',str(SR),'-ac',str(ch),'-i','-','-af',af,
                        '-f','f32le','-ar',str(SR),'-ac',str(ch),'-'], input=x.astype(np.float32).tobytes(), capture_output=True, check=True)
    return np.frombuffer(p.stdout, np.float32).copy()
def sosf(kind, f, o=2):
    w = [f[0]/(SR/2), f[1]/(SR/2)] if kind == 'band' else f/(SR/2)
    return signal.butter(o, w, kind, output='sos')
lp = lambda x,f: signal.sosfilt(sosf('low',f), x)
hp = lambda x,f: signal.sosfilt(sosf('high',f), x)
bp = lambda x,a,b: signal.sosfilt(sosf('band',(a,b)), x)
def place(buf, x, t, g=1.0):
    i = int(t*SR)
    if i < 0 or i >= len(buf): return
    n = min(len(x), len(buf)-i)
    if buf.ndim == 2 and x.ndim == 1: buf[i:i+n] += (x[:n]*g)[:,None]
    else: buf[i:i+n] += x[:n]*g
def rd(path):
    w = wave.open(path); x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32)/32768
    return x.reshape(-1, w.getnchannels())

# ---------------- voice
v = np.fromfile(f'{B}/voice_cut.f32', np.float32)
v = ff(v, 'highpass=f=75,equalizer=f=170:t=q:w=1:g=1.5,equalizer=f=400:t=q:w=1.2:g=-2,equalizer=f=3300:t=q:w=1.2:g=3,'
          'equalizer=f=9500:t=h:w=1:g=1.5,deesser=i=0.35,acompressor=threshold=-22dB:ratio=4:attack=4:release=80:makeup=5,alimiter=limit=0.89')
V = np.zeros(N); V[:min(N,len(v))] = v[:N]

# accent words: lift the word by ~1.5 dB, then echo + boom (like the reference)
_caps0 = json.load(open(f'{B}/captions.json'))
for _w in [w for ch in _caps0 for w in ch['w'] if w['acc']]:
    i0, i1 = int(_w['s']*SR), int((_w['e']+0.05)*SR)
    f = int(0.02*SR); g = np.full(i1-i0, 1.19); g[:f] = np.linspace(1, 1.19, f); g[-f:] = np.linspace(1.19, 1, f)
    V[i0:i1] *= g
caps = json.load(open(f'{B}/captions.json'))
acc = [w for ch in caps for w in ch['w'] if w['acc']]
words = [w for ch in caps for w in ch['w']]
E = np.zeros((N,2))
for w in acc:
    s, e = w['s'], w['e']
    nxt = min([x['s'] for x in words if x['s'] > s + 0.05], default=DUR)
    seg = V[int(s*SR):int((e+0.05)*SR)].copy()
    seg = hp(seg, 250)
    tail_end = min(nxt + 0.25, e + 0.9)
    for k, (d, g, pan) in enumerate([(0.06,0.26,-0.6),(0.19,0.15,0.6),(0.32,0.08,0)]):
        x = lp(seg, 6000 - k*900) * g
        L = np.cos((pan+1)*np.pi/4)*1.41; R = np.sin((pan+1)*np.pi/4)*1.41
        t0 = e + d  # echoes start after the word ends, so the word itself stays clean
        n = int(max(0, tail_end - t0) * SR)
        if n <= 0: continue
        x = x[:n]
        if len(x) > 200:
            f = int(0.03*SR); x[-f:] *= np.linspace(1,0,f) if len(x) > f else 1
        place(E, np.stack([x*L, x*R],1), t0)
    # hall reverb burst on the word
    n = int(1.4*SR); t = np.arange(n)/SR
    ir = lp(rng.standard_normal(n), 5000) * np.exp(-t*4)
    rev = signal.oaconvolve(seg, ir)[:int((tail_end - s)*SR)] * 0.007
    if len(rev) > 2000: rev[-2000:] *= np.linspace(1,0,2000)
    place(E, rev, s)
print('accents', [(w['t'], w['s']) for w in acc])

# ---------------- music with sidechain under voice
M = rd(f'{B}/music.wav')[:N]
M = np.pad(M, ((0, N-len(M)), (0,0)))
env = np.abs(V); a = np.exp(-1/(0.01*SR)); env = signal.lfilter([1-a],[1,-a], env)
vmax = np.percentile(env, 99); duck = np.zeros(N); acc_ = 0.0; rel = np.exp(-1/(0.25*SR))**64
for i in range(0, N, 64):
    x = min(1.0, env[i]/vmax*1.8); acc_ = x if x > acc_ else acc_*rel; duck[i:i+64] = acc_
M *= (1 - 0.45*duck)[:,None]
# carve 1–4 kHz from music for intelligibility
M = np.stack([M[:,c] - 0.35*bp(M[:,c], 1200, 4000) for c in range(2)], 1)

# ---------------- SFX
S = np.zeros((N,2))
def whoosh(d=0.3):
    n = int(d*SR); x = rng.standard_normal(n); out = np.zeros(n)
    for c in range(0, n, 1024):
        fc = 400 + 6000*(c/n)**2; seg = bp(x[c:c+1300], fc*0.6, min(fc*1.6, 20000))[:1024]; out[c:c+len(seg)] = seg[:len(out[c:c+1024])]
    return out*np.sin(np.pi*np.arange(n)/n)**1.5
def boom(d=1.4):
    n = int(d*SR); t = np.arange(n)/SR; f = 32+110*np.exp(-t*14)
    return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*3) + hp(rng.standard_normal(n),1500)*np.exp(-t*45)*0.4
def stamp():
    n = int(0.35*SR); t = np.arange(n)/SR
    return lp(rng.standard_normal(n), 2500)*np.exp(-t*30)*0.8 + np.sin(2*np.pi*90*t)*np.exp(-t*20)
def glitch(d=0.15):
    n = int(d*SR); t = np.arange(n)/SR
    x = np.round((signal.square(2*np.pi*rng.uniform(200,900)*t)*0.4 + rng.standard_normal(n)*0.5)*4)/4
    return hp(x*(np.sin(2*np.pi*37*t) > -0.2), 400)*np.exp(-t*12)
def tick():
    n = int(0.04*SR); return bp(rng.standard_normal(n), 3000, 9000)*np.exp(-np.arange(n)/SR*130)
shots = json.load(open(f'{B}/shots.json'))
for k, sh in enumerate(shots):
    t = sh['s']; fx = sh['fx']; ty = ' '.join(sh['types'])
    if k == 0: continue
    if sh['split']: place(S, whoosh(0.15), t-0.05, 0.03); continue
    if fx in ('whip','blur','zoom'): place(S, whoosh(0.35), t-0.15, 0.09)
    elif fx == 'glitch': place(S, glitch(), t, 0.08)
    elif fx in ('flash','gflash'): place(S, whoosh(0.25), t-0.1, 0.07)
    else: place(S, whoosh(0.2), t-0.08, 0.04)
    for a in sh['stamps']: place(S, stamp(), t+a, 0.30); place(S, boom(0.8), t+a, 0.10)
    for a in sh['shake']: place(S, boom(1.0), t+a, 0.12)
    if 'year' in ty or 'slot' in ty or 'num' in ty:
        for j in range(10): place(S, tick(), t+j*0.05, 0.25)
for w in acc: place(S, boom(1.6), w['s'], 0.22)

# ---------------- mix
Vst = np.stack([V,V],1)
mix = Vst*1.0 + E*1.0 + M*0.78 + S*0.9
f = int(0.25*SR); mix[-f:] *= np.linspace(1,0.5,f)[:,None]
out = ff(mix.astype(np.float32).reshape(-1), 'loudnorm=I=-14:TP=-1.0:LRA=7', 2)
pcm = (np.clip(out,-1,1)*32767).astype(np.int16)
with wave.open(f'{B}/mix.wav','wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
for name, x in (('voice', Vst+E), ('music', M*0.78), ('sfx', S*0.9)):
    p = (np.clip(x,-1,1)*32767).astype(np.int16)
    with wave.open(f'{B}/stem_{name}.wav','wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(p.tobytes())
print('mix written')
