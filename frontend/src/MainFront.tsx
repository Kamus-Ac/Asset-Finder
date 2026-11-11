import './MainFront.css'
import chrome2 from './assets/chrome2.png'
import chrome4 from './assets/chrome4.png'

/* ── SVG Icons ── */

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function FolderPlusIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
      <line x1="12" y1="11" x2="12" y2="17" />
      <line x1="9" y1="14" x2="15" y2="14" />
    </svg>
  )
}

function ScanIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 012-2h2" />
      <path d="M17 3h2a2 2 0 012 2v2" />
      <path d="M21 17v2a2 2 0 01-2 2h-2" />
      <path d="M7 21H5a2 2 0 01-2-2v-2" />
      <rect x="7" y="7" width="10" height="10" rx="1" />
    </svg>
  )
}

function BrushIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18.37 2.63L14 7l-1.59-1.59a2 2 0 00-2.82 0L8 7l9 9 1.59-1.59a2 2 0 000-2.82L17 10l4.37-4.37a2.12 2.12 0 10-3-3z" />
      <path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7" />
      <path d="M14.5 17.5L4.5 15" />
    </svg>
  )
}

/* ── Main component ── */

export default function MainFront() {
  return (
    <div className="main-front">
      {/* ── Background glow effects ── */}
      <div className="glow-layer glow-bottom-left" aria-hidden="true" />
      <div className="glow-layer glow-bottom-right" aria-hidden="true" />
      <div className="glow-layer glow-center-top" aria-hidden="true" />
      <div className="glow-layer glow-top-left-orange" aria-hidden="true" />
      <div className="glow-layer glow-behind-chrome-right" aria-hidden="true" />

      {/* ── Chrome 3D renders ── */}
      <img
        src={chrome2}
        alt=""
        className="chrome-left"
        aria-hidden="true"
      />
      <img
        src={chrome4}
        alt=""
        className="chrome-right"
        aria-hidden="true"
      />

      {/* ── Centered search panel ── */}
      <div className="search-panel">
        <h1 className="search-panel__title">
          ¿Qué asset encontraremos hoy?
        </h1>

        <div className="search-card">
          {/* Search bar */}
          <div className="search-input-wrap">
            <SearchIcon />
            <input type="text" placeholder="¿Qué buscas?" />
          </div>

          {/* Action buttons */}
          <div className="action-grid">
            <button className="action-btn" type="button">
              <FolderPlusIcon />
              <span>Abrir archivo</span>
            </button>
            <button className="action-btn" type="button">
              <ScanIcon />
              <span>Escanear objeto</span>
            </button>
            <button className="action-btn" type="button">
              <BrushIcon />
              <span>Crear entorno</span>
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
          Powered by <b>Sketchfab.</b>
        </p>
      </div>
    </div>
  )
}
