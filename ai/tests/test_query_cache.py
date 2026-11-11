from ai.tests.cpu_case import CpuCase


class QueryCacheTests(CpuCase):
    def test_hits_invalidation_current_candidates_and_no_cached_errors(self):
        self.run_cpu('''
import tempfile
from pathlib import Path
import numpy as np
from PIL import Image
from unittest.mock import patch
from ai.pipeline import run_search
from ai.segmentation import ServiceUnavailableError
image=Image.new('RGB',(8,8),'red')
mask=np.ones((8,8),bool)
vector=np.zeros(384,np.float32);vector[0]=1
def item(id,color='red'):
 return {'asset_id':id,'source_url':'https://example.invalid/'+id,
  'views':[{'view_id':'main','image':Image.new('RGB',(8,8),color)}]}
with tempfile.TemporaryDirectory() as directory, patch('ai.pipeline.segment',return_value=(mask,0.9)) as seg, patch('ai.pipeline._encode_prepared',return_value=vector), patch('ai.index._encode_prepared',return_value=vector):
 a=run_search(image,[item('a')],box_xyxy=[0,0,8,8],cache_dir=directory)
 assert not a.cache['query_hit']
 b=run_search(image,[item('b','blue')],box_xyxy=[0,0,8,8],cache_dir=directory)
 assert b.cache['query_hit'] and seg.call_count==1 and b.results[0]['asset_id']=='b'
 assert b.cache['candidate_misses']==1
 run_search(image,[],box_xyxy=[0,0,7,7],cache_dir=directory)
 assert seg.call_count==2
 changed=Image.new('RGB',(8,8),'green')
 run_search(changed,[],box_xyxy=[0,0,8,8],cache_dir=directory)
 assert seg.call_count==3
 with patch('ai.query_cache.model_identity',return_value={'revision':'fixture_cambiada'}):
  run_search(image,[],box_xyxy=[0,0,8,8],cache_dir=directory)
 assert seg.call_count==4
 before=set(Path(directory).rglob('*.npz'))
 seg.side_effect=ServiceUnavailableError('servicio no disponible: fixture')
 try:run_search(image,[],box_xyxy=[0,0,6,6],cache_dir=directory)
 except ServiceUnavailableError:pass
 else:raise AssertionError('Ocultó error')
 assert set(Path(directory).rglob('*.npz'))==before
 with patch('torch.cuda.is_available',return_value=False):
  try:run_search(image,[],box_xyxy=[0,0,8,8],cache_dir=directory,device='cuda')
  except ServiceUnavailableError as e:assert 'CUDA' in str(e)
  else:raise AssertionError('Caché no debe ocultar CUDA ausente')
''')
