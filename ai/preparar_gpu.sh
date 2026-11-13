#!/usr/bin/env bash
# T03: instalar la combinación aprobada; permite la base común ya revisada.
# Copiar este archivo a la MSI y ejecutar desde cualquier carpeta del repo:
# bash ai/preparar_gpu.sh .venv-gpu
set -euo pipefail

TASK_ROOT=$(git rev-parse --show-toplevel)
cd "$TASK_ROOT"
GPU_ENV_PATH=${1:-.venv-gpu}
case "$GPU_ENV_PATH" in
    .venv-gpu|ai/.venv-gpu) ;;
    *) echo 'Usa .venv-gpu o ai/.venv-gpu; no se modifica otro entorno.' >&2; exit 2 ;;
esac
GPU_PYTHON="$TASK_ROOT/$GPU_ENV_PATH/bin/python"
SAM_REVISION=2b90b9f5ceec907a1c18123530e92e794ad901a4
test -x "$GPU_PYTHON" || { echo "Falta el intérprete: $GPU_PYTHON" >&2; exit 2; }
command -v uv >/dev/null || { echo 'Falta uv; no se instala automáticamente.' >&2; exit 2; }
test ! -e ai/requirements-gpu.txt || { echo 'Ya existe requirements-gpu.txt; revisar antes de reemplazarlo.' >&2; exit 2; }

"$GPU_PYTHON" -I - "$TASK_ROOT/$GPU_ENV_PATH" <<'PY'
import importlib.metadata as metadata
from pathlib import Path
import sys

if sys.version_info[:2] != (3, 12):
    sys.exit('Se requiere Python 3.12 aprobado; no se instala sobre otro intérprete.')
if sys.prefix == sys.base_prefix or Path(sys.prefix).resolve() != Path(sys.argv[1]).resolve():
    sys.exit('El intérprete no pertenece al entorno virtual seleccionado.')
allowed = {
    'pip': '26.3', 'setuptools': '78.1.0', 'wheel': '0.48.0',
    'numpy': '2.4.6', 'pillow': '13.0.0', 'hydra-core': '1.3.8',
    'omegaconf': '2.3.1', 'iopath': '0.1.10', 'tqdm': '4.70.1',
    # Dependencias transitivas del inventario MSI recibido y revisado.
    'antlr4-python3-runtime': '4.9.3', 'pyyaml': '6.0.3',
    'typing-extensions': '4.16.0', 'portalocker': '4.4.2', 'packaging': '26.3',
}
installed = {d.metadata['Name'].lower().replace('_', '-'): d.version for d in metadata.distributions()}
print('Python:', sys.version.split()[0], '| Paquetes previos:', installed, flush=True)
conflicts = {name: version for name, version in installed.items() if allowed.get(name) != version}
if conflicts:
    sys.exit(f'Paquetes o versiones no revisados: {conflicts}. No se cambió nada.')
PY

test -x /usr/lib/wsl/lib/nvidia-smi || { echo 'NVIDIA-SMI de WSL no disponible.' >&2; exit 2; }
GPU_DEVICE_INFO=$(/usr/lib/wsl/lib/nvidia-smi --query-gpu=name,driver_version,memory.total --format=csv,noheader,nounits)
[[ "$GPU_DEVICE_INFO" == *"RTX 4070 Laptop"* ]] || {
    echo "El equipo no coincide con la MSI/RTX prevista: $GPU_DEVICE_INFO" >&2; exit 2;
}
printf '%s\n' "$GPU_DEVICE_INFO"

# No aceptar por accidente el HEAD del repo padre si sam2 es solo una copia.
test -f ai/sam2/setup.py || { echo 'Falta ai/sam2/setup.py.' >&2; exit 2; }
SAM_ROOT=$(git -C ai/sam2 rev-parse --show-toplevel)
test "$(realpath "$SAM_ROOT")" = "$(realpath ai/sam2)" || {
    echo 'ai/sam2 no es un checkout Git independiente; revisar su procedencia.' >&2; exit 2;
}
SAM_CURRENT_REVISION=$(git -C ai/sam2 rev-parse HEAD)
test "$SAM_CURRENT_REVISION" = "$SAM_REVISION" || {
    echo "SAM actual: $SAM_CURRENT_REVISION; revisión aprobada: $SAM_REVISION. No se cambió nada." >&2; exit 2;
}
SAM_LOCAL_CHANGES=$(git -C ai/sam2 status --porcelain --untracked-files=normal)
test -z "$SAM_LOCAL_CHANGES" || {
    printf 'SAM tiene cambios locales; revisarlos antes de instalar:\n%s\n' "$SAM_LOCAL_CHANGES" >&2; exit 2;
}

# uv ya está presente en la MSI; instala las herramientas fijadas, no crea otro venv.
uv pip install --python "$GPU_PYTHON" pip==26.3 setuptools==78.1.0 wheel==0.48.0
"$GPU_PYTHON" -m pip install numpy==2.4.6 pillow==13.0.0 hydra-core==1.3.8 omegaconf==2.3.1 iopath==0.1.10 tqdm==4.70.1
"$GPU_PYTHON" -m pip install torch==2.14.1 torchvision==0.29.1 --index-url https://download.pytorch.org/whl/cu126
SAM2_BUILD_CUDA=0 "$GPU_PYTHON" -m pip install --no-build-isolation --no-deps -e ./ai/sam2
"$GPU_PYTHON" -m pip check

# Esta comprobación sí ejecuta un kernel CUDA; no carga ni descarga modelos.
"$GPU_PYTHON" -I - "$TASK_ROOT" "$GPU_ENV_PATH" "$SAM_REVISION" <<'PY'
from datetime import datetime, timezone
import hashlib
import importlib.metadata as metadata
import json
from pathlib import Path
import platform
import subprocess
import sys

import numpy as np
import PIL
import sam2
import torch
import torchvision

root = Path(sys.argv[1])
assert torch.__version__ == '2.14.1+cu126', torch.__version__
assert torchvision.__version__ == '0.29.1+cu126', torchvision.__version__
assert np.__version__ == '2.4.6' and PIL.__version__ == '13.0.0'
assert torch.version.cuda == '12.6', torch.version.cuda
assert torch.cuda.is_available(), 'servicio no disponible: CUDA no accesible'
assert Path(sam2.__file__).resolve().is_relative_to(root / 'ai/sam2'), sam2.__file__
value = torch.ones((16, 16), device='cuda').sum()
torch.cuda.synchronize()
assert value.item() == 256

# El lock se escribe solo después de versiones correctas, pip check y CUDA real.
frozen = subprocess.check_output(
    [sys.executable, '-m', 'pip', 'freeze', '--all', '--exclude-editable'], text=True)
lock = ('# T03: generado en la MSI tras validar CUDA; instalar desde ai/.\n'
        '# SAM debe corresponder a ' + sys.argv[3] + '; SAM2_BUILD_CUDA=0.\n'
        '--extra-index-url https://download.pytorch.org/whl/cu126\n'
        + frozen.rstrip() + '\n-e ./sam2\n')
with (root / 'ai/requirements-gpu.txt').open('x', encoding='utf-8') as stream:
    stream.write(lock)
report = {
    'schema_version': 1, 'collected_at_utc': datetime.now(timezone.utc).isoformat(),
    'host': platform.node(), 'python': platform.python_version(), 'venv': sys.argv[2],
    'cuda_available': torch.cuda.is_available(), 'cuda_runtime': torch.version.cuda,
    'gpu_name': torch.cuda.get_device_name(0),
    'gpu_total_memory_bytes': torch.cuda.get_device_properties(0).total_memory,
    'cuda_sum': value.item(), 'sam_revision': sys.argv[3], 'sam_source': sam2.__file__,
    'packages': {name: metadata.version(name) for name in (
        'pip', 'setuptools', 'wheel', 'torch', 'torchvision', 'numpy', 'pillow',
        'hydra-core', 'omegaconf', 'iopath', 'tqdm', 'SAM-2')},
    'requirements_sha256': hashlib.sha256(lock.encode('utf-8')).hexdigest(),
    'limitations': 'No prueba SAM/DINO ni sus pesos: corresponde a T04.',
}
Path('/tmp/asset-finder-T03-MSI.json').write_text(
    json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps(report, ensure_ascii=False, indent=2))
print('T03: comprobación CUDA pasada. Compartir JSON y ai/requirements-gpu.txt.')
PY
