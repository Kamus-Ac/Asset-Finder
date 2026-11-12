"""Demo CPU en localhost. Usa el módulo IA; no sustituye la API del equipo."""

import argparse
import base64
import binascii
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from io import BytesIO
import json
from pathlib import Path
import threading
from urllib.parse import urlsplit

from .input_manifest import decode_rgb, load_manifest, load_rgb
from .pipeline import run_search
from .resources import BASE, SAMPLE_IMAGE
from .segmentation import ServiceUnavailableError


def png_data(image):
    output = BytesIO()
    image.save(output, format="PNG")
    return "data:image/png;base64," + base64.b64encode(output.getvalue()).decode()


def handler_for(candidates, *, device="cpu", cache_dir=None):
    previews = {}
    for candidate in candidates:
        for view in candidate.get("views", []):
            image = view["image"].copy()
            image.thumbnail((320, 320))
            previews[candidate["asset_id"]] = png_data(image)
            break
    inference_lock = threading.Lock()

    class Handler(BaseHTTPRequestHandler):
        def reply(self, status, content, content_type="application/json; charset=utf-8"):
            if isinstance(content, dict):
                content = json.dumps(content, ensure_ascii=False, allow_nan=False).encode()
            self.send_response(status)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(content)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.end_headers()
            self.wfile.write(content)

        def do_GET(self):
            path = urlsplit(self.path).path
            if path == "/":
                self.reply(200, (BASE/"web/demo.html").read_bytes(), "text/html; charset=utf-8")
            elif path == "/blender-demo.js":
                self.reply(200, (BASE/"web/blender-demo.js").read_bytes(), "text/javascript; charset=utf-8")
            elif path == "/sample":
                image = load_rgb(SAMPLE_IMAGE)
                image.thumbnail((1024,1024))
                self.reply(200, {"image":png_data(image), "box":[222,355,430,562],
                                 "candidate_count":len(candidates)})
            else:
                self.reply(404, {"error":"Ruta no encontrada"})

        def do_POST(self):
            if urlsplit(self.path).path != "/run":
                self.reply(404, {"error":"Ruta no encontrada"})
                return
            origin = self.headers.get("Origin")
            expected = f"http://{self.headers.get('Host')}"
            if origin is not None and origin != expected:
                self.reply(403, {"error":"Origen no permitido para la demo local"})
                return
            try:
                length = int(self.headers.get("Content-Length", "0"))
                if not 0 < length <= 14 * 1024 * 1024:
                    self.reply(413, {"error":"Solicitud vacía o mayor de 14 MiB"})
                    return
                payload = json.loads(self.rfile.read(length))
                if not isinstance(payload, dict) or not isinstance(payload.get("image"), str):
                    raise ValueError("Se requiere imagen PNG en la solicitud")
                prefix = "data:image/png;base64,"
                if not payload["image"].startswith(prefix):
                    raise ValueError("Se requiere imagen PNG base64")
                content = base64.b64decode(payload["image"][len(prefix):], validate=True)
                image = decode_rgb(content)
                with inference_lock:
                    outcome = run_search(image,candidates,box_xyxy=payload.get("box"),
                                         points=payload.get("points"),k=payload.get("k",5),
                                         candidate_limit=payload.get("candidate_limit"),
                                         device=device,cache_dir=cache_dir)
                from .service import mask_to_png
                mask = "data:image/png;base64,"+base64.b64encode(mask_to_png(outcome.mask)).decode()
                result = outcome.report()
                result.update(mask=mask,crop=png_data(outcome.crop),previews=previews)
                self.reply(200,result)
            except (ValueError, binascii.Error) as error:
                self.reply(422, {"error":str(error)})
            except ServiceUnavailableError as error:
                self.reply(503, {"error":str(error)})
            except Exception:
                self.log_error("Error inesperado durante la inferencia; consultar la terminal")
                self.reply(500, {"error":"Falló la ejecución; revisar el entorno de IA"})

        def log_message(self, format, *args):
            print("Demo:", format % args, flush=True)

    return Handler


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port",type=int,default=8765)
    parser.add_argument("--manifest",type=Path,default=BASE/"demo_data/manifest.json")
    parser.add_argument("--device",choices=("cpu","cuda"),default="cpu")
    parser.add_argument("--threads",type=int,default=2)
    args = parser.parse_args()
    if not 1 <= args.port <= 65535 or args.threads < 1:
        parser.error("Puerto/hilos inválidos")
    import torch
    torch.set_num_threads(args.threads)
    candidates = load_manifest(args.manifest)
    handler = handler_for(candidates,device=args.device,cache_dir=BASE/"cache")
    with ThreadingHTTPServer(("127.0.0.1",args.port),handler) as server:
        print(f"Asset Finder IA: http://127.0.0.1:{args.port} · {len(candidates)} candidatos · {args.device}",flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("Demo detenida.")


if __name__ == "__main__":
    main()
