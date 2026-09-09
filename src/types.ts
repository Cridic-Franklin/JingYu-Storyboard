export type Vec3 = [number, number, number];
export type ObjectType = 'Character' | 'Prop' | 'Cube' | 'Sphere' | 'Cylinder' | 'Capsule' | 'Cone' | 'Plane' | 'Camera';
export type TransformMode = 'select' | 'translate' | 'rotate' | 'scale';
export interface StageObject {
  id: string; type: ObjectType; name: string; semanticName: string;
  position: Vec3; rotation: Vec3; scale: Vec3; fov: number;
  visible: boolean; locked: boolean; frontYaw: number; frontLabel: string;
}
export type Overlay = 'thirds' | 'cross' | 'safe' | 'spiral';
export interface Shot {
  id: string; number: number; title: string; description: string;
  status: 'Draft' | 'Approved'; image: string | null; objects: StageObject[];
  overlays: Overlay[]; spatialDescription: string; descriptionLive?: boolean;
  plan: PlanData; annotations: CameraAnnotations; primarySubjectId: string | null; constraints: string; negativeConstraints: string;
}
export interface Project { id: string; shots: Shot[]; activeShotId: string | null; nextShotNumber: number; schemaVersion: number; name: string; updatedAt: string }

export type Point2 = [number, number];
export interface Sketch { id: string; tool: 'pen' | 'marker' | 'arrow' | 'text'; points: Point2[]; color: string; size: number; text?: string }
export interface MeasurePoint { position: Vec3; objectId?: string }
export interface Measurement { id: string; a: MeasurePoint; b: MeasurePoint }
export interface PlanData { sketches: Sketch[]; measurements: Measurement[]; view: { x: number; z: number; width: number }; layers: { scene: boolean; measurements: boolean; sketch: boolean }; showHeights: boolean }
export interface CameraAnnotations { names: boolean; types: boolean; facing: boolean; front: boolean; coordinates: boolean; bounds: boolean; measurements: boolean }
export const defaultAnnotations = (): CameraAnnotations => ({ names: false, types: false, facing: false, front: false, coordinates: false, bounds: false, measurements: false });
export const defaultPlan = (): PlanData => ({ sketches: [], measurements: [], view: { x: 0, z: 2, width: 24 }, layers: { scene: true, measurements: true, sketch: true }, showHeights: false });
