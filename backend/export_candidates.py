"""Export Sketchfab candidates without running SAM or DINO."""

import argparse
import asyncio
import json
import sys
from pathlib import Path
from urllib.parse import urlsplit

import httpx
from fastapi import HTTPException

from .connectors.sketchfab import search_sketchfab


def valid_url(value):
    if not isinstance(value, str):
        return False
    try:
        url = urlsplit(value)
        return url.scheme in {"http", "https"} and bool(url.hostname)
    except ValueError:
        return False


def select_candidates(payload):
    results, skipped, seen = [], [], set()
    for item in payload["results"]:
        asset_id = item.get("asset_id")
        if not isinstance(asset_id, str) or not asset_id.strip():
            reason = "ID ausente o inválido"
        elif asset_id in seen:
            reason = "ID duplicado"
        elif not isinstance(item.get("name"), str) or not item["name"].strip():
            reason = "nombre ausente"
        elif not all(valid_url(item.get(key)) for key in ("thumbnail_url", "source_url")):
            reason = "miniatura o enlace de origen ausente o inválido"
        else:
            seen.add(asset_id)
            results.append({key: item[key] for key in (
                "asset_id", "name", "thumbnail_url", "source_url",
            )})
            continue
        skipped.append({"asset_id": asset_id, "reason": reason})
    return {"query": payload["query"], "results": results[:10]}, skipped


async def check_links(results, count):
    failures = []
    async with httpx.AsyncClient(timeout=20, follow_redirects=True) as client:
        for item in results[:count]:
            for field in ("thumbnail_url", "source_url"):
                try:
                    async with client.stream("GET", item[field]) as response:
                        response.raise_for_status()
                        print(f"{item['asset_id']} {field}: HTTP {response.status_code}")
                except httpx.HTTPError as error:
                    message = f"{item['asset_id']} {field}: {error}"
                    failures.append(message)
                    print(message, file=sys.stderr)
    return failures


async def export(query, output, sample_size):
    payload, skipped = select_candidates(await search_sketchfab(query))
    for item in skipped:
        print(f"Omitido: {item['asset_id']}: {item['reason']}", file=sys.stderr)
    if not payload["results"]:
        raise ValueError("Sketchfab no devolvió candidatos válidos; no se escribió el archivo.")
    output.parent.mkdir(parents=True, exist_ok=True)
    # Read back the exact serialized contract before publishing it.
    serialized = json.dumps(payload, ensure_ascii=False, indent=2) + "\n"
    assert json.loads(serialized) == payload
    output.write_text(serialized, encoding="utf-8")
    print(f"Exportados {len(payload['results'])}/10 candidatos en {output.resolve()}")
    if len(payload["results"]) < 10:
        print("La fuente devolvió menos resultados o se omitieron entradas inválidas.")
    failures = await check_links(payload["results"], sample_size)
    if failures:
        print("JSON exportado; hubo enlaces de muestra que no pudieron verificarse.", file=sys.stderr)
        return 2
    return 0


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--query", default="chair")
    parser.add_argument("--output", type=Path, default=Path("data/candidatos.json"))
    parser.add_argument("--check-links", type=int, choices=range(11), default=3,
                        metavar="0..10", help="Número de candidatos cuyos enlaces se comprueban")
    args = parser.parse_args()
    if not 1 <= len(args.query.strip()) <= 100:
        parser.error("La consulta debe tener entre 1 y 100 caracteres.")
    try:
        return asyncio.run(export(args.query.strip(), args.output, args.check_links))
    except HTTPException as error:
        print(f"Error del conector ({error.status_code}): {error.detail}", file=sys.stderr)
    except (OSError, ValueError) as error:
        print(f"Error de exportación: {error}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
