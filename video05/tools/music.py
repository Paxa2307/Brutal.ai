"""Phonk x classical score, 125 BPM, D minor, arranged to the voiceover.

Usage: python3 music.py <out_dir> <duration>
Writes music.wav (48k stereo float->int16) and stem_*.wav for each instrument group.
Section map (seconds) is tuned to video02's cut voice timeline.
"""
import sys
import wave

import numpy as np
from scipy import signal

SR = 48000
BPM = 125
BEAT = 60 / BPM          # 0.48 s
S16 = BEAT / 4           # 0.12 s
BAR = BEAT * 4           # 1.92 s
OUT = sys.argv[1]
DUR = float(sys.argv[2])
N = int(DUR * SR) + SR
rng = np.random.default_rng(7)

# ----------------------------------------------------------------- arrangement
# (start, end, name). C starts on a beat (61.92 = beat 129) right on "Дружелюбие".
# video05: hook+foal / Portmann+numbers / BR "Почему так?" / mechanism / TENSE "на бумаге" / SILENCE "Но…" / drop "в этом"
SECTIONS = [(0.0, 23.52, 'A'), (23.52, 24.48, 'BR1'), (24.48, 38.88, 'B'), (38.88, 42.12, 'TENSE'),
            (42.12, 43.92, 'SILENCE'), (43.92, DUR + 1, 'C')]
HITS = [0.0, 24.48, 43.92]                 # orchestral hits
SOFT_HITS = [0.48, 10.08, 68.64]           # lighter hits under accent words
CHORDS = [  # name, triad (octave 4), 808 root
    ('Dm', [62, 65, 69], 38), ('Bb', [58, 62, 65], 34),
    ('Gm', [55, 58, 62], 31), ('A', [57, 61, 64], 33)]


def section(t):
    for a, b, n in SECTIONS:
        if a <= t < b:
            return n, a
    return SECTIONS[-1][2], SECTIONS[-1][0]


def sec_end(t):
    for a, b, n in SECTIONS:
        if a <= t < b:
            return b
    return DUR + 1


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def sos(kind, f, order=2):
    if kind == 'band':
        return signal.butter(order, [f[0] / (SR / 2), f[1] / (SR / 2)], 'band', output='sos')
    return signal.butter(order, f / (SR / 2), kind, output='sos')


def lp(x, f, o=2): return signal.sosfilt(sos('low', f, o), x)
def hp(x, f, o=2): return signal.sosfilt(sos('high', f, o), x)
def bp(x, a, b, o=2): return signal.sosfilt(sos('band', (a, b), o), x)


def noise(n): return rng.standard_normal(n)


def tt(d): return np.arange(int(d * SR)) / SR


def place(b, x, t, g=1.0, pan=0.0):
    i = int(round(t * SR))
    if i >= len(b) or i < 0:
        return
    n = min(len(x), len(b) - i)
    if x.ndim == 1:
        a = (pan + 1) * np.pi / 4
        b[i:i + n, 0] += x[:n] * g * np.cos(a) * 1.4142
        b[i:i + n, 1] += x[:n] * g * np.sin(a) * 1.4142
    else:
        b[i:i + n] += x[:n] * g


def stereo_buf():
    return np.zeros((N, 2))


# ----------------------------------------------------------------- instruments
def kick():
    t = tt(0.5)
    f = 46 + 120 * np.exp(-t * 32)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6.5)
    click = hp(noise(len(t)), 2500) * np.exp(-t * 350) * 0.6
    return np.tanh(2.0 * (body + click)) * 0.9


def clap():
    t = tt(0.4)
    env = np.zeros_like(t)
    for d in (0.0, 0.010, 0.021):
        env += np.exp(-np.clip(t - d, 0, None) * 70) * (t >= d)
    env += np.exp(-np.clip(t - 0.03, 0, None) * 13) * (t >= 0.03) * 0.7
    x = bp(noise(len(t)), 900, 5000) * env
    x += np.sin(2 * np.pi * 185 * t) * np.exp(-t * 28) * 0.5
    return x * 0.8


def hat(open_=False):
    t = tt(0.45 if open_ else 0.07)
    metal = sum(signal.square(2 * np.pi * f * t) for f in (205.3, 304.4, 369.6, 522.7, 540, 800))
    x = hp(metal * 0.3 + noise(len(t)), 7000, 4)
    return x * np.exp(-t * (7 if open_ else 75)) * 0.5


def cowbell(m):
    t = tt(0.32)
    f = mtof(m)
    x = signal.square(2 * np.pi * f * t) + 0.8 * signal.square(2 * np.pi * f * 1.4835 * t)
    x = bp(x, 450, 6000)
    env = np.exp(-t * 26) * 0.75 + np.exp(-t * 9) * 0.25
    return np.tanh(1.6 * x * env) * 0.6


def bass808(m0, m1, dur, glide):
    t = tt(dur + 0.03)
    f0, f1 = mtof(m0), mtof(m1)
    f = f1 + (f0 - f1) * np.exp(-t / 0.06) if glide else np.full_like(t, f1)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR)
    env = np.minimum(1, t / 0.004) * np.exp(-t * 1.1)
    r = int(0.03 * SR)
    env[-r:] *= np.linspace(1, 0, r)
    y = np.tanh(2.8 * x * env)
    return lp(y, 1100) * 0.85


def spiccato(m):
    t = tt(0.17)
    f = mtof(m)
    x = sum(signal.sawtooth(2 * np.pi * f * (1 + d) * t + rng.uniform(0, 6)) for d in (-0.004, 0.0, 0.005)) / 3
    x = lp(x, 3200)
    env = np.minimum(1, t / 0.006) * np.exp(-t * 21)
    return x * env


def legato(m, dur):
    t = tt(dur)
    f = mtof(m)
    vib = 1 + 0.003 * np.sin(2 * np.pi * 5.2 * t)
    x = sum(signal.sawtooth(2 * np.pi * np.cumsum(f * (1 + d) * vib) / SR) for d in (-0.005, 0.0, 0.006)) / 3
    x = lp(x, 1800)
    a, r = int(0.25 * SR), int(0.35 * SR)
    env = np.ones_like(t)
    env[:a] = np.linspace(0, 1, a)
    env[-r:] *= np.linspace(1, 0, r)
    return x * env


def choir(notes, dur):
    t = tt(dur)
    src = np.zeros_like(t)
    for m in notes:
        for d in (-0.006, 0.0, 0.007):
            vib = 1 + 0.004 * np.sin(2 * np.pi * (5 + rng.uniform(-0.4, 0.4)) * t + rng.uniform(0, 6))
            src += signal.sawtooth(2 * np.pi * np.cumsum(mtof(m) * (1 + d) * vib) / SR)
    y = bp(src, 650, 950) + 0.6 * bp(src, 1050, 1300) + 0.25 * bp(src, 2600, 3200)
    a, r = int(0.3 * SR), int(0.4 * SR)
    env = np.ones_like(t)
    env[:a] = np.linspace(0, 1, a) ** 2
    env[-r:] *= np.linspace(1, 0, r)
    return y * env / (len(notes) * 3)


def brass(notes, dur=0.42):
    t = tt(dur)
    src = sum(signal.sawtooth(2 * np.pi * mtof(m) * (1 + d) * t) for m in notes for d in (-0.003, 0.004))
    bright = lp(src, 3500)
    dark = lp(src, 600)
    k = np.exp(-t * 9)
    y = bright * k + dark * (1 - k)
    env = np.minimum(1, t / 0.01) * np.exp(-t * 4.5)
    return y * env / (len(notes) * 2)


def crash(d=2.2):
    t = tt(d)
    x = hp(noise(len(t)), 4500, 3) + 0.3 * hp(sum(signal.square(2 * np.pi * f * t) for f in (311, 470, 657, 845)), 3000)
    return x * np.exp(-t * 2.0) * 0.5


def timpani():
    t = tt(1.2)
    f = 62 + 25 * np.exp(-t * 12)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3.2)
    x += lp(noise(len(t)), 400) * np.exp(-t * 30) * 0.4
    return np.tanh(1.5 * x)


def orch_hit(strength=1.0):
    t = tt(1.6)
    notes = [38, 50, 57, 62, 65, 69, 74]
    src = sum(signal.sawtooth(2 * np.pi * mtof(m) * (1 + d) * t) for m in notes for d in (-0.004, 0.005))
    y = lp(src, 4500) * np.exp(-t * 3.2) / 10
    out = np.zeros(len(t))
    out += y
    tp = timpani()
    out[:len(tp)] += tp * 0.8
    c = crash(1.6)
    out[:len(c)] += c * 0.8
    return out * strength


def riser(d):
    t = tt(d)
    n = noise(len(t))
    out = np.zeros_like(t)
    step = 2048
    for i in range(0, len(t), step):
        k = i / len(t)
        fc = 300 * (30 ** k)
        seg = bp(n[i:i + step + 512], fc * 0.7, min(fc * 1.4, 20000))[:step]
        out[i:i + len(seg)] = seg[:len(out[i:i + step])]
    f = 110 * 2 ** (2.5 * t / d)
    tone = signal.sawtooth(2 * np.pi * np.cumsum(f) / SR) * 0.25
    return (out + lp(tone, 3000)) * (t / d) ** 2.2


def reverse_crash(d):
    c = crash(d)
    return c[::-1] * np.linspace(0, 1, len(c)) ** 1.5


# ----------------------------------------------------------------- arrange
drums = stereo_buf()
bass = np.zeros(N)
bells = stereo_buf()
strings = stereo_buf()
pads = stereo_buf()
fx = stereo_buf()
kick_times = []

KICK, CLAP, HAT, OHAT = kick(), clap(), hat(), hat(True)

total_steps = int(DUR / S16) + 1
bass_notes = []  # (t, m_from, m_to, glide)
prev_m = 38
for k in range(total_steps):
    t = k * S16
    sec, s0 = section(t)
    k0 = int(round(s0 / S16))
    rel = k - k0
    pos = rel % 16
    bar = rel // 16
    if sec == 'C':
        ci = bar % 4
    else:
        ci = int(t // BAR) % 4
    name, triad, root = CHORDS[ci]
    full = sec in ('A', 'B', 'C')

    # ---- drums
    if full:
        kp = (0, 6, 10) if bar % 2 == 0 else (0, 10, 13)
        if sec == 'C':
            kp = (0, 6, 10, 14) if bar % 2 == 0 else (0, 3, 10, 13)
        if pos in kp:
            place(drums, KICK, t, 1.0 if pos == 0 else 0.85)
            kick_times.append(t)
        if pos in (4, 12):
            place(drums, CLAP, t, 0.75)
        roll = (bar % 2 == 1 and pos >= 12) or (sec == 'C' and pos >= 14)
        if roll:
            for j in range(2):
                v = 0.25 + 0.35 * ((pos - 12) * 2 + j) / 8
                place(drums, HAT, t + j * S16 / 2, v, pan=0.25)
        else:
            v = 0.55 if pos % 4 == 2 else (0.32 if pos % 2 == 0 else 0.18)
            place(drums, HAT, t, v, pan=0.25)
        if pos == 14 and bar % 2 == 0:
            place(drums, OHAT, t, 0.3, pan=-0.2)
    elif sec == 'BR1':
        if pos % 2 == 0:
            place(drums, HAT, t, 0.15 + 0.4 * (t - s0) / (sec_end(t) - s0), pan=0.25)
        if t >= sec_end(t) - 0.96:  # snare roll last 2 beats
            place(drums, CLAP, t, 0.15 + 0.5 * (t - (sec_end(t) - 0.96)) / 0.96)
    elif sec == 'BR2':
        if pos in (0, 3):  # heartbeat
            place(drums, KICK, t, 0.55 if pos == 0 else 0.35)
            kick_times.append(t)
    elif sec == 'TENSE':
        if pos % 4 == 0:
            place(drums, HAT, t, 0.12, pan=0.3)

    # ---- 808
    if full or sec == 'BR2':
        pat = [(0, 0, 6), (6, 0, 4), (10, 12, 3), (13, 0, 3)] if full else [(0, 0, 16)]
        for p, iv, ln in pat:
            if pos == p:
                m = root + iv
                bass_notes.append((t, prev_m, m, iv == 12 or (p == 13)))
                prev_m = m
    # ---- cowbell (phonk lead)
    if full:
        tones = triad + [triad[0] + 12]
        motif = [(0, 0), (3, 0), (6, 1), (8, 2), (10, 1), (11, 0), (14, 2)] if bar % 2 == 0 else \
                [(0, 2), (3, 2), (6, 1), (8, 0), (10, 1), (12, 2), (14, 3)]
        for p, idx in motif:
            if pos == p:
                m = tones[idx] + 12
                place(bells, cowbell(m), t, 0.9, pan=-0.1)
                if sec in ('B', 'C'):
                    place(bells, cowbell(m + 12), t, 0.35, pan=0.35)
    # ---- strings spiccato ostinato
    if full or sec == 'BR1':
        low = [n - 12 for n in triad] + [triad[0]]
        pattern = [0, 2, 1, 2, 0, 2, 1, 2, 0, 2, 1, 2, 3, 2, 1, 2]
        m = low[pattern[pos]]
        g = 0.55 if sec == 'A' else 0.7
        place(strings, spiccato(m), t, g * (1.0 if pos % 4 == 0 else 0.75), pan=-0.35 if pos % 2 else 0.35)
        if sec in ('B', 'C'):
            place(strings, spiccato(m + 12), t, 0.32, pan=0.5 if pos % 2 else -0.5)
    # ---- pads per bar
    if pos == 0:
        if sec in ('B', 'C', 'BR1'):
            place(pads, choir(triad, BAR + 0.3), t, 1.0, pan=0.0)
        if sec in ('BR2', 'TENSE'):
            place(pads, choir([n - 12 for n in triad], BAR + 0.3), t, 0.9)
            for n in (triad[0] - 12, triad[2] - 12):
                place(strings, legato(n, BAR + 0.2), t, 0.35, pan=rng.uniform(-0.4, 0.4))
        if sec == 'C':
            place(pads, brass([n - 12 for n in triad] + [triad[0]]), t, 1.0)
            place(pads, brass([n - 12 for n in triad] + [triad[0]]), t + 6 * S16, 0.7)
    # sub drone for TENSE
bass_notes.append((DUR + 1, 0, 0, False))
for i in range(len(bass_notes) - 1):
    t, m0, m1, gl = bass_notes[i]
    d = bass_notes[i + 1][0] - t
    place_t = t
    x = bass808(m0, m1, min(d, 1.9), gl)
    i0 = int(round(place_t * SR))
    n = min(len(x), N - i0)
    if n > 0:
        bass[i0:i0 + n] += x[:n]

# TENSE: low drone + riser + reverse crash into the drop; BR1: riser; BR2: build at the end
for a_, b_, n_ in SECTIONS:
    d_ = b_ - a_
    if n_ == 'TENSE':
        tdr = tt(d_)
        drone = (np.sin(2 * np.pi * mtof(26) * tdr) + 0.5 * np.sin(2 * np.pi * mtof(38) * tdr)) * np.linspace(0.2, 1, len(tdr))
        place(fx, drone * 0.35, a_)
        place(fx, reverse_crash(min(2.4, d_ + 0.6)), b_ - min(2.4, d_ + 0.6), 0.9)
        place(fx, riser(d_ + 0.4), a_ - 0.4, 0.55)
    if n_ == 'BR1':
        place(fx, riser(d_), a_, 0.5)
        place(fx, reverse_crash(1.2), b_ - 1.2, 0.6)
    if n_ == 'BR2':
        place(fx, riser(1.9), b_ - 1.9, 0.35)
for h in HITS:
    place(fx, orch_hit(1.0), h, 0.9)
for h in SOFT_HITS:
    place(fx, orch_hit(0.6), h, 0.6)
    place(fx, crash(1.5), h, 0.3)

# ----------------------------------------------------------------- sidechain + reverb
sc = np.ones(N)
env = np.exp(-np.arange(int(0.25 * SR)) / SR / 0.09)
for k in kick_times:
    i = int(k * SR)
    n = min(len(env), N - i)
    sc[i:i + n] = np.minimum(sc[i:i + n], 1 - 0.55 * env[:n])
bells *= sc[:, None] ** 0.5
strings *= sc[:, None]
pads *= sc[:, None]
bass_st = np.stack([bass, bass], 1) * (sc ** 0.3)[:, None]


def reverb(x, t60=1.8, wet=0.3):
    n = int(t60 * SR)
    t = np.arange(n) / SR
    ir = np.stack([lp(noise(n), 6000), lp(noise(n), 6000)], 1) * np.exp(-t * 6.9 / t60)[:, None]
    ir /= np.sqrt((ir ** 2).sum(0))
    out = np.stack([signal.oaconvolve(x[:, c], ir[:, c])[:len(x)] for c in range(2)], 1)
    return x + out * wet


strings = reverb(strings, 1.6, 0.35)
pads = reverb(pads, 2.2, 0.45)
bells = reverb(bells, 1.2, 0.18)
fx = reverb(fx, 2.5, 0.4)
drums = drums + reverb(drums, 0.9, 0.08) - drums


def rms(x):
    a = np.abs(x).mean(1) if x.ndim == 2 else np.abs(x)
    act = x[a > 1e-4] if x.ndim == 1 else x[a > 1e-4]
    return np.sqrt((act ** 2).mean()) + 1e-9


def level(x, db):
    return x / rms(x) * 10 ** (db / 20)


stems = {
    'drums': level(drums, -17),
    'bass': level(bass_st, -21),
    'bells': level(bells, -24),
    'strings': level(strings, -24),
    'pads': level(pads, -25),
    'fx': level(fx, -20),
}
SIL = [(a_, b_) for a_, b_, n_ in SECTIONS if n_ == 'SILENCE']
mute = np.ones(N)
for a_, b_ in SIL:
    i0, i1 = int(a_ * SR), int(b_ * SR)
    f = int(0.03 * SR)
    mute[i0 - f:i0] = np.linspace(1, 0, f)
    mute[i0:i1] = 0.0
for k_ in stems:
    stems[k_] = stems[k_] * mute[:, None]
import json as _json
_json.dump(SIL, open(f'{OUT}/silence.json', 'w'))
mix = sum(stems.values())
mix = np.tanh(mix * 1.6) / 1.6
mix = mix[:int(DUR * SR)]
mix /= np.abs(mix).max() / 0.9


def write(path, x):
    pcm = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    with wave.open(path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


write(f'{OUT}/music.wav', mix)
for k, v in stems.items():
    write(f'{OUT}/mstem_{k}.wav', np.clip(v[:int(DUR * SR)] * 0.9 / np.abs(mix).max(), -1, 1))
print('music written', len(mix) / SR, 's')
