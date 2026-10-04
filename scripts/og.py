"""Draw the social card once, from the same tokens the page uses, and write
public/assets/og.png. It is a one-time generator, not part of serving or
checking: the served site has no dependency of its own for reading it. Re-run it
only when the brand colour or the tagline changes.

    python3 scripts/og.py
"""

import pathlib

from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1200, 630
INK = "#0b1220"
TEAL = "#2fb39c"
WHITE = "#ffffff"
MUTED = "#c7d2df"
FONT_DIR = "/usr/share/fonts/liberation"
OUT = pathlib.Path(__file__).resolve().parent.parent / "public" / "assets" / "og.png"


def font(name, size):
    return ImageFont.truetype(f"{FONT_DIR}/{name}", size)


def mark(draw, x, y, scale, color):
    """The brand mark: a script, in order, decided in advance. Same geometry as
    the inline SVG: three lines of decreasing width."""
    width = int(2.6 * scale)
    for dy, length in ((6.6, 16.0), (12.0, 11.5), (17.4, 7.0)):
        draw.line(
            (
                x + 4 * scale,
                y + dy * scale,
                x + (4 + length) * scale,
                y + dy * scale,
            ),
            fill=color,
            width=width,
        )
        # Round the caps the same way stroke-linecap="round" does in the SVG.
        for cx in (x + 4 * scale, x + (4 + length) * scale):
            draw.ellipse(
                (cx - width / 2, y + dy * scale - width / 2,
                 cx + width / 2, y + dy * scale + width / 2),
                fill=color,
            )


image = Image.new("RGB", (W, H), INK)

# A soft teal glow behind the mark, so the card is not a flat rectangle.
glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ImageDraw.Draw(glow).ellipse((-320, -420, 640, 540), fill=(47, 179, 156, 90))
glow = glow.filter(ImageFilter.GaussianBlur(140))
image = Image.alpha_composite(image.convert("RGBA"), glow).convert("RGB")

draw = ImageDraw.Draw(image)

mark(draw, 80, 70, 2.6, TEAL)
draw.text((80, 155), "Pautia", font=font("LiberationSans-Bold.ttf", 104), fill=WHITE)
draw.text(
    (86, 300),
    "Un agente para el WhatsApp de tu negocio",
    font=font("LiberationSans-Regular.ttf", 42),
    fill=WHITE,
)
draw.text(
    (86, 372),
    "Responde y actúa siguiendo el flujo visual que apruebas.",
    font=font("LiberationSans-Regular.ttf", 30),
    fill=MUTED,
)
draw.text(
    (86, 414),
    "Importa chats si quieres, o crea el flujo desde cero.",
    font=font("LiberationSans-Regular.ttf", 30),
    fill=MUTED,
)
draw.rectangle((86, 520, 86 + 4, 520 + 48), fill=TEAL)
draw.text(
    (106, 528),
    "pautia.app",
    font=font("LiberationSans-Bold.ttf", 32),
    fill=MUTED,
)

image.save(OUT, "PNG", optimize=True)
print(f"wrote {OUT} ({OUT.stat().st_size} bytes)")
