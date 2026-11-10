from ai.tests.cpu_case import CpuCase


class IndexTests(CpuCase):
    def test_rejects_incompatible_corrupt_and_duplicate_data(self):
        self.run_cpu('''
import copy,tempfile
from pathlib import Path
import numpy as np
from ai.index import CandidateIndex,validate_index,save_index,load_index,_write_npz
from ai.embedding import model_identity
v=np.zeros((1,384),np.float32); v[0,0]=1
meta={'a':{'asset_id':'a','source_url':'https://example.invalid/a'}}
row={'asset_id':'a','view_id':'main','image_sha256':'a'*64}
base=CandidateIndex(v,[row],meta,model_identity(),[])
validate_index(base)
cases=[]
for change in ('identity','nan','shape','duplicate','orphan','hash'):
 bad=copy.deepcopy(base)
 if change=='identity': bad.identity['revision']='otro'
 if change=='nan': bad.vectors[0,0]=float('nan')
 if change=='shape': bad.vectors=np.zeros((1,5),np.float32)
 if change=='duplicate': bad.rows*=2; bad.vectors=np.concatenate([v,v])
 if change=='orphan': bad.rows[0]['asset_id']='missing'
 if change=='hash': bad.rows[0]['image_sha256']='bad'
 cases.append(bad)
for bad in cases:
 try: validate_index(bad)
 except ValueError: pass
 else: raise AssertionError('Aceptó índice inválido')
with tempfile.TemporaryDirectory() as directory:
 path=Path(directory)/'bad.npz'
 _write_npz(path,v,{'format_version':999})
 try: load_index(path)
 except ValueError: pass
 else: raise AssertionError('Aceptó versión incompatible')
''')

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
