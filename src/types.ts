import type { Pose } from './lib/pose';
import type { ObjAsset } from './lib/obj';
import type { SpiralGuide } from './lib/spiral';
export type Vec3 = [number, number, number];
export type ObjectType = 'OBJ' | 'Character' | 'Prop' | 'Cube' | 'Sphere' | 'Cylinder' | 'Capsule' | 'Cone' | 'Plane' | 'Camera' | 'DirectionalLight' | 'PointLight' | 'SpotLight';
export type TransformMode = 'select' | 'translate' | 'rotate' | 'scale';
export interface StageObject {
  id: string; type: ObjectType; name: string; semanticName: string;
  position: Vec3; rotation: Vec3; scale: Vec3; fov: number;
  visible: boolean; locked: boolean; frontYaw: number; frontLabel: string;
  pose?: Pose; displayColor?: string; asset?: ObjAsset;
  light?: { intensity: number; color: string; range: number; coneAngle: number; castShadow: boolean };
}
export type Overlay = 'thirds' | 'cross' | 'safe' | 'spiral';
export interface Shot {
  spiral: SpiralGuide; useEditorColors: boolean;
  aspectRatio: number;
  focus: FocusData;
  environment: { intensity: number; color: string; defaultRig: boolean };
  primaryCharacterId: string | null; secondarySubjectId: string | null; backgroundAnchorId: string | null;
  hardConstraints: SpatialConstraint[]; includeTechnical: boolean;
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
export interface CameraAnnotations { focusPoint: boolean; focusRegion: boolean; semantic: boolean; names: boolean; types: boolean; facing: boolean; front: boolean; coordinates: boolean; bounds: boolean; measurements: boolean }
export const defaultAnnotations = (): CameraAnnotations => ({ focusPoint: false, focusRegion: false, semantic: false, names: false, types: false, facing: false, front: false, coordinates: false, bounds: false, measurements: false });
export const defaultPlan = (): PlanData => ({ sketches: [], measurements: [], view: { x: 0, z: 2, width: 24 }, layers: { scene: true, measurements: true, sketch: true }, showHeights: false });
export interface FocusData { targetId: string | null; point: Vec3 | null; pickDistance: number; region: { shape: 'rectangle' | 'ellipse'; x: number; y: number; width: number; height: number; label: string } | null; showPoint: boolean; showRegion: boolean }
export const defaultFocus = (): FocusData => ({ targetId: null, point: null, pickDistance: 5, region: null, showPoint: true, showRegion: true });
export const defaultEnvironment = () => ({ intensity: 1.1, color: '#ffffff', defaultRig: true });
export const isLight = (o: { type: string }) => ['DirectionalLight', 'PointLight', 'SpotLight'].includes(o.type);
export const defaultLight = () => ({ intensity: 2.5, color: '#fff0d5', range: 20, coneAngle: 45, castShadow: true });
export type RelationSpace = 'subject' | 'screen' | 'depth' | 'orientation';
export interface SpatialConstraint { id: string; objectId: string; referenceId: string; space: RelationSpace; relation: string }
