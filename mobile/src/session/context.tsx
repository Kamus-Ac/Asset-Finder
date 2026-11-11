import { createContext, use, useCallback, useState, type ReactNode } from 'react';
import type { Asset, Project } from '@/types/domain';
import type { VisualResult } from '@/services/contracts';

interface Session {
  assets: Asset[];
  projects: Project[];
  visual: VisualResult | null;
  registerAssets: (assets: Asset[]) => void;
  setVisual: (result: VisualResult) => void;
  createProject: (name: string) => string;
  saveAsset: (projectId: string, assetId: string) => void;
  removeAsset: (projectId: string, assetId: string) => void;
}
const Context = createContext<Session | null>(null);
// Real fetched metadata and local collections survive navigation, not app reloads.
export function SessionProvider({ children }: { children: ReactNode }) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [visual, setVisualResult] = useState<VisualResult | null>(null);
  const registerAssets = useCallback((incoming: Asset[]) => setAssets(current => {
    const merged = new Map(current.map(asset => [asset.id, asset]));
    incoming.forEach(asset => merged.set(asset.id, asset));
    return [...merged.values()];
  }), []);
  const setVisual = useCallback((result: VisualResult) => { registerAssets(result.assets); setVisualResult(result); }, [registerAssets]);
  function createProject(name: string) {
    const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setProjects(current => [...current, { id, name, description: 'Colección local de esta sesión.', assetIds: [], updated: 'Esta sesión' }]);
    return id;
  }
  function saveAsset(projectId: string, assetId: string) { setProjects(current => current.map(project => project.id === projectId && !project.assetIds.includes(assetId) ? { ...project, assetIds: [...project.assetIds, assetId] } : project)); }
  function removeAsset(projectId: string, assetId: string) { setProjects(current => current.map(project => project.id === projectId ? { ...project, assetIds: project.assetIds.filter(id => id !== assetId) } : project)); }
  return <Context value={{ assets, projects, visual, registerAssets, setVisual, createProject, saveAsset, removeAsset }}>{children}</Context>;
}
export function useSession() { const value = use(Context); if (!value) throw new Error('SessionProvider missing'); return value; }
