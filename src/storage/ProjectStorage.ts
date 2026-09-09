import Dexie, { type Table } from 'dexie';
import { defaultAnnotations, defaultPlan, type Project, type Shot, type StageObject } from '../types';

export interface ProjectSummary { id: string; name: string; updatedAt: string }
export interface ProjectStorage {
  activeId(): string;
  load(id: string): Promise<Project | undefined>;
  save(project: Project): Promise<void>;
  activate(id: string): void;
  recent(): Promise<ProjectSummary[]>;
  importFile(file: File): Promise<Project>;
  pickProject(): Promise<Project | null>;
  exportProject(project: Project): Promise<void>;
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
const types = ['Character', 'Prop', 'Camera', 'Cube', 'Sphere', 'Cylinder', 'Capsule', 'Cone', 'Plane'];
const text = (v: unknown, fallback = '') => typeof v === 'string' ? v : fallback;
export function migrateProject(input: unknown): Project {
  const raw = record(input);
  if (typeof raw.schemaVersion === 'number' && raw.schemaVersion > 3) throw new Error('This project needs a newer version of JingYu. Its data was not changed.');
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
      return { ...o, name: text(o.name, String(o.type)), semanticName: text(o.semanticName), visible: o.visible ?? true, locked: o.locked ?? false, fov: o.fov ?? 45, frontYaw: o.frontYaw ?? 0, frontLabel: text(o.frontLabel) } as unknown as StageObject;
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
    return { ...shot, title: text(shot.title), description: text(shot.description), status: shot.status === 'Approved' ? 'Approved' : 'Draft', image: shot.image ?? null, objects, overlays: Array.isArray(shot.overlays) ? shot.overlays.filter(k => ['thirds', 'cross', 'safe', 'spiral'].includes(String(k))) : ['thirds'], spatialDescription: text(shot.spatialDescription), plan, annotations: { ...defaultAnnotations(), ...(shot.annotations ? record(shot.annotations) : {}) }, primarySubjectId: typeof shot.primarySubjectId === 'string' && objects.some(o => o.id === shot.primarySubjectId) ? shot.primarySubjectId : null, constraints: text(shot.constraints), negativeConstraints: text(shot.negativeConstraints) } as Shot;
  });
  return { ...raw, id: raw.id, shots, activeShotId: shots.some(s => s.id === raw.activeShotId) ? raw.activeShotId as string : shots[0]?.id ?? null, nextShotNumber: Math.max(Number(raw.nextShotNumber) || 1, ...shots.map(s => s.number + 1)), schemaVersion: 3, name: text(raw.name, 'Untitled project'), updatedAt: text(raw.updatedAt, new Date().toISOString()) } as Project;
}
export function projectBlob(project: Project): Blob {
  return new Blob([JSON.stringify({ format: 'JingYu Project', version: 1, project }, null, 2)], { type: 'application/json' });
}
export function safeFilename(name: string) { return name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').slice(0, 100) || 'JingYu'; }
export class WebProjectStorage implements ProjectStorage {
  private db = new Database();
  activeId() { return localStorage.getItem('jy-active-project') || 'local-project'; }
  activate(id: string) { localStorage.setItem('jy-active-project', id); }
  async load(id: string) {
    const raw = await this.db.projects.get(id); if (!raw) return undefined;
    if (raw.schemaVersion !== 3 && !await this.db.backups.where('projectId').equals(id).count()) await this.db.backups.add({ projectId: id, createdAt: new Date().toISOString(), data: raw });
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
    return new Promise((resolve, reject) => {
      const input = document.createElement('input'); input.type = 'file'; input.accept = '.jyproject,application/json';
      input.oncancel = () => resolve(null);
      input.onchange = () => { if (input.files?.[0]) this.importFile(input.files[0]).then(resolve, reject); else resolve(null); }; input.click();
    });
  }
  async exportProject(project: Project) { this.download(projectBlob(project), `${safeFilename(project.name)}.jyproject`); }
  download(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
}
export const projectStorage: ProjectStorage = new WebProjectStorage();
