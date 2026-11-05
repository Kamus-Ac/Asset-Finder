import httpx
from fastapi import HTTPException, Query


async def search_sketchfab(q: str):
    # Consultamos la API de Sketchfab.
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.get(
                "https://api.sketchfab.com/v3/search",
                params={
                    "type": "models",
                    "q": q,
                    "count": 10,
                },
            )

            response.raise_for_status()

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="Sketchfab tardó demasiado en responder.",
        )

    except httpx.HTTPStatusError as error:
        raise HTTPException(
            status_code=502,
            detail=(
                "Sketchfab rechazó la consulta. "
                f"Código: {error.response.status_code}"
            ),
        )

    except httpx.RequestError:
        raise HTTPException(
            status_code=502,
            detail="No se pudo conectar con Sketchfab.",
        )

    # Convertimos la respuesta a datos de Python.
    try:
        data = response.json()
    except ValueError:
        raise HTTPException(
            status_code=502,
            detail="Sketchfab devolvió una respuesta inesperada.",
        )

    # Tomamos solo los campos que necesita nuestra plataforma.
    results = []

    for model in data.get("results", []):
        thumbnails = model.get("thumbnails", {}).get("images", [])

        results.append({
            "asset_id": f"sketchfab_{model['uid']}",
            "name": model.get("name"),
            "source": "sketchfab",
            "source_url": model.get("viewerUrl"),
            "thumbnail_url": (
                thumbnails[0]["url"] if thumbnails else None
            ),
            "similarity_score": None,
            "model_available": False,
            "model_url": None,
        })

    return {
        "query": q,
        "results": results,
    }