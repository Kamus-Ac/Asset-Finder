# Pendientes para completar Asset Finder

**Objetivo:** que una persona abra Blender y Asset Finder Web, busque un modelo
por texto y/o imagen, compare resultados y envíe un modelo 3D compatible
directamente a Blender con confirmación clara y sin pasos técnicos innecesarios.

**Estado de este documento:** plan de integración; las tareas no se consideran
hechas por estar descritas. Confirmar cada resultado con pruebas y coordinar los
cambios entre responsables antes de integrar.

## Alcance del producto

El resultado buscado es un flujo de **búsqueda y descarga de modelos 3D ya
existentes**. La IA usa la imagen de referencia para localizar y ordenar assets;
no convierte automáticamente la foto en geometría ni genera un modelo 3D.
La generación/reconstrucción 3D permanece fuera del MVP.

Flujo final:

1. Abrir Blender y dejar activa la integración de Asset Finder.
2. Abrir la web, elegir una imagen, seleccionar el objeto y describirlo con
   texto opcional.
3. Buscar en fuentes autorizadas y mostrar resultados con miniatura, similitud,
   fuente, licencia y disponibilidad real del archivo 3D.
4. Elegir un resultado que tenga un GLB permitido y compatible.
5. Solicitar su envío a Blender. La web y el add-on muestran el mismo asset,
   destino, tamaño y estado; Blender pide confirmación.
6. Descargar/verificar/importar el GLB en la escena sin borrar objetos previos.
   Informar éxito o error y permitir deshacer. No informar éxito antes de que
   Blender confirme la importación.

## Qué ya existe (verificado en el código)

- **IA local CPU:** la demo aislada ejecuta selección → SAM → recorte → DINOv2
  → ranking de miniaturas candidatas. SAM/DINO no inspeccionan geometría GLB.
- **Búsqueda de fuentes:** el backend implementa búsqueda textual con Sketchfab
  y Poly Haven; descarga miniaturas permitidas y las compara con DINO.
- **Web oficial:** React permite subir imagen, dibujar una selección, describir
  el objeto, elegir esas fuentes y consultar el estado de una búsqueda.
- **API:** existen `/health`, `/catalog/search`, `/media`, `/segmentations`,
  `/searches`, `/tasks` y artefactos de resultados. La búsqueda visual usa tareas
  y el backend corre SAM/DINO en el servidor cuando los recursos están listos.
- **Blender:** el add-on importa GLB 2 autocontenidos de hasta 100 MiB, conserva
  objetos existentes y pide confirmación para solicitudes del conector local.
- **Conector de demostración:** la demo IA aislada puede pedir a Blender que
  importe un GLB que el usuario seleccionó manualmente en Blender. Usa un
  proceso separado, loopback, token temporal y confirmación local. No obtiene el
  modelo desde un resultado de búsqueda ni desde el backend.
- **Pruebas reportadas:** importación y ciclo de conexión comprobados en Blender
  5.0.1/Linux. En la instalación WSL/Blender usada durante la prueba, el
  importador glTF necesitó NumPy en el Python de Blender. Añadir una ruta de
  `/tmp` manualmente permitió probarlo, pero no es una instalación persistente ni
  portátil.

## Bloqueadores principales

1. **Los resultados no tienen todavía modelos descargables.** Sketchfab y
   Poly Haven hoy publican `model_available: false`, `model_url: null` y formato
   no confirmado. Una miniatura, página web o URL de visor no demuestra que
   exista un GLB disponible ni que su licencia permita descargarlo.
2. **No existe un contrato de entrega segura de GLB** entre backend, web y
   conector de Blender.
3. **La web React oficial no está conectada al conector local.** El prototipo
   vive en la demo IA aislada (`ai/web`); falta elegir un resultado en la UI
   oficial y pedir que ese resultado, no un archivo elegido aparte, se importe.
4. **Falta instalar/validar NumPy de manera repetible** en Blender de Windows y
   Linux/WSL. No se debe depender de una ruta temporal bajo `/tmp`.
5. **Las fuentes sugeridas necesitan adaptación, verificación de uso y
   pruebas reales.** No deben tratarse como servicios de descarga universales.

## Fuentes sugeridas y cómo incorporarlas

### Khronos glTF Sample Assets

URL propuesta:

`https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/model-index.json`

- Es un **índice de modelos de muestra de Khronos**, útil para ejemplos,
  pruebas de importación, fixtures de formato y una fuente curada pequeña.
  No es un motor de búsqueda de modelos generales ni un catálogo comercial.
- Leer el índice en el servidor, validar su forma y seleccionar solo entradas
  con variante `glTF-Binary` (`.glb`) compatible.
- Construir las descargas a partir del repositorio/ruta esperados y una revisión
  fijada o conocida; no aceptar URLs arbitrarias proporcionadas por cliente o
  por datos externos sin validación.
- Conservar el nombre, página de origen y datos de licencia/atribución que
  acompañen al modelo. Verificar los términos del repositorio y de cada asset
  antes de redistribuir o almacenar archivos.
- Usar esta fuente primero para una prueba vertical reproducible: listar el
  asset, mostrar metadatos, descargarlo en el backend, verificarlo y enviarlo a
  Blender. No presentarla como prueba de cobertura de búsquedas reales.

### Hugging Face `codepawl/objaverse-clean-glb`

URL propuesta para investigar:

`https://datasets-server.huggingface.co/search?dataset=codepawl/objaverse-clean-glb&config=default&split=train&query=dog`

- Es una posible fuente de metadatos/datos del dataset Objaverse; antes de
  integrarla hay que comprobar respuesta actual, esquema de filas, paginación,
  límites del servicio, disponibilidad de los GLB y método oficial de acceso a
  los archivos.
- La consulta `query=dog` no quedó validada durante la preparación de este plan:
  el endpoint devolvió error HTTP 500 en esta revisión. Implementar manejo de
  error, reintentos limitados y aviso de fuente no disponible; no asumir que
  ese endpoint está estable o que devuelve un GLB directamente.
- Identificar por asset el origen, autor, licencia, atribución, URL canónica,
  tamaño y formato. Objaverse no significa que todos los modelos compartan
  licencia ni que todo asset se pueda redistribuir.
- Preferir un adaptador de servidor que consulte metadatos y entregue referencias
  verificadas. No hacer que el navegador o Blender descarguen URLs sin validar.
- Probar una muestra pequeña primero y decidir si la licencia, calidad,
  privacidad, disponibilidad y rendimiento son adecuados para el producto.

### Contrato común de fuente

Cada adaptador externo debe producir un registro normalizado y honesto:

```json
{
  "asset_id": "provider:stable-id",
  "name": "Nombre del modelo",
  "source": "provider",
  "source_url": "https://...",
  "thumbnail_url": "https://...",
  "license": "licencia reportada o null",
  "attribution": "autor/crédito o null",
  "format": "glb o null",
  "model_available": false,
  "model_size_bytes": null,
  "model_sha256": null,
  "similarity_score": null
}
```

`model_available` solo pasa a `true` después de confirmar archivo, permisos,
formato y acceso. Un score de DINO ordena apariencias de imágenes; no es una
probabilidad ni una medida de similitud geométrica.

## Plan de trabajo por fases

### Fase 0 — Acordar alcance y contratos

- [ ] Confirmar que el MVP significa buscar/importar modelos existentes, no
  reconstruirlos desde una foto.
- [ ] Acordar fuentes permitidas, licencias, redistribución, atribución,
  retención de archivos y límites de descarga.
- [ ] Confirmar el flujo de búsqueda: texto obligatorio, imagen obligatoria o
  texto + imagen opcionales; definir comportamiento si no hay selección.
- [ ] Acordar formato inicial GLB 2, tamaño máximo, timeout, número de descargas
  simultáneas y versiones de Blender soportadas.
- [ ] Extender por PR el contrato y actualizar mocks/documentación de API. No
  crear endpoints incompatibles solo para el add-on.
- [ ] Definir modo de despliegue: demo local, servidor privado del equipo o web
  pública. Orígenes, CORS, acceso a red local, autenticación y almacenamiento
  dependen de esa decisión.

**Criterio de salida:** contratos revisados por frontend, backend, IA y
responsable de Blender; cada proveedor tiene política de uso clara.

### Fase 1 — Probar fuentes y obtener GLB autorizados en servidor

- [ ] Crear adaptadores backend separados para Khronos, Hugging Face/Objaverse
  y las fuentes actuales.
- [ ] Verificar en pruebas de red controladas la respuesta real, paginación,
  errores, metadatos y descarga de cada fuente.
- [ ] Para Hugging Face, resolver el HTTP 500 observado y validar si el endpoint
  de búsqueda es el adecuado o si debe usarse la API/archivos oficiales del
  dataset.
- [ ] Implementar búsquedas con texto en todas las fuentes aprobadas; normalizar
  candidatos, deduplicar IDs y conservar atribución/licencia.
- [ ] Determinar si cada fuente entrega GLB directamente, ofrece descarga
  permitida o solo indexa metadatos. Si no hay archivo permitido, mantener
  `model_available: false` y ofrecer el enlace de origen.
- [ ] Implementar descarga **solo en servidor** desde hosts aprobados: HTTPS,
  rechazo de hosts privados, control de redirecciones en cada salto, timeout,
  límite de bytes durante streaming y límites de concurrencia.
- [ ] No aceptar URL de archivo arbitraria desde la web, prompt, proveedor o
  Blender. Resolver cada descarga a partir de un ID y política de fuente
  conocidos para reducir SSRF y abusos.
- [ ] Guardar de forma temporal/administrada; verificar tamaño, SHA-256 cuando
  exista descriptor confiable, cabecera GLB 2, URI autocontenidas y límite de
  100 MiB. Limpiar temporales tras éxito, error y expiración.
- [ ] Registrar el motivo explícito cuando un candidato no se puede descargar,
  la licencia no se conoce o el formato no sirve.

**Criterio de salida:** al menos un proveedor aprobado produce un asset real con
GLB verificable, licencia/atribución identificadas, tamaño y hash; los otros
proveedores fallidos no rompen la búsqueda.

### Fase 2 — Completar búsqueda y resultados en la web oficial

- [ ] Integrar la selección de resultado (tarjeta/teclado accesible) y mostrar
  nombre, miniatura, proveedor, enlace de origen, licencia/atribución, similitud
  y disponibilidad real.
- [ ] Diferenciar “enlace a la página del proveedor” de “modelo descargable e
  importable”.
- [ ] Habilitar **Enviar a Blender** solo si el modelo cumple formato, permiso
  y disponibilidad; explicar por qué está deshabilitado en los demás casos.
- [ ] Conservar estados de tarea de búsqueda y comunicar errores/avisos parciales
  por fuente sin borrar resultados válidos.
- [ ] Permitir búsqueda por texto sin imagen y por imagen con selección si el
  contrato de producto lo confirma; mantener búsqueda visual como ranking
  separado de la búsqueda textual.
- [ ] Consolidar UI: la demo aislada de IA es herramienta de desarrollo. Llevar
  el flujo de envío a la web React oficial y no confundirlo con su prototipo
  local.
- [ ] Probar frontend con backend, fuentes desconectadas, cero resultados,
  miniatura rota y resultados sin GLB.

**Criterio de salida:** desde la web oficial se encuentra y selecciona un
candidato real; la información de derechos/descarga coincide con el servidor.

### Fase 3 — Contrato de entrega y conector local seguro

- [ ] Añadir al backend una operación de entrega autorizada ligada a `asset_id`,
  caducidad y usuario/sesión; emitir un ticket temporal y de un solo uso, no una
  URL arbitraria de descarga para el navegador.
- [ ] Definir respuesta/estados de importación: `queued`, `downloading`,
  `awaiting_confirmation`, `importing`, `completed`, `failed`, `cancelled`;
  incluir mensajes seguros y un ID diagnóstico.
- [ ] La web envía al conector local el ticket, `asset_id` y clave idempotente.
  El conector canjea el ticket contra el backend configurado y confiable.
- [ ] Conservar las defensas existentes: escuchar solo en `127.0.0.1`, validar
  `Host` y `Origin`, token de sesión, JSON estricto, cola acotada, expiración,
  confirmación en Blender y ausencia de rutas/comandos recibidos del navegador.
- [ ] Extender la allowlist y reglas de redirección para las fuentes aprobadas;
  no reenviar credenciales a hosts de descarga ni permitir destinos privados.
- [ ] Verificar la descarga y el hash según descriptor confiable antes de pasar
  el archivo al add-on; Blender vuelve a validar GLB antes de importar.
- [ ] Evitar importaciones duplicadas con idempotencia. No reintentar
  automáticamente un fallo que pudo dejar datos parciales en la escena.
- [ ] Revocar el ticket/sesión al cerrar Blender, add-on o web; retirar tareas
  y temporizadores, cerrar el proceso local y borrar archivos temporales.
- [ ] Limitar y sanitizar logs: nunca registrar token, URL firmada completa,
  credenciales ni rutas privadas.

**Criterio de salida:** un ticket vencido, repetido, alterado o de otro asset no
permite descarga/importación; solo se informa `completed` tras importación real.

### Fase 4 — Integrar la web oficial con Blender

- [ ] Adaptar el conector existente de `integrations/blender/` para obtener el
  archivo desde el backend autorizado; quitar el requisito de seleccionar un
  GLB local aparte en el flujo normal. Mantener el importador local como modo
  de prueba/recuperación si el equipo lo desea.
- [ ] En la web, probar y explicar el enlace a loopback y los permisos de red
  local de los navegadores objetivo. CORS por sí solo no prueba que funcione.
- [ ] Crear UX de estados: Blender no instalado/abierto, add-on desactivado,
  conector apagado, token vencido, esperando confirmación, importando, éxito,
  rechazo, error y reintento seguro.
- [ ] Antes de confirmar, mostrar en Blender y web el mismo nombre, proveedor,
  licencia, tamaño y escena destino. La confirmación final ocurre en Blender.
- [ ] Mostrar cómo recuperar el flujo si se pierde la conexión y advertir que
  se revise la escena antes de reintentar.
- [ ] Conservar importación manual por ZIP/selector como alternativa.

**Criterio de salida:** seleccionar “Enviar a Blender” desde un resultado web
importa exactamente ese asset, con confirmación visible y resultado verificable.

### Fase 5 — Instalación fiable de Blender y experiencia de uso

- [ ] Resolver NumPy para el Python incluido en Blender de forma soportada y
  persistente en Windows y Linux/WSL. No depender de `sys.path` manual a una
  carpeta temporal ni del entorno Python de IA.
- [ ] Documentar instalación/actualización limpia del ZIP, activación,
  desinstalación y recuperación de versiones previas. La migración 0.1.0 a 0.2.0
  ya mostró que Blender puede conservar rutas antiguas hasta reiniciar.
- [ ] Validar el empaquetado con rutas que incluyen espacios y perfiles limpios.
- [ ] Probar mínimo Blender 5.0.x en Windows nativo y Linux/WSL, con versiones
  de Python/NumPy que realmente usa cada distribución.
- [ ] Revisar el GLB en escenas con objetos previos, materiales/texturas,
  transforms, nombres duplicados, objetos múltiples y archivos grandes; definir
  qué extensiones glTF quedan fuera.
- [ ] Dar instrucciones concretas para encuadrar, deshacer, cancelar y cerrar la
  sesión sin alterar archivos `.blend` del usuario.

**Criterio de salida:** una persona nueva instala desde cero y completa el
recorrido en Windows y Linux sin editar rutas Python manualmente ni perder la
escena previa.

### Fase 6 — Pruebas de extremo a extremo, operación y lanzamiento

- [ ] Pruebas unitarias de adaptadores para metadatos válidos/malformados,
  paginación, límites y errores de API.
- [ ] Pruebas de descarga segura: archivo > límite, respuesta lenta, redirect a
  host no autorizado, IP privada, hash incorrecto, GLB inválido, recurso externo
  y limpieza tras fallo.
- [ ] Pruebas de conector: token/origen/Host inválidos, replay, ticket vencido,
  cola llena, desconexión, Blender cerrado y cancelación.
- [ ] Prueba vertical con fuente real autorizada: buscar texto, subir imagen y
  seleccionar, rankear, elegir resultado, descargar, confirmar e importar.
- [ ] Pruebas en navegadores objetivo (incluyendo preflight y acceso local), no
  solo una prueba de HTTP de Python.
- [ ] Medir tiempo hasta resultados y tiempo de descarga/importación; mostrar
  progreso solo donde pueda medirse.
- [ ] Acordar limpieza/retención de fotos, miniaturas, modelos descargados y
  registros; no incluir archivos grandes, modelos ni secretos en Git.
- [ ] Preparar guía de arranque, `.env.example`, monitoreo básico y diagnóstico
  de fuente/IA/Blender. `/health` debe distinguir API disponible de IA lista.
- [ ] Hacer revisión de seguridad y de licencias antes del uso público.

**Criterio de aceptación final**

- Una persona instala el add-on y prepara la web según una guía clara.
- Puede buscar por texto y/o por imagen siguiendo el alcance acordado.
- Los resultados identifican claramente licencia, fuente y disponibilidad real.
- Un resultado permitido con GLB confirmado se importa en la escena correcta
  tras confirmación explícita de Blender.
- La escena anterior se conserva; reintentos no duplican activos.
- Errores de proveedor, descarga, IA y Blender son visibles y no parecen éxito.
- El recorrido completo pasa en los sistemas y navegadores soportados.

## Responsables sugeridos por área

| Responsable | Área/tareas |
| --- | --- |
| Manuel | Backend y fuentes externas: adaptadores Khronos/Objaverse; disponibilidad real; licencia/atribución; descarga verificada; endpoint/ticket de entrega; operación y contrato API. |
| Ángel | Web oficial: búsqueda y selección de resultado; estados UX; conexión segura al conector; envío del `asset_id`/ticket; validación en navegadores. |
| Brandon | IA/ranking: conservar separación entre búsqueda textual y ranking DINO; evaluar calidad de resultados, soporte de fuentes y mediciones. |
| Responsable de Blender/equipo | Add-on, conector, instalación de NumPy, empaquetado, Windows/Linux, validación de importación y pruebas de escena. Acordar explícitamente quién mantiene `integrations/blender/`. |
| Equipo completo | Aprobar alcance, términos/licencias, contrato, política de datos, navegadores/SO soportados y criterio de lanzamiento. |

Cambios en carpetas de otra persona requieren coordinación o un PR separado.
No cambiar dependencias o lockfiles ajenos sin necesidad y acuerdo.

## Orden recomendado para terminar con riesgo bajo

1. Acordar licencias, fuentes y el contrato de ticket de entrega.
2. Completar un solo flujo vertical con un GLB de Khronos (asset de prueba
   revisado), backend como intermediario, web oficial y confirmación Blender.
3. Hacer estable la instalación del add-on y NumPy en Windows/Linux.
4. Validar Objaverse con acceso, términos, metadatos y descarga antes de
   publicarlo como fuente; sumar fuentes solo cuando pasen el mismo criterio.
5. Pulir paginación, ranking, errores, seguridad, mediciones y despliegue.

No conectar directamente navegador/Blender a enlaces arbitrarios de proveedores:
el servidor debe resolver y verificar permisos y archivo, y el conector solo
debe canjear entregas autorizadas.

## Referencias del repositorio

- [README del proyecto](README.md): arquitectura actual, comandos y estado.
- [Contratos de API](CONTRATOS_API.md): propuestas de proyecto/escena y contrato
  actualizado de búsqueda descrito al final.
- [Integración de búsqueda y móvil](docs/INTEGRACION_BUSQUEDA_MOVIL.md):
  endpoints ejecutables de backend.
- [README de IA](ai/README.md): arranque y límites de la demo CPU.
- [Integración Blender](integrations/blender/README.md): instalación, uso y
  pruebas locales del add-on.
- [Diseño del conector Blender](integrations/blender/CONNECTOR_DESIGN.md):
  estado del prototipo y propuesta de entrega autorizada.

## Fuentes investigadas

- Khronos glTF Sample Assets:
  <https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/model-index.json>
- Posible búsqueda de Hugging Face/Objaverse:
  <https://datasets-server.huggingface.co/search?dataset=codepawl/objaverse-clean-glb&config=default&split=train&query=dog>
- API de Sketchfab:
  <https://sketchfab.com/developers/data-api/v3>
- API de Poly Haven:
  <https://polyhaven.com/our-api>


 
