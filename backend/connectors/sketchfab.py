"""Sketchfab public search, paginated without following provider-supplied URLs."""
import httpx
from fastapi import HTTPException


async def search_sketchfab(q: str, candidate_limit=10, max_pages=3):
    results, seen, warnings = [], set(), []
    cursor = None
    exhausted = False
    async with httpx.AsyncClient(timeout=20, headers={"User-Agent": "AssetFinder/1.0"}) as client:
        for _ in range(max_pages):
            count = 24 if candidate_limit is None else min(24, candidate_limit - len(results))
            if count <= 0:
                break
            params = {"type": "models", "q": q, "count": count}
            if cursor:
                params["cursor"] = cursor
            try:
                response = await client.get("https://api.sketchfab.com/v3/search", params=params)
                response.raise_for_status()
                data = response.json()
                if not isinstance(data, dict) or not isinstance(data.get("results"), list):
                    raise ValueError("Respuesta inválida")
            except (httpx.HTTPError, ValueError) as error:
                if not results:
                    raise HTTPException(502, "No se pudo consultar Sketchfab.") from error
                warnings.append("Sketchfab interrumpió la paginación; resultados parciales.")
                break
            for model in data["results"]:
                uid = model.get("uid")
                if not isinstance(uid, str) or uid in seen:
                    continue
                seen.add(uid)
                images = [im for im in model.get("thumbnails", {}).get("images", []) if im.get("url")]
                # Use a useful preview rather than a full-resolution render.
                images.sort(key=lambda im: abs(im.get("width", 0) - 512))
                license_info = model.get("license") or {}
                results.append({
                    "asset_id": f"sketchfab_{uid}", "name": model.get("name") or uid,
                    "source": "sketchfab", "source_url": model.get("viewerUrl"),
                    "thumbnail_url": images[0]["url"] if images else None,
                    "license": license_info.get("label"), "format": None,
                    "similarity_score": None, "model_available": False, "model_url": None,
                })
            next_cursor = (data.get("cursors") or {}).get("next")
            if not next_cursor or next_cursor == cursor:
                exhausted = True
                break
            cursor = next_cursor
            if candidate_limit is not None and len(results) >= candidate_limit:
                break
    if not exhausted:
        warnings.append("Sketchfab tiene más páginas; se comparará solo el lote recuperado.")
    return {"query": q, "results": results if candidate_limit is None else results[:candidate_limit],
            "warnings": warnings, "exhausted": exhausted}
