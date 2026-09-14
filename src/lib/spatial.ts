import { isLight } from '../types';
import { focusPosition } from './focus';
import { Euler, MathUtils, Vector3 } from 'three';
import type { MeasurePoint, Shot, StageObject } from '../types';
import { framePosition, objectMatrix, localBounds, storyboardCamera, toRadians, worldBounds } from './scene';
export function semanticForward(object: StageObject) {
  return new Vector3(0, 0, object.type === 'Camera' ? -1 : 1).applyAxisAngle(new Vector3(0, 1, 0), MathUtils.degToRad(object.frontYaw || 0)).applyEuler(new Euler(...toRadians(object.rotation))).normalize();
}
export function worldFacing(object: StageObject) { const f = semanticForward(object); return (MathUtils.radToDeg(Math.atan2(f.x, f.z)) + 360) % 360; }
export function screenFacing(object: StageObject, cameraObject: StageObject): 'screenRight' | 'screenLeft' | 'towardCamera' | 'awayCamera' {
  const v = semanticForward(object).applyQuaternion(storyboardCamera(cameraObject).quaternion.clone().invert());
  return Math.abs(v.x) > Math.abs(v.z) ? v.x > 0 ? 'screenRight' : 'screenLeft' : v.z > 0 ? 'towardCamera' : 'awayCamera';
}
export function measurementPoint(point: MeasurePoint, shot: Shot) { return new Vector3(...(shot.objects.find(o => o.id === point.objectId)?.position ?? point.position)); }
export function shotSpatialData(shot: Shot) {
  const cameraObject = shot.objects.find(o => o.type === 'Camera'); const camera = cameraObject ? storyboardCamera(cameraObject, shot.aspectRatio) : null;
  const primary = shot.objects.find(o => o.id === shot.primaryCharacterId);
  const objects = shot.objects.filter(o => o.type !== 'Camera' && !isLight(o)).map(o => {
    const center = localBounds(o).getCenter(new Vector3()).applyMatrix4(objectMatrix(o)); const depth = camera ? -center.clone().applyMatrix4(camera.matrixWorldInverse).z : null;
    const front = semanticForward(o);
    const target = shot.objects.filter(other => other.id !== o.id && other.visible && other.type !== 'Camera' && !isLight(other)).map(other => ({ object: other, alignment: front.dot(new Vector3(...other.position).sub(new Vector3(...o.position)).normalize()) })).filter(p => p.alignment > 0.8).sort((a, b) => b.alignment - a.alignment)[0]?.object;
    const delta = primary ? new Vector3(...o.position).sub(new Vector3(...primary.position)) : null;
    const distance = delta?.length() ?? null;
    if (delta && primary) delta.applyAxisAngle(new Vector3(0, 1, 0), -worldFacing(primary) * Math.PI / 180);
    const directionIndex = delta ? (Math.round(Math.atan2(delta.x, delta.z) / (Math.PI / 4)) + 8) % 8 : 0;
    const relativeToPrimary = primary && primary.id !== o.id ? { space: 'subject', id: primary.id, name: primary.name, distanceMeters: distance, planarDirection: ['front', 'front-right', 'right', 'back-right', 'back', 'back-left', 'left', 'front-left'][directionIndex] } : null;
    return { id: o.id, relativeToPrimary, name: o.name, type: o.type, semanticType: o.semanticType, visible: o.visible, locked: o.locked, world: { position: o.position, rotation: o.rotation, scale: o.scale }, front: { localYaw: o.frontYaw, meaning: o.frontLabel, worldYaw: worldFacing(o), headWorldYaw: o.type === 'Character' ? (worldFacing(o) + (o.headFacingYaw ?? 0) + 360) % 360 : null, screenFacing: cameraObject ? screenFacing(o, cameraObject) : null, facesObjectId: target?.id ?? null }, screen: framePosition(o, cameraObject, shot.aspectRatio), depthMeters: depth, distanceToCameraMeters: cameraObject ? new Vector3(...o.position).distanceTo(new Vector3(...cameraObject.position)) : null, dimensionsMeters: worldBounds(o).getSize(new Vector3()).toArray() };
  });
  const depthOrder = objects.filter(o => o.screen.status === 'visible').sort((a, b) => (a.depthMeters ?? 0) - (b.depthMeters ?? 0)).map(o => o.id);
  const focusPoint = focusPosition(shot);
  return { focus: { ...shot.focus, distanceMeters: camera && focusPoint ? camera.position.distanceTo(focusPoint) : null }, environment: shot.environment, lights: shot.objects.filter(isLight), format: 'SceneAxis Spatial Data', version: 2, shot: { id: shot.id, number: shot.number, title: shot.title, duration: shot.duration, sequence: shot.sequence, aspectRatio: shot.aspectRatio, primarySubjectId: shot.primarySubjectId }, camera: cameraObject ? { id: cameraObject.id, name: cameraObject.name, position: cameraObject.position, rotation: cameraObject.rotation, facing: semanticForward(cameraObject).toArray(), verticalFovDegrees: cameraObject.fov } : null, objects, depthOrder, motionPaths: shot.motionPaths.map(path => ({ ...path, startPosition: path.points[0]?.position ?? null, endPosition: path.points.at(-1)?.position ?? null, movementDistance: path.points.slice(1).reduce((sum, point, index) => sum + new Vector3(...point.position).distanceTo(new Vector3(...path.points[index].position)), 0) })), measurements: shot.plan.measurements.map(m => ({ id: m.id, a: m.a, b: m.b, distanceMeters: measurementPoint(m.a, shot).distanceTo(measurementPoint(m.b, shot)) })), constraints: shot.constraints.split('\n').filter(Boolean), negativeConstraints: shot.negativeConstraints.split('\n').filter(Boolean), approximation: 'Proxy bounds before occlusion; screen origin is top left. Depth is measured along camera forward. Constraints are instructions, not solved.' };
}
