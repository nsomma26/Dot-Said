#!/usr/bin/env python3
"""Esporta lo sfondo stellato di Dot said in PNG ad alta risoluzione."""

from __future__ import annotations

import math
import random
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "sfondo-dot-said.png"

# 4K 16:9 — qualità massima per presentazioni/proiezione.
WIDTH = 3840
HEIGHT = 2160

STAR_COUNT = 10000
FIELD_SPREAD = 2000
CAMERA_Z = 8.2
FOV = 80
SIZE_SCALE = 1.55
OPACITY = 0.86
BG = (10, 14, 26)
SEED = 20260318


def make_star_color(roll: float) -> tuple[int, int, int]:
    if roll < 0.52:
        lum = 0.68 + random.random() * 0.28
        return (
            int(min(255, lum * 255)),
            int(min(255, lum * 255)),
            int(min(255, (lum + random.random() * 0.08) * 255)),
        )
    if roll < 0.78:
        return (
            int((0.78 + random.random() * 0.16) * 255),
            int((0.88 + random.random() * 0.1) * 255),
            int((0.98 + random.random() * 0.02) * 255),
        )
    if roll < 0.9:
        return (
            int((0.94 + random.random() * 0.06) * 255),
            int((0.88 + random.random() * 0.1) * 255),
            int((0.78 + random.random() * 0.14) * 255),
        )
    return (
        int((0.84 + random.random() * 0.1) * 255),
        int((0.94 + random.random() * 0.06) * 255),
        255,
    )


def project(x: float, y: float, z: float) -> tuple[float, float, float] | None:
    view_z = CAMERA_Z - z
    if view_z <= 0.02:
        return None
    aspect = WIDTH / HEIGHT
    scale = 1.0 / math.tan(math.radians(FOV) / 2.0)
    ndc_x = (x / view_z) * scale / aspect
    ndc_y = (y / view_z) * scale
    px = (ndc_x * 0.5 + 0.5) * WIDTH
    py = (-ndc_y * 0.5 + 0.5) * HEIGHT
    return px, py, view_z


def point_size_px(star_size: float, view_z: float) -> float:
    return max(star_size * SIZE_SCALE * (300.0 / view_z), 1.1)


def write_png_rgba(path: Path, width: int, height: int, pixels: bytearray) -> None:
    def chunk(tag: bytes, data: bytes) -> bytes:
        crc = zlib.crc32(tag + data) & 0xFFFFFFFF
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", crc)

    raw = bytearray()
    stride = width * 4
    for y in range(height):
        raw.append(0)
        start = y * stride
        raw.extend(pixels[start : start + stride])

    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(bytes(raw), 9)) + chunk(b"IEND", b"")
    path.write_bytes(png)


def export_with_pillow(path: Path) -> None:
    from PIL import Image, ImageDraw

    random.seed(SEED)
    stars: list[tuple[float, float, float, float, tuple[int, int, int]]] = []

    for _ in range(STAR_COUNT):
        x = (random.random() - 0.5) * FIELD_SPREAD
        y = (random.random() - 0.5) * FIELD_SPREAD
        z = (random.random() - 0.5) * FIELD_SPREAD
        size = 0.55 + (random.random() ** 1.35) * 3.4
        color = make_star_color(random.random())
        projected = project(x, y, z)
        if projected is None:
            continue
        px, py, view_z = projected
        if px < -80 or px > WIDTH + 80 or py < -80 or py > HEIGHT + 80:
            continue
        radius = point_size_px(size, view_z) * 0.5
        stars.append((px, py, radius, view_z, color))

    stars.sort(key=lambda item: item[2])

    base = Image.new("RGBA", (WIDTH, HEIGHT), BG + (255,))
    layer = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer, "RGBA")

    for px, py, radius, _view_z, color in stars:
        r = max(radius, 0.6)
        alpha = int(255 * OPACITY)
        inner = (
            color[0],
            color[1],
            color[2],
            alpha,
        )
        outer = (
            color[0],
            color[1],
            color[2],
            0,
        )
        bbox = (px - r, py - r, px + r, py + r)
        draw.ellipse(bbox, fill=outer)
        draw.ellipse(
            (px - r * 0.45, py - r * 0.45, px + r * 0.45, py + r * 0.45),
            fill=inner,
        )

    result = Image.alpha_composite(base, layer).convert("RGB")
    result.save(path, format="PNG", optimize=False, compress_level=1)


def export_fallback(path: Path) -> None:
    random.seed(SEED)
    pixels = bytearray([BG[0], BG[1], BG[2], 255] * (WIDTH * HEIGHT))

    def set_pixel(x: int, y: int, r: int, g: int, b: int, a: int) -> None:
        if x < 0 or y < 0 or x >= WIDTH or y >= HEIGHT:
            return
        idx = (y * WIDTH + x) * 4
        alpha = a / 255.0
        inv = 1.0 - alpha
        pixels[idx] = int(pixels[idx] * inv + r * alpha)
        pixels[idx + 1] = int(pixels[idx + 1] * inv + g * alpha)
        pixels[idx + 2] = int(pixels[idx + 2] * inv + b * alpha)
        pixels[idx + 3] = 255

    stars = []
    for _ in range(STAR_COUNT):
        x = (random.random() - 0.5) * FIELD_SPREAD
        y = (random.random() - 0.5) * FIELD_SPREAD
        z = (random.random() - 0.5) * FIELD_SPREAD
        size = 0.55 + (random.random() ** 1.35) * 3.4
        color = make_star_color(random.random())
        projected = project(x, y, z)
        if projected is None:
            continue
        px, py, view_z = projected
        radius = point_size_px(size, view_z) * 0.5
        stars.append((px, py, radius, color))

    stars.sort(key=lambda item: item[2])

    for px, py, radius, color in stars:
        r = max(int(radius), 1)
        cx = int(round(px))
        cy = int(round(py))
        alpha = int(255 * OPACITY)
        for dy in range(-r, r + 1):
            for dx in range(-r, r + 1):
                dist = math.hypot(dx, dy)
                if dist > r:
                    continue
                falloff = max(0.0, 1.0 - (dist / r) ** 1.6)
                set_pixel(cx + dx, cy + dy, color[0], color[1], color[2], int(alpha * falloff))

    write_png_rgba(path, WIDTH, HEIGHT, pixels)


def main() -> None:
    try:
        from PIL import Image  # noqa: F401

        export_with_pillow(OUTPUT)
        engine = "Pillow"
    except ImportError:
        export_fallback(OUTPUT)
        engine = "fallback"

    size_kb = OUTPUT.stat().st_size / 1024
    print(f"Salvato: {OUTPUT}")
    print(f"Dimensioni: {WIDTH}x{HEIGHT}px | Motore: {engine} | Peso: {size_kb:.1f} KB")


if __name__ == "__main__":
    main()
