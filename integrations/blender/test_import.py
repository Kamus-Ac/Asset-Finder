"""CLI: blender --background --python-exit-code 1 --python este_script -- modelo.glb."""

import argparse
import importlib.util
from pathlib import Path
import sys


def load_addon():
    """Carga el mismo módulo autocontenido que se instala desde Blender."""
    spec = importlib.util.spec_from_file_location(
        "asset_finder_blender_addon", Path(__file__).with_name("addon.py"),
        submodule_search_locations=[str(Path(__file__).resolve().parent)],
    )
    addon = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = addon
    spec.loader.exec_module(addon)
    return addon


def main():
    arguments = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser(description="Importar un GLB local con Blender.")
    parser.add_argument("filepath", help="Ruta al GLB autocontenido (máximo 100 MiB)")
    args = parser.parse_args(arguments)
    try:
        addon = load_addon()
        objects = addon.import_glb(args.filepath)
    except (OSError, ValueError, RuntimeError, ImportError) as error:
        # La excepción permite que --python-exit-code 1 señale el fallo a la terminal.
        print(f"Asset Finder: importación fallida: {error}", file=sys.stderr)
        raise RuntimeError("No se completó la importación GLB.") from error
    print(f"Asset Finder: importación exitosa; {len(objects)} objeto(s).")
    print("Objetos: " + ", ".join(obj.name for obj in objects))


if __name__ == "__main__":
    main()
