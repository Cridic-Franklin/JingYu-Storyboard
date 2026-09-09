import Dexie, { type Table } from 'dexie';
import { create } from 'zustand';
import type { ObjectType, Overlay, Project, Shot, StageObject, TransformMode } from './types';
import { makeObject, makeShot } from './lib/scene';
import { t } from './i18n';

class ProjectDatabase extends Dexie {
  projects!: Table<Project>;
  constructor() { super('StoryboardSpatialDirector'); this.version(1).stores({ projects: 'id' }); }
}
const db = new ProjectDatabase();
interface State {
  project: Project; selectedId: string | null; mode: TransformMode; ready: boolean;
  saveStatus: 'loading' | 'saving' | 'saved' | 'error'; error: string;
  past: Project[]; future: Project[]; transaction: Project | null; transactionKind: 'field' | 'transform' | null;
  hydrate: () => Promise<void>; retrySave: () => void;
  addShot: () => void; selectShot: (id: string) => void; deleteShot: (id: string) => void;
  duplicateShot: (id: string) => void; copyPreviousScene: () => void;
  updateShot: (patch: Partial<Shot>, id?: string) => void; addObject: (type: ObjectType) => void;
  updateObject: (id: string, patch: Partial<StageObject>) => void; deleteObject: (id: string) => void;
  selectObject: (id: string | null) => void; setMode: (mode: TransformMode) => void; toggleOverlay: (overlay: Overlay) => void;
  beginTransaction: (kind?: 'field' | 'transform') => void; endTransaction: (kind?: 'field' | 'transform') => void; undo: () => void; redo: () => void;
}
let saveQueue = Promise.resolve();
let revision = 0;
function persist(project: Project) {
  const current = ++revision;
  useStore.setState({ saveStatus: 'saving', error: '' });
  saveQueue = saveQueue.catch(() => {}).then(async () => {
    await db.projects.put(project);
    if (current === revision) useStore.setState({ saveStatus: 'saved' });
  }).catch(error => {
    if (current === revision) useStore.setState({ saveStatus: 'error', error: error instanceof Error ? error.message : String(error) });
  });
}
const emptyProject: Project = { id: 'local-project', shots: [], activeShotId: null, nextShotNumber: 1 };
// Add 0.2 defaults without changing existing IDs, names, images or transforms.
export function migrateProject(project: Project): Project {
  return { ...project, shots: project.shots.map(shot => ({ ...shot, objects: shot.objects.map(o => ({ ...o, visible: o.visible ?? true, locked: o.locked ?? false })) })) };
}
function cloneObjects(objects: StageObject[]) { return objects.map(o => ({ ...structuredClone(o), id: crypto.randomUUID() })); }
let hydration: Promise<void> | undefined;
export const useStore = create<State>((set, get) => {
  function commit(project: Project) {
    const s = get();
    set({ project, ...(!s.transaction ? { past: [...s.past, s.project].slice(-60), future: [] } : {}) });
    persist(project);
  }
  function editShot(edit: (shot: Shot) => Shot, id = get().project.activeShotId) {
    const { project } = get();
    commit({ ...project, shots: project.shots.map(s => s.id === id ? edit(s) : s) });
  }
  function restore(project: Project) {
    const shot = project.shots.find(s => s.id === project.activeShotId);
    set({ project, selectedId: shot?.objects.some(o => o.id === get().selectedId) ? get().selectedId : null });
    persist(project);
  }
  return {
    project: emptyProject, selectedId: null, mode: 'translate', ready: false, saveStatus: 'loading', error: '', past: [], future: [], transaction: null, transactionKind: null,
    hydrate: () => hydration ??= (async () => {
      try {
        const existing = await db.projects.get('local-project');
        const first = makeShot(1);
        const project = existing ? migrateProject(existing) : { ...emptyProject, shots: [first], activeShotId: first.id, nextShotNumber: 2 };
        set({ project, ready: true, saveStatus: 'saved', selectedId: project.shots.find(s => s.id === project.activeShotId)?.objects[0]?.id ?? null });
        persist(project);
      } catch (error) { set({ ready: true, saveStatus: 'error', error: String(error) }); }
    })(),
    retrySave: () => persist(get().project),
    beginTransaction: (kind = 'field') => {
      if (get().transaction && get().transactionKind === kind) return;
      get().endTransaction(); set({ transaction: get().project, transactionKind: kind });
    },
    endTransaction: kind => {
      if (kind && get().transactionKind !== kind) return;
      const { transaction, project, past } = get();
      if (transaction && transaction !== project) set({ past: [...past, transaction].slice(-60), future: [] });
      set({ transaction: null, transactionKind: null });
    },
    undo: () => {
      get().endTransaction(); const { past, project, future } = get(); const previous = past.at(-1); if (!previous) return;
      set({ past: past.slice(0, -1), future: [project, ...future] }); restore(previous);
    },
    redo: () => {
      get().endTransaction(); const { past, project, future } = get(); if (!future[0]) return;
      set({ past: [...past, project].slice(-60), future: future.slice(1) }); restore(future[0]);
    },
    addShot: () => {
      get().endTransaction(); const p = get().project; const shot = makeShot(p.nextShotNumber);
      commit({ ...p, shots: [...p.shots, shot], activeShotId: shot.id, nextShotNumber: p.nextShotNumber + 1 });
      set({ selectedId: shot.objects[0].id });
    },
    selectShot: id => { get().endTransaction(); const project = { ...get().project, activeShotId: id }; set({ project, selectedId: null }); persist(project); },
    deleteShot: id => {
      get().endTransaction(); const p = get().project; const shots = p.shots.filter(s => s.id !== id);
      commit({ ...p, shots, activeShotId: p.activeShotId === id ? shots[0]?.id ?? null : p.activeShotId });
      set({ selectedId: null });
    },
    duplicateShot: id => {
      get().endTransaction(); const p = get().project; const source = p.shots.find(s => s.id === id); if (!source) return;
      const shot: Shot = { ...structuredClone(source), id: crypto.randomUUID(), number: p.nextShotNumber, title: t('copySuffix', { name: source.title }), objects: cloneObjects(source.objects), spatialDescription: '' };
      const shots = [...p.shots]; shots.splice(shots.findIndex(s => s.id === id) + 1, 0, shot);
      commit({ ...p, shots, activeShotId: shot.id, nextShotNumber: p.nextShotNumber + 1 }); set({ selectedId: null });
    },
    copyPreviousScene: () => {
      get().endTransaction(); const p = get().project; const index = p.shots.findIndex(s => s.id === p.activeShotId); if (index < 1) return;
      editShot(s => ({ ...s, objects: cloneObjects(p.shots[index - 1].objects), spatialDescription: '' })); set({ selectedId: null });
    },
    updateShot: (patch, id) => editShot(shot => ({ ...shot, ...patch, ...('title' in patch || 'description' in patch ? { spatialDescription: '' } : {}) }), id),
    addObject: type => {
      get().endTransaction(); const shot = get().project.shots.find(s => s.id === get().project.activeShotId); if (!shot) return;
      const camera = shot.objects.find(o => o.type === 'Camera');
      if (type === 'Camera' && camera) { set({ selectedId: camera.id }); return; }
      const object = makeObject(type, shot.objects.filter(o => o.type === type).length);
      editShot(s => ({ ...s, objects: [...s.objects, object], spatialDescription: '' })); set({ selectedId: object.id });
    },
    updateObject: (id, patch) => {
      const object = get().project.shots.find(s => s.id === get().project.activeShotId)?.objects.find(o => o.id === id);
      if (!object || (object.locked && ['position', 'rotation', 'scale', 'fov'].some(k => k in patch))) return;
      const { id: ignoredId, type: ignoredType, ...safePatch } = patch; void ignoredId; void ignoredType;
      editShot(shot => ({ ...shot, objects: shot.objects.map(o => o.id === id ? { ...o, ...safePatch } : o), spatialDescription: '' }));
    },
    deleteObject: id => {
      const object = get().project.shots.find(s => s.id === get().project.activeShotId)?.objects.find(o => o.id === id);
      if (!object || object.locked) return;
      get().endTransaction(); editShot(shot => ({ ...shot, objects: shot.objects.filter(o => o.id !== id), spatialDescription: '' })); set({ selectedId: null });
    },
    selectObject: selectedId => set({ selectedId }), setMode: mode => set({ mode }),
    toggleOverlay: overlay => editShot(s => ({ ...s, overlays: s.overlays.includes(overlay) ? s.overlays.filter(o => o !== overlay) : [...s.overlays, overlay] })),
  };
});
