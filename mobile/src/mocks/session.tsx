import { createContext, use, useState, type ReactNode } from 'react';
import type { Project } from '@/types/domain';
import { projects as initialProjects } from './catalog';
interface DemoSession {
  projects: Project[];
  createProject: (name: string) => string;
  saveAsset: (projectId: string, assetId: string) => void;
  removeAsset: (projectId: string, assetId: string) => void;
}
const Context = createContext<DemoSession | null>(null);
/** Entirely local demonstration state. Never imported by service implementations. */
export function DemoSessionProvider({ children }: {
  children: ReactNode;
}) {
  const [projects, setProjects] = useState(initialProjects);
  function createProject(name: string) {
    const id = `local-${Date.now()}`;
    setProjects(current => [...current, { id, name, description: 'Colección temporal de demostración.', assetIds: [], updated: 'Esta sesión · ejemplo' }]);
    return id;
  }
  function saveAsset(projectId: string, assetId: string) {
    setProjects(current => current.map(p => p.id === projectId && !p.assetIds.includes(assetId) ? { ...p, assetIds: [...p.assetIds, assetId] } : p));
  }
  function removeAsset(projectId: string, assetId: string) {
    setProjects(current => current.map(p => p.id === projectId ? { ...p, assetIds: p.assetIds.filter(id => id !== assetId) } : p));
  }
  return <Context value={{ projects, createProject, saveAsset, removeAsset }}>{children}</Context>;
}
export function useDemoSession() {
  const session = use(Context); if (!session)
    throw new Error('DemoSessionProvider missing'); return session;
}
