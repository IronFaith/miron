"""Render the 30-second seller walkthrough. Requires Pillow, FFmpeg, and Segoe UI."""
from pathlib import Path
import json
import subprocess
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'dist' / 'selling'
OUT.mkdir(parents=True, exist_ok=True)
W, H, FPS, SECONDS = 1280, 720, 30, 30
WHITE, MUTED, LINE, PANEL = '#FFFFFF', '#B1B1B1', '#333333', '#111111'
FONTS = {}

def font(size, bold=False):
    key = (size, bold)
    if key not in FONTS:
        FONTS[key] = ImageFont.truetype('C:/Windows/Fonts/' + ('seguisb.ttf' if bold else 'segoeui.ttf'), size)
    return FONTS[key]

def text(draw, xy, value, size=24, color=WHITE, bold=False):
    draw.text(xy, value, font=font(size, bold), fill=color, anchor='lt')

def wrap(draw, xy, value, width, size=24, color=MUTED, bold=False):
    x, y = xy
    line = ''
    for word in value.split():
        candidate = (line + ' ' + word).strip()
        if line and draw.textlength(candidate, font=font(size, bold)) > width:
            text(draw, (x, y), line, size, color, bold)
            y += int(size * 1.4)
            line = word
        else:
            line = candidate
    text(draw, (x, y), line, size, color, bold)

logo = Image.open(ROOT / 'dist' / 'assets' / 'miron-logo-white-on-black.png').convert('RGB')
logo.thumbnail((225, 75), Image.Resampling.LANCZOS)

def base(chapter):
    image = Image.new('RGB', (W, H), '#000000')
    image.paste(logo, (58, 23))
    draw = ImageDraw.Draw(image)
    text(draw, (905, 49), chapter, 20, MUTED)
    draw.line((64, 112, 1216, 112), fill=LINE)
    text(draw, (64, 660), 'Your home. Your next chapter.', 20, MUTED)
    return image, draw

def intro():
    image, draw = base('Selling, made clearer')
    text(draw, (72, 160), 'Sell your home.', 69, bold=True)
    text(draw, (72, 242), 'Skip the repairs.', 69, bold=True)
    text(draw, (76, 347), 'See the next steps in 30 seconds.', 29, MUTED)
    for x, number, label in [(72, '01', 'Share your plans'), (472, '02', 'Consider an offer'), (872, '03', 'Plan your move')]:
        draw.rounded_rectangle((x, 450, x+336, 592), radius=8, fill=PANEL, outline=LINE)
        text(draw, (x+22, 469), number, 20, MUTED)
        text(draw, (x+22, 523), label, 28, bold=True)
    return image

def step(number, title, description, card_title, rows, note):
    image, draw = base('Step ' + number + ' of 3')
    text(draw, (72, 163), '0' + number, 23, MUTED)
    for y, line in zip((224, 289), title):
        text(draw, (72, y), line, 53, bold=True)
    wrap(draw, (76, 396), description, 410, 27)
    draw.rounded_rectangle((548, 158, 1208, 606), radius=10, fill=PANEL, outline=LINE)
    text(draw, (580, 190), card_title, 29, bold=True)
    for y, (label, value) in zip((262, 355, 448), rows):
        draw.line((580, y-15, 1176, y-15), fill=LINE)
        text(draw, (580, y), label, 18, MUTED)
        text(draw, (580, y+30), value, 27, bold=True)
    text(draw, (580, 558), note, 19, MUTED)
    return image

def ending():
    image, draw = base('Your next step')
    text(draw, (72, 170), 'Ready to explore', 66, bold=True)
    text(draw, (72, 249), 'what’s possible?', 66, bold=True)
    text(draw, (76, 358), 'Start with a few quick answers.', 31, MUTED)
    draw.rounded_rectangle((76, 452, 326, 528), radius=6, fill=WHITE)
    text(draw, (144, 474), 'Sell now', 28, '#000000', True)
    text(draw, (363, 477), 'or call for help', 27)
    text(draw, (76, 569), 'No obligation to accept an offer.', 25, MUTED)
    return image

scenes = [
    (4, intro()),
    (7, step('1', ['Tell us about', 'your home.'], 'Your priorities. Your property. Your timing. A few taps to get started.', 'Start with what matters to you', [('YOUR PRIORITY', 'Avoiding repairs'), ('YOUR TIMING', 'Within 1–3 months'), ('YOUR HOME', 'A few updates')], 'Illustrative answers. Choose what fits you.')),
    (9, step('2', ['Consider a', 'cash offer.'], 'Miron reviews the property. If it’s a fit, discuss an offer and the details.', 'Understand the offer', [('THE PROPERTY', 'Condition and renovation needs'), ('THE PRICE', 'Location and comparable sales'), ('THE TERMS', 'Costs and what you would receive')], 'Ask questions before deciding.')),
    (7, step('3', ['Plan your', 'next chapter.'], 'If you accept, agree on a closing date and work through the sale details.', 'If you choose to move forward', [('01 / REVIEW', 'Understand the written agreement'), ('02 / PLAN', 'Agree on the closing date'), ('03 / COMPLETE', 'Work through the closing details')], 'Timing depends on the property and terms.')),
    (3, ending())
]
assert sum(duration for duration, _ in scenes) == SECONDS
scenes[0][1].save(OUT / 'poster.jpg', quality=94, subsampling=0)
command = ['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pixel_format', 'rgb24',
           '-video_size', f'{W}x{H}', '-framerate', str(FPS), '-i', 'pipe:0', '-an', '-c:v', 'libx264',
           '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
           '-metadata', 'title=Selling to Miron: your next steps', str(OUT / 'miron-seller-walkthrough.mp4')]
process = subprocess.Popen(command, stdin=subprocess.PIPE, stderr=subprocess.PIPE)
elapsed, previous = 0, None
for duration, scene in scenes:
    for frame in range(duration * FPS):
        local_time = frame / FPS
        image = Image.blend(previous, scene, min(1, local_time / 0.3)) if previous is not None and local_time < 0.3 else scene.copy()
        draw = ImageDraw.Draw(image)
        now = elapsed + local_time
        draw.rectangle((64, 701, 1216, 704), fill=LINE)
        draw.rectangle((64, 701, 64+1152*((now+1/FPS)/SECONDS), 704), fill=WHITE)
        text(draw, (1115, 660), f'{int(now):02d} / 30', 18, MUTED)
        process.stdin.write(image.tobytes())
    previous, elapsed = scene, elapsed + duration
process.stdin.close()
errors = process.stderr.read().decode('utf-8', errors='replace')
if process.wait() != 0:
    raise RuntimeError(errors)

captions = [
    ('00:00.000', '00:04.000', 'Sell your home. Skip the repairs. See the next steps in 30 seconds.'),
    ('00:04.000', '00:11.000', 'Tell us about your home, priorities, and timing. A few taps to get started.'),
    ('00:11.000', '00:20.000', 'Miron reviews the property. If it’s a fit, discuss a cash offer, costs, and terms. Ask questions before deciding.'),
    ('00:20.000', '00:27.000', 'If you accept, agree on a closing date and work through the sale details. Timing depends on the property and terms.'),
    ('00:27.000', '00:30.000', 'Start with a few quick answers or call for help. No obligation to accept an offer.')
]
(OUT / 'captions.vtt').write_text('WEBVTT\n\n'+'\n\n'.join(f'{start} --> {end}\n{caption}' for start, end, caption in captions)+'\n', encoding='utf-8')
print(json.dumps({'seconds': SECONDS, 'size_bytes': (OUT / 'miron-seller-walkthrough.mp4').stat().st_size}))
