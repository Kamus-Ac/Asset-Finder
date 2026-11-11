"""Caché, validación T07 e integración CPU en el entorno local existente."""

from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import subprocess
import time
import unittest
from unittest.mock import patch

from ai import segmentation


AI = Path(__file__).resolve().parents[1]
CPU_PYTHON = AI / ".venv-sam2/bin/python"
CHECKPOINT = AI / "sam2/checkpoints/sam2.1_hiera_tiny.pt"


class ModelCacheTest(unittest.TestCase):
    def setUp(self):
        self.cache = patch.dict(segmentation._CACHE, clear=True)
        self.cache.start()
        self.addCleanup(self.cache.stop)

    def test_concurrent_first_calls_load_only_once(self):
        def build(*_args):
            time.sleep(0.02)
            return object()
        with patch.object(segmentation, "_build_predictor", side_effect=build) as loader:
            with ThreadPoolExecutor(max_workers=8) as pool:
                states = list(pool.map(lambda _: segmentation._get_predictor("cpu", CHECKPOINT), range(8)))
        self.assertEqual(loader.call_count, 1)
        self.assertTrue(all(state is states[0] for state in states))

    def test_devices_have_separate_models(self):
        with patch.object(segmentation, "_build_predictor") as loader:
            segmentation._get_predictor("cpu", CHECKPOINT)
            segmentation._get_predictor("cuda", CHECKPOINT)
        self.assertEqual(loader.call_count, 2)

    def test_failed_load_is_not_cached(self):
        error = segmentation.ServiceUnavailableError("servicio no disponible")
        with patch.object(segmentation, "_build_predictor", side_effect=[error, object()]) as loader:
            with self.assertRaises(segmentation.ServiceUnavailableError):
                segmentation._get_predictor("cpu", CHECKPOINT)
            segmentation._get_predictor("cpu", CHECKPOINT)
        self.assertEqual(loader.call_count, 2)

    def test_unknown_device_is_rejected_before_loading(self):
        with self.assertRaises(ValueError):
            segmentation.segment(None, device="dispositivo-inventado")


@unittest.skipUnless(CPU_PYTHON.is_file(), "Requiere el entorno CPU local; no se instala automáticamente")
class CpuSegmentationTest(unittest.TestCase):
    def run_cpu(self, source):
        setup = """
import importlib.util, sys
import numpy as np
from PIL import Image
spec = importlib.util.spec_from_file_location('segmentation_test_cpu', sys.argv[1])
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
"""
        result = subprocess.run([str(CPU_PYTHON), "-I", "-c", setup + source,
                                 str(AI / "segmentation.py"), str(AI / "examples/prueba.jpeg")],
                                capture_output=True, text=True, timeout=90)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def assert_rejected(self, cases):
        self.run_cpu("cases = " + cases + """
from unittest.mock import patch
with patch.object(module, '_get_predictor', side_effect=AssertionError('No debe cargar SAM')) as loader:
    for image, box, points, message in cases:
        try:
            module.segment(image, box, points)
        except ValueError as error:
            assert message in str(error), (message, str(error))
        else:
            raise AssertionError(('No rechazó entrada inválida', box, points))
    loader.assert_not_called()
""")

    def test_non_rgb_images_are_rejected(self):
        self.assert_rejected("""[
            (image, [0, 0, 8, 6], None, 'imagen') for image in (
                Image.new('L', (8, 6)), Image.new('RGBA', (8, 6)),
                np.zeros((6, 8), dtype=np.uint8), np.zeros((6, 8, 4), dtype=np.uint8),
                np.zeros((6, 8, 3), dtype=np.float32), 'no es una imagen', None)
        ]""")

    def test_empty_image_dimensions_are_rejected(self):
        self.assert_rejected("""[
            (np.zeros(shape, dtype=np.uint8), [0, 0, 1, 1], None, 'imagen')
            for shape in ((0, 8, 3), (6, 0, 3))
        ]""")

    def test_box_order_and_bounds_are_rejected(self):
        self.assert_rejected("""[
            (np.zeros((6, 8, 3), dtype=np.uint8), box, None, 'box_xyxy')
            for box in ([2, 1, 2, 5], [3, 1, 2, 5], [1, 2, 6, 2], [1, 3, 6, 2],
                        [-1, 0, 8, 6], [0, -1, 8, 6], [0, 0, 9, 6], [0, 0, 8, 7])
        ]""")

    def test_box_shape_types_and_nonfinite_coordinates_are_rejected(self):
        self.assert_rejected("""[
            (np.zeros((6, 8, 3), dtype=np.uint8), box, None, 'box_xyxy')
            for box in ([], [0, 0, 8], [0, 0, 8, 6, 1], [[0, 0, 8, 6]],
                        ['0', 0, 8, 6], [False, 0, 8, 6],
                        [float('nan'), 0, 8, 6], [0, 0, float('inf'), 6])
        ]""")

    def test_point_bounds_types_and_nonfinite_values_are_rejected(self):
        self.assert_rejected("""[
            (np.zeros((6, 8, 3), dtype=np.uint8), None,
             [{'x': x, 'y': y, 'label': 1}], 'points')
            for x, y in ((-1, 0), (0, -1), (8, 0), (0, 6), ('1', 0), (True, 0),
                         (float('nan'), 0), (0, float('inf')))
        ]""")

    def test_labels_must_be_integer_zero_or_one(self):
        self.assert_rejected("""[
            (np.zeros((6, 8, 3), dtype=np.uint8), None,
             [{'x': 1, 'y': 1, 'label': label}], 'label')
            for label in (-1, 2, 0.5, 1.0, '1', True, np.bool_(False), float('nan'))
        ]""")

    def test_malformed_points_are_rejected(self):
        self.assert_rejected("""[
            (np.zeros((6, 8, 3), dtype=np.uint8), [0, 0, 8, 6], points, 'points')
            for points in ({}, 'punto', [None], [{}], [{'x': 1, 'y': 1}])
        ]""")

    def test_missing_selection_is_rejected(self):
        self.assert_rejected("""[
            (np.zeros((6, 8, 3), dtype=np.uint8), None, points, 'selección vacía')
            for points in (None, [], ())
        ]""")

    def test_valid_box_edges_and_points_only_remain_supported(self):
        self.run_cpu("""
class FakePredictor:
    def set_image(self, pixels):
        assert pixels.flags.writeable
        self.shape = pixels.shape[:2]
    def predict(self, **kwargs):
        assert kwargs['multimask_output'] is False
        assert kwargs['box'] is not None or kwargs['point_coords'] is not None
        mask = np.zeros((1, *self.shape), dtype=bool)
        mask[0, 0, 0] = True
        return mask, np.array([0.5]), None
module._build_predictor = lambda *args: FakePredictor()
image = np.zeros((6, 8, 3), dtype=np.uint8)
image.setflags(write=False)
points = [{'x': np.float32(0), 'y': 0, 'label': np.int64(1)},
          {'x': 7, 'y': 5, 'label': 0}]
for box, prompts in (([0, 0, 8, 6], None), ([0, 0, 8, 6], []),
                     (None, points), ([0, 0, 8, 6], points)):
    mask, score = module.segment(image, box, prompts)
    assert mask.shape == (6, 8) and mask.dtype == bool and score == 0.5
assert image.sum() == 0 and not image.flags.writeable
""")

    def test_prompts_and_output_with_explicit_fake_predictor(self):
        self.run_cpu("""
class FakePredictor:
    def set_image(self, image):
        self.image = image
    def predict(self, **kwargs):
        assert kwargs['multimask_output'] is False
        np.testing.assert_array_equal(kwargs['box'], [1, 1, 6, 5])
        np.testing.assert_array_equal(kwargs['point_coords'], [[2, 3], [0, 0]])
        np.testing.assert_array_equal(kwargs['point_labels'], [1, 0])
        mask = np.zeros((1, 6, 8), dtype=bool)
        mask[0, 2:5, 2:6] = True
        return mask, np.array([0.75]), None
module._build_predictor = lambda *args: FakePredictor()
image = np.zeros((6, 8, 3), dtype=np.uint8)
points = [{'x': 2, 'y': 3, 'label': 1}, {'x': 0, 'y': 0, 'label': 0}]
for value in (image, Image.fromarray(image)):
    mask, score = module.segment(value, [1, 1, 6, 5], points)
    assert mask.shape == (6, 8) and mask.dtype == bool and mask.sum() == 12
    assert isinstance(score, float) and score == 0.75
assert image.sum() == 0
""")

    def test_unavailable_weights_and_cuda_have_explicit_errors(self):
        self.run_cpu("""
from pathlib import Path
from unittest.mock import patch
image = np.zeros((6, 8, 3), dtype=np.uint8)
try:
    module.segment(image, [1, 1, 6, 5], checkpoint=Path(sys.argv[1]).with_suffix('.missing'))
except module.ServiceUnavailableError as error:
    assert 'servicio no disponible' in str(error) and 'pesos ausentes' in str(error)
else:
    raise AssertionError('No rechazó pesos ausentes')
with patch('torch.cuda.is_available', return_value=False):
    try:
        module.segment(image, [1, 1, 6, 5], device='cuda')
    except module.ServiceUnavailableError as error:
        assert 'servicio no disponible' in str(error) and 'CUDA' in str(error)
    else:
        raise AssertionError('No rechazó CUDA ausente')
""")

    @unittest.skipUnless(CHECKPOINT.is_file(), "Requiere pesos SAM locales; sin descargas automáticas")
    def test_real_sam_mask_and_single_model_load(self):
        self.run_cpu("""
from unittest.mock import patch
image = Image.open(sys.argv[2]).convert('RGB')
image.thumbnail((1024, 1024))
width, height = image.size
box = [width * 0.1, height * 0.05, width * 0.9, height * 0.95]
with patch.object(module, '_build_predictor', wraps=module._build_predictor) as loader:
    first, score = module.segment(image, box, device='cpu')
    second, _ = module.segment(image, box, device='cpu')
    assert loader.call_count == 1
assert first.shape == (height, width) and first.dtype == bool
assert 0 < first.sum() < first.size and np.isfinite(score)
np.testing.assert_array_equal(first, second)
""")
