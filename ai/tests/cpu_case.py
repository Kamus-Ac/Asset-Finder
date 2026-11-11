"""Ejecutar pruebas numéricas en su intérprete, sin mezclar versiones de Python."""

import os
from pathlib import Path
import subprocess
import unittest


ROOT = Path(__file__).resolve().parents[2]
CPU_PYTHON = ROOT / "ai/.venv-sam2/bin/python"


class CpuCase(unittest.TestCase):
    def run_cpu(self, source, *, timeout=120):
        if not CPU_PYTHON.is_file():
            self.skipTest("Requiere entorno CPU local; no instala dependencias")
        setup = "import sys; sys.path.insert(0, sys.argv[1])\n"
        result = subprocess.run(
            [str(CPU_PYTHON), "-I", "-c", setup + source, str(ROOT)],
            capture_output=True, text=True, timeout=timeout,
            env={**os.environ, "OMP_NUM_THREADS": "2", "MKL_NUM_THREADS": "2"},
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        return result.stdout
