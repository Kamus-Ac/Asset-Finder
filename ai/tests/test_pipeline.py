from ai.tests.cpu_case import CpuCase


class PipelineTests(CpuCase):
    def test_candidate_budget_is_distinct_from_result_count(self):
        self.run_cpu('''
import numpy as np
from PIL import Image
from unittest.mock import patch
from ai.pipeline import run_search
image=Image.new('RGB',(8,8),'red');mask=np.ones((8,8),bool)
vector=np.zeros(384,np.float32);vector[0]=1
items=[{'asset_id':str(n),'source_url':'https://example.invalid/'+str(n),
 'views':[{'view_id':'main','image':image}]} for n in range(5)]
with patch('ai.pipeline.segment',return_value=(mask,0.9)) as seg,patch('ai.pipeline._encode_prepared',return_value=vector),patch('ai.index._encode_prepared',return_value=vector):
 result=run_search(image,items,box_xyxy=[0,0,8,8],candidate_limit=2,k=1)
 assert result.comparison=={'requested':2,'available':5,'selected':2,'compared':2,'views':2,'requested_results':1,'returned_results':1}
 assert len(result.results)==1
 all_items=run_search(image,items,box_xyxy=[0,0,8,8],candidate_limit=99,k=99)
 assert len(all_items.results)==5 and all_items.comparison['compared']==5 and all_items.comparison['requested']==99
 before=seg.call_count
 for limit in (0,-1,True,1.5,'2'):
  try:run_search(image,items,box_xyxy=[0,0,8,8],candidate_limit=limit)
  except ValueError:pass
  else:raise AssertionError('Límite inválido aceptado')
 assert seg.call_count==before
''')

    def test_real_sam_dino_to_candidates_and_empty(self):
        self.run_cpu('''
import tempfile
from pathlib import Path
from PIL import Image
from ai.pipeline import run_search,save_outcome
image=Image.open(Path(sys.argv[1])/'ai/prueba.jpeg').convert('RGB');image.thumbnail((1024,1024))
candidates=[{'asset_id':'test_reference_crop','source_url':'https://example.invalid/test',
 'views':[{'view_id':'crop','image':image.crop((222,355,430,562))}]}]
with tempfile.TemporaryDirectory() as directory:
 result=run_search(image,candidates,box_xyxy=[222,355,430,562],cache_dir=directory)
 assert result.mask.shape==(image.height,image.width) and result.mask.any()
 assert len(result.results)==1 and result.results[0]['asset_id']=='test_reference_crop'
 assert result.timings['total_seconds']>0 and not result.warnings
 assert all(r['model_available'] is False for r in result.results)
 save_outcome(result,image,directory)
 assert (Path(directory)/'report.json').is_file() and (Path(directory)/'overlay.png').is_file()
 empty=run_search(image,[],box_xyxy=[222,355,430,562])
 assert empty.results==[]
''')
