from ai.tests.cpu_case import CpuCase


class EmbeddingTests(CpuCase):
    def test_real_dino_normalized_cached_and_no_download(self):
        self.run_cpu('''
import numpy as np
from pathlib import Path
from PIL import Image
from unittest.mock import patch
from ai.embedding import embed, _CACHE, model_identity
from ai import resources
image = Image.open(Path(sys.argv[1])/'ai/prueba.jpeg').convert('RGB')
with patch('urllib.request.urlopen', side_effect=AssertionError('Inferencia no descarga')):
    a=embed(image); b=embed(image)
assert a.dtype == np.float32 and a.shape == (384,) and np.isfinite(a).all()
assert abs(np.linalg.norm(a)-1)<1e-6 and np.array_equal(a,b)
assert len(_CACHE)==1 and model_identity()['dimension']==384
with patch.object(resources,'DINO_WEIGHTS',Path('no-existe-dino.pth')):
    try: embed(image)
    except RuntimeError as e: assert 'servicio no disponible' in str(e)
    else: raise AssertionError('No rechazó pesos ausentes')
''')

    def test_invalid_selection_and_device_before_model(self):
        self.run_cpu('''
import numpy as np
from unittest.mock import patch
from ai.embedding import embed
image=np.zeros((4,4,3),np.uint8)
with patch('ai.embedding._get_model',side_effect=AssertionError('No cargar')):
    for kwargs in ({'mask':np.zeros((4,4),bool)}, {'device':'otro'}):
        try: embed(image,**kwargs)
        except ValueError: pass
        else: raise AssertionError('Entrada inválida aceptada')
''')
