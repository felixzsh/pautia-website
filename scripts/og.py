"""Draw the social card once, from the same tokens the page uses, and write
public/assets/og.png. It is a one-time generator, not part of serving or
checking: the page itself has no build step and no dependency. Re-run it only
when the brand colour or the tagline changes.

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
    """The brand mark: a lamp and its beam, same geometry as the inline SVG."""
    draw.ellipse(
        (x + 8.4 * scale, y, x + 15.6 * scale, y + 5.2 * scale), fill=color
    )
    draw.polygon(
        [
            (x + 12 * scale, y + 3.3 * scale),
            (x + 3.6 * scale, y + 14.8 * scale),
            (x + 20.4 * scale, y + 14.8 * scale),
        ],
        fill=color,
    )
    for x1, x2 in ((2.4, 6.2), (21.6, 17.8)):
        draw.line(
            (x + x1 * scale, y + 6.4 * scale, x + x2 * scale, y + 7.0 * scale),
            fill=color,
            width=int(1.4 * scale),
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
