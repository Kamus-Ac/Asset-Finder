"""Flujo completo local y entrada para P3; no realiza HTTP ni busca carpetas."""

import argparse
from dataclasses import dataclass, field
import json
from numbers import Integral
from pathlib import Path
import time

from .candidates import validate_candidates
from .embedding import _encode_prepared, model_identity
from .index import build_index
from .input_manifest import load_manifest, load_rgb
from .preprocess import prepare_image
from .resources import BASE, SAMPLE_IMAGE
from .results import format_results
from .search import search
from .segmentation import segment, ServiceUnavailableError
from .errors import memory_errors


@dataclass
class Outcome:
    mask: object
    crop: object
    results: list
    timings: dict
    warnings: list
    segmentation_score: float
    cache: dict
    comparison: dict = field(default_factory=dict)

    def report(self):
        return {"results": self.results, "timings": self.timings,
                "warnings": self.warnings, "segmentation_score": self.segmentation_score,
                "cache": self.cache, "comparison": self.comparison, "model": model_identity()}


@memory_errors
def run_search(image, candidates, *, box_xyxy=None, points=None, k=5,
               device="cpu", cache_dir=None, use_query_cache=True, candidate_limit=None):
    """SAM → recorte → DINO → ranking del lote suministrado en memoria."""
    if isinstance(k, bool) or not isinstance(k, Integral) or k <= 0:
        raise ValueError("k: se requiere entero mayor que cero")
    if candidate_limit is not None and (isinstance(candidate_limit,bool)
            or not isinstance(candidate_limit,Integral) or candidate_limit <= 0):
        raise ValueError("candidate_limit: se requiere entero mayor que cero")
    if device not in ("cpu", "cuda"):
        raise ValueError("device debe ser cpu o cuda")
    if device == "cuda":
        try:
            import torch
        except ImportError as error:
            raise ServiceUnavailableError("servicio no disponible: falta PyTorch") from error
        if not torch.cuda.is_available():
            raise ServiceUnavailableError("servicio no disponible: CUDA no accesible")
    validate_candidates(candidates)
    available = len(candidates)
    requested = available if candidate_limit is None else int(candidate_limit)
    candidates = candidates[:requested]
    started = time.perf_counter()
    def compute():
        timings = {}
        stage = time.perf_counter()
        mask, score = segment(image, box_xyxy, points, device=device)
        timings["segment_seconds"] = time.perf_counter() - stage
        stage = time.perf_counter()
        crop = prepare_image(image, mask)
        timings["prepare_seconds"] = time.perf_counter() - stage
        stage = time.perf_counter()
        vector = _encode_prepared(crop, device=device)
        timings["embed_seconds"] = time.perf_counter() - stage
        return mask, score, crop, vector, timings
    query_hit = False
    if cache_dir is not None and use_query_cache:
        from .query_cache import query_result
        query, query_hit = query_result(image, box_xyxy, points, device,
                                        Path(cache_dir)/"queries", compute)
    else:
        query = compute()
    mask, score, crop, vector, timings = query
    stage = time.perf_counter()
    candidate_cache = Path(cache_dir) / "candidates" if cache_dir is not None else None
    index = build_index(candidates, device=device, cache_dir=candidate_cache)
    if candidates and not index.rows:
        raise ServiceUnavailableError("servicio no disponible: ningún candidato tiene imagen válida")
    timings["index_seconds"] = time.perf_counter() - stage
    stage = time.perf_counter()
    results = format_results(search(vector, k, index=index), index=index)
    timings["search_seconds"] = time.perf_counter() - stage
    timings["total_seconds"] = time.perf_counter() - started
    return Outcome(mask, crop, results, timings, index.errors, score,
                   {"query_hit": query_hit, "candidate_hits": index.cache_hits, "candidate_misses": index.cache_misses},
                   {"requested": requested, "available": available, "selected": len(candidates),
                    "compared": len({row["asset_id"] for row in index.rows}),
                    "views": len(index.rows), "requested_results": int(k), "returned_results": len(results)})


def save_outcome(outcome, image, directory):
    import numpy as np
    from PIL import Image
    from .service import mask_to_png
    directory = Path(directory)
    directory.mkdir(parents=True, exist_ok=True)
    (directory / "mask.png").write_bytes(mask_to_png(outcome.mask))
    outcome.crop.save(directory / "crop.png")
    pixels = np.asarray(image).copy()
    pixels[outcome.mask] = (pixels[outcome.mask] * 0.55 + np.array([40,220,130])*0.45).astype(np.uint8)
    Image.fromarray(pixels).save(directory / "overlay.png")
    (directory / "report.json").write_text(json.dumps(outcome.report(), ensure_ascii=False,
                                                    indent=2, allow_nan=False)+"\n")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--image", type=Path, default=SAMPLE_IMAGE)
    parser.add_argument("--manifest", type=Path, default=BASE / "demo_data/manifest.json")
    parser.add_argument("--box", nargs=4, type=float)
    parser.add_argument("--points", help="Lista JSON de {x,y,label}")
    parser.add_argument("--k", type=int, default=5)
    parser.add_argument("--candidate-limit", type=int, help="Máximo de candidatos del lote que se compararán")
    parser.add_argument("--device", choices=("cpu", "cuda"), default="cpu")
    parser.add_argument("--threads", type=int, default=2)
    parser.add_argument("--output", type=Path, default=BASE / "resultados/demo")
    parser.add_argument("--no-cache", action="store_true")
    args = parser.parse_args()
    if args.threads < 1:
        parser.error("threads debe ser positivo")
    import torch
    torch.set_num_threads(args.threads)
    image = load_rgb(args.image)
    image.thumbnail((1024, 1024))
    points = json.loads(args.points) if args.points else None
    box = args.box
    if box is None and not points:
        if args.image.resolve() != SAMPLE_IMAGE.resolve():
            parser.error("Indica --box o --points en píxeles de la imagen normalizada a máximo 1024")
        box = [222,355,430,562]
    outcome = run_search(image, load_manifest(args.manifest), box_xyxy=box, points=points,
                         k=args.k, candidate_limit=args.candidate_limit,
                         device=args.device, cache_dir=None if args.no_cache else BASE / "cache")
    save_outcome(outcome, image, args.output)
    print(json.dumps(outcome.report(), ensure_ascii=False, indent=2, allow_nan=False))
    print("Archivos:", args.output.resolve())


if __name__ == "__main__":
    main()
