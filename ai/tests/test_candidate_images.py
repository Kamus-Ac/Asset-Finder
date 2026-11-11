from ai.tests.cpu_case import CpuCase


class CandidateImageTests(CpuCase):
    def test_partial_batches_and_content_identity(self):
        self.run_cpu('''
import numpy as np
from PIL import Image
from ai.candidate_images import prepare_candidates, image_digest
from ai.preprocess import prepare_image
image=Image.new('RGB',(8,4),'red')
items=[{'asset_id':'a','source_url':'https://example.invalid/a','views':[
 {'view_id':'good','image':image}, {'view_id':'bad','image':Image.new('L',(2,2))}]},
 {'asset_id':'b','source_url':'https://example.invalid/b','views':[]}]
batch=prepare_candidates(items)
assert len(batch['views'])==1 and len(batch['errors'])==2
view=batch['views'][0]
assert view['asset_id']=='a' and view['view_id']=='good'
assert np.array_equal(np.asarray(view['image']),np.asarray(prepare_image(image)))
assert image_digest(image)==image_digest(image.copy())
assert image_digest(image)!=image_digest(Image.new('RGB',(8,4),'blue'))
assert prepare_candidates([])=={'metadata':{},'views':[],'errors':[]}
''')
