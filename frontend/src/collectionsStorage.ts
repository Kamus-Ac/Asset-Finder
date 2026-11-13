import type { SavedModel } from './types'

const STORAGE_KEY = 'asset_finder_saved_models_v1'
const FOLDERS_KEY = 'asset_finder_folders_v1'

export const DEFAULT_FOLDERS: string[] = ['Saved Assets', 'Favorites', 'Scene Props']

export function loadSavedModels(): SavedModel[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveSavedModels(models: SavedModel[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(models))
  } catch (error) {
    console.error('Failed to save models to localStorage', error)
  }
}

export function loadFolders(): string[] {
  try {
    const raw = localStorage.getItem(FOLDERS_KEY)
    if (!raw) return DEFAULT_FOLDERS
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Ensure unique folder names
      return Array.from(new Set([...DEFAULT_FOLDERS, ...parsed.map(String)]))
    }
    return DEFAULT_FOLDERS
  } catch {
    return DEFAULT_FOLDERS
  }
}

export function saveFolders(folders: string[]): void {
  try {
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders))
  } catch (error) {
    console.error('Failed to save folders to localStorage', error)
  }
}

export function addSavedModel(model: SavedModel): SavedModel[] {
  const current = loadSavedModels()
  // Check if already in folder
  const filtered = current.filter(
    item => !(item.asset_id === model.asset_id && item.folder === model.folder)
  )
  const updated = [model, ...filtered]
  saveSavedModels(updated)

  // Ensure folder exists in folders list
  const folders = loadFolders()
  if (!folders.includes(model.folder)) {
    saveFolders([...folders, model.folder])
  }

  return updated
}

export function removeSavedModel(asset_id: string, folder: string): SavedModel[] {
  const current = loadSavedModels()
  const updated = current.filter(
    item => !(item.asset_id === asset_id && item.folder === folder)
  )
  saveSavedModels(updated)
  return updated
}

export function moveSavedModel(
  asset_id: string,
  fromFolder: string,
  toFolder: string
): SavedModel[] {
  const current = loadSavedModels()
  const updated = current.map(item => {
    if (item.asset_id === asset_id && item.folder === fromFolder) {
      return { ...item, folder: toFolder }
    }
    return item
  })
  saveSavedModels(updated)
  return updated
}
