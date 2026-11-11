"""Run from the repository root: python -m uvicorn backend.main:app."""
import os
from typing import Literal

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from backend.catalog import discover
from backend.media import router as media_router
from backend.visual_search import router as visual_router

app = FastAPI(title="Asset Finder", version="0.2.0")
origins = os.environ.get("ASSET_FINDER_CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
app.add_middleware(CORSMiddleware, allow_origins=[s.strip() for s in origins if s.strip()],
                   allow_methods=["GET", "POST"], allow_headers=["Content-Type"])
app.include_router(media_router)
app.include_router(visual_router)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/catalog/search")
async def search_catalog(
    q: str = Query(min_length=1, max_length=100),
    sources: list[Literal["sketchfab", "polyhaven"]] = Query(default=["sketchfab", "polyhaven"]),
    candidate_limit: int | None = Query(default=10, gt=0),
    max_pages: int = Query(default=3, ge=1, le=100),
):
    if not q.strip() or not sources or len(set(sources)) != len(sources):
        raise HTTPException(422, "Consulta o fuentes inválidas.")
    return await discover(q.strip(), sources, candidate_limit, max_pages)


@app.post("/generations", status_code=503)
def generation_unavailable():
    raise HTTPException(503, detail={"error": "service_unavailable", "message": "Generación 3D no disponible."})
