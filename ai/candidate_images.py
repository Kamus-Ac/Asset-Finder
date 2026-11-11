"""Preparación de vistas en memoria, con informe de imágenes no procesables."""

import hashlib

from .candidates import validate_candidates
from .preprocess import prepare_image, rgb_pixels


def image_digest(image):
    pixels = rgb_pixels(image)
    return hashlib.sha256(str(pixels.shape).encode() + b"\0" + pixels.tobytes()).hexdigest()


def prepare_candidates(items):
    candidates = validate_candidates(items)
    metadata, views, errors = {}, [], []
    for candidate in candidates:
        metadata[candidate.asset_id] = dict(candidate.metadata)
        if not candidate.views:
            errors.append({"asset_id": candidate.asset_id, "view_id": None,
                           "error": "candidato sin imágenes"})
        for view in candidate.views:
            try:
                prepared = prepare_image(view.image)
                digest = image_digest(view.image)
            except ValueError as error:
                errors.append({"asset_id": candidate.asset_id, "view_id": view.view_id,
                               "error": str(error)})
                continue
            views.append({"asset_id": candidate.asset_id, "view_id": view.view_id,
                          "image": prepared, "image_sha256": digest,
                          "preparation": "full_image_no_mask"})
    return {"metadata": metadata, "views": views, "errors": errors}
