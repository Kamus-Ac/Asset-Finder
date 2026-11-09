"""Entrada Python de IA; propuesta de integración descrita en INTERFAZ_P3.md."""

from io import BytesIO

from .segmentation import ServiceUnavailableError, segment


__all__ = ["ServiceUnavailableError", "segment", "mask_to_png", "embed", "search"]


def mask_to_png(mask):
    """Codifica ndarray bool H×W como bytes PNG L: fondo 0, objeto 255."""
    try:
        import numpy as np
        from PIL import Image
    except ImportError as error:
        raise ServiceUnavailableError("servicio no disponible: faltan NumPy o Pillow") from error
    if (not isinstance(mask, np.ndarray) or mask.dtype != np.bool_
            or mask.ndim != 2 or 0 in mask.shape):
        raise ValueError("mask: se requiere ndarray bool H×W con dimensiones positivas")
    output = BytesIO()
    Image.fromarray(mask.astype(np.uint8) * 255).save(output, format="PNG")
    return output.getvalue()


def embed(image, *, device="cpu"):
    """Reservada para DINOv2 en T12; nunca devuelve vectores ficticios."""
    raise ServiceUnavailableError("servicio no disponible: embedding DINOv2 pendiente (T12)")


def search(vector, k=5):
    """Reservada para búsqueda en T18; nunca devuelve coincidencias ficticias."""
    raise ServiceUnavailableError("servicio no disponible: búsqueda pendiente (T18)")
