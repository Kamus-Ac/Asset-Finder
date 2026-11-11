"""Prueba mínima del recurso local, sin cargar SAM ni requerir CUDA."""

from pathlib import Path
import unittest


class SmokeTest(unittest.TestCase):
    def test_reference_image_has_jpeg_markers(self):
        image = Path(__file__).resolve().parents[1] / "examples/prueba.jpeg"
        with image.open("rb") as stream:
            self.assertEqual(stream.read(3), b"\xff\xd8\xff")
            stream.seek(-2, 2)
            self.assertEqual(stream.read(2), b"\xff\xd9")
