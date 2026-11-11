"""Recursos oficiales fijados; solo descarga cuando se invoca su CLI explícita."""

import hashlib
import json
import os
from pathlib import Path
import shutil
import tarfile
import tempfile
import subprocess
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


def prepare_demo():
    """Obtiene una captura explícita de prueba; no implementa búsqueda en fuentes."""
    manifest = json.loads((BASE / "demo_manifest.json").read_text())
    target = BASE / "demo_data"
    for info in manifest["resources"]:
        name = info["filename"]
        if Path(name).name != name:
            raise ValueError("Nombre de recurso de demo inválido")
        download_verified(info, target / name)
    target.mkdir(parents=True, exist_ok=True)
    (target / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+"\n")
    return {"candidates": len(manifest["candidates"]), "snapshot_date": manifest["snapshot_date"]}


def sam_source_digest(root):
    root = Path(root)
    paths = [*(root/"sam2").rglob("*.py"), *(root/"sam2").rglob("*.yaml"),
             root/"setup.py", root/"LICENSE"]
    digest = hashlib.sha256()
    for path in sorted(paths):
        digest.update(path.relative_to(root).as_posix().encode()+b"\0"+path.read_bytes()+b"\0")
    return digest.hexdigest()


def prepare_sam():
    info = json.loads((BASE/"sam_resources.json").read_text())
    source = BASE/"sam2"
    if not source.exists():
        vendor = BASE/"vendor"
        vendor.mkdir(parents=True,exist_ok=True)
        with tempfile.TemporaryDirectory(dir=vendor) as directory:
            checkout = Path(directory)/"sam2"
            subprocess.run(["git","init","--quiet",str(checkout)],check=True)
            subprocess.run(["git","-C",str(checkout),"remote","add","origin",info["source_url"]],check=True)
            subprocess.run(["git","-C",str(checkout),"fetch","--depth=1","origin",info["revision"]],check=True)
            subprocess.run(["git","-C",str(checkout),"checkout","--quiet","--detach","FETCH_HEAD"],check=True)
            if sam_source_digest(checkout) != info["runtime_sha256"]:
                raise ValueError("Código SAM no coincide con la revisión registrada")
            checkout.rename(source)
    if sam_source_digest(source) != info["runtime_sha256"]:
        raise ValueError("Código SAM local modificado; no se sobrescribió")
    download_verified(info["weights"], source/"checkpoints/sam2.1_hiera_tiny.pt")
    return {"model":"sam2.1_hiera_tiny","revision":info["revision"],"verified":True}


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--demo", action="store_true", help="Preparar además las imágenes de prueba registradas")
    parser.add_argument("--sam", action="store_true", help="Preparar/verificar además SAM Tiny, sin instalar paquetes")
    args = parser.parse_args()
    report = {"dino": prepare_dino()}
    if args.sam:
        report["sam"] = prepare_sam()
    if args.demo:
        report["demo"] = prepare_demo()
    print(json.dumps(report, indent=2))
