# Herramientas del entorno

Ejecutar desde la raíz del repositorio:

```bash
python3 -I ai/scripts/diagnostico_servidor.py
bash ai/scripts/preparar_gpu.sh .venv-gpu
```

El diagnóstico usa solo la biblioteca estándar y no instala paquetes. También
puede copiarse por separado a otro equipo y ejecutarse con `python3 -I diagnostico_servidor.py`.

El segundo comando instala la combinación GPU aprobada **en la MSI**, después de
comprobar equipo, versiones y entorno. No ejecutarlo como diagnóstico local.
Ver [propuesta GPU](../docs/PROPUESTA_ENTORNO.md). Los locks continúan en `ai/`.
