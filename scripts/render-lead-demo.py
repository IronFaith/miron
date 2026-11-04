"""Render the captioned Miron demo from the site's real lead-priority examples.

Requires Python with Pillow, Node.js, FFmpeg, and Windows Segoe UI fonts.
Run from any directory: python scripts/render-lead-demo.py
"""
from pathlib import Path
import json
import subprocess
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'dist' / 'demo'
OUT.mkdir(parents=True, exist_ok=True)
DATA = json.loads(subprocess.check_output(['node', str(ROOT / 'scripts' / 'lead-demo-data.mjs')], text=True, encoding='utf-8'))
W, H, FPS, SECONDS = 1280, 720, 30, 30
WHITE, MUTED, LINE, PANEL = '#FFFFFF', '#B1B1B1', '#333333', '#111111'
COLORS = {'hot': ('#FFC5AB', '#39241D'), 'warm': ('#F2D995', '#342D1C'), 'cold': ('#B9DEF3', '#1B2C36')}
FONTS = {}

def font(size, bold=False):
    key = (size, bold)
    if key not in FONTS:
        FONTS[key] = ImageFont.truetype('C:/Windows/Fonts/' + ('seguisb.ttf' if bold else 'segoeui.ttf'), size)
    return FONTS[key]

def text(draw, xy, value, size=24, color=WHITE, bold=False):
    draw.text(xy, value, font=font(size, bold), fill=color, anchor='lt')

def wrap(draw, xy, value, width, size=24, color=MUTED, bold=False, spacing=1.35):
    x, y = xy
    lines, line = [], ''
    for word in value.split():
        candidate = (line + ' ' + word).strip()
        if draw.textlength(candidate, font=font(size, bold)) > width and line:
            lines.append(line)
            line = word
        else:
            line = candidate
    if line:
        lines.append(line)
    for line in lines:
        text(draw, (x, y), line, size, color, bold)
        y += int(size * spacing)
    return y

logo = Image.open(ROOT / 'dist' / 'assets' / 'miron-logo-white-on-black.png').convert('RGB')
logo.thumbnail((225, 75), Image.Resampling.LANCZOS)

def base(chapter):
    image = Image.new('RGB', (W, H), '#000000')
    image.paste(logo, (58, 23))
    draw = ImageDraw.Draw(image)
    text(draw, (920, 49), 'Buyer demo  /  ' + chapter, 19, MUTED)
    draw.line((64, 112, 1216, 112), fill=LINE, width=1)
    text(draw, (64, 660), 'Sample lead. Priority uses timing and stated intent.', 18, MUTED)
    return image, draw

def badge(draw, xy, level, label=None, width=142):
    x, y = xy
    ink, background = COLORS[level]
    draw.rounded_rectangle((x, y, x+width, y+38), radius=5, fill=background, outline=ink, width=1)
    draw.ellipse((x+14, y+16, x+20, y+22), fill=ink)
    text(draw, (x+30, y+8), label or level.capitalize()+' lead', 20, ink, True)

def intro():
    image, draw = base('30 seconds')
    text(draw, (72, 155), 'Know who to', 66, bold=True)
    text(draw, (72, 230), 'contact first.', 66, bold=True)
    text(draw, (75, 335), 'The answers explain the priority.', 30, MUTED)
    for x, scenario in zip((72, 472, 872), DATA['scenarios']):
        level = scenario['level']
        draw.rounded_rectangle((x, 444, x+336, 588), radius=8, fill=PANEL, outline=LINE)
        badge(draw, (x+22, 466), level)
        text(draw, (x+22, 529), scenario['summary']['action'], 27, bold=True)
    return image

def scenario_frame(scenario, chapter):
    level = scenario['level']
    lead = scenario['summary']
    ink, background = COLORS[level]
    image, draw = base(chapter)
    text(draw, (72, 165), lead['label'], 59, ink, True)
    text(draw, (75, 258), lead['action'], 36, bold=True)
    wrap(draw, (75, 333), scenario['explanation'], 370, 29)
    wrap(draw, (75, 486), lead['next'], 370, 23)
    x, y = 510, 145
    draw.rounded_rectangle((x, y, 1208, 626), radius=10, fill=PANEL, outline=LINE)
    text(draw, (x+28, y+26), lead['name'], 33, bold=True)
    badge(draw, (1018, y+28), level, width=160)
    text(draw, (x+28, y+79), lead['address'], 20, MUTED)
    draw.line((x+28, y+125, 1180, y+125), fill=LINE)
    for row_y, label, value in [(y+153, 'Preferred timing', scenario['timeline']), (y+260, 'Selling priority', scenario['priority'])]:
        draw.rectangle((x+28, row_y, x+31, row_y+72), fill=ink)
        text(draw, (x+48, row_y), label, 19, MUTED)
        text(draw, (x+48, row_y+32), value, 30, WHITE, True)
    draw.line((x+28, y+366, 1180, y+366), fill=LINE)
    text(draw, (x+28, y+390), 'Same property. Different selling plans.', 23, MUTED)
    text(draw, (x+28, y+434), 'Buyer checks still needed', 19, ink)
    return image

def comparison():
    image, draw = base('At a glance')
    text(draw, (72, 149), 'A clear next step for every lead.', 45, bold=True)
    comparisons = [
        ('hot', 'Within 3 months', 'Clear selling intent', 'Contact first'),
        ('warm', 'More time or clarity', 'Confirm the next step', 'Follow up'),
        ('cold', 'Later or exploring', 'No near-term plan', 'Keep in touch')
    ]
    for x, (level, timing, intent, action) in zip((72, 472, 872), comparisons):
        draw.rounded_rectangle((x, 246, x+336, 585), radius=8, fill=PANEL, outline=LINE)
        badge(draw, (x+22, 270), level)
        wrap(draw, (x+22, 342), timing, 290, 29, WHITE, True)
        wrap(draw, (x+22, 412), intent, 288, 23)
        draw.line((x+22, 485, x+314, 485), fill=LINE)
        text(draw, (x+22, 517), action, 28, COLORS[level][0], True)
    return image

def verification():
    image, draw = base('Buyer checks')
    text(draw, (72, 157), 'Then confirm', 60, bold=True)
    text(draw, (72, 227), 'the details.', 60, bold=True)
    wrap(draw, (75, 331), 'Priority guides follow-up. The buyer confirms the lead.', 365, 29)
    wrap(draw, (75, 493), 'A hot label does not mean a verified seller or an approved offer.', 365, 22)
    draw.rounded_rectangle((510, 151, 1208, 612), radius=10, fill=PANEL, outline=LINE)
    text(draw, (542, 181), 'Buyer checklist', 33, bold=True)
    for row_y, label, detail in [
        (259, 'Contact and intent', 'Confirm the seller’s plans and timing.'),
        (366, 'Authority to sell', 'Confirm who can approve the sale.'),
        (473, 'Property details', 'Review condition, access, and price.')
    ]:
        draw.rounded_rectangle((544, row_y+3, 568, row_y+27), radius=3, outline='#BBBBBB', width=2)
        text(draw, (590, row_y), label, 29, bold=True)
        text(draw, (590, row_y+44), detail, 21, MUTED)
    return image

scenes = [(2, intro())]
scenes += [(6, scenario_frame(scenario, f'{index+1} of 3')) for index, scenario in enumerate(DATA['scenarios'])]
scenes += [(5, comparison()), (5, verification())]
assert sum(duration for duration, _ in scenes) == SECONDS
scenes[0][1].save(OUT / 'poster.jpg', quality=94, subsampling=0)

command = ['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pixel_format', 'rgb24',
           '-video_size', f'{W}x{H}', '-framerate', str(FPS), '-i', 'pipe:0', '-an', '-c:v', 'libx264',
           '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
           '-metadata', 'title=Miron lead priorities: hot, warm and cold', str(OUT / 'miron-lead-demo.mp4')]
process = subprocess.Popen(command, stdin=subprocess.PIPE, stderr=subprocess.PIPE)
elapsed = 0
previous = None
for duration, scene in scenes:
    for frame in range(duration*FPS):
        local_time = frame / FPS
        image = Image.blend(previous, scene, min(1, local_time/0.3)) if previous is not None and local_time < 0.3 else scene.copy()
        draw = ImageDraw.Draw(image)
        now = elapsed + local_time
        draw.rectangle((64, 701, 1216, 704), fill='#303030')
        draw.rectangle((64, 701, 64+1152*((now+1/FPS)/SECONDS), 704), fill=WHITE)
        text(draw, (1115, 660), f'{int(now):02d} / 30', 18, MUTED)
        process.stdin.write(image.tobytes())
    previous = scene
    elapsed += duration
process.stdin.close()
errors = process.stderr.read().decode('utf-8', errors='replace')
if process.wait() != 0:
    raise RuntimeError(errors)

captions = [
    ('00:00.000', '00:02.000', 'Know who to contact first. The answers explain the priority.'),
    ('00:02.000', '00:08.000', DATA['scenarios'][0]['caption']),
    ('00:08.000', '00:14.000', DATA['scenarios'][1]['caption']),
    ('00:14.000', '00:20.000', DATA['scenarios'][2]['caption']),
    ('00:20.000', '00:25.000', 'Hot: contact first. Warm: follow up. Cold: keep in touch. Priority uses timing and intent.'),
    ('00:25.000', '00:30.000', 'The buyer still confirms contact and intent, authority to sell, and property details. Priority is not verification.')
]
(OUT / 'captions.vtt').write_text('WEBVTT\n\n'+'\n\n'.join(f'{start} --> {end}\n{caption}' for start,end,caption in captions)+'\n', encoding='utf-8')
print(json.dumps({'video': str(OUT/'miron-lead-demo.mp4'), 'seconds': SECONDS, 'size_bytes': (OUT/'miron-lead-demo.mp4').stat().st_size}))
