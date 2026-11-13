import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, PointerEvent } from 'react'
import './MainFront.css'
import chrome2 from './assets/chrome2.png'
import chrome4 from './assets/chrome4.png'
import folderOpenIcon from './assets/folder-open-solid.svg'
import scanIcon from './assets/scan-square.svg'
import layerGroupIcon from './assets/layer-group-solid.svg'
import type { Box, Comparison, Result, SavedModel, Source, Task } from './types'
import { normalizeImage, request, STAGES } from './api'
import {
  addSavedModel,
  DEFAULT_FOLDERS,
  loadFolders,
  loadSavedModels,
  moveSavedModel,
  removeSavedModel,
  saveFolders,
} from './collectionsStorage'
import { capResults, inputNumber } from './searchControls'

/* ── Inline SVG Icons ── */

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function CloseIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function ExternalLinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function BookmarkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function FolderIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function SparklesIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
    </svg>
  )
}

/* ── Main Component ── */

export default function MainFront() {
  // Landing search query
  const [landingQuery, setLandingQuery] = useState('')

  // Panels visibility
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false)
  const [isResultsOpen, setIsResultsOpen] = useState(false)
  const [isCollectionsOpen, setIsCollectionsOpen] = useState(false)

  // Visual Search controls
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const startDragRef = useRef<[number, number] | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const [image, setImage] = useState('')
  const [box, setBox] = useState<Box | null>(null)
  const [query, setQuery] = useState('')
  const [sources, setSources] = useState<Source[]>(['sketchfab', 'polyhaven'])
  const [limit, setLimit] = useState<number | ''>('')
  const [pages, setPages] = useState<number | ''>(3)
  const [topK, setTopK] = useState<number | ''>(5)

  // Search execution status
  const [busy, setBusy] = useState(false)
  const [stageKey, setStageKey] = useState(0)
  const [stageText, setStageText] = useState('Uploading reference image...')
  const [error, setError] = useState('')
  const [result, setResult] = useState<Comparison | null>(null)

  // Local Collections state (lazily initialized from localStorage)
  const [savedModels, setSavedModels] = useState<SavedModel[]>(() => {
    if (typeof window === 'undefined') return []
    return loadSavedModels()
  })
  const [folders, setFolders] = useState<string[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_FOLDERS
    return loadFolders()
  })
  const [activeFolder, setActiveFolder] = useState<string>('Saved Assets')
  const [newFolderName, setNewFolderName] = useState('')
  const [activeSaveDropdownAssetId, setActiveSaveDropdownAssetId] = useState<string | null>(null)
  const [customFolderInput, setCustomFolderInput] = useState('')

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  // Draw image and bounding box on canvas
  useEffect(() => {
    if (!image) return
    let cancelled = false
    const picture = new Image()
    picture.onload = () => {
      const canvas = canvasRef.current
      if (!canvas || cancelled) return
      canvas.width = picture.width
      canvas.height = picture.height
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Draw base image
      ctx.drawImage(picture, 0, 0)

      if (box) {
        const [x1, y1, x2, y2] = box
        const bw = x2 - x1
        const bh = y2 - y1

        // Darken region outside bounding box
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'
        ctx.fillRect(0, 0, canvas.width, y1)
        ctx.fillRect(0, y2, canvas.width, canvas.height - y2)
        ctx.fillRect(0, y1, x1, bh)
        ctx.fillRect(x2, y1, canvas.width - x2, bh)

        // Bounding box neon outline
        ctx.strokeStyle = '#8c67e2'
        ctx.lineWidth = 3
        ctx.strokeRect(x1, y1, bw, bh)

        // Inner glowing border
        ctx.strokeStyle = '#c8b3ff'
        ctx.lineWidth = 1
        ctx.strokeRect(x1 + 1, y1 + 1, bw - 2, bh - 2)

        // Corner handles
        const handleSize = 8
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(x1 - handleSize / 2, y1 - handleSize / 2, handleSize, handleSize)
        ctx.fillRect(x2 - handleSize / 2, y1 - handleSize / 2, handleSize, handleSize)
        ctx.fillRect(x1 - handleSize / 2, y2 - handleSize / 2, handleSize, handleSize)
        ctx.fillRect(x2 - handleSize / 2, y2 - handleSize / 2, handleSize, handleSize)
      }
    }
    picture.src = image
    return () => {
      cancelled = true
    }
  }, [image, box])

  // Canvas coordinates mapper
  function getCanvasPoint(event: PointerEvent<HTMLCanvasElement>): [number, number] {
    const canvas = event.currentTarget
    const rect = canvas.getBoundingClientRect()
    return [
      Math.max(0, Math.min(canvas.width, ((event.clientX - rect.left) * canvas.width) / rect.width)),
      Math.max(0, Math.min(canvas.height, ((event.clientY - rect.top) * canvas.height) / rect.height)),
    ]
  }

  // Handle file selection
  async function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setError('')
    setResult(null)
    setBox(null)
    const url = URL.createObjectURL(file)
    try {
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Image exceeds 10 MiB limit.')
      }
      const normalizedData = await normalizeImage(url)
      setImage(normalizedData)
      if (landingQuery.trim()) {
        setQuery(landingQuery.trim())
      }
      setIsAreaModalOpen(true)
    } catch (cause) {
      alert(cause instanceof Error ? cause.message : 'Invalid image file.')
    } finally {
      URL.revokeObjectURL(url)
      // reset file input value so same file can be reselected
      event.target.value = ''
    }
  }

  // Update stage message and trigger fade animation
  function updateStage(newText: string) {
    setStageText(newText)
    setStageKey(prev => prev + 1)
  }

  // Validation check for search
  const isPositive = (val: number | '') => typeof val === 'number' && Number.isInteger(val) && val > 0
  const isSearchValid =
    image &&
    box &&
    query.trim().length > 0 &&
    sources.length > 0 &&
    isPositive(topK) &&
    isPositive(pages) &&
    Number(pages) <= 100 &&
    (limit === '' || isPositive(limit))

  // Execute Search
  async function startSearch() {
    if (!isSearchValid || busy || !canvasRef.current) return

    // Close area modal and open right results panel
    setIsAreaModalOpen(false)
    setIsResultsOpen(true)
    setBusy(true)
    setError('')
    setResult(null)
    updateStage(STAGES.uploading || 'Uploading reference image...')

    const abort = new AbortController()
    abortControllerRef.current = abort

    try {
      const blob = await (await fetch(image)).blob()
      const form = new FormData()
      form.append('file', blob, 'reference.png')

      const media = await request<{ media_id: string; width: number; height: number }>('/media', {
        method: 'POST',
        body: form,
        signal: abort.signal,
      })

      updateStage(STAGES.queued || 'Waiting in processing queue...')

      let task = await request<Task>('/searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abort.signal,
        body: JSON.stringify({
          media_id: media.media_id,
          image_width: media.width,
          image_height: media.height,
          box_xyxy: box,
          q: query.trim(),
          sources,
          k: topK,
          candidate_limit: limit === '' ? null : limit,
          max_pages: pages,
        }),
      })

      while (task.status === 'queued' || task.status === 'running') {
        const text = STAGES[task.stage] || 'Processing search...'
        updateStage(text)
        await new Promise(resolve => setTimeout(resolve, 1400))
        if (abort.signal.aborted) return
        task = await request<Task>(`/tasks/${task.task_id}`, { signal: abort.signal })
      }

      if (task.status === 'failed') {
        throw new Error(task.error?.message || 'Search failed on backend server.')
      }

      setResult(task.result)
    } catch (cause) {
      if (!abort.signal.aborted) {
        setError(cause instanceof Error ? cause.message : 'Comparison failed.')
      }
    } finally {
      if (!abort.signal.aborted) {
        setBusy(false)
      }
    }
  }

  // Cancel ongoing search
  function cancelSearch() {
    abortControllerRef.current?.abort()
    setBusy(false)
  }

  // Save model locally to a folder
  function handleSaveModel(asset: Result, targetFolder: string) {
    const authorName =
      asset.author ||
      (asset.source === 'polyhaven' ? 'Poly Haven Community' : 'Sketchfab Creator')

    const savedItem: SavedModel = {
      asset_id: asset.asset_id,
      name: asset.name || asset.asset_id,
      source: asset.source,
      source_url: asset.source_url,
      thumbnail_url: asset.thumbnail_url,
      similarity_score: asset.similarity_score,
      license: asset.license,
      author: authorName,
      savedAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      folder: targetFolder || 'Saved Assets',
    }

    const updated = addSavedModel(savedItem)
    setSavedModels(updated)
    setFolders(loadFolders())
    setActiveSaveDropdownAssetId(null)
  }

  // Check if asset is saved in a folder
  function getAssetSavedFolder(assetId: string): string | null {
    const found = savedModels.find(item => item.asset_id === assetId)
    return found ? found.folder : null
  }

  // Create new folder in collections
  function handleCreateFolder(name: string) {
    const trimmed = name.trim()
    if (!trimmed || folders.includes(trimmed)) return
    const updated = [...folders, trimmed]
    saveFolders(updated)
    setFolders(updated)
    setActiveFolder(trimmed)
    setNewFolderName('')
  }

  return (
    <div className="main-front">
      {/* Hidden file input for file opener */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={event => void handleFileSelected(event)}
        aria-label="Upload reference file"
      />

      {/* ── Background glow effects ── */}
      <div className="glow-layer glow-bottom-left" aria-hidden="true" />
      <div className="glow-layer glow-bottom-right" aria-hidden="true" />
      <div className="glow-layer glow-center-top" aria-hidden="true" />
      <div className="glow-layer glow-top-left-orange" aria-hidden="true" />
      <div className="glow-layer glow-behind-chrome-right" aria-hidden="true" />

      <img src={chrome2} alt="" className="chrome-left" aria-hidden="true" />
      <img src={chrome4} alt="" className="chrome-right" aria-hidden="true" />

      {/* Floating pill to toggle results if already searched */}
      {result && !isResultsOpen && (
        <button
          type="button"
          onClick={() => setIsResultsOpen(true)}
          className="fixed top-5 right-5 z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-[#1c1b24]/90 border border-[#8c67e2]/50 text-white text-xs font-medium shadow-xl hover:bg-[#252331] cursor-pointer transition-all"
        >
          <SparklesIcon />
          <span>Results ({result.results.length})</span>
        </button>
      )}

      {/* ── Centered search panel ── */}
      <div className="search-panel">
        <h1 className="search-panel__title">What asset will we find today?</h1>

        <div className="search-card">
          {/* Search bar */}
          <div className="search-input-wrap">
            <SearchIcon />
            <input
              type="text"
              placeholder="What are you looking for?"
              value={landingQuery}
              onChange={e => {
                setLandingQuery(e.target.value)
                setQuery(e.target.value)
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  if (image) {
                    setIsAreaModalOpen(true)
                  } else {
                    fileInputRef.current?.click()
                  }
                }
              }}
            />
          </div>

          {/* Action buttons */}
          <div className="action-grid">
            <button
              className="action-btn"
              type="button"
              onClick={() => fileInputRef.current?.click()}
            >
              <img src={folderOpenIcon} alt="" className="action-icon" />
              <span>Open file</span>
            </button>
            <button
              className="action-btn"
              type="button"
              onClick={() => fileInputRef.current?.click()}
            >
              <img src={scanIcon} alt="" className="action-icon" />
              <span>Scan object</span>
            </button>
            <button
              className="action-btn"
              type="button"
              onClick={() => setIsCollectionsOpen(true)}
            >
              <img src={layerGroupIcon} alt="" className="action-icon" />
              <span>My collections</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Bottom branding ── */}
      <div className="brand-footer">
        <p className="brand-footer__tagline">
          as it,<br />find it.
        </p>
        <p className="brand-footer__powered">
          Powered with <b>META</b> AI models.
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          ── Area Selection Window (Modal Overlay) ──
          ══════════════════════════════════════════════════════════════ */}
      {isAreaModalOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            {/* Header */}
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Select Object & Search Settings</h2>
                <p className="text-white/50 text-xs mt-0.5">
                  Draw a bounding box around the object and customize source parameters.
                </p>
              </div>
              <button
                type="button"
                className="text-white/60 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                onClick={() => setIsAreaModalOpen(false)}
                aria-label="Close area selection"
              >
                <CloseIcon size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body">
              {/* Canvas Container */}
              <div className="canvas-container">
                <canvas
                  ref={canvasRef}
                  className="canvas-selection"
                  onPointerDown={e => {
                    if (busy) return
                    startDragRef.current = getCanvasPoint(e)
                    e.currentTarget.setPointerCapture(e.pointerId)
                    setBox(null)
                  }}
                  onPointerMove={e => {
                    if (!startDragRef.current) return
                    const [currX, currY] = getCanvasPoint(e)
                    const [startX, startY] = startDragRef.current
                    setBox([
                      Math.min(currX, startX),
                      Math.min(currY, startY),
                      Math.max(currX, startX),
                      Math.max(currY, startY),
                    ])
                  }}
                  onPointerUp={() => {
                    startDragRef.current = null
                    if (box && (box[2] - box[0] < 5 || box[3] - box[1] < 5)) {
                      setBox(null)
                    }
                  }}
                  onPointerCancel={() => {
                    startDragRef.current = null
                    setBox(null)
                  }}
                />

                <div className="canvas-floating-badge">
                  {box ? (
                    <span>
                      Area: {Math.round(box[2] - box[0])} × {Math.round(box[3] - box[1])} px
                    </span>
                  ) : (
                    <span>Click and drag over the object to select it</span>
                  )}
                </div>

                <div className="canvas-floating-actions">
                  {box && (
                    <button
                      type="button"
                      className="secondary-action-btn py-1 px-3 text-[11px]"
                      onClick={() => setBox(null)}
                    >
                      Reset selection
                    </button>
                  )}
                  <button
                    type="button"
                    className="secondary-action-btn py-1 px-3 text-[11px]"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Change image
                  </button>
                </div>
              </div>

              {/* Object Query Input */}
              <div className="modal-field">
                <label className="modal-label" htmlFor="object-query-input">
                  Object to search
                </label>
                <input
                  id="object-query-input"
                  type="text"
                  className="modal-input"
                  placeholder="e.g. wooden chair, vintage desk lamp, sports car"
                  maxLength={100}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
              </div>

              {/* Provider Checkboxes */}
              <div className="modal-field">
                <span className="modal-label">Search Providers</span>
                <div className="source-checkbox-group">
                  {(['sketchfab', 'polyhaven'] as Source[]).map(source => (
                    <label
                      key={source}
                      className={`source-checkbox-label ${
                        sources.includes(source) ? 'is-checked' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={sources.includes(source)}
                        onChange={e => {
                          setSources(curr =>
                            e.target.checked
                              ? [...curr, source]
                              : curr.filter(s => s !== source)
                          )
                        }}
                      />
                      <span>{source === 'polyhaven' ? 'Poly Haven' : 'Sketchfab'}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Other inputs from VisualSearch */}
              <div className="controls-numeric-grid">
                <div className="modal-field">
                  <label className="modal-label">Candidates per source</label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    className="modal-input"
                    placeholder="All candidates"
                    value={limit}
                    onChange={e => {
                      const val = e.target.value === '' ? '' : e.target.valueAsNumber
                      setLimit(val)
                      if (typeof val === 'number') {
                        setTopK(current => capResults(current, val))
                      }
                    }}
                  />
                  <span className="text-[10px] text-white/40">Leave empty to evaluate all</span>
                </div>

                <div className="modal-field">
                  <label className="modal-label">Sketchfab pages</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    step={1}
                    className="modal-input"
                    value={pages}
                    onChange={e =>
                      setPages(e.target.value === '' ? '' : inputNumber(e.target.valueAsNumber))
                    }
                  />
                  <span className="text-[10px] text-white/40">1 to 100 search batches</span>
                </div>

                <div className="modal-field">
                  <label className="modal-label">Results to display</label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    className="modal-input"
                    value={topK}
                    onChange={e =>
                      setTopK(e.target.value === '' ? '' : inputNumber(e.target.valueAsNumber))
                    }
                  />
                  <span className="text-[10px] text-white/40">Top models ranked by DINO</span>
                </div>
              </div>

              {/* Informational hint */}
              <p className="text-white/45 text-[11px] leading-relaxed">
                Sources: Sketchfab and Poly Haven. DINO compares and ranks candidate thumbnails by visual
                similarity to the segmented object. Higher candidate counts explore deeper results but take
                longer to compare.
              </p>

              {/* Modal footer / actions */}
              <div className="flex items-center justify-between pt-2 border-t border-white/10 mt-1">
                <button
                  type="button"
                  className="secondary-action-btn"
                  onClick={() => setIsAreaModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="primary-action-btn"
                  disabled={!isSearchValid || busy}
                  onClick={() => void startSearch()}
                >
                  <SparklesIcon />
                  <span>Search Models</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          ── Search Results Modal (Matches Area Selection Size & Position) ──
          ══════════════════════════════════════════════════════════════ */}
      {isResultsOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            {/* Header */}
            <div className="modal-header">
              <div className="flex items-center gap-2.5">
                <h2 className="modal-title">Found Assets</h2>
                {result && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#8c67e2]/20 border border-[#8c67e2]/40 text-[#c8b3ff]">
                    {result.results.length} models
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="secondary-action-btn py-1 px-3 text-[11px]"
                  onClick={() => {
                    setIsResultsOpen(false)
                    setIsAreaModalOpen(true)
                  }}
                  title="Edit area selection and query"
                >
                  Edit Selection
                </button>
                <button
                  type="button"
                  className="text-white/60 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                  onClick={() => setIsResultsOpen(false)}
                  aria-label="Close results panel"
                >
                  <CloseIcon size={20} />
                </button>
              </div>
            </div>

            {/* Results Modal Body */}
            <div className="modal-body">
            {/* Loading State with spinner and animated fading legends */}
            {busy && (
              <div className="loading-wrapper">
                <div className="spinner-outer">
                  <div className="glowing-spinner" />
                  <div className="spinner-glow-dot" />
                </div>
                <div key={stageKey} className="stage-legend-fade">
                  <h3 className="text-white text-sm font-semibold tracking-wide">
                    {stageText}
                  </h3>
                </div>
                <p className="text-white/40 text-xs mt-2 max-w-xs">
                  Querying external repositories and computing visual embeddings.
                </p>
                <button
                  type="button"
                  className="secondary-action-btn mt-6 py-1.5 px-4 text-xs"
                  onClick={cancelSearch}
                >
                  Cancel Search
                </button>
              </div>
            )}

            {/* Error Message */}
            {!busy && error && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-200 text-xs flex flex-col gap-2">
                <p className="font-semibold text-red-300">Search encountered an issue:</p>
                <p>{error}</p>
                <button
                  type="button"
                  className="secondary-action-btn w-fit mt-1 text-[11px]"
                  onClick={() => void startSearch()}
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Search Results Display */}
            {!busy && result && (
              <>
                {/* Search metadata */}
                <div className="flex items-center justify-between text-[11px] text-white/50 px-1">
                  <span>
                    {result.comparison.compared} of {result.comparison.available} candidates
                    evaluated
                  </span>
                  <span>AI: {result.timings.total_seconds.toFixed(2)}s</span>
                </div>

                {/* Warnings banner if any */}
                {result.warnings.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-[11px]">
                    <span className="font-medium">Notice: </span>
                    {typeof result.warnings[0] === 'string'
                      ? result.warnings[0]
                      : 'Some candidates could not be processed.'}
                  </div>
                )}

                {/* Segmentation previews (mask and crop) */}
                {(result.mask_url || result.crop_url) && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-black/30 border border-white/8">
                    {result.crop_url && (
                      <div className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[10px] text-white/40 uppercase">Target Crop</span>
                        <img
                          src={`/api${result.crop_url}`}
                          alt="Crop"
                          className="h-16 w-auto object-contain rounded-md border border-white/10"
                        />
                      </div>
                    )}
                    {result.mask_url && (
                      <div className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[10px] text-white/40 uppercase">SAM Mask</span>
                        <img
                          src={`/api${result.mask_url}`}
                          alt="Mask"
                          className="h-16 w-auto object-contain rounded-md border border-white/10"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Model Cards Responsive Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {result.results.map(asset => {
                    const authorName =
                      asset.author ||
                      (asset.source === 'polyhaven'
                        ? 'Poly Haven Community'
                        : 'Sketchfab Creator')
                    const savedFolder = getAssetSavedFolder(asset.asset_id)
                    const isDropdownOpen = activeSaveDropdownAssetId === asset.asset_id

                    return (
                      <article className="result-card" key={asset.asset_id}>
                        {/* Thumbnail container */}
                        <div className="result-thumb-container">
                          <img
                            src={asset.thumbnail_url}
                            alt={asset.name || asset.asset_id}
                            className="result-thumb-img"
                            loading="lazy"
                          />
                          {/* Source badge */}
                          <span
                            className={`badge-source ${
                              asset.source === 'sketchfab'
                                ? 'badge-source-sketchfab'
                                : 'badge-source-polyhaven'
                            }`}
                          >
                            {asset.source === 'sketchfab' ? 'Sketchfab' : 'Poly Haven'}
                          </span>
                          {/* Similarity badge */}
                          <span className="badge-similarity">
                            Similarity: {asset.similarity_score.toFixed(3)}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="flex flex-col gap-1 mt-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <a
                              href={asset.source_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-white text-xs font-semibold hover:text-[#c8b3ff] transition-colors line-clamp-1 flex items-center gap-1.5"
                              title={asset.name || asset.asset_id}
                            >
                              <span>{asset.name || asset.asset_id}</span>
                              <ExternalLinkIcon />
                            </a>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-white/60">
                            <span>
                              By <strong className="text-white/80 font-medium">{authorName}</strong>
                            </span>
                            <span className="text-white/40">
                              {asset.license || 'Free license'}
                            </span>
                          </div>

                          {/* Save to folder action with custom assigned folder */}
                          <div className="relative mt-2 pt-2 border-t border-white/8 flex items-center justify-between">
                            {savedFolder ? (
                              <button
                                type="button"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 cursor-pointer"
                                onClick={() =>
                                  setActiveSaveDropdownAssetId(isDropdownOpen ? null : asset.asset_id)
                                }
                              >
                                <CheckIcon />
                                <span>Saved in {savedFolder}</span>
                                <ChevronDownIcon />
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/90 bg-white/6 hover:bg-white/12 border border-white/12 cursor-pointer transition-colors"
                                onClick={() =>
                                  setActiveSaveDropdownAssetId(isDropdownOpen ? null : asset.asset_id)
                                }
                              >
                                <BookmarkIcon />
                                <span>Save to {activeFolder}</span>
                                <ChevronDownIcon />
                              </button>
                            )}

                            {/* Dropdown menu to select or assign folder name */}
                            {isDropdownOpen && (
                              <div className="save-dropdown-menu">
                                <span className="text-[10px] text-white/50 px-2 py-0.5 font-semibold uppercase">
                                  Assign to folder:
                                </span>
                                {folders.map(folder => (
                                  <button
                                    key={folder}
                                    type="button"
                                    className="flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs text-white/80 hover:text-white hover:bg-white/10 cursor-pointer text-left transition-colors"
                                    onClick={() => handleSaveModel(asset, folder)}
                                  >
                                    <span className="truncate">{folder}</span>
                                    {savedFolder === folder && <CheckIcon />}
                                  </button>
                                ))}

                                {/* Add custom folder input */}
                                <div className="pt-1.5 mt-1 border-t border-white/10 flex items-center gap-1">
                                  <input
                                    type="text"
                                    className="w-full bg-black/40 border border-white/15 rounded-md px-2 py-1 text-[11px] text-white placeholder-white/40 outline-none"
                                    placeholder="New folder..."
                                    value={customFolderInput}
                                    onChange={e => setCustomFolderInput(e.target.value)}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter' && customFolderInput.trim()) {
                                        handleSaveModel(asset, customFolderInput.trim())
                                        setCustomFolderInput('')
                                      }
                                    }}
                                  />
                                  <button
                                    type="button"
                                    className="px-2 py-1 rounded-md text-[11px] font-medium bg-[#8c67e2] text-white cursor-pointer hover:bg-[#7b54d4]"
                                    onClick={() => {
                                      if (customFolderInput.trim()) {
                                        handleSaveModel(asset, customFolderInput.trim())
                                        setCustomFolderInput('')
                                      }
                                    }}
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>

                {result.results.length === 0 && (
                  <div className="p-8 text-center text-white/50 text-xs">
                    No matching models found. Try adjusting your bounding box or describing the
                    object differently.
                  </div>
                )}
              </>
            )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          ── My Collections Panel (Local Storage Folders) ──
          ══════════════════════════════════════════════════════════════ */}
      {isCollectionsOpen && (
        <aside
          className="collections-drawer"
          aria-label="My Local Model Collections"
        >
          {/* Header */}
          <div className="results-header">
            <div className="flex items-center gap-2">
              <FolderIcon />
              <h2 className="results-header-title">My Collections</h2>
              <span className="text-white/40 text-xs">
                ({savedModels.length} {savedModels.length === 1 ? 'model' : 'models'})
              </span>
            </div>
            <button
              type="button"
              className="text-white/60 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              onClick={() => setIsCollectionsOpen(false)}
              aria-label="Close collections"
            >
              <CloseIcon size={18} />
            </button>
          </div>

          {/* Folder Navigation Chips */}
          <div className="px-5 py-3 border-b border-white/10 bg-white/2 flex items-center gap-2 overflow-x-auto">
            {folders.map(folder => {
              const count = savedModels.filter(m => m.folder === folder).length
              return (
                <button
                  key={folder}
                  type="button"
                  className={`folder-chip ${activeFolder === folder ? 'is-active' : ''}`}
                  onClick={() => setActiveFolder(folder)}
                >
                  <span>{folder}</span>
                  <span className="text-[10px] opacity-75">({count})</span>
                </button>
              )
            })}
          </div>

          {/* New folder inline creator */}
          <div className="px-5 py-2.5 border-b border-white/8 bg-black/20 flex items-center gap-2">
            <input
              type="text"
              className="flex-1 bg-black/40 border border-white/12 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/40 outline-none"
              placeholder="Create new folder name..."
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleCreateFolder(newFolderName)
              }}
            />
            <button
              type="button"
              className="secondary-action-btn py-1.5 px-3 text-xs"
              onClick={() => handleCreateFolder(newFolderName)}
            >
              + Add
            </button>
          </div>

          {/* Folder Content Models Grid */}
          <div className="results-body">
            {(() => {
              const folderModels = savedModels.filter(m => m.folder === activeFolder)

              if (folderModels.length === 0) {
                return (
                  <div className="py-16 text-center text-white/40 text-xs flex flex-col items-center gap-2">
                    <FolderIcon />
                    <p className="font-medium text-white/70">Folder "{activeFolder}" is empty</p>
                    <p className="max-w-xs text-[11px]">
                      Search for 3D models with Visual Search and click "Save" on any result card to
                      store models here locally.
                    </p>
                  </div>
                )
              }

              return (
                <div className="flex flex-col gap-3">
                  {folderModels.map(model => (
                    <article className="result-card" key={model.asset_id}>
                      <div className="result-thumb-container">
                        <img
                          src={model.thumbnail_url}
                          alt={model.name}
                          className="result-thumb-img"
                        />
                        <span
                          className={`badge-source ${
                            model.source === 'sketchfab'
                              ? 'badge-source-sketchfab'
                              : 'badge-source-polyhaven'
                          }`}
                        >
                          {model.source === 'sketchfab' ? 'Sketchfab' : 'Poly Haven'}
                        </span>
                        <span className="badge-similarity">Saved: {model.savedAt}</span>
                      </div>

                      <div className="flex flex-col gap-1 mt-2.5">
                        <a
                          href={model.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-white text-xs font-semibold hover:text-[#c8b3ff] transition-colors line-clamp-1 flex items-center gap-1.5"
                        >
                          <span>{model.name}</span>
                          <ExternalLinkIcon />
                        </a>

                        <div className="flex items-center justify-between text-[11px] text-white/60">
                          <span>
                            By <strong className="text-white/80 font-medium">{model.author}</strong>
                          </span>
                          <span className="text-white/40">{model.license || 'Free'}</span>
                        </div>

                        {/* Move folder or remove actions */}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/8 text-xs">
                          <div className="flex items-center gap-1.5 text-white/60 text-[11px]">
                            <span>Folder:</span>
                            <select
                              className="bg-black/40 border border-white/12 rounded px-2 py-0.5 text-[11px] text-white outline-none cursor-pointer"
                              value={model.folder}
                              onChange={e => {
                                const updated = moveSavedModel(
                                  model.asset_id,
                                  model.folder,
                                  e.target.value
                                )
                                setSavedModels(updated)
                              }}
                            >
                              {folders.map(f => (
                                <option key={f} value={f} className="bg-[#1c1b22] text-white">
                                  {f}
                                </option>
                              ))}
                            </select>
                          </div>

                          <button
                            type="button"
                            className="text-red-400 hover:text-red-300 p-1 rounded transition-colors cursor-pointer"
                            onClick={() => {
                              const updated = removeSavedModel(model.asset_id, model.folder)
                              setSavedModels(updated)
                            }}
                            title="Remove from collection"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )
            })()}
          </div>
        </aside>
      )}
    </div>
  )
}
