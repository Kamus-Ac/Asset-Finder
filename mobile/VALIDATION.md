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
