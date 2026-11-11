"""Medición CPU reproducible; separa carga, inferencia calentada y caché."""

import argparse
from importlib.metadata import version
import json
from pathlib import Path
import platform
import resource
import statistics
import tempfile
import time

from .embedding import _get_model, model_identity
from .index import build_index
from .input_manifest import load_manifest, load_rgb
from .pipeline import run_search
from .resources import BASE, SAMPLE_IMAGE
from .segmentation import _get_predictor, _CHECKPOINT


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repetitions", type=int, default=3)
    parser.add_argument("--threads", type=int, default=2)
    parser.add_argument("--output", type=Path, default=BASE / "resultados/T25/metrics.json")
    args = parser.parse_args()
    if args.repetitions < 1 or args.threads < 1:
        parser.error("repetitions y threads deben ser positivos")
    import torch
    torch.set_num_threads(args.threads)
    started = time.perf_counter()
    _get_predictor("cpu", _CHECKPOINT)
    sam_load = time.perf_counter()-started
    started = time.perf_counter()
    _get_model("cpu")
    dino_load = time.perf_counter()-started
    candidates = load_manifest(BASE / "demo_data/manifest.json")
    image = load_rgb(SAMPLE_IMAGE)
    image.thumbnail((1024,1024))
    box = [222,355,430,562]
    with tempfile.TemporaryDirectory() as cache:
        started = time.perf_counter()
        index = build_index(candidates, cache_dir=Path(cache)/"candidates")
        index_time = time.perf_counter()-started
        run_search(image,candidates,box_xyxy=box,cache_dir=cache,use_query_cache=False)
        runs = [run_search(image,candidates,box_xyxy=box,cache_dir=cache,
                           use_query_cache=False).timings for _ in range(args.repetitions)]
        run_search(image,candidates,box_xyxy=box,cache_dir=cache)
        cached = run_search(image,candidates,box_xyxy=box,cache_dir=cache)
    stats = {key:{"median":statistics.median(row[key] for row in runs),
                  "min":min(row[key] for row in runs),"max":max(row[key] for row in runs)}
             for key in runs[0]}
    report = {"environment":"local_development", "device":"cpu", "python":platform.python_version(),
              "system":platform.platform(), "threads":torch.get_num_threads(),
              "packages":{name:version(name) for name in ("torch","torchvision","numpy","pillow")},
              "model":model_identity(),"load_seconds":{"sam":sam_load,"dino":dino_load},
              "candidate_count":len(index.rows),"candidate_initial_embedding_seconds":index_time,
              "warmup_runs":1,"repetitions":args.repetitions,"query_cache_during_measurement":False,
              "runs":runs,"statistics_seconds":stats,
              "cache_hit_seconds":cached.timings["total_seconds"],
              "process_peak_rss_bytes":resource.getrusage(resource.RUSAGE_SELF).ru_maxrss*1024,
              "vram_peak_bytes":None,
              "limitations":["CPU local, no servidor MSI; no acredita rendimiento CUDA",
                             "RAM pico del proceso completo, no memoria por modelo",
                             "Ranking de muestra de ocho candidatos sin etiquetas de relevancia"]}
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(report,indent=2,allow_nan=False)+"\n")
    print(json.dumps(report,indent=2,allow_nan=False))


if __name__ == "__main__":
    main()
