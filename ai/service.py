"""Entrada Python de IA; propuesta de integración descrita en INTERFAZ_P3.md."""

from io import BytesIO

from .segmentation import ServiceUnavailableError, segment
from .embedding import embed
from .search import search


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


