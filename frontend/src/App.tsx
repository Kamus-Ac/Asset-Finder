import { useEffect, useRef } from 'react'
import { mountCubePreview } from './main'
import VisualSearch from './VisualSearch'
import './App.css'

type Asset = {
  title: string
  creator: string
  color: number
  category: string
}

const assets: Asset[] = [
  { title: 'Cube', creator: 'Mina Park', color: 0xcaffca, category: 'Abstract' },
  { title: 'Cube', creator: 'Noah Williams', color: 0xffc7a6, category: 'Architecture' },
  { title: 'Cube', creator: 'Sofia Costa', color: 0xc7d7ff, category: 'Minimal' },
  { title: 'Cube', creator: 'Luca Rossi', color: 0xffe59a, category: 'Objects' },
  { title: 'Cube', creator: 'Aya Nakamura', color: 0xe7c7ff, category: 'Abstract' },
  { title: 'Cube', creator: 'Ethan Cole', color: 0xffb7cf, category: 'Architecture' },
]

function CubePreview({ color }: { color: number }) {
  const previewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!previewRef.current) return
    return mountCubePreview(previewRef.current, color)
  }, [color])

  return <div className="cube-preview" ref={previewRef} aria-hidden="true" />
}

function App() {
  return (
    <main className="catalog">
      <VisualSearch />
      <details className="scene-examples">
      <summary>Catálogo Three.js de ejemplo</summary>
      <section className="asset-grid" aria-label="Featured 3D assets">
        {assets.map((asset) => (
          <article className="asset-card" key={asset.creator}>
            <div className={`asset-art`}>
              {/* <span className="asset-category">{asset.category}</span> */}
              <CubePreview color={asset.color} />
              <button className="save-button" type="button" aria-label={`Save ${asset.title}`}>♡</button>
            </div>
            <div className="asset-info">
              <div>
                <h2>{asset.title}</h2>
                <p>By {asset.creator}</p>
              </div>
            </div>
          </article>
        ))}
      </section>
      </details>
    </main>
  )
}

export default App
