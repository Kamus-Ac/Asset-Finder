# Asset Finder — resumen para Brandon

Estado revisado: **9 de noviembre de 2026**.

## Qué estamos construyendo

Un buscador visual de modelos 3D en páginas externas. **SAM** separa el objeto
seleccionado en una foto; **DINOv2** permitirá comparar su apariencia con modelos
candidatos. Los resultados enlazarán a su origen; la escena requiere archivos 3D disponibles.

**Flujo objetivo:** imagen → selección → máscara SAM → candidatos externos
→ comparación DINO → resultados → elección y escena guardada.

## Cómo se divide

```text
Asset-Finder/
├── ai/          Brandon · P4: segmentación, preparación visual y ranking
├── backend/     Manuel · P3: API, fuentes externas, archivos y servidor
├── frontend/    Ángel · P2: web, resultados y escena 3D
├── mobile/      Luis · P1: captura y selección; carpeta aún no presente
└── *.md         Contexto, planes, contratos y reglas del equipo
```

## P4 Responsabilidad principal

Entregar la **comprensión y comparación visual**, dentro de `ai/`:

1. Validar imagen/caja/puntos y segmentar con SAM.
2. Preparar el recorte y obtener su vector visual con DINOv2.
3. Ordenar por similitud los candidatos que obtiene P3; el score no mide acierto.
4. Entregar funciones a Manuel, probar errores y documentar tiempos/memoria.

## Dónde estamos parados

- **IA:** SAM 2.1 Tiny probado en CPU con caja y puntos. T06–T08 y T10 completas;
  última validación: 31 pruebas y 5 subtests.
- **Interfaz:** `service.py` devuelve máscara/score y permite PNG. T09 espera
  confirmación de Manuel: FASE 2 aún sin aceptación total. `embed`/`search` no disponibles.
- **Backend:** `/health` y búsqueda textual Sketchfab en `/catalog/search`;
  sin integración visual. No se probó Sketchfab en vivo en esta revisión.
- **Web:** tarjetas y cubos Three.js de demostración. Móvil y flujo completo pendientes.
- **Servidor por confirmar:** últimas pruebas en Dell Latitude 3410/Intel UHD,
  distinta de la MSI/RTX 4070 prevista. WSL2 con Python 3.14.4; CUDA sin validar.
  El diagnóstico de Luis corresponde a otro equipo.

## Alcance y siguiente paso

Solo modelos de IA de Meta, ejecutados en servidor. Tailscale por integrar;
video opcional. SAM 3D: **servicio no disponible**, investigación T10 terminada.
Adaptar con P3 los planes antiguos de catálogo manual al enfoque de fuentes externas.

Siguiente: confirmar interfaz con Manuel → recorte/DINO → ranking e integración.
FASE 1: confirmar equipo definitivo y diagnosticar allí antes de instalar el entorno.

Seguimiento: [TASKS](TASKS.md) · [Interfaz P3](INTERFAZ_P3.md) ·
[Mediciones](MEDICIONES.md) · [SAM 3D](NOTAS_SAM3D.md).
