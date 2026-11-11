import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChangeEvent, PointerEvent } from 'react'
import { capResults, inputNumber, validCounts } from './searchControls'
import type { CountValue } from './searchControls'
import './VisualSearch.css'

type Box = [number, number, number, number]
type Result = { asset_id: string; name: string | null; source_url: string; similarity_score: number }
type Comparison = {
  results: Result[]; mask: string; crop: string; previews: Record<string, string>
  comparison: { compared: number; available: number }; timings: { total_seconds: number }
}

async function request<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`/api/ai${path}`, body === undefined ? {} : {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'No se pudo completar la comparación')
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

export default function VisualSearch() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const start = useRef<[number, number] | null>(null)
  const [image, setImage] = useState('')
  const [box, setBox] = useState<Box | null>(null)
  const [available, setAvailable] = useState(0)
  const [count, setCount] = useState<CountValue>(1)
  const [topK, setTopK] = useState<CountValue>(1)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  const [result, setResult] = useState<Comparison | null>(null)

  const applySample = useCallback((data: { image: string; box: Box; candidate_count: number }) => {
    setImage(data.image); setBox(data.box); setAvailable(data.candidate_count)
    setCount(Math.min(10, data.candidate_count)); setTopK(Math.min(5, data.candidate_count))
  }, [])
  const sample = useCallback(async () => {
    setBusy(true); setError(''); setResult(null)
    try { applySample(await request<{ image: string; box: Box; candidate_count: number }>('/sample')) }
    catch { setError('No se pudo conectar al servicio local de comparación.') }
    finally { setBusy(false) }
  }, [applySample])

  useEffect(() => {
    let cancelled = false
    request<{ image: string; box: Box; candidate_count: number }>('/sample')
      .then(data => { if (!cancelled) applySample(data) })
      .catch(() => { if (!cancelled) setError('No se pudo conectar al servicio local de comparación.') })
      .finally(() => { if (!cancelled) setBusy(false) })
    return () => { cancelled = true }
  }, [applySample])
  useEffect(() => {
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
    setBusy(true); setError(''); setResult(null); setBox(null)
    const url = URL.createObjectURL(file)
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error('La imagen supera los 10 MiB')
      setImage(await normalize(url))
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Imagen inválida') }
    finally { URL.revokeObjectURL(url); setBusy(false) }
  }

  const valid = box && validCounts(count, topK, available)
  async function compare() {
    if (!valid || busy) return
    setBusy(true); setError(''); setResult(null)
    try { setResult(await request<Comparison>('/run', { image, box, candidate_limit: count, k: topK })) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Falló la comparación') }
    finally { setBusy(false) }
  }

  return <section className="visual-search">
    <header><h1>Asset Finder · búsqueda visual</h1><p>Sube una imagen y dibuja un rectángulo sobre el objeto.</p></header>
    <div className="visual-controls">
      <input type="file" accept="image/jpeg,image/png,image/webp" aria-label="Subir referencia" disabled={busy} onChange={event => void upload(event)} />
      <button type="button" disabled={busy} onClick={() => void sample()}>Usar ejemplo</button>
      <label>Candidatos a comparar<input type="number" min={1} max={available} step={1} value={count} disabled={busy} onChange={event => {
        const value = inputNumber(event.target.valueAsNumber)
        setCount(value); setTopK(current => capResults(current, value)); setResult(null)
      }} /></label>
      <label>Resultados a mostrar<input type="number" min={1} max={count || undefined} step={1} value={topK} disabled={busy} onChange={event => { setTopK(inputNumber(event.target.valueAsNumber)); setResult(null) }} /></label>
    </div>
    <p>{available} candidatos disponibles en esta muestra de prueba de Sketchfab.</p>
    <canvas ref={canvasRef} aria-label="Selección del objeto" onPointerDown={event => {
      if (busy || !image) return
      start.current = point(event); event.currentTarget.setPointerCapture(event.pointerId); setBox(null); setResult(null)
    }} onPointerMove={event => {
      if (!start.current) return
      const [x,y] = point(event), [sx,sy] = start.current
      setBox([Math.min(x,sx),Math.min(y,sy),Math.max(x,sx),Math.max(y,sy)])
    }} onPointerUp={() => { start.current = null; if (box && (box[2]-box[0] < 1 || box[3]-box[1] < 1)) setBox(null) }} onPointerCancel={() => { start.current = null; setBox(null) }} />
    <button className="compare-button" type="button" disabled={!valid || busy} onClick={() => void compare()}>{busy ? 'Procesando…' : 'Comparar objeto'}</button>
    <p role="status">{error || (busy ? 'Procesando imagen y comparación…' : result ? `${result.comparison.compared} de ${result.comparison.available} candidatos comparados · ${result.timings.total_seconds.toFixed(2)} s` : 'Selecciona el objeto y la cantidad que quieres comparar.')}</p>
    {result && <>
      <div className="visual-previews"><figure><figcaption>Máscara</figcaption><img src={result.mask} alt="Máscara del objeto" /></figure><figure><figcaption>Recorte</figcaption><img src={result.crop} alt="Objeto seleccionado" /></figure></div>
      <section className="asset-grid" aria-label="Resultados reales de comparación">{result.results.map(asset => <article className="asset-card" key={asset.asset_id}>
        <div className="asset-art"><img src={result.previews[asset.asset_id]} alt={asset.name || asset.asset_id} /></div>
        <div className="asset-info"><div><h2><a href={asset.source_url} target="_blank" rel="noreferrer">{asset.name || asset.asset_id}</a></h2><p>Similitud: {asset.similarity_score.toFixed(3)}</p></div></div>
      </article>)}</section>
      <p>La similitud es un orden de comparación, no un porcentaje de acierto.</p>
    </>}
  </section>
}
