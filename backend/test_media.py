import io
import os
import tempfile
import unittest
from unittest.mock import patch
from uuid import uuid4

from fastapi.testclient import TestClient
from PIL import Image

from backend.main import app


class MediaTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.environment = patch.dict(os.environ, {
            "ASSET_FINDER_MEDIA_DIR": self.directory.name,
        })
        self.environment.start()
        self.addCleanup(self.environment.stop)
        self.client = TestClient(app)

    def upload(self, content):
        return self.client.post("/media", files={
            "file": ("reference.jpg", content, "image/jpeg"),
        })

    def test_orientation_retrieval_and_persistence(self):
        content = io.BytesIO()
        exif = Image.Exif()
        exif[274] = 6
        Image.new("RGB", (80, 40), "red").save(content, "JPEG", exif=exif)
        response = self.upload(content.getvalue())
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual((data["width"], data["height"]), (40, 80))
        # A fresh client reads from disk rather than an in-memory registry.
        client = TestClient(app)
        self.assertEqual(client.get(f'/media/{data["media_id"]}').json(), data)
        response = client.get(data["file_url"])
        self.assertEqual(response.headers["content-type"], "image/png")
        with Image.open(io.BytesIO(response.content)) as image:
            self.assertEqual(image.size, (40, 80))
            self.assertFalse(image.getexif())

    def test_rejects_invalid_and_unsupported_files(self):
        self.assertEqual(self.upload(b"not an image").status_code, 415)
        content = io.BytesIO()
        Image.new("RGB", (10, 10)).save(content, "BMP")
        self.assertEqual(self.upload(content.getvalue()).status_code, 415)
        self.assertEqual(self.client.post("/media").status_code, 422)

    def test_limits_and_unknown_ids(self):
        with patch("backend.media.MAX_BYTES", 10):
            self.assertEqual(self.upload(b"x" * 11).status_code, 413)
        content = io.BytesIO()
        Image.new("RGB", (10, 10)).save(content, "PNG")
        with patch("backend.media.MAX_PIXELS", 50):
            self.assertEqual(self.upload(content.getvalue()).status_code, 413)
        self.assertEqual(self.client.get(f"/media/{uuid4()}").status_code, 404)
        self.assertEqual(self.client.get(f"/media/{uuid4()}/file").status_code, 404)
        self.assertEqual(self.client.get("/media/invalid").status_code, 422)


if __name__ == "__main__":
    unittest.main()
