"""Shorten (or lengthen) pauses in the voiceover and produce a time map.

Usage: python3 cut_voice.py <voice.mp3> <words.json> <out_dir>
Outputs: voice_cut.f32 (48k mono float), words_cut.json, timemap.json

KEEP sets the target pause length for a given silence (matched by its start time);
if the target is longer than the original silence, digital silence is inserted.
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

log = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', src, '-af',
                      'silencedetect=n=-42dB:d=0.25', '-f', 'null', '-'],
                     capture_output=True, text=True).stderr
starts, ends = [], []
for line in log.splitlines():
    if 'silence_start:' in line:
        starts.append(float(line.split('silence_start:')[1].split()[0]))
    if 'silence_end:' in line:
        ends.append(float(line.split('silence_end:')[1].split()[0]))
sil = list(zip(starts, ends))

DEFAULT_KEEP = 0.20
# video04: hook beat, the "Но…" stop (long, padded), the closing lines
KEEP = {2.18: 0.40, 62.40: 0.30, 63.45: 1.30, 87.40: 0.30, 89.50: 0.35}


def keep_for(s):
    for k, v in KEEP.items():
        if abs(s - k) < 0.05:
            return v
    return DEFAULT_KEEP


pieces = []   # ('src', s, e) or ('pad', dur)
cur = 0.0
for s, e in sil:
    k = keep_for(s)
    d = e - s
    if abs(d - k) < 0.02:
        continue
    if d > k:
        pieces.append(('src', cur, s + k / 2))
        cur = e - k / 2
    else:  # lengthen: keep the whole original silence and add digital silence in the middle
        mid = (s + e) / 2
        pieces.append(('src', cur, mid))
        pieces.append(('pad', k - d))
        cur = mid
pieces.append(('src', cur, len(a) / SR))

fade = int(0.008 * SR)
out_chunks, tm = [], []
t_new = 0.0
for p in pieces:
    if p[0] == 'pad':
        n = int(p[1] * SR)
        out_chunks.append(np.zeros(n, np.float32))
        t_new += n / SR
        continue
    _, s, e = p
    i0, i1 = int(s * SR), int(e * SR)
    x = a[i0:i1].copy()
    if len(x) > 2 * fade:
        x[:fade] *= np.linspace(0, 1, fade)
        x[-fade:] *= np.linspace(1, 0, fade)
    out_chunks.append(x)
    tm.append((s, e, t_new))
    t_new += (i1 - i0) / SR
voice = np.concatenate(out_chunks)


def remap(t):
    for s, e, n in tm:
        if t <= e:
            return n + max(0.0, t - s)
    s, e, n = tm[-1]
    return n + (t - s)


words = json.load(open(words_path))
json.dump([[round(remap(s), 3), round(remap(e), 3), w] for s, e, w in words],
          open(f'{out}/words_cut.json', 'w'), ensure_ascii=False)
json.dump(tm, open(f'{out}/timemap.json', 'w'))
voice.astype(np.float32).tofile(f'{out}/voice_cut.f32')
print(f'orig {len(a)/SR:.2f}s -> new {len(voice)/SR:.2f}s')
