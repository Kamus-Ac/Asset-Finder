"""Interfaz pública, indisponibilidad y PNG real; sin llamadas al backend."""

from pathlib import Path
import subprocess
import sys
import unittest

from ai import service


ROOT = Path(__file__).resolve().parents[2]
CPU_PYTHON = ROOT / "ai/.venv-sam2/bin/python"
CHECKPOINT = ROOT / "ai/sam2/checkpoints/sam2.1_hiera_tiny.pt"


class ServiceTest(unittest.TestCase):
    def test_import_does_not_load_models_or_require_heavy_dependencies(self):
        result = subprocess.run([
            sys.executable, "-I", "-c",
            "import sys; sys.path.insert(0, sys.argv[1]); from ai import service; "
            "assert not {'numpy', 'torch', 'sam2'} & sys.modules.keys()", str(ROOT),
        ], capture_output=True, text=True, timeout=15)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_missing_index_never_returns_fake_results(self):
        for operation, args in ((service.search, ([1.0], 5)),):
            with self.subTest(operation=operation.__name__):
                with self.assertRaisesRegex(service.ServiceUnavailableError, "servicio no disponible"):
                    operation(*args)

    @unittest.skipUnless(CPU_PYTHON.is_file() and CHECKPOINT.is_file(),
                         "Requiere entorno y pesos CPU locales; sin descargas automáticas")
    def test_real_segment_png_roundtrip_and_errors(self):
        source = """
import sys
sys.path.insert(0, sys.argv[1])
from io import BytesIO
from pathlib import Path
import numpy as np
from PIL import Image
from ai.service import segment, mask_to_png, ServiceUnavailableError
image = Image.open(Path(sys.argv[1]) / 'ai/examples/prueba.jpeg').convert('RGB')
image.thumbnail((1024, 1024))
mask, score = segment(image, [222, 355, 430, 562])
assert mask.dtype == bool and mask.shape == (image.height, image.width)
assert 0 < mask.sum() < mask.size and np.isfinite(score)
png = mask_to_png(mask)
assert isinstance(png, bytes) and png.startswith(b'\\x89PNG\\r\\n\\x1a\\n')
decoded = Image.open(BytesIO(png))
assert decoded.mode == 'L' and decoded.size == image.size
np.testing.assert_array_equal(np.asarray(decoded), mask.astype(np.uint8) * 255)
for value in (None, [[True]], np.zeros((2, 3), dtype=np.uint8),
              np.zeros((0, 3), dtype=bool), np.zeros((2, 3, 1), dtype=bool)):
    try:
        mask_to_png(value)
    except ValueError:
        pass
    else:
        raise AssertionError('Aceptó una máscara con tipo o dimensiones incorrectos')
try:
    segment(image, [])
except ValueError:
    pass
else:
    raise AssertionError('No propagó selección inválida')
try:
    segment(image, [222, 355, 430, 562], checkpoint='pesos-inexistentes-t09.pt')
except ServiceUnavailableError as error:
    assert 'servicio no disponible' in str(error)
else:
    raise AssertionError('No propagó pesos ausentes')
"""
        result = subprocess.run([str(CPU_PYTHON), "-I", "-c", source, str(ROOT)],
                                capture_output=True, text=True, timeout=90)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
