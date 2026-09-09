import type { ObjAsset } from './lib/obj';
import { create } from 'zustand';
import { defaultPlan, isLight } from './types';
import type { PlanData, ObjectType, Overlay, Project, Shot, StageObject, TransformMode } from './types';
import { makeObject, makeShot } from './lib/scene';
import { t } from './i18n';

import { projectStorage, migrateProject } from './storage/ProjectStorage';
export { migrateProject };
interface State {
  importObj: (asset: ObjAsset) => void;
  recovery: boolean;
  newProject: (name: string) => Promise<void>; openProject: (project: Project) => Promise<void>; openRecent: (id: string) => Promise<void>; saveProject: () => Promise<void>; saveAs: (name: string) => Promise<void>;
  updatePlan: (patch: Partial<PlanData>) => void; duplicateObject: (id: string) => void;
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
    await projectStorage.save(project);
    if (current === revision) useStore.setState({ saveStatus: 'saved' });
  }).catch(error => {
    if (current === revision) useStore.setState({ saveStatus: 'error', error: error instanceof Error ? error.message : String(error) });
  });
}
const emptyProject: Project = { id: 'local-project', shots: [], activeShotId: null, nextShotNumber: 1, schemaVersion: 5, name: 'Untitled project', updatedAt: new Date().toISOString() };
function cloneScene(shot: Shot) {
  const ids = new Map(shot.objects.map(o => [o.id, crypto.randomUUID()]));
  const plan = structuredClone(shot.plan ?? defaultPlan());
  plan.sketches.forEach(s => { s.id = crypto.randomUUID(); });
  plan.measurements.forEach(m => { m.id = crypto.randomUUID(); for (const p of [m.a, m.b]) if (p.objectId) p.objectId = ids.get(p.objectId); });
  const focus = structuredClone(shot.focus); focus.targetId = focus.targetId ? ids.get(focus.targetId) ?? null : null;
  return { spiral: structuredClone(shot.spiral), useEditorColors: shot.useEditorColors, primaryCharacterId: ids.get(shot.primaryCharacterId ?? '') ?? null, secondarySubjectId: ids.get(shot.secondarySubjectId ?? '') ?? null, backgroundAnchorId: ids.get(shot.backgroundAnchorId ?? '') ?? null, hardConstraints: shot.hardConstraints.map(c => ({ ...c, id: crypto.randomUUID(), objectId: ids.get(c.objectId) ?? c.objectId, referenceId: ids.get(c.referenceId) ?? c.referenceId })), includeTechnical: shot.includeTechnical, focus, environment: structuredClone(shot.environment), aspectRatio: shot.aspectRatio, objects: shot.objects.map(o => ({ ...structuredClone(o), id: ids.get(o.id)! })), plan, primarySubjectId: shot.primarySubjectId ? ids.get(shot.primarySubjectId) ?? null : null };
}
let hydration: Promise<void> | undefined;
export const useStore = create<State>((set, get) => {
  function commit(project: Project) {
    if (get().recovery) return;
    project = { ...project, updatedAt: new Date().toISOString() };
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
  async function switchProject(project: Project) {
    get().endTransaction(); await saveQueue;
    if (!get().recovery && get().saveStatus === 'error') throw new Error(t('saveBeforeSwitch'));
    await projectStorage.save(project); projectStorage.activate(project.id);
    set({ project, recovery: false, selectedId: null, past: [], future: [], transaction: null, transactionKind: null, saveStatus: 'saved', error: '' });
  }
  return {
    importObj: asset => {
      get().endTransaction(); const object = { ...makeObject('OBJ'), name: asset.filename.replace(/\.obj$/i,''), asset };
      editShot(s=>({...s,objects:[...s.objects,object],spatialDescription:''})); set({selectedId:object.id});
    },
    recovery: false,
    newProject: async name => { const shot = makeShot(1); await switchProject({ ...emptyProject, id: crypto.randomUUID(), name: name.trim() || t('untitledProject'), shots: [shot], activeShotId: shot.id, nextShotNumber: 2, updatedAt: new Date().toISOString() }); },
    openProject: project => switchProject(migrateProject(project)),
    openRecent: async id => { const project = await projectStorage.load(id); if (project) await switchProject(project); },
    saveProject: async () => { get().endTransaction(); await saveQueue; await projectStorage.exportProject(get().project); },
    saveAs: async name => { const project = { ...structuredClone(get().project), id: crypto.randomUUID(), name: name.trim() || get().project.name, updatedAt: new Date().toISOString() }; get().endTransaction(); await saveQueue; if (!get().recovery && get().saveStatus === 'error') throw new Error(t('saveBeforeSwitch')); if (await projectStorage.exportProject(project)) await switchProject(project); },
    updatePlan: patch => editShot(s => ({ ...s, plan: { ...s.plan, ...patch } })),
    duplicateObject: id => {
      const s = get().project.shots.find(s => s.id === get().project.activeShotId); const source = s?.objects.find(o => o.id === id);
      if (!source || source.type === 'Camera') return;
      get().endTransaction(); const object = { ...structuredClone(source), id: crypto.randomUUID(), name: t('copySuffix', { name: source.name }), position: [source.position[0] + 0.5, source.position[1], source.position[2] + 0.5] as StageObject['position'] };
      editShot(s => ({ ...s, objects: [...s.objects, object], spatialDescription: '' })); set({ selectedId: object.id });
    },
    project: emptyProject, selectedId: null, mode: 'translate', ready: false, saveStatus: 'loading', error: '', past: [], future: [], transaction: null, transactionKind: null,
    hydrate: () => hydration ??= (async () => {
      try {
        const existing = await projectStorage.load(projectStorage.activeId());
        const first = makeShot(1);
        const project = existing ? migrateProject(existing) : { ...emptyProject, shots: [first], activeShotId: first.id, nextShotNumber: 2 };
        projectStorage.activate(project.id);
        set({ project, recovery: false, ready: true, saveStatus: 'saved', selectedId: project.shots.find(s => s.id === project.activeShotId)?.objects[0]?.id ?? null });
        persist(project);
      } catch (error) { set({ recovery: true, ready: true, saveStatus: 'error', error: String(error) }); }
    })(),
    retrySave: () => { if (get().recovery) { hydration = undefined; void get().hydrate(); } else persist(get().project); },
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
      const shot: Shot = { ...structuredClone(source), id: crypto.randomUUID(), number: p.nextShotNumber, title: t('copySuffix', { name: source.title }), ...cloneScene(source), spatialDescription: '' };
      const shots = [...p.shots]; shots.splice(shots.findIndex(s => s.id === id) + 1, 0, shot);
      commit({ ...p, shots, activeShotId: shot.id, nextShotNumber: p.nextShotNumber + 1 }); set({ selectedId: null });
    },
    copyPreviousScene: () => {
      get().endTransaction(); const p = get().project; const index = p.shots.findIndex(s => s.id === p.activeShotId); if (index < 1) return;
      editShot(s => ({ ...s, ...cloneScene(p.shots[index - 1]), spatialDescription: '' })); set({ selectedId: null });
    },
    updateShot: (patch, id) => editShot(shot => ({ ...shot, ...patch, ...('title' in patch || 'description' in patch ? { spatialDescription: '' } : {}) }), id),
    addObject: type => {
      get().endTransaction(); const shot = get().project.shots.find(s => s.id === get().project.activeShotId); if (!shot) return;
      const camera = shot.objects.find(o => o.type === 'Camera');
      if (type === 'Camera' && camera) { set({ selectedId: camera.id }); return; }
      const object = makeObject(type, shot.objects.filter(o => o.type === type).length);
      editShot(s => ({ ...s, environment: isLight(object) ? { ...s.environment, defaultRig: false } : s.environment, objects: [...s.objects, object], spatialDescription: '' })); set({ selectedId: object.id });
    },
    updateObject: (id, patch) => {
      const object = get().project.shots.find(s => s.id === get().project.activeShotId)?.objects.find(o => o.id === id);
      if (!object || (object.locked && ['position', 'rotation', 'scale', 'fov', 'frontYaw', 'light', 'pose'].some(k => k in patch))) return;
      const { id: ignoredId, type: ignoredType, ...safePatch } = patch; void ignoredId; void ignoredType;
      editShot(shot => ({ ...shot, objects: shot.objects.map(o => o.id === id ? { ...o, ...safePatch } : o), spatialDescription: '' }));
    },
    deleteObject: id => {
      const object = get().project.shots.find(s => s.id === get().project.activeShotId)?.objects.find(o => o.id === id);
      if (!object || object.locked) return;
      get().endTransaction(); editShot(shot => ({ ...shot, objects: shot.objects.filter(o => o.id !== id), primaryCharacterId: shot.primaryCharacterId === id ? null : shot.primaryCharacterId, secondarySubjectId: shot.secondarySubjectId === id ? null : shot.secondarySubjectId, backgroundAnchorId: shot.backgroundAnchorId === id ? null : shot.backgroundAnchorId, focus: { ...shot.focus, targetId: shot.focus.targetId === id ? null : shot.focus.targetId }, primarySubjectId: shot.primarySubjectId === id ? null : shot.primarySubjectId, plan: { ...shot.plan, measurements: shot.plan.measurements.map(m => ({ ...m, a: m.a.objectId === id ? { position: [...object.position] } : m.a, b: m.b.objectId === id ? { position: [...object.position] } : m.b })) }, spatialDescription: '' })); set({ selectedId: null });
    },
    selectObject: selectedId => set({ selectedId }), setMode: mode => set({ mode }),
    toggleOverlay: overlay => editShot(s => ({ ...s, overlays: s.overlays.includes(overlay) ? s.overlays.filter(o => o !== overlay) : [...s.overlays, overlay] })),
  };
});
