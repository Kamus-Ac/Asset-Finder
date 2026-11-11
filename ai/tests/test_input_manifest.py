from ai.tests.cpu_case import CpuCase


class InputManifestTests(CpuCase):
    def test_explicit_paths_normalization_and_no_traversal(self):
        self.run_cpu('''
import json,tempfile
from pathlib import Path
from PIL import Image
from ai.input_manifest import load_manifest,load_rgb
with tempfile.TemporaryDirectory() as directory:
 root=Path(directory);image=root/'image.png'
 Image.new('RGBA',(8,4),'red').save(image)
 manifest=root/'manifest.json'
 payload={'schema_version':1,'candidates':[{'asset_id':'a','source_url':'https://example.invalid/a',
   'views':[{'view_id':'main','image_path':'image.png'}]}]}
 manifest.write_text(json.dumps(payload))
 result=load_manifest(manifest)
 assert result[0]['views'][0]['image'].mode=='RGB'
 payload['candidates'][0]['views'][0]['image_path']='../outside.png'
 manifest.write_text(json.dumps(payload))
 try:load_manifest(manifest)
 except ValueError as e:assert 'dentro' in str(e)
 else:raise AssertionError('Aceptó ruta fuera del paquete')
''')
