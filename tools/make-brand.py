from PIL import Image
from pathlib import Path

src_v = Path(r'C:\Users\JDonovan151\.cursor\projects\c-Users-JDonovan151-football\assets\c__Users_JDonovan151_AppData_Roaming_Cursor_User_workspaceStorage_9fb421f8b8351353ebc62a218ff166bb_images_FootballLOGOvert-9d87b8c2-deda-41d8-b8fe-dc32e4698463.png')
src_h = Path(r'C:\Users\JDonovan151\.cursor\projects\c-Users-JDonovan151-football\assets\c__Users_JDonovan151_AppData_Roaming_Cursor_User_workspaceStorage_9fb421f8b8351353ebc62a218ff166bb_images_footballLOGhorizontal-0c8797d2-d2df-4ae1-8352-570d70bddcd1.png')
root = Path(r'C:\Users\JDonovan151\football')
out = root / 'brand'
icons = root / 'icons'
out.mkdir(exist_ok=True)


def save_resized(img, path, max_w=None, max_h=None):
    w, h = img.size
    scale = 1.0
    if max_w and w > max_w:
        scale = min(scale, max_w / w)
    if max_h and h > max_h:
        scale = min(scale, max_h / h)
    if scale < 1:
        img = img.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)
    img.save(path, 'PNG', optimize=True)
    print(path.name, img.size, path.stat().st_size)
    return img


v = Image.open(src_v).convert('RGBA')
h = Image.open(src_h).convert('RGBA')
print('src vert', v.size, 'horiz', h.size)

save_resized(v, out / 'logo-vert.png', max_w=900, max_h=1400)
save_resized(h, out / 'logo-horiz.png', max_w=720, max_h=220)
save_resized(h, out / 'logo-horiz-sm.png', max_w=360, max_h=96)

vw, vh = v.size
side = int(min(vw, vh * 0.58))
left = (vw - side) // 2
top = int(vh * 0.04)
crest = v.crop((left, top, left + side, top + side))
for size, name in [(192, 'icon-192.png'), (512, 'icon-512.png'), (180, 'apple-touch-icon.png')]:
    icon = Image.new('RGBA', (size, size), (10, 22, 40, 255))
    c = crest.resize((size, size), Image.Resampling.LANCZOS)
    icon.paste(c, (0, 0), c)
    dest = icons / name
    icon.convert('RGB').save(dest, 'PNG', optimize=True)
    print(name, size, dest.stat().st_size)
