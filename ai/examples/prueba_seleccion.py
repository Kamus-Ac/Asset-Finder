"""T08: dos selecciones reales de la silla amarilla de prueba.jpeg, sin descargas."""

import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import time

import numpy as np
from PIL import Image, ImageDraw


BASE = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("asset_finder_segmentation_t08", BASE / "segmentation.py")
SEGMENTATION = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(SEGMENTATION)
CASES = {
    "caja": {"box_xyxy": [222, 355, 430, 562], "points": None},
    "puntos": {"box_xyxy": None, "points": [
        {"x": 322, "y": 390, "label": 1},
        {"x": 242, "y": 443, "label": 1},
        {"x": 411, "y": 536, "label": 1},
        {"x": 352, "y": 489, "label": 0},
        {"x": 471, "y": 447, "label": 0},
        {"x": 317, "y": 570, "label": 0},
    ]},
}


def run(output, device="cpu"):
    image_path = BASE / "examples/prueba.jpeg"
    with Image.open(image_path) as source:
        image = source.convert("RGB")
    image.thumbnail((1024, 1024))
    if image.size != (1024, 631):
        raise ValueError("T08 usa prompts para prueba.jpeg a 1024×631; revisar la imagen")
    output.mkdir(parents=True, exist_ok=True)
    pixels = np.array(image)
    report = {"image": "ai/examples/prueba.jpeg", "sha256": hashlib.sha256(image_path.read_bytes()).hexdigest(),
              "size": list(image.size), "device": device, "target": "silla amarilla visible",
              "note": "Scores brutos SAM; sin ground truth ni evaluación automática de identidad.",
              "cases": {}}
    for index, (name, prompts) in enumerate(CASES.items()):
        start = time.perf_counter()
        mask, score = SEGMENTATION.segment(image, device=device, **prompts)
        elapsed = time.perf_counter() - start
        if mask.shape != pixels.shape[:2] or not mask.any() or mask.all():
            raise RuntimeError(f"{name}: máscara vacía, completa o de tamaño incorrecto")
        mask_image = Image.fromarray(mask.astype(np.uint8) * 255)
        mask_image.save(output / f"{name}_mask.png")
        cutout = image.convert("RGBA")
        cutout.putalpha(mask_image)
        cutout.save(output / f"{name}_cutout.png")
        overlay = pixels.copy()
        overlay[mask] = (pixels[mask] * 0.5 + np.array([30, 200, 100]) * 0.5).astype(np.uint8)
        preview = Image.fromarray(overlay)
        draw = ImageDraw.Draw(preview)
        if prompts["box_xyxy"] is not None:
            draw.rectangle(prompts["box_xyxy"], outline="blue", width=2)
        for point in prompts["points"] or []:
            x, y = point["x"], point["y"]
            draw.ellipse((x-4, y-4, x+4, y+4), fill="lime" if point["label"] else "red", outline="white")
        preview.save(output / f"{name}_overlay.png")
        y, x = np.where(mask)
        report["cases"][name] = {**prompts, "score": score, "selected_pixels": int(mask.sum()),
                                   "bounds_xyxy": [int(x.min()), int(y.min()), int(x.max())+1, int(y.max())+1],
                                   "seconds": elapsed, "includes_first_model_load": index == 0}
    (output / "metrics.json").write_text(json.dumps(report, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=BASE / "resultados/T08")
    parser.add_argument("--device", choices=("cpu", "cuda"), default="cpu")
    args = parser.parse_args()
    print(json.dumps(run(args.output, args.device), ensure_ascii=False, indent=2))
