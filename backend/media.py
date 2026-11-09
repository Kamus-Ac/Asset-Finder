"""Image references stored on the server; no inference runs in this module."""

import io
import os
import warnings
from pathlib import Path
from typing import Literal
from uuid import UUID, uuid4

from fastapi import APIRouter, HTTPException, UploadFile
from fastapi.responses import FileResponse
from PIL import Image, ImageOps, UnidentifiedImageError
from pydantic import BaseModel
from starlette.concurrency import run_in_threadpool

router = APIRouter(prefix="/media", tags=["media"])
MAX_BYTES = 10 * 1024 * 1024
MAX_PIXELS = 20_000_000
SUPPORTED = {"JPEG", "PNG", "WEBP"}


class MediaReference(BaseModel):
    media_id: UUID
    type: Literal["image"] = "image"
    width: int
    height: int
    content_type: Literal["image/png"] = "image/png"
    file_url: str


def storage_root() -> Path:
    return Path(os.environ.get(
        "ASSET_FINDER_MEDIA_DIR",
        str(Path(__file__).resolve().parents[1] / "data" / "media"),
    ))


def image_path(media_id: UUID) -> Path:
    path = storage_root() / f"{media_id}.png"
    if not path.is_file():
        raise HTTPException(404, "Referencia no encontrada.")
    return path


def describe(media_id: UUID, width: int, height: int) -> MediaReference:
    return MediaReference(
        media_id=media_id, width=width, height=height,
        file_url=f"/media/{media_id}/file",
    )


def store_image(data: bytes) -> MediaReference:
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(io.BytesIO(data)) as source:
                if source.format not in SUPPORTED:
                    raise HTTPException(415, "Usa una imagen JPEG, PNG o WebP.")
                if source.width * source.height > MAX_PIXELS:
                    raise HTTPException(413, "La imagen supera los 20 megapíxeles.")
                if getattr(source, "is_animated", False):
                    raise HTTPException(415, "Las imágenes animadas no están admitidas.")
                source.load()
                image = ImageOps.exif_transpose(source).convert("RGB")
    except (Image.DecompressionBombError, Image.DecompressionBombWarning):
        raise HTTPException(413, "La imagen supera el límite de resolución.")
    except (UnidentifiedImageError, OSError, ValueError):
        raise HTTPException(415, "El archivo no es una imagen válida.")

    media_id = uuid4()
    root = storage_root()
    root.mkdir(parents=True, exist_ok=True)
    path = root / f"{media_id}.png"
    temporary = path.with_suffix(".tmp")
    try:
        image.save(temporary, format="PNG")
        temporary.replace(path)
    finally:
        temporary.unlink(missing_ok=True)
    return describe(media_id, *image.size)


@router.post("", status_code=201, response_model=MediaReference)
async def upload_media(file: UploadFile):
    """Upload a single still image, using the multipart field `file`."""
    try:
        data = bytearray()
        while chunk := await file.read(64 * 1024):
            data.extend(chunk)
            if len(data) > MAX_BYTES:
                raise HTTPException(413, "El archivo supera los 10 MiB.")
        return await run_in_threadpool(store_image, bytes(data))
    finally:
        await file.close()


@router.get("/{media_id}", response_model=MediaReference)
def get_media(media_id: UUID):
    with Image.open(image_path(media_id)) as image:
        return describe(media_id, *image.size)


@router.get("/{media_id}/file", response_class=FileResponse)
def get_media_file(media_id: UUID):
    return FileResponse(image_path(media_id), media_type="image/png")
