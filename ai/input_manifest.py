"""Carga explícita de imágenes para pruebas. No recorre carpetas ni consulta fuentes."""

import json
from io import BytesIO
from pathlib import Path
import warnings


def load_rgb(path):
    path = Path(path)
    if not path.is_file() or path.stat().st_size > 10 * 1024 * 1024:
        raise ValueError("imagen ausente o mayor de 10 MiB")
    return decode_rgb(path.read_bytes())


def decode_rgb(content):
    from PIL import Image, ImageOps, UnidentifiedImageError
    if not isinstance(content, bytes) or len(content) > 10 * 1024 * 1024:
        raise ValueError("imagen: se requieren bytes de hasta 10 MiB")
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(BytesIO(content)) as image:
                if (image.format not in {"JPEG", "PNG", "WEBP"} or getattr(image, "is_animated", False)
                        or image.width * image.height > 20_000_000):
                    raise ValueError("imagen no admitida o mayor de 20 megapíxeles")
                image.load()
                return ImageOps.exif_transpose(image).convert("RGB")
    except (UnidentifiedImageError, OSError, Image.DecompressionBombWarning, Image.DecompressionBombError) as error:
        raise ValueError("imagen ilegible o resolución no admitida") from error


def load_manifest(path):
    path = Path(path).resolve()
    if path.stat().st_size > 2 * 1024 * 1024:
        raise ValueError("manifiesto demasiado grande")
    document = json.loads(path.read_text())
    if document.get("schema_version") != 1 or not isinstance(document.get("candidates"), list):
        raise ValueError("versión o contenido de manifiesto incompatible")
    candidates = []
    for item in document["candidates"]:
        candidate = dict(item)
        candidate["views"] = []
        for view in item.get("views", []):
            image_path = path.parent.joinpath(view["image_path"]).resolve()
            if not image_path.is_relative_to(path.parent):
                raise ValueError("image_path debe estar dentro del paquete de prueba")
            candidate["views"].append({"view_id": view["view_id"], "image": load_rgb(image_path)})
        candidates.append(candidate)
    return candidates
