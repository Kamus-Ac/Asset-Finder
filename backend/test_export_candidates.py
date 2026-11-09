import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, patch

from fastapi import HTTPException

from backend.export_candidates import export, select_candidates


def candidate(asset_id):
    return {
        "asset_id": asset_id, "name": "Chair",
        "thumbnail_url": "https://example.invalid/thumb.jpg",
        "source_url": "https://example.invalid/model",
        "similarity_score": None,
    }


class ExportTests(unittest.IsolatedAsyncioTestCase):
    def test_filtering_preserves_order_ids_and_omits_scores(self):
        invalid = candidate("bad")
        invalid["thumbnail_url"] = None
        payload, skipped = select_candidates({
            "query": "chair",
            "results": [candidate("b"), invalid, candidate("b"), candidate("a")],
        })
        self.assertEqual([r["asset_id"] for r in payload["results"]], ["b", "a"])
        self.assertEqual(len(skipped), 2)
        self.assertNotIn("similarity_score", payload["results"][0])

    async def test_export_and_upstream_failure(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "candidatos.json"
            with patch("backend.export_candidates.search_sketchfab", new=AsyncMock(
                return_value={"query": "chair", "results": [candidate("one")]},
            )):
                self.assertEqual(await export("chair", output, 0), 0)
            data = json.loads(output.read_text())
            self.assertEqual(data["results"][0]["asset_id"], "one")
            with patch("backend.export_candidates.search_sketchfab", new=AsyncMock(
                side_effect=HTTPException(502, "unavailable"),
            )):
                with self.assertRaises(HTTPException):
                    await export("chair", output, 0)
            self.assertEqual(json.loads(output.read_text()), data)

    async def test_empty_results_do_not_create_file(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "candidatos.json"
            with patch("backend.export_candidates.search_sketchfab", new=AsyncMock(
                return_value={"query": "chair", "results": []},
            )):
                with self.assertRaises(ValueError):
                    await export("chair", output, 0)
            self.assertFalse(output.exists())
