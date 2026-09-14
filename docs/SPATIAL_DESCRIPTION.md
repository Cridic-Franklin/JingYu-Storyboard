# Spatial Description v3

SceneAxis generates spatial facts locally from the active shot. `analyzeShot` is deterministic: the same Scene Graph, camera and shot metadata yield the same structured result. Authored display names remain labels; semantic type, position, bounds, facing, visibility, camera distance, screen/depth placement and motion paths are calculated fields.

Relationship records distinguish subject-relative direction, screen placement, depth, vertical relation, proximity and facing. Camera facts include position, orientation, FOV-derived shot size and camera angle. Motion records identify owner, start/end points and path length. These are planning approximations, not collision, occlusion or photogrammetry claims.

The local description is always available and is the authoritative fallback. Optional AI enhancement receives both the deterministic prose and structured JSON under an instruction that facts are immutable. Its response is stored separately as `aiEnhancement`; an error or missing key never clears or changes the deterministic result.

Semantic JSON and existing export packets continue to use shared scene data. Sketches remain annotations, references remain shot media, and neither becomes scene geometry.
