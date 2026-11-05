# Graph Report - Asset-Finder  (2026-11-05)

## Corpus Check
- Corpus is ~8,882 words - fits in a single context window. You may not need a graph.

## Summary
- 155 nodes · 175 edges · 19 communities (10 shown, 9 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.93)
- Token cost: no disponible. Las herramientas de agentes no exponen usage; los ceros internos son marcadores, no consumo medido.

## Community Hubs (Navigation)
- Herramientas del frontend
- TypeScript de aplicación
- TypeScript de herramientas
- Interfaz React inicial
- Responsables y entorno GPU
- Flujo IA propuesto
- Contratos y tareas API
- Catálogo y escena GLB
- Comandos del frontend
- API de salud
- Fotografía de referencia
- Referencias TypeScript
- Entrada y documentación web
- Favicon del frontend
- Iconos de plantilla
- Ilustración de plantilla
- Logotipo de React
- Logotipo de Vite

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 18 edges
2. `compilerOptions` - 15 edges
3. `scripts` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Dependencias backend FastAPI y PyTorch CPU` --conceptually_related_to--> `Arquitectura servidor propuesta`  [INFERRED]
  backend/requirements.txt → Asset_Finder_Contexto_Claude_Equipo.md
- `Dependencias SAM fijadas a PyTorch CPU` --semantically_similar_to--> `Dependencias backend FastAPI y PyTorch CPU`  [INFERRED] [semantically similar]
  ai/requirements-sam2.txt → backend/requirements.txt
- `Medición CUDA pendiente` --conceptually_related_to--> `Dependencias SAM fijadas a PyTorch CPU`  [INFERRED]
  PLAN_EQUIPO.md → ai/requirements-sam2.txt

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Flujo visual previsto: seleccionar, segmentar, representar, buscar y colocar** — contratos_api_seleccion, asset_finder_contexto_claude_equipo_sam_2_1_tiny, asset_finder_contexto_claude_equipo_dinov2_vit_s_14, asset_finder_contexto_claude_equipo_ranking_por_asset, asset_finder_contexto_claude_equipo_escena_glb [EXTRACTED 1.00]

## Communities (19 total, 9 thin omitted)

### Community 0 - "Herramientas del frontend"
Cohesion: 0.10
Nodes (29): devDependencies, eslint@^10.13.0, @eslint/js@^10.0.1, eslint-plugin-react-hooks@^7.1.1, eslint-plugin-react-refresh@^0.5.7, globals@^17.13.0, @types/node@^24.19.2, @types/react@^19.3.0 (+21 more)

### Community 1 - "TypeScript de aplicación"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 2 - "TypeScript de herramientas"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 3 - "Interfaz React inicial"
Cohesion: 0.15
Nodes (10): dependencies, react@^19.3.1, react-dom@^19.3.1, tailwindcss@^4.3.4, @tailwindcss/vite@^4.3.4, App(), react, react-dom (+2 more)

### Community 4 - "Responsables y entorno GPU"
Cohesion: 0.18
Nodes (9): SAM editable con ruta absoluta local, Dependencias SAM fijadas a PyTorch CPU, Servidor previsto RTX 4070, 8 GB VRAM, Dependencias backend FastAPI y PyTorch CPU, Generación pendiente: 503 service_unavailable, Medición CUDA pendiente, P3 Manuel: backend y servidor, P4 Brandon: IA y catálogo (+1 more)

### Community 5 - "Flujo IA propuesto"
Cohesion: 0.22
Nodes (9): Arquitectura servidor propuesta, DINOv2 ViT-S/14: embedding previsto, Conflicto de importación SAM conocido, SAM 2.1 Tiny: segmentación, Prueba SAM en CPU documentada, Tailscale previsto para acceso privado, MVP propuesto de una semana, Interfaces IA previstas: segment, embed, search (+1 more)

### Community 6 - "Contratos y tareas API"
Cohesion: 0.25
Nodes (7): Asset Finder: flujo visual propuesto, Contratos API: borrador v0, Estados queued, running, completed, failed, Mocks por endpoint previstos, Segmentaciones y búsquedas como tareas, Selección en imagen normalizada, P1 Luis: móvil

### Community 8 - "Catálogo y escena GLB"
Cohesion: 0.33
Nodes (7): Indexación multivista propuesta, Escena GLB persistente propuesta, Ranking agrupado por asset, Contrato de escena e instancias, Disponibilidad real del asset, Catálogo previsto de 20–30 modelos, P2 Angel: web y escena

### Community 9 - "Comandos del frontend"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, preview

### Community 11 - "Fotografía de referencia"
Cohesion: 0.67
Nodes (3): Computadora portátil sobre mesa redonda, Fotografía de una escena interior de trabajo, Silla amarilla y asientos grises

## Knowledge Gaps
- **16 isolated node(s):** `P1 Luis: móvil`, `MVP propuesto de una semana`, `Tailscale previsto para acceso privado`, `Conflicto de importación SAM conocido`, `Escena GLB persistente propuesta` (+11 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 76 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **¿Cómo conecta el trabajo de Brandon en SAM/DINO con las tareas de la API y el catálogo 3D?**
  _Cruza las comunidades de responsables, flujo IA, contratos API y catálogo; es un flujo previsto, pendiente de implementación._
- **¿Qué separa la prueba SAM en CPU de la medición CUDA prevista?**
  _El plan pide CUDA y las dependencias actuales fijan PyTorch CPU; la relación se marca INFERRED._
- **¿Cómo determina model_available qué assets pueden colocarse en la escena?**
  _Une resultados de búsqueda, contrato de escena y trabajo de P2; el contrato es un borrador._
## Notas de exploración (Brandon / P4)

- Rol confirmado en PLAN_EQUIPO.md: P4, IA y catálogo; carpeta propia: ai/.
- Estado observado: prueba SAM con CPU y rectángulo fijo; backend con GET /health; frontend con plantilla React/Vite. No se encontró mobile/, implementación DINO ni índice del catálogo.
- El README registra una prueba SAM CPU anterior. En esta sesión solo pasó el análisis de sintaxis; python3 -P ai/prueba_sam2.py falla con ModuleNotFoundError: numpy. No están torch, Pillow, SAM, ai/sam2, sus pesos ni nvidia-smi en el entorno inspeccionado. No se instalaron dependencias.
- ai/requirements-sam2.txt fija PyTorch CPU e incluye una ruta editable absoluta /home/admon/projects/asset-finder/ai/sam2; debe revisarse antes de preparar CUDA.
- La imagen actual es una escena con varios objetos; no confirma la segmentación histórica de una silla. PNG/JPEG se inspeccionaron visualmente; SVG se interpretaron desde su fuente completa, sin renderizador disponible.
- Flujo previsto: selección → SAM → recorte RGB → DINO → similitud del catálogo → asset → escena. Las funciones segment, embed, search, el catálogo de 20–30 modelos y las simplificaciones de almacenamiento son propuestas, no implementaciones verificadas.
- SAM 3D sigue siendo investigación. Estado para integración: servicio no disponible.
- PLAN_EQUIPO.md y CONTRATOS_API.md están en la raíz; AGENTS.md referencia docs/. No se encontró docs/mocks/. Corresponde a P3 resolver ubicación y mocks sin cambios silenciosos.
- Git: rama feature/ai-exploracion, base local 84e9c9f. git fetch origin falló por falta de credenciales HTTPS; no se pudo verificar actualización contra el remoto ni efectuar el rebase posterior.
- Integridad: 12 aristas AST tienen destinos sin nodo explícito (imports/referencias, convertidos en nodos implícitos al construir); 1 autorreferencia. No hubo aristas colapsadas. El grafo es navegable, pero estas limitaciones deben considerarse al consultarlo. Detalle: graph-health.json.
- graphify-out/ se escribió en el árbol de trabajo y no está ignorado; aparecerá en git status. P3 puede agregar la regla o acordar cuáles artefactos compartir: https://docs.graphify.com/guides/team-workflows. No se modificó .gitignore ni código del producto.
- Tokens y costo monetario: no medidos; la herramienta de colaboración no expone contadores de uso. cost.json conserva ceros de marcador y token_usage_available=false; no representan una ejecución sin costo.

Los nodos centrales automáticos son opciones TypeScript y scripts de npm: reflejan que el repositorio aún contiene principalmente plantillas y configuración; no prueban una arquitectura funcional del producto. Las preguntas sugeridas se curaron para el rol P4 a partir de los puentes documentados.
