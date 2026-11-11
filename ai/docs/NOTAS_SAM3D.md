# T10 — Viabilidad de SAM 3D Objects

Consulta documental: **9 de noviembre de 2026**, acotada al máximo de 2 horas.
No se instalaron paquetes, descargaron pesos ni ejecutó inferencia SAM 3D.

## Conclusión para Asset Finder

**Servicio no disponible para generación 3D.** La configuración oficial requiere
al menos 32 GB de VRAM; las laptops documentadas tienen unos 8 GB. No cumplen
ese requisito y no tenemos una ejecución validada con menos memoria. Por ello,
SAM 3D no se incorpora al MVP ni bloquea segmentación y búsqueda de modelos.
Esto es una conclusión de viabilidad documental, no una medición de OOM ni una
afirmación de imposibilidad de cualquier optimización futura.
Fuente: [guía oficial de instalación](https://github.com/facebookresearch/sam-3d-objects/blob/main/doc/setup.md).

## Qué modelo se investigó

SAM 3D **Objects**, de Meta, reconstruye objetos desde imagen y selección.
El ejemplo oficial recibe imagen/máscara y muestra una exportación Gaussian
splat `.ply`. No acredita una integración GLB en nuestro producto. SAM 3D Body
es un modelo distinto para cuerpos humanos y no sustituye la búsqueda de muebles.
Fuente: [README oficial](https://github.com/facebookresearch/sam-3d-objects/blob/main/README.md).

## Requisitos y entorno

La guía pide Linux de 64 bits y GPU NVIDIA con al menos 32 GB de VRAM. Usa un
entorno conda/mamba y pasos separados para dependencias base, PyTorch3D e
inferencia; puede requerir compilar en un equipo con GPU. Los checkpoints de
Hugging Face requieren solicitar acceso y autenticarse tras su aprobación.
Fuente: [setup oficial](https://github.com/facebookresearch/sam-3d-objects/blob/main/doc/setup.md).

El [entorno publicado](https://github.com/facebookresearch/sam-3d-objects/blob/main/environments/default.yml)
fija Python 3.11.0 y componentes CUDA 12.1. Las dependencias se separan en
archivos base y extras según [pyproject.toml](https://github.com/facebookresearch/sam-3d-objects/blob/main/pyproject.toml).
No se asume compatibilidad con nuestro entorno SAM 2 ni con la propuesta GPU T02.
Una evaluación futura exigiría una propuesta de instalación aislada y aprobada.

## Hardware conocido del equipo

| Equipo | Evidencia disponible | Diferencia frente a SAM 3D |
| --- | --- | --- |
| Ángel, servidor elegido | MSI, RTX 4070 Laptop/8188 MiB, driver 610.78, Ubuntu 26.04.1/WSL2; 7.61 GiB RAM visibles. Diagnóstico real del 9 de noviembre | VRAM por debajo de la configuración documentada; PyTorch CUDA aún sin validar |
| Luis, diagnóstico adicional | RTX 4060, 8188 MiB; Ubuntu 26.04.1 WSL2, Python 3.14.4; informe en `Pruebas/Prueba1_Laptop Luis.json` | VRAM por debajo del requisito; no reemplaza al servidor elegido |
| Sesión local de desarrollo | `ai/.venv-sam2`: torch 2.15.0+cpu, `torch.cuda.is_available()` = `False` | Pruebas SAM 2 CPU, sin validación SAM 3D |

Referencias internas: [MEDICIONES.md](MEDICIONES.md) y diagnóstico de Luis.
Actualización de hardware del 10 de noviembre:
[diagnóstico MSI](../Pruebas/Diagnostico_MSI_Angel_2026-11-09.json).
T10 conserva su conclusión; no se ejecutó SAM 3D. El plan CPU primero no activa
la generación ni convierte su viabilidad en una conexión pendiente garantizada.
La RAM del sistema no equivale a VRAM. No se suman memorias de GPU integrada,
dedicada ni otras laptops para considerar satisfecho el requisito.

Comprobación local realizada, sin instalar:

```bash
ai/.venv-sam2/bin/python -I -c 'import torch; print(torch.__version__); print(torch.cuda.is_available())'
# 2.15.0+cpu
# False
```

## Licencia

Código y checkpoints están bajo **SAM License**, versión fechada el 19 de
noviembre de 2025. No asumir Apache 2.0 por usar otros modelos SAM.
Permite uso y modificaciones bajo sus condiciones; al redistribuir materiales
o derivados exige conservar el acuerdo y entregar su copia. Las publicaciones
de investigación deben reconocer SAM. Incluye condiciones sobre uso legal,
privacidad, controles comerciales y usos restringidos; no ofrece garantías.
No equivale a afirmar que cualquier imagen o asset generado pueda redistribuirse
sin revisar sus derechos. Fuente: [licencia oficial completa](https://github.com/facebookresearch/sam-3d-objects/blob/main/LICENSE).
Las dependencias deben revisarse por separado si se llega a distribuir el entorno.

## Alternativas y límites

1. **MVP actual:** continuar SAM 2 y DINOv2 para selección/ranking de candidatos
   3D; conservar generación como «servicio no disponible». No introduce otro modelo.
2. **Investigación futura:** evaluar el mismo SAM 3D en hardware que cumpla el
   requisito, con acceso a pesos y entorno aislado aprobados. No se contrató ni
   ejecutó ningún servicio externo; un equipo mayor no garantiza el flujo GLB.
3. **Demostración manual:** el README enlaza una [demo de Meta](https://www.aidemos.meta.com/segment-anything/editor/convert-image-to-3d).
   No se probó su acceso ni se subieron imágenes; el enlace no constituye una API
   de integración disponible para nuestro backend.

En README, setup y la [interfaz de inferencia oficial](https://github.com/facebookresearch/sam-3d-objects/blob/main/notebook/inference.py)
consultados no se documenta una receta validada para nuestras GPU de 8 GB.
No se evaluaron forks comunitarios, offloading, cuantización ni CPU para SAM 3D;
no se prometen tiempos, calidad o consumo de memoria sin una prueba real.

## Aceptación de T10

- [x] Requisitos y licencia consultados en fuentes primarias.
- [x] Contraste con hardware y límites de evidencia documentados.
- [x] Alternativas y decisión del MVP escritas, sin instalaciones pesadas.
- [x] Generación 3D permanece explícitamente no disponible.
