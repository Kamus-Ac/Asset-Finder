from ai.tests.cpu_case import CpuCase


class IndexTests(CpuCase):
    def test_incremental_cache_and_real_single_preparation(self):
        self.run_cpu('''
import tempfile
from pathlib import Path
import numpy as np
from PIL import Image
from unittest.mock import patch
from ai.index import build_index, save_index, load_index
from ai.embedding import embed
image=Image.new('RGB',(32,16),'red')
def candidate(id,image):
 return {'asset_id':id,'source_url':'https://example.invalid/'+id,
         'views':[{'view_id':'main','image':image}]}
with tempfile.TemporaryDirectory() as directory:
 index=build_index([candidate('a',image),candidate('b',image)],cache_dir=directory)
 assert index.cache_hits==1 and index.cache_misses==1
 np.testing.assert_allclose(index.vectors[0],embed(image),atol=1e-6)
 with patch('ai.index._encode_prepared',side_effect=AssertionError('Debe usar caché')):
  again=build_index([candidate('c',image)],cache_dir=directory)
 assert again.cache_hits==1 and again.rows[0]['asset_id']=='c'
 changed=build_index([candidate('d',Image.new('RGB',(32,16),'blue'))],cache_dir=directory)
 assert changed.cache_misses==1
 path=Path(directory)/'batch.npz'; save_index(index,path); restored=load_index(path)
 np.testing.assert_array_equal(restored.vectors,index.vectors)
 assert restored.rows==index.rows and restored.metadata==index.metadata
empty=build_index([]); assert empty.vectors.shape==(0,384)
''')
