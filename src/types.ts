export type Vec3 = [number, number, number];
export type ObjectType = 'Character' | 'Prop' | 'Cube' | 'Sphere' | 'Cylinder' | 'Capsule' | 'Cone' | 'Plane' | 'Camera';
export type TransformMode = 'select' | 'translate' | 'rotate' | 'scale';
export interface StageObject {
  id: string; type: ObjectType; name: string; semanticName: string;
  position: Vec3; rotation: Vec3; scale: Vec3; fov: number;
  visible: boolean; locked: boolean;
}
export type Overlay = 'thirds' | 'cross' | 'safe' | 'spiral';
export interface Shot {
  id: string; number: number; title: string; description: string;
  status: 'Draft' | 'Approved'; image: string | null; objects: StageObject[];
  overlays: Overlay[]; spatialDescription: string;
}
export interface Project { id: string; shots: Shot[]; activeShotId: string | null; nextShotNumber: number }
