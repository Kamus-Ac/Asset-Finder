"""Pruebas HTTP/IPC reales; la importación bpy se prueba con verify_installation.py."""

import json
from pathlib import Path
import tempfile
import time
import unittest
from urllib.error import HTTPError
from urllib.request import Request, urlopen
from uuid import uuid4

from integrations.blender.bridge import Session
from integrations.blender.connector import write_json


ORIGIN = "http://127.0.0.1:8765"


class ConnectorTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.model = Path(self.temp.name) / "transport-fixture.glb"
        # Solo valida transporte e integridad; no se presenta como geometría GLB.
        self.model.write_bytes(b"fixture de transporte local")
        self.session = self.start()

    def start(self, ttl=30):
        session = Session(self.model, ORIGIN, port=0, ttl=ttl)
        self.addCleanup(session.close)
        for _ in range(60):
            session.poll()
            if session.port:
                return session
            time.sleep(0.05)
        self.fail("El conector no quedó disponible")

    def request(self, path, payload=None, *, headers=None, method=None, session=None):
        session = session or self.session
        merged = {"Origin": ORIGIN, "Authorization": "Bearer " + session.token,
                  "Content-Type": "application/json"}
        for key, value in (headers or {}).items():
            if value is None:
                merged.pop(key, None)
            else:
                merged[key] = value
        request = Request(f"http://127.0.0.1:{session.port}{path}",
                          data=None if payload is None else json.dumps(payload).encode(),
                          headers=merged, method=method)
        try:
            response = urlopen(request, timeout=4)
        except HTTPError as error:
            response = error
        with response:
            return response.status, json.load(response), response.headers

    def submit(self, **overrides):
        return self.request("/imports", {"asset_id": "demo-local", "request_id": str(uuid4()), **overrides})

    def test_origin_host_token_and_preflight(self):
        self.assertEqual(self.request("/session")[0], 200)
        for headers, status in [({"Origin": None}, 403), ({"Origin": "https://evil.invalid"}, 403),
                                ({"Host": "evil.invalid"}, 403), ({"Authorization": "Bearer wrong"}, 401)]:
            with self.subTest(headers=headers):
                code, _, reply = self.request("/session", headers=headers)
                self.assertEqual(code, status)
                if headers.get("Origin") != ORIGIN and "Origin" in headers:
                    self.assertNotIn("Access-Control-Allow-Origin", reply)
        code, _, headers = self.request("/imports", method="OPTIONS", headers={
            "Authorization": None, "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "authorization, content-type"})
        self.assertEqual(code, 200)
        self.assertEqual(headers["Access-Control-Allow-Origin"], ORIGIN)

    def test_confirmation_idempotency_and_single_pending_job(self):
        task_id = str(uuid4())
        self.assertEqual(self.submit(request_id=task_id)[0], 202)
        self.assertEqual(self.request(f"/tasks/{task_id}")[1]["status"], "queued")
        self.session.poll()
        self.assertEqual(self.session.pending, task_id)
        self.assertEqual(self.request(f"/tasks/{task_id}")[1]["status"], "awaiting_confirmation")
        self.assertEqual(self.submit()[0], 409)
        self.assertEqual(self.submit(request_id=task_id)[0], 200)
        self.session.result("cancelled", "Rechazado en la prueba")
        self.assertEqual(self.submit(request_id=task_id)[1]["status"], "cancelled")
        self.session.poll()
        self.assertIsNone(self.session.pending)
        self.assertEqual(len(self.session.seen), 1)

    def test_cannot_choose_paths_urls_or_unregistered_assets(self):
        for extra in ({"path": "/tmp/other.glb"}, {"url": "https://evil.invalid/model.glb"},
                      {"code": "import os"}, {"asset_id": "other"}, {"request_id": "../../file"}):
            with self.subTest(extra=extra):
                self.assertEqual(self.submit(**extra)[0], 422)
        self.assertEqual(self.request("/imports", {}, headers={"Content-Type": "text/plain"})[0], 415)
        self.assertEqual(self.request("/imports", {"data": "x" * 2050})[0], 413)
        self.assertEqual(list((self.session.directory / "requests").glob("*.json")), [])

    def test_disconnected_blender_and_changed_file(self):
        write_json(self.session.directory / "heartbeat.json", {"time": time.time() - 10})
        self.assertFalse(self.request("/health", headers={"Authorization": None})[1]["blender_connected"])
        self.assertEqual(self.submit()[0], 503)
        self.session.poll()
        self.session.model.write_bytes(b"changed")
        with self.assertRaisesRegex(ValueError, "cambió"):
            self.session.verified_model()
        self.assertEqual(self.model.read_bytes(), b"fixture de transporte local")

    def test_disconnect_revokes_code_and_cleans_only_session_files(self):
        old_code = self.session.token
        directory = self.session.directory
        self.assertEqual(self.request("/disconnect", {})[0], 200)
        self.session.process.wait(timeout=4)
        self.session.close()
        self.assertFalse(directory.exists())
        fresh = self.start()
        self.assertEqual(self.request("/session", session=fresh,
                                     headers={"Authorization": "Bearer " + old_code})[0], 401)
        self.assertTrue(self.model.exists())

    def test_session_expires(self):
        expiring = self.start(ttl=0.2)
        expiring.process.wait(timeout=4)
        with self.assertRaises(RuntimeError):
            expiring.poll()


if __name__ == "__main__":
    unittest.main()
