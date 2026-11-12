"""Empaqueta el add-on con un identificador propio usando solo la biblioteca estándar."""

import argparse
import hashlib
from pathlib import Path
import zipfile


BASE = Path(__file__).resolve().parent
MODULE = "asset_finder_blender"


def build_package(destination):
    destination = Path(destination)
    destination.parent.mkdir(parents=True, exist_ok=True)
    # Un nombre específico evita instalar un módulo genérico llamado "addon".
    with zipfile.ZipFile(destination, "w") as archive:
        for source, target in (("addon.py", "__init__.py"), ("bridge.py", "bridge.py"),
                               ("connector.py", "connector.py")):
            entry = zipfile.ZipInfo(f"{MODULE}/{target}", date_time=(2026, 11, 12, 0, 0, 0))
            entry.compress_type = zipfile.ZIP_DEFLATED
            entry.external_attr = 0o100644 << 16
            archive.writestr(entry, (BASE / source).read_bytes())
    return destination


def main():
    parser = argparse.ArgumentParser(description="Crear ZIP instalable de Asset Finder para Blender")
    parser.add_argument("--output", type=Path, default=BASE / "dist" / "asset_finder_blender.zip")
    args = parser.parse_args()
    path = build_package(args.output)
    print(f"Paquete: {path}")
    print(f"SHA-256: {hashlib.sha256(path.read_bytes()).hexdigest()}")


if __name__ == "__main__":
    main()
