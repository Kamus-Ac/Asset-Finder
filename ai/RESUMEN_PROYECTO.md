# Asset Finder — resumen para Brandon

Estado revisado: **10 de noviembre de 2026**.

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
  última suite registrada: 35 pruebas y 5 subtests, incluido el instalador GPU.
- **Interfaz:** `service.py` devuelve máscara/score y permite PNG. T09 espera
  confirmación de Manuel (T09-P diferida). `embed`/`search` no disponibles.
- **Backend:** `/health` y búsqueda textual Sketchfab en `/catalog/search`;
  sin integración visual. No se probó Sketchfab en vivo en esta revisión.
- **Web:** tarjetas y cubos Three.js de demostración. Móvil y flujo completo pendientes.
- **Servidor:** T01 completa en MSI: Ubuntu/WSL2, RTX 4070/8188 MiB detectada,
  driver 610.78, Python 3.14.4 y 7.61 GiB RAM visibles. PyTorch CUDA aún sin validar.
  El diagnóstico de Luis corresponde a otro equipo.

## Alcance y siguiente paso

**Orden autorizado:** recorte/DINO CPU → candidatos externos → ranking/evaluación
→ flujo local y arranque → CUDA/API/red con el equipo. **Siguiente tarea: T11**,
preparar el recorte. La reorganización conserva los IDs y las pruebas anteriores.

Solo modelos de IA de Meta; desarrollo CPU local y ejecución final en servidor.
T03–T05 quedan diferidas: entorno Python 3.12.16 creado en la MSI, CUDA pendiente.
Manuel obtiene candidatos/imágenes y acuerda cómo la referencia inicia esa búsqueda;
P4 los compara. Una captura real sirve para pruebas, no es un catálogo manual obligatorio.

Tailscale e integración con clientes pendientes; video opcional. SAM 3D:
**servicio no disponible**, T10 terminada; requiere resolver viabilidad aparte.
Dejar listo el módulo local no acredita todavía GPU, API ni aceptación por el equipo.

Seguimiento: [TASKS](TASKS.md) · [Interfaz P3](INTERFAZ_P3.md) ·
[Mediciones](MEDICIONES.md) · [SAM 3D](NOTAS_SAM3D.md).
