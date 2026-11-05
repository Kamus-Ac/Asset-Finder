# Mediciones de IA

## B0 — Prueba CPU inicial · 5 de noviembre de 2026

Comando reproducible: [README, prueba CPU local](README.md#repetir-la-prueba-cpu-local).
Una ejecución; no representa un promedio ni el rendimiento del servidor previsto.

| Campo | Resultado observado |
| --- | --- |
| Código probado | `Asset-Finder/ai/prueba_sam2.py`, sin cambiar su lógica |
| Python | 3.11.18, entorno `asset-finder/ai/.venv-sam2` |
| PyTorch / torchvision | `2.15.0+cpu` / `0.29.2+cpu` |
| NumPy / Pillow | `2.4.6` / `13.0.0` |
| Modelo y origen | SAM 2.1 Tiny; copia local del commit `2b90b9f5ceec907a1c18123530e92e794ad901a4` |
| Import SAM comprobado | `/home/user/projects/Asset-Finder/ai/sam2/sam2/__init__.py` |
| Checkpoint | 156,008,466 bytes; hash idéntico al archivo de origen |
| SHA-256 local | `7402e0d864fa82708a20fbd15bc84245c2f26dff0eb43a4b5b93452deb34be69` |
| Entrada procesada | RGB, 1024 × 631, rectángulo proporcional fijo del script |
| Tiempo impreso | **2.00 s**, incluye `set_image` y `predict`; excluye carga y guardado |
| Máscara | Modo L, valores 0/255; 60,327 píxeles seleccionados (9.3365 %) |
| Recorte / superposición | RGBA / RGB, ambos 1024 × 631; alfa idéntico a la máscara |
| Revisión visual | Selecciona fondo/pared; no demuestra segmentación correcta de un objeto |
| CUDA | `torch.version.cuda = null`, disponible `false`, dispositivos `0` |
| VRAM pico / RAM pico | `null` / `null`: no medidos |
| Salida del proceso | Código 0; advertencia FutureWarning de torch.jit, sin impedir la ejecución |

Conclusión: SAM carga y produce archivos válidos en CPU desde el proyecto actual,
usando dependencias del entorno antiguo. Calidad de selección, entorno propio,
CUDA, DINO y recuperación del catálogo siguen sin validar. Las próximas entradas
deben registrar comando, dispositivo, preparación, repeticiones y qué mide cada tiempo.


## T01 — Diagnóstico parcial · 5 de noviembre de 2026

Estado inicial: avance local validado, antes de recibir la salida de Angel.
La evidencia posterior está en «Datos del servidor de Angel recibidos» y la
eliminación de la dependencia anterior en «B1 — Entorno CPU independiente».

### Servidor de IA indicado por Brandon

| Campo | Información proporcionada, sin medición directa |
| --- | --- |
| Equipo | MSI, distinto del equipo de esta sesión |
| Procesador | Intel Core i7-12650H de 12.ª generación, 2.30 GHz |
| RAM instalada | 16.0 GB (15.7 GB utilizables), declarados |
| GPU dedicada | NVIDIA GeForce RTX 4070 Laptop GPU, 8 GB declarados |
| GPU integrada | Intel UHD Graphics, 128 MB declarados |
| Sistema del equipo | Windows 11 Home 25H2 |
| Entorno de ejecución IA | `null`: Windows nativo o WSL2 por confirmar con Manuel |
| Driver NVIDIA / VRAM detectada | `null` / `null`: falta salida real de nvidia-smi |
| Python del servidor | `null`: falta salida real de python --version |

### Equipo de desarrollo inspeccionado

| Campo | Observación local |
| --- | --- |
| Host | DESKTOP-81SP2N7 |
| Sistema | Ubuntu 26.04.1 LTS sobre WSL2, x86_64 |
| Python global | /usr/bin/python3, 3.14.4; comando python ausente |
| RAM visible | 8,195,334,144 bytes, aproximadamente 7.632 GiB |
| GPU / driver / VRAM detectada | `null` / `null` / `null`; herramienta no disponible |
| Dispositivos | /dev/nvidia0 y /dev/dxg ausentes |
| Entorno de pruebas | ai/.venv-tests, Python 3.14.4, pytest 9.2.0 |

La RAM visible es la que reporta este entorno WSL2; no representa la RAM
instalada de la MSI. La ausencia de GPU aquí no prueba ausencia de GPU allí.

### Comandos y salidas locales

```text
$ nvidia-smi
nvidia-smi: command not found
[código de salida: 127]
```

```text
$ python --version
python: command not found
[código de salida: 127]
```

```text
$ python3 --version
Python 3.14.4
[código de salida: 0]
```

```text
$ uname -srm
Linux 6.18.54.1-microsoft-standard-WSL2 x86_64
[código de salida: 0]
```

```text
$ free -b
               total        used        free      shared  buff/cache   available
Mem:      8195334144  1830895616  4271833088    52170752  2345664512  6364438528
Swap:     2147483648           0  2147483648
[código de salida: 0]
```

### Validación del avance local

```text
$ ai/.venv-tests/bin/python -m py_compile ai/*.py
[código de salida: 0]
$ ai/.venv-tests/bin/python -m pytest ai/tests -q
.                                                                        [100%]
1 passed in 0.01s
[código de salida: 0]
```

Brandon autorizó pytest 9.2.0 y sus dependencias en un entorno exclusivo de
pruebas. Versiones exactas en `requirements-tests.txt`; referencia de la versión:
[pytest 9.2.0 en PyPI](https://pypi.org/project/pytest/9.2.0/).
La prueba comprueba cabecera y cierre del JPEG local; no carga SAM ni DINO.
T01 permanecía pendiente al escribir esta primera entrada; actualización abajo.

### Datos del servidor de Angel recibidos

Brandon confirma Ubuntu sobre WSL en la laptop de Angel. La salida siguiente fue
facilitada por Angel a través de Brandon; no se ejecutó desde esta sesión.
La captura incluye WDDM y procesos Windows. Falta identificar la distribución
Ubuntu y su memoria visible, y confirmar Python dentro del WSL objetivo.

```text
Thu Nov  5 12:30:03 2026
+-----------------------------------------------------------------------------------------+
| NVIDIA-SMI 610.78                 KMD Version: 610.78        CUDA UMD Version: 13.3     |
+-----------------------------------------+------------------------+----------------------+
| GPU  Name                  Driver-Model | Bus-Id          Disp.A | Volatile Uncorr. ECC |
| Fan  Temp   Perf          Pwr:Usage/Cap |           Memory-Usage | GPU-Util  Compute M. |
|                                         |                        |               MIG M. |
|=========================================+========================+======================|
|   0  NVIDIA GeForce RTX 4070 ...  WDDM  |   00000000:01:00.0 Off |                  N/A |
| N/A   54C    P8              3W /   80W |     480MiB /   8188MiB |      0%      Default |
|                                         |                        |                  N/A |
+-----------------------------------------+------------------------+----------------------+
Python 3.12.1
```

Extracto de la captura: se omitió la tabla de procesos, que muestra Unity.exe.
NVIDIA-SMI/KMD reportan 610.78; VRAM total 8188 MiB y ocupada 480 MiB en la captura.
La etiqueta CUDA UMD 13.3 se conserva tal como fue recibida; no se ha validado
una instalación PyTorch/CUDA en Ubuntu. RAM instalada: 16 GB declarados previamente;
RAM asignada a WSL y versión de Ubuntu: `null`, pendientes de medición allí.

## B1 — Entorno CPU independiente · 5 de noviembre de 2026

Brandon autorizó reinstalar las mismas versiones CPU. Se creó un entorno nuevo,
sin copiar el anterior ni modificar sus paquetes; fuente de versiones:
`requirements-sam2.txt`. La prueba GPU de Angel sigue pendiente.

| Campo | Resultado observado |
| --- | --- |
| Entorno actual | `Asset-Finder/ai/.venv-sam2`, Python 3.11.18 |
| Versiones | Las 23 entradas fijadas coinciden con las instaladas |
| Dependencias | `pip check`: código 0, `No broken requirements found.` |
| PyTorch / torchvision | 2.15.0+cpu / 0.29.2+cpu, instalados en este proyecto |
| NumPy / Pillow | 2.4.6 / 13.0.0, instalados en este proyecto |
| SAM | Editable desde `Asset-Finder/ai/sam2`; configuración y pesos locales |
| Comando de uso | `ai/.venv-sam2/bin/python -I ai/prueba_sam2.py` desde la raíz |
| Prueba auditada | Desde `/tmp`, Python aislado, `runpy.run_path` y audit hook |
| Accesos supervisados | 4,889 eventos; acceso Python a la carpeta antigua bloqueado |
| Orígenes importados | Ningún módulo proviene de la carpeta antigua |
| Archivos de entorno | Enlaces, .pth, .egg-link, direct_url.json y pyvenv.cfg sin rutas antiguas |
| Tiempo de segmentación | 2.17 s; una ejecución, incluye set_image/predict y excluye carga/guardado |
| Comando publicado | También ejecutado directamente desde la raíz: código 0, 2.05 s |
| Máscara | 1024 × 631, valores 0/255; 60,327 píxeles seleccionados |
| Recorte | Alfa idéntico a la máscara; tamaño 1024 × 631 |
| Limitación visual | La misma selección de fondo/pared del rectángulo fijo; no se cambió su lógica |
| Salida | Código 0; advertencia FutureWarning de torch.jit sin impedir la ejecución |

Conclusión: la ejecución CPU y el entorno de pruebas ya no dependen de la carpeta
antigua. Los registros B0/T01 iniciales describen el estado histórico, no el
comando actual. Las dos ejecuciones (auditada y directa) no son un promedio de
rendimiento. La distribución y memoria WSL del servidor aún requieren evidencia.
