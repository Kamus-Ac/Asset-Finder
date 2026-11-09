# Graph Report - Asset-Finder  (2026-11-09)

## Corpus Check
- Corpus is ~25,779 words - fits in a single context window. You may not need a graph.

## Summary
- 303 nodes · 420 edges · 23 communities (12 shown, 11 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.91)
- Token cost: no disponible; la herramienta de agentes no expone uso real.

## Community Hubs (Navigation)
- Herramientas y dependencias web
- Diagnóstico del servidor
- Interfaz y progreso IA
- Servicio y segmentación SAM
- Contratos y arquitectura prevista
- Pruebas e inferencia CPU
- Web y vistas Three.js
- TypeScript para la aplicación
- TypeScript para herramientas
- Validación de segmentación
- Alcance y responsabilidades
- API y conector Sketchfab
- Imagen de prueba SAM
- Referencias de TypeScript
- Preparación y embedding DINO
- Entrada HTML web
- Favicon de la web
- Símbolos SVG auxiliares
- Plantilla React y Vite
- Ilustración de capas
- Logotipo React
- Logotipo Vite

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 18 edges
2. `CpuSegmentationTest` - 16 edges
3. `compilerOptions` - 15 edges
4. `parse_gpu_csv()` - 11 edges
5. `ServiceUnavailableError` - 11 edges
6. `collect_report()` - 10 edges
7. `run_command()` - 8 edges
8. `_get_predictor()` - 7 edges
9. `segment()` - 7 edges
10. `nvidia_tool()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Main prioriza candidatos externos y conector Sketchfab; revisar catálogo manual con P3` --semantically_similar_to--> `Buscar modelos externos, comparar imágenes con Meta y devolver enlaces`  [INFERRED] [semantically similar]
  ai/PLAN_P4_IA.md → AGENTS.md
- `Dependencias backend FastAPI y PyTorch CPU` --conceptually_related_to--> `Arquitectura servidor propuesta`  [INFERRED]
  backend/requirements.txt → Asset_Finder_Contexto_Claude_Equipo.md
- `Selección en imagen normalizada` --conceptually_related_to--> `SAM 2.1 Tiny: segmentación`  [INFERRED]
  CONTRATOS_API.md → Asset_Finder_Contexto_Claude_Equipo.md
- `Catálogo previsto de 20–30 modelos` --semantically_similar_to--> `Indexación multivista propuesta`  [INFERRED] [semantically similar]
  PLAN_EQUIPO.md → Asset_Finder_Contexto_Claude_Equipo.md
- `Ranking agrupado por asset` --semantically_similar_to--> `Disponibilidad real del asset`  [INFERRED] [semantically similar]
  Asset_Finder_Contexto_Claude_Equipo.md → CONTRATOS_API.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Flujo visual previsto: seleccionar, segmentar, representar, buscar y colocar** — contratos_api_seleccion, asset_finder_contexto_claude_equipo_sam_2_1_tiny, asset_finder_contexto_claude_equipo_dinov2_vit_s_14, asset_finder_contexto_claude_equipo_ranking_por_asset, asset_finder_contexto_claude_equipo_escena_glb [EXTRACTED 1.00]
- **Segmentación CPU y servicio Python validados; confirmación P3 e integración pendientes** — ai_interfaz_p3_propuesta, ai_progress_validacion_actual, ai_tasks_estado_fase2 [INFERRED 0.95]
- **Entornos CPU, pruebas y GPU separados** — ai_requirements_sam2_entorno_cpu, ai_requirements_tests_entorno_pruebas, ai_propuesta_entorno_combinacion [INFERRED 0.95]

## Communities (23 total, 11 thin omitted)

### Community 0 - "Herramientas y dependencias web"
Cohesion: 0.07692307692307693
Nodes (36): devDependencies, eslint@^10.13.0, @eslint/js@^10.0.1, eslint-plugin-react-hooks@^7.1.1, eslint-plugin-react-refresh@^0.5.7, globals@^17.13.0, @types/node@^24.19.2, @types/react@^19.3.0 (+28 more)

### Community 1 - "Diagnóstico del servidor"
Cohesion: 0.11764705882352941
Nodes (8): collect_report(), main(), nvidia_tool(), parse_gpu_csv(), run_command(), CommandTest, GpuCsvTest, ReportTest

### Community 2 - "Interfaz y progreso IA"
Cohesion: 0.06439393939393939
Nodes (27): ValueError para entradas; ServiceUnavailableError para recursos o funciones ausentes, mask_to_png: máscara bool → bytes PNG L, fondo 0 y objeto 255, T09: propuesta de interfaz Python para Manuel, P3 gestiona endpoints, autenticación, persistencia PNG, mask_url y traducción de errores, segment: PIL RGB o ndarray uint8, caja/puntos → máscara bool H×W y score float, Servidor elegido de Ángel: RTX 4070 Laptop, 8188 MiB, driver 610.78, B1: entorno SAM CPU independiente, Python 3.11.18 y torch 2.15.0+cpu, Diagnóstico adicional de Luis: RTX 4060, 8188 MiB y Ubuntu WSL2 (+19 more)

### Community 3 - "Servicio y segmentación SAM"
Cohesion: 0.1053763440860215
Nodes (10): _build_predictor(), _coordinate(), _get_predictor(), segment(), ServiceUnavailableError, _validate_inputs(), embed(), mask_to_png() (+2 more)

### Community 4 - "Contratos y arquitectura prevista"
Cohesion: 0.08045977011494253
Nodes (28): Arquitectura servidor propuesta, Indexación multivista propuesta, DINOv2 ViT-S/14: embedding previsto, Escena GLB persistente propuesta, Conflicto de importación SAM conocido, Ranking agrupado por asset, Servidor previsto RTX 4070, 8 GB VRAM, SAM 2.1 Tiny: segmentación (+20 more)

### Community 5 - "Pruebas e inferencia CPU"
Cohesion: 0.10541310541310542
Nodes (3): run(), ServiceTest, SmokeTest

### Community 6 - "Web y vistas Three.js"
Cohesion: 0.12857142857142856
Nodes (16): dependencies, react@^19.3.1, react-dom@^19.3.1, tailwindcss@^4.3.4, @tailwindcss/vite@^4.3.4, three@^0.187.0, App(), Asset (+8 more)

### Community 7 - "TypeScript para la aplicación"
Cohesion: 0.1
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 8 - "TypeScript para herramientas"
Cohesion: 0.11764705882352941
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 10 - "Alcance y responsabilidades"
Cohesion: 0.21818181818181817
Nodes (7): Reglas de colaboración y propiedad de áreas, Luis móvil; Ángel web; Manuel backend, fuentes y documentación; Brandon IA y ranking, Plan operativo IA E0–E7 e investigación I1, Catálogo previsto de 20–30 assets, 4–6 vistas, vectores NPY y metadatos JSON, Plan original P4: segmentación, embeddings y catálogo manual, Imagen y selección → API → SAM → DINO → resultados → escena GLB, Mapa y estado histórico de Asset Finder

### Community 11 - "API y conector Sketchfab"
Cohesion: 0.42857142857142855
Nodes (3): search_sketchfab(), health(), search_catalog()

### Community 12 - "Imagen de prueba SAM"
Cohesion: 0.6666666666666666
Nodes (3): Computadora portátil sobre mesa redonda, Fotografía de una escena interior de trabajo, Silla amarilla y asientos grises

## Knowledge Gaps
- **32 isolated node(s):** `Tailscale previsto para acceso privado`, `Conflicto de importación SAM conocido`, `Escena GLB persistente propuesta`, `Generación pendiente: 503 service_unavailable`, `Mocks por endpoint previstos` (+27 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 112 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `CpuSegmentationTest` connect `Validación de segmentación` to `Pruebas e inferencia CPU`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **What connects `Tailscale previsto para acceso privado`, `Conflicto de importación SAM conocido`, `Escena GLB persistente propuesta` to the rest of the system?**
  _32 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Herramientas y dependencias web` be split into smaller, more focused modules?**
  _Cohesion score 0.07692307692307693 - nodes in this community are weakly interconnected._
- **Should `Diagnóstico del servidor` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Should `Interfaz y progreso IA` be split into smaller, more focused modules?**
  _Cohesion score 0.06439393939393939 - nodes in this community are weakly interconnected._
- **Should `Servicio y segmentación SAM` be split into smaller, more focused modules?**
  _Cohesion score 0.1053763440860215 - nodes in this community are weakly interconnected._
- **Should `Contratos y arquitectura prevista` be split into smaller, more focused modules?**
  _Cohesion score 0.08045977011494253 - nodes in this community are weakly interconnected._
## Límites de esta ejecución

- Lectura completa validada para los 15 documentos reextraídos; 11 archivos se recuperaron de caché.
- Coste real en tokens: no disponible. La herramienta de agentes no expone usage; los ceros de extracción son marcadores sin medición, no consumo gratuito.
- Advertencia de integridad: 67 relaciones con extremos no declarados en la extracción, 1 autorreferencia y 9 relaciones coincidentes colapsadas al construir el grafo no dirigido. Ver graph-health.json; el grafo puede ser incompleto.
- Cuatro archivos no produjeron símbolos AST: ai/prueba_sam2.py, frontend/eslint.config.js, frontend/src/main.tsx y frontend/vite.config.ts.
- Se sustituyeron 11 conceptos del análisis anterior tras verificar reextracción completa de sus fuentes. Respaldo previo en /tmp/asset-finder-graphify-before-resumen/.
- graphify-out/ es salida de análisis local dentro del árbol de trabajo; contiene archivos ya versionados y otros nuevos. No se incluye en el commit del resumen ni se cambió .gitignore.

## Benchmark local (estimaciones)

graphify benchmark: corpus indexado estimado en 20,200 tokens; consulta media 2,652 tokens; reducción 7.6x. Son estimaciones del benchmark, no consumo medido de esta ejecución.
