from fastapi import FastAPI, Query

from connectors.sketchfab import search_sketchfab

app = FastAPI()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/catalog/search")
async def search_catalog(
    q: str = Query(min_length=1, max_length=100),
):
    return await search_sketchfab(q)