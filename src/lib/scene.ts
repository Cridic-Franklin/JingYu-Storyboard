import { Box3, Euler, MathUtils, Matrix4, PerspectiveCamera, Quaternion, Vector3 } from 'three';
import { defaultPlan, defaultAnnotations } from '../types';
import type { ObjectType, Shot, StageObject, Vec3 } from '../types';
import { t, translate, type MessageKey } from '../i18n';
import { semanticForward, shotSpatialData } from './spatial';
import { useSettings, type Language } from '../settings';

export const toRadians = (v: Vec3): Vec3 => v.map(MathUtils.degToRad) as Vec3;
export function cameraRotation(position: Vec3, target: Vec3): Vec3 {
  const camera = new PerspectiveCamera(); camera.position.fromArray(position); camera.lookAt(new Vector3(...target));
  return [camera.rotation.x, camera.rotation.y, camera.rotation.z].map(MathUtils.radToDeg) as Vec3;
}
export function makeObject(type: ObjectType, count = 0): StageObject {
  const position: Vec3 = type === 'Camera' ? [4, 2.8, 7] : type === 'Prop' ? [1.4, 0, 0.6] : [count * 0.5, 0, 0];
  return { id: crypto.randomUUID(), type, name: type === 'Camera' ? t('storyboardCamera') : `${t(type)}${count ? ` ${count + 1}` : ''}`, semanticName: '', position,
    rotation: type === 'Camera' ? cameraRotation(position, [0, 1, 0]) : [0, 0, 0], scale: [1, 1, 1], fov: 45, visible: true, locked: false, frontYaw: 0, frontLabel: type === 'Prop' ? t('interfaceFront') : '' };
}
export function makeShot(number: number): Shot {
  return { id: crypto.randomUUID(), number, title: t('untitledShot'), description: '', status: 'Draft', image: null,
    objects: [makeObject('Camera')], overlays: ['thirds'], spatialDescription: '', plan: defaultPlan(), annotations: defaultAnnotations(), primarySubjectId: null, constraints: '', negativeConstraints: '' };
}
export const presets = ['Wide', 'Medium', 'Close', 'Low Angle', 'High Angle'] as const;
export function presetCamera(name: typeof presets[number], subject: Vec3): Partial<StageObject> {
  const offsets: Record<typeof name, Vec3> = { Wide: [4, 3, 8], Medium: [2.7, 2.1, 5], Close: [1.2, 1.7, 2.5], 'Low Angle': [2.5, 0.5, 4.5], 'High Angle': [3, 6, 4.5] };
  const position = offsets[name].map((v, i) => v + subject[i]) as Vec3;
  return { position, rotation: cameraRotation(position, [subject[0], subject[1] + 1, subject[2]]), fov: name === 'Wide' ? 55 : 40 };
}
export function localBounds(object: StageObject): Box3 {
  const dimensions: Record<ObjectType, [Vec3, Vec3]> = {
    Character: [[-0.4, 0, -0.2], [0.4, 1.8, 0.23]], Prop: [[-0.3, 0, -0.3], [0.3, 0.96, 0.3]],
    Cube: [[-0.5, 0, -0.5], [0.5, 1, 0.5]], Sphere: [[-0.5, 0, -0.5], [0.5, 1, 0.5]],
    Cylinder: [[-0.5, 0, -0.5], [0.5, 1, 0.5]], Cone: [[-0.5, 0, -0.5], [0.5, 1, 0.5]],
    Capsule: [[-0.3, 0, -0.3], [0.3, 1.5, 0.3]], Plane: [[-1.5, 0, -1.5], [1.5, 0.025, 1.5]],
    Camera: [[-0.28, -0.2, -0.45], [0.28, 0.37, 0.2]],
  };
  const [min, max] = dimensions[object.type]; return new Box3(new Vector3(...min), new Vector3(...max));
}
export function objectMatrix(object: StageObject): Matrix4 {
  return new Matrix4().compose(new Vector3(...object.position), new Quaternion().setFromEuler(new Euler(...toRadians(object.rotation))), new Vector3(...object.scale));
}
export function worldBounds(object: StageObject): Box3 { return localBounds(object).applyMatrix4(objectMatrix(object)); }
export function storyboardCamera(object: StageObject) {
  const cam = new PerspectiveCamera(object.fov, 16 / 9, 0.1, 200);
  cam.position.fromArray(object.position); cam.rotation.set(...toRadians(object.rotation)); cam.updateMatrixWorld(); return cam;
}
export interface FramePosition { status: 'visible' | 'hidden' | 'noCamera' | 'behindCamera' | 'outsideFrame' | 'nearCamera'; x?: number; y?: number; width?: number; height?: number }
export function framePosition(object: StageObject, cameraObject?: StageObject): FramePosition {
  if (!object.visible) return { status: 'hidden' };
  if (!cameraObject) return { status: 'noCamera' };
  const camera = storyboardCamera(cameraObject); const bounds = localBounds(object); const matrix = objectMatrix(object);
  const corners: Vector3[] = [];
  for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) corners.push(new Vector3(x, y, z).applyMatrix4(matrix));
  const depths = corners.map(v => v.clone().applyMatrix4(camera.matrixWorldInverse).z);
  if (depths.every(z => z >= 0)) return { status: 'behindCamera' };
  if (depths.every(z => z < -camera.far)) return { status: 'outsideFrame' };
  if (depths.some(z => z > -camera.near)) return { status: 'nearCamera' };
  const projected = corners.map(v => v.project(camera));
  const minX = Math.min(...projected.map(v => v.x)), maxX = Math.max(...projected.map(v => v.x));
  const minY = Math.min(...projected.map(v => v.y)), maxY = Math.max(...projected.map(v => v.y));
  if (maxX < -1 || minX > 1 || maxY < -1 || minY > 1) return { status: 'outsideFrame' };
  const center = bounds.getCenter(new Vector3()).applyMatrix4(matrix).project(camera);
  return { status: 'visible', x: (center.x + 1) * 50, y: (1 - center.y) * 50, width: (maxX - minX) * 50, height: (maxY - minY) * 50 };
}
function relativeDirection(delta: Vector3): MessageKey {
  if (delta.length() < 0.05) return 'overlapping';
  const angle = Math.atan2(delta.x, delta.z);
  const sector = (Math.round(angle / (Math.PI / 4)) + 8) % 8;
  return (['front', 'frontRight', 'relativeRight', 'backRight', 'back', 'backLeft', 'relativeLeft', 'frontLeft'] as const)[sector];
}
export function describeScene(shot: Shot, language: Language = useSettings.getState().language): string {
  const tr = (key: MessageKey, values?: Record<string, string | number>) => translate(language, key, values);
  const cam = shot.objects.find(o => o.type === 'Camera'); if (!cam) return tr('missingCamera');
  const camera = storyboardCamera(cam);
  const subjects = shot.objects.filter(o => o.type !== 'Camera' && o.visible);
  const character = subjects.find(o => o.id === shot.primarySubjectId && o.type === 'Character') ?? subjects.find(o => o.type === 'Character');
  const lines: string[] = [`${tr('shot', { n: String(shot.number).padStart(3, '0') })} — ${shot.title}`];
  const nameOf = (o: StageObject) => o.name.trim() || o.semanticName.trim() || tr(o.type);
  if (character) {
    const delta = new Vector3(...cam.position).sub(new Vector3(...character.position)); const distance = delta.length();
    delta.applyQuaternion(new Quaternion().setFromEuler(new Euler(...toRadians(character.rotation))).invert());
    const h = cam.position[1] - character.position[1] - 1.65 * character.scale[1];
    lines.push(tr('descCamera', { camera: nameOf(cam), name: nameOf(character), direction: tr(relativeDirection(delta)), height: tr(Math.abs(h) < 0.55 ? 'eyeLevel' : h > 0 ? 'aboveEye' : 'belowEye'), distance: distance.toFixed(1) }));
  } else lines.push(tr('descLens', { camera: nameOf(cam), fov: Math.round(cam.fov) }));
  for (const o of subjects) {
    const name = nameOf(o), frame = framePosition(o, cam);
    const parts: string[] = [];
    if (character && o.id !== character.id) {
      const delta = new Vector3(...o.position).sub(new Vector3(...character.position)); const distance = delta.length();
      delta.applyQuaternion(new Quaternion().setFromEuler(new Euler(...toRadians(character.rotation))).invert());
      const direction = relativeDirection(delta);
      const relation = tr(direction);
      parts.push(tr('descRelation', { name, distance: distance.toFixed(1), direction: relation, character: nameOf(character) }));
    }
    if (frame.status === 'visible') parts.push(tr('descFrame', { name, x: Math.round(frame.x!), y: Math.round(frame.y!), width: Math.round(frame.width!), height: Math.round(frame.height!) }));
    else parts.push(tr('descOutside', { name }));
    if (o.type === 'Character' || o.type === 'Prop') {
      const forward = semanticForward(o);
      const towardCharacter = character && o.id !== character.id && forward.dot(new Vector3(...character.position).sub(new Vector3(...o.position)).normalize()) > 0.65;
      forward.applyQuaternion(camera.quaternion.clone().invert());
      const direction = towardCharacter ? nameOf(character!) : tr(Math.abs(forward.x) > Math.abs(forward.z) ? forward.x > 0 ? 'screenRight' : 'screenLeft' : forward.z > 0 ? 'towardCamera' : 'awayCamera');
      parts.push(o.type === 'Prop' && o.frontLabel ? tr('frontFacingLine', { name, front: o.frontLabel, target: direction }) : tr('descFacing', { name, direction }));
    }
    lines.push(parts.join(' '));
  }
  const depth = shotSpatialData(shot).depthOrder.map(id => shot.objects.find(o => o.id === id)!.name);
  if (depth.length > 1) lines.push(tr('depthOrder', { names: depth.join(' → ') }));
  const primary = subjects.find(o => o.id === shot.primarySubjectId);
  if (primary) lines.push(tr('primaryLine', { name: primary.name }));
  if (shot.constraints.trim()) lines.push(`${tr('constraints')}:\n${shot.constraints.trim()}`);
  if (shot.negativeConstraints.trim()) lines.push(`${tr('negativeConstraints')}:\n${shot.negativeConstraints.trim()}`);
  if (!subjects.length) lines.push(tr('descEmpty'));
  return lines.join('\n\n');
}
