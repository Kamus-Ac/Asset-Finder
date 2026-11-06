# Asset Finder Mobile

Prototipo visual Android de búsqueda de assets 3D a partir de referencias. Funciona con datos e ilustraciones locales y conserva compatibilidad con Expo Go. No necesita servidor, cuenta ni permisos del dispositivo.

## Tecnologías

Expo SDK 58, React Native 0.88.1, React 19.3, TypeScript 6 con `strict: true`, Expo Router y `expo-image`. Se mantienen las versiones del proyecto. `react-native-safe-area-context` gestiona las áreas seguras; NativeTabs utiliza iconos Material en Android. Las dependencias ya existentes de gestos y animación quedan disponibles para la integración posterior.

## Ejecutar desde Ubuntu / WSL2

```bash
cd mobile
npx expo start --tunnel ngrok
```

Abrir el QR en Expo Go compatible con SDK 58 desde Android. Mantener WSL y el dispositivo con conexión al túnel. No hacen falta `expo-camera`, permisos, Android Studio ni un development build para este recorrido visual. El túnel sirve el proyecto; la interfaz no descarga imágenes ni consulta APIs.

```bash
npx tsc --noEmit
npx expo lint
npx expo export --platform android --output-dir /tmp/asset-finder-android-export
```

La primera ejecución de lint necesita ESLint y `eslint-config-expo` como herramientas de desarrollo. No desactivar TLS si hay problemas de certificados: configurar la CA de confianza del entorno.

## Organización

- `src/app/`: rutas y composición de pantallas.
- `src/components/ui/kit.tsx`: texto, botones, cabeceras, paneles, selector de opciones, búsqueda local, indicadores de estado, modal y contenedor adaptable.
- `src/components/assets/`: tarjetas y cuadrícula de assets.
- `src/components/projects/`: tarjetas de colecciones.
- `src/theme/`: paletas semánticas, tokens de espaciado, radios y tipografía; proveedor de apariencia.
- `src/types/domain.ts`: assets, proyectos y estados de trabajos.
- `src/mocks/catalog.ts`: catálogo y proyectos ficticios, registro de recursos locales.
- `src/mocks/scenarios.ts`: referencias, fotogramas y textos de los estados demostrativos de reconstrucción.
- `src/mocks/session.tsx`: estado compartido y temporal de la demostración. Crear, guardar y quitar no sale de este proveedor.
- `src/services/contracts.ts`: contratos de futuras integraciones. No contiene cliente HTTP ni implementaciones simuladas que puedan confundirse con producción.
- `assets/images/demo/`: seis ilustraciones SVG propias, empaquetadas en la aplicación.

Los componentes de ejemplo originales que no participan en las rutas se conservan para no eliminar material del proyecto. La bienvenida inicial del usuario se trasladó al inicio compuesto, conservando su propósito, descripción y las acciones de fotografía e imagen. El splash animado de la plantilla ya no se monta. La configuración del splash nativo existente se conserva.

## Navegación

Un Stack raíz contiene las pestañas y todos los recorridos secundarios. La barra inferior solo aparece en Inicio, Proyectos y Ajustes. Android Atrás desapila las pantallas secundarias normalmente; los modales se cierran con Atrás mediante `onRequestClose`. En una entrada directa sin historial, la configuración inicial del Stack permite volver al grupo de pestañas.

| Ruta | Vista |
| --- | --- |
| `/` | Redirección al inicio, conserva el punto de entrada original |
| `/(tabs)/home` | Identidad, búsqueda visual, fotografía, archivos, video, explicación y proyectos recientes |
| `/(tabs)/projects` | Colecciones, creación temporal y estado vacío |
| `/(tabs)/settings` | Apariencia sistema/claro/oscuro, versión, conectividad y preferencias futuras |
| `/capture?mode=video` | Captura ilustrada, modos foto/video y permisos visuales |
| `/reference?mode=video` | Archivo local de ejemplo y línea de tiempo ilustrativa |
| `/selection` | Rectángulo fijo, herramientas de puntos, guía de máscara y reinicio |
| `/results` | Catálogo, ranking demo, búsqueda por nombre, filtros, orden y estados |
| `/asset/[id]` | Galería ilustrada, formato, licencia, disponibilidad y guardado local |
| `/projects/[id]` | Colección temporal compartida, assets y administración local |
| `/reconstruction` | Servicio no disponible y selector explícito de cinco estados demo |
| `/explore` | Redirección de compatibilidad al catálogo |

El componente de pestañas conserva variantes nativa y web. NativeTabs se importa desde `expo-router/native-tabs`, la ruta estable correspondiente a SDK 58. No se usan carpetas nativas generadas.

## Propuesta visual

Neutros ligeramente fríos en superficies y texto, violeta como acento reconocible y fondos cálidos en las ilustraciones. El modo oscuro cambia superficies, texto, contraste y acento desde el mismo proveedor. La apariencia se mantiene únicamente durante la sesión.

Las paletas y escalas están en `src/theme/index.tsx`. Los componentes compartidos contienen el tratamiento de superficies, presión, selección y deshabilitado. Las pantallas usan composición con espacios consistentes, contenido de ancho máximo y scroll para diferentes tamaños de Android y escalas de texto. Los controles tienen áreas táctiles de al menos 46–50 unidades; las etiquetas pequeñas se reservan para metadatos.

Las miniaturas ilustran sillas, mesas, lámparas, sofás, decoración y arquitectura; no representan archivos 3D descargables. La galería cambia entre la ilustración principal y acercamientos ilustrativos, sin insinuar un visor 3D real.

## Qué es demostrativo

- El catálogo, las fuentes y las licencias son ejemplos, sin enlaces o licencias verificadas.
- El ranking `0.94`, etc. es ficticio, no porcentaje de acierto ni resultado de DINOv2.
- La disponibilidad representa cómo se vería un recurso con archivo frente a una referencia; el prototipo no distribuye archivos 3D.
- Captura y archivos no abren la cámara ni la galería, no solicitan permisos ni acceden al almacenamiento.
- Video y fotogramas son vistas ilustrativas; no hay reproducción o extracción real.
- Las herramientas de selección alternan superposiciones fijas; no calculan coordenadas, gestos ni máscaras SAM.
- Los estados de carga y error se eligen manualmente para revisión. No hay procesamiento oculto ni temporizadores de IA.
- Guardar un asset actualiza las colecciones demo durante la sesión, evita duplicados y puede revertirse desde la administración del proyecto. Crear proyectos admite nombres de hasta 60 caracteres. No hay persistencia o sincronización.
- Consultar fuente abre información explicativa, sin navegador externo ni solicitudes.
- Reconstrucción parte de **No disponible**. Los otros estados son ejemplos seleccionables; el botón de solicitud permanece deshabilitado incluso en la vista de completado. No hay progresos porcentuales inventados.
- Conectividad está **No configurada**, sin URL ni comprobaciones de red.

## Recorrido de revisión manual

1. Inicio → Tomar fotografía → Foto/Video → usar ejemplo → revisar referencia.
2. Seleccionar objeto → probar rectángulo, puntos y guía → reiniciar/restaurar → resultados.
3. Buscar un nombre, filtrar por archivo 3D, ordenar y revisar los estados de carga, vacío y error.
4. Abrir un asset disponible y otro de solo referencia; probar galería e información de fuente.
5. Crear un proyecto, guardar un asset desde su detalle y verificarlo en Proyectos. Quitar desde Administrar colección.
6. Abrir reconstrucción y revisar sus cinco estados explícitos.
7. Cambiar apariencia y revisar todas las pantallas, Android Atrás y los modales.

## Integración futura

1. Validar este recorrido y la dirección visual en el Samsung con Expo Go: áreas seguras, fuente ampliada, teclado, gestos y botón Atrás.
2. Definir contratos FastAPI para referencias, coordenadas normalizadas, máscaras, ranking y disponibilidad/licencias de assets. Los tipos iniciales de `services/contracts.ts` son una base, no un contrato aprobado del backend.
3. Incorporar cámara, selector de medios y permisos con versiones compatibles mediante `npx expo install`. Separar adaptadores de dispositivo de las pantallas.
4. Añadir cliente HTTP, URL configurable y acceso por Tailscale sin credenciales en el repositorio; no sustituir errores de producción por mocks.
5. Implementar carga multipart y consulta/cancelación de trabajos asíncronos. Llevar al UI solo estados reportados por el servidor.
6. Integrar selección y transformación de coordenadas, SAM 2, DINOv2 y resultados verificables.
7. Validar hardware y viabilidad de SAM 3D Objects antes de habilitar reconstrucción.
8. Conectar proyectos persistentes y compatibilidad de formatos con la escena web.

No se incluyó autenticación, edición 3D móvil, realidad aumentada ni servicios externos.

## Validación de esta entrega

Los resultados y las limitaciones de ejecución se registran en `VALIDATION.md`. Una exportación Android valida la resolución de módulos y el empaquetado, pero no sustituye una prueba en un dispositivo.
