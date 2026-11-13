"""Server-side SAM/DINO jobs shared by web and mobile clients.

Single-process worker queue. Job reports/artifacts persist; unfinished jobs are
marked failed after restart, rather than pretending to resume inference.
"""
import asyncio
from concurrent.futures import ThreadPoolExecutor
from io import BytesIO
import json
import logging
import os
from pathlib import Path
from threading import BoundedSemaphore, RLock
from typing import Literal
from uuid import UUID, uuid4

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from PIL import Image
from pydantic import BaseModel, ConfigDict, Field, model_validator

from ai.segmentation import ServiceUnavailableError

from .catalog import discover, download_images
from .media import image_path

router = APIRouter(tags=["visual-search"])
logger = logging.getLogger(__name__)
EXECUTOR = ThreadPoolExecutor(max_workers=1, thread_name_prefix="visual-search")
SLOTS = BoundedSemaphore(8)
LOCK = RLock()
ACTIVE = set()


class Point(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)
    x: float = Field(ge=0)
    y: float = Field(ge=0)
    label: Literal[0, 1]


class Selection(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)
    media_id: UUID
    image_width: int = Field(gt=0, strict=True)
    image_height: int = Field(gt=0, strict=True)
    box_xyxy: tuple[float, float, float, float] | None = None
    points: list[Point] = Field(default_factory=list, max_length=100)

    @model_validator(mode="after")
    def valid_selection(self):
        if self.box_xyxy is None and not self.points:
            raise ValueError("Selecciona un rectángulo o al menos un punto.")
        if self.box_xyxy is not None:
            x1, y1, x2, y2 = self.box_xyxy
            if not (0 <= x1 < x2 <= self.image_width and 0 <= y1 < y2 <= self.image_height):
                raise ValueError("Rectángulo fuera de la imagen.")
        if any(p.x >= self.image_width or p.y >= self.image_height for p in self.points):
            raise ValueError("Punto fuera de la imagen.")
        return self


class SearchRequest(Selection):
    q: str = Field(min_length=1, max_length=100)
    sources: list[Literal["sketchfab", "polyhaven"]] = Field(
        default_factory=lambda: ["sketchfab", "polyhaven"], min_length=1, max_length=2)
    # None compares all retrieved candidates. Paging is a separate explicit budget.
    candidate_limit: int | None = Field(default=None, gt=0, strict=True)
    max_pages: int = Field(default=3, ge=1, le=100, strict=True)
    k: int = Field(default=5, gt=0, strict=True)

    @model_validator(mode="after")
    def valid_search(self):
        self.q = self.q.strip()
        if not self.q:
            raise ValueError("Describe el objeto que quieres buscar.")
        if len(set(self.sources)) != len(self.sources):
            raise ValueError("Las fuentes no deben repetirse.")
        return self


def jobs_root():
    return Path(os.environ.get("ASSET_FINDER_JOBS_DIR", Path(__file__).resolve().parents[1] / "data/jobs"))


def report_path(task_id):
    return jobs_root() / str(task_id) / "task.json"


def read_report(task_id):
    path = report_path(task_id)
    if not path.is_file():
        raise HTTPException(404, "Tarea no encontrada.")
    return json.loads(path.read_text())


def update_report(task_id, **fields):
    with LOCK:
        path = report_path(task_id)
        report = json.loads(path.read_text()) if path.exists() else {"task_id": str(task_id)}
        report.update(fields)
        path.parent.mkdir(parents=True, exist_ok=True)
        temporary = path.with_suffix(".tmp")
        temporary.write_text(json.dumps(report, ensure_ascii=False, allow_nan=False))
        temporary.replace(path)
        return report


def png(image):
    output = BytesIO()
    image.save(output, "PNG")
    return output.getvalue()


def execute(task_id, request, kind):
    try:
        from ai.service import candidates_from_export, mask_to_png, run_search, segment
        device = os.environ.get("ASSET_FINDER_AI_DEVICE", "cpu")
        if device not in ("cpu", "cuda"):
            raise ServiceUnavailableError("Dispositivo no disponible")
        if device == "cpu":
            import torch
            torch.set_num_threads(int(os.environ.get("ASSET_FINDER_AI_THREADS", "2")))
        with Image.open(image_path(request.media_id)) as stored:
            image = stored.convert("RGB")
        points = [p.model_dump() for p in request.points] or None
        directory = report_path(task_id).parent
        if kind == "segmentation":
            update_report(task_id, status="running", stage="segmenting")
            mask, score = segment(image, request.box_xyxy, points, device=device)
            (directory / "mask.png").write_bytes(mask_to_png(mask))
            result = {"mask_url": f"/tasks/{task_id}/files/mask.png", "segmentation_score": float(score),
                      "image_width": image.width, "image_height": image.height}
        else:
            update_report(task_id, status="running", stage="discovering")
            payload = asyncio.run(discover(request.q, request.sources, request.candidate_limit, request.max_pages))
            if not payload["results"]:
                raise ValueError("Las fuentes no devolvieron candidatos. Prueba otra descripción.")
            update_report(task_id, stage="downloading")
            images, download_warnings = asyncio.run(download_images(payload["results"]))
            if not images:
                raise ServiceUnavailableError("Ningún candidato tiene una miniatura accesible")
            candidates = candidates_from_export(payload, images)
            update_report(task_id, stage="comparing")
            outcome = run_search(image, candidates, box_xyxy=request.box_xyxy, points=points,
                                 k=request.k, device=device, cache_dir=jobs_root().parent / "ai-cache")
            (directory / "mask.png").write_bytes(mask_to_png(outcome.mask))
            (directory / "crop.png").write_bytes(png(outcome.crop))
            result = outcome.report()
            result.update(query=request.q, sources=payload["sources"],
                          mask_url=f"/tasks/{task_id}/files/mask.png",
                          crop_url=f"/tasks/{task_id}/files/crop.png",
                          image_width=image.width, image_height=image.height)
            result["warnings"] = payload["warnings"] + download_warnings + result["warnings"]
        update_report(task_id, status="completed", stage="completed", result=result, error=None)
    except HTTPException as error:
        update_report(task_id, status="failed", stage="failed", error={"code": error.status_code, "message": str(error.detail)})
    except ValueError as error:
        update_report(task_id, status="failed", stage="failed", error={"code": 422, "message": str(error)})
    except (ServiceUnavailableError, ImportError):
        logger.exception("Recursos IA no disponibles para tarea %s", task_id)
        update_report(task_id, status="failed", stage="failed", error={"code": 503, "message": "No se pudo ejecutar IA. Revisa los recursos y el entorno del servidor."})
    except Exception:
        logger.exception("Falló tarea %s", task_id)
        update_report(task_id, status="failed", stage="failed", error={"code": 500, "message": "Falló la tarea; consulta el registro del servidor."})
    finally:
        with LOCK:
            ACTIVE.discard(task_id)
        SLOTS.release()


def enqueue(request, kind):
    with Image.open(image_path(request.media_id)) as image:
        if image.size != (request.image_width, request.image_height):
            raise HTTPException(422, "Las dimensiones deben coincidir con la referencia guardada.")
    if not SLOTS.acquire(blocking=False):
        raise HTTPException(429, "La cola está llena. Reintenta más tarde.", headers={"Retry-After": "10"})
    task_id = uuid4()
    try:
        with LOCK:
            ACTIVE.add(task_id)
            report = update_report(task_id, status="queued", stage="queued", result=None, error=None)
            EXECUTOR.submit(execute, task_id, request, kind)
        return report
    except Exception:
        ACTIVE.discard(task_id)
        SLOTS.release()
        raise


@router.post("/searches", status_code=202)
def create_search(request: SearchRequest):
    return enqueue(request, "search")


@router.post("/segmentations", status_code=202)
def create_segmentation(request: Selection):
    return enqueue(request, "segmentation")


@router.get("/tasks/{task_id}")
def get_task(task_id: UUID):
    with LOCK:
        report = read_report(task_id)
        if report["status"] in ("queued", "running") and task_id not in ACTIVE:
            report = update_report(task_id, status="failed", stage="failed", error={
                "code": 503, "message": "El servidor se reinició. Envía la tarea de nuevo."})
        return report


@router.get("/tasks/{task_id}/files/{filename}")
def get_artifact(task_id: UUID, filename: Literal["mask.png", "crop.png"]):
    report = read_report(task_id)
    path = report_path(task_id).parent / filename
    if report["status"] != "completed" or not path.is_file():
        raise HTTPException(404, "Resultado no disponible.")
    return FileResponse(path, media_type="image/png")
