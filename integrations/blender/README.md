# Asset Finder · integración local con Blender

MVP del 12 de noviembre de 2026. La búsqueda conserva texto + SAM y DINOv2
en CPU; MSI/CUDA y reconstrucción 3D se posponen. Este módulo comienza **después
de obtener un archivo GLB**: permite importarlo a la escena abierta de Blender.
No consulta APIs ni descarga archivos. El prototipo de conexión abre un servicio
HTTP solo en `127.0.0.1`, durante una sesión autorizada, para solicitar la
importación del GLB que el usuario eligió desde Blender.

## Conceptos y archivos

Blender incluye un intérprete de Python. `bpy` es su API: permite crear objetos,
consultar escenas y llamar al importador glTF oficial. Estos scripts se ejecutan
con Blender; `python addon.py` en el entorno de IA no lo sustituye.

Un **script** ejecuta una tarea al invocarlo. Un **add-on** registra herramientas
que puedes usar desde la interfaz de Blender. El conector local ya tiene un
prototipo para comunicar la demo IA con Blender; no recibe modelos desde el
backend ni descarga los resultados de búsqueda.

| Archivo | Función |
| --- | --- |
| `addon.py` | Código del add-on: importación, validación y confirmación de solicitudes en Blender. |
| `bridge.py` | Sesión local: inicia el conector, entrega solicitudes y comprueba la integridad del GLB. |
| `connector.py` | Servicio HTTP local de la demo, en un proceso separado de Blender. |
| `test_import.py` | Script de terminal que recibe una ruta y llama a esa misma importación. |
| `verify_blender.py` | Suite ejecutada dentro de Blender; crea GLB propios pequeños y temporales. |
| `test_connector.py` | Pruebas HTTP e IPC local del conector, sin depender de un servidor externo. |
| `package_addon.py` | Genera `dist/asset_finder_blender.zip` con un nombre de módulo propio. |
| `verify_installation.py` | Prueba el ZIP en un perfil aislado; puede verificar interfaz, conexión, confirmación y deshacer/rehacer. |
| `CONNECTOR_DESIGN.md` | Estado del prototipo y propuesta para conectarlo con entregas autorizadas del backend. |

## Requisitos y alcance

- Objetivo de compatibilidad: **Blender 5.0.x**, importador glTF incluido. Otras
  versiones necesitan validación antes de declararlas compatibles.
- Modelo local **GLB versión 2 autocontenido**, hasta **100 MiB**. Las texturas y
  buffers deben estar embebidos; también se admiten URI `data:` internas.
- No se admiten todavía `.gltf` con archivos separados, OBJ, FBX o conversiones.
- No se instalan paquetes desde el add-on. El importador incluido en Blender
  necesita sus propias dependencias de Python, entre ellas NumPy.

El límite de archivo no garantiza un límite de RAM: escenas complejas y texturas
pueden requerir más memoria que el tamaño del GLB. El importador oficial decide
qué extensiones y materiales puede interpretar.

## Instalar y usar en Windows

Genera el paquete desde la raíz del repositorio con Python, sin instalar dependencias:

```powershell
py .\integrations\blender\package_addon.py
```

También puedes utilizar directamente el ZIP generado en esta entrega. El ZIP
instala el paquete `asset_finder_blender`, con el add-on y los dos módulos del
conector. `addon.py` es el archivo fuente del add-on; el empaquetado no duplica
su lógica. `dist/` está ignorado por Git: en otra copia del repositorio se genera
con el comando anterior.

1. Abre Blender 5.0.x. Guarda tu proyecto si estás trabajando en una escena.
2. Ve a **Edit → Preferences → Add-ons** y, en el menú de la esquina superior
   derecha, selecciona **Install from Disk…**.
3. Selecciona `integrations/blender/dist/asset_finder_blender.zip` sin descomprimirlo.
4. Activa **Asset Finder — Importar GLB** en la lista de add-ons.
5. En la escena, utiliza **Object Mode**.
6. Abre **File → Import → Asset Finder (.glb)**. También puedes buscar
   **Asset Finder: importar GLB** con `F3`.
7. Selecciona el modelo y confirma. Blender muestra el resultado de la operación.
8. Comprueba en el **Outliner** que aparecen los objetos importados. Selecciónalos
   y usa **View → Frame Selected** para encuadrarlos; si tienes teclado numérico,
   puedes usar `Numpad .`.
9. Comprueba que tus objetos previos siguen presentes. Guarda el `.blend` cuando
   quieras conservar el resultado. `Ctrl+Z` permite deshacer la importación en UI.

La instalación mediante ZIP sigue la modalidad legacy documentada
por [Blender 5.0](https://docs.blender.org/manual/en/5.0/editors/preferences/addons.html).
No requiere instalar los scripts de prueba. Si actualizas desde la versión 0.1.0
de un solo archivo, desinstálala y cierra Blender por completo antes de instalar
el ZIP nuevo. Blender puede conservar en memoria la ruta del módulo antiguo hasta
reiniciar; instalar el paquete nuevo sin reiniciar puede mostrar un error que
menciona `asset_finder_blender.py`, aunque la versión 0.2.0 aparezca instalada.
Después de reiniciar, instala el ZIP y activa el add-on.

Para desinstalarlo, desactívalo y elimínalo desde Preferences → Add-ons.
Desactivar el add-on quita su menú; conserva los objetos ya importados.

## Probar el envío desde la demo IA

Este prototipo solo envía el GLB seleccionado manualmente en Blender; no importa
un resultado de búsqueda ni descarga un archivo del backend. Inicia la demo IA
según [sus instrucciones](../../ai/README.md) y mantenla en
`http://127.0.0.1:8765` o `http://localhost:8765`.

1. En Blender, abre la vista 3D, pulsa `N` y selecciona la pestaña **Asset Finder**.
2. Selecciona un GLB local, elige el origen exacto de la demo y pulsa
   **Autorizar demo y conectar**. El servicio local queda limitado a
   `127.0.0.1`; la sesión caduca en 30 minutos.
3. Pulsa **Copiar código de conexión** en Blender. En la demo, introduce ese
   código y el puerto configurado (por defecto `8766`), y pulsa **Conectar con
   Blender**.
4. Pulsa **Abrir en Blender** en la demo. La solicitud no importa nada todavía:
   confirma o rechaza el GLB en la pestaña Asset Finder de Blender.
5. Cierra la sesión desde la demo o desde Blender cuando termines.

El origen tiene que coincidir exactamente en ambas aplicaciones. El navegador
solo conserva el código en memoria mientras dura la sesión; nunca envía una ruta,
URL de descarga ni comando. Esta demo local no sustituye la importación manual ni
la futura entrega autorizada desde el backend.

## Conseguir un GLB de prueba sin descargas

En una escena de prueba de Blender, selecciona un objeto propio y usa
**File → Export → glTF 2.0**, formato **glTF Binary (.glb)**, exportando solo
la selección. Guárdalo fuera del repositorio, por ejemplo en
`C:\Users\TU_USUARIO\Documents\modelos\prueba.glb`.
No hace falta añadir modelos pesados a Git. La suite automática genera su propio
triángulo GLB en una carpeta temporal y lo elimina al terminar.

## Prueba por terminal

Desde PowerShell, en la raíz del proyecto (ajusta la ruta de Blender):

```powershell
$blenderExe = 'C:\Program Files\Blender Foundation\Blender 5.0\blender.exe'
& $blenderExe --background --factory-startup --python-exit-code 1 `
  --python .\integrations\blender\test_import.py -- `
  'C:\Users\TU_USUARIO\Documents\modelos\prueba.glb'
$LASTEXITCODE
```

Salida esperada: `Asset Finder: importación exitosa; … objeto(s).`, sus nombres
y código `0`. `--` separa los argumentos de Blender de la ruta recibida por el
script. `--python-exit-code 1` hace que un fallo Python produzca código `1`;
argumentos ausentes producen un error de uso. Usa siempre esa opción al automatizar.

`--background` abre **otro proceso de Blender**, no la ventana que tienes abierta.
El script no guarda un `.blend`: verifica importación en ese proceso. Para trabajar
con tu escena abierta utiliza el add-on. `--factory-startup` solo usa la escena
inicial en el proceso de prueba; no cambia tus preferencias guardadas.

En Linux, si `blender` está en PATH:

```bash
blender --background --factory-startup --python-exit-code 1 \
  --python integrations/blender/test_import.py -- /ruta/al/modelo.glb
```

## Pruebas automáticas

```powershell
& $blenderExe --background --factory-startup --python-exit-code 1 `
  --python .\integrations\blender\verify_blender.py
$LASTEXITCODE
```

```bash
blender --background --factory-startup --python-exit-code 1 \
  --python integrations/blender/verify_blender.py
```

Se verifican seis casos: importación real y repetida conservando objetos y
transformaciones existentes; rutas/extensiones/archivos inválidos; rechazo de
recursos externos; tamaño/cabecera; escena vacía; registro, ejecución y retirada
del operador, con notificación de fallo. No usan dobles del importador glTF.

Las pruebas HTTP e IPC del prototipo local se ejecutan con Python normal:

```bash
python3 -m unittest integrations.blender.test_connector
```

Verifican autorización por origen/host/código, solicitudes idempotentes,
confirmación/rechazo, desconexión, expiración e integridad del GLB.

### Probar la instalación y deshacer/rehacer

Este comando usa Python normal para abrir **su propia instancia** de Blender,
instalar el ZIP en un perfil temporal, importar un triángulo propio y deshacer/
rehacer la operación. La ventana se cierra automáticamente. No interactúa con
otras ventanas de Blender ni guarda cambios en tu perfil habitual.

```powershell
py .\integrations\blender\verify_installation.py --blender $blenderExe --gui
```

Sin `--gui` ejecuta solo instalación, activación, importación, desactivación y
reactivación en background. Necesita Blender y Python, sin paquetes adicionales
para el ejecutor. El importador utiliza las dependencias de su propio Blender.
El informe queda en `dist/installation-gui.json` o `dist/installation-background.json`.
Un fallo de arranque o de comprobación devuelve error y se registra en ese informe.
No sustituye la revisión manual del selector de archivos y la apariencia del modelo.

En este entorno Linux:

```bash
python3 integrations/blender/verify_installation.py \
  --numpy-path /tmp/asset-finder-blender-deps --gui
```

Para verificar también el servicio local, la confirmación/rechazo desde Blender
y el flujo HTTP completo, añade `--connection` (abre su propia ventana temporal):

```powershell
py .\integrations\blender\verify_installation.py --blender $blenderExe --connection
```

```bash
python3 integrations/blender/verify_installation.py --blender blender \
  --numpy-path /tmp/asset-finder-blender-deps --connection
```

### Evidencia de esta entrega

Validación completada en Blender **5.0.1**, Linux, Python **3.14.4**, con
**NumPy 2.4.6**, el 12 de noviembre de 2026:

- **6 pruebas aprobadas**, usando el importador glTF real, incluidos el operador
  del add-on, importación repetida y conservación de objetos/transformaciones.
- CLI: importó `AF_Triangle` desde un GLB generado localmente, con código `0`.
  Una ruta inexistente produjo el error esperado y código `1`.
- Compilación Python aprobada. La prueba de escena vacía usa un GLB sin nodos;
  Blender también importa nodos huérfanos si se dejan en el archivo.
- ZIP instalado mediante el operador oficial: **13 comprobaciones aprobadas**
  en background, incluyendo activación/desactivación/reactivación e importación.
- Ventana gráfica real de Blender en Linux/WSLg: **17 comprobaciones aprobadas**,
  incluidas deshacer y rehacer con comparación de objetos y transformaciones.
  La prueba usa perfiles y archivos de recuperación temporales propios.
- Conector instalado y recorrido HTTP en Blender 5.0.1: **30 comprobaciones
  aprobadas**; las 6 pruebas unitarias del conector y las 6 pruebas de importación
  también pasan.
- Pendiente: selector de archivos y comprobación visual manual; ejecución en
  Blender nativo de Windows por otro integrante. Linux/WSLg no acredita Windows.

El importador de esta instalación Linux no encontraba NumPy inicialmente.
Con autorización del usuario se descargó la versión 2.4.6 compatible con Python
3.14, usando `uv pip install --only-binary :all:` y un destino independiente.
Se conservan, por petición del usuario:

- `/tmp/asset-finder-blender-deps`: NumPy instalado para estas pruebas.
- `/tmp/asset-finder-blender-cache`: caché de la descarga.
- `/tmp/asset-finder-blender-checks/triangulo.glb`: archivo de prueba de la CLI.

No se modificaron paquetes globales ni entornos de IA/backend. Las rutas de `/tmp`
son locales a esta máquina; el sistema puede limpiarlas al reiniciar. El add-on
no incorpora esas rutas ni instala NumPy automáticamente.

Para repetir las pruebas **en este entorno Linux**, se añade la ruta conservada
solo al proceso de Blender:

```bash
blender --background --factory-startup --python-exit-code 1 \
  --python-expr "import sys; sys.path.insert(0, '/tmp/asset-finder-blender-deps')" \
  --python integrations/blender/verify_blender.py

blender --background --factory-startup --python-exit-code 1 \
  --python-expr "import sys; sys.path.insert(0, '/tmp/asset-finder-blender-deps')" \
  --python integrations/blender/test_import.py -- /tmp/asset-finder-blender-checks/triangulo.glb
```

En una instalación de Blender que ya incluya NumPy, utiliza los comandos normales
de las secciones anteriores, sin esta ruta específica de Linux.

## Errores habituales y límites

| Mensaje o síntoma | Qué comprobar |
| --- | --- |
| Ruta inexistente o permiso denegado | Seleccionar un archivo accesible y revisar la ruta entre comillas en PowerShell. |
| Solo admite `.glb` / cabecera inválida | Exportar GLB 2; cambiar la extensión de un OBJ no convierte el archivo. |
| Se requiere GLB autocontenido | Reexportar con recursos embebidos; este MVP rechaza rutas y URLs externas. |
| Supera 100 MiB | Utilizar un modelo más pequeño o reducir su complejidad al exportarlo. |
| No contiene objetos importables | Revisar que el GLB tenga objetos vinculados a su escena exportada. |
| `No module named numpy` | El importador glTF de esa instalación de Blender no encuentra su dependencia. NumPy del entorno IA no sirve si Blender usa otro Python. En el entorno Linux de esta entrega, con Blender abierto, pon el puntero sobre la vista 3D y pulsa `Shift+F4` para abrir la consola Python. Ejecuta `import sys; sys.path.insert(0, '/tmp/asset-finder-blender-deps')` y luego `import numpy; print(numpy.__version__)`. Si muestra una versión, pulsa `Shift+F5` para volver a la vista 3D y reintenta la importación. La ruta solo aplica a esa instancia; no abras otra ventana desde la terminal para añadirla. No instalar paquetes de IA sobre Blender. |
| El menú no está disponible | Activar el add-on y salir de Edit Mode a Object Mode. |
| Error que menciona `asset_finder_blender.py` después de actualizar a 0.2.0 | Cerrar Blender por completo y volver a abrirlo para descartar el módulo antiguo que quedó en memoria; comprobar que el add-on instalado apunta a `asset_finder_blender/__init__.py`. |
| Se importó pero no se ve | Revisar Outliner y encuadrar el objeto; posición y escala proceden del archivo. |

No se borran objetos previos ni se cambia su escala/posición. Una segunda
importación crea nuevos objetos. Blender puede cambiar selección y objeto activo.
Si el importador falla después de crear datos, pueden quedar datos parciales;
este MVP no implementa rollback transaccional. Comprueba la escena antes de guardar.
No se afirma cobertura de materiales complejos, animación, rigging o archivos de
terceros a partir de la prueba del triángulo.

## Próximo paso con el equipo

Actualmente el backend en `main` consulta Sketchfab y Poly Haven y conecta
SAM/DINO en CPU, pero los conectores publican `model_available: false` y
`model_url: null`. Una página o miniatura no proporciona un GLB importable.

Para una integración real, Manuel debe acordar la obtención autorizada y entrega
del archivo, formato, licencia, tamaño y hash. Ángel debe acordar el estado del
botón y los mensajes de conexión en la web oficial. El prototipo local no altera
el contrato de API ni habilita la importación de assets externos. La propuesta
técnica está en [CONNECTOR_DESIGN.md](CONNECTOR_DESIGN.md).
