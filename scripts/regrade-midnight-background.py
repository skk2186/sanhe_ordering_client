from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "public/images/ui/midnight-station"
WIDTH, HEIGHT = 3840, 1080


def smoothstep(start: float, end: float, value: np.ndarray) -> np.ndarray:
    amount = np.clip((value - start) / (end - start), 0, 1)
    return amount * amount * (3 - 2 * amount)


def warm_night(image: Image.Image) -> Image.Image:
    if image.size != (WIDTH, HEIGHT):
        raise ValueError(f"Expected {WIDTH}x{HEIGHT}, got {image.size}")

    rgba = image.mode == "RGBA"
    source = np.asarray(image.convert("RGBA" if rgba else "RGB"), dtype=np.float32)
    rgb = source[..., :3]

    # Keep the night sky deep. Extend existing station light gently over the
    # rail corridor and wet platform instead of applying a frame-wide filter.
    y = np.linspace(0, 1, HEIGHT, dtype=np.float32)[:, None]
    horizon_light = np.exp(-np.square((y - 0.48) / 0.2))
    platform_light = smoothstep(0.48, 0.72, y) * (1 - smoothstep(0.96, 1.05, y))
    illumination = 0.02 + 0.32 * horizon_light + 0.48 * platform_light

    luma = rgb[..., 0] * 0.2126 + rgb[..., 1] * 0.7152 + rgb[..., 2] * 0.0722
    detail = smoothstep(3, 42, luma) * np.power(np.clip(1 - luma / 200, 0, 1), 1.12)
    light = illumination * detail

    adjusted = rgb * (1 + illumination[..., None] * 0.32) + light[..., None] * np.array([34, 22, 4], dtype=np.float32)
    adjusted[..., 0] += light * 9
    adjusted[..., 1] += light * 4
    source[..., :3] = np.clip(adjusted, 0, 255)

    result = Image.fromarray(np.rint(source).astype(np.uint8), "RGBA" if rgba else "RGB")
    if rgba:
        original_alpha = np.asarray(image.getchannel("A"))
        result.putalpha(Image.fromarray(original_alpha, "L"))
    return result


for source_name, target_name in (
    ("background-v3-rear.png", "background-v4-warm-rear.png"),
    ("background-v3-foreground.png", "background-v4-warm-foreground.png"),
):
    source_path = ASSET_DIR / source_name
    target_path = ASSET_DIR / target_name
    with Image.open(source_path) as source:
        converted = warm_night(source)
        converted.save(target_path, optimize=True)
        print(f"{source_name} -> {target_name}: {converted.size} {converted.mode}")
