import { validatePose } from '../lib/pose';
import { validateObj } from '../lib/obj';
import { validateSpiral } from '../lib/spiral';
import Dexie, { type Table } from 'dexie';
import { defaultAnnotations, defaultPlan, defaultFocus, defaultEnvironment, defaultLight, isLight, type Project, type Shot, type StageObject } from '../types';

export interface ProjectSummary { id: string; name: string; updatedAt: string }
export interface ProjectStorage {
  activeId(): string;
  load(id: string): Promise<Project | undefined>;
  save(project: Project): Promise<void>;
  activate(id: string): void;
  recent(): Promise<ProjectSummary[]>;
  importFile(file: File): Promise<Project>;
  pickProject(): Promise<Project | null>;
  exportProject(project: Project): Promise<boolean>;
  download(blob: Blob, filename: string): void;
}
class Database extends Dexie {
  projects!: Table<Project>;
  backups!: Table<{ key?: number; projectId: string; createdAt: string; data: unknown }>;
  constructor() { super('StoryboardSpatialDirector'); this.version(1).stores({ projects: 'id' }); this.version(2).stores({ projects: 'id', backups: '++key,projectId,createdAt' }); }
}
const record = (v: unknown): Record<string, unknown> => {
  if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error('Invalid project structure. Original data was not changed.');
  return v as Record<string, unknown>;
};
const vector = (v: unknown) => Array.isArray(v) && v.length === 3 && v.every(n => typeof n === 'number' && Number.isFinite(n) && Math.abs(n) < 1e6);
const types = ['OBJ', 'Character', 'Prop', 'Camera', 'Cube', 'Sphere', 'Cylinder', 'Capsule', 'Cone', 'Plane', 'DirectionalLight', 'PointLight', 'SpotLight'];
const text = (v: unknown, fallback = '') => typeof v === 'string' ? v : fallback;
export function migrateProject(input: unknown): Project {
  const raw = record(input);
  if (raw.schemaVersion !== undefined && (!Number.isInteger(raw.schemaVersion) || Number(raw.schemaVersion) < 1)) throw new Error('Invalid project schema version.');
  if (typeof raw.schemaVersion === 'number' && raw.schemaVersion > 5) throw new Error('This project needs a newer version of JingYu. Its data was not changed.');
  if (typeof raw.id !== 'string' || !Array.isArray(raw.shots) || raw.shots.length > 1000) throw new Error('Invalid project ID or shot list.');
  const allIds = new Set<string>();
  const shots = raw.shots.map(value => {
    const shot = record(value);
    if (typeof shot.id !== 'string' || allIds.has(shot.id) || !Array.isArray(shot.objects) || shot.objects.length > 2000 || !Number.isInteger(shot.number) || Number(shot.number) < 1) throw new Error('Invalid or duplicate shot.');
    allIds.add(shot.id);
    const objects = shot.objects.map(value => {
      const o = record(value);
      if (typeof o.id !== 'string' || allIds.has(o.id) || !types.includes(String(o.type)) || !vector(o.position) || !vector(o.rotation) || !vector(o.scale)) throw new Error('Invalid, unsupported or duplicate scene object. Original data was retained.');
      allIds.add(o.id);
      if (['visible', 'locked'].some(k => o[k] !== undefined && typeof o[k] !== 'boolean')) throw new Error('Invalid object visibility or lock state.');
      if (o.fov !== undefined && (typeof o.fov !== 'number' || !Number.isFinite(o.fov) || o.fov < 1 || o.fov > 179)) throw new Error('Invalid camera field of view.');
      if (o.frontYaw !== undefined && (typeof o.frontYaw !== 'number' || !Number.isFinite(o.frontYaw))) throw new Error('Invalid semantic front direction.');
      const light = isLight({ type: String(o.type) }) ? { ...defaultLight(), ...(o.light ? record(o.light) : {}) } : undefined;
      if (light && (!/^#[0-9a-f]{6}$/i.test(light.color) || !Number.isFinite(light.intensity) || light.intensity < 0 || light.intensity > 10000 || !Number.isFinite(light.range) || light.range < 0 || light.range > 1000 || !Number.isFinite(light.coneAngle) || light.coneAngle < 1 || light.coneAngle > 170 || typeof light.castShadow !== 'boolean')) throw new Error('Invalid light settings.');
      if(o.displayColor !== undefined && (typeof o.displayColor !== 'string' || !/^#[0-9a-f]{6}$/i.test(o.displayColor))) throw new Error('Invalid editor color.');
      const pose = o.type === 'Character' ? validatePose(o.pose) : undefined;
      const asset = o.type === 'OBJ' ? validateObj(o.asset) : undefined;
      return { ...o, ...(pose ? {pose} : {}), ...(asset ? {asset} : {}), ...(light ? { light } : {}), name: text(o.name, String(o.type)), semanticName: text(o.semanticName), visible: o.visible ?? true, locked: o.locked ?? false, fov: o.fov ?? 45, frontYaw: o.frontYaw ?? 0, frontLabel: text(o.frontLabel) } as unknown as StageObject;
    });
    if (objects.filter(o => o.type === 'Camera').length > 1) throw new Error('Multiple active cameras are not supported in this version. No data was removed.');
    if (shot.overlays !== undefined && (!Array.isArray(shot.overlays) || !shot.overlays.every(k => ['thirds', 'cross', 'safe', 'spiral'].includes(String(k))))) throw new Error('Unsupported composition guides. No data was changed.');
    if (shot.status !== undefined && !['Draft', 'Approved'].includes(String(shot.status))) throw new Error('Unsupported shot status.');
    const plan = { ...defaultPlan(), ...(shot.plan ? record(shot.plan) : {}) };
    plan.layers = { ...defaultPlan().layers, ...plan.layers };
    if (!Object.values(plan.layers).every(v => typeof v === 'boolean') || typeof plan.showHeights !== 'boolean') throw new Error('Invalid plan layer visibility.');
    if (shot.annotations && !Object.values(record(shot.annotations)).every(v => typeof v === 'boolean')) throw new Error('Invalid camera annotations.');
    if (!plan.view || ![plan.view.x, plan.view.z, plan.view.width].every(Number.isFinite) || plan.view.width < 1 || plan.view.width > 1000) throw new Error('Invalid plan viewport.');
    if (!Array.isArray(plan.sketches) || !Array.isArray(plan.measurements) || plan.sketches.length > 10000 || plan.measurements.length > 10000) throw new Error('Invalid plan annotations.');
    for (const s of plan.sketches) {
      if (!s || typeof s.id !== 'string' || !['pen', 'marker', 'arrow', 'text'].includes(s.tool) || !/^#[0-9a-f]{6}$/i.test(s.color) || !Number.isFinite(s.size) || s.size <= 0 || s.size > 2 || !Array.isArray(s.points) || s.points.length > 50000 || !s.points.every(p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite))) throw new Error('Invalid sketch data.');
    }
    for (const m of plan.measurements) if (!m || typeof m.id !== 'string' || !m.a || !m.b || !vector(m.a.position) || !vector(m.b.position)) throw new Error('Invalid measurement data.');
    if (shot.image && (typeof shot.image !== 'string' || !/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(shot.image))) throw new Error('Unsupported storyboard image.');
    if (shot.aspectRatio !== undefined && (typeof shot.aspectRatio !== 'number' || !Number.isFinite(shot.aspectRatio) || shot.aspectRatio < .1 || shot.aspectRatio > 10)) throw new Error('Invalid shot aspect ratio.');
    const focus = { ...defaultFocus(), ...(shot.focus ? record(shot.focus) : {}) };
    if ((focus.point !== null && !vector(focus.point)) || (focus.targetId !== null && typeof focus.targetId !== 'string') || !Number.isFinite(focus.pickDistance) || focus.pickDistance < .1 || focus.pickDistance > 1000 || typeof focus.showPoint !== 'boolean' || typeof focus.showRegion !== 'boolean') throw new Error('Invalid focus settings.');
    if (focus.targetId && !objects.some(o => o.id === focus.targetId)) throw new Error('Missing focus target.');
    const r = focus.region;
    if (r && (!['rectangle','ellipse'].includes(r.shape) || ![r.x,r.y,r.width,r.height].every(Number.isFinite) || r.x < 0 || r.y < 0 || r.width <= 0 || r.height <= 0 || r.x+r.width > 1.00001 || r.y+r.height > 1.00001 || typeof r.label !== 'string')) throw new Error('Invalid focus region.');
    const environment = { ...defaultEnvironment(), ...(shot.environment ? record(shot.environment) : {}) };
    if (!Number.isFinite(environment.intensity) || environment.intensity < 0 || environment.intensity > 20 || !/^#[0-9a-f]{6}$/i.test(environment.color) || typeof environment.defaultRig !== 'boolean') throw new Error('Invalid environment light.');
    const subjectIds = { primaryCharacterId: shot.primaryCharacterId !== undefined ? shot.primaryCharacterId : (objects.some(o => o.id === shot.primarySubjectId && o.type === 'Character') ? shot.primarySubjectId : null), secondarySubjectId: shot.secondarySubjectId ?? null, backgroundAnchorId: shot.backgroundAnchorId ?? null };
    if (Object.values(subjectIds).some(id => id !== null && (typeof id !== 'string' || !objects.some(o => o.id === id))) || (subjectIds.primaryCharacterId && !objects.some(o => o.id === subjectIds.primaryCharacterId && o.type === 'Character'))) throw new Error('Invalid subject reference.');
    const rules = shot.hardConstraints ?? [];
    const relationValues: Record<string,string[]> = { subject: ['front','frontRight','relativeRight','backRight','back','backLeft','relativeLeft','frontLeft'], screen: ['screenLeft','screenRight','screenAbove','screenBelow'], depth: ['nearer','farther'], orientation: ['faces'] };
    if (!Array.isArray(rules) || rules.length > 10000 || rules.some(c => !c || typeof c.id !== 'string' || typeof c.objectId !== 'string' || typeof c.referenceId !== 'string' || !relationValues[c.space]?.includes(c.relation)) || new Set(rules.map(c => c.id)).size !== rules.length) throw new Error('Invalid spatial constraints.');
    if (shot.includeTechnical !== undefined && typeof shot.includeTechnical !== 'boolean') throw new Error('Invalid export preference.');
    if(shot.useEditorColors !== undefined && typeof shot.useEditorColors !== 'boolean') throw new Error('Invalid editor color preference.');
    return { ...shot, spiral: validateSpiral(shot.spiral), useEditorColors: shot.useEditorColors ?? false, ...subjectIds, hardConstraints: rules, includeTechnical: shot.includeTechnical ?? false, focus, environment, aspectRatio: shot.aspectRatio ?? 16 / 9, title: text(shot.title), description: text(shot.description), status: shot.status === 'Approved' ? 'Approved' : 'Draft', image: shot.image ?? null, objects, overlays: Array.isArray(shot.overlays) ? shot.overlays.filter(k => ['thirds', 'cross', 'safe', 'spiral'].includes(String(k))) : ['thirds'], spatialDescription: text(shot.spatialDescription), plan, annotations: { ...defaultAnnotations(), ...(shot.annotations ? record(shot.annotations) : {}) }, primarySubjectId: typeof shot.primarySubjectId === 'string' && objects.some(o => o.id === shot.primarySubjectId) ? shot.primarySubjectId : null, constraints: text(shot.constraints), negativeConstraints: text(shot.negativeConstraints) } as Shot;
  });
  return { ...raw, id: raw.id, shots, activeShotId: shots.some(s => s.id === raw.activeShotId) ? raw.activeShotId as string : shots[0]?.id ?? null, nextShotNumber: Math.max(Number(raw.nextShotNumber) || 1, ...shots.map(s => s.number + 1)), schemaVersion: 5, name: text(raw.name, 'Untitled project'), updatedAt: text(raw.updatedAt, new Date().toISOString()) } as Project;
}
export function projectBlob(project: Project): Blob {
  return new Blob([JSON.stringify({ format: 'JingYu Project', version: 1, project }, null, 2)], { type: 'application/json' });
}
export function safeFilename(name: string) { return name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').slice(0, 100) || 'JingYu'; }
type WritableHandle = { getFile(): Promise<File>; createWritable(): Promise<{ write(data: Blob): Promise<void>; close(): Promise<void>; abort(): Promise<void> }> };
type FilePickerWindow = Window & { showOpenFilePicker?: (options: unknown) => Promise<WritableHandle[]>; showSaveFilePicker?: (options: unknown) => Promise<WritableHandle> };
const pickerTypes = [{ description: 'JingYu Project', accept: { 'application/json': ['.jyproject'] } }];
export class WebProjectStorage implements ProjectStorage {
  private handles = new Map<string, WritableHandle>();
  private db = new Database();
  activeId() { return localStorage.getItem('jy-active-project') || 'local-project'; }
  activate(id: string) { localStorage.setItem('jy-active-project', id); }
  async load(id: string) {
    const raw = await this.db.projects.get(id); if (!raw) return undefined;
    if (raw.schemaVersion !== 5 && !(await this.db.backups.where('projectId').equals(id).toArray()).some(b => (b.data as { schemaVersion?: number })?.schemaVersion === raw.schemaVersion)) await this.db.backups.add({ projectId: id, createdAt: new Date().toISOString(), data: raw });
    return migrateProject(raw);
  }
  async save(project: Project) { await this.db.projects.put(project); }
  async recent() { return (await this.db.projects.toArray()).map(p => ({ id: p.id, name: p.name || 'Untitled project', updatedAt: p.updatedAt || '' })).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)); }
  async importFile(file: File) {
    if (file.size > 100 * 1024 * 1024) throw new Error('Project file exceeds 100 MB.');
    const data = record(JSON.parse(await file.text()));
    if (data.format && data.format !== 'JingYu Project') throw new Error('Unsupported project file format.');
    if (data.format && data.version !== 1) throw new Error('Unsupported portable project version.');
    const project = migrateProject(data.project ?? data);
    // Import is always a new workspace: existing autosaves can never be overwritten by opening a file.
    project.id = crypto.randomUUID(); project.updatedAt = new Date().toISOString();
    return project;
  }
  pickProject(): Promise<Project | null> {
    const picker = (window as FilePickerWindow).showOpenFilePicker?.bind(window);
    if (picker) return (async () => { try { const [handle] = await picker({ types: pickerTypes, multiple: false }); const project = await this.importFile(await handle.getFile()); this.handles.set(project.id, handle); return project; } catch (e) { if ((e as DOMException).name === 'AbortError') return null; throw e; } })();
    return new Promise((resolve, reject) => {
      const input = document.createElement('input'); input.type = 'file'; input.accept = '.jyproject,application/json';
      input.oncancel = () => resolve(null);
      input.onchange = () => { if (input.files?.[0]) this.importFile(input.files[0]).then(resolve, reject); else resolve(null); }; input.click();
    });
  }
  async exportProject(project: Project) {
    const picker = (window as FilePickerWindow).showSaveFilePicker?.bind(window);
    if (picker) {
      try {
        const handle = this.handles.get(project.id) ?? await picker({ suggestedName: `${safeFilename(project.name)}.jyproject`, types: pickerTypes });
        const writer = await handle.createWritable();
        try { await writer.write(projectBlob(project)); await writer.close(); } catch (e) { await writer.abort().catch(() => {}); throw e; }
        this.handles.set(project.id, handle); return true;
      } catch (e) { if ((e as DOMException).name === 'AbortError') return false; throw e; }
    }
    this.download(projectBlob(project), `${safeFilename(project.name)}.jyproject`); return true;
  }
  download(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
}
export const projectStorage: ProjectStorage = new WebProjectStorage();
