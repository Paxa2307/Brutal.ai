"""Prepare AI-generated engravings for the engine.

Type A (white background objects): cut out the background, keep a thin paper rim,
add the green glow. Type B (scenes, names >= 17 except 16_bolt): keep the rectangle, tone it.
Usage: python3 prep_ai.py <in_dir> <out_dir>
"""
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

GREEN = np.array([60, 230, 110], np.float32) / 255.0
SCENES = {'17_yale', '18_newyork', '19_brick_wall', '20_smoke_room', '21_smoke_three',
          '22_savanna', '23_tribe', '24_crowd_salute'}
MAXSIDE = 1500


def load(path):
    im = Image.open(path).convert('L')
    s = MAXSIDE / max(im.size)
    if s < 1:
        im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    return np.asarray(im, np.float32) / 255.0


def cutout(L, holes=False):
    ink = L < 0.80
    ink_closed = ndi.binary_dilation(ink, iterations=3)
    light = (L > 0.90) & ~ink_closed
    lab, n = ndi.label(light)
    border = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    bg = np.isin(lab, border[border > 0])
    # grow the background back toward the ink so the rim stays thin
    bg = ndi.binary_dilation(bg, iterations=1) & ~ink
    fg = ~bg
    fg = ndi.binary_fill_holes(fg)
    if holes:  # punch out large enclosed flat-white areas (e.g. gaps between chair legs)
        lab3, n3 = ndi.label(light & fg)
        if n3:
            sizes = ndi.sum(np.ones_like(L), lab3, range(1, n3 + 1))
            big = np.isin(lab3, 1 + np.where(sizes > 1500)[0])
            fg = fg & ~ndi.binary_dilation(big, iterations=1)
    # drop specks
    lab2, n2 = ndi.label(fg)
    if n2 > 1:
        sizes = ndi.sum(fg, lab2, range(1, n2 + 1))
        keep = np.isin(lab2, 1 + np.where(sizes > max(400, sizes.max() * 0.002))[0])
        fg = keep
    return ndi.gaussian_filter(fg.astype(np.float32), 0.8)


def glow_compose(rgb, alpha, glow_px=24):
    h, w = alpha.shape
    pad = glow_px * 3
    H, W = h + 2 * pad, w + 2 * pad
    A = np.zeros((H, W), np.float32)
    A[pad:pad + h, pad:pad + w] = alpha
    rim = ndi.binary_dilation(A > 0.5, iterations=3).astype(np.float32)
    glow = ndi.gaussian_filter(rim, glow_px) * 1.5 + ndi.gaussian_filter(rim, glow_px / 4) * 1.1
    line = ndi.binary_dilation(A > 0.5, iterations=4).astype(np.float32) - (A > 0.5)
    glow = np.clip(np.maximum(glow, ndi.gaussian_filter(line, 1.2) * 1.4), 0, 1)
    obj = np.zeros((H, W, 3), np.float32)
    obj[pad:pad + h, pad:pad + w] = rgb
    oa = A[..., None]
    out_rgb = obj * oa + GREEN * glow[..., None] * (1 - oa)
    out_a = A + glow * (1 - A)
    out_rgb = out_rgb / np.maximum(out_a[..., None], 1e-6)
    return np.dstack([np.clip(out_rgb, 0, 1), out_a])


def main():
    src, dst = sys.argv[1:3]
    os.makedirs(dst, exist_ok=True)
    for f in sorted(os.listdir(src)):
        if not f.endswith('.png'):
            continue
        n = f[:-4]
        L = load(os.path.join(src, f))
        # paper tone: slightly warm off-white like printed plates
        tone = np.stack([L * 0.93 + 0.02, L * 0.93 + 0.02, L * 0.90 + 0.02], -1)
        if n in SCENES:
            res = np.dstack([tone, np.ones_like(L)])
        else:
            a = cutout(L, holes=n in ('07_seated_man',))
            res = glow_compose(tone, a)
        img = Image.fromarray((res * 255).astype(np.uint8), 'RGBA')
        bb = img.getbbox()
        img.crop(bb).save(os.path.join(dst, n + '.png'))
        print('prepared', n, img.crop(bb).size)


if __name__ == '__main__':
    main()
