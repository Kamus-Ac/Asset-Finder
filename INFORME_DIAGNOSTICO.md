# Informe de Diagnóstico y Validación: Laptop Servidor — Asset Finder
- **Fecha y hora de ejecución:** 2026-11-09 11:28 UTC-6
- **Carpeta de diagnóstico y evidencia:** `C:\Users\Tobia\diagnostico_asset_finder\`
- **Equipo verificado:** Laptop Host `MSI` (Windows 11) + WSL2 (`Ubuntu 26.04.1 LTS`)
- **GPU:** NVIDIA GeForce RTX 4070 Laptop GPU (8188 MiB VRAM)
- **Repositorio verificado:** `/home/tobias/projects/Asset-Finder` en WSL2 (accesible en Windows vía `\\wsl.localhost\Ubuntu\home\tobias\projects\Asset-Finder`)
- **Rama verificada:** `main` (commit `350a42ec99947b4d54490e4fc3974bfdebe82e0b`), con cotejo de `origin/feature/ai-exploracion` (Brandon, commit `f0a316b`) y `origin/feature/backend` (Manuel, commit `0d299da`).
---
## 1. Resumen Ejecutivo y Veredicto por Componente
| Componente | Veredicto | Estado | Resumen de Validación |
| :--- | :--- | :--- | :--- |
| **Servidor FastAPI y Sketchfab** | **Apto / Operativo** | **Aprobada** | FastAPI arranca limpiamente en WSL (`http://0.0.0.0:8000`). `/health`, `/openapi.json`, `/docs` y el conector real de Sketchfab (`/catalog/search?q=chair`) responden con código 200 y devuelven 10 modelos 3D reales con miniaturas y metadatos. Responde tanto desde WSL como desde Windows local (`http://127.0.0.1:8000`). |
| **SAM 2 y DINO en GPU (CUDA)** | **Apto / Alto Rendimiento** | **Aprobada** | PyTorch 2.15.0+cu132 ejecuta en `cuda:0`. SAM 2.1 Tiny segmenta en GPU con pico de 588.7 MB de VRAM (inferencia en 16 ms en warm-up). DINOv2 ViT-S/14 genera embeddings de 384 dimensiones en 5–8 ms con 88.8 MB de VRAM pico, ubicando el control idéntico en #1 (similitud 1.00000) y el modelo de silla de Sketchfab en #2 (0.30767). Ambos caben holgadamente en los 8 GB de la GPU. |
| **Generación con SAM 3D Objects** | **No Viable en este Hardware** | **Bloqueada por Hardware** | Los requisitos oficiales del repositorio de Meta exigen GPU con mínimo **32 GB de VRAM** (el equipo dispone de 8 GB; déficit de 24 GB). Además, los pesos en Hugging Face (`facebook/sam-3d-objects`) son restringidos ("gated"). En el repositorio no existe adaptación ni ruta para 8 GB. Debe abordarse en la nube o descartarse de la máquina local. |
| **Acceso Remoto por Tailscale** | **Pendiente Habilitación** | **No Probada (Externa) / Aprobada (Local)** | Tailscale 1.104.5 quedó instalado, logueado y conectado a la tailnet con IP `100.107.143.59` y nodo `msi.tail0d82ce.ts.net.`. FastAPI responde localmente en `127.0.0.1:8000`. La exposición HTTPS mediante Tailscale Serve requiere un clic de activación por el administrador de la tailnet en la URL provista. El acceso desde un segundo dispositivo (ej. móvil con datos) queda pendiente de dicha activación. |
---
## 2. Inventario de Hardware y Entorno
### Windows 11 (Anfitrión)
- **Host / Nombre de equipo:** `MSI`
- **RAM Física Total:** 16,473,596 KB (~15.7 GB)
- **RAM Disponible:** ~5.7 GB
- **Almacenamiento C::** 928.5 GB totales, 34.1 GB libres
- **Driver NVIDIA (KMD):** 610.78 / WDDM
- **GPU:** NVIDIA GeForce RTX 4070 Laptop GPU, 8188 MiB VRAM
- **WSL:** Versión 2, Distribución por defecto `Ubuntu` (State: Running)
### Ubuntu en WSL2
- **Distribución:** Ubuntu 26.04.1 LTS (`resolute`)
- **Kernel Linux:** `6.18.54.1-microsoft-standard-WSL2` (x86_64)
- **RAM visible en WSL:** 7.6 GiB totales, 6.0 GiB disponibles (gestión dinámica de memoria WSL2)
- **Disco en WSL (`/`):** 1007 GB totales, 946 GB disponibles (2% de uso)
- **NVIDIA en WSL (`nvidia-smi`):** Driver 610.55 / CUDA UMD 13.3, 8188 MiB VRAM
- **Dispositivo CUDA en PyTorch:** `NVIDIA GeForce RTX 4070 Laptop GPU`
- **Prueba aritmética CUDA:** Tensor `torch.ones((64, 64), device="cuda") @ torch.ones((64, 64), device="cuda")` verificado exitosamente (resultado: `64.0`).
---
## 3. Tabla Detallada de Pruebas y Evidencias
| ID | Prueba | Comando ejecutado | Estado | Evidencia obtenida | Siguiente acción |
| :--- | :--- | :--- | :--- | :--- | :--- | Informe de Diagnóstico y Validación: Laptop Servidor — Asset Finder
- **Fecha y hora de ejecución:** 2026-11-09 11:28 UTC-6
- **Carpeta de diagnóstico y evidencia:** `C:\Users\Tobia\diagnostico_asset_finder\`
- **Equipo verificado:** Laptop Host `MSI` (Windows 11) + WSL2 (`Ubuntu 26.04.1 LTS`)
- **GPU:** NVIDIA GeForce RTX 4070 Laptop GPU (8188 MiB VRAM)
- **Repositorio verificado:** `/home/tobias/projects/Asset-Finder` en WSL2 (accesible en Windows vía `\\wsl.localhost\Ubuntu\home\tobias\projects\Asset-Finder`)
- **Rama verificada:** `main` (commit `350a42ec99947b4d54490e4fc3974bfdebe82e0b`), con cotejo de `origin/feature/ai-exploracion` (Brandon, commit `f0a316b`) y `origin/feature/backend` (Manuel, commit `0d299da`).
---
## 1. Resumen Ejecutivo y Veredicto por Componente
| Componente | Veredicto | Estado | Resumen de Validación |
| :--- | :--- | :--- | :--- |
| **Servidor FastAPI y Sketchfab** | **Apto / Operativo** | **Aprobada** | FastAPI arranca limpiamente en WSL (`http://0.0.0.0:8000`). `/health`, `/openapi.json`, `/docs` y el conector real de Sketchfab (`/catalog/search?q=chair`) responden con código 200 y devuelven 10 modelos 3D reales con miniaturas y metadatos. Responde tanto desde WSL como desde Windows local (`http://127.0.0.1:8000`). |
| **SAM 2 y DINO en GPU (CUDA)** | **Apto / Alto Rendimiento** | **Aprobada** | PyTorch 2.15.0+cu132 ejecuta en `cuda:0`. SAM 2.1 Tiny segmenta en GPU con pico de 588.7 MB de VRAM (inferencia en 16 ms en warm-up). DINOv2 ViT-S/14 genera embeddings de 384 dimensiones en 5–8 ms con 88.8 MB de VRAM pico, ubicando el control idéntico en #1 (similitud 1.00000) y el modelo de silla de Sketchfab en #2 (0.30767). Ambos caben holgadamente en los 8 GB de la GPU. |
| **Generación con SAM 3D Objects** | **No Viable en este Hardware** | **Bloqueada por Hardware** | Los requisitos oficiales del repositorio de Meta exigen GPU con mínimo **32 GB de VRAM** (el equipo dispone de 8 GB; déficit de 24 GB). Además, los pesos en Hugging Face (`facebook/sam-3d-objects`) son restringidos ("gated"). En el repositorio no existe adaptación ni ruta para 8 GB. Debe abordarse en la nube o descartarse de la máquina local. |
| **Acceso Remoto por Tailscale** | **Pendiente Habilitación** | **No Probada (Externa) / Aprobada (Local)** | Tailscale 1.104.5 quedó instalado, logueado y conectado a la tailnet con IP `100.107.143.59` y nodo `msi.tail0d82ce.ts.net.`. FastAPI responde localmente en `127.0.0.1:8000`. La exposición HTTPS mediante Tailscale Serve requiere un clic de activación por el administrador de la tailnet en la URL provista. El acceso desde un segundo dispositivo (ej. móvil con datos) queda pendiente de dicha activación. |
---
## 2. Inventario de Hardware y Entorno
### Windows 11 (Anfitrión)
- **Host / Nombre de equipo:** `MSI`
- **RAM Física Total:** 16,473,596 KB (~15.7 GB)
- **RAM Disponible:** ~5.7 GB
- **Almacenamiento C::** 928.5 GB totales, 34.1 GB libres
- **Driver NVIDIA (KMD):** 610.78 / WDDM
- **GPU:** NVIDIA GeForce RTX 4070 Laptop GPU, 8188 MiB VRAM
- **WSL:** Versión 2, Distribución por defecto `Ubuntu` (State: Running)
### Ubuntu en WSL2
- **Distribución:** Ubuntu 26.04.1 LTS (`resolute`)
- **Kernel Linux:** `6.18.54.1-microsoft-standard-WSL2` (x86_64)
- **RAM visible en WSL:** 7.6 GiB totales, 6.0 GiB disponibles (gestión dinámica de memoria WSL2)
- **Disco en WSL (`/`):** 1007 GB totales, 946 GB disponibles (2% de uso)
- **NVIDIA en WSL (`nvidia-smi`):** Driver 610.55 / CUDA UMD 13.3, 8188 MiB VRAM
- **Dispositivo CUDA en PyTorch:** `NVIDIA GeForce RTX 4070 Laptop GPU`
- **Prueba aritmética CUDA:** Tensor `torch.ones((64, 64), device="cuda") @ torch.ones((64, 64), device="cuda")` verificado exitosamente (resultado: `64.0`).
---
## 3. Tabla Detallada de Pruebas y Evidencias
| ID | Prueba | Comando ejecutado | Estado | Evidencia obtenida | Siguiente acción |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **01** | Inventario y GPU Windows | `nvidia-smi`, `wsl.exe -l -v`, CIM Win32_OperatingSystem | **Aprobada** | RTX 4070 Laptop (8188 MiB VRAM), Driver 610.78, 16 GB RAM, 34 GB libres en C:. WSL2 activo con Ubuntu. | Ninguna requerida. |
| **02** | CUDA en WSL2 | PyTorch matmul script en WSL | **Aprobada** | PyTorch 2.15.0+cu132, CUDA 13.2 detectado, dispositivo `cuda:0` funcional, cálculo tensorial `64.0`. | Proceder a carga de modelos. |
| **03** | SAM 2 (CPU histórico) | `/home/tobias/projects/Asset-Finder/ai/.venv-ai/bin/python -I ai/prueba_sam2.py` | **Aprobada** | Inferencia CPU en 1.29 s con `sam2.1_hiera_tiny.pt`. Generó `mascara.png`, `silla_transparente.png` y `seleccion.png`. | Usar modo GPU para producción. |
| **04** | SAM 2.1 Tiny en GPU | `/home/tobias/projects/Asset-Finder/ai/.venv-ai/bin/python /home/tobias/run_sam2_gpu.py` | **Aprobada** | Carga modelo: 1.48 s. VRAM modelo: 288.7 MB. Inferencia 1 (Box): 1.40 s, VRAM pico: 588.7 MB. Inferencia 2 (Point prompt): 0.016 s (16 ms), score: 0.9017. Archivos generados en `output_sam2/`. Dispositivo verificado: `cuda:0`. | Integrar en endpoint API de segmentación. |
| **05** | DINOv2 ViT-S/14 en GPU | `/home/tobias/projects/Asset-Finder/ai/.venv-ai/bin/python /home/tobias/run_dino_test.py` | **Aprobada** | Modelo oficial `dinov2_vits14` cargado en GPU. Inferencia: 5.2–8.8 ms por imagen. VRAM pico: 88.8 MB. Control idéntico: 1.00000 (#1). Silla Sketchfab: 0.30767 (#2). Perro: 0.01428 (#3). Manzana: -0.07654 (#4). Vectores en `dino_embeddings.npz`. | Crear módulo formal `ai/embedding.py`. |
| **06** | SAM 3D Objects (Meta) | Inspección de especificación oficial y ramas del repo | **Bloqueada por Hardware** | Documentación oficial de Meta (`facebookresearch/sam-3d-objects`) exige GPU con mínimo **32 GB de VRAM**. El equipo cuenta con 8 GB. Requiere además aprobación en HF. No existe alternativa de 8 GB en el repositorio. | Ejecutar reconstrucción en instancia GPU cloud o descartar del alcance local. |
| **07** | FastAPI Local (WSL) | `/home/tobias/projects/Asset-Finder/backend/.venv-backend/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8000` | **Aprobada** | Servidor activo en puerto 8000. `/health` -> 200 OK. `/docs` y `/openapi.json` -> 200 OK. `/catalog/search?q=chair` -> 200 OK con 10 modelos reales de Sketchfab. | Mantener servicio activo en background. |
| **08** | Conectividad Local Windows → WSL | `curl.exe -fS http://127.0.0.1:8000/health` desde PowerShell | **Aprobada** | Windows conecta inmediatamente al backend en WSL vía localhost forwarding. Devuelve `{"status":"ok"}`. | Acceso anfitrión verificado. |
| **09** | Conexión Tailscale | `tailscale.exe status` / `login` | **Aprobada** | Tailscale 1.104.5 instalado, autenticado en tailnet `tacosdonchepo@` con IP `100.107.143.59`, DNS `msi.tail0d82ce.ts.net.`. | Habilitar Serve en consola. |
| **10** | Tailscale Serve (HTTPS) | `tailscale.exe serve --bg http://127.0.0.1:8000` | **Bloqueada por Configuración de Cuenta** | El comando reporta: `Serve is not enabled on your tailnet.` Se generó la URL de activación para el operador: `https://login.tailscale.com/f/serve?node=nrYb6iM17S11CNTRL`. | Operador debe autorizar Serve en la consola de Tailscale. |
| **11** | Acceso Remoto desde otro dispositivo | Petición externa vía Tailscale | **No Probada** | Pendiente de que el operador habilite Serve o configure puerto en tailnet y pruebe desde dispositivo móvil con Tailscale. | Probar desde celular con datos móviles tras activar Serve. |
---

## 4. Instalaciones Realizadas y Modificaciones del Sistema
Para garantizar el principio de aislamiento y reproducibilidad establecido en las reglas:
1. **Entorno de IA (`ai/.venv-ai`):**
   - Intérprete: Python 3.14.4 (Ubuntu 26.04)
   - PyTorch: `torch 2.15.0+cu132`, `torchvision 0.29.2+cu132`
   - Paquetes instalados: `SAM-2` (instalado en modo editable `--no-build-isolation` con `SAM2_BUILD_CUDA=0`), `hydra-core==1.3.8`, `omegaconf==2.3.1`, `iopath==0.1.10`, `tqdm==4.70.1`, `PyYAML==6.0.3`, `portalocker==4.4.2`, `antlr4-python3-runtime==4.9.3`.
   - Pesos descargados: `sam2.1_hiera_tiny.pt` (149 MB, en `ai/sam2/checkpoints/`), `dinov2_vits14_pretrain.pth` (84.2 MB, en `~/.cache/torch/hub/checkpoints/`).
2. **Entorno de Backend (`backend/.venv-backend`):**
   - Intérprete: Python 3.14.4
   - Paquetes instalados: `fastapi==0.162.2`, `uvicorn==0.54.0`, `httpx==0.28.1`, `pydantic==2.14.3`, `starlette==1.10.0`.
   - Resuelve la dependencia faltante de `httpx` que requería `connectors/sketchfab.py`.
3. **Herramientas del Sistema Windows:**
   - Instalación de **Tailscale 1.104.5** vía Winget (`winget install --id Tailscale.Tailscale`).
   - Servicio Windows `tailscaled` registrado y activo.

4. **Archivos fuera del repositorio creados:**
   - Directorio de diagnóstico: `C:\Users\Tobia\diagnostico_asset_finder\`
     - `logs/`: registros de inventario Windows, Ubuntu, endpoints FastAPI, SAM 2, DINO y Tailscale.
     - `output_sam2/`: máscaras (`mascara_silla.png`, `mascara_punto.png`) y previsualizaciones transparentes.
     - `output_dino/`: imágenes de prueba, `dino_results.json` y archivo de embeddings `dino_embeddings.npz`.
     - `output_sam3d/`: análisis formal de requisitos y bloqueo de SAM 3D Objects.
---
## 5. Mediciones de Rendimiento y Memoria (VRAM / Tiempos)
### SAM 2.1 Tiny en GPU (RTX 4070 Laptop — 8188 MiB)
- **VRAM Base (sin modelos):** 0.0 MB
- **VRAM con SAM 2.1 Tiny cargado:** 288.7 MB
- **VRAM Pico durante inferencia:** **588.7 MB** (< 7.2% de la memoria GPU disponible)
- **Tiempo de carga inicial del modelo:** 1.48 s
- **Tiempo de inferencia (Bounding Box + Image Embedding):** 1.40 s
- **Tiempo de inferencia subsecuente (Point Prompt, embedding en caché):** **0.016 s (16 ms)**
### DINOv2 ViT-S/14 en GPU
- **VRAM con modelo cargado:** 84.1 MB
- **VRAM Pico durante inferencia:** **88.9 MB** (< 1.1% de la memoria GPU disponible)
- **Tiempo de inferencia por imagen (warm):** **5.27 ms a 8.85 ms**
- **Dimensión de vector embedding:** 384 floats normalizados L2
### Consumo Combinado SAM 2 + DINO en GPU:
- **VRAM combinada esperada:** ~678 MB de los 8188 MB totales disponibles.
- **Margen de seguridad:** Más de **7.5 GB de VRAM libres**, lo que permite atender peticiones simultáneas, batches o preprocesamiento sin riesgo de `CUDA Out of Memory`.
---
## 6. Procedimiento para el Operador (Acceso Remoto y Demostración)
### A. Para habilitar Tailscale Serve (HTTPS)
1. Iniciar sesión como administrador de la red en la consola de Tailscale.
2. Abrir el siguiente enlace para habilitar Serve en este nodo:
   👉 **`https://login.tailscale.com/f/serve?node=nrYb6iM17S11CNTRL`**
3. En una ventana de PowerShell en Windows, ejecutar:
   ```powershell
   & "C:\Program Files\Tailscale\tailscale.exe" serve --bg http://127.0.0.1:8000
   ```
4. El comando entregará la URL HTTPS (por ejemplo `https://msi.tail0d82ce.ts.net`).
5. Probar abriendo desde el navegador de un celular conectado a Tailscale:
   - `https://msi.tail0d82ce.ts.net/health`
   - `https://msi.tail0d82ce.ts.net/catalog/search?q=chair`
### B. Comandos para Iniciar y Detener los Servicios
#### 1. Backend FastAPI:
```bash
# Dentro de WSL (Ubuntu)
cd /home/tobias/projects/Asset-Finder/backend
/home/tobias/projects/Asset-Finder/backend/.venv-backend/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8000
```
*(Nota: Actualmente el backend se encuentra corriendo en segundo plano en el puerto 8000).*
#### 2. Verificar estado local desde Windows:
```powershell
curl.exe -fS http://127.0.0.1:8000/health
```
#### 3. Estado de Tailscale en Windows:
```powershell
& "C:\Program Files\Tailscale\tailscale.exe" status
& "C:\Program Files\Tailscale\tailscale.exe" serve status
```