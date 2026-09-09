import { Box3, Euler, Matrix4, Vector3 } from 'three';
import type { Vec3 } from '../types';

export const joints = ['torso','head','leftShoulder','rightShoulder','leftElbow','rightElbow','leftHip','rightHip','leftKnee','rightKnee'] as const;
export type Joint = typeof joints[number];
export const posePresets = ['standing','walking','crouching','singleKnee','doubleKnee','sitting','leaning'] as const;
export type PosePreset = typeof posePresets[number];
export interface Pose { preset: PosePreset | 'customPose'; basePreset?: PosePreset; hipHeight: number; joints: Record<Joint, Vec3> }
export function makePose(preset: PosePreset = 'standing'): Pose {
  const p: Pose = { preset, hipHeight: .95, joints: Object.fromEntries(joints.map(k => [k,[0,0,0]])) as Pose['joints'] };
  const bend = (k: Joint, x: number) => { p.joints[k][0] = x; };
  if (preset === 'walking') { bend('leftHip',-25); bend('rightHip',25); bend('rightKnee',25); bend('leftShoulder',25); bend('rightShoulder',-25); }
  if (preset === 'crouching') { p.hipHeight=.57; for (const k of ['leftHip','rightHip'] as const) bend(k,-60); for (const k of ['leftKnee','rightKnee'] as const) bend(k,110); bend('torso',20); }
  if (preset === 'singleKnee') { p.hipHeight=.5; bend('leftHip',-90); bend('leftKnee',90); bend('rightKnee',90); }
  if (preset === 'doubleKnee') { p.hipHeight=.5; bend('leftKnee',90); bend('rightKnee',90); }
  if (preset === 'sitting') { p.hipHeight=.5; bend('leftHip',-90); bend('rightHip',-90); bend('leftKnee',90); bend('rightKnee',90); }
  if (preset === 'leaning') bend('torso',35);
  return p;
}
export interface JointDefinition { parent: Joint | null; offset: Vec3; center: Vec3; size: Vec3; shape: 'box' | 'sphere' | 'capsule' }
export const skeleton: Record<Joint, JointDefinition> = {
  torso: { parent:null,offset:[0,0,0],center:[0,.27,0],size:[.38,.58,.38],shape:'capsule' },
  head: { parent:'torso',offset:[0,.67,0],center:[0,0,0],size:[.3,.3,.3],shape:'sphere' },
  leftShoulder: { parent:'torso',offset:[-.27,.45,0],center:[0,-.16,0],size:[.13,.36,.13],shape:'capsule' },
  rightShoulder: { parent:'torso',offset:[.27,.45,0],center:[0,-.16,0],size:[.13,.36,.13],shape:'capsule' },
  leftElbow: { parent:'leftShoulder',offset:[0,-.32,0],center:[0,-.15,0],size:[.12,.34,.12],shape:'capsule' },
  rightElbow: { parent:'rightShoulder',offset:[0,-.32,0],center:[0,-.15,0],size:[.12,.34,.12],shape:'capsule' },
  leftHip: { parent:null,offset:[-.12,0,0],center:[0,-.225,0],size:[.18,.49,.18],shape:'capsule' },
  rightHip: { parent:null,offset:[.12,0,0],center:[0,-.225,0],size:[.18,.49,.18],shape:'capsule' },
  leftKnee: { parent:'leftHip',offset:[0,-.45,0],center:[0,-.225,0],size:[.16,.49,.16],shape:'capsule' },
  rightKnee: { parent:'rightHip',offset:[0,-.45,0],center:[0,-.225,0],size:[.16,.49,.16],shape:'capsule' },
};
export function jointMatrices(pose: Pose) {
  const result = {} as Record<Joint, Matrix4>;
  function matrix(k: Joint): Matrix4 {
    if (result[k]) return result[k];
    const def = skeleton[k], local = new Matrix4().makeRotationFromEuler(new Euler(...pose.joints[k].map(n=>n*Math.PI/180) as Vec3));
    local.setPosition(...def.offset);
    return result[k] = (def.parent ? matrix(def.parent) : new Matrix4().makeTranslation(0,pose.hipHeight,0)).clone().multiply(local);
  }
  joints.forEach(matrix); return result;
}
export function poseBounds(pose: Pose) {
  const matrices = jointMatrices(pose), bounds = new Box3();
  for (const k of joints) {
    const d=skeleton[k]; bounds.union(new Box3().setFromCenterAndSize(new Vector3(...d.center),new Vector3(...d.size)).applyMatrix4(matrices[k]));
    if (k.endsWith('Knee')) bounds.union(new Box3().setFromCenterAndSize(new Vector3(0,-.44,.08),new Vector3(.18,.12,.3)).applyMatrix4(matrices[k]));
    if (k==='head') bounds.union(new Box3().setFromCenterAndSize(new Vector3(0,0,.145),new Vector3(.12,.055,.04)).applyMatrix4(matrices[k]));
  }
  return bounds;
}
export function validatePose(value: unknown): Pose {
  if (value === undefined) return makePose();
  const p=value as Pose;
  if (!p || (p.basePreset!==undefined && !posePresets.includes(p.basePreset)) || ![...posePresets,'customPose'].includes(p.preset) || !Number.isFinite(p.hipHeight) || p.hipHeight<0 || p.hipHeight>10 || !p.joints || joints.some(k=>!Array.isArray(p.joints[k]) || p.joints[k].length!==3 || p.joints[k].some(n=>!Number.isFinite(n)||Math.abs(n)>360))) throw new Error('Invalid character pose. Original project was retained.');
  return p;
}
