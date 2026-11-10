"""Recursos oficiales fijados; solo descarga cuando se invoca su CLI explícita."""

import hashlib
import json
import os
from pathlib import Path
import shutil
import tarfile
import tempfile
from urllib.request import Request, urlopen


BASE = Path(__file__).resolve().parent
DINO_SOURCE = BASE / "vendor/dinov2"
DINO_WEIGHTS = BASE / "checkpoints/dinov2_vits14_pretrain.pth"


def sha256(path):
    with Path(path).open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def dino_manifest():
    return json.loads((BASE / "dino_resources.json").read_text())


def source_digest(root):
    root = Path(root)
    digest = hashlib.sha256()
    for path in sorted([*root.rglob("*.py"), root / "LICENSE"]):
        digest.update(path.relative_to(root).as_posix().encode() + b"\0"
                      + path.read_bytes() + b"\0")
    return digest.hexdigest()


def download_verified(info, destination):
    destination = Path(destination)
    if destination.exists():
        if sha256(destination) != info["sha256"]:
            raise ValueError(f"Recurso existente incompatible: {destination.name}")
        return
    destination.parent.mkdir(parents=True, exist_ok=True)
    handle, name = tempfile.mkstemp(dir=destination.parent, suffix=".part")
    temporary = Path(name)
    try:
        with os.fdopen(handle, "wb") as output, urlopen(
            Request(info["url"], headers={"User-Agent": "Asset-Finder/1.0"}), timeout=90
        ) as response:
            total = 0
            while block := response.read(1024 * 1024):
                total += len(block)
                if total > info["bytes"]:
                    raise ValueError("El recurso supera el tamaño registrado")
                output.write(block)
        if temporary.stat().st_size != info["bytes"] or sha256(temporary) != info["sha256"]:
            raise ValueError("El recurso no coincide con tamaño/SHA-256 registrados")
        temporary.replace(destination)
    finally:
        temporary.unlink(missing_ok=True)


def prepare_dino():
    info = dino_manifest()
    archive_path = BASE / "vendor/dinov2.tar.gz"
    download_verified(info["source"], archive_path)
    if not DINO_SOURCE.exists():
        with tempfile.TemporaryDirectory(dir=archive_path.parent) as directory:
            root = Path(directory) / "source"
            with tarfile.open(archive_path) as archive:
                for member in archive:
                    parts = Path(member.name).parts[1:]
                    if not parts:
                        continue
                    if (".." in parts or Path(*parts).is_absolute()
                            or not (member.isfile() or member.isdir())):
                        raise ValueError("Ruta o tipo de archivo no permitido en proveedor")
                    target = root.joinpath(*parts)
                    if member.isdir():
                        target.mkdir(parents=True, exist_ok=True)
                    else:
                        target.parent.mkdir(parents=True, exist_ok=True)
                        with archive.extractfile(member) as source, target.open("xb") as output:
                            shutil.copyfileobj(source, output)
            if source_digest(root) != info["source"]["tree_sha256"]:
                raise ValueError("Código proveedor incompatible")
            root.rename(DINO_SOURCE)
    if source_digest(DINO_SOURCE) != info["source"]["tree_sha256"]:
        raise ValueError("La copia local de DINO fue modificada")
    download_verified(info["weights"], DINO_WEIGHTS)
    return {"model": "dinov2_vits14", "revision": info["revision"], "verified": True}


if __name__ == "__main__":
    print(json.dumps(prepare_dino(), indent=2))
