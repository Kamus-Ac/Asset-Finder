/* Conector local optativo: el código solo permanece en memoria durante la sesión. */
(() => {
  const element = id => document.getElementById(`blender-${id}`);
  const ui = Object.fromEntries(['port', 'code', 'connect', 'disconnect', 'model', 'open', 'status'].map(id => [id, element(id)]));
  let session = null;
  let busy = false;
  let epoch = 0;
  let timer = null;

  function message(text, error = false) {
    ui.status.textContent = text;
    ui.status.className = error ? 'error' : '';
  }

  function draw() {
    ui.connect.disabled = busy || session !== null;
    ui.disconnect.disabled = busy || session === null;
    ui.port.disabled = ui.code.disabled = busy || session !== null;
    ui.open.disabled = busy || !session?.connected || Boolean(session?.task);
  }

  async function request(current, path, payload) {
    const response = await fetch(`${current.base}${path}`, {
      method: payload === undefined ? 'GET' : 'POST',
      headers: {
        Authorization: `Bearer ${current.token}`,
        ...(payload === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: payload === undefined ? undefined : JSON.stringify(payload),
      credentials: 'omit',
      cache: 'no-store',
      signal: AbortSignal.timeout(4000),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'El conector rechazó la solicitud.');
    return data;
  }

  function clear() {
    epoch += 1;
    clearTimeout(timer);
    session = null;
    ui.code.value = '';
    ui.model.textContent = 'Este envío usa el GLB que seleccionaste en Blender.';
  }

  async function poll(current, generation) {
    if (generation !== epoch || current !== session) return;
    try {
      const info = await request(current, '/session');
      if (generation !== epoch) return;
      current.connected = info.blender_connected;
      if (!current.connected) throw new Error('Blender dejó de responder. Revisa su ventana antes de volver a enviar.');
      if (current.task) {
        const task = await request(current, `/tasks/${current.task}`);
        if (generation !== epoch) return;
        const labels = {
          queued: 'Solicitud enviada; esperando a Blender…',
          awaiting_confirmation: 'Confirma la importación en la pestaña Asset Finder de Blender.',
          importing: 'Importando el modelo en Blender…',
          completed: 'Modelo importado en Blender.',
          cancelled: 'Importación rechazada en Blender.',
          failed: 'No se pudo importar. Revisa la escena y el aviso en Blender.',
        };
        message(task.message || labels[task.status] || 'Consultando importación…', task.status === 'failed');
        if (['completed', 'cancelled', 'failed'].includes(task.status)) current.task = null;
      }
      draw();
      timer = setTimeout(() => poll(current, generation), 1000);
    } catch (error) {
      if (generation !== epoch) return;
      clear();
      message(`${error.message} Si hubo un envío pendiente, comprueba Blender antes de repetirlo.`, true);
      draw();
    }
  }

  ui.connect.addEventListener('click', async () => {
    if (busy || session) return;
    const port = ui.port.valueAsNumber;
    const token = ui.code.value.trim();
    if (!Number.isInteger(port) || port < 1024 || port > 65535 || !token) {
      message('Introduce el puerto y el código copiados desde Blender.', true);
      return;
    }
    if (!['http://127.0.0.1:8765', 'http://localhost:8765'].includes(location.origin)) {
      message('Abre esta demo en http://127.0.0.1:8765 o http://localhost:8765 y autoriza ese mismo origen en Blender.', true);
      return;
    }
    busy = true;
    draw();
    const generation = ++epoch;
    const current = { base: `http://127.0.0.1:${port}`, token, task: null, connected: false };
    try {
      const info = await request(current, '/session');
      if (!info.blender_connected) throw new Error('El conector responde, pero Blender aún no está conectado.');
      current.connected = true;
      current.asset = info.asset;
      session = current;
      ui.code.value = '';
      ui.model.textContent = `${info.asset.name} · GLB local · ${(info.asset.size / 1024).toFixed(1)} KiB`;
      message('Conectado. Al enviar el modelo deberás confirmarlo dentro de Blender.');
      timer = setTimeout(() => poll(current, generation), 1000);
    } catch (error) {
      message(`No se pudo conectar: ${error.message} Comprueba la sesión y la página autorizada en Blender.`, true);
    } finally {
      busy = false;
      draw();
    }
  });

  ui.open.addEventListener('click', async () => {
    if (busy || !session?.connected || session.task) return;
    const current = session;
    const generation = epoch;
    busy = true;
    clearTimeout(timer);
    draw();
    try {
      // El mismo ID permite consultar/reintentar una solicitud sin importarla dos veces.
      const id = crypto.randomUUID();
      current.task = id;
      await request(current, '/imports', { asset_id: current.asset.asset_id, request_id: id });
      message('Enviado. Confirma la importación en Blender.');
    } catch (error) {
      if (generation === epoch) {
        clear();
        message(`No se pudo confirmar el envío: ${error.message} Revisa Blender antes de repetirlo.`, true);
      }
    } finally {
      busy = false;
      draw();
      if (current === session) timer = setTimeout(() => poll(current, generation), 300);
    }
  });

  ui.disconnect.addEventListener('click', async () => {
    if (busy || !session) return;
    busy = true;
    draw();
    const current = session;
    clear();
    try {
      await request(current, '/disconnect', {});
      message('Sesión cerrada. Para conectar otra vez, autoriza una sesión nueva en Blender.');
    } catch {
      message('Se borró la conexión de esta página. Cierra también la sesión desde Blender.', true);
    } finally {
      busy = false;
      draw();
    }
  });

  window.addEventListener('pagehide', clear);
  draw();
})();
