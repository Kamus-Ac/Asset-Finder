"""Archivos NumPy sin pickle, cabecera JSON y escritura atómica."""

import json
import os
from pathlib import Path
import tempfile
import zipfile


def write_arrays(path, arrays, header):
    import numpy as np
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temporary = tempfile.mkstemp(dir=path.parent, suffix=".tmp")
    try:
        with os.fdopen(descriptor, "wb") as output:
            encoded = json.dumps(header, sort_keys=True, allow_nan=False).encode()
            np.savez(output, **arrays, header=np.frombuffer(encoded, dtype=np.uint8))
        Path(temporary).replace(path)
    finally:
        Path(temporary).unlink(missing_ok=True)


def read_arrays(path, expected_members):
    import numpy as np
    with zipfile.ZipFile(path) as archive:
        if sum(item.file_size for item in archive.infolist()) > 64 * 1024 * 1024:
            raise ValueError("Archivo de vectores supera 64 MiB descomprimidos")
    with np.load(path, allow_pickle=False) as data:
        if set(data.files) != set(expected_members) | {"header"}:
            raise ValueError("Contenido del archivo de vectores incompatible")
        raw = data["header"]
        if raw.dtype != np.uint8 or raw.ndim != 1:
            raise ValueError("Cabecera de vectores incompatible")
        header = json.loads(raw.tobytes())
        if not isinstance(header, dict):
            raise ValueError("Cabecera JSON inválida")
        arrays = {name: data[name].copy() for name in expected_members}
    return arrays, header
