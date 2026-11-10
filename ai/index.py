"""Vectores de lotes externos y caché por contenido; sin colección global obligatoria."""

from dataclasses import dataclass
import hashlib
import json
import os
from pathlib import Path
import tempfile

from .candidate_images import prepare_candidates
from .embedding import _encode_prepared, model_identity


FORMAT_VERSION = 1


@dataclass
class CandidateIndex:
    vectors: object
    rows: list
    metadata: dict
    identity: dict
    errors: list
    cache_hits: int = 0
    cache_misses: int = 0


def fingerprint(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":"),
                                     allow_nan=False).encode()).hexdigest()


def _check_vector(vector, dimension=384):
    import numpy as np
    if (not isinstance(vector, np.ndarray) or vector.dtype != np.float32
            or vector.shape != (dimension,) or not np.isfinite(vector).all()
            or not np.isclose(np.linalg.norm(vector), 1, atol=1e-5)):
        raise ValueError("vector incompatible: se requiere float32 normalizado")


def _write_npz(path, vectors, header):
    import numpy as np
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    descriptor, name = tempfile.mkstemp(dir=path.parent, suffix=".tmp")
    try:
        with os.fdopen(descriptor, "wb") as stream:
            encoded = json.dumps(header, sort_keys=True, allow_nan=False).encode()
            np.savez(stream, vectors=vectors, header=np.frombuffer(encoded, dtype=np.uint8))
        Path(name).replace(path)
    finally:
        Path(name).unlink(missing_ok=True)


def _read_npz(path):
    import numpy as np
    with np.load(path, allow_pickle=False) as data:
        if set(data.files) != {"vectors", "header"}:
            raise ValueError("Archivo de vectores incompatible")
        raw = data["header"]
        if raw.dtype != np.uint8 or raw.ndim != 1:
            raise ValueError("Cabecera incompatible")
        header = json.loads(raw.tobytes())
        vectors = data["vectors"].copy()
    return vectors, header


def build_index(candidates, *, device="cpu", cache_dir=None):
    import numpy as np
    if device not in ("cpu", "cuda"):
        raise ValueError("device debe ser cpu o cuda")
    batch = prepare_candidates(candidates)
    identity = model_identity()
    rows, vectors, hits, misses = [], [], 0, 0
    for view in batch["views"]:
        key = fingerprint({"image": view["image_sha256"], "identity": identity,
                           "device": device, "format_version": FORMAT_VERSION})
        path = Path(cache_dir) / (key + ".npz") if cache_dir is not None else None
        if path is not None and path.is_file():
            vector, header = _read_npz(path)
            if header != {"key": key, "format_version": FORMAT_VERSION}:
                raise ValueError("Caché de candidato incompatible")
            hits += 1
        else:
            vector = _encode_prepared(view["image"], device=device)
            _check_vector(vector)
            if path is not None:
                _write_npz(path, vector, {"key": key, "format_version": FORMAT_VERSION})
            misses += 1
        _check_vector(vector)
        rows.append({key: view[key] for key in ("asset_id", "view_id", "image_sha256", "preparation")})
        vectors.append(vector)
    matrix = np.stack(vectors) if vectors else np.empty((0, identity["dimension"]), dtype=np.float32)
    return CandidateIndex(matrix, rows, batch["metadata"], identity, batch["errors"], hits, misses)


def save_index(index, path):
    header = {"format_version": FORMAT_VERSION, "identity": index.identity,
              "rows": index.rows, "metadata": index.metadata, "errors": index.errors,
              "vectors_sha256": hashlib.sha256(index.vectors.tobytes()).hexdigest()}
    _write_npz(path, index.vectors, header)


def load_index(path):
    vectors, header = _read_npz(path)
    if header.get("format_version") != FORMAT_VERSION or header.get("identity") != model_identity():
        raise ValueError("Índice incompatible con el modelo/preprocesado actual")
    if hashlib.sha256(vectors.tobytes()).hexdigest() != header.get("vectors_sha256"):
        raise ValueError("Contenido del índice incompatible")
    return CandidateIndex(vectors, header["rows"], header["metadata"], header["identity"], header["errors"])
