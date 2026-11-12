# Propuesta: entrega autorizada → Blender

Diseño del 12 de noviembre de 2026, pendiente de coordinación con Manuel y Ángel.
El prototipo local de la demo ya está implementado, pero esta propuesta describe
la fase siguiente: recibir desde el backend un asset autorizado. La búsqueda con
texto, SAM y DINOv2 en CPU se conserva en su área; Blender consume un modelo
existente, no reconstruye la foto.

## Estado implementado: demo local limitada

El add-on puede registrar un GLB que el usuario selecciona dentro de Blender.
Un proceso Python local separado escucha solo en `127.0.0.1`; la demo se conecta
con un código temporal copiado manualmente desde Blender. Las solicitudes se
autentican por token, origen y host; Blender muestra cada solicitud y solo
importa el GLB después de una confirmación explícita. El conector no recibe rutas,
URLs ni comandos del navegador, y no descarga archivos ni consulta el backend.

Este prototipo no vincula resultados de búsqueda con modelos, no verifica
licencias de assets externos y no negocia compatibilidad de versiones de Blender.
Su prueba automática cubre el transporte local y una importación real; la revisión
manual de interfaz y la validación en Windows siguen pendientes.

## Arquitectura mínima propuesta

Flujo objetivo para la integración con una entrega autorizada del servidor:

```text
Web → FastAPI: solicitar entrega de un asset autorizado
Web → conector en 127.0.0.1: solicitud autenticada de importación
Conector → FastAPI: canjear entrega y descargar GLB verificado
Cola local → temporizador de Blender → import_glb() → estado de tarea
Web ← consulta periódica de estado ← conector
```

Preferimos comenzar con **HTTP REST y polling**: hay pocas acciones y no se
necesita comunicación continua. WebSockets añadirían gestión de sesiones y
reconexión sin una necesidad demostrada.

El prototipo ya inicia el conector como proceso separado y usa archivos temporales
para IPC. Para la fase objetivo, mantener la descarga y el HTTP fuera de Blender,
la cola acotada y el temporizador de `bpy.app.timers`; la consulta IPC debe ser
no bloqueante y con trabajo acotado por tick para no congelar la interfaz. Las
operaciones `bpy` se ejecutan en el hilo principal. No usar un hilo servidor
persistente dentro de Blender: su API documenta
[restricciones de threading](https://docs.blender.org/api/5.0/info_gotchas_threading.html).
La prueba actual de arranque/parada e IPC se ha ejecutado en Linux; falta validarla
en Windows.

Reutilizar `import_glb()` y la validación del MVP. La instalación futura debe
empaquetar esa lógica sin duplicarla y sin importar módulos internos de IA.

## Detección y autorización

- El navegador no inspecciona procesos ni rutas del equipo. Una comprobación de
  salud local indica si responde el conector; la sesión autenticada actual indica
  si Blender responde, pero aún no negocia ni declara una versión compatible.
- Conector apagado, Blender cerrado y add-on deshabilitado son estados distintos.
  Mostrar instrucciones para abrirlos manualmente, sin ejecutar comandos de la web.
- El prototipo inicia el emparejamiento desde Blender: el usuario elige un origen
  permitido, autoriza un GLB y copia un código de sesión a la demo. La fase objetivo
  debe conservar el consentimiento local explícito y revisar el flujo en los
  navegadores de destino; no confiar solo en conocer el puerto.
- Entregar un token aleatorio de sesión con caducidad y revocación; nunca incluirlo
  en URLs ni logs. No persistirlo en almacenamiento web duradero por defecto.
- Primer envío debe presentar nombre, origen, licencia, tamaño y destino al usuario.
  Cualquier autorización recurrente necesita una opción explícita y revocable.

## Límites y contrato propuesto

Esto es un diseño, **no una extensión aprobada de CONTRATOS_API.md**.

- Escuchar solo en `127.0.0.1`, nunca `0.0.0.0`. Verificar también `Host` contra
  la dirección/puerto exactos y `Origin` contra una lista explícita de orígenes
  autorizados; no aceptar `null`, comodines ni cambios arbitrarios de origen.
- Solo solicitudes JSON autenticadas pueden crear tareas. Rechazar formularios
  simples y solicitudes sin origen en los endpoints destinados al navegador.
  Resolver `OPTIONS` únicamente para orígenes/métodos/cabeceras aprobados.
  CORS no sustituye la autenticación ni la autorización local.
- Propuesta de importación: identificador de entrega breve y de un solo uso,
  vinculado al asset y su versión. El navegador **no envía rutas de disco, Python,
  comandos ni URLs de descarga arbitrarias**.
- El conector canjea ese identificador contra una API configurada y confiable.
  El backend verifica acceso, licencia y disponibilidad y devuelve un descriptor:
  asset, formato, tamaño esperado, SHA-256 y entrega autorizada con expiración.
- Validar destino/host y redirecciones en cada descarga. No reenviar credenciales
  a otros dominios. Un hash solo comprueba integridad respecto al descriptor
  confiable; no demuestra licencia ni seguridad del modelo.
- Acotar bytes durante streaming (inicialmente 100 MiB), timeout, concurrencia,
  cola y tiempo de vida. Descargar a un directorio temporal propio, validar hash
  y GLB autocontenido, renombrar atómicamente antes de entregar a Blender.
  Borrar temporales tras su uso o expiración, incluyendo fallos.
- El IPC acepta solo identificadores de tareas de esa sesión. El conector resuelve
  la ruta temporal controlada; Blender vuelve a validar el archivo antes de importar.
- Usar estados `queued`, `downloading`, `awaiting_confirmation`, `importing`,
  `completed`, `failed`, `cancelled`. Confirmar `completed` solo después de la
  respuesta del importador. Reintentos con clave idempotente evitan duplicados;
  un error puede dejar objetos parciales, por lo que no se reintenta automáticamente.
- Conservar mensajes claros y un ID de diagnóstico; no devolver trazas, rutas
  privadas ni tokens al navegador. Al cerrar el add-on/conector, revocar sesión,
  retirar temporizadores y comunicar desconexión a las tareas pendientes.

Las restricciones de acceso del navegador a localhost dependen del navegador y
del esquema de la web. Antes de escoger el despliegue, probar CORS, preflight,
permisos de red local y conexión HTTPS → loopback en los navegadores objetivo.
No pedir desactivar protecciones, usar flags inseguros ni prometer que CORS basta.
Si esa comunicación no funciona en el entorno elegido, mantener como alternativa
la importación manual de un GLB autorizado.

## Coordinación necesaria

| Responsable | Decisión y entrega |
| --- | --- |
| Manuel | Verificar qué proveedores entregan archivos y bajo qué permisos; añadir entrega autorizada, metadatos, hash y expiración. Los actuales `model_available: false` / `model_url: null` no habilitan importación. |
| Ángel | Selección del resultado, botón habilitado solo con archivo y formato confirmados; emparejamiento, desconexión, confirmación, progreso y errores. |
| Brandon / equipo | Acordar mantenimiento de `integrations/`, empaquetado, versiones Blender/Windows y aceptación de seguridad y comportamiento. No reasigna propiedad de otras áreas. |

## Criterios para comenzar la integración con el backend

1. Un GLB autorizado real accesible mediante el backend, con licencia y hash.
2. MVP local aprobado manualmente en Blender/Windows por otro integrante.
3. Contrato de entrega y emparejamiento revisado por los responsables.
4. Prueba pequeña del transporte local en los navegadores objetivo antes de UI final.

Pruebas de esa fase: Blender cerrado, token/origen incorrectos, intento de replay,
descriptor expirado, recurso externo, exceso de tamaño, hash incorrecto, cola
llena, cancelación, pérdida de conexión y una importación real sin borrar la escena.
