"""Caché del cálculo visual; el ranking y los metadatos se reconstruyen cada vez."""

import hashlib
import json
import os
from pathlib import Path
import tempfile
import threading
import time
import zipfile

from .candidate_images import image_digest
from .embedding import model_identity
from .index import fingerprint, _check_vector
from .resources import sha256
from .segmentation import _CHECKPOINT, _CONFIG, _validate_inputs, ServiceUnavailableError


_LOCK = threading.RLock()
_SAM_HASHES = {}
SAM_SHA256 = "7402e0d864fa82708a20fbd15bc84245c2f26dff0eb43a4b5b93452deb34be69"


def sam_identity():
    if not _CHECKPOINT.is_file():
        raise ServiceUnavailableError("servicio no disponible: pesos SAM ausentes")
    stamp = (_CHECKPOINT.stat().st_size, _CHECKPOINT.stat().st_mtime_ns)
    if stamp not in _SAM_HASHES:
        digest = sha256(_CHECKPOINT)
        if digest != SAM_SHA256:
            raise ServiceUnavailableError("servicio no disponible: pesos SAM distintos de los registrados")
        _SAM_HASHES[stamp] = digest
    return {"model": "sam2.1_hiera_tiny", "config": _CONFIG, "postprocessing": False,
            "weights_sha256": SAM_SHA256,
            "source_revision": "2b90b9f5ceec907a1c18123530e92e794ad901a4"}


def _load(path, key, image_shape):
    import numpy as np
    from PIL import Image
    with zipfile.ZipFile(path) as archive:
        if sum(item.file_size for item in archive.infolist()) > 64 * 1024 * 1024:
            raise ValueError("Caché de consulta demasiado grande")
    with np.load(path, allow_pickle=False) as data:
        if set(data.files) != {"mask", "crop", "vector", "header"}:
            raise ValueError("Caché de consulta incompatible")
        mask, crop, vector = (data[name].copy() for name in ("mask", "crop", "vector"))
        raw_header = data["header"]
        if raw_header.dtype != np.uint8 or raw_header.ndim != 1:
            raise ValueError("Cabecera de consulta inválida")
        header = json.loads(raw_header.tobytes())
    if (mask.dtype != np.bool_ or mask.shape != image_shape[:2] or not mask.any()
            or crop.dtype != np.uint8 or crop.ndim != 3 or crop.shape[2] != 3 or 0 in crop.shape):
        raise ValueError("Imagen/máscara cacheada incompatible")
    _check_vector(vector)
    hashes = {name: hashlib.sha256(value.tobytes()).hexdigest()
              for name, value in (("mask", mask), ("crop", crop), ("vector", vector))}
    if (header.get("key") != key or header.get("hashes") != hashes
            or not isinstance(header.get("score"), (int,float)) or not np.isfinite(header["score"])):
        raise ValueError("Contenido cacheado incompatible")
    return mask, float(header["score"]), Image.fromarray(crop), vector


def _save(path, key, result):
    import numpy as np
    mask, score, image, vector, _ = result
    crop = np.asarray(image)
    _check_vector(vector)
    hashes = {name: hashlib.sha256(value.tobytes()).hexdigest()
              for name, value in (("mask", mask), ("crop", crop), ("vector", vector))}
    header = {"key": key, "score": float(score), "hashes": hashes}
    path.parent.mkdir(parents=True, exist_ok=True)
    descriptor, name = tempfile.mkstemp(dir=path.parent, suffix=".tmp")
    try:
        with os.fdopen(descriptor, "wb") as stream:
            np.savez(stream, mask=mask, crop=crop, vector=vector,
                     header=np.frombuffer(json.dumps(header,allow_nan=False).encode(),dtype=np.uint8))
        Path(name).replace(path)
    finally:
        Path(name).unlink(missing_ok=True)


def query_result(image, box, points, device, directory, compute):
    import numpy as np
    import torch
    pixels, canonical_box, coords, labels = _validate_inputs(image, box, points, np)
    started = time.perf_counter()
    key = fingerprint({"schema": 1, "image": image_digest(pixels),
                       "box": None if canonical_box is None else canonical_box.tolist(),
                       "points": None if coords is None else coords.tolist(),
                       "labels": None if labels is None else labels.tolist(),
                       "dino": model_identity(), "sam": sam_identity(),
                       "device": device, "torch": str(torch.__version__)})
    path = Path(directory) / (key + ".npz")
    with _LOCK:
        if path.is_file():
            mask, score, crop, vector = _load(path, key, pixels.shape)
            timings = {"segment_seconds": 0.0, "prepare_seconds": 0.0, "embed_seconds": 0.0,
                       "query_cache_seconds": time.perf_counter()-started}
            return (mask, score, crop, vector, timings), True
        result = compute()
        _save(path, key, result)
        return result, False
