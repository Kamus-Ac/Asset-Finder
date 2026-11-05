# Asset Finder

Buscador visual de assets 3D en archivos locales y catálogos web.

## Mapa del proyecto

Esta es la estructura actual. Los comentarios explican para qué sirve cada parte.
No se muestran metadatos de Git ni archivos auxiliares `:Zone.Identifier` de Windows.

```text
Asset-Finder/
│
├── README.md                         ← Empieza aquí: mapa y estado del proyecto
├── AGENTS.md                         ← Reglas de trabajo y propiedad de carpetas
├── PLAN_EQUIPO.md                    ← Roles, tareas y calendario del equipo
├── PLAN_P4.md                        ← Alcance personal de Brandon: qué entregar
├── CONTRATOS_API.md                  ← Borrador de comunicación entre clientes y servidor
├── Asset_Finder_Contexto_Claude_Equipo.md
│                                    ← Contexto amplio, decisiones y arquitectura propuesta
├── .gitignore                       ← Archivos locales que no deben subirse a Git
│
├── ai/                              ← P4 · Brandon: IA y catálogo
│   ├── README.md                     ← Comparación de carpetas y prueba CPU local
│   ├── PLAN_P4_IA.md                 ← Etapas, checklist de avance y siguiente tarea
│   ├── PROPUESTA_ENTORNO.md          ← Versiones CUDA propuestas para el servidor WSL
│   ├── MEDICIONES.md                 ← Resultados observados y límites de las pruebas
│   ├── prueba_sam2.py                ← Prueba de segmentación con SAM en CPU
│   ├── prueba.jpeg                   ← Imagen de entrada de la prueba
│   └── requirements-sam2.txt         ← Dependencias registradas del entorno SAM
│
├── backend/                         ← P3 · Manuel: API y servidor
│   ├── main.py                      ← Aplicación FastAPI; contiene GET /health
│   └── requirements.txt             ← Dependencias registradas del backend
│
├── frontend/                        ← P2 · Angel: web y futura escena 3D
│   ├── src/
│   │   ├── main.tsx                 ← Monta React en el HTML
│   │   ├── App.tsx                  ← Componente principal; aún es la plantilla inicial
│   │   ├── App.css                  ← Estilos del componente principal
│   │   ├── index.css                ← Estilos generales
│   │   └── assets/                  ← Imágenes y logotipos importados por React
│   ├── public/                      ← Archivos públicos: favicon e iconos SVG
│   ├── index.html                   ← HTML base; carga src/main.tsx
│   ├── package.json                 ← Dependencias y comandos dev, build, lint, preview
│   ├── package-lock.json            ← Versiones resueltas de las dependencias npm
│   ├── vite.config.ts               ← Configuración de Vite y su plugin React
│   ├── tsconfig*.json               ← Configuración de TypeScript
│   ├── eslint.config.js             ← Reglas de revisión del código
│   ├── .gitignore                   ← Exclusiones de Git específicas del frontend
│   └── README.md                    ← Documentación de la plantilla React/Vite
│
└── graphify-out/                     ← Mapa generado localmente; no ejecuta la aplicación
    ├── graph.html                   ← Grafo interactivo para abrir en el navegador
    ├── graph.json                   ← Datos del grafo
    └── GRAPH_REPORT.md              ← Informe de exploración y limitaciones
```

El árbol de `graphify-out/` muestra solo sus tres archivos principales. Es una
salida de análisis local y puede no existir en otra copia del repositorio.

## Cómo se conectarán las partes

Este es el flujo previsto; todavía no está integrado de extremo a extremo.
La IA se ejecutará en el servidor, nunca en el teléfono ni en el navegador.

```text
Usuario → móvil o web: imagen y selección    [clientes pendientes de integrar]
│
└── API del servidor · backend/              [actualmente solo /health]
    │
    ├── Recibir imagen y selección           [pendiente]
    ├── Ejecutar el procesamiento · ai/
    │   ├── SAM → máscara del objeto         [hay una prueba independiente en CPU]
    │   ├── DINO → vector visual             [pendiente]
    │   └── Búsqueda → assets similares      [pendiente]
    └── Devolver resultados y guardar proyecto/escena [pendiente]
        │
        └── Web: colocar modelos GLB en una escena   [pendiente]
```

Una **máscara** indica qué píxeles pertenecen al objeto. Un **embedding** es un
vector numérico que representa su apariencia para compararla con el catálogo.
El catálogo tendrá vistas de modelos 3D procesadas previamente con DINO; DINO
compara imágenes, no lee directamente la geometría de un archivo GLB.

Los endpoints y formatos se acuerdan en [CONTRATOS_API.md](CONTRATOS_API.md).
`mobile/` y `docs/mocks/` aún no están presentes. Los documentos del equipo están
actualmente en la raíz, aunque algunas instrucciones todavía los referencian
bajo `docs/`.

## Por dónde empezar a leer

1. [AGENTS.md](AGENTS.md): qué puedes modificar y cómo trabajar sin conflictos.
2. [PLAN_EQUIPO.md](PLAN_EQUIPO.md): tu rol y las tareas previstas para cada día.
3. [CONTRATOS_API.md](CONTRATOS_API.md): qué datos intercambiarán las áreas.
4. El código de tu área: para **Brandon / P4**, empieza por
   [ai/prueba_sam2.py](ai/prueba_sam2.py). Lee la carga de imagen, el rectángulo,
   la predicción y el guardado de máscara/recorte. Sigue las tareas y su avance
   en [ai/PLAN_P4_IA.md](ai/PLAN_P4_IA.md).
5. [Contexto completo](Asset_Finder_Contexto_Claude_Equipo.md): consulta el diseño
   amplio y los antecedentes cuando necesites más detalle. El plan del equipo
   distingue el alcance de una semana del roadmap original de seis semanas.

Para ubicar los otros puntos de entrada: `backend/main.py` define la API y
`frontend/index.html → src/main.tsx → src/App.tsx` inicia la interfaz web.

## Tecnologías

Stack previsto; no todas las piezas están integradas. SQLite y NumPy para la
búsqueda forman parte de las simplificaciones recomendadas en el plan.

- React, TypeScript y Vite
- Tailwind CSS
- Python y FastAPI
- PyTorch
- SAM 2.1 Tiny
- DINOv2
- Blender y FFmpeg
- SQLite y NumPy

## Estado

SAM 2.1 Tiny probado para segmentar imágenes en CPU.
Indexación y búsqueda visual en desarrollo.

La prueba CPU usa el entorno propio `ai/.venv-sam2`, sin depender de la carpeta
antigua. Comando y resultados en
[ai/README.md](ai/README.md) y [ai/MEDICIONES.md](ai/MEDICIONES.md).
El entorno CUDA del servidor de Angel en Ubuntu/WSL sigue pendiente.
El script usa un rectángulo fijo y guarda
`mascara.png`, `silla_transparente.png` y `seleccion.png` dentro de `ai/`.
La selección actual toma fondo/pared; falta validar la selección del objeto.
Las funciones reutilizables `segment`, `embed` y `search` siguen pendientes.

CUDA, catálogo indexado, conexión Tailscale y flujo completo requieren validación.
SAM 3D es solo investigación: **servicio no disponible** para la integración.

## Entorno

Windows con Ubuntu mediante WSL2.
Python 3.11 y Node.js LTS.

Los entornos virtuales, pesos de modelos y datos locales
se instalan por separado y no están incluidos en el repositorio.

`ai/requirements-sam2.txt` registra PyTorch para CPU; su ruta editable `./sam2`
se resuelve desde `ai/`. Hay que revisar ese entorno antes de preparar CUDA.
El código externo SAM y sus pesos están disponibles localmente en `ai/sam2/`,
ignorados por Git; no se incluyen al clonar el proyecto.
