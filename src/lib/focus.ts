import { Vector3 } from 'three';
import type { Shot } from '../types';
import { worldBounds } from './scene';
export function focusPosition(shot: Shot): Vector3 | null {
  if (shot.focus.point) return new Vector3(...shot.focus.point);
  const target = shot.objects.find(o => o.id === shot.focus.targetId);
  return target ? worldBounds(target).getCenter(new Vector3()) : null;
}
