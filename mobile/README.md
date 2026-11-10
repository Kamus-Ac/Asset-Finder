# Assets finder · Mobile

Expo SDK 58, React Native, Expo Router, TypeScript, NativeWind/Tailwind, Urbanist y Lucide. Interfaz en español con fondo degradado, tema automático y navegación flotante.

## Ejecutar

```bash
cd mobile
npx expo start --clear
```

Para el túnel desde WSL2: `npx expo start --tunnel ngrok`. Abrir con Expo Go compatible con SDK 58.

## Recorridos

- **Inicio:** sin scroll. Foto, imagen, video, catálogo y reconstrucción.
- **Captura / referencia:** cámara del sistema para foto y video, selector nativo de imágenes, vista previa de la foto real y reproducción del video grabado. Permisos solicitados al usar la cámara. Cancelar conserva la referencia anterior.
- **Selección:** muestra la imagen real elegida; área movible al tocar, puntos y máscara ilustrativa; reinicio y acceso a resultados de ejemplo.
- **Resultados:** búsqueda por nombre, filtro por modelos/referencias y orden por nombre o ranking de ejemplo.
- **Asset:** tres vistas ilustrativas, formatos, información de fuente y guardado en proyectos existentes o nuevos.
- **Proyectos:** crear, abrir, añadir y quitar assets. Estado compartido durante la sesión.
- **Ajustes:** apariencia sistema/claro/oscuro y estado de conexión.
- **Perfil:** estado sin sesión; cuenta aún sin conectar.
- **Reconstrucción:** servicio sin conectar; cinco estados explícitos de vista previa.

La captura y selección de imágenes son reales mediante `expo-image-picker`; el video se reproduce con `expo-video`. El archivo seleccionado se mantiene solo en memoria durante la sesión, sin subirse a ningún servidor. Android puede recuperar el resultado del selector tras recrear la actividad. La selección de fotogramas de video queda pendiente.

El catálogo, el ranking, las máscaras y las licencias siguen siendo demostrativos; no hay IA, descarga 3D, autenticación, persistencia o backend conectado. Los datos de proyectos se reinician al recargar. Los controles de servicio no disponible permanecen deshabilitados.

## Diseño y estructura

- `src/app/`: pantallas y layouts; Inicio usa `View`, las demás pantallas admiten scroll.
- `src/components/ui/kit.tsx`: controles, campos, modales y contenedor de pantalla.
- `src/components/floating-tabs.tsx`: barra flotante e indicador animado.
- `src/components/app-background.tsx`: degradado `#CD0EEA` hacia el fondo del tema.
- `src/theme/`: paletas y fuentes; claro `#FFFFFF`, oscuro `#120E1B`.
- `src/media/`: apertura del selector/cámara, referencia actual y permisos.
- `src/mocks/`: catálogo y estado local de proyectos.
- `assets/images/demo/`: seis ilustraciones SVG locales.

Usar Tailwind mediante `className` para nuevos estilos. Las clases Urbanist son `font-sans`, `font-sans-medium`, `font-sans-semibold`, `font-sans-bold`. Los colores de tema y dimensiones calculadas usan `style`. Usar iconos importados directamente de `lucide-react-native`.

La barra reproduce la referencia de cinco iconos sólidos blancos, sin etiquetas visibles: Inicio, Proyectos, Cámara, Ajustes y Perfil. Mantiene fondo `#0B0911`, círculo activo `#A805F4` y una curva superior que se desplaza con el círculo. Los iconos se elevan al seleccionarlos y las pantallas cambian con un fundido. Respeta las áreas seguras, admite teclado y lectores de pantalla y desactiva las transiciones cuando el sistema solicita reducir movimiento. Cámara reutiliza la captura existente; Perfil muestra el estado sin sesión.

## Validación

```bash
npx tsc --noEmit
npm run lint
npx expo export --platform android --platform web --output-dir /tmp/asset-finder-export
```

Revisar en dispositivo el recorrido completo, áreas seguras, teclado y Android Atrás. Las exportaciones verifican empaquetado; no sustituyen una prueba en Android. Ver `VALIDATION.md`.
