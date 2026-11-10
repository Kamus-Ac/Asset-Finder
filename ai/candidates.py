"""Contrato interno de candidatos. No consulta URLs ni descarga archivos."""

from collections.abc import Mapping
from dataclasses import dataclass
from urllib.parse import urlsplit


@dataclass(frozen=True)
class View:
    view_id: str
    image: object


@dataclass(frozen=True)
class Candidate:
    asset_id: str
    metadata: dict
    views: tuple[View, ...]


def _text(value, field, *, optional=False):
    if optional and value is None:
        return None
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{field}: se requiere texto no vacío")
    return value.strip()


def _url(value, field, *, optional=False, relative=False):
    if optional and value is None:
        return None
    value = _text(value, field)
    try:
        parsed = urlsplit(value)
        valid = (parsed.scheme in ("http", "https") and bool(parsed.hostname)
                 and not parsed.username and not parsed.password)
        if relative and value.startswith("/") and not value.startswith("//"):
            valid = True
        if not valid:
            raise ValueError
    except ValueError:
        raise ValueError(f"{field}: se requiere URL HTTP(S) válida") from None
    return value


def validate_candidates(items):
    """Metadatos validados; vistas RGB se validan por separado para permitir lotes parciales."""
    if not isinstance(items, (list, tuple)):
        raise ValueError("candidates: se requiere lista de candidatos")
    candidates, seen = [], set()
    for item in items:
        if not isinstance(item, Mapping):
            raise ValueError("candidate: se requiere objeto")
        asset_id = _text(item.get("asset_id"), "asset_id")
        if asset_id in seen:
            raise ValueError(f"asset_id duplicado: {asset_id}")
        seen.add(asset_id)
        metadata = {key: _text(item.get(key), key, optional=True)
                    for key in ("name", "source", "license", "format")}
        metadata.update(asset_id=asset_id,
                        source_url=_url(item.get("source_url"), "source_url"),
                        thumbnail_url=_url(item.get("thumbnail_url"), "thumbnail_url", optional=True))
        for flag in ("model_available", "model_verified"):
            if flag in item and not isinstance(item[flag], bool):
                raise ValueError(f"{flag}: se requiere booleano")
        available = item.get("model_available", False)
        if available and not item.get("model_verified", False):
            raise ValueError("model_available: requiere confirmación model_verified de P3")
        metadata["model_available"] = available
        metadata["model_url"] = _url(item.get("model_url"), "model_url", relative=True) if available else None
        raw_views = item.get("views", [])
        if not isinstance(raw_views, (list, tuple)):
            raise ValueError("views: se requiere lista")
        views, view_ids = [], set()
        for view in raw_views:
            if not isinstance(view, Mapping):
                raise ValueError("view: se requiere objeto")
            view_id = _text(view.get("view_id"), "view_id")
            if view_id in view_ids:
                raise ValueError("view_id duplicado dentro del asset")
            view_ids.add(view_id)
            views.append(View(view_id, view.get("image")))
        candidates.append(Candidate(asset_id, metadata, tuple(views)))
    return candidates
