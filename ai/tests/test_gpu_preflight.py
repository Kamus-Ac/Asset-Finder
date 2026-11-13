"""Regresión del inventario MSI: prueba política de paquetes, no CUDA real."""

from contextlib import redirect_stdout
import io
from pathlib import Path
import sys
from types import SimpleNamespace
import unittest
from unittest.mock import patch


SCRIPT = Path(__file__).resolve().parents[1] / 'preparar_gpu.sh'
PREFLIGHT = SCRIPT.read_text(encoding='utf-8').split("<<'PY'\n", 1)[1].split('\nPY\n', 1)[0]
# Inventario compartido por el usuario desde la MSI; no es una salida GPU simulada.
MSI_INVENTORY = {
    'antlr4-python3-runtime': '4.9.3', 'hydra-core': '1.3.8', 'pyyaml': '6.0.3',
    'typing-extensions': '4.16.0', 'numpy': '2.4.6', 'portalocker': '4.4.2',
    'iopath': '0.1.10', 'pillow': '13.0.0', 'setuptools': '78.1.0',
    'pip': '26.3', 'wheel': '0.48.0', 'omegaconf': '2.3.1',
    'packaging': '26.3', 'tqdm': '4.70.1',
}


class GpuPreflightTest(unittest.TestCase):
    def run_preflight(self, inventory):
        distributions = [SimpleNamespace(metadata={'Name': k}, version=v)
                         for k, v in inventory.items()]
        prefix = '/tmp/asset-finder-test-gpu-policy'
        with (
            patch.object(sys, 'version_info', (3, 12, 16)),
            patch.object(sys, 'version', '3.12.16'),
            patch.object(sys, 'prefix', prefix),
            patch.object(sys, 'base_prefix', '/tmp/asset-finder-test-base'),
            patch.object(sys, 'argv', ['-', prefix]),
            patch('importlib.metadata.distributions', return_value=distributions),
            redirect_stdout(io.StringIO()),
        ):
            exec(compile(PREFLIGHT, str(SCRIPT), 'exec'), {})

    def test_reported_msi_common_dependencies_can_resume(self):
        self.run_preflight(MSI_INVENTORY)

    def test_empty_environment_still_supported(self):
        self.run_preflight({})

    def test_different_numpy_version_is_rejected(self):
        with self.assertRaisesRegex(SystemExit, 'numpy'):
            self.run_preflight({**MSI_INVENTORY, 'numpy': '2.4.5'})

    def test_cpu_torch_is_not_silently_replaced(self):
        with self.assertRaisesRegex(SystemExit, 'torch'):
            self.run_preflight({**MSI_INVENTORY, 'torch': '2.15.0+cpu'})
