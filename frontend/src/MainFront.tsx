import './MainFront.css'
import chrome2 from './assets/chrome2.png'
import chrome4 from './assets/chrome4.png'
import folderOpenIcon from './assets/folder-open-solid.svg'
import scanIcon from './assets/scan-square.svg'
import layerGroupIcon from './assets/layer-group-solid.svg'

/* ── SVG Icons ── */

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
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
          What asset will we find today?
        </h1>

        <div className="search-card">
          {/* Search bar */}
          <div className="search-input-wrap">
            <SearchIcon />
            <input type="text" placeholder="What are you looking for?" />
          </div>

          {/* Action buttons */}
          <div className="action-grid">
            <button className="action-btn" type="button">
              <img src={folderOpenIcon} alt="" className="action-icon" />
              <span>Open file</span>
            </button>
            <button className="action-btn" type="button">
              <img src={scanIcon} alt="" className="action-icon" />
              <span>Scan object</span>
            </button>
            <button className="action-btn" type="button">
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
    </div>
  )
}
