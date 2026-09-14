export interface StructuredShotScript {
  shot: string;
  shotSize: string;
  cameraAngle: string;
  lens: string;
  subjects: Array<{ id: string; name: string; semanticType: string }>;
  action: string;
  blocking: string;
  spatialRelations: Array<{ subject: string; relation: string; reference: string }>;
  cameraIntent: string;
}

/** Future extension point: a solver may propose changes, but never mutates the shared Scene Graph directly. */
export interface BlockingSolver {
  propose(script: StructuredShotScript): Promise<{ summary: string; operations: unknown[] }>;
}
