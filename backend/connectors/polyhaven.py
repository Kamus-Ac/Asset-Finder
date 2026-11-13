"""Poly Haven public API; metadata relevance is reranked by our DINO pipeline."""
import asyncio
from urllib.parse import quote

import httpx
from fastapi import HTTPException


async def search_polyhaven(q: str, candidate_limit=None, max_pages=3):
    del max_pages  # The API returns ranked slugs, not cursor pages.
    async with httpx.AsyncClient(timeout=25, headers={"User-Agent": "AssetFinder/1.0"}) as client:
        try:
            params = {"q": q.strip().lower(), "t": "models"}
            if candidate_limit is not None:
                params["limit"] = candidate_limit
            search, assets = await asyncio.gather(
                client.get("https://api.polyhaven.com/search", params=params),
                client.get("https://api.polyhaven.com/assets", params={"t": "models"}),
            )
            search.raise_for_status()
            assets.raise_for_status()
            ranking, metadata = search.json(), assets.json()
            if not isinstance(ranking.get("results"), list) or not isinstance(metadata, dict):
                raise ValueError("Respuesta inválida")
            results = []
            for item in ranking["results"]:
                slug = item["slug"]
                info = metadata.get(slug)
                if not info or info.get("type") != 2:
                    continue
                results.append({
                    "asset_id": f"polyhaven_{slug}", "name": info.get("name") or slug,
                    "source": "polyhaven", "source_url": f"https://polyhaven.com/a/{quote(slug, safe='')}",
                    "thumbnail_url": info.get("thumbnail_url"), "license": "CC0", "format": None,
                    "similarity_score": None, "model_available": False, "model_url": None,
                })
            exhausted = len(ranking["results"]) >= ranking.get("total", len(ranking["results"]))
            return {"query": q, "results": results if candidate_limit is None else results[:candidate_limit],
                    "exhausted": exhausted, "warnings": [] if exhausted else [
                        "Poly Haven tiene más resultados; se comparará solo el lote recuperado."]}
        except (httpx.HTTPError, ValueError, KeyError, TypeError, AttributeError) as error:
            raise HTTPException(502, "No se pudo consultar Poly Haven.") from error
