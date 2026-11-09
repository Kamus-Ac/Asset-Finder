from fastapi import FastAPI, Query

if __package__:
    from .connectors.sketchfab import search_sketchfab
    from .media import router as media_router
else:
    from connectors.sketchfab import search_sketchfab
    from media import router as media_router

app = FastAPI()
app.include_router(media_router)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/catalog/search")
async def search_catalog(
    q: str = Query(min_length=1, max_length=100),
):
    return await search_sketchfab(q)
