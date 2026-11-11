# Inicio según referencia · 2026-11-11

- Inicio sin scroll con proporciones de la referencia: logotipo en dos líneas, acceso a Perfil, pregunta, buscador, Abrir archivo, Escanear objeto y Crear entorno. LINE Seed JP Regular/ExtraBold locales con licencia OFL; iconos SVG proporcionados por el usuario. La pieza 3D del SVG adjunto se rasterizó con transparencia a 804 × 930 px para usar el mismo recurso en Android y web.
- Fondo radial violeta y resplandor inferior naranja mediante SVG; barra inferior al borde del área segura y círculo de Inicio `#B34149`. Los gradientes usan `r` y transformación para conservar la geometría en SVG nativo y web.
- Buscar por teclado o lupa abre y filtra el catálogo local; Abrir archivo conserva el selector real y la vista de Referencia; Escanear objeto abre Capturar; Crear entorno permite nombrar una colección y guardar assets seleccionados en el estado local de la sesión.
- `npm run lint`, `npx tsc --noEmit` y `git diff --check`: correctos.
- `npx expo export --platform android --platform web --max-workers 1 --output-dir /tmp/asset-finder-home-final-export`: correcto, incluidos fuentes y gráfico.
- Pruebas interactivas en Chrome: búsqueda y estado vacío, Perfil, Capturar, selector con una imagen real, creación de entorno con dos assets y validación de nombre obligatorio. Sin errores de ejecución. Tamaños 222×482, 320×568, 390×844, 430×932, 768×1024 y 844×390: sin scroll ni superposición de las acciones con la barra.
- Capturas revisadas a 390×844 y al tamaño de la referencia. Script temporal: `%TEMP%/verify-asset-home.cjs`.
- Sin backend ni generación de modelos/escenas 3D. Entornos y catálogo son demostraciones locales; no se verificó cámara ni renderizado en teléfono físico.

---

# Navbar animado · 2026-11-10

- Barra de cinco destinos según la referencia: iconos sólidos blancos, fondo `#0B0911`, círculo `#A805F4` y curva superior móvil. El indicador y la elevación de iconos comparten una animación de resorte; las pantallas usan fundido. Se respeta reducir movimiento.
- Cámara comparte el componente de captura con `/capture`; Perfil muestra el estado sin sesión. No se agregó autenticación.
- Se ajustó el espacio inferior según el ancho real de la barra para conservar Inicio sin scroll y evitar superponer el contenido. NativeWind usa `darkMode: 'class'` para evitar el error web al sincronizar el tema con Expo Router.
- `npm run lint`, `npx tsc --noEmit` y `git diff --check`: correctos.
- Exportación Android/web correcta en `/tmp/asset-finder-navbar-final-export`.
- Prueba interactiva en Chrome: cinco rutas, indicador en tránsito y en reposo, pulsaciones rápidas, selección accesible, activación por teclado, reducir movimiento, tamaños de 320/390/673/1024 px y acceso a `/capture` sin navbar visible. Sin errores de ejecución. Script temporal: `%TEMP%/verify-mobile-navbar.cjs`.
- Se revisaron capturas del navbar y de las pantallas a distintos tamaños. No se verificó en teléfono físico; la exportación Android no sustituye esa prueba.

---

# Cámara y medios reales · 2026-11-09

- Se integraron `expo-image-picker` y `expo-video` compatibles con SDK 58, con mensajes de permisos en la configuración Expo.
- Inicio abre directamente la cámara para foto/video y el selector nativo para imágenes. Cancelar conserva la referencia anterior. La foto real se muestra en Referencia y Selección; el video grabado se reproduce con controles nativos. La selección de fotogramas sigue pendiente.
- TypeScript, lint sin advertencias y `expo config --type public --json`: correctos.
- Exportación Android/web correcta en `/tmp/asset-finder-real-media-export`. Renderizado SSR de 16 casos correcto, incluidos los estados sin referencia de Referencia y Selección. Script temporal: `/tmp/verify-real-media-pages.cjs`.
- Diez comprobaciones con APIs simuladas del adaptador de medios: foto, video, denegación, bloqueo permanente, cancelación, galería sin permisos amplios, activación web, error nativo, URI inválida y normalización del resultado recuperado de Android. Script temporal: `/tmp/verify-media-picker.cjs`. Estas pruebas no verifican hardware.
- Inicio conserva ausencia de scroll, muestra tarjetas con bordes y fondos sólidos, usa un diseño compacto según altura y ofrece acceso a la última referencia, incluida la recuperación tras recreación de actividad Android.
- No se probó cámara, micrófono, galería, audio ni geometría visual en un teléfono. Revisar permisos concedidos/denegados/bloqueados, cancelar, reabrir, cambiar referencia, video con sonido y Android Atrás. Reiniciar Metro tras instalar las dependencias.

---

# Recuperación de recorridos · 2026-11-09

- TypeScript: `npx tsc --noEmit`, correcto.
- Lint: `npm run lint`, correcto sin advertencias tras unificar el import de Ajustes.
- Android y web: `npx expo export --platform android --platform web --output-dir /tmp/asset-finder-restored-export`, correcto; se generan bundle Hermes, servidor y cliente web, Urbanist y SVG locales.
- `git diff --check`: correcto.
- Inicio usa únicamente `View` y `Pressable`, sin contenedor de scroll. Tiene variante compacta para ventanas menores de 740 de alto.
- No se ha probado en dispositivo ni en navegador interactivo. La exportación no verifica gestos, teclado, geometría o animaciones.
- Renderizado SSR: 16 casos correctos, incluyendo Inicio, proyectos, ajustes, foto/video, referencia/fotogramas, selección, resultados, assets disponibles/referencias/inexistentes, proyectos con assets/vacíos/inexistentes y reconstrucción. Script temporal: `/tmp/verify-restored-mobile.cjs`. No verifica interacción.
- Se corrigió la carga de Urbanist usando `useFonts` de `expo-font`, con soporte de servidor; el hook del paquete de Google Fonts dejaba vacío el HTML SSR. Se importan solo los cuatro pesos usados.

Recorrido manual pendiente: Foto/Video → referencia → fotograma → selección por área/puntos → resultados → filtros/orden → asset → guardar en proyecto existente/nuevo → abrir proyecto → quitar asset. Revisar también apariencia, Inicio sin scroll a distintos tamaños, barra flotante, teclado y Atrás.

Se conservan los límites del prototipo: medios y catálogo de ejemplo, proyectos en memoria, sin cámara/galería real, backend, IA ni descarga 3D. Los estados de reconstrucción son seleccionables como vista previa.

---

# Comprobaciones del prototipo

Fecha: 2026-11-06. Rama comprobada: `feat/mobile-setup`.

## Resultados

| Comprobación | Resultado |
| --- | --- |
| `npx tsc --noEmit` | Correcto, sin errores |
| `npx expo lint` | Correcto, sin errores ni advertencias |
| `npx expo export --platform android --output-dir /tmp/asset-finder-android-verified` | Correcto; bundle Hermes, 1363 módulos; seis SVG locales y fuente Material incluidos |
| `npx expo export --platform web --output-dir /tmp/asset-finder-web-preview` | Correcto; bundles web y servidor generados |
| Renderizado SSR del export web | Contenido esperado verificado en 14 rutas, sin errores de renderizado |
| Rutas y recursos | Verificados 13 archivos de rutas/layouts y seis ilustraciones locales |
| `git diff --check` | Correcto |
| Dispositivo o emulador Android | No disponible en esta sesión; no se declara una prueba en Android |
| Interacción automatizada en navegador | No disponible; SSR no verifica interacción, layout visual ni hidratación en navegador |

Las 14 verificaciones SSR cubrieron inicio, proyectos, ajustes, captura, referencia, selección, resultados, asset con archivo representado, asset de solo referencia, asset inexistente, proyecto con assets, proyecto vacío, proyecto inexistente y reconstrucción. Se utilizó el renderer del export de Expo Router instalado y se comprobó el texto específico de cada pantalla. Los scripts y exportaciones de comprobación son temporales en `/tmp`, no dependencias ni código de la aplicación.

## Herramientas e incidencias resueltas

La plantilla no tenía ESLint. `expo lint` configuró `eslint.config.js` y requirió `eslint` y `eslint-config-expo`, agregados únicamente como dependencias de desarrollo. Se actualizaron `package.json` y `package-lock.json`; las versiones declaradas de Expo, React y React Native se conservaron. La instalación inicial no avanzó dentro de la red restringida; se completó con acceso autorizado sin desactivar TLS.

El primer lint encontró un patrón preexistente de actualización de estado en un efecto en `src/hooks/use-color-scheme.web.ts`. Se reemplazó por una lectura de hidratación con `useSyncExternalStore`; conserva la salida inicial clara del servidor y elimina el error de lint. Referencia: [React: soporte de renderizado en servidor](https://react.dev/reference/react/useSyncExternalStore#adding-support-for-server-rendering).

Se consultó la skill oficial instalada `building-native-ui` y documentación de SDK 58 mediante Expo MCP. Se prefirió la documentación del SDK sobre ejemplos antiguos de la skill para importar NativeTabs desde `expo-router/native-tabs`.

No se ejecutó `expo-doctor` ni se modificó la confianza TLS. No se ejecutó `npm audit fix`, no hubo commits, pushes ni publicaciones. No se modificaron módulos fuera de `mobile/`.

## Revisión pendiente en el Samsung

Seguir el recorrido manual del README en Expo Go: modo claro/oscuro, navegación Atrás, áreas seguras, teclado del modal de proyecto, escalado de fuente y tamaños de pantalla. Confirmar que las ilustraciones SVG y los iconos se ven correctamente en el dispositivo. Estas comprobaciones visuales y de interacción no quedan sustituidas por TypeScript, lint, SSR o el bundle Android.

El splash nativo sigue usando la configuración e imagen originales. Sustituirlo junto con el icono definitivo cuando se apruebe la identidad visual.
