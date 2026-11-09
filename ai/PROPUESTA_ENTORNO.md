# T02 — Propuesta de entorno CUDA para Angel

Fecha: 5 de noviembre de 2026. **Aprobada por Brandon el 6 de noviembre; no instalada.**
**Estado actual, 9 de noviembre:** T01 completada con evidencia de la MSI real:
Ubuntu 26.04.1 en WSL2, x86_64, glibc 2.43, Python 3.14.4, 7.61 GiB RAM visibles,
RTX 4070 Laptop/8188 MiB y driver 610.78 accesibles mediante NVIDIA-SMI.
Fuente: `Pruebas/Diagnostico_MSI_Angel_2026-11-09.json`.

La combinación aprobada conserva **Python 3.12**. Falta comprobar si ese
intérprete ya existe en la MSI y revisar los directorios antes de ejecutar T03.
No se cambia automáticamente a Python 3.14 ni se sobrescriben entornos.
El preflight posterior sí confirma `python3.12: command not found` en la MSI.
Las comprobaciones de uv/directorios no se ejecutaron porque se encadenaron
con `&&`; se solicitan por separado antes de elegir el método de preparación.

**Actualización T03:** el usuario confirmó uv y creó con él **Python 3.12.16**
en `.venv-gpu` de la raíz de la MSI. También existen `ai/` y `ai/sam2/`.
Se adopta la ubicación que eligió el usuario; no se crea un segundo entorno.
Paquetes, revisión exacta de SAM y CUDA aún pendientes de la ejecución del instalador.
Los índices oficiales torch/torchvision cu126 con ruedas CPython 3.12 Linux
se volvieron a consultar el 9 de noviembre; no se instalaron paquetes.

Los informes previos de la Dell se conservaron separados: Brandon confirmó
el error de laptop. Su ausencia de NVIDIA/Python 3.12 no se atribuye a la MSI.

## Combinación propuesta

| Componente | Selección para el entorno nuevo |
| --- | --- |
| Plataforma | Ubuntu en WSL2, Linux x86_64; glibc ≥2.28 para las ruedas elegidas |
| Python | CPython 3.12.16 confirmado en el entorno creado por el usuario; sistema 3.14.4 separado |
| Entorno | `.venv-gpu` en la raíz de la MSI, elegido por el usuario; separado de entornos CPU/pruebas |
| PyTorch | `torch==2.14.1`, rueda `+cu126` |
| torchvision | `torchvision==0.29.1`, rueda `+cu126` de la misma pareja oficial |
| Runtime CUDA | 12.6, canal oficial `https://download.pytorch.org/whl/cu126` |
| NumPy / Pillow | `numpy==2.4.6` / `pillow==13.0.0` |
| Dependencias SAM | `hydra-core==1.3.8`, `omegaconf==2.3.1`, `iopath==0.1.10`, `tqdm==4.70.1` |
| Herramientas de instalación | `pip==26.3`, `setuptools==78.1.0`, `wheel==0.48.0` |
| SAM | SAM 2.1 Tiny; código local de origen `2b90b9f5ceec907a1c18123530e92e794ad901a4` |
| DINO | DINOv2 ViT-S/14 (`dinov2_vits14`), inferencia mediante código oficial |
| Extensión CUDA de SAM | Omitir inicialmente con `SAM2_BUILD_CUDA=0`; postprocesado de extensión desactivado |

La pareja torch/torchvision está publicada en la [matriz oficial de PyTorch](https://pytorch.org/get-started/previous-versions/).
Comprobé ruedas CPython 3.12 Linux x86_64 en los índices oficiales de
[torch](https://download.pytorch.org/whl/cu126/torch/) y
[torchvision](https://download.pytorch.org/whl/cu126/torchvision/), con etiqueta
`manylinux_2_28`. No se eligió una combinación por semejanza de números de versión.
Las fichas de [NumPy](https://pypi.org/project/numpy/2.4.6/) y
[Pillow](https://pypi.org/project/pillow/13.0.0/) incluyen soporte para Python 3.12.
Las versiones auxiliares conservan la base CPU existente, sin modificarla.

## Compatibilidad y límites

- Driver comunicado: NVIDIA-SMI/KMD **610.78**, RTX 4070 Laptop y **8188 MiB**
  de VRAM. NVIDIA documenta compatibilidad hacia atrás de drivers nuevos con
  runtimes CUDA anteriores: por eso **cu126 es una candidata compatible con el
  driver reportado**, condicionada a que WSL2 exponga la GPU. La etiqueta CUDA
  UMD 13.3 de la captura no obliga a instalar PyTorch con ese mismo número.
  [Compatibilidad NVIDIA](https://docs.nvidia.com/deploy/cuda-compatibility/minor-version-compatibility.html).
- En WSL se utiliza el driver de Windows. No instalar un driver de pantalla
  Linux dentro de Ubuntu. Confirmar WSL2 y `/dev/dxg` antes de instalar.
  [Guía oficial CUDA en WSL](https://docs.nvidia.com/cuda/wsl-user-guide/index.html).
- SAM requiere Python ≥3.10 y PyTorch ≥2.5.1. Su extensión es opcional:
  omitirla evita compilar con nvcc; **el modelo aún puede ejecutarse en CUDA**.
  No proponer un Toolkit del sistema para esta primera prueba sin extensión.
  [Instalación oficial SAM](https://github.com/facebookresearch/sam2/blob/main/INSTALL.md).
- El [requirements de DINOv2](https://github.com/facebookresearch/dinov2/blob/main/requirements.txt)
  fija torch 2.0.0/torchvision 0.15.0 y xFormers 0.0.18 para su receta de
  entrenamiento/evaluación. No instalar esa lista sobre este entorno: contradice
  los requisitos de SAM. El objetivo es inferencia del backbone, no entrenamiento.
- El [backbone oficial](https://github.com/facebookresearch/dinov2/blob/main/dinov2/hub/backbones.py)
  ofrece `dinov2_vits14`; su [atención](https://github.com/facebookresearch/dinov2/blob/main/dinov2/layers/attention.py)
  tiene alternativa sin xFormers para tensores simples. Proponer esa ruta, sin
  nested tensors ni xFormers. **La combinación completa SAM+DINO no está probada**:
  T04 debe cargar los dos modelos y comprobar inferencia real con estos paquetes.

## Ejecución actual de T03 en la MSI

Pasar [preparar_gpu.sh](preparar_gpu.sh) a `ai/` de la MSI. Desde el proyecto:

```bash
bash ai/preparar_gpu.sh .venv-gpu
```

El script inspecciona el intérprete/paquetes, NVIDIA y la revisión de SAM antes
de instalar. Admite los 14 paquetes comunes del inventario MSI revisado en
sus versiones exactas. Si hay paquetes ajenos, versiones distintas o fuente SAM distinta, se detiene sin
sobrescribirlos. No crea entornos ni descarga pesos. Con la aprobación vigente,
instala herramientas fijadas, dependencias comunes, la pareja CUDA y SAM sin
compilar su extensión. Usa explícitamente el intérprete del entorno elegido.

Solo tras `pip check`, versiones correctas y una suma CUDA real escribe
`ai/requirements-gpu.txt` y `/tmp/asset-finder-T03-MSI.json`. Compartir ambos.
Un fallo puede dejar paquetes parcialmente instalados: conservar el error para
revisar el estado antes de reintentar. T03 no se acepta por haber escrito el script.

## Comandos originales T02 — referencia para un entorno nuevo

**No ejecutar este bloque en la MSI actual:** ya se creó `.venv-gpu` en la raíz;
para ese equipo se usa el script anterior. El bloque conserva la receta aprobada
inicialmente para `ai/.venv-gpu` y documenta los mismos paquetes.

Desde la raíz de este proyecto en **Ubuntu/WSL de Angel**. No ejecutar en
PowerShell ni en el entorno CPU local. Si falta Python 3.12 o su módulo venv,
detenerse y acordar su instalación según la versión de Ubuntu de T01.
No se actualizará ni reutilizará un `.venv-gpu` existente sin revisar su estado.

```bash
set -e
cat /etc/os-release
uname -rm
getconf GNU_LIBC_VERSION
free -h
python3.12 --version
nvidia-smi
test -e /dev/dxg
test -f ai/sam2/setup.py
test ! -e ai/.venv-gpu
python3.12 -m venv ai/.venv-gpu
ai/.venv-gpu/bin/python -m pip install pip==26.3 setuptools==78.1.0 wheel==0.48.0
ai/.venv-gpu/bin/python -m pip install torch==2.14.1 torchvision==0.29.1 --index-url https://download.pytorch.org/whl/cu126
ai/.venv-gpu/bin/python -m pip install numpy==2.4.6 pillow==13.0.0 hydra-core==1.3.8 omegaconf==2.3.1 iopath==0.1.10 tqdm==4.70.1
SAM2_BUILD_CUDA=0 ai/.venv-gpu/bin/python -m pip install --no-build-isolation --no-deps -e ./ai/sam2
ai/.venv-gpu/bin/python -m pip check
```

El código SAM local debe corresponder a la revisión registrada. Está ignorado
por Git: si no existe en Angel, obtenerlo del repositorio oficial en `ai/sam2/`
antes del bloque anterior, sin sobrescribir copias existentes. Pesos fuera de Git.
No se ejecutará `requirements-sam2.txt`: conserva las versiones CPU históricas.
Las dependencias transitivas quedarán resueltas y registradas durante T03;
esta tabla fija dependencias directas, no es un lockfile de GPU ya validado.

Si uv ya está instalado en la MSI, puede gestionar Python 3.12 separado del
Python del sistema ([documentación oficial](https://docs.astral.sh/uv/guides/install-python/)).
La consulta **local de metadatos**, sin descargar un intérprete, ofrece CPython
3.12.16 para Linux x86_64 GNU, dentro de la serie 3.12.x aprobada. Esto no prueba
que uv o ese intérprete existan en la MSI. No se instaló uv ni Python; el método
definitivo depende de las dos comprobaciones pendientes.

Comprobación propuesta para T03, sin descargar modelos:

```bash
ai/.venv-gpu/bin/python -I - <<'PY'
import torch
import torchvision
import numpy
import PIL

assert torch.__version__.split('+')[0] == '2.14.1'
assert torchvision.__version__.split('+')[0] == '0.29.1'
assert torch.version.cuda == '12.6'
assert torch.cuda.is_available(), 'servicio no disponible: CUDA no accesible en WSL'
result = torch.ones((16, 16), device='cuda').sum()
torch.cuda.synchronize()
assert result.item() == 256
print(torch.__version__, torchvision.__version__, torch.version.cuda)
print(torch.cuda.get_device_name(0), torch.cuda.get_device_properties(0).total_memory)
print(numpy.__version__, PIL.__version__)
PY
```

Tras aceptación de T03, registrar `pip freeze` en `ai/requirements-gpu.txt` y
dispositivo/comandos en `MEDICIONES.md`. En T04 fijar revisión del código DINOv2,
descargar pesos oficiales a una ubicación ignorada y medir carga/inferencia real.
No hacer pasar el script actual `prueba_sam2.py`, que fija CPU, como prueba CUDA.

## Revisión y decisión pendiente

- [x] Fuentes primarias revisadas; pareja CUDA/PyTorch/torchvision publicada.
- [x] Ruedas CPython 3.12 Linux verificadas; versiones y comandos escritos.
- [x] Bloques Python/shell comprobados estáticamente; sin ejecutar instalaciones.
- [x] Evidencia recibida de Ubuntu, memoria y Python del WSL objetivo.
- [x] NVIDIA accesible en WSL de la MSI (diagnóstico real, sin PyTorch todavía).
- [ ] Python 3.12 y directorios existentes comprobados antes de instalar T03.
- [x] Aprobación explícita de Brandon recibida el 6 de noviembre de 2026.
- [ ] Confirmación de Manuel solo si decide compartir este entorno con backend.

No se modificaron entornos, pesos, dependencias CPU, backend ni contratos durante
T02. «Compatible según documentación» es una propuesta; no demuestra CUDA,
memoria suficiente ni calidad de recuperación en la laptop de Angel.
