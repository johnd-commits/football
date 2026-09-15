from PIL import Image
from collections import deque
import os

src = r'C:\Users\JDonovan151\.cursor\projects\c-Users-JDonovan151-football\assets\c__Users_JDonovan151_AppData_Roaming_Cursor_User_workspaceStorage_9fb421f8b8351353ebc62a218ff166bb_images_players-e12eeebc-365d-4472-8842-ef9fbc3cb293.png'
im = Image.open(src).convert('RGBA')
w, h = im.size
px = im.load()

def is_gray(c):
    r, g, b, a = c
    return abs(r - 70) < 32 and abs(g - 70) < 32 and abs(b - 70) < 32

def is_white(c):
    r, g, b, a = c
    return r > 232 and g > 232 and b > 232

def is_black(c):
    r, g, b, a = c
    return r < 18 and g < 18 and b < 18

def row_content(y):
    n = 0
    tot = 0
    for x in range(0, w, 2):
        c = px[x, y]
        tot += 1
        if not (is_gray(c) or is_white(c) or is_black(c)):
            n += 1
    return n / tot > 0.04

front_ys = [y for y in range(int(h * 0.45)) if row_content(y)]
back_ys = [y for y in range(int(h * 0.55), h) if row_content(y)]
print('front rows', front_ys[0], front_ys[-1], 'back', back_ys[0], back_ys[-1])

def flood(img, pred, seeds):
    p = img.load()
    ww, hh = img.size
    q = deque(seeds)
    seen = set()
    while q:
        x, y = q.popleft()
        if (x, y) in seen or x < 0 or y < 0 or x >= ww or y >= hh:
            continue
        seen.add((x, y))
        if not pred(p[x, y]):
            continue
        p[x, y] = (0, 0, 0, 0)
        q.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))

def slice_rows(y0, y1):
    out = im.crop((0, y0, w, y1)).convert('RGBA')
    return out

def finish(img, front):
    ww, hh = img.size
    p = img.load()
    if front:
        flood(img, is_gray, [(x, 0) for x in range(ww)] + [(x, hh - 1) for x in range(ww)] +
              [(0, y) for y in range(hh)] + [(ww - 1, y) for y in range(hh)])
        flood(img, is_white, [(x, 0) for x in range(ww)] + [(0, y) for y in range(hh)] + [(ww - 1, y) for y in range(hh)])
    else:
        flood(img, is_white, [(x, 0) for x in range(ww)] +
              [(0, y) for y in range(int(hh * 0.2))] + [(ww - 1, y) for y in range(int(hh * 0.2))] +
              [(x, hh - 1) for x in range(0, int(ww * 0.22))] +
              [(x, hh - 1) for x in range(int(ww * 0.78), ww)])
        flood(img, is_black, [(x, 0) for x in range(ww)] + [(0, y) for y in range(hh)] + [(ww - 1, y) for y in range(hh)])
        flood(img, is_gray, [(x, 0) for x in range(ww)])
    bbox = img.getbbox()
    pad = 4
    bbox = (max(0, bbox[0] - pad), max(0, bbox[1] - pad),
            min(ww, bbox[2] + pad), min(hh, bbox[3] + pad))
    crop = img.crop(bbox)
    nh = 512
    nw = max(1, int(round(crop.width * nh / crop.height)))
    return crop.resize((nw, nh), Image.Resampling.LANCZOS)

front = finish(slice_rows(front_ys[0] - 4, front_ys[-1] + 8), True)
back = finish(slice_rows(back_ys[0] - 4, back_ys[-1] + 8), False)

def to_white(img):
    p = img.load()
    ww, hh = img.size
    out = img.copy()
    q = out.load()
    helm = int(hh * 0.30)
    for y in range(hh):
        for x in range(ww):
            r, g, b, a = p[x, y]
            if a < 30:
                continue
            luma = (r + g + b) / 3.0
            if luma > 155:
                continue
            if r > g + 10 and r > b + 6 and r > 55:
                continue
            if y < helm and luma < 45 and abs(r - g) < 18:
                continue
            if r < 130:
                q[x, y] = (236, 239, 244, a)
    return out

out_dir = os.path.join(os.path.dirname(__file__), '..', 'sprites')
os.makedirs(out_dir, exist_ok=True)
front.save(os.path.join(out_dir, 'blue-front.png'))
back.save(os.path.join(out_dir, 'blue-back.png'))
to_white(front).save(os.path.join(out_dir, 'white-front.png'))
to_white(back).save(os.path.join(out_dir, 'white-back.png'))
print('front', front.size, 'back', back.size)
