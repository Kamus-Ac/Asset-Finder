"""Comparación real de dos vistas de una cama frente a una silla (T13)."""

import argparse
import json
from pathlib import Path
import time

from .embedding import embed, model_identity
from .resources import BASE, sha256


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=BASE / "resultados/T13")
    args = parser.parse_args()
    import numpy as np
    import torch
    from PIL import Image
    torch.set_num_threads(2)
    sources = [
        (BASE / "sam2/notebooks/videos/bedroom/00000.jpg", (0, 450, 700, 540)),
        (BASE / "sam2/notebooks/videos/bedroom/00030.jpg", (0, 450, 700, 540)),
        (BASE / "prueba.jpeg", None),
    ]
    args.output.mkdir(parents=True, exist_ok=True)
    records, vectors = [], []
    for index, (path, box) in enumerate(sources):
        if not path.is_file():
            raise RuntimeError("servicio no disponible: faltan imágenes de la prueba T13")
        with Image.open(path) as original:
            image = original.convert("RGB")
        if box:
            image = image.crop(box)
        else:
            image.thumbnail((1024, 1024))
            image = image.crop((222, 355, 430, 562))
        started = time.perf_counter()
        vector = embed(image)
        elapsed = time.perf_counter() - started
        image.save(args.output / f"vista_{index}.png")
        vectors.append(vector)
        records.append({"source": str(path.relative_to(BASE)), "sha256": sha256(path),
                        "seconds": elapsed, "crop": box or [222,355,430,562],
                        "normalized_to": None if box else [1024,631]})
    result = {"device": "cpu", "model": model_identity(), "inputs": records,
              "same_object_cosine": float(np.dot(vectors[0], vectors[1])),
              "different_object_cosine": float(np.dot(vectors[0], vectors[2])),
              "limitations": ["Dos fotogramas del mismo video; región de la cama recortada manualmente",
                               "No es ground truth de modelos 3D ni evaluación de relevancia",
                               "Imágenes de ejemplo SAM locales; licencia de cada imagen no confirmada; no redistribuidas"]}
    (args.output / "metrics.json").write_text(json.dumps(result, indent=2)+"\n")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
