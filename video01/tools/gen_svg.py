"""Generate shaded grayscale SVG illustrations (later engraved).

Pure #00ff00 fills become glowing green accents after engraving.
"""
import math
import os
import random

OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'svg')
os.makedirs(OUT, exist_ok=True)


def save(name, w, h, body, defs=''):
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">
<defs>
<radialGradient id="ball" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff"/><stop offset="0.55" stop-color="#bbb"/><stop offset="1" stop-color="#444"/></radialGradient>
<radialGradient id="ballD" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#ddd"/><stop offset="0.6" stop-color="#888"/><stop offset="1" stop-color="#222"/></radialGradient>
<linearGradient id="lr" x1="0" x2="1"><stop offset="0" stop-color="#555"/><stop offset="0.5" stop-color="#ddd"/><stop offset="1" stop-color="#fff"/></linearGradient>
<linearGradient id="rl" x1="1" x2="0"><stop offset="0" stop-color="#555"/><stop offset="0.5" stop-color="#ccc"/><stop offset="1" stop-color="#fff"/></linearGradient>
<linearGradient id="tb" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#666"/></linearGradient>
<linearGradient id="bt" x1="0" x2="0" y1="1" y2="0"><stop offset="0" stop-color="#eee"/><stop offset="1" stop-color="#555"/></linearGradient>
<linearGradient id="cyl" x1="0" x2="1"><stop offset="0" stop-color="#333"/><stop offset="0.3" stop-color="#ccc"/><stop offset="0.45" stop-color="#fff"/><stop offset="1" stop-color="#222"/></linearGradient>
<linearGradient id="cylD" x1="0" x2="1"><stop offset="0" stop-color="#111"/><stop offset="0.35" stop-color="#777"/><stop offset="0.5" stop-color="#aaa"/><stop offset="1" stop-color="#111"/></linearGradient>
{defs}
</defs>
{body}
</svg>'''
    open(os.path.join(OUT, name + '.svg'), 'w').write(svg)


# ---------------------------------------------------------------- head (classical profile)
HEAD_PATH = ('M 300 110 C 400 95, 490 140, 520 220 C 535 260, 540 300, 548 330 '
             'C 552 340, 556 345, 560 352 L 606 440 C 610 452, 600 462, 584 462 '
             'C 574 462, 568 470, 570 478 C 572 488, 576 494, 578 500 C 580 508, 570 512, 566 514 '
             'C 574 520, 576 530, 566 538 C 558 545, 554 552, 558 565 C 566 585, 568 605, 552 620 '
             'C 530 640, 500 645, 480 650 C 470 700, 468 780, 475 880 L 230 880 '
             'C 240 800, 250 720, 245 650 C 200 600, 170 520, 175 430 C 180 300, 220 130, 300 110 Z')


def curls(rng, cx, cy, rx, ry, a0, a1, n, rmin, rmax, layers=3):
    out = []
    for L in range(layers):
        for i in range(n):
            t = a0 + (a1 - a0) * (i + rng.random() * 0.6) / n
            k = 1 - L * 0.16
            x = cx + math.cos(t) * rx * k + rng.uniform(-8, 8)
            y = cy + math.sin(t) * ry * k + rng.uniform(-8, 8)
            r = rng.uniform(rmin, rmax)
            out.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r:.0f}" fill="url(#ballD)"/>')
            out.append(f'<path d="M {x-r*0.5:.0f} {y:.0f} a {r*0.5:.0f} {r*0.5:.0f} 0 1 1 {r*0.5:.0f} {r*0.5:.0f}" '
                       f'stroke="#222" stroke-width="3" fill="none"/>')
    return ''.join(out)


def head(name, mouth_band=False, brain_glow=False, tilt=0):
    rng = random.Random(4)
    face_grad = '''<linearGradient id="face" x1="0" x2="1" y1="0" y2="0.2">
<stop offset="0" stop-color="#3a3a3a"/><stop offset="0.45" stop-color="#9a9a9a"/>
<stop offset="0.8" stop-color="#eee"/><stop offset="1" stop-color="#fff"/></linearGradient>
<linearGradient id="neck" x1="0" x2="1"><stop offset="0" stop-color="#222"/><stop offset="0.6" stop-color="#888"/><stop offset="1" stop-color="#ccc"/></linearGradient>
<clipPath id="hc"><path d="''' + HEAD_PATH + '''"/></clipPath>'''
    body = f'<g transform="rotate({tilt} 400 500)">'
    body += f'<path d="{HEAD_PATH}" fill="url(#face)"/>'
    # neck shadow under jaw
    body += '<path d="M 245 650 C 330 700, 420 690, 480 650 L 475 880 L 230 880 Z" fill="url(#neck)" clip-path="url(#hc)" opacity="0.9"/>'
    body += '<path d="M 480 650 C 430 700, 330 700, 260 660" stroke="#111" stroke-width="10" fill="none" opacity="0.6" clip-path="url(#hc)"/>'
    # cheek / temple modelling
    body += '<ellipse cx="455" cy="470" rx="70" ry="90" fill="#fff" opacity="0.35" clip-path="url(#hc)"/>'
    body += '<ellipse cx="490" cy="300" rx="50" ry="70" fill="#fff" opacity="0.4" clip-path="url(#hc)"/>'
    # eye
    body += '<path d="M 505 362 C 520 352, 540 352, 552 362 C 540 372, 520 374, 505 362 Z" fill="#555"/>'
    body += '<path d="M 500 352 C 520 335, 545 338, 556 352" stroke="#222" stroke-width="6" fill="none"/>'
    body += '<path d="M 505 375 C 525 385, 545 380, 552 368" stroke="#333" stroke-width="3" fill="none"/>'
    # brow shadow and nose wing
    body += '<path d="M 490 340 C 520 325, 545 330, 560 350" stroke="#444" stroke-width="12" fill="none" opacity="0.6"/>'
    body += '<path d="M 570 470 C 556 470, 548 456, 556 446 C 566 440, 580 446, 584 456" stroke="#333" stroke-width="5" fill="#888"/>'
    # mouth line
    body += '<path d="M 566 514 C 556 516, 548 518, 540 514" stroke="#222" stroke-width="5" fill="none"/>'
    # ear
    body += '<path d="M 330 400 C 300 395, 290 430, 300 470 C 305 500, 330 510, 345 495 C 355 470, 352 420, 330 400 Z" fill="url(#ballD)" stroke="#222" stroke-width="4"/>'
    body += '<path d="M 330 420 C 315 425, 312 455, 322 480" stroke="#222" stroke-width="5" fill="none"/>'
    # hair mass + curls
    hair = ('M 175 430 C 170 300, 230 120, 320 100 C 420 85, 500 140, 525 230 '
            'C 500 220, 470 230, 450 260 C 420 250, 390 270, 380 300 C 360 330, 365 370, 370 400 '
            'C 340 380, 300 380, 280 410 C 270 470, 265 560, 250 640 C 210 600, 180 520, 175 430 Z')
    body += f'<path d="{hair}" fill="#555"/>'
    body += curls(rng, 340, 330, 165, 210, math.pi * 0.62, math.pi * 1.95, 16, 22, 34)
    if brain_glow:
        body += '<ellipse cx="380" cy="300" rx="120" ry="95" fill="#00ff00" opacity="1"/>'
    if mouth_band:
        body += '<rect x="500" y="490" width="140" height="60" fill="#00ff00" transform="rotate(-8 570 520)"/>'
    body += '</g>'
    save(name, 800, 900, body, face_grad)


# ---------------------------------------------------------------- human figures (suits)
def figure(kind='stand', accent=False):
    """Return svg group of a standing suited man at origin, height ~ 600, centred x=0."""
    g = []
    skin = 'url(#ball)'
    coat = 'url(#cylD)' if kind != 'coat' else 'url(#cyl)'
    # legs
    if kind == 'seated':
        g.append('<rect x="-140" y="150" width="280" height="40" rx="6" fill="url(#tb)"/>')
        g.append('<rect x="-120" y="190" width="18" height="260" fill="url(#cylD)"/><rect x="102" y="190" width="18" height="260" fill="url(#cylD)"/>')
        g.append('<path d="M -72 170 L -72 230 L -8 230 L -8 170 Z M 8 170 L 8 230 L 72 230 L 72 170 Z" fill="url(#cylD)"/>')
        g.append('<path d="M -68 230 L -60 440 L -18 440 L -12 230 Z M 12 230 L 18 440 L 60 440 L 68 230 Z" fill="url(#cylD)"/>')
        g.append('<ellipse cx="-42" cy="448" rx="36" ry="13" fill="#111"/><ellipse cx="42" cy="448" rx="36" ry="13" fill="#111"/>')
    else:
        g.append('<path d="M -70 180 L -60 560 L -15 560 L 0 260 L 15 560 L 60 560 L 70 180 Z" fill="url(#cylD)"/>')
        g.append('<ellipse cx="-40" cy="565" rx="38" ry="14" fill="#111"/><ellipse cx="40" cy="565" rx="38" ry="14" fill="#111"/>')
    # torso
    top = -60
    tor = f'M -95 {top+40} C -100 {top+120}, -85 160, -75 {200 if kind!="coat" else 330} L 75 {200 if kind!="coat" else 330} C 85 160, 100 {top+120}, 95 {top+40} C 60 {top}, -60 {top}, -95 {top+40} Z'
    g.append(f'<path d="{tor}" fill="{coat}"/>')
    # shirt + tie / lapels
    g.append(f'<path d="M -25 {top+5} L 0 {top+90} L 25 {top+5} Z" fill="#eee"/>')
    if kind != 'coat':
        g.append(f'<path d="M -8 {top+15} L 8 {top+15} L 12 {top+110} L 0 {top+130} L -12 {top+110} Z" fill="#222"/>')
        g.append(f'<path d="M -30 {top+5} L -5 {top+120} L -45 {top+70} Z" fill="#333"/><path d="M 30 {top+5} L 5 {top+120} L 45 {top+70} Z" fill="#333"/>')
    else:
        g.append(f'<path d="M -30 {top+5} L -2 {top+150} L -50 {top+80} Z" fill="#999"/><path d="M 30 {top+5} L 2 {top+150} L 50 {top+80} Z" fill="#999"/>')
        g.append(f'<line x1="0" y1="{top+150}" x2="0" y2="320" stroke="#666" stroke-width="3"/>')
        g.append('<circle cx="10" cy="40" r="4" fill="#444"/><circle cx="10" cy="110" r="4" fill="#444"/><circle cx="10" cy="180" r="4" fill="#444"/>')
    # arms
    if kind in ('stand', 'coat', 'seated'):
        g.append('<path d="M -95 -15 C -120 60, -118 140, -110 210 L -80 210 C -82 140, -75 60, -70 0 Z" fill="url(#cylD)"/>')
        g.append('<path d="M 95 -15 C 120 60, 118 140, 110 210 L 80 210 C 82 140, 75 60, 70 0 Z" fill="url(#cylD)"/>')
        g.append('<ellipse cx="-95" cy="222" rx="16" ry="22" fill="url(#ball)"/><ellipse cx="95" cy="222" rx="16" ry="22" fill="url(#ball)"/>')
        if kind == 'coat':
            g.append('<rect x="60" y="90" width="80" height="105" rx="4" fill="url(#tb)" stroke="#222" stroke-width="4" transform="rotate(-12 100 140)"/>')
    elif kind == 'salute':
        g.append('<path d="M -95 -15 C -120 60, -118 140, -110 210 L -80 210 C -82 140, -75 60, -70 0 Z" fill="url(#cylD)"/>')
        g.append('<ellipse cx="-95" cy="222" rx="16" ry="22" fill="url(#ball)"/>')
        g.append('<path d="M 70 -40 L 190 -200 L 215 -180 L 95 -5 Z" fill="url(#cylD)"/>')
        g.append('<ellipse cx="208" cy="-208" rx="18" ry="26" fill="url(#ball)" transform="rotate(35 208 -208)"/>')
    elif kind == 'crossed':
        g.append('<path d="M -95 -15 C -120 60, -118 100, -100 120 L 80 95 L 80 70 L -70 80 C -75 40, -72 20, -70 0 Z" fill="url(#cylD)"/>')
        g.append('<path d="M 95 -15 C 120 60, 118 100, 100 130 L -80 110 L -80 85 L 70 90 C 75 40, 72 20, 70 0 Z" fill="url(#cyl)"/>')
    # head
    g.append(f'<rect x="-22" y="{top-40}" width="44" height="50" fill="url(#ballD)"/>')
    g.append(f'<ellipse cx="0" cy="{top-95}" rx="52" ry="64" fill="url(#ball)"/>')
    g.append(f'<path d="M -52 {top-110} C -50 {top-170}, 50 {top-175}, 54 {top-110} C 40 {top-140}, -30 {top-145}, -52 {top-110} Z" fill="#333"/>')
    if accent:
        g.append(f'<ellipse cx="0" cy="{top-95}" rx="52" ry="64" fill="#00ff00" opacity="0.0"/>')
    return '<g>' + ''.join(g) + '</g>'


def figure_svg(name, kind):
    body = f'<g transform="translate(260 260)">{figure(kind)}</g>'
    save(name, 520, 860, body)


# ---------------------------------------------------------------- simple objects
def chain(name, broken=False):
    links = []
    for i in range(7):
        x = 120 + i * 100
        y = 300 + (i % 2) * 0
        if broken and i == 3:
            links.append(f'<path d="M {x-45} {y-35} A 50 35 0 0 1 {x-10} {y-38}" stroke="url(#cyl)" stroke-width="26" fill="none" transform="rotate(-25 {x} {y})"/>')
            links.append(f'<path d="M {x+10} {y+38} A 50 35 0 0 1 {x+45} {y+35}" stroke="url(#cyl)" stroke-width="26" fill="none" transform="rotate(20 {x} {y})"/>')
            links.append(f'<circle cx="{x}" cy="{y}" r="16" fill="#00ff00"/>')
            continue
        if i % 2 == 0:
            links.append(f'<ellipse cx="{x}" cy="{y}" rx="70" ry="42" stroke="url(#cyl)" stroke-width="26" fill="none"/>')
        else:
            links.append(f'<rect x="{x-70}" y="{y-10}" width="140" height="20" rx="10" fill="url(#cylD)"/>')
    save(name, 900, 600, f'<g transform="rotate(-18 450 300)">{"".join(links)}</g>')


def scales(name):
    b = []
    b.append('<rect x="290" y="120" width="20" height="520" fill="url(#cyl)"/>')
    b.append('<path d="M 200 660 L 400 660 L 360 620 L 240 620 Z" fill="url(#tb)"/>')
    b.append('<rect x="80" y="150" width="440" height="16" rx="8" fill="url(#cyl)" transform="rotate(-6 300 158)"/>')
    b.append('<circle cx="300" cy="120" r="26" fill="url(#ball)"/>')
    for x, y in ((100, 180), (500, 140)):
        b.append(f'<line x1="{x}" y1="{y}" x2="{x-70}" y2="{y+200}" stroke="#333" stroke-width="3"/>')
        b.append(f'<line x1="{x}" y1="{y}" x2="{x+70}" y2="{y+200}" stroke="#333" stroke-width="3"/>')
        b.append(f'<path d="M {x-90} {y+200} Q {x} {y+270} {x+90} {y+200} Z" fill="url(#ball)"/>')
    b.append('<path d="M 70 360 Q 100 330 130 360 Q 100 400 70 360 Z" fill="#00ff00"/>')
    save(name, 600, 700, ''.join(b))


def quill(name):
    b = ['<g transform="rotate(35 300 380)">']
    b.append('<path d="M 300 60 C 380 160, 390 420, 305 660 C 230 420, 230 160, 300 60 Z" fill="url(#lr)"/>')
    for i in range(40):
        y = 90 + i * 14
        w = 70 * math.sin(math.pi * (i / 40) ** 0.8)
        b.append(f'<path d="M 302 {y} Q {302-w*0.6} {y+8} {302-w} {y+30}" stroke="#555" stroke-width="2" fill="none"/>')
        b.append(f'<path d="M 302 {y} Q {302+w*0.6} {y+8} {302+w} {y+30}" stroke="#777" stroke-width="2" fill="none"/>')
    b.append('<path d="M 302 60 L 304 740" stroke="#222" stroke-width="5"/>')
    b.append('<path d="M 300 700 L 304 760 L 310 700 Z" fill="#00ff00"/>')
    b.append('</g>')
    save(name, 600, 800, ''.join(b))


def eye(name):
    b = []
    b.append('<path d="M 60 300 C 200 120, 600 120, 740 300 C 600 470, 200 470, 60 300 Z" fill="url(#ball)" stroke="#111" stroke-width="10"/>')
    b.append('<circle cx="400" cy="300" r="135" fill="#777"/>')
    for i in range(90):
        a = i / 90 * 2 * math.pi
        b.append(f'<line x1="{400+math.cos(a)*60:.0f}" y1="{300+math.sin(a)*60:.0f}" x2="{400+math.cos(a)*132:.0f}" y2="{300+math.sin(a)*132:.0f}" stroke="#333" stroke-width="2"/>')
    b.append('<circle cx="400" cy="300" r="62" fill="#00ff00"/>')
    b.append('<circle cx="400" cy="300" r="40" fill="#0a0a0a"/>')
    b.append('<ellipse cx="360" cy="260" rx="22" ry="16" fill="#fff"/>')
    b.append('<path d="M 40 290 C 200 60, 600 60, 760 290" stroke="#111" stroke-width="16" fill="none"/>')
    for i in range(22):
        t = 0.08 + i / 22 * 0.84
        x = 40 + 720 * t
        y = 290 - math.sin(math.pi * t) * 175
        b.append(f'<line x1="{x:.0f}" y1="{y:.0f}" x2="{x + (t-0.5)*40:.0f}" y2="{y-45:.0f}" stroke="#111" stroke-width="5"/>')
    save(name, 800, 600, ''.join(b))


def mask(name, horns=False):
    b = []
    if horns:
        b.append('<path d="M 150 200 C 60 120, 60 20, 110 -10 C 120 70, 170 130, 230 160 Z" fill="url(#cylD)" transform="translate(0 60)"/>')
        b.append('<path d="M 450 200 C 540 120, 540 20, 490 -10 C 480 70, 430 130, 370 160 Z" fill="url(#cylD)" transform="translate(0 60)"/>')
    b.append('<path d="M 300 120 C 430 120, 480 200, 470 340 C 460 500, 380 600, 300 610 C 220 600, 140 500, 130 340 C 120 200, 170 120, 300 120 Z" fill="url(#ball)" stroke="#222" stroke-width="5"/>')
    eye_fill = '#00ff00' if horns else '#050505'
    b.append(f'<path d="M 180 300 C 210 270, 260 270, 270 310 C 250 330, 200 330, 180 300 Z" fill="{eye_fill}"/>')
    b.append(f'<path d="M 420 300 C 390 270, 340 270, 330 310 C 350 330, 400 330, 420 300 Z" fill="{eye_fill}"/>')
    b.append('<path d="M 300 320 L 285 430 L 315 430 Z" fill="#888"/>')
    if horns:
        b.append('<path d="M 220 500 C 260 470, 340 470, 380 500 C 340 540, 260 540, 220 500 Z" fill="#050505"/>')
        b.append('<path d="M 170 250 L 270 285 M 430 250 L 330 285" stroke="#111" stroke-width="14"/>')
    else:
        b.append('<path d="M 230 500 C 270 520, 330 520, 370 500" stroke="#111" stroke-width="10" fill="none"/>')
    save(name, 600, 700, ''.join(b))


def building(name):
    b = []
    b.append('<rect x="120" y="380" width="560" height="380" fill="url(#lr)"/>')
    b.append('<rect x="320" y="120" width="160" height="640" fill="url(#cyl)"/>')
    for x in (320, 360, 400, 440, 480):
        b.append(f'<path d="M {x-12} 120 L {x} 70 L {x+12} 120 Z" fill="url(#tb)"/>')
    b.append('<path d="M 340 120 L 400 20 L 460 120 Z" fill="url(#tb)"/>')
    for row in range(3):
        for x in range(150, 660, 70):
            if 300 < x < 480:
                continue
            y = 420 + row * 110
            b.append(f'<path d="M {x} {y+80} L {x} {y+25} Q {x+20} {y} {x+40} {y+25} L {x+40} {y+80} Z" fill="#222"/>')
    for row in range(5):
        y = 160 + row * 110
        b.append(f'<path d="M 375 {y+70} L 375 {y+20} Q 400 {y} 425 {y+20} L 425 {y+70} Z" fill="#222"/>')
    b.append('<path d="M 360 760 L 360 690 Q 400 640 440 690 L 440 760 Z" fill="#0a0a0a"/>')
    b.append('<rect x="100" y="760" width="600" height="20" fill="#555"/>')
    b.append('<circle cx="400" cy="250" r="22" fill="#00ff00"/>')
    save(name, 800, 800, ''.join(b))


def skyline(name):
    rng = random.Random(3)
    b = []
    x = 20
    while x < 880:
        w = rng.randint(60, 120)
        h = rng.randint(250, 680)
        b.append(f'<rect x="{x}" y="{800-h}" width="{w}" height="{h}" fill="url(#{"lr" if rng.random()<0.5 else "cyl"})"/>')
        for yy in range(800 - h + 20, 780, 26):
            for xx in range(x + 8, x + w - 10, 16):
                c = '#00ff00' if rng.random() < 0.015 else ('#111' if rng.random() < 0.7 else '#999')
                b.append(f'<rect x="{xx}" y="{yy}" width="8" height="14" fill="{c}"/>')
        if rng.random() < 0.3:
            b.append(f'<path d="M {x+w/2-15} {800-h} L {x+w/2} {800-h-120} L {x+w/2+15} {800-h} Z" fill="url(#tb)"/>')
        x += w + rng.randint(-10, 10)
    save(name, 900, 820, ''.join(b))


def bricks(name):
    b = []
    for r in range(14):
        off = 0 if r % 2 == 0 else -50
        for c in range(10):
            x = off + c * 100
            y = r * 50
            b.append(f'<rect x="{x+3}" y="{y+3}" width="94" height="44" fill="url(#{"tb" if (r+c)%3 else "bt"})"/>')
    save(name, 900, 700, f'<rect width="900" height="700" fill="#222"/>' + ''.join(b))


def bolt(name):
    b = '<path d="M 330 40 L 140 420 L 290 420 L 210 760 L 470 300 L 310 300 L 420 40 Z" fill="url(#lr)" stroke="#111" stroke-width="8"/>'
    save(name, 600, 800, b)


def savanna(name):
    rng = random.Random(9)
    b = ['<rect x="0" y="0" width="1000" height="700" fill="#e8e8e8"/><circle cx="250" cy="300" r="110" fill="#fff"/><rect x="0" y="0" width="1000" height="520" fill="url(#bt)" opacity="0.25"/>']
    b.append('<path d="M 0 520 Q 300 490 520 510 T 1000 500 L 1000 700 L 0 700 Z" fill="url(#bt)"/>')
    for i in range(260):
        x = rng.uniform(0, 1000)
        y = rng.uniform(520, 700)
        h = rng.uniform(15, 45)
        b.append(f'<path d="M {x:.0f} {y:.0f} q {rng.uniform(-8,8):.0f} {-h/2:.0f} {rng.uniform(-14,14):.0f} {-h:.0f}" stroke="#444" stroke-width="2" fill="none"/>')
    # acacia
    b.append('<path d="M 760 520 C 765 430, 750 380, 720 330 M 760 470 C 790 400, 820 370, 860 340" stroke="#222" stroke-width="18" fill="none"/>')
    b.append('<ellipse cx="770" cy="320" rx="190" ry="45" fill="url(#ballD)"/>')
    # lone figure (small)
    b.append(f'<g transform="translate(300 470) scale(0.12)">{figure("stand")}</g>')
    # predator eyes in grass
    b.append('<ellipse cx="560" cy="590" rx="9" ry="5" fill="#00ff00"/><ellipse cx="590" cy="590" rx="9" ry="5" fill="#00ff00"/>')
    b.append('<ellipse cx="120" cy="620" rx="9" ry="5" fill="#00ff00"/><ellipse cx="148" cy="620" rx="9" ry="5" fill="#00ff00"/>')
    save(name, 1000, 700, ''.join(b))


def tribe(name):
    b = []
    b.append('<ellipse cx="500" cy="560" rx="460" ry="90" fill="url(#bt)"/>')
    # fire
    b.append('<path d="M 500 300 C 540 380, 580 420, 560 500 C 540 540, 460 540, 440 500 C 420 440, 470 400, 500 300 Z" fill="#00ff00"/>')
    b.append('<path d="M 430 530 L 570 500 M 430 500 L 570 530" stroke="#333" stroke-width="18"/>')
    for i, x in enumerate((150, 280, 720, 850)):
        s = 0.42 if i in (1, 2) else 0.36
        b.append(f'<g transform="translate({x} {380 if i in (1,2) else 400}) scale({s})">{figure("seated" if i%2 else "stand")}</g>')
    save(name, 1000, 680, ''.join(b))


def room(name):
    b = []
    b.append('<path d="M 100 80 L 900 80 L 700 250 L 300 250 Z" fill="#666"/>')
    b.append('<path d="M 100 80 L 300 250 L 300 600 L 100 780 Z" fill="url(#lr)"/>')
    b.append('<path d="M 900 80 L 700 250 L 700 600 L 900 780 Z" fill="url(#rl)"/>')
    b.append('<path d="M 300 600 L 700 600 L 900 780 L 100 780 Z" fill="url(#bt)"/>')
    b.append('<rect x="300" y="250" width="400" height="350" fill="#aaa"/>')
    b.append('<rect x="420" y="300" width="160" height="110" fill="#333"/>')
    for i in range(6):
        b.append(f'<line x1="{420+i*32}" y1="300" x2="{420+i*32}" y2="410" stroke="#777" stroke-width="5"/>')
    b.append('<rect x="320" y="470" width="360" height="20" fill="#444"/>')
    save(name, 1000, 820, ''.join(b))


def brain(name):
    rng = random.Random(5)
    out = ['<clipPath id="bc"><path d="M 150 420 C 110 250, 260 120, 450 130 C 640 120, 790 230, 760 400 C 740 500, 640 560, 520 540 C 470 580, 380 590, 320 540 C 220 540, 165 500, 150 420 Z"/></clipPath>']
    body = ['<path d="M 150 420 C 110 250, 260 120, 450 130 C 640 120, 790 230, 760 400 C 740 500, 640 560, 520 540 C 470 580, 380 590, 320 540 C 220 540, 165 500, 150 420 Z" fill="url(#ball)"/>']
    # gyri: random meandering thick strokes
    g = ['<g clip-path="url(#bc)">']
    for i in range(190):
        x, y = rng.uniform(140, 760), rng.uniform(130, 570)
        d = f'M {x:.0f} {y:.0f}'
        ang = rng.uniform(0, 6.28)
        for k in range(4):
            ang += rng.uniform(-2.2, 2.2)
            x += math.cos(ang) * 26
            y += math.sin(ang) * 26
            d += f' Q {x + rng.uniform(-25,25):.0f} {y + rng.uniform(-25,25):.0f} {x:.0f} {y:.0f}'
        g.append(f'<path d="{d}" stroke="#222" stroke-width="{rng.uniform(3,6):.0f}" fill="none" stroke-linecap="round" opacity="0.8"/>')
    g.append('<path d="M 300 470 C 380 440, 470 450, 560 500" stroke="#111" stroke-width="16" fill="none"/>')
    g.append('</g>')
    # brainstem / cerebellum
    body.append('<path d="M 560 520 C 640 520, 700 560, 660 620 C 620 650, 560 620, 540 570 Z" fill="url(#ballD)"/>')
    body.append('<path d="M 520 560 C 520 620, 530 680, 560 720 L 600 720 C 580 670, 575 620, 580 570 Z" fill="url(#cylD)"/>')
    # amygdala accent
    body.append('<ellipse cx="500" cy="470" rx="34" ry="24" fill="#00ff00"/>')
    save(name, 900, 760, ''.join(body) + ''.join(g), ''.join(out))


def lever(name):
    b = []
    b.append('<rect x="100" y="420" width="400" height="140" rx="10" fill="url(#tb)" stroke="#111" stroke-width="6"/>')
    for x in (150, 450):
        b.append(f'<circle cx="{x}" cy="490" r="14" fill="url(#ball)"/>')
    b.append('<rect x="270" y="380" width="60" height="70" fill="url(#cyl)"/>')
    b.append('<g transform="rotate(-35 300 410)"><rect x="288" y="120" width="24" height="300" fill="url(#cyl)"/><ellipse cx="300" cy="110" rx="48" ry="40" fill="url(#ballD)"/></g>')
    b.append('<circle cx="300" cy="410" r="26" fill="url(#ball)" stroke="#111" stroke-width="4"/>')
    b.append('<rect x="200" y="520" width="200" height="20" fill="#00ff00"/>')
    save(name, 600, 620, ''.join(b))


if __name__ == '__main__':
    head('head')
    head('head_brain', brain_glow=True)
    head('head_hush', mouth_band=True)
    head('head_bowed', tilt=18)
    for k in ('stand', 'coat', 'seated', 'salute', 'crossed'):
        figure_svg('fig_' + k, k)
    chain('chain_broken', broken=True)
    chain('chain')
    scales('scales')
    quill('quill')
    eye('eye')
    mask('mask')
    mask('demon', horns=True)
    building('yale')
    skyline('skyline')
    bricks('bricks')
    bolt('bolt')
    savanna('savanna')
    tribe('tribe')
    room('room')
    brain('brain')
    lever('lever')
    print('svgs written')
