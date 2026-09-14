# Portable project format

Current extension: `.jyproject`. SceneAxis preserves the established extension and accepts both legacy `JingYu Project` and current `SceneAxis Project` containers.

## Version 1 container

Container version `1`, project `schemaVersion: 6`, and Dexie database schema `2` are separate version domains; an application release number does not automatically change any of them.

The foundation implementation uses self-contained UTF-8 JSON instead of ZIP, avoiding a packaging dependency while the schema is evolving:

```json
{
  "format": "SceneAxis Project",
  "version": 1,
  "project": {
    "schemaVersion": 6,
    "id": "uuid",
    "name": "JUST_BREATHE",
    "updatedAt": "ISO-8601",
    "activeShotId": "uuid",
    "nextShotNumber": 2,
    "shots": []
  }
}
```

Shots contain stable IDs, numbers, authored text, status, base64 storyboard images, the shared objects array, composition guides, camera annotation choices, Plan view/layer settings, sketches, measurements, optional primary subject and spatial constraint text. Objects contain stable IDs, display names, types, transforms, lens FOV, semantic front fields, visibility and lock state.

No referenced local paths or IndexedDB keys are required to reopen a file on another computer. Images are embedded data URLs. The file size limit is 100 MB. New storyboard references accept PNG/JPEG up to 10 MB; valid legacy WebP/GIF data is retained in the compatibility `image` field but is not accepted by the V0.98 reference importer.

## Web save behavior

- Autosave writes the active project to IndexedDB.
- Save writes to the browser file handle chosen in this session where File System Access is supported; otherwise it downloads a portable copy. Without a retained handle, Save opens a Save dialog.
- Save As asks for a new file/name/location when supported, or downloads a named copy as fallback. After successful output it activates an independent project ID. Canceling the file picker leaves the current project unchanged.
- Open imports and validates a file into a fresh local project ID. Scene and shot IDs inside it remain stable. An imported file cannot overwrite an existing autosave.
- Recent Projects reopens an existing local project.
- Remove from Recent stores a separate hidden-list preference and retains the project data. Reopening that project restores it to Recent. Delete local project confirms deletion of an inactive project's IndexedDB record and migration backups in one transaction; active deletion is blocked. Neither action deletes exported files or changes the portable format.

Browser file handles are session-only platform state, not portable project data. A reopened native file handle is reused by Save in that session; downloads remain available on browsers without the API. Tauri is not required or installed.

## Migration and safety

The existing `StoryboardSpatialDirector` database is retained. Dexie schema 2 keeps `projects` and adds `backups`. A legacy record is backed up before migration, once per source schema version so an older backup does not suppress a later V0.3 backup. The original V0.2 ID `local-project` is still discovered when no newer active project is selected.

Missing Plan data, annotations, semantic-front fields and constraints receive defaults. Stable IDs, names, transforms and images are preserved. Invalid transforms, duplicate IDs, unsupported types, malformed sketch data and future schema versions cause an error; they are not silently discarded. Unknown extra metadata fields are preserved via object spreads. File parsing completes before active state changes. If startup recovery fails, writes to the incompatible project are blocked and the user can open or create an independent project.

Backups are retained in IndexedDB; an automatic backup deletion policy and recovery browser are deliberately not introduced yet. Clearing browser site data still clears local projects and backups, so keep portable project files.

ZIP packaging with `project.json` and separate embedded assets is a future container version. The storage adapter will handle that transition; views will not change.

## V0.98 fields (schema 6)

- Shot metadata adds `duration`, `sequence`, `shotType`, `notes` and optional `aiEnhancement`.
- `references[]` embeds PNG/JPEG storyboard or Plan-background records with stable ID, name, MIME type, fit/fill mode, timestamp and optional local-source metadata. The legacy `image` field mirrors the storyboard reference for backward-tolerant consumers.
- `motionPaths[]` contains a stable owner `objectId`, visibility, smoothing flag and ordered world-space points. Owners and point/path IDs are remapped on shot duplication or Copy Previous; deleting an owner removes its paths.
- Objects add `semanticType`; Characters add independent `headFacingYaw`. New low-poly storyboard types are validated alongside existing objects.
- AI provider, endpoint, model and API key are not project data. The API key is session memory only. Optional AI prose is non-authoritative and never replaces deterministic spatial facts.

Migration from schema 5 or earlier supplies safe defaults and copies the source record into the IndexedDB backups table before replacement. Current readers reject future schemas and malformed references/paths without changing the active project.

## V0.9 fields (project schema 4)

- Shot `aspectRatio`: numeric width/height (0.1–10), default 16/9 for older files.
- Shot `focus`: optical target ID or world point, camera pick-plane depth, normalized rectangle/ellipse region with authored meaning, and overlay visibility.
- Shot `environment`: color, intensity, default lighting rig flag. DirectionalLight / PointLight / SpotLight objects add intensity, color, range, cone angle and shadow flag.
- `primaryCharacterId`, existing `primarySubjectId` (now explicitly Primary Visual Subject), `secondarySubjectId`, `backgroundAnchorId` are independent optional references. Legacy explicitly chosen character subjects populate Primary Character; an explicit null remains null.
- `hardConstraints`: object/reference IDs, relation space and expected relation. Free-text `constraints` and `negativeConstraints` remain separate authored data.
- `includeTechnical`: defaults false; controls optional coordinate text. Camera annotation flags include semantic labels and focus overlays.

Older V0.2/V0.3 projects receive defaults without changing existing object IDs/transforms. Invalid new fields and unsupported future schema versions are rejected. Container version remains 1 and Dexie schema remains 2. V0.3 readers cannot read schema 4; compatibility here means safe older-file loading into V0.9, not opening V0.9 files in older applications. The AI Shot Packet ZIP is an export artifact, separate from the JSON `.jyproject` format.

## V0.95 blocking fields (schema 5)

Characters contain `pose`: preset, optional base preset for adjusted poses, hip height in meters, and local XYZ joint angles in degrees. The ten joints cover torso/head, both shoulders/elbows and both hips/knees. Missing legacy pose becomes Standing; IDs and object transforms are preserved.

Optional object `displayColor` is a six-digit hex editor color. Imported `OBJ` objects embed `asset: { format: "obj", filename, positions }`: finite triangle vertex coordinates, with no filesystem dependency. OBJ import limits are 20 MB source and 100,000 triangles (300,000 expanded vertices). Normals are recomputed; materials/textures are not imported. Embedded arrays are validated before replacing project state. Duplication copies asset and pose data.

Shots contain `spiral: { corner, mirror, x, y, scale }`; offsets are normalized frame fractions, scale is 0.1–3, and the default guide has no offset. `useEditorColors` defaults to false and explicitly opts Camera/PNG exports into editor colors. These fields also copy with the previous shot's scene.

Workspace layouts are browser preferences, not scene/project data. The existing `ssd-preferences-v02` localStorage key now retains each workspace's split sizes and floating/hidden panel rectangles. Older preferences receive validated defaults; rectangles are clamped to the browser window. Reset Layout only resets the active workspace. Portable projects do not override another computer's UI layout.
