from ai.tests.cpu_case import CpuCase


class ResourceTests(CpuCase):
    def test_existing_resources_are_verified_without_network_or_installation(self):
        self.run_cpu('''
from unittest.mock import patch
from ai.resources import prepare_dino,prepare_sam,prepare_demo
with patch('ai.resources.urlopen',side_effect=AssertionError('No descargar existentes')), patch('ai.resources.subprocess.run',side_effect=AssertionError('No instalar ni recrear proveedor')):
 assert prepare_dino()['verified'] and prepare_sam()['verified']
 assert prepare_demo()['candidates']==8
''')
