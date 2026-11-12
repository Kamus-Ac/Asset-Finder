"""Pruebas reales en Blender; fixtures GLB pequeños generados en un directorio temporal."""

import json
from pathlib import Path
import struct
import tempfile
import unittest
from unittest.mock import patch

import bpy

# Blender ejecuta este archivo sin añadir su carpeta al sys.path.
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))
from test_import import load_addon

addon = load_addon()


def write_glb(path, *, external_uri=None, empty=False):
    """Triángulo propio sin texturas ni descargas; no reutiliza el validador."""
    binary = struct.pack("<9f", 0, 0, 0, 1, 0, 0, 0, 1, 0)
    document = {
        "asset": {"version": "2.0", "generator": "Asset Finder test"},
        "scene": 0,
        "scenes": [{"nodes": [] if empty else [0]}],
        "nodes": [{"mesh": 0, "name": "AF_Triangle"}],
        "meshes": [{"primitives": [{"attributes": {"POSITION": 0}}]}],
        "buffers": [{"byteLength": len(binary)}],
        "bufferViews": [{"buffer": 0, "byteLength": len(binary)}],
        "accessors": [{"bufferView": 0, "componentType": 5126, "count": 3,
                       "type": "VEC3", "min": [0, 0, 0], "max": [1, 1, 0]}],
    }
    if empty:
        # Blender también importa nodos huérfanos: una escena sin referencias
        # aún puede crear objetos si dejamos nodos/meshes en el documento.
        document = {"asset": {"version": "2.0"}, "scene": 0, "scenes": [{}]}
        binary = b""
    if external_uri is not None:
        document["images"] = [{"uri": external_uri}]
    content = json.dumps(document).encode()
    content += b" " * (-len(content) % 4)
    chunks = struct.pack("<I4s", len(content), b"JSON") + content
    if binary:
        chunks += struct.pack("<I4s", len(binary), b"BIN\0") + binary
    path.write_bytes(struct.pack("<4sII", b"glTF", 2, 12 + len(chunks)) + chunks)
    return path


class BlenderImportTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="asset-finder-blender-")
        self.addCleanup(self.temp.cleanup)
        self.directory = Path(self.temp.name)
        self.path = write_glb(self.directory / "modelo con espacios.GLB")
        self.existing = set(bpy.data.objects)
        self.snapshot = {obj: (obj.name, obj.matrix_world.copy()) for obj in self.existing}
        self.addCleanup(self.cleanup_objects)

    def cleanup_objects(self):
        for obj in set(bpy.data.objects) - self.existing:
            bpy.data.objects.remove(obj, do_unlink=True)

    def assert_preserved(self):
        for obj, (name, matrix) in self.snapshot.items():
            self.assertIn(obj, set(bpy.data.objects))
            self.assertEqual(obj.name, name)
            self.assertEqual(obj.matrix_world, matrix)

    def test_real_import_preserves_scene_and_repeated_import_adds_instances(self):
        first = addon.import_glb(self.path)
        second = addon.import_glb(self.path)
        self.assertEqual(len(first), 1)
        self.assertEqual(len(second), 1)
        self.assertNotEqual(first[0], second[0])
        self.assertEqual(first[0].type, "MESH")
        self.assertEqual(len(first[0].data.vertices), 3)
        self.assertIn(first[0].name, bpy.context.scene.objects)
        self.assert_preserved()

    def test_invalid_files_do_not_change_scene(self):
        corrupt = self.directory / "corrupt.glb"
        corrupt.write_bytes(b"not a glb")
        wrong = self.directory / "model.gltf"
        wrong.write_bytes(self.path.read_bytes())
        for path in (self.directory / "missing.glb", self.directory, wrong, corrupt, ""):
            with self.subTest(path=str(path)), self.assertRaises((OSError, ValueError)):
                addon.import_glb(path)
        self.assertEqual(set(bpy.data.objects), self.existing)
        self.assert_preserved()

    def test_external_resources_are_rejected(self):
        for uri in ("https://example.invalid/a.png", "../texture.png", "file:///tmp/a.png"):
            write_glb(self.path, external_uri=uri)
            with self.subTest(uri=uri), self.assertRaisesRegex(ValueError, "autocontenido"):
                addon.import_glb(self.path)

    def test_size_limit_and_damaged_header(self):
        with patch.object(addon, "MAX_FILE_BYTES", 1), self.assertRaisesRegex(ValueError, "100 MiB"):
            addon.import_glb(self.path)
        data = bytearray(self.path.read_bytes())
        data[8:12] = struct.pack("<I", len(data) + 4)
        self.path.write_bytes(data)
        with self.assertRaisesRegex(ValueError, "Cabecera"):
            addon.import_glb(self.path)

    def test_empty_scene_is_not_reported_as_success(self):
        write_glb(self.path, empty=True)
        with self.assertRaisesRegex(ValueError, "no contiene objetos"):
            addon.import_glb(self.path)

    def test_addon_operator_and_registration_lifecycle(self):
        for _ in range(2):
            addon.register()
            try:
                self.assertTrue(bpy.ops.asset_finder.import_glb.poll())
                self.assertEqual(bpy.ops.asset_finder.import_glb(filepath=str(self.path)), {"FINISHED"})
                self.assert_preserved()
            finally:
                addon.unregister()
        # Ejecutar directamente permite comprobar CANCELLED sin que bpy.ops
        # convierta el informe ERROR del operador en una excepción Python.
        reports = []
        class FailedImport:
            filepath = str(self.directory / "missing.glb")
            def report(self, level, message):
                reports.append((level, message))
        self.assertEqual(addon.ASSETFINDER_OT_import_glb.execute(FailedImport(), bpy.context), {"CANCELLED"})
        self.assertTrue(reports)


if __name__ == "__main__":
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(BlenderImportTests)
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    if not result.wasSuccessful():
        raise RuntimeError("Fallaron las pruebas reales de Blender.")
