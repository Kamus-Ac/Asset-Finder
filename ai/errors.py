"""Errores de inferencia independientes del transporte HTTP."""

from functools import wraps
import sys

from .segmentation import ServiceUnavailableError


def memory_errors(function):
    @wraps(function)
    def wrapped(*args, **kwargs):
        try:
            return function(*args, **kwargs)
        except MemoryError as error:
            raise ServiceUnavailableError("servicio no disponible: memoria insuficiente") from error
        except RuntimeError as error:
            torch = sys.modules.get("torch")
            oom = getattr(torch, "OutOfMemoryError", None)
            if oom is not None and isinstance(error, oom):
                raise ServiceUnavailableError("servicio no disponible: memoria de inferencia insuficiente") from error
            raise
    return wrapped
