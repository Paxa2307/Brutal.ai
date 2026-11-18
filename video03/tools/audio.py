"""Voice processing + synthesized score + sound design + mix.

Usage: python3 audio.py <build_dir> <duration>
Reads build/voice_cut.f32 (48k mono) and build/shots.json; writes build/mix.wav
"""
import json
import subprocess
import sys

import numpy as np
from scipy import signal

SR = 48000
B = sys.argv[1]
DUR = float(sys.argv[2])
N = int(DUR * SR)
rng = np.random.default_rng(42)
t_all = np.arange(N) / SR


def ffmpeg_filter(x, af, ch=1):
    p = subprocess.run(['ffmpeg', '-loglevel', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', str(ch), '-i', '-',
                        '-af', af, '-f', 'f32le', '-ar', str(SR), '-ac', str(ch), '-'],
                       input=x.astype(np.float32).tobytes(), capture_output=True, check=True)
    return np.frombuffer(p.stdout, np.float32).copy()


def lp(x, f, order=2):
    b, a = signal.butter(order, f / (SR / 2), 'low')
    return signal.lfilter(b, a, x)


def hp(x, f, order=2):
    b, a = signal.butter(order, f / (SR / 2), 'high')
    return signal.lfilter(b, a, x)


def bp(x, f1, f2, order=2):
    b, a = signal.butter(order, [f1 / (SR / 2), f2 / (SR / 2)], 'band')
    return signal.lfilter(b, a, x)


def env_adsr(n, a, r):
    e = np.ones(n)
    na, nr = int(a * SR), int(r * SR)
    e[:na] = np.linspace(0, 1, na)
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


def place(buf, x, t, gain=1.0):
    i = int(t * SR)
    if i >= len(buf):
        return
    n = min(len(x), len(buf) - i)
    if x.ndim == 1 and buf.ndim == 2:
        buf[i:i + n] += (x[:n] * gain)[:, None]
    else:
        buf[i:i + n] += x[:n] * gain


def mtof(m):
    return 440 * 2 ** ((m - 69) / 12)


# ------------------------------------------------------------------ voice
voice = np.fromfile(f'{B}/voice_cut.f32', np.float32)
voice = ffmpeg_filter(voice,
                      'highpass=f=75,equalizer=f=160:t=q:w=1:g=1.5,equalizer=f=380:t=q:w=1.2:g=-2,'
                      'equalizer=f=3200:t=q:w=1.2:g=2.5,equalizer=f=9000:t=h:w=1:g=1.5,deesser=i=0.35,'
                      'acompressor=threshold=-22dB:ratio=3.5:attack=4:release=90:makeup=4,'
                      'aecho=0.85:0.6:38|67:0.10|0.06,alimiter=limit=0.89')
V = np.zeros(N)
V[:min(N, len(voice))] = voice[:N]

# voice envelope for ducking
venv = np.abs(V)
venv = signal.lfilter([1 - np.exp(-1 / (0.01 * SR))], [1, -np.exp(-1 / (0.01 * SR))], venv)
# slow release
rel = np.exp(-1 / (0.35 * SR))
duck = np.zeros_like(venv)
acc = 0.0
vmax = np.percentile(venv, 99)
for i in range(0, N, 64):  # block-wise for speed
    v = min(1.0, venv[i] / vmax * 1.6)
    acc = v if v > acc else acc * rel ** 64
    duck[i:i + 64] = acc
duck = 1 - 0.38 * duck

# ------------------------------------------------------------------ score (D minor, 80 bpm)
BPM = 80
beat = 60 / BPM
M = np.zeros((N, 2))

# section intensity curve (0..1) — drops after "настоящим" and builds to the finale
def intensity(t):
    pts = [(0, 0.45), (9.4, 0.5), (9.61, 0.75), (29.5, 0.8), (33.8, 0.9), (54.4, 1.0), (54.58, 0.15),
           (56.9, 0.15), (57.04, 0.8), (68.6, 0.8), (74.4, 0.65), (81.4, 0.55), (92.5, 0.85), (95.8, 1.0),
           (103.0, 0.7), (DUR, 0.45)]
    xs, ys = zip(*pts)
    return np.interp(t, xs, ys)

I = intensity(t_all)

# drone: D1 + A1 sub with slow movement
drone = (np.sin(2 * np.pi * mtof(26) * t_all) * 0.5 + np.sin(2 * np.pi * mtof(33) * t_all) * 0.25
         + np.sin(2 * np.pi * mtof(38) * t_all + np.sin(t_all * 0.3) * 2) * 0.15)
drone *= 0.6 + 0.4 * np.sin(2 * np.pi * t_all / 13) ** 2
M += (drone * 0.22)[:, None]

# pad chords: Dm - Bb - Gm - A, 2 bars each
chords = [[50, 53, 57, 62], [46, 50, 53, 58], [43, 50, 55, 58], [45, 49, 52, 57]]
bar = beat * 4
t0 = 0.0
k = 0
while t0 < DUR:
    dur = bar * 2
    n = int((dur + 1.5) * SR)
    tt = np.arange(n) / SR
    s = np.zeros((n, 2))
    for j, m in enumerate(chords[k % 4]):
        for det, side in ((-0.12, 0), (0.12, 1)):
            f = mtof(m) * 2 ** (det / 12)
            w = sum(np.sin(2 * np.pi * f * h * tt + rng.uniform(0, 6)) / h ** 1.6 for h in range(1, 7))
            s[:, side] += w
    s = np.stack([lp(s[:, 0], 1400), lp(s[:, 1], 1400)], 1)
    s *= env_adsr(n, 1.4, 1.6)[:, None] * 0.05
    place(M, s, t0)
    t0 += dur
    k += 1

# ostinato: low staccato strings, 8ths on D (follows chord root)
roots = [38, 34, 31, 33]
step = beat / 2
t0 = 0.0
i = 0
while t0 < DUR:
    root = roots[int(t0 // (bar * 2)) % 4]
    patt = [0, 0, 12, 0, 0, 0, 10, 12][i % 8]
    f = mtof(root + patt)
    n = int(0.32 * SR)
    tt = np.arange(n) / SR
    w = signal.sawtooth(2 * np.pi * f * tt) * 0.6 + signal.sawtooth(2 * np.pi * f * 1.004 * tt) * 0.4
    w = lp(w, 900) * np.exp(-tt * 9)
    acc = 1.0 if i % 4 == 0 else 0.7
    lvl = np.interp(t0, [0, 9, 9.61], [0.0, 0.25, 1]) * acc
    place(M, np.stack([w, w * 0.9], 1) * 0.07 * lvl, t0)
    t0 += step
    i += 1

# percussion: deep low tom/kick on 1 and the "and" of 3 + soft ticks
def kick():
    n = int(0.6 * SR)
    tt = np.arange(n) / SR
    f = 45 + 90 * np.exp(-tt * 25)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-tt * 6) + lp(rng.standard_normal(n), 2000) * np.exp(-tt * 60) * 0.3

def tick(hi=6000):
    n = int(0.05 * SR)
    tt = np.arange(n) / SR
    return bp(rng.standard_normal(n), hi * 0.6, min(hi * 1.4, 20000)) * np.exp(-tt * 120)

KICK = kick()
t0 = 0.0
b = 0
while t0 < DUR:
    lvl = float(np.interp(t0, [0, 9.4, 9.61], [0, 0, 1]))
    if b % 4 == 0 or b % 4 == 2.5:
        place(M, KICK * 0.35 * lvl, t0)
    if b % 8 == 6:
        place(M, KICK * 0.22 * lvl, t0 + beat * 0.5)
    place(M, np.stack([tick(), tick()], 1) * 0.05 * lvl, t0 + beat * 0.5)
    t0 += beat
    b += 1

# high string line in the finale
for j, (tt0, m) in enumerate([(92.6, 74), (95.8, 77), (98.9, 76), (101.8, 74)]):
    n = int(3.4 * SR)
    tt = np.arange(n) / SR
    vib = np.sin(2 * np.pi * 5 * tt) * 0.004
    f = mtof(m)
    w = sum(np.sin(2 * np.pi * f * h * tt * (1 + vib)) / h ** 1.3 for h in range(1, 6))
    w = lp(w, 3000) * env_adsr(n, 0.8, 1.2) * 0.035
    place(M, np.stack([w, w], 1), tt0)

M *= I[:, None]
M *= duck[:, None]

# ------------------------------------------------------------------ sound design
S = np.zeros((N, 2))


def whoosh(d=0.35, up=True):
    n = int(d * SR)
    tt = np.arange(n) / SR
    x = rng.standard_normal(n)
    out = np.zeros(n)
    # sweep a band-pass by processing in chunks
    for c in range(0, n, 1024):
        k = c / n if up else 1 - c / n
        fc = 300 + 5000 * k ** 2
        seg = bp(x[c:c + 1024 + 256], fc * 0.6, fc * 1.6)[:1024]
        out[c:c + len(seg)] = seg[:len(out[c:c + 1024])]
    e = np.sin(np.pi * np.clip(tt / d, 0, 1)) ** 1.5
    return out * e


def impact(d=1.6):
    n = int(d * SR)
    tt = np.arange(n) / SR
    f = 30 + 110 * np.exp(-tt * 12)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 2.6)
    crack = hp(rng.standard_normal(n), 1500) * np.exp(-tt * 40) * 0.35
    rev = lp(rng.standard_normal(n), 3000) * np.exp(-tt * 3) * 0.08
    return boom + crack + rev


def glitch_sfx(d=0.18):
    n = int(d * SR)
    tt = np.arange(n) / SR
    x = signal.square(2 * np.pi * rng.uniform(200, 900) * tt) * 0.4 + rng.standard_normal(n) * 0.5
    x = np.round(x * 4) / 4  # bitcrush
    gate = (np.sin(2 * np.pi * 37 * tt) > -0.2).astype(float)
    return hp(x * gate, 400) * np.exp(-tt * 10)


def zap(d=0.55):
    n = int(d * SR)
    tt = np.arange(n) / SR
    car = signal.sawtooth(2 * np.pi * 120 * tt + 6 * np.sin(2 * np.pi * 60 * tt))
    x = car * (0.6 + 0.4 * rng.standard_normal(n))
    return hp(x, 200) * np.exp(-tt * 4) * (rng.random(n) > 0.15)


def riser(d=1.5):
    n = int(d * SR)
    tt = np.arange(n) / SR
    f = 200 * 2 ** (tt / d * 3)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.3
    nz = lp(hp(rng.standard_normal(n), 1500), 7000) * 0.25
    return (tone + nz) * (tt / d) ** 2


def heartbeat():
    n = int(0.9 * SR)
    tt = np.arange(n) / SR
    def thump(t0):
        x = np.zeros(n)
        i = int(t0 * SR)
        m = n - i
        tl = np.arange(m) / SR
        x[i:] = np.sin(2 * np.pi * 50 * tl) * np.exp(-tl * 18)
        return x
    return thump(0) + 0.7 * thump(0.22)


def paper():
    n = int(0.3 * SR)
    tt = np.arange(n) / SR
    return bp(rng.standard_normal(n), 1500, 7000) * np.exp(-tt * 14) * 0.6 + np.sin(2 * np.pi * 70 * tt) * np.exp(-tt * 30) * 0.5


def stereo(x, w=0.15):
    d = int(0.012 * SR)
    l = x
    r = np.concatenate([np.zeros(d), x[:-d]]) * (1 - w) + x * w
    return np.stack([l, r], 1)


shots = json.load(open(f'{B}/shots.json'))
for k, sh in enumerate(shots):
    t = sh['s']
    fx = sh['fx']
    types = ' '.join(sh['types'])
    if k == 0:
        continue
    if fx in ('whip',) or 'enter' in types:
        place(S, stereo(whoosh(0.35)), t - 0.12, 0.10)
    if fx == 'glitch':
        place(S, stereo(glitch_sfx()), t, 0.10)
    if fx in ('flash', 'gflash'):
        place(S, stereo(whoosh(0.3, up=False)), t - 0.05, 0.08)
    if fx in ('cut', 'zoom', 'blur') and fx != 'blur':
        place(S, stereo(whoosh(0.22)), t - 0.08, 0.05)
    if fx == 'blur':
        place(S, stereo(whoosh(0.5)), t - 0.2, 0.06)
    if 'cameo' in types or 'frame' in types or 'img:yale' in types or 'img:skyline' in types:
        place(S, stereo(paper()), t, 0.12)
    if 'slot' in types:
        for j in range(4):
            place(S, stereo(impact(0.5)), t + j * 0.16, 0.10)
            place(S, stereo(tick(3000)), t + j * 0.16, 0.4)
    if 'year' in types:
        place(S, stereo(impact()), t, 0.38)
        for j in range(10):
            place(S, stereo(tick(5000)), t + j * 0.045, 0.18)
    if 'num' in types:
        for j in range(12):
            place(S, stereo(tick(4500)), t + j * 0.05, 0.14)
    for g in sh['glitchAt']:
        place(S, stereo(glitch_sfx(0.14)), t + g, 0.09)
    for f in sh['flashAt']:
        place(S, stereo(impact(1.0)), t + f, 0.3)
    for s in sh['shake']:
        place(S, stereo(impact(1.2)), t + s, 0.22)

# hand-placed accents
place(S, stereo(zap(0.6)), 34.50, 0.20)          # током
place(S, stereo(zap(0.3)), 36.80, 0.16)          # 15 V switch
place(S, stereo(zap(0.6)), 37.90, 0.22)          # 150
place(S, stereo(riser(2.2)), 52.40, 0.12)        # build into "настоящим"
place(S, stereo(impact(2.5)), 54.58, 0.55)       # hit
place(S, stereo(riser(1.4)), 94.40, 0.11)        # into "НЕТ"
place(S, stereo(impact(2.2)), 96.14, 0.55)       # НЕТ
for k in range(3):
    place(S, stereo(heartbeat()), 75.80 + k * 0.85, 0.35)  # боится выделиться
place(S, stereo(impact(1.8)), 70.87, 0.35)       # мёртв
place(S, stereo(whoosh(1.2)), 59.30, 0.06)       # smoke hiss
S *= (0.6 + 0.4 * duck)[:, None]

# ------------------------------------------------------------------ mix
mix = M * 0.78 + S * 0.8 + np.stack([V, V], 1) * 1.0
mix[:int(0.02 * SR)] *= np.linspace(0, 1, int(0.02 * SR))[:, None]
mix[-int(0.25 * SR):] *= np.linspace(1, 0.4, int(0.25 * SR))[:, None]
mix = mix.astype(np.float32)
out = ffmpeg_filter(mix.reshape(-1), 'loudnorm=I=-14:TP=-1.0:LRA=7', ch=2)
import wave
pcm = (np.clip(out, -1, 1) * 32767).astype(np.int16)
with wave.open(f'{B}/mix.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
# separate stems for the user
for name, x in (('music', M * 0.78), ('sfx', S * 0.8)):
    p = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    with wave.open(f'{B}/stem_{name}.wav', 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(p.tobytes())
vp = (np.clip(V, -1, 1) * 32767).astype(np.int16)
with wave.open(f'{B}/stem_voice.wav', 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(vp.tobytes())
print('mix written')
