"""Ranking coseno del lote recibido; una mejor vista por asset, sin HTTP."""

from numbers import Integral

from .index import validate_index
from .segmentation import ServiceUnavailableError


def search(vector, k=5, *, index=None):
    if index is None:
        raise ServiceUnavailableError("servicio no disponible: proporciona el índice de candidatos")
    if isinstance(k, bool) or not isinstance(k, Integral) or k <= 0:
        raise ValueError("k: se requiere entero mayor que cero")
    try:
        import numpy as np
    except ImportError as error:
        raise ServiceUnavailableError("servicio no disponible: falta NumPy") from error
    validate_index(index)
    query = np.asarray(vector)
    if (query.dtype.kind not in "fiu" or query.shape != (index.identity["dimension"],)
            or not np.isfinite(query).all()):
        raise ValueError("vector de consulta: dimensión/tipo/valores incompatibles")
    query = query.astype(np.float64)
    norm = float(np.linalg.norm(query))
    if not np.isfinite(norm) or norm <= 0:
        raise ValueError("vector de consulta: norma inválida")
    scores = np.clip(index.vectors @ (query / norm), -1, 1)
    ordered = sorted(zip(scores, index.rows),
                     key=lambda item: (-float(item[0]), item[1]["asset_id"], item[1]["view_id"]))
    results, seen = [], set()
    for score, row in ordered:
        if row["asset_id"] in seen:
            continue
        seen.add(row["asset_id"])
        results.append({"asset_id": row["asset_id"], "view_id": row["view_id"],
                        "similarity_score": float(score)})
        if len(results) == k:
            break
    return results
