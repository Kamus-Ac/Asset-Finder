"""HTTP contract and failure handling; inference is mocked here, live smoke is separate."""
import asyncio
from io import BytesIO
import os
import tempfile
import time
import unittest
from unittest.mock import AsyncMock, patch
from uuid import uuid4

import httpx
import numpy as np
from fastapi import HTTPException
from fastapi.testclient import TestClient
from PIL import Image

from backend.main import app
from backend.catalog import discover, allowed_thumbnail, download_images
from backend.connectors.sketchfab import search_sketchfab
from backend.connectors.polyhaven import search_polyhaven
from backend import visual_search as jobs


def candidate(source="sketchfab", uid="one"):
    return {"asset_id": f"{source}_{uid}", "name": "Chair", "source": source,
            "source_url": "https://sketchfab.com/models/one",
            "thumbnail_url": "https://media.sketchfab.com/one.jpg", "model_available": False}


class ConnectorTests(unittest.IsolatedAsyncioTestCase):
    async def test_cursor_pagination_and_deduplication_above_24(self):
        calls = []
        def respond(request):
            calls.append(request)
            page = 0 if "cursor" not in request.url.params else 1
            models = [{"uid": str(i), "viewerUrl": "https://sketchfab.com/models/x",
                       "thumbnails": {"images": [{"url": "https://media.sketchfab.com/x.jpg", "width": 512}]}}
                      for i in (range(24) if page == 0 else range(23, 35))]
            return httpx.Response(200, json={"results": models, "cursors": {"next": "next" if page == 0 else None}})
        real_client = httpx.AsyncClient
        with patch("backend.connectors.sketchfab.httpx.AsyncClient", side_effect=lambda **kw: real_client(
                transport=httpx.MockTransport(respond), **kw)):
            result = await search_sketchfab("chair", candidate_limit=None)
        self.assertEqual(len(result["results"]), 35)
        self.assertEqual(len(calls), 2)
        self.assertTrue(result["exhausted"])
        self.assertEqual(calls[1].url.params["cursor"], "next")

    async def test_polyhaven_real_contract_and_no_upstream_score_leak(self):
        def respond(request):
            self.assertEqual(request.headers["User-Agent"], "AssetFinder/1.0")
            if request.url.path == "/search":
                return httpx.Response(200, json={"total": 1, "results": [{"slug": "chair", "score": .9}]})
            return httpx.Response(200, json={"chair": {"name": "Chair", "type": 2,
                    "thumbnail_url": "https://cdn.polyhaven.com/chair.png"}})
        real_client = httpx.AsyncClient
        with patch("backend.connectors.polyhaven.httpx.AsyncClient", side_effect=lambda **kw: real_client(
                transport=httpx.MockTransport(respond), **kw)):
            data = await search_polyhaven("silla")
        self.assertEqual(data["results"][0]["source"], "polyhaven")
        self.assertIsNone(data["results"][0]["similarity_score"])

    async def test_partial_failure_and_complete_outage(self):
        with patch.dict("backend.catalog.SOURCES", {
            "sketchfab": AsyncMock(side_effect=HTTPException(502, "offline")),
            "polyhaven": AsyncMock(return_value={"results": [candidate("polyhaven")], "warnings": []}),
        }):
            result = await discover("chair", ["sketchfab", "polyhaven"])
            self.assertEqual(len(result["results"]), 1)
            self.assertEqual(result["sources"][0]["status"], "unavailable")
            with self.assertRaises(HTTPException):
                await discover("chair", ["sketchfab"])

    async def test_thumbnails_reject_private_hosts_redirects_and_corrupt_images(self):
        for url in ["http://media.sketchfab.com/a", "https://127.0.0.1/a", "https://media.sketchfab.com.evil/a",
                    "https://user@media.sketchfab.com/a", "https://cdn.polyhaven.com:8080/a"]:
            self.assertFalse(allowed_thumbnail(url))
        seen = []
        def respond(request):
            seen.append(str(request.url))
            return httpx.Response(302, headers={"Location": "http://127.0.0.1/private"})
        real_client = httpx.AsyncClient
        with patch("backend.catalog.httpx.AsyncClient", side_effect=lambda **kw: real_client(
                transport=httpx.MockTransport(respond), **kw)):
            images, warnings = await download_images([candidate()])
        self.assertEqual(images, {})
        self.assertEqual(len(seen), 1)
        self.assertEqual(len(warnings), 1)


class JobTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        env = patch.dict(os.environ, {"ASSET_FINDER_MEDIA_DIR": self.temp.name + "/media",
                                     "ASSET_FINDER_JOBS_DIR": self.temp.name + "/jobs"})
        env.start()
        self.addCleanup(env.stop)
        self.client = TestClient(app)
        buf = BytesIO()
        Image.new("RGB", (32, 24), "red").save(buf, "PNG")
        media = self.client.post("/media", files={"file": ("image.png", buf.getvalue(), "image/png")}).json()
        self.body = {"media_id": media["media_id"], "image_width": 32, "image_height": 24,
                     "box_xyxy": [1, 1, 30, 22], "q": "chair"}

    def wait(self, task_id):
        for _ in range(200):
            task = self.client.get(f"/tasks/{task_id}").json()
            if task["status"] in ("failed", "completed"):
                return task
            time.sleep(.02)
        self.fail("Worker did not finish")

    def test_rejects_invalid_selection_dimensions_source_and_unknown_media(self):
        for change in [{"box_xyxy": [30, 0, 1, 20]}, {"image_width": 99}, {"q": "  "},
                       {"sources": ["arbitrary"]}, {"k": 0}, {"candidate_limit": 0}, {"max_pages": 101},
                       {"box_xyxy": None, "points": []}, {"points": [{"x": 33, "y": 1, "label": 1}]}]:
            self.assertEqual(self.client.post("/searches", json=self.body | change).status_code, 422)
        self.assertEqual(self.client.post("/searches", json=self.body | {"media_id": str(uuid4())}).status_code, 404)

    def test_completed_search_persists_ranked_report_and_png_artifacts(self):
        class Outcome:
            mask = np.ones((24, 32), dtype=bool)
            crop = Image.new("RGB", (32, 24))
            def report(self):
                return {"results": [candidate() | {"similarity_score": .75}], "warnings": [],
                        "comparison": {"compared": 1, "available": 1}, "timings": {"total_seconds": .1}}
        with patch("backend.visual_search.discover", new=AsyncMock(return_value={
                "query": "chair", "results": [candidate()], "sources": [], "warnings": []})), patch(
                "backend.visual_search.download_images", new=AsyncMock(return_value=(
                    {"sketchfab_one": Image.new("RGB", (32, 24))}, []))), patch(
                "ai.service.run_search", return_value=Outcome()) as run:
            response = self.client.post("/searches", json=self.body)
            self.assertEqual(response.status_code, 202)
            task = self.wait(response.json()["task_id"])
            self.assertEqual(task["status"], "completed", task)
            self.assertEqual(task["result"]["results"][0]["similarity_score"], .75)
            self.assertEqual(run.call_args.kwargs["box_xyxy"], (1, 1, 30, 22))
            for field in ["mask_url", "crop_url"]:
                artifact = self.client.get(task["result"][field])
                self.assertEqual(artifact.status_code, 200)
                self.assertEqual(artifact.headers["content-type"], "image/png")
            self.assertEqual(TestClient(app).get(f'/tasks/{task["task_id"]}').json(), task)

    def test_no_candidates_fails_without_mock_results(self):
        with patch("backend.visual_search.discover", new=AsyncMock(return_value={"results": []})):
            response = self.client.post("/searches", json=self.body)
            task = self.wait(response.json()["task_id"])
        self.assertEqual(task["status"], "failed")
        self.assertIsNone(task["result"])
        self.assertEqual(task["error"]["code"], 422)

    def test_restart_and_artifact_path_validation(self):
        task_id = uuid4()
        jobs.update_report(task_id, status="running", stage="comparing", result=None, error=None)
        task = self.client.get(f"/tasks/{task_id}").json()
        self.assertEqual(task["status"], "failed")
        self.assertEqual(self.client.get(f"/tasks/{task_id}/files/task.json").status_code, 422)
        self.assertEqual(self.client.get(f"/tasks/{uuid4()}").status_code, 404)

    def test_segmentations_returns_task_and_mask(self):
        body = {key: value for key, value in self.body.items() if key != "q"}
        with patch("ai.service.segment", return_value=(np.ones((24, 32), dtype=bool), .8)):
            response = self.client.post("/segmentations", json=body)
            self.assertEqual(response.status_code, 202)
            task = self.wait(response.json()["task_id"])
        self.assertEqual(task["status"], "completed", task)
        self.assertEqual(self.client.get(task["result"]["mask_url"]).status_code, 200)


if __name__ == "__main__":
    unittest.main()
