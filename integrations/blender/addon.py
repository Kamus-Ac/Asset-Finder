"""Asset Finder: importación GLB y conexión local autorizada con la demo IA."""

import json
from pathlib import Path
import struct

import bpy
from bpy.app.handlers import persistent
from bpy.props import EnumProperty, IntProperty, PointerProperty, StringProperty
from bpy_extras.io_utils import ImportHelper

from .bridge import Session


bl_info = {
    "name": "Asset Finder — Importar GLB",
    "author": "Asset Finder",
    "version": (0, 2, 0),
    "blender": (5, 0, 0),
    "location": "File > Import > Asset Finder (.glb)",
    "description": "Importa un GLB local a la escena activa",
    "category": "Import-Export",
}

MAX_FILE_BYTES = 100 * 1024 * 1024
SESSION = None
CONNECTION_MESSAGE = "Sesión cerrada."


def validate_glb(filepath):
    """Valida un GLB 2 autocontenido antes de entregarlo al importador oficial.

    No sustituye la validación de geometría/materiales del importador de Blender.
    Rechaza referencias externas incluso si el contenedor tiene extensión GLB.
    """
    if not str(filepath).strip():
        raise ValueError("Selecciona un archivo GLB.")
    path = Path(filepath).expanduser().resolve(strict=True)
    if not path.is_file():
        raise ValueError("La ruta debe corresponder a un archivo.")
    if path.suffix.lower() != ".glb":
        raise ValueError("Esta versión solo admite archivos .glb.")
    size = path.stat().st_size
    if size > MAX_FILE_BYTES:
        raise ValueError("El GLB supera el límite de 100 MiB.")
    with path.open("rb") as stream:
        header = stream.read(20)
        if len(header) != 20:
            raise ValueError("GLB incompleto: falta la cabecera o el bloque JSON.")
        magic, version, length, chunk_length, chunk_type = struct.unpack("<4sIIII", header)
        if magic != b"glTF" or version != 2 or length != size:
            raise ValueError("Cabecera GLB inválida; se requiere GLB versión 2.")
        if chunk_type != 0x4E4F534A or chunk_length > size - 20 or chunk_length % 4:
            raise ValueError("El primer bloque GLB debe ser JSON válido y alineado.")
        try:
            document = json.loads(stream.read(chunk_length).decode("utf-8"))
        except (UnicodeError, ValueError) as error:
            raise ValueError("El bloque JSON del GLB está dañado.") from error
    if not isinstance(document, dict):
        raise ValueError("El bloque JSON del GLB debe ser un objeto.")
    for kind in ("buffers", "images"):
        resources = document.get(kind, [])
        if not isinstance(resources, list):
            raise ValueError(f"Lista de recursos inválida: {kind}.")
        for resource in resources:
            if not isinstance(resource, dict):
                raise ValueError(f"Recurso inválido: {kind}.")
            uri = resource.get("uri")
            if uri is not None and (not isinstance(uri, str) or not uri.startswith("data:")):
                raise ValueError("Se requiere un GLB autocontenido, sin recursos externos.")
    return path


def import_glb(filepath):
    """Importa en el hilo principal de Blender y devuelve los objetos nuevos."""
    path = validate_glb(filepath)
    existing = {obj.as_pointer() for obj in bpy.data.objects}
    try:
        status = bpy.ops.import_scene.gltf(filepath=str(path))
    except RuntimeError as error:
        raise ValueError(f"Blender no pudo importar el GLB: {error}") from error
    if "FINISHED" not in status:
        raise ValueError("Blender canceló la importación del GLB.")
    created = tuple(obj for obj in bpy.data.objects if obj.as_pointer() not in existing)
    if not created:
        raise ValueError("El GLB no contiene objetos importables en su escena.")
    return created


class ASSETFINDER_OT_import_glb(bpy.types.Operator, ImportHelper):
    """Importar un modelo GLB local a la escena activa"""

    bl_idname = "asset_finder.import_glb"
    bl_label = "Asset Finder: importar GLB"
    bl_options = {"REGISTER", "UNDO"}

    filename_ext = ".glb"
    filter_glob: StringProperty(default="*.glb;*.GLB", options={"HIDDEN"})

    @classmethod
    def poll(cls, context):
        return context.scene is not None and context.mode == "OBJECT"

    def execute(self, context):
        try:
            objects = import_glb(self.filepath)
        except (OSError, ValueError) as error:
            self.report({"ERROR"}, str(error))
            return {"CANCELLED"}
        except Exception as error:
            # Blender puede propagar errores de materiales/extensiones del GLB.
            self.report({"ERROR"}, f"Error del importador ({type(error).__name__}): {error}")
            return {"CANCELLED"}
        self.report({"INFO"}, f"GLB importado: {len(objects)} objeto(s).")
        return {"FINISHED"}


def menu_import(self, context):
    self.layout.operator(ASSETFINDER_OT_import_glb.bl_idname, text="Asset Finder (.glb)")


def redraw():
    for window in bpy.context.window_manager.windows:
        for area in window.screen.areas:
            if area.type == "VIEW_3D":
                area.tag_redraw()


def stop_session(message="Sesión cerrada."):
    global SESSION, CONNECTION_MESSAGE
    if SESSION is not None:
        SESSION.close()
        SESSION = None
    if bpy.app.timers.is_registered(poll_session):
        bpy.app.timers.unregister(poll_session)
    CONNECTION_MESSAGE = message
    redraw()


def poll_session():
    global CONNECTION_MESSAGE
    if SESSION is None:
        return None
    try:
        SESSION.poll()
        CONNECTION_MESSAGE = "Confirma o rechaza el modelo solicitado." if SESSION.pending else (
            f"Conectado en 127.0.0.1:{SESSION.port}" if SESSION.port else "Iniciando conector…")
        redraw()
        return 0.5
    except Exception as error:
        stop_session(str(error))
        return None


@persistent
def before_load(_unused):
    stop_session("Sesión cerrada al cambiar de archivo Blender.")


class ASSETFINDER_PG_connection(bpy.types.PropertyGroup):
    model: StringProperty(name="GLB de prueba", subtype="FILE_PATH", options={"SKIP_SAVE"})
    origin: EnumProperty(name="Página autorizada", items=[
        ("http://127.0.0.1:8765", "http://127.0.0.1:8765", "Demo IA local"),
        ("http://localhost:8765", "http://localhost:8765", "Demo IA local"),
    ], options={"SKIP_SAVE"})
    port: IntProperty(name="Puerto del conector", default=8766, min=1024, max=65535, options={"SKIP_SAVE"})


class ASSETFINDER_OT_connect(bpy.types.Operator):
    """Autorizar la página indicada y registrar este GLB durante 30 minutos"""
    bl_idname = "asset_finder.connect"
    bl_label = "Autorizar demo y conectar"

    def execute(self, context):
        global SESSION, CONNECTION_MESSAGE
        if SESSION is not None:
            self.report({"ERROR"}, "Cierra la sesión actual antes de abrir otra.")
            return {"CANCELLED"}
        settings = context.window_manager.asset_finder_connection
        try:
            model = validate_glb(bpy.path.abspath(settings.model))
            SESSION = Session(model, settings.origin, settings.port)
            CONNECTION_MESSAGE = "Iniciando conector…"
            bpy.app.timers.register(poll_session, first_interval=0.2)
        except Exception as error:
            stop_session(str(error))
            self.report({"ERROR"}, str(error))
            return {"CANCELLED"}
        return {"FINISHED"}


class ASSETFINDER_OT_disconnect(bpy.types.Operator):
    bl_idname = "asset_finder.disconnect"
    bl_label = "Cerrar sesión"

    def execute(self, context):
        stop_session()
        return {"FINISHED"}


class ASSETFINDER_OT_copy_code(bpy.types.Operator):
    bl_idname = "asset_finder.copy_code"
    bl_label = "Copiar código de conexión"

    def execute(self, context):
        if SESSION is None or SESSION.port is None:
            return {"CANCELLED"}
        context.window_manager.clipboard = SESSION.token
        self.report({"INFO"}, "Pega el código en la demo IA; caduca al cerrar la sesión.")
        return {"FINISHED"}


class ASSETFINDER_OT_accept_import(bpy.types.Operator):
    """Importar el GLB registrado en la escena actual, con posibilidad de deshacer"""
    bl_idname = "asset_finder.accept_import"
    bl_label = "Confirmar importación"
    bl_options = {"REGISTER", "UNDO"}

    @classmethod
    def poll(cls, context):
        return SESSION is not None and SESSION.pending is not None and context.mode == "OBJECT"

    def execute(self, context):
        global CONNECTION_MESSAGE
        session = SESSION
        try:
            session.poll()
            model = session.verified_model()
            session.result("importing", "Blender está importando el modelo.")
            session.heartbeat(busy=True)
            objects = import_glb(model)
            session.result("completed", f"Importado en Blender: {len(objects)} objeto(s).")
            session.heartbeat()
            CONNECTION_MESSAGE = "Importación completada."
        except Exception as error:
            if session is not None and session.pending:
                session.result("failed", "No se pudo importar. Revisa el aviso y la escena en Blender.")
            self.report({"ERROR"}, str(error))
            return {"CANCELLED"}
        self.report({"INFO"}, CONNECTION_MESSAGE)
        redraw()
        return {"FINISHED"}


class ASSETFINDER_OT_reject_import(bpy.types.Operator):
    bl_idname = "asset_finder.reject_import"
    bl_label = "Rechazar"

    def execute(self, context):
        if SESSION is None or SESSION.pending is None:
            return {"CANCELLED"}
        SESSION.result("cancelled", "Importación rechazada en Blender.")
        redraw()
        return {"FINISHED"}


class ASSETFINDER_PT_connection(bpy.types.Panel):
    bl_label = "Asset Finder · demo local"
    bl_idname = "ASSETFINDER_PT_connection"
    bl_space_type = "VIEW_3D"
    bl_region_type = "UI"
    bl_category = "Asset Finder"

    def draw(self, context):
        layout = self.layout
        settings = context.window_manager.asset_finder_connection
        if SESSION is None:
            layout.prop(settings, "model")
            layout.prop(settings, "origin")
            layout.prop(settings, "port")
            layout.label(text="Autoriza solo el GLB seleccionado.")
            layout.operator("asset_finder.connect")
        else:
            layout.label(text=SESSION.asset["name"])
            layout.label(text=f"GLB · {SESSION.asset['size'] / 1024:.1f} KiB · archivo local")
            layout.label(text=settings.origin)
            layout.operator("asset_finder.copy_code")
            layout.operator("asset_finder.disconnect")
            if SESSION.pending:
                box = layout.box()
                box.label(text="La demo solicita importar este GLB.")
                box.label(text="Destino: " + context.scene.name)
                box.operator("asset_finder.accept_import")
                box.operator("asset_finder.reject_import")
        layout.label(text=CONNECTION_MESSAGE)


CLASSES = (ASSETFINDER_OT_import_glb, ASSETFINDER_PG_connection,
           ASSETFINDER_OT_connect, ASSETFINDER_OT_disconnect, ASSETFINDER_OT_copy_code,
           ASSETFINDER_OT_accept_import, ASSETFINDER_OT_reject_import, ASSETFINDER_PT_connection)


def register():
    for cls in CLASSES:
        bpy.utils.register_class(cls)
    bpy.types.WindowManager.asset_finder_connection = PointerProperty(type=ASSETFINDER_PG_connection)
    bpy.types.TOPBAR_MT_file_import.append(menu_import)
    bpy.app.handlers.load_pre.append(before_load)


def unregister():
    stop_session()
    if before_load in bpy.app.handlers.load_pre:
        bpy.app.handlers.load_pre.remove(before_load)
    bpy.types.TOPBAR_MT_file_import.remove(menu_import)
    del bpy.types.WindowManager.asset_finder_connection
    for cls in reversed(CLASSES):
        bpy.utils.unregister_class(cls)


if __name__ == "__main__":
    raise RuntimeError("Instala el ZIP de Asset Finder o ejecuta test_import.py con Blender.")
