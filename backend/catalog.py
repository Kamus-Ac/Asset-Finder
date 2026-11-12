"""External discovery and controlled thumbnail downloads (no client-provided URLs)."""
import asyncio
from urllib.parse import urlsplit

import httpx
from fastapi import HTTPException

from .connectors.sketchfab import search_sketchfab
from .connectors.polyhaven import search_polyhaven

SOURCES = {"sketchfab": search_sketchfab, "polyhaven": search_polyhaven}
THUMB_HOSTS = {"media.sketchfab.com", "cdn.polyhaven.com"}


async def discover(q, sources, candidate_limit=None, max_pages=3):
    responses = await asyncio.gather(*[
        SOURCES[source](q, candidate_limit=candidate_limit, max_pages=max_pages)
        for source in sources
    ], return_exceptions=True)
    results, warnings, reports, seen = [], [], [], set()
    successful = 0
    for source, response in zip(sources, responses):
        if isinstance(response, Exception):
            warnings.append(f"{source}: fuente no disponible; se omitió de esta búsqueda.")
            reports.append({"source": source, "status": "unavailable", "count": 0})
            continue
        successful += 1
        warnings.extend(response.get("warnings", []))
        added = 0
        for item in response["results"]:
            if item["asset_id"] not in seen:
                seen.add(item["asset_id"])
                results.append(item)
                added += 1
        reports.append({"source": source, "status": "ok", "count": added,
                        "exhausted": response.get("exhausted", True)})
    if not successful:
        raise HTTPException(502, "Ninguna fuente externa respondió. Intenta de nuevo más tarde.")
    return {"query": q, "results": results, "warnings": warnings, "sources": reports}


def allowed_thumbnail(url):
    try:
        parsed = urlsplit(url)
        return (parsed.scheme == "https" and parsed.hostname in THUMB_HOSTS
                and parsed.port in (None, 443) and not parsed.username and not parsed.password)
    except (TypeError, ValueError, AttributeError):
        return False


async def download_images(results):
    from ai.input_manifest import decode_rgb
    images, warnings = {}, []
    # Process batches, keeping network concurrency and downloaded bytes bounded.
    async with httpx.AsyncClient(timeout=20, follow_redirects=False,
                                 headers={"User-Agent": "AssetFinder/1.0"}) as client:
        async def one(item):
            url = item.get("thumbnail_url")
            if not allowed_thumbnail(url):
                return item["asset_id"], None
            try:
                async with client.stream("GET", url) as response:
                    response.raise_for_status()
                    content = bytearray()
                    async for chunk in response.aiter_bytes():
                        content.extend(chunk)
                        if len(content) > 10 * 1024 * 1024:
                            raise ValueError("Miniatura demasiado grande")
                image = decode_rgb(bytes(content))
                image.thumbnail((512, 512))
                return item["asset_id"], image
            except (httpx.HTTPError, ValueError):
                return item["asset_id"], None
        for offset in range(0, len(results), 6):
            for asset_id, image in await asyncio.gather(*[one(item) for item in results[offset:offset + 6]]):
                if image is None:
                    warnings.append(f"{asset_id}: miniatura no disponible; no se comparó.")
                else:
                    images[asset_id] = image
    return images, warnings
