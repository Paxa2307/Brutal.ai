"""Shorten pauses in the voiceover and produce a time map.

Usage: python3 cut_voice.py <voice.mp3> <words.json> <out_dir>
Outputs: voice_cut.wav (48k mono, float), words_cut.json, timemap.json
"""
import json
import subprocess
import sys

import numpy as np

SR = 48000
src, words_path, out = sys.argv[1:4]

raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', src, '-ac', '1', '-ar', str(SR),
                      '-f', 'f32le', '-'], capture_output=True, check=True).stdout
a = np.frombuffer(raw, np.float32).copy()

# silence detection (same settings as analysis)
log = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', src, '-af',
                      'silencedetect=n=-42dB:d=0.3', '-f', 'null', '-'],
                     capture_output=True, text=True).stderr
starts, ends = [], []
for line in log.splitlines():
    if 'silence_start:' in line:
        starts.append(float(line.split('silence_start:')[1].split()[0]))
    if 'silence_end:' in line:
        ends.append(float(line.split('silence_end:')[1].split()[0]))
sil = list(zip(starts, ends))

DEFAULT_KEEP = 0.24
# dramatic beats keep a little more air; the broken "нет. ... Достаточно" gets almost none
SPECIAL = {61.10: 0.62, 82.16: 0.42, 107.13: 0.10, 48.72: 0.36, 91.90: 0.36}


def keep_for(s):
    for k, v in SPECIAL.items():
        if abs(s - k) < 0.05:
            return v
    return DEFAULT_KEEP


# build keep segments (in seconds of original)
segs = []
cur = 0.0
for s, e in sil:
    k = keep_for(s)
    d = e - s
    if d <= k:
        continue
    segs.append((cur, s + k / 2))
    cur = e - k / 2
segs.append((cur, len(a) / SR))

fade = int(0.008 * SR)
pieces = []
tm = []  # (orig_start, orig_end, new_start)
t_new = 0.0
for s, e in segs:
    i0, i1 = int(s * SR), int(e * SR)
    p = a[i0:i1].copy()
    p[:fade] *= np.linspace(0, 1, fade)
    p[-fade:] *= np.linspace(1, 0, fade)
    pieces.append(p)
    tm.append((s, e, t_new))
    t_new += (i1 - i0) / SR
voice = np.concatenate(pieces)


def remap(t):
    for s, e, n in tm:
        if t <= e:
            return n + max(0.0, t - s)
    s, e, n = tm[-1]
    return n + (t - s)


words = json.load(open(words_path))
words_cut = [[round(remap(s), 3), round(remap(e), 3), w] for s, e, w in words]
json.dump(words_cut, open(f'{out}/words_cut.json', 'w'), ensure_ascii=False)
json.dump(tm, open(f'{out}/timemap.json', 'w'))
voice.astype(np.float32).tofile(f'{out}/voice_cut.f32')
print(f'orig {len(a)/SR:.2f}s -> new {len(voice)/SR:.2f}s, {len(segs)} segments')
