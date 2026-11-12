"""Ciclo de vida e IPC de archivos acotado; no crea hilos en Blender."""

import hashlib
import json
import os
from pathlib import Path
import secrets
import subprocess
import sys
import tempfile
import time
from uuid import UUID

from .connector import read_json, write_json


class Session:
    def __init__(self, model, origin, port=8766, ttl=1800):
        if origin not in ("http://127.0.0.1:8765", "http://localhost:8765"):
            raise ValueError("Elige el origen local de la demo IA.")
        if not 0 <= port <= 65535 or not 0 < ttl <= 1800:
            raise ValueError("Puerto o duración inválidos.")
        self.process = None
        self._temp = tempfile.TemporaryDirectory(prefix="asset-finder-bridge-")
        self.directory = Path(self._temp.name)
        self.pending = None
        self.seen = set()
        self.token = secrets.token_urlsafe(24)
        self.port = None
        self.started = time.monotonic()
        self.ttl = ttl
        try:
            # La ruta la elige el usuario dentro de Blender; la web solo conoce el ID.
            model = Path(model)
            with model.open("rb") as source:
                data = source.read(100 * 1024 * 1024 + 1)
            if len(data) > 100 * 1024 * 1024:
                raise ValueError("El GLB supera 100 MiB.")
            self.model = self.directory / "model.glb"
            self.model.write_bytes(data)
            self.asset = {"asset_id": "demo-local", "name": model.name, "format": "glb",
                          "size": len(data), "sha256": hashlib.sha256(data).hexdigest()}
            for name in ("requests", "results"):
                (self.directory / name).mkdir()
            write_json(self.directory / "config.json", {"port": port, "origin": origin, "token": self.token,
                                                       "asset": self.asset, "ttl": ttl})
            self.heartbeat()
            executable = Path(sys.executable)
            if not executable.name.lower().startswith("python"):
                executable = Path(sys.prefix) / "bin" / ("python.exe" if os.name == "nt" else f"python{sys.version_info.major}.{sys.version_info.minor}")
            if not executable.is_file():
                raise ValueError("No se encontró el Python de Blender para iniciar el conector.")
            with (self.directory / "connector.log").open("wb") as log:
                self.process = subprocess.Popen(
                    [str(executable), "-I", str(Path(__file__).with_name("connector.py")),
                     "--session-dir", str(self.directory)], stdin=subprocess.DEVNULL,
                    stdout=log, stderr=log,
                    creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
                )
        except Exception:
            self.close()
            raise

    def heartbeat(self, busy=False):
        write_json(self.directory / "heartbeat.json", {"time": time.time(), "busy": busy})

    def poll(self):
        if self.process.poll() is not None:
            raise RuntimeError("El conector se cerró. Comprueba que el puerto esté libre y abre otra sesión.")
        if time.monotonic() - self.started >= self.ttl:
            raise RuntimeError("La sesión expiró; abre otra sesión desde Blender.")
        self.heartbeat()
        ready = self.directory / "ready.json"
        if ready.exists():
            self.port = read_json(ready)["port"]
        if self.pending is None:
            for path in sorted((self.directory / "requests").glob("*.json")):
                task_id = str(UUID(path.stem))
                if task_id in self.seen:
                    continue
                payload = read_json(path)
                if payload != {"task_id": task_id, "asset_id": "demo-local"}:
                    raise ValueError("Solicitud local inválida.")
                self.seen.add(task_id)
                self.pending = task_id
                self.result("awaiting_confirmation", "Confirma la importación en Blender.")
                break

    def verified_model(self):
        if hashlib.sha256(self.model.read_bytes()).hexdigest() != self.asset["sha256"]:
            raise ValueError("El archivo cambió después de autorizar la sesión.")
        return self.model

    def result(self, status, message):
        if self.pending is None:
            raise ValueError("No hay una importación pendiente.")
        write_json(self.directory / "results" / f"{self.pending}.json",
                   {"task_id": self.pending, "status": status, "message": message})
        if status in ("completed", "failed", "cancelled"):
            self.pending = None

    def close(self):
        if self.process is not None and self.process.poll() is None:
            self.process.terminate()
            try:
                self.process.wait(timeout=1)
            except subprocess.TimeoutExpired:
                self.process.kill()
                self.process.wait(timeout=1)
        self._temp.cleanup()
