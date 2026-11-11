import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, PointerEvent } from 'react'
import './VisualSearch.css'

type Box = [number, number, number, number]
type Source = 'sketchfab' | 'polyhaven'
type Result = {
  asset_id: string; name: string | null; source: Source; source_url: string
  thumbnail_url: string; similarity_score: number; license: string | null
}
type Comparison = {
  results: Result[]; mask_url: string; crop_url: string; warnings: unknown[]
  comparison: { compared: number; available: number }; timings: { total_seconds: number }
}
type Task = {
  task_id: string; status: 'queued' | 'running' | 'completed' | 'failed'; stage: string
  result: Comparison | null; error: { message: string } | null
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, init)
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const detail = data?.detail
    throw new Error(typeof detail === 'string' ? detail : Array.isArray(detail)
      ? detail.map((item: { msg: string }) => item.msg).join('; ')
      : 'No se pudo conectar con el servidor. Comprueba que el backend esté activo.')
  }
  return data as T
}

async function normalize(url: string): Promise<string> {
  const image = new Image()
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error('No se pudo abrir la imagen'))
    image.src = url
  })
  if (image.width * image.height > 20_000_000) throw new Error('La imagen supera los 20 megapíxeles')
  const scale = Math.min(1, 1024 / Math.max(image.width, image.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(image.width * scale))
  canvas.height = Math.max(1, Math.round(image.height * scale))
  canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/png')
}

const STAGES: Record<string, string> = {
  queued: 'En cola…', discovering: 'Buscando modelos en las fuentes externas…',
  downloading: 'Descargando miniaturas de los candidatos…', comparing: 'Segmentando con SAM y comparando con DINO…',
}

export default function VisualSearch() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const start = useRef<[number, number] | null>(null)
  const controller = useRef<AbortController | null>(null)
  const [image, setImage] = useState('')
  const [box, setBox] = useState<Box | null>(null)
  const [query, setQuery] = useState('')
  const [sources, setSources] = useState<Source[]>(['sketchfab', 'polyhaven'])
  const [limit, setLimit] = useState<number | ''>('')
  const [pages, setPages] = useState<number | ''>(3)
  const [topK, setTopK] = useState<number | ''>(5)
  const [busy, setBusy] = useState(false)
  const [stage, setStage] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState<Comparison | null>(null)

  useEffect(() => () => { controller.current?.abort() }, [])
  useEffect(() => {
    if (!image) return
    let cancelled = false
    const picture = new Image()
    picture.onload = () => {
      const canvas = canvasRef.current
      if (!canvas || cancelled) return
      canvas.width = picture.width; canvas.height = picture.height
      const context = canvas.getContext('2d')!
      context.drawImage(picture, 0, 0)
      if (box) {
        context.strokeStyle = '#caffca'; context.lineWidth = 4
        context.strokeRect(box[0], box[1], box[2] - box[0], box[3] - box[1])
      }
    }
    picture.src = image
    return () => { cancelled = true }
  }, [image, box])

  function point(event: PointerEvent<HTMLCanvasElement>): [number, number] {
    const canvas = event.currentTarget, rect = canvas.getBoundingClientRect()
    return [Math.max(0, Math.min(canvas.width, (event.clientX - rect.left) * canvas.width / rect.width)),
      Math.max(0, Math.min(canvas.height, (event.clientY - rect.top) * canvas.height / rect.height))]
  }

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setBusy(true); setError(''); setResult(null); setBox(null); setStage('Preparando imagen…')
    const url = URL.createObjectURL(file)
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error('La imagen supera los 10 MiB')
      setImage(await normalize(url))
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Imagen inválida') }
    finally { URL.revokeObjectURL(url); setBusy(false) }
  }

  const positive = (value: number | '') => typeof value === 'number' && Number.isInteger(value) && value > 0
  const valid = image && box && query.trim() && sources.length && positive(topK)
    && positive(pages) && Number(pages) <= 100 && (limit === '' || positive(limit))
  async function compare() {
    if (!valid || busy || !canvasRef.current) return
    const abort = new AbortController()
    controller.current = abort
    setBusy(true); setError(''); setResult(null); setStage('Subiendo referencia…')
    try {
      const blob = await (await fetch(image)).blob()
      const form = new FormData()
      form.append('file', blob, 'referencia.png')
      const media = await request<{ media_id: string; width: number; height: number }>('/media', {
        method: 'POST', body: form, signal: abort.signal,
      })
      let task = await request<Task>('/searches', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: abort.signal,
        body: JSON.stringify({ media_id: media.media_id, image_width: media.width, image_height: media.height,
          box_xyxy: box, q: query.trim(), sources, k: topK, candidate_limit: limit === '' ? null : limit, max_pages: pages }),
      })
      while (task.status === 'queued' || task.status === 'running') {
        setStage(STAGES[task.stage] || 'Procesando…')
        await new Promise(resolve => setTimeout(resolve, 1500))
        if (abort.signal.aborted) return
        task = await request<Task>(`/tasks/${task.task_id}`, { signal: abort.signal })
      }
      if (task.status === 'failed') throw new Error(task.error?.message || 'Falló la búsqueda')
      setResult(task.result)
    } catch (cause) {
      if (!abort.signal.aborted) setError(cause instanceof Error ? cause.message : 'Falló la comparación')
    } finally { if (!abort.signal.aborted) setBusy(false) }
  }

  return <section className="visual-search">
    <header><h1>Asset Finder · búsqueda visual</h1><p>Sube una imagen, selecciona el objeto y describe qué modelo buscas.</p></header>
    <div className="visual-controls">
      <input type="file" accept="image/jpeg,image/png,image/webp" aria-label="Subir referencia" disabled={busy} onChange={event => void upload(event)} />
      <label>Objeto a buscar<input type="text" maxLength={100} placeholder="Ej.: silla de madera / wooden chair" value={query} disabled={busy} onChange={event => { setQuery(event.target.value); setResult(null) }} /></label>
      {(['sketchfab', 'polyhaven'] as Source[]).map(source => <label key={source}>
        <span><input type="checkbox" checked={sources.includes(source)} disabled={busy} onChange={event => {
          setSources(current => event.target.checked ? [...current, source] : current.filter(item => item !== source)); setResult(null)
        }} />{source === 'polyhaven' ? 'Poly Haven' : 'Sketchfab'}</span>
      </label>)}
      <label>Candidatos por fuente (vacío: todos los recuperados)<input type="number" min={1} step={1} value={limit} placeholder="Todos" disabled={busy} onChange={event => { setLimit(event.target.value === '' ? '' : event.target.valueAsNumber); setResult(null) }} /></label>
      <label>Páginas de Sketchfab<input type="number" min={1} max={100} step={1} value={pages} disabled={busy} onChange={event => { setPages(event.target.value === '' ? '' : event.target.valueAsNumber); setResult(null) }} /></label>
      <label>Resultados a mostrar<input type="number" min={1} step={1} value={topK} disabled={busy} onChange={event => { setTopK(event.target.value === '' ? '' : event.target.valueAsNumber); setResult(null) }} /></label>
    </div>
    <p>Fuentes: Sketchfab y Poly Haven. DINO ordena las miniaturas recuperadas por parecido visual. Más candidatos requieren más tiempo; no se comparan todos los modelos de Internet.</p>
    {!image && <p>Sube una imagen para comenzar.</p>}
    {image && <canvas ref={canvasRef} aria-label="Selección del objeto" onPointerDown={event => {
      if (busy) return
      start.current = point(event); event.currentTarget.setPointerCapture(event.pointerId); setBox(null); setResult(null)
    }} onPointerMove={event => {
      if (!start.current) return
      const [x,y] = point(event), [sx,sy] = start.current
      setBox([Math.min(x,sx),Math.min(y,sy),Math.max(x,sx),Math.max(y,sy)])
    }} onPointerUp={() => { start.current = null; if (box && (box[2]-box[0] < 1 || box[3]-box[1] < 1)) setBox(null) }} onPointerCancel={() => { start.current = null; setBox(null) }} />}
    <button className="compare-button" type="button" disabled={!valid || busy} onClick={() => void compare()}>{busy ? 'Procesando…' : 'Buscar y comparar modelos'}</button>
    <p role="status">{error || (busy ? stage : result ? `${result.comparison.compared} de ${result.comparison.available} candidatos comparados · IA: ${result.timings.total_seconds.toFixed(2)} s` : 'Selecciona el objeto, escribe una descripción y elige las fuentes.')}</p>
    {result && <>
      {result.warnings.length > 0 && <div role="status"><p>La búsqueda tuvo resultados parciales:</p><ul>{result.warnings.map((warning, index) => <li key={index}>{typeof warning === 'string' ? warning : 'Un candidato no pudo procesarse.'}</li>)}</ul></div>}
      <div className="visual-previews"><figure><figcaption>Máscara</figcaption><img src={`/api${result.mask_url}`} alt="Máscara del objeto" /></figure><figure><figcaption>Recorte</figcaption><img src={`/api${result.crop_url}`} alt="Objeto seleccionado" /></figure></div>
      <section className="asset-grid" aria-label="Resultados reales de comparación">{result.results.map(asset => <article className="asset-card" key={asset.asset_id}>
        <div className="asset-art"><img src={asset.thumbnail_url} alt={asset.name || asset.asset_id} loading="lazy" /></div>
        <div className="asset-info"><div><h2><a href={asset.source_url} target="_blank" rel="noreferrer">{asset.name || asset.asset_id}</a></h2><p>{asset.source === 'polyhaven' ? 'Poly Haven' : 'Sketchfab'} · {asset.license || 'Consulta la licencia en la fuente'}</p><p>Similitud: {asset.similarity_score.toFixed(3)}</p></div></div>
      </article>)}</section>
      {!result.results.length && <p>No se encontraron modelos comparables. Prueba otra descripción.</p>}
      <p>La similitud ordena resultados; no es un porcentaje de acierto. Los enlaces llevan a la fuente; no garantizan descarga del modelo.</p>
    </>}
  </section>
}
