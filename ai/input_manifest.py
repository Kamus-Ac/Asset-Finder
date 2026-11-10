"""Carga explícita de imágenes para pruebas. No recorre carpetas ni consulta fuentes."""

import json
from pathlib import Path


def load_rgb(path):
    from PIL import Image, ImageOps
    path = Path(path)
    if not path.is_file() or path.stat().st_size > 10 * 1024 * 1024:
        raise ValueError("imagen ausente o mayor de 10 MiB")
    with Image.open(path) as image:
        if (image.format not in {"JPEG", "PNG", "WEBP"} or getattr(image, "is_animated", False)
                or image.width * image.height > 20_000_000):
            raise ValueError("imagen no admitida o mayor de 20 megapíxeles")
        image.load()
        return ImageOps.exif_transpose(image).convert("RGB")


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
