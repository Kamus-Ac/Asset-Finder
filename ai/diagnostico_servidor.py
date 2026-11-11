"""Recopila evidencia de T01 con la biblioteca estándar; no instala paquetes."""

import argparse
import csv
from datetime import datetime, timezone
import io
import json
import os
from pathlib import Path
import platform
import shutil
import subprocess
import sys


def run_command(argv):
    """Conserva errores como evidencia, sin abortar el resto del diagnóstico."""
    try:
        result = subprocess.run(argv, capture_output=True, text=True, timeout=10)
        return {"argv": argv, "returncode": result.returncode,
                "stdout": result.stdout.strip(), "stderr": result.stderr.strip()}
    except FileNotFoundError:
        return {"argv": argv, "returncode": 127, "stdout": "",
                "stderr": "servicio no disponible: comando ausente"}
    except PermissionError:
        return {"argv": argv, "returncode": 126, "stdout": "",
                "stderr": "servicio no disponible: permiso de ejecución denegado"}
    except subprocess.TimeoutExpired:
        return {"argv": argv, "returncode": 124, "stdout": "",
                "stderr": "servicio no disponible: tiempo de espera agotado (10 s)"}


def parse_gpu_csv(text):
    """Lee name,driver_version,memory.total; la memoria sin unidades es MiB."""
    devices = []
    for row in csv.reader(io.StringIO(text), strict=True):
        if not row or not any(field.strip() for field in row):
            continue
        if len(row) != 3:
            raise ValueError("Se esperaban tres columnas de nvidia-smi")
        name, driver, memory = (field.strip() for field in row)
        memory_mib = None if memory in ("", "N/A", "[N/A]") else int(memory)
        if memory_mib is not None and memory_mib < 0:
            raise ValueError("La memoria GPU no puede ser negativa")
        devices.append({"name": None if name in ("", "N/A", "[N/A]") else name,
                        "driver_version": None if driver in ("", "N/A", "[N/A]") else driver,
                        "memory_total_mib": memory_mib})
    if not devices:
        raise ValueError("La consulta GPU no devolvió datos")
    return devices


def nvidia_tool():
    found = shutil.which("nvidia-smi")
    if found:
        return found
    fallback = Path("/usr/lib/wsl/lib/nvidia-smi")
    return str(fallback) if fallback.is_file() and os.access(fallback, os.X_OK) else None


def collect_report():
    try:
        release = platform.freedesktop_os_release()
    except OSError:
        release = {}
    try:
        memory_bytes = os.sysconf("SC_PHYS_PAGES") * os.sysconf("SC_PAGE_SIZE")
        if memory_bytes <= 0:
            memory_bytes = None
    except (AttributeError, OSError, ValueError):
        memory_bytes = None

    kernel = platform.release()
    tool = nvidia_tool()
    query = run_command([tool or "nvidia-smi",
                         "--query-gpu=name,driver_version,memory.total",
                         "--format=csv,noheader,nounits"])
    devices, parse_error = None, None
    if query["returncode"] == 0:
        try:
            devices = parse_gpu_csv(query["stdout"])
        except (ValueError, csv.Error) as error:
            parse_error = str(error)

    return {
        "schema_version": 1,
        "collected_at_utc": datetime.now(timezone.utc).isoformat(),
        "host": platform.node(),
        "system": platform.system(),
        "kernel": kernel,
        "architecture": platform.machine(),
        "distribution": {"id": release.get("ID"), "name": release.get("PRETTY_NAME"),
                         "version_id": release.get("VERSION_ID")},
        "python": {"version": platform.python_version(), "executable": sys.executable},
        "libc": dict(zip(("name", "version"), platform.libc_ver())),
        "memory_visible_bytes": memory_bytes,
        "wsl": {"kernel_mentions_microsoft": "microsoft" in kernel.lower(),
                "kernel_mentions_wsl2": "wsl2" in kernel.lower(),
                "dxg_exists": Path("/dev/dxg").exists()},
        "gpu": {"tool": tool, "devices": devices, "parse_error": parse_error,
                "query": query, "raw_nvidia_smi": run_command([tool or "nvidia-smi"])},
        "raw_memory": run_command(["free", "-b"]),
        "note": "Salida local: no confirma que este equipo sea el servidor de Angel. "
                "Un código 0 del script solo indica que se recopiló el informe.",
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, help="Guardar JSON; por defecto imprimirlo")
    args = parser.parse_args()
    text = json.dumps(collect_report(), ensure_ascii=False, indent=2) + "\n"
    if args.output:
        try:
            args.output.write_text(text, encoding="utf-8")
        except OSError as error:
            parser.error(f"No se pudo guardar el informe: {error}")
    else:
        print(text, end="")


if __name__ == "__main__":
    main()
