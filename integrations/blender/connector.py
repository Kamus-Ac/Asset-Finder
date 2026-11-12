"""HTTP local de la demo. Se ejecuta en un proceso Python separado de Blender."""

import argparse
import hmac
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
from pathlib import Path
import time
from uuid import UUID


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path, value):
    temporary = path.with_suffix(".tmp")
    temporary.write_text(json.dumps(value, ensure_ascii=False, allow_nan=False), encoding="utf-8")
    temporary.replace(path)


def serve(directory):
    config = read_json(directory / "config.json")
    started = time.monotonic()
    tasks = {}

    def alive():
        try:
            heartbeat = read_json(directory / "heartbeat.json")
            return 0 <= time.time() - heartbeat["time"] < (120 if heartbeat.get("busy") else 5)
        except (OSError, ValueError, KeyError, TypeError):
            return False

    def task_result(task_id):
        path = directory / "results" / f"{task_id}.json"
        result = read_json(path) if path.exists() else {"task_id": task_id, "status": "queued"}
        if not alive() and result["status"] in ("queued", "awaiting_confirmation", "importing"):
            return {"task_id": task_id, "status": "failed", "message": "Blender dejó de responder. Revisa la escena antes de reintentar."}
        return result

    class Handler(BaseHTTPRequestHandler):
        def setup(self):
            super().setup()
            self.connection.settimeout(2)

        def log_message(self, format, *args):
            pass  # No registrar credenciales ni contenido de las solicitudes.

        def reply(self, status, payload):
            content = json.dumps(payload, ensure_ascii=False, allow_nan=False).encode()
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(content)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("Vary", "Origin")
            if self.headers.get("Origin") == config["origin"]:
                self.send_header("Access-Control-Allow-Origin", config["origin"])
                self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
                self.send_header("Access-Control-Allow-Headers", "Authorization, Content-Type")
                if self.headers.get("Access-Control-Request-Private-Network") == "true":
                    self.send_header("Access-Control-Allow-Private-Network", "true")
            self.end_headers()
            self.wfile.write(content)

        def allowed(self, authenticated=True):
            if (self.headers.get("Host") != f"127.0.0.1:{self.server.server_port}"
                    or self.headers.get("Origin") != config["origin"]):
                self.reply(403, {"error": "Origen o destino no autorizado."})
                return False
            if time.monotonic() - started >= config["ttl"]:
                self.reply(401, {"error": "Sesión expirada; vuelve a conectar desde Blender."})
                return False
            expected = "Bearer " + config["token"]
            if authenticated and not hmac.compare_digest(self.headers.get("Authorization", ""), expected):
                self.reply(401, {"error": "Código de conexión incorrecto o sesión cerrada."})
                return False
            return True

        def do_OPTIONS(self):
            if not self.allowed(authenticated=False):
                return
            method = self.headers.get("Access-Control-Request-Method")
            headers = {item.strip().lower() for item in self.headers.get("Access-Control-Request-Headers", "").split(",") if item.strip()}
            if method not in ("GET", "POST") or not headers <= {"authorization", "content-type"}:
                self.reply(403, {"error": "Preflight no autorizado."})
                return
            self.reply(200, {})

        def do_GET(self):
            if not self.allowed(authenticated=self.path != "/health"):
                return
            if self.path == "/health":
                self.reply(200, {"connector": True, "blender_connected": alive()})
            elif self.path == "/session":
                self.reply(200, {"blender_connected": alive(), "asset": config["asset"],
                                 "expires_in": max(0, int(config["ttl"] - (time.monotonic() - started)))})
            elif self.path.startswith("/tasks/") and self.path[7:] in tasks:
                self.reply(200, task_result(self.path[7:]))
            else:
                self.reply(404, {"error": "Ruta o tarea no encontrada."})

        def do_POST(self):
            if not self.allowed():
                return
            if self.path not in ("/imports", "/disconnect"):
                self.reply(404, {"error": "Ruta no encontrada."})
                return
            try:
                if self.headers.get("Content-Type", "").split(";")[0].strip() != "application/json":
                    self.reply(415, {"error": "Se requiere JSON."})
                    return
                if self.headers.get("Transfer-Encoding"):
                    raise ValueError("Transferencia no admitida.")
                length = int(self.headers.get("Content-Length", "0"))
                if not 0 < length <= 2048:
                    self.reply(413, {"error": "Tamaño de solicitud no permitido."})
                    return
                payload = json.loads(self.rfile.read(length))
                if self.path == "/disconnect":
                    if payload != {}:
                        raise ValueError("Solicitud de desconexión inválida.")
                    self.reply(200, {"status": "disconnected"})
                    self.server.stop_requested = True
                    return
                if not isinstance(payload, dict) or set(payload) != {"asset_id", "request_id"}:
                    raise ValueError("Solo se admiten asset_id y request_id.")
                if payload["asset_id"] != config["asset"]["asset_id"]:
                    raise ValueError("Modelo no autorizado en esta sesión.")
                task_id = str(UUID(payload["request_id"]))
            except (ValueError, TypeError, AttributeError):
                self.reply(422, {"error": "Solicitud inválida; selecciona el modelo registrado."})
                return
            if task_id in tasks:
                self.reply(200, task_result(task_id))
                return
            if not alive():
                self.reply(503, {"error": "Blender no está conectado."})
                return
            if len(tasks) >= 32:
                self.reply(429, {"error": "Límite de sesión alcanzado; abre una sesión nueva en Blender."})
                return
            if any(task_result(key)["status"] in ("queued", "awaiting_confirmation", "importing") for key in tasks):
                self.reply(409, {"error": "Ya hay una importación pendiente; resuélvela en Blender."})
                return
            tasks[task_id] = True
            write_json(directory / "requests" / f"{task_id}.json",
                       {"task_id": task_id, "asset_id": config["asset"]["asset_id"]})
            self.reply(202, {"task_id": task_id, "status": "queued"})

    with HTTPServer(("127.0.0.1", config["port"]), Handler) as server:
        server.timeout = 0.25
        server.stop_requested = False
        write_json(directory / "ready.json", {"port": server.server_port})
        while not server.stop_requested and time.monotonic() - started < config["ttl"]:
            if time.monotonic() - started > 10 and not alive():
                break
            server.handle_request()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--session-dir", required=True, type=Path)
    serve(parser.parse_args().session_dir)
