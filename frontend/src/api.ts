export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, init)
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const detail = data?.detail
    throw new Error(
      typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail.map((item: { msg: string }) => item.msg).join('; ')
          : 'Could not connect to the server. Please ensure the backend service is running.'
    )
  }
  return data as T
}

export async function normalizeImage(url: string): Promise<string> {
  const image = new Image()
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error('Failed to open image'))
    image.src = url
  })
  if (image.width * image.height > 20_000_000) {
    throw new Error('Image exceeds the 20 megapixel limit')
  }
  const scale = Math.min(1, 1024 / Math.max(image.width, image.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(image.width * scale))
  canvas.height = Math.max(1, Math.round(image.height * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/png')
}

export const STAGES: Record<string, string> = {
  uploading: 'Uploading reference image...',
  queued: 'Waiting in processing queue...',
  discovering: 'Discovering 3D models across external sources...',
  downloading: 'Downloading candidate thumbnails...',
  comparing: 'Segmenting with SAM & ranking with DINO...',
  finalizing: 'Finalizing similarity scoring...',
}
