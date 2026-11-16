"""Turn a shaded grayscale render into an engraving-style cut-out with green glow.

Pure green (#00ff00-ish) pixels in the source are kept as glowing accent.
Usage: python3 engrave.py <in_dir> <out_dir> [names...]
"""
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

GREEN = np.array([60, 230, 110], np.float32) / 255.0
PAPER = np.array([236, 236, 230], np.float32) / 255.0
INK = np.array([18, 18, 20], np.float32) / 255.0


def smooth_noise(h, w, scale, seed):
    rng = np.random.default_rng(seed)
    n = rng.standard_normal((h // scale + 3, w // scale + 3)).astype(np.float32)
    n = ndi.zoom(n, scale, order=3)[:h, :w]
    return n / (np.abs(n).max() + 1e-6)


def engrave(img, seed=1, period=7.0, glow_px=22, glow_strength=1.0):
    a = np.asarray(img.convert('RGBA'), np.float32) / 255.0
    rgb, alpha = a[..., :3], a[..., 3]
    h, w = alpha.shape

    # accent mask: strongly green pixels
    g_acc = np.clip((rgb[..., 1] - np.maximum(rgb[..., 0], rgb[..., 2]) - 0.35) * 4, 0, 1) * alpha

    lum = (rgb @ np.array([0.3, 0.59, 0.11], np.float32))
    lum = np.where(g_acc > 0.01, 0.85, lum)
    dark = np.clip(1.0 - lum, 0, 1)
    dark = ndi.gaussian_filter(dark, 0.8)

    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    # direction field follows the luminance gradient a bit (contour hatching feel)
    warp = smooth_noise(h, w, 60, seed) * 6 + ndi.gaussian_filter(lum, 12) * 10
    def lines(angle, per, phase=0.0):
        c, s = np.cos(angle), np.sin(angle)
        u = (xx * c + yy * s + warp) / per + phase
        return np.abs((u % 1.0) - 0.5) * 2.0  # 0 at line centre, 1 between lines

    l1 = lines(np.deg2rad(-35), period)
    l2 = lines(np.deg2rad(40), period * 1.1, 0.3)
    l3 = lines(np.deg2rad(5), period * 0.8, 0.6)

    ink = np.zeros_like(dark)
    # line width grows with darkness; anti-aliased threshold
    def stroke(l, thr):
        return np.clip((thr - l) * 6.0, 0, 1)
    ink = np.maximum(ink, stroke(l1, dark * 1.05))
    ink = np.maximum(ink, stroke(l2, np.clip(dark - 0.35, 0, 1) * 1.4))
    ink = np.maximum(ink, stroke(l3, np.clip(dark - 0.65, 0, 1) * 1.8))
    # stipple in mid tones
    rng = np.random.default_rng(seed + 7)
    st = rng.random((h, w)).astype(np.float32)
    ink = np.maximum(ink, (st < dark ** 3 * 0.25).astype(np.float32) * 0.8)
    # solid blacks
    ink = np.maximum(ink, np.clip((dark - 0.88) * 8, 0, 1))

    # outlines from alpha and luminance edges
    a_s = ndi.gaussian_filter(alpha, 1.0)
    edge = np.hypot(ndi.sobel(a_s, 0), ndi.sobel(a_s, 1))
    l_s = ndi.gaussian_filter(lum, 1.0)
    edge2 = np.hypot(ndi.sobel(l_s, 0), ndi.sobel(l_s, 1))
    ink = np.maximum(ink, np.clip(edge * 1.6, 0, 1))
    ink = np.maximum(ink, np.clip((edge2 - 0.25) * 1.5, 0, 1))
    ink *= (1 - g_acc)

    paper = PAPER * (0.92 + 0.08 * smooth_noise(h, w, 8, seed + 3)[..., None] * 0.5)
    col = paper * (1 - ink[..., None]) + INK * ink[..., None]
    col = col * (1 - g_acc[..., None]) + GREEN * 1.15 * g_acc[..., None]

    # green glow around silhouette + accents
    pad = glow_px * 3
    H, W = h + 2 * pad, w + 2 * pad
    out = np.zeros((H, W, 4), np.float32)
    A = np.zeros((H, W), np.float32)
    A[pad:pad + h, pad:pad + w] = alpha
    Acc = np.zeros((H, W), np.float32)
    Acc[pad:pad + h, pad:pad + w] = g_acc
    rim = ndi.binary_dilation(A > 0.5, iterations=3).astype(np.float32)
    glow = ndi.gaussian_filter(rim, glow_px) * 1.6 + ndi.gaussian_filter(rim, glow_px / 4) * 1.2
    glow = np.maximum(glow, ndi.gaussian_filter(Acc, glow_px / 2) * 2.5)
    glow = np.clip(glow * glow_strength, 0, 1)
    # thin bright rim line just outside the cut-out
    rim_line = np.clip(ndi.binary_dilation(A > 0.5, iterations=4).astype(np.float32) - (A > 0.5), 0, 1)
    rim_line = ndi.gaussian_filter(rim_line, 1.2) * 1.4
    glow = np.clip(np.maximum(glow, rim_line), 0, 1)

    out[..., :3] = GREEN
    out[..., 3] = glow
    # composite object over glow
    obj = np.zeros((H, W, 4), np.float32)
    obj[pad:pad + h, pad:pad + w, :3] = col
    obj[pad:pad + h, pad:pad + w, 3] = alpha
    oa = obj[..., 3:4]
    out_rgb = obj[..., :3] * oa + out[..., :3] * out[..., 3:4] * (1 - oa)
    out_a = oa[..., 0] + out[..., 3] * (1 - oa[..., 0])
    out_rgb = out_rgb / np.maximum(out_a[..., None], 1e-6)
    res = np.dstack([np.clip(out_rgb, 0, 1), out_a])
    return Image.fromarray((res * 255).astype(np.uint8), 'RGBA')


if __name__ == '__main__':
    src, dst = sys.argv[1], sys.argv[2]
    os.makedirs(dst, exist_ok=True)
    names = sys.argv[3:]
    for f in sorted(os.listdir(src)):
        if not f.endswith('.png'):
            continue
        n = f[:-4]
        if names and n not in names:
            continue
        im = Image.open(os.path.join(src, f))
        res = engrave(im, seed=hash(n) % 1000)
        bb = res.getbbox()
        res.crop(bb).save(os.path.join(dst, f))
        print('engraved', n, res.size)
