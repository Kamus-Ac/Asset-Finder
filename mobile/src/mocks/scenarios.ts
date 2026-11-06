/** Content for the explicit interface demonstrations, never a processing response. */
export const referenceDemo = {
 imageName: 'silla-estudio.svg', videoName: 'estudio-recorrido.mp4',
 frames: ['00:00', '00:02', '00:04'], initialFrame: '00:02',
};
export const reconstructionScenarios = {
 'No disponible': ['Servicio no disponible', 'La viabilidad de SAM 3D Objects depende de validar el hardware y el servicio. No se puede solicitar una reconstrucción actualmente.'],
 'Pendiente': ['Solicitud pendiente · demo', 'Una futura solicitud aparecerá aquí mientras espera un recurso de procesamiento.'],
 'En proceso': ['Reconstrucción en proceso · demo', 'Aquí se mostrará el estado informado por el servidor. Sin progreso porcentual inventado.'],
 'Completado': ['Reconstrucción completada · demo', 'Vista ilustrativa del estado final. No se ha generado ni descargado ningún modelo 3D.'],
 'Fallido': ['No se pudo reconstruir · demo', 'La versión integrada mostrará la causa del fallo y las opciones para reintentar.'],
};
