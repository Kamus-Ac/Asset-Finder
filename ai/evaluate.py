"""Evaluar consultas etiquetadas cuando el equipo entregue referencias reales."""

import argparse
import json
from pathlib import Path

from .input_manifest import load_manifest, load_rgb
from .pipeline import run_search
from .resources import BASE


def evaluate_queries(queries, candidates, *, device="cpu", cache_dir=None):
    if not isinstance(queries, list):
        raise ValueError("queries: se requiere lista")
    counts = {"positive_queries":0,"without_known_match":0,"unlabelled_queries":0,
              "top1_hits":0,"top5_hits":0,"failed_queries":0}
    records, seen = [], set()
    for query in queries:
        if not isinstance(query, dict):
            raise ValueError("query: se requiere objeto")
        query_id = query.get("query_id")
        if not isinstance(query_id,str) or not query_id.strip() or query_id in seen:
            raise ValueError("query_id ausente o duplicado")
        seen.add(query_id)
        relevant = query.get("relevant_asset_ids")
        if relevant is not None and (not isinstance(relevant,list)
                or any(not isinstance(x,str) or not x.strip() for x in relevant)):
            raise ValueError("relevant_asset_ids: lista de IDs o null")
        category = "unlabelled_queries" if relevant is None else "positive_queries" if relevant else "without_known_match"
        counts[category] += 1
        try:
            outcome = run_search(query.get("image"),candidates,box_xyxy=query.get("box_xyxy"),
                                 points=query.get("points"),k=5,device=device,cache_dir=cache_dir)
            ids = [item["asset_id"] for item in outcome.results]
            record = {"query_id":query_id,"relevant_asset_ids":relevant,
                      "results":outcome.results,"timings":outcome.timings,"warnings":outcome.warnings}
            if relevant:
                record["top1_hit"] = bool(ids and ids[0] in relevant)
                record["top5_hit"] = bool(set(ids[:5]).intersection(relevant))
                counts["top1_hits"] += int(record["top1_hit"])
                counts["top5_hits"] += int(record["top5_hit"])
            records.append(record)
        except (ValueError, RuntimeError) as error:
            counts["failed_queries"] += 1
            records.append({"query_id":query_id,"relevant_asset_ids":relevant,"error":str(error)})
    return {"schema_version":1,"device":device,"counts":counts,"queries":records,
            "limitations":["Coseno no es porcentaje de acierto",
                           "Consultas sin etiquetas o sin coincidencia conocida no suman aciertos",
                           "Fallar una consulta positiva no elimina su denominador"]}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--queries",type=Path,required=True)
    parser.add_argument("--manifest",type=Path,default=BASE/"demo_data/manifest.json")
    parser.add_argument("--device",choices=("cpu","cuda"),default="cpu")
    parser.add_argument("--output",type=Path,default=BASE/"resultados/evaluation.json")
    args = parser.parse_args()
    import torch
    torch.set_num_threads(2)
    path = args.queries.resolve()
    payload = json.loads(path.read_text())
    if payload.get("schema_version") != 1 or not isinstance(payload.get("queries"),list):
        parser.error("Se requiere schema_version 1 y queries")
    queries = []
    for item in payload["queries"]:
        query = dict(item)
        image_path = path.parent.joinpath(item["image_path"]).resolve()
        if not image_path.is_relative_to(path.parent):
            parser.error("Las imágenes deben estar dentro del paquete de consultas")
        query["image"] = load_rgb(image_path)
        queries.append(query)
    report = evaluate_queries(queries,load_manifest(args.manifest),device=args.device,cache_dir=BASE/"cache")
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(report,ensure_ascii=False,indent=2,allow_nan=False)+"\n")
    print(json.dumps(report["counts"],indent=2))
    raise SystemExit(1 if report["counts"]["failed_queries"] else 0)


if __name__ == "__main__":
    main()
