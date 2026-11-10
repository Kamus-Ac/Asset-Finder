"""Salida de ranking compatible con los campos del borrador de contrato HTTP."""

import math
from numbers import Real

from .index import validate_index


RESULT_FIELDS = ("asset_id", "name", "thumbnail_url", "source", "source_url",
                 "license", "model_available", "model_url", "format")


def format_results(ranking, *, index):
    validate_index(index)
    if not isinstance(ranking, list):
        raise ValueError("ranking: se requiere lista")
    output, seen = [], set()
    views = {(row["asset_id"], row["view_id"]) for row in index.rows}
    for result in ranking:
        if not isinstance(result, dict):
            raise ValueError("resultado: se requiere objeto")
        asset_id = result.get("asset_id")
        if asset_id not in index.metadata or (asset_id, result.get("view_id")) not in views:
            raise ValueError("resultado sin metadatos/vista")
        if asset_id in seen:
            raise ValueError("resultado con asset duplicado")
        score = result.get("similarity_score")
        if isinstance(score, bool) or not isinstance(score, Real) or not math.isfinite(score) or not -1 <= score <= 1:
            raise ValueError("similarity_score: se requiere coseno finito -1..1")
        metadata = index.metadata[asset_id]
        row = {field: metadata.get(field) for field in RESULT_FIELDS}
        row["model_available"] = bool(metadata.get("model_available", False))
        row["model_url"] = metadata.get("model_url") if row["model_available"] else None
        row["similarity_score"] = float(score)
        seen.add(asset_id)
        output.append(row)
    return output
