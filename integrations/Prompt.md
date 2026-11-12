# TAREA: Integración de Asset-Finder-3D con Blender

## 1. Contexto general del proyecto

Estoy desarrollando un proyecto llamado **Asset-Finder-3D**.

Repositorio:
https://github.com/bdiazsofttek-oss/Asset-Finder-3D

El objetivo general de Asset-Finder-3D es construir una aplicación que permita a los usuarios encontrar modelos 3D mediante búsqueda visual.

La idea del producto es que el usuario pueda subir una imagen, seleccionar un objeto dentro de ella y obtener resultados de modelos 3D visualmente similares, procedentes de fuentes externas o catálogos compatibles.

A futuro, queremos que los usuarios también puedan visualizar modelos 3D, utilizarlos en escenas y enviarlos a programas de diseño instalados en sus computadoras.

Actualmente quiero comenzar a desarrollar esta última funcionalidad, empezando exclusivamente con **Blender**.

No quiero implementar todavía SolidWorks, AutoCAD ni un servidor MCP.

---

## 2. Arquitectura actual

El proyecto se divide en varias áreas:

### Frontend
Ubicación: `frontend/`

Tecnologías:
- React
- TypeScript
- Vite
- Three.js
- Tailwind CSS

Responsable: Ángel.

Funcionalidades existentes o previstas:
- Interfaz web.
- Subida de imágenes.
- Selección visual de objetos.
- Presentación de resultados de búsqueda.
- Visualización 3D.
- Catálogo y escenas.

Archivos de referencia conocidos:
- `frontend/src/App.tsx`
- `frontend/src/VisualSearch.tsx`
- `frontend/vite.config.ts`

### Backend
Ubicación: `backend/`

Tecnología principal:
- Python
- FastAPI

Responsable: Manuel.

Funciones existentes o previstas:
- Recibir imágenes.
- Administrar referencias.
- Consultar fuentes externas.
- Proporcionar resultados de búsqueda.
- Gestionar acceso a archivos y metadatos de assets.

El backend tiene endpoints implementados y otros únicamente propuestos. Verifica su estado actual; no supongas que todos están disponibles.

### Inteligencia artificial
Ubicación: `ai/`

Responsable: Brandon (yo).

Tecnologías:
- Python
- PyTorch
- SAM 2.1
- DINOv2

Objetivos:
- Segmentar objetos seleccionados en imágenes.
- Generar representaciones visuales.
- Comparar imágenes mediante embeddings.
- Ordenar candidatos según similitud visual.

La IA se ejecuta del lado del servidor.

### Documentación y contratos

Consulta los archivos existentes, especialmente:
- `README.md`
- `AGENTS.md`
- `PLAN_EQUIPO.md`
- `PLAN_P4.md`
- `CONTRATOS_API.md`
- `Asset_Finder_Contexto_Claude_Equipo.md`

No asumas que la documentación está completamente actualizada. El código y las pruebas verificadas tienen prioridad para determinar qué funciona.

---

## 3. Responsabilidades del equipo

El proyecto está dividido entre diferentes integrantes.

- Ángel: frontend y visualización 3D.
- Manuel: backend, API, servidor y conexiones externas.
- Brandon: IA, preparación visual y ranking.
- Otros integrantes tienen sus responsabilidades definidas en la documentación.

Yo soy Brandon.

Además de mi responsabilidad actual sobre IA, quiero proponer y desarrollar una nueva área independiente para integraciones con software de escritorio.

La nueva carpeta sugerida es:

`integrations/blender/`

En el futuro podría existir:

`integrations/solidworks/`
`integrations/autocad/`

Por ahora, únicamente trabajaremos en Blender.

IMPORTANTE:
- No modificar el trabajo de otros integrantes sin necesidad.
- Respetar `AGENTS.md` y la organización actual.
- Considerar la propiedad de `integrations/` como una propuesta pendiente de aprobación del equipo.
- No actualizar documentación compartida ni asignar responsabilidades unilateralmente.
- Si se requieren cambios en frontend o backend, documentarlos como propuestas para sus responsables.
- No hacer commits, push, merges ni Pull Requests automáticamente.

---

## 4. Nueva funcionalidad que quiero desarrollar

### Nombre
Asset-Finder Blender Integration

### Objetivo final

Quiero que un usuario pueda:

1. Abrir Asset-Finder-3D desde su navegador.
2. Buscar un modelo 3D utilizando la aplicación.
3. Seleccionar uno de los resultados.
4. Hacer clic en un botón llamado "Abrir en Blender".
5. Conectar la página con Blender instalado en su computadora.
6. Importar el modelo seleccionado a la escena abierta de Blender.
7. Continuar trabajando con ese modelo dentro de Blender.

La experiencia ideal sería que el usuario no tenga que descargar manualmente el archivo, buscarlo en su carpeta de descargas e importarlo por su cuenta.

Quiero que ese proceso se pueda automatizar mediante una integración segura.

### Arquitectura objetivo

Asset-Finder Web
→ Identificación del modelo seleccionado
→ Conector local en la computadora
→ Add-on de Blender
→ Importación a la escena activa

El backend de Asset-Finder debe proporcionar los archivos y autorizaciones necesarios cuando integremos la funcionalidad completa.

No quiero que la web ejecute comandos arbitrarios en la computadora del usuario.

---

## 5. Decisiones tecnológicas iniciales

Quiero estudiar y, si es apropiado, implementar:

**Add-on de Blender con Python**

Usar la API oficial de Blender, `bpy`, para importar modelos.

**Conector local**

Un pequeño componente que permita recibir solicitudes autorizadas desde la página web.

Podría utilizar Python y HTTP local, pero primero evalúa qué arquitectura es más sencilla, segura y mantenible.

**Comunicación**

Considerar HTTP REST o WebSockets según las necesidades reales.

No utilizar MCP por ahora, porque la interacción será entre la web y Blender, no entre un agente de IA y Blender.

**Formatos**

Comenzar con:
- `.glb`
- `.gltf`, cuando sus recursos asociados estén disponibles.

Posteriormente podríamos estudiar OBJ, FBX, STL y formatos adicionales.

No es necesario implementar conversión CAD en esta etapa.

---

## 6. Primera implementación: MVP local

No intentes desarrollar toda la integración de una sola vez.

Quiero comenzar con una primera versión mínima funcional e independiente del resto del proyecto.

### Fase 1 — Inspección

Antes de escribir código:

1. Examina la estructura real del repositorio.
2. Lee la documentación relevante.
3. Comprueba el estado de Git y la rama actual.
4. Identifica las convenciones de código existentes.
5. Verifica si ya existe algún código relacionado con Blender.
6. Comprueba cómo se manejan actualmente los modelos y sus URLs.
7. Explica qué partes podemos reutilizar.

No reemplaces funcionalidades existentes.

### Fase 2 — Organización

Propón crear:

```text
integrations/
└── blender/
    ├── addon.py
    ├── test_import.py
    └── README.md
```

Puedes ajustar esta estructura si hay razones técnicas claras, pero explica por qué.

Trabaja en una rama llamada:

`feature/blender-integration`

Si la rama ya existe, comprueba primero su estado.

No cambies de rama si existen modificaciones locales que puedan perderse.

### Fase 3 — Prueba de importación

Implementa una prueba sencilla usando `bpy`.

Objetivo:

Importar un archivo GLB local a una escena de Blender.

El script debe:
- Recibir la ruta del archivo como argumento o configuración.
- Validar que el archivo exista.
- Validar su extensión.
- Utilizar la API de Blender para importarlo.
- Informar si la importación fue exitosa.
- Manejar errores comunes.
- Evitar borrar objetos existentes.
- Evitar ejecutar instrucciones externas no confiables.

No debe depender del frontend ni del backend.

Si no existe un GLB adecuado en el repositorio, documenta cómo proporcionar un archivo de prueba sin agregar recursos pesados a Git.

### Fase 4 — Add-on inicial

Una vez que la importación funcione, crea un add-on básico de Blender.

El add-on debe:
- Ser compatible con una versión de Blender claramente documentada.
- Permitir seleccionar un GLB local.
- Importarlo a la escena activa.
- Informar errores y resultados al usuario.
- Mantener el código organizado para una futura conexión externa.

No es obligatorio crear todavía un servidor HTTP dentro del add-on.

En esta primera entrega, prioriza una importación local estable sobre la conectividad de red.

### Fase 5 — Diseño del conector futuro

Prepara una propuesta técnica, sin implementar todavía toda la comunicación entre navegador y Blender.

Analiza:
- Cómo detectar que Blender está disponible.
- Cómo manejar la conexión local.
- Cómo solicitar autorización al usuario.
- Cómo comunicar el conector con el add-on.
- Cómo descargar modelos autorizados.
- Cómo evitar que una página maliciosa controle Blender.
- Cómo evitar problemas de CORS y restricciones de acceso a redes locales.
- Cómo ejecutar operaciones `bpy` en el hilo principal de Blender.
- Cómo recuperar mensajes de éxito y error.

El conector futuro debe considerar:
- Escuchar exclusivamente en `127.0.0.1`.
- Autorización explícita del usuario.
- Restricciones estrictas de origen.
- Validación de archivos.
- Límites de tamaño.
- Verificación de integridad.
- Protección frente a solicitudes arbitrarias.
- No ejecutar código Python recibido desde la web.
- No aceptar rutas o URLs arbitrarias sin validación.

Esta fase debe producir documentación de diseño, no un sistema complejo sin probar.

---

## 7. Integración futura con Asset-Finder

En una fase posterior quiero coordinar con Ángel y Manuel la conexión completa.

El frontend deberá permitir seleccionar un resultado e indicar que se desea abrir en Blender.

El backend deberá proporcionar información confiable sobre el modelo.

En `CONTRATOS_API.md` existen conceptos como:

- `asset_id`
- `model_available`
- `model_url`
- `format`
- `license`

Verifica cuáles están implementados realmente.

No asumas que una miniatura o un enlace a Sketchfab equivalen a disponer de un archivo GLB descargable.

No intentes evitar restricciones de descarga ni licencias de las plataformas externas.

Si el modelo no está disponible legal o técnicamente para importar, la opción deberá deshabilitarse o presentar un mensaje adecuado.

---

## 8. Seguridad y calidad

Quiero que la solución siga buenas prácticas de desarrollo.

Requisitos:
- Código modular.
- Funciones con responsabilidades claras.
- Manejo de errores.
- Validación de entradas.
- Documentación comprensible.
- Dependencias mínimas.
- Sin credenciales en el código.
- Sin archivos pesados en Git.
- Sin servicios de red expuestos públicamente.
- Sin ejecutar código remoto arbitrario.
- Sin modificar archivos existentes de otros módulos innecesariamente.

No agregues librerías externas si la API estándar de Blender es suficiente.

Si una función puede implementarse directamente mediante `bpy`, priorízala.

---

## 9. Pruebas y validación

Quiero que compruebes lo que sea posible en el entorno disponible.

Debes distinguir entre:

1. Pruebas automatizadas que realmente ejecutaste.
2. Validaciones estáticas del código.
3. Pruebas que requieren una instalación real de Blender.
4. Funcionalidades todavía pendientes.

No afirmes que una integración funciona si no se ha ejecutado contra Blender.

Documenta los pasos manuales para probarla en Windows.

Incluye:
- Requisitos de Blender.
- Instalación del add-on.
- Cómo habilitarlo.
- Cómo seleccionar un GLB.
- Cómo importarlo.
- Cómo comprobar el resultado.
- Cómo interpretar errores frecuentes.

No instales programas globales, no cambies configuraciones del sistema y no descargues archivos externos sin autorización.

---

## 10. Cómo quiero que me expliques los cambios

Mi nivel es principiante/intermedio.

Tengo conocimientos básicos de Python, JavaScript, React, Git y estructura de proyectos, pero todavía estoy aprendiendo.

Por favor:

- Explica de lo general a lo particular.
- No supongas que conozco la API de Blender.
- Explica qué es un add-on.
- Explica qué hace `bpy`.
- Explica cómo Blender ejecuta Python.
- Distingue entre un script independiente, un add-on y un conector local.
- Indica para qué sirve cada archivo.
- Proporciona comandos compatibles con Windows PowerShell cuando corresponda.
- Evita introducir complejidad innecesaria.

Quiero entender lo que estás construyendo, no simplemente recibir código.

---

## 11. Entregables esperados

Al terminar esta primera tarea quiero tener:

1. Una nueva estructura independiente en `integrations/blender/`.
2. Un script que importe un GLB local.
3. Un add-on mínimo que permita importar el modelo desde Blender.
4. Un README con instrucciones de instalación y prueba.
5. Una explicación de los archivos creados.
6. Un resumen de las pruebas realmente ejecutadas.
7. Una lista de limitaciones actuales.
8. Una propuesta para la siguiente fase: conexión con la aplicación web.

No quiero todavía una integración con SolidWorks, AutoCAD ni MCP.

No quiero cambios en `frontend/`, `backend/` o `ai/` durante esta primera implementación.

---

## 12. Forma de trabajo

Primero inspecciona el repositorio y presenta un diagnóstico breve de lo que encontraste.

Después implementa únicamente el MVP descrito.

Antes de modificar archivos, explica qué archivos vas a crear o cambiar.

No elimines funcionalidades existentes.

No cambies dependencias de otros módulos.

No hagas commits ni push automáticamente.

Cuando termines, proporciona:

**A.** Qué implementaste.

**B.** Archivos creados.

**C.** Cómo funciona la importación.

**D.** Cómo ejecutar las pruebas.

**E.** Qué falta para conectar Asset-Finder con Blender.

**F.** Qué cambios deberán coordinarse posteriormente con los responsables del frontend y backend.

El objetivo de esta tarea es conseguir una base sólida, funcional, mantenible y comprensible para la futura integración de Asset-Finder-3D con Blender.