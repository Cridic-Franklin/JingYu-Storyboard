import { Box3, Euler, MathUtils, Matrix4, PerspectiveCamera, Quaternion, Vector3 } from 'three';
import { defaultPlan, defaultAnnotations, defaultFocus, defaultEnvironment, defaultLight, isLight } from '../types';
import type { ObjectType, Shot, StageObject, Vec3 } from '../types';
import { t } from '../i18n';
import { semanticDescription } from './semantics';
import { useSettings, type Language } from '../settings';

export const toRadians = (v: Vec3): Vec3 => v.map(MathUtils.degToRad) as Vec3;
export function cameraRotation(position: Vec3, target: Vec3): Vec3 {
  const camera = new PerspectiveCamera(); camera.position.fromArray(position); camera.lookAt(new Vector3(...target));
  return [camera.rotation.x, camera.rotation.y, camera.rotation.z].map(MathUtils.radToDeg) as Vec3;
}
export function makeObject(type: ObjectType, count = 0): StageObject {
  const position: Vec3 = type === 'Camera' ? [4, 2.8, 7] : type === 'Prop' ? [1.4, 0, 0.6] : [count * 0.5, 0, 0];
  return { id: crypto.randomUUID(), type, name: type === 'Camera' ? t('storyboardCamera') : `${t(type)}${count ? ` ${count + 1}` : ''}`, semanticName: '', position,
    ...(isLight({ type }) ? { light: defaultLight() } : {}), rotation: type === 'Camera' ? cameraRotation(position, [0, 1, 0]) : [0, 0, 0], scale: [1, 1, 1], fov: 45, visible: true, locked: false, frontYaw: 0, frontLabel: type === 'Prop' ? t('interfaceFront') : '' };
}
export function makeShot(number: number): Shot {
  return { id: crypto.randomUUID(), number, aspectRatio: 16 / 9, focus: defaultFocus(), environment: defaultEnvironment(), primaryCharacterId: null, secondarySubjectId: null, backgroundAnchorId: null, hardConstraints: [], includeTechnical: false, title: t('untitledShot'), description: '', status: 'Draft', image: null,
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
    DirectionalLight: [[-.2,-.2,-.2],[.2,.2,.2]], PointLight: [[-.2,-.2,-.2],[.2,.2,.2]], SpotLight: [[-.2,-.2,-.2],[.2,.2,.2]],
    Camera: [[-0.28, -0.2, -0.45], [0.28, 0.37, 0.2]],
  };
  const [min, max] = dimensions[object.type]; return new Box3(new Vector3(...min), new Vector3(...max));
}
export function objectMatrix(object: StageObject): Matrix4 {
  return new Matrix4().compose(new Vector3(...object.position), new Quaternion().setFromEuler(new Euler(...toRadians(object.rotation))), new Vector3(...object.scale));
}
export function worldBounds(object: StageObject): Box3 { return localBounds(object).applyMatrix4(objectMatrix(object)); }
export function storyboardCamera(object: StageObject, aspect = 16 / 9) {
  const cam = new PerspectiveCamera(object.fov, aspect, 0.1, 200);
  cam.position.fromArray(object.position); cam.rotation.set(...toRadians(object.rotation)); cam.updateMatrixWorld(); return cam;
}
export interface FramePosition { status: 'visible' | 'hidden' | 'noCamera' | 'behindCamera' | 'outsideFrame' | 'nearCamera'; x?: number; y?: number; width?: number; height?: number; left?: number; right?: number; top?: number; bottom?: number }
export function framePosition(object: StageObject, cameraObject?: StageObject, aspect = 16 / 9): FramePosition {
  if (!object.visible) return { status: 'hidden' };
  if (!cameraObject) return { status: 'noCamera' };
  const camera = storyboardCamera(cameraObject, aspect); const bounds = localBounds(object); const matrix = objectMatrix(object);
  const corners: Vector3[] = [];
  for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) corners.push(new Vector3(x, y, z).applyMatrix4(matrix));
  const depths = corners.map(v => v.clone().applyMatrix4(camera.matrixWorldInverse).z);
  if (depths.every(z => z >= 0)) return { status: 'behindCamera' };
  if (depths.every(z => z < -camera.far)) return { status: 'outsideFrame' };
  if (depths.some(z => z > -camera.near)) return { status: 'nearCamera' };
  const projected = corners.map(v => v.project(camera));
  const minX = Math.min(...projected.map(v => v.x)), maxX = Math.max(...projected.map(v => v.x));
  const minY = Math.min(...projected.map(v => v.y)), maxY = Math.max(...projected.map(v => v.y));
  const outside = maxX < -1 || minX > 1 || maxY < -1 || minY > 1;
  const center = bounds.getCenter(new Vector3()).applyMatrix4(matrix).project(camera);
  return { status: outside ? 'outsideFrame' : 'visible', left: (minX+1)*50, right: (maxX+1)*50, top: (1-maxY)*50, bottom: (1-minY)*50, x: (center.x + 1) * 50, y: (1 - center.y) * 50, width: (maxX - minX) * 50, height: (maxY - minY) * 50 };
}
export function describeScene(shot: Shot, language: Language = useSettings.getState().language): string { return semanticDescription(shot, language); }
