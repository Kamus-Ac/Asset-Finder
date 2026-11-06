import type { Asset, Project } from '@/types/domain';
export const assets: Asset[] = [
  { id: 'chair', name: 'Silla Forma', source: 'Catálogo de ejemplo', kind: 'chair', format: 'GLB · FBX', available: true, score: .94, description: 'Una silueta orgánica con acabado terracota y estructura de madera. Ideal para interiores contemporáneos.', license: 'CC0 · ejemplo, sin archivo distribuido' },
  { id: 'table', name: 'Mesa Nórdica', source: 'Colección de ejemplo', kind: 'table', format: 'GLB', available: true, score: .89, description: 'Mesa de roble con líneas sencillas y proporciones compactas.', license: 'CC BY · ejemplo' },
  { id: 'lamp', name: 'Lámpara Arco', source: 'Biblioteca de ejemplo', kind: 'lamp', format: 'Referencia', available: false, score: .86, description: 'Iluminación escultórica para una composición cálida. Solo referencia de catálogo.', license: 'Por confirmar' },
  { id: 'sofa', name: 'Sofá Modular', source: 'Colección de ejemplo', kind: 'sofa', format: 'GLB · OBJ', available: true, score: .82, description: 'Módulos suaves en verde salvia para espacios de encuentro.', license: 'CC0 · ejemplo' },
  { id: 'vase', name: 'Jarrón Terra', source: 'Biblioteca de ejemplo', kind: 'vase', format: 'GLB', available: true, score: .78, description: 'Cerámica de formas redondeadas y acabado mate.', license: 'CC BY · ejemplo' },
  { id: 'arch', name: 'Arco Mediterráneo', source: 'Catálogo de ejemplo', kind: 'arch', format: 'Referencia', available: false, score: .71, description: 'Elemento arquitectónico de estuco con arco de medio punto.', license: 'Por confirmar' },
];
export const projects: Project[] = [
  { id: 'studio', name: 'Estudio creativo', description: 'Materiales cálidos, ideas nuevas.', assetIds: ['chair', 'table', 'lamp'], updated: 'Hoy · ejemplo' },
  { id: 'living', name: 'Un lugar para estar', description: 'Una sala con carácter mediterráneo.', assetIds: ['sofa', 'vase', 'arch'], updated: 'Ayer · ejemplo' },
  { id: 'ideas', name: 'Ideas por explorar', description: 'El comienzo de tu próxima escena.', assetIds: [], updated: 'Sin assets · ejemplo' },
];
export const artwork = {
  chair: require('@/assets/images/demo/chair.svg'), table: require('@/assets/images/demo/table.svg'),
  lamp: require('@/assets/images/demo/lamp.svg'), sofa: require('@/assets/images/demo/sofa.svg'),
  vase: require('@/assets/images/demo/vase.svg'), arch: require('@/assets/images/demo/arch.svg'),
};
