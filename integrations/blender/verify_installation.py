"""Instala y prueba el ZIP en un proceso/perfil de Blender aislado.

Se invoca con Python normal; --gui añade una comprobación del historial undo/redo.
No guarda preferencias reales ni modifica una instancia de Blender ya abierta.
"""

import argparse
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import traceback

# Blender no añade la carpeta del script a sys.path de forma automática.
sys.path.insert(0, str(Path(__file__).resolve().parent))
from package_addon import BASE, MODULE, build_package


def worker(profile, package, gui, connection=False):
    import addon_utils
    import bpy
    from verify_blender import write_glb

    report_path = profile / "report.json"
    report = {"blender": bpy.app.version_string, "platform": sys.platform,
              "mode": "connection" if connection else "gui" if gui else "background", "checks": [], "success": False}
    # También aislar el archivo de recuperación que Blender escribe al salir.
    bpy.context.preferences.filepaths.temporary_directory = str(profile / "temporary")
    bpy.context.preferences.filepaths.use_auto_save_temporary_files = False

    def finish(error=None):
        if error is not None:
            report["error"] = str(error)
            traceback.print_exc()
        else:
            report["success"] = True
        module = sys.modules.get(MODULE)
        if module is not None:
            module.stop_session()
        report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
        if gui:
            bpy.ops.wm.quit_blender()

    def check(condition, message):
        if not condition:
            raise AssertionError(message)
        report["checks"].append(message)

    def snapshot():
        return {obj.name: tuple(value for row in obj.matrix_world for value in row)
                for obj in bpy.context.scene.objects}

    def install_and_import():
        scripts = Path(bpy.utils.user_resource("SCRIPTS", create=True)).resolve()
        check(scripts == (profile / "scripts").resolve(), "Perfil de instalación aislado")
        check(bpy.ops.preferences.addon_install(filepath=str(package), overwrite=False) == {"FINISHED"},
              "ZIP instalado por el operador oficial")
        installed = scripts / "addons" / MODULE / "__init__.py"
        check(installed.read_bytes() == (BASE / "addon.py").read_bytes(), "Código instalado idéntico al origen")
        check(bpy.ops.preferences.addon_enable(module=MODULE) == {"FINISHED"}, "Add-on activado")
        check(addon_utils.check(MODULE) == (True, True), "Blender reconoce el módulo instalado")
        before = snapshot()
        path = write_glb(profile / "triangle.glb")
        if gui:
            bpy.ops.ed.undo_push(message="Antes de importar Asset Finder")
        check(bpy.ops.asset_finder.import_glb("EXEC_DEFAULT", True, filepath=str(path)) == {"FINISHED"},
              "Importación desde el add-on instalado")
        after = snapshot()
        check(len(after) == len(before) + 1 and all(after.get(k) == v for k, v in before.items()),
              "Objetos y transformaciones anteriores conservados")
        check(len(bpy.data.objects["AF_Triangle"].data.vertices) == 3, "Geometría real importada")
        return before, after

    def disable_and_enable():
        before = snapshot()
        check(bpy.ops.preferences.addon_disable(module=MODULE) == {"FINISHED"}, "Add-on desactivado")
        check(not addon_utils.check(MODULE)[1], "Operador retirado al desactivar")
        check(snapshot() == before, "Desactivación conserva la escena")
        check(bpy.ops.preferences.addon_enable(module=MODULE) == {"FINISHED"}, "Add-on reactivado")
        check(bpy.ops.asset_finder.import_glb.poll(), "Operador disponible después de reactivar")
        bpy.ops.preferences.addon_disable(module=MODULE)

    if not gui:
        try:
            install_and_import()
            disable_and_enable()
            finish()
        except Exception as error:
            finish(error)
            raise
        return

    # Cada etapa corre en un tick de la interfaz, con el hilo principal disponible.
    state = {}

    def http(path, payload=None):
        from urllib.request import Request, urlopen
        request = Request(f"http://127.0.0.1:{state['port']}{path}",
                          data=None if payload is None else json.dumps(payload).encode(),
                          headers={"Origin": "http://127.0.0.1:8765",
                                   "Authorization": "Bearer " + state["token"], "Content-Type": "application/json"})
        with urlopen(request, timeout=3) as response:
            return json.load(response)

    def submit():
        from uuid import uuid4
        state["task"] = str(uuid4())
        return http("/imports", {"asset_id": "demo-local", "request_id": state["task"]})

    def tick():
        try:
            stage = state.get("stage", 0)
            if stage == 0:
                state["before"], state["after"] = install_and_import()
            elif stage == 1:
                check(bpy.ops.ed.undo() == {"FINISHED"}, "Deshacer ejecutado")
                check(snapshot() == state["before"], "Deshacer restaura la escena previa")
            elif stage == 2:
                check(bpy.ops.ed.redo() == {"FINISHED"}, "Rehacer ejecutado")
                check(snapshot() == state["after"], "Rehacer recupera el modelo importado")
            elif connection and stage == 3:
                import socket
                with socket.socket() as sock:
                    sock.bind(("127.0.0.1", 0))
                    port = sock.getsockname()[1]
                settings = bpy.context.window_manager.asset_finder_connection
                settings.model = str(profile / "triangle.glb")
                settings.origin = "http://127.0.0.1:8765"
                settings.port = port
                check(bpy.ops.asset_finder.connect() == {"FINISHED"}, "Conector iniciado desde el add-on instalado")
            elif connection and stage == 4:
                session = sys.modules[MODULE].SESSION
                if session is None:
                    raise RuntimeError("No se pudo iniciar el conector")
                session.poll()
                if session.port is None:
                    state["wait"] = state.get("wait", 0) + 1
                    if state["wait"] > 20:
                        raise RuntimeError("El conector no respondió a tiempo")
                    return 0.5
                state["port"], state["token"] = session.port, session.token
                check(http("/session")["blender_connected"], "Sesión HTTP conectada a Blender")
                state["connection_before"] = snapshot()
                check(submit()["status"] == "queued", "Solicitud HTTP aceptada sin importar todavía")
            elif connection and stage == 5:
                session = sys.modules[MODULE].SESSION
                session.poll()
                check(snapshot() == state["connection_before"], "La web no importa sin confirmación local")
                check(http(f"/tasks/{state['task']}")["status"] == "awaiting_confirmation", "Confirmación local solicitada")
                check(bpy.ops.asset_finder.reject_import() == {"FINISHED"}, "Rechazo desde Blender")
                check(http(f"/tasks/{state['task']}")["status"] == "cancelled", "Rechazo comunicado por HTTP")
                submit()
            elif connection and stage == 6:
                sys.modules[MODULE].SESSION.poll()
                check(bpy.ops.asset_finder.accept_import("EXEC_DEFAULT", True) == {"FINISHED"}, "Importación confirmada dentro de Blender")
                check(http(f"/tasks/{state['task']}")["status"] == "completed", "Importación real comunicada como completada")
                state["connection_after"] = snapshot()
                check(len(state["connection_after"]) == len(state["connection_before"]) + 1, "HTTP produjo un único objeto nuevo")
            elif connection and stage == 7:
                bpy.ops.ed.undo()
                check(snapshot() == state["connection_before"], "Envío HTTP se puede deshacer")
            elif connection and stage == 8:
                bpy.ops.ed.redo()
                check(snapshot() == state["connection_after"], "Envío HTTP se puede rehacer")
            elif connection and stage == 9:
                http("/disconnect", {})
            elif connection and stage == 10 and sys.modules[MODULE].SESSION is not None:
                return 0.5
            else:
                if connection:
                    check(sys.modules[MODULE].SESSION is None, "Sesión revocada y proceso local cerrado")
                disable_and_enable()
                finish()
                return None
            state["stage"] = stage + 1
            return 0.5
        except Exception as error:
            finish(error)
            return None

    bpy.app.timers.register(tick, first_interval=1.0)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--blender", default="blender", help="Ejecutable Blender, admite rutas con espacios")
    parser.add_argument("--numpy-path", type=Path, help="Solo si esta instalación necesita una ruta NumPy externa")
    parser.add_argument("--gui", action="store_true", help="Abrir una ventana temporal para probar deshacer/rehacer")
    parser.add_argument("--connection", action="store_true", help="Probar HTTP real, confirmación, rechazo y deshacer en la ventana de Blender")
    args = parser.parse_args()
    args.gui = args.gui or args.connection
    mode = "connection" if args.connection else "gui" if args.gui else "background"
    report_output = BASE / "dist" / f"installation-{mode}.json"
    report_output.parent.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="asset-finder-install-") as temporary:
        profile = Path(temporary)
        for name in ("config", "scripts", "datafiles", "extensions", "temporary"):
            (profile / name).mkdir()
        package = build_package(profile / "asset_finder_blender.zip")
        env = os.environ.copy()
        env["BLENDER_USER_RESOURCES"] = str(profile)
        for key in ("CONFIG", "SCRIPTS", "DATAFILES", "EXTENSIONS"):
            env[f"BLENDER_USER_{key}"] = str(profile / key.lower())
        if args.numpy_path:
            env["ASSET_FINDER_TEST_NUMPY"] = str(args.numpy_path.resolve())
        else:
            env.pop("ASSET_FINDER_TEST_NUMPY", None)
        command = [args.blender, "--factory-startup", "--offline-mode", "--python-exit-code", "1"]
        command += ["--no-window-focus", "--window-geometry", "50", "50", "800", "600"] if args.gui else ["--background"]
        command += ["--python", str(Path(__file__).resolve()), "--", "worker", str(profile), str(package), mode]
        try:
            process = subprocess.run(command, env=env, timeout=90, check=False)
        except (OSError, subprocess.TimeoutExpired) as error:
            report_output.write_text(json.dumps({"mode": mode, "success": False, "error": str(error)}, indent=2),
                                     encoding="utf-8")
            raise
        report_path = profile / "report.json"
        report = json.loads(report_path.read_text(encoding="utf-8")) if report_path.is_file() else {
            "mode": mode, "success": False, "error": "Blender terminó sin informe de comprobaciones."
        }
        report["exit_code"] = process.returncode
        report_output.write_text(json.dumps(report, indent=2), encoding="utf-8")
        if process.returncode != 0 or not report["success"]:
            raise RuntimeError(f"Falló la prueba de instalación; informe: {report_output}")
        print(f"Instalación {mode}: {len(report['checks'])} comprobaciones aprobadas. Informe: {report_output}")


if __name__ == "__main__":
    if "--" in sys.argv:
        arguments = sys.argv[sys.argv.index("--") + 1:]
        if len(arguments) != 4 or arguments[0] != "worker" or arguments[3] not in ("gui", "background", "connection"):
            raise RuntimeError("Argumentos internos de prueba inválidos.")
        numpy_path = os.environ.get("ASSET_FINDER_TEST_NUMPY")
        if numpy_path:
            sys.path.insert(0, numpy_path)
        worker(Path(arguments[1]), Path(arguments[2]), arguments[3] != "background", arguments[3] == "connection")
    else:
        main()
