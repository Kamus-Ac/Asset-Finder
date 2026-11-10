from ai.tests.cpu_case import CpuCase


class ErrorTests(CpuCase):
    def test_memory_translation_is_controlled_not_actual_exhaustion(self):
        self.run_cpu('''
import torch
from PIL import Image
from unittest.mock import patch
from ai.pipeline import run_search
from ai.segmentation import ServiceUnavailableError
image=Image.new('RGB',(4,4))
for error in (MemoryError('simulado'),torch.OutOfMemoryError('simulado')):
 with patch('ai.pipeline.segment',side_effect=error):
  try: run_search(image,[],box_xyxy=[0,0,4,4])
  except ServiceUnavailableError as e: assert 'memoria' in str(e)
  else: raise AssertionError('Ocultó memoria insuficiente')
with patch('ai.pipeline.segment',side_effect=RuntimeError('fallo de código')):
 try:run_search(image,[],box_xyxy=[0,0,4,4])
 except RuntimeError as e:assert 'fallo de código' in str(e)
 else:raise AssertionError('Ocultó fallo inesperado')
''')

    def test_bad_images_index_and_cuda_are_explicit(self):
        self.run_cpu('''
import tempfile
from pathlib import Path
from unittest.mock import patch
from ai.input_manifest import decode_rgb
from ai.index import load_index
from ai.embedding import _get_model
from ai.segmentation import ServiceUnavailableError
for content in (b'no es imagen',None):
 try:decode_rgb(content)
 except ValueError:pass
 else:raise AssertionError('Aceptó archivo inválido')
with tempfile.TemporaryDirectory() as d:
 path=Path(d)/'bad.npz';path.write_bytes(b'no es npz')
 try:load_index(path)
 except ValueError:pass
 else:raise AssertionError('Aceptó índice dañado')
with patch('torch.cuda.is_available',return_value=False):
 try:_get_model('cuda')
 except ServiceUnavailableError as e:assert 'CUDA' in str(e)
 else:raise AssertionError('No rechazó CUDA ausente')
''')
