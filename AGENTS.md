Reglas de colaboración — Asset Finder
Contexto y referencias
Lee [el contexto](docs/CONTEXTO.md), [el plan](docs/PLAN_EQUIPO.md), [los contratos](docs/CONTRATOS_API.md) y [el estado](docs/ESTADO.md). Inspecciona el código antes de editar. La documentación describe planes y pruebas reportadas; no reemplaza verificar el comportamiento actual.

Objetivo: buscar modelos en páginas externas, comparar sus imágenes con Meta y devolver enlaces. No limitar el producto a una colección manual. No volver a introducir búsqueda de carpetas del usuario. La IA se ejecutará en el servidor.
Responsables
Área	Responsable	Archivos principales
Móvil	Luis	mobile/
Web y escena	Ángel	frontend/
Backend, servidor, fuentes externas y documentación compartida	Manuel	backend/, docs/, raíz
IA, preparación visual y ranking	Brandon	ai/


Cada persona trabaja en su área. Para cambios de otra área, coordina con el dueño o prepara un PR separado explicando el cambio. No reformatear ni actualizar dependencias ajenas sin necesidad.
Git
- Rama por tarea; no commits directos en main.
- Antes de integrar cambios remotos, revisa git status; no descartes trabajo sin autorización.
- PR pequeño con comportamiento, validación y limitaciones.
- Otro integrante revisa e integra; preferir squash según acuerdo del equipo.
- No hacer force push ni reescribir ramas compartidas sin coordinación.
- No subir secretos, .env, entornos, node_modules, pesos ni resultados grandes. Mantener lockfiles de cada área.