# Reproducir IA CPU en un clon nuevo

Las versiones siguientes conservan las combinaciones aprobadas por Brandon.
El entorno de esta sesión ya existe: **no ejecutar este bloque sobre él**.
No modifica el entorno GPU, backend ni dependencias de otras áreas.

Requisitos: Linux, Git, uv y Python 3.11.18/3.14.4 disponibles o gestionados por uv.
Desde la raíz de un clon nuevo de la rama IA:

```bash
set -e
test ! -e ai/.venv-sam2
test ! -e ai/.venv-tests
python3 -m ai.resources --sam --demo
uv venv --python 3.11.18 ai/.venv-sam2
uv pip install --python ai/.venv-sam2/bin/python pip==26.3
(cd ai && SAM2_BUILD_CUDA=0 .venv-sam2/bin/python -m pip install --extra-index-url https://download.pytorch.org/whl/cpu -r requirements-sam2.txt)
uv venv --python 3.14.4 ai/.venv-tests
uv pip install --python ai/.venv-tests/bin/python -r ai/requirements-tests.txt
ai/.venv-tests/bin/python -m pytest ai/tests -q
ai/.venv-sam2/bin/python -m ai.pipeline
```

`requirements-sam2.txt` tiene `-e ./sam2`, por eso su instalación se ejecuta desde
`ai/`. No usarlo para CUDA ni instalar el requirements de entrenamiento de DINO.
El código DINO se carga de su copia oficial fijada; no necesita instalar xFormers
ni timm para este backbone. Proveedor, pesos y datos quedan ignorados por Git.

Los recursos se registran en `sam_resources.json`, `dino_resources.json` y
`demo_manifest.json`. SAM Tiny: 156,008,466 bytes; DINO ViT-S/14: 88,283,115 bytes,
más código y ocho miniaturas pequeñas. La CLI verifica hashes antes de usarlos.
Si encuentra una copia incompatible, se detiene sin sobrescribirla; revisar el
mensaje antes de volver a ejecutar, sin borrar entornos o archivos para forzar éxito.

Validación de esta sesión: recursos existentes verificados y flujo repetido con
los comandos documentados; los paquetes no se reinstalaron. La reproducción desde
cero y por otro integrante se conserva como aceptación externa T26-P.
