import { MathUtils, Vector3 } from 'three';
import type { Shot, StageObject, Vec3 } from '../types';
import { cameraRotation, worldBounds } from './scene';

export const aspectPresets = ['16:9', '1.85:1', '2.00:1', '2.35:1', '2.39:1', '4:3', '3:2', '9:16', '4:5', '1:1'];
export const parseRatio = (label: string) => { const [w, h] = label.split(':').map(Number); return w / h; };
export const ratioLabel = (ratio: number) => aspectPresets.find(p => Math.abs(parseRatio(p) - ratio) < .00001) ?? `${Number(ratio.toFixed(4))}:1`;
export const exportHeight = (width: number, ratio: number) => Math.max(1, Math.round(width / ratio));
// A fixed 24 mm vertical gate makes lens/FOV conversion explicit and independent of output pixels.
export const lensToFov = (mm: number) => MathUtils.radToDeg(2 * Math.atan(12 / mm));
export const fovToLens = (fov: number) => 12 / Math.tan(MathUtils.degToRad(fov) / 2);
export const shotSizes = ['extremeWide', 'wideShot', 'mediumWide', 'mediumShot', 'mediumClose', 'closeUp', 'extremeClose'] as const;
export const cameraAngles = ['eyeLevelAngle', 'lowAngle', 'highAngle', 'groundLevel', 'overhead', 'birdsEye', 'dutchLeft', 'dutchRight'] as const;
export type ShotSize = typeof shotSizes[number];
export type CameraAngle = typeof cameraAngles[number];
export function applyCameraPreset(shot: Shot, camera: StageObject, size?: ShotSize, angle?: CameraAngle): Partial<StageObject> {
  const subject = shot.objects.find(o => o.id === shot.primaryCharacterId) ?? shot.objects.find(o => o.id === shot.primarySubjectId) ?? shot.objects.find(o => o.visible && o.type === 'Character');
  const bounds = subject ? worldBounds(subject) : null;
  const target = bounds?.getCenter(new Vector3()) ?? new Vector3(0, 1, 0);
  const direction = new Vector3(...camera.position).sub(target); if (direction.length() < .01) direction.set(0, 0, 1);
  let distance = direction.length();
  if (size) {
    const coverage = [.13, .45, .65, .95, 1.4, 2.2, 4][shotSizes.indexOf(size)];
    const dims = bounds?.getSize(new Vector3()) ?? new Vector3(1, 1.8, 1);
    const extent = Math.max(dims.y, dims.x / shot.aspectRatio);
    distance = Math.max(.2, extent / (2 * coverage * Math.tan(MathUtils.degToRad(camera.fov / 2))));
    if (size === 'mediumClose' || size === 'closeUp' || size === 'extremeClose') target.y = bounds ? bounds.max.y - dims.y * .14 : 1.6;
  }
  direction.normalize();
  let roll = 0;
  if (angle) {
    const azimuth = Math.atan2(direction.x, direction.z);
    const elevation = { eyeLevelAngle: 0, lowAngle: -20, highAngle: 30, groundLevel: -20, overhead: 89.9, birdsEye: 65, dutchLeft: 0, dutchRight: 0 }[angle] * Math.PI / 180;
    direction.set(Math.sin(azimuth) * Math.cos(elevation), Math.sin(elevation), Math.cos(azimuth) * Math.cos(elevation));
    if (angle === 'dutchLeft') roll = 15; if (angle === 'dutchRight') roll = -15;
  }
  const position = target.clone().addScaledVector(direction, distance).toArray() as Vec3;
  if (angle === 'groundLevel') position[1] = .08;
  const rotation = cameraRotation(position, target.toArray() as Vec3); rotation[2] += roll;
  return { position, rotation };
}
