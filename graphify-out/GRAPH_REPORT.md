# Graph Report - Asset-Finder  (2026-11-11)

## Corpus Check
- 110 files · ~48,484 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 646 nodes · 1193 edges · 43 communities (24 shown, 19 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 26 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5c880569`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Flujo y demo local
- Embeddings e índices
- Dependencias de frontend
- Pruebas de inferencia
- Recursos y diagnóstico
- Contratos y fuentes externas
- Validación de errores
- Evidencia y planes históricos
- Arquitectura del equipo
- Web y selección
- API y exportación
- Contrato de candidatos
- Referencias de imágenes
- TypeScript de aplicación
- Segmentación y caché SAM
- TypeScript de herramientas
- Pruebas de segmentación
- Entrega y demostraciones CPU
- Seguimiento y validación
- Alcance y responsabilidades
- Flujo CPU y despliegue
- Frontend y organización
- Pruebas de API
- Evaluación etiquetada pendiente
- Diagnóstico de equipo equivocado
- Imagen de referencia
- Configuración TypeScript
- Preparación y vectores
- Instalador GPU
- Preparación parcial MSI
- Reproducción del entorno
- Publicación Git
- Viabilidad SAM 3D
- Entrada web
- Icono de aplicación
- Recursos de iconos
- Documentación de frontend
- Ilustración de interfaz
- Recurso gráfico React
- Recurso gráfico Vite
- Política de Graphify

## God Nodes (most connected - your core abstractions)
1. `CpuCase` - 26 edges
2. `run_search()` - 20 edges
3. `compilerOptions` - 18 edges
4. `CpuSegmentationTest` - 16 edges
5. `validate_candidates()` - 16 edges
6. `compilerOptions` - 15 edges
7. `main()` - 14 edges
8. `model_identity()` - 14 edges
9. `build_index()` - 14 edges
10. `handler_for()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `Main prioriza candidatos externos y conector Sketchfab; revisar catálogo manual con P3` --semantically_similar_to--> `Buscar modelos externos, comparar imágenes con Meta y devolver enlaces`  [INFERRED] [semantically similar]
  ai/PLAN_P4_IA.md → AGENTS.md
- `Dependencias backend FastAPI y PyTorch CPU` --conceptually_related_to--> `Arquitectura servidor propuesta`  [INFERRED]
  backend/requirements.txt → Asset_Finder_Contexto_Claude_Equipo.md
- `Memoria histórica del resumen del 9 de noviembre; embed/search aún pendientes entonces` --conceptually_related_to--> `Flujo SAM → recorte → DINO → ranking implementado en CPU`  [INFERRED]
  graphify-out/memory/query_20261109_174938_b1bce96d_generame_un_pequeño_archivo_de_resumen_que_me_expl.md → ai/RESUMEN_PROYECTO.md
- `Memoria histórica de reanudación T01; no sustituye diagnóstico MSI posterior` --conceptually_related_to--> `MSI RTX 4070 detectada en WSL; inferencia CUDA pendiente`  [INFERRED]
  graphify-out/memory/query_20261109_175811_d0d52162_listo__ya_podemos_continuar_con_las_tasks__ahora_a.md → ai/RESUMEN_PROYECTO.md
- `Frontend oficial disponible en localhost:5173 con proxy local a IA` --shares_data_with--> `Proxy Vite local hacia ai.demo en puerto 8765`  [INFERRED]
  ai/README.md → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Flujo visual previsto: seleccionar, segmentar, representar, buscar y colocar** — contratos_api_seleccion, asset_finder_contexto_claude_equipo_sam_2_1_tiny, asset_finder_contexto_claude_equipo_dinov2_vit_s_14, asset_finder_contexto_claude_equipo_ranking_por_asset, asset_finder_contexto_claude_equipo_escena_glb [EXTRACTED 1.00]
- **Segmentación CPU y servicio Python validados; confirmación P3 e integración pendientes** — ai_interfaz_p3_propuesta, ai_progress_validacion_actual, ai_tasks_estado_fase2 [INFERRED 0.95]
- **Entornos CPU, pruebas y GPU separados** — ai_requirements_sam2_entorno_cpu, ai_requirements_tests_entorno_pruebas, ai_propuesta_entorno_combinacion [INFERRED 0.95]

## Communities (43 total, 19 thin omitted)

### Community 0 - "Flujo y demo local"
Cohesion: 0.09
Nodes (20): main(), handler_for(), do_GET(), do_POST(), reply(), main(), png_data(), main() (+12 more)

### Community 1 - "Embeddings e índices"
Cohesion: 0.09
Nodes (29): image_digest(), prepare_candidates(), embed(), _encode_prepared(), _get_model(), model_identity(), memory_errors(), build_index() (+21 more)

### Community 2 - "Dependencias de frontend"
Cohesion: 0.06
Nodes (47): dependencies, react@^19.3.1, react-dom@^19.3.1, tailwindcss@^4.3.4, @tailwindcss/vite@^4.3.4, three@^0.187.0, devDependencies, eslint@^10.13.0 (+39 more)

### Community 3 - "Pruebas de inferencia"
Cohesion: 0.09
Nodes (13): CpuCase, CandidateImageTests, DemoTests, EmbeddingTests, ErrorTests, IndexTests, InputManifestTests, PipelineTests (+5 more)

### Community 4 - "Recursos y diagnóstico"
Cohesion: 0.09
Nodes (14): collect_report(), nvidia_tool(), parse_gpu_csv(), run_command(), dino_manifest(), download_verified(), prepare_demo(), prepare_dino() (+6 more)

### Community 5 - "Contratos y fuentes externas"
Cohesion: 0.06
Nodes (38): Aceptar F03 exige compatibilidad, cantidades válidas, paginación, IDs únicos y conexión al frontend, candidates_from_export adapta JSON actual e imágenes RGB entregadas por P3, Propuesta: GET /catalog/search añade candidate_limit con valor por defecto 10, Reporte comparison distingue requested, available, selected, compared, views y resultados, Documentación oficial Sketchfab: paginación y máximo documentado de 24 por página, Obtener 30 candidatos y mostrar k=5 son operaciones diferentes, Más de 24 por página requiere cursores, IDs únicos y parada por límite, agotamiento o error, F03 es propuesta para P3; FastAPI/backend todavía sin modificar (+30 more)

### Community 6 - "Validación de errores"
Cohesion: 0.08
Nodes (4): EvaluationTests, GpuPreflightTest, ServiceTest, SmokeTest

### Community 7 - "Evidencia y planes históricos"
Cohesion: 0.07
Nodes (26): ValueError para entradas; ServiceUnavailableError para recursos o funciones ausentes, mask_to_png: máscara bool → bytes PNG L, fondo 0 y objeto 255, T09: propuesta de interfaz Python para Manuel, P3 gestiona endpoints, autenticación, persistencia PNG, mask_url y traducción de errores, segment: PIL RGB o ndarray uint8, caja/puntos → máscara bool H×W y score float, Servidor elegido de Ángel: RTX 4070 Laptop, 8188 MiB, driver 610.78, B1: entorno SAM CPU independiente, Python 3.11.18 y torch 2.15.0+cpu, Diagnóstico adicional de Luis: RTX 4060, 8188 MiB y Ubuntu WSL2 (+18 more)

### Community 8 - "Arquitectura del equipo"
Cohesion: 0.08
Nodes (28): Arquitectura servidor propuesta, Indexación multivista propuesta, DINOv2 ViT-S/14: embedding previsto, Escena GLB persistente propuesta, Conflicto de importación SAM conocido, Ranking agrupado por asset, Servidor previsto RTX 4070, 8 GB VRAM, SAM 2.1 Tiny: segmentación (+20 more)

### Community 9 - "Web y selección"
Cohesion: 0.13
Nodes (16): App(), Asset, assets, CubePreview(), capResults(), CountValue, inputNumber(), validCounts() (+8 more)

### Community 10 - "API y exportación"
Cohesion: 0.17
Nodes (10): search_sketchfab(), check_links(), export(), main(), select_candidates(), valid_url(), health(), search_catalog() (+2 more)

### Community 11 - "Contrato de candidatos"
Cohesion: 0.17
Nodes (8): Candidate, candidates_from_export(), _text(), _url(), validate_candidates(), View, CandidateTests, fixture()

### Community 12 - "Referencias de imágenes"
Cohesion: 0.16
Nodes (7): describe(), get_media(), get_media_file(), image_path(), MediaReference, storage_root(), upload_media()

### Community 13 - "TypeScript de aplicación"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 14 - "Segmentación y caché SAM"
Cohesion: 0.18
Nodes (7): _build_predictor(), _coordinate(), _get_predictor(), segment(), ServiceUnavailableError, _validate_inputs(), ModelCacheTest

### Community 15 - "TypeScript de herramientas"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 17 - "Entrega y demostraciones CPU"
Cohesion: 0.13
Nodes (15): Demo y CLI CPU listas para pruebas locales, Instalación limpia y reproducción por otro integrante pendientes, Buscar modelos 3D en páginas externas mediante selección visual, Flujo SAM → recorte → DINO → ranking implementado en CPU, MSI RTX 4070 detectada en WSL; inferencia CUDA pendiente, Manuel: aceptar tipos y conectar candidatos e imágenes a la API, Graphify permitido en rama IA y excluido de integración a main, Revisión registra 56 pruebas y 13 subtests; no acredita CUDA (+7 more)

### Community 18 - "Seguimiento y validación"
Cohesion: 0.17
Nodes (3): F01 completada: candidate_limit antes de DINO, k independiente y 24 miniaturas reales, F02 implementada: frontend oficial de Ángel, selección y resultados con proxy local IA, F04 completada: campos numéricos editables sin NaN y límites validados

### Community 19 - "Alcance y responsabilidades"
Cohesion: 0.22
Nodes (7): Reglas de colaboración y propiedad de áreas, Luis móvil; Ángel web; Manuel backend, fuentes y documentación; Brandon IA y ranking, Plan operativo IA E0–E7 e investigación I1, Catálogo previsto de 20–30 assets, 4–6 vistas, vectores NPY y metadatos JSON, Plan original P4: segmentación, embeddings y catálogo manual, Imagen y selección → API → SAM → DINO → resultados → escena GLB, Mapa y estado histórico de Asset Finder

### Community 20 - "Flujo CPU y despliegue"
Cohesion: 0.29
Nodes (5): P3 obtiene candidatos e imágenes; P4 prepara y compara, Aceptación P3, CUDA, red/clientes y reproducción pendientes, SAM, preparación, DINO y ranking del lote externo, Flujo CPU implementado: selección → SAM → recorte → DINO → ranking, candidate_limit compara N candidatos; k devuelve K resultados

### Community 21 - "Frontend y organización"
Cohesion: 0.33
Nodes (6): FastAPI, CUDA y consultas etiquetadas siguen pendientes con Manuel y Ángel, Frontend oficial disponible en localhost:5173 con proxy local a IA, Búsqueda textual y referencias de imagen existentes; integración visual API pendiente, Muestra local de 24 modelos; candidatos a comparar y resultados separados, Frontend oficial de Ángel con VisualSearch y ejemplos Three.js, Proxy Vite local hacia ai.demo en puerto 8765

### Community 23 - "Evaluación etiquetada pendiente"
Cohesion: 0.50
Nodes (4): Conjunto requerido: 10–15 referencias conocidas y 3–5 sin coincidencia clara, evaluate.py listo; conteos top-1/top-5 y errores, sin porcentajes de acierto, Ensayo inicial con ocho candidatos: cosenos 0.36499119, 0.34008162, 0.32888782, T20 requiere consultas independientes etiquetadas del equipo

### Community 24 - "Diagnóstico de equipo equivocado"
Cohesion: 0.50
Nodes (4): Informe Windows inicial enumera solo Intel UHD; no acredita la MSI, Informe inicial: faltan nvidia-smi y libcuda en WSL, Diagnóstico identifica Dell Latitude 3410 con Intel UHD, Consulta PnP de estados de error sin coincidencias; no prueba avería

### Community 25 - "Imagen de referencia"
Cohesion: 0.67
Nodes (3): Computadora portátil sobre mesa redonda, Fotografía de una escena interior de trabajo, Silla amarilla y asientos grises

## Knowledge Gaps
- **73 isolated node(s):** `Luis móvil; Ángel web; Manuel backend, fuentes y documentación; Brandon IA y ranking`, `Imagen y selección → API → SAM → DINO → resultados → escena GLB`, `Computadora portátil sobre mesa redonda`, `Silla amarilla y asientos grises`, `DINOv2 ViT-S/14: inferencia sin gradientes y vectores finitos de norma unitaria` (+68 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 217 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `CpuSegmentationTest` connect `Pruebas de segmentación` to `Validación de errores`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **What connects `Luis móvil; Ángel web; Manuel backend, fuentes y documentación; Brandon IA y ranking`, `Imagen y selección → API → SAM → DINO → resultados → escena GLB`, `Computadora portátil sobre mesa redonda` to the rest of the system?**
  _73 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Flujo y demo local` be split into smaller, more focused modules?**
  _Cohesion score 0.08766803039158387 - nodes in this community are weakly interconnected._
- **Why does `validate_candidates()` connect `Contrato de candidatos` to `Flujo y demo local`, `Embeddings e índices`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Should `Embeddings e índices` be split into smaller, more focused modules?**
  _Cohesion score 0.08953418027828192 - nodes in this community are weakly interconnected._
- **Should `Dependencias de frontend` be split into smaller, more focused modules?**
  _Cohesion score 0.05580693815987934 - nodes in this community are weakly interconnected._
- **Should `Pruebas de inferencia` be split into smaller, more focused modules?**
  _Cohesion score 0.08585858585858586 - nodes in this community are weakly interconnected._

## Auditoría de actualización — 11 de noviembre de 2026

Actualización incremental de 77 archivos: 52 de código y 25 documentos completos. Se conservaron fuentes no modificadas. Grafo: 646 nodos, 1193 relaciones, 43 comunidades.

Los contadores de tokens de los agentes no están disponibles: los ceros del campo de uso son marcadores y no una medición de costo. No se estiman ahorros ni gasto.

Diagnóstico de extracción bruta: 198 relaciones con extremos no extraídos, 7 referencias externas, 2 autorreferencias y 22 relaciones con extremos repetidos en representación no dirigida. La resolución del constructor puede omitir o agrupar referencias; el mapa no acredita cobertura total de llamadas.

Dos archivos sin símbolos AST: frontend/src/searchControls.test.mjs y frontend/vite.config.ts; se conserva ese límite explícito. Los extremos del grafo final sí son válidos.

Graphify solo se publica en feature/ai-exploracion; excluir graphify-out/ de la rama preparada para integrar a main.
