from ai.tests.cpu_case import CpuCase


class PreprocessTests(CpuCase):
    def test_crop_full_image_and_no_input_mutation(self):
        self.run_cpu('''
import numpy as np
from PIL import Image
from ai.preprocess import prepare_image
pixels = np.full((8, 12, 3), (40, 80, 120), dtype=np.uint8)
before = pixels.copy()
mask = np.zeros((8, 12), dtype=bool)
mask[2:6, 3:9] = True
crop = prepare_image(pixels, mask, padding=0)
assert crop.mode == 'RGB' and crop.size == (6, 6)
assert np.array_equal(np.asarray(crop)[1:5], np.full((4, 6, 3), (40,80,120), dtype=np.uint8))
assert np.all(np.asarray(crop)[0] == 255)
assert np.array_equal(pixels, before) and mask.sum() == 24
full = np.ones((8,12), dtype=bool)
assert np.array_equal(np.asarray(prepare_image(pixels, full)), np.asarray(prepare_image(pixels)))
assert prepare_image(Image.fromarray(pixels)).mode == 'RGB'
assert np.array_equal(np.asarray(prepare_image(pixels)), np.asarray(prepare_image(pixels)))
''')

    def test_holes_empty_mask_and_invalid_inputs(self):
        self.run_cpu('''
import numpy as np
from PIL import Image
from ai.preprocess import prepare_image
image = np.zeros((4,4,3), dtype=np.uint8)
mask = np.ones((4,4), dtype=bool); mask[1,1] = False
assert (np.asarray(prepare_image(image, mask, padding=0))[1,1] == 255).all()
cases = [(image, {'mask': m}) for m in (np.zeros((4,4), bool), np.ones((3,4), bool), np.ones((4,4), np.uint8))]
cases += [(v, {}) for v in (None, Image.new('RGBA', (4,4)), np.zeros((0,4,3),np.uint8), image.astype(float))]
cases += [(image, {'padding': v}) for v in (True, -1, float('nan'), 2)]
cases += [(image, {'background': v}) for v in ((-1,0,0), (True,0,0), (0,0), (0.,0,0))]
for im, kwargs in cases:
    try: prepare_image(im, **kwargs)
    except ValueError: pass
    else: raise AssertionError(('Entrada inválida aceptada', kwargs))
''')
