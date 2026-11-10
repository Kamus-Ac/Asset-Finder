from ai.tests.cpu_case import CpuCase


class PipelineTests(CpuCase):
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
