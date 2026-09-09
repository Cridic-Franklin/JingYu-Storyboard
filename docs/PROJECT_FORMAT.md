# Portable project format

Current extension: `.jyproject`. Preserve existing readers and migration paths when evolving the format.

## Version 1 container

Container version `1`, project `schemaVersion: 4`, and Dexie database schema `2` are separate version domains; an application release number does not automatically change any of them.

The foundation implementation uses self-contained UTF-8 JSON instead of ZIP, avoiding a packaging dependency while the schema is evolving:

```json
{
  "format": "JingYu Project",
  "version": 1,
  "project": {
    "schemaVersion": 4,
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

No referenced local paths or IndexedDB keys are required to reopen a file on another computer. Images are embedded data URLs. The file size limit is 100 MB. PNG/JPEG/WebP/GIF storyboard images retain the existing 10 MB per-image import limit.

## Web save behavior

- Autosave writes the active project to IndexedDB.
- Save writes to the browser file handle chosen in this session where File System Access is supported; otherwise it downloads a portable copy. Without a retained handle, Save opens a Save dialog.
- Save As asks for a new file/name/location when supported, or downloads a named copy as fallback. After successful output it activates an independent project ID. Canceling the file picker leaves the current project unchanged.
- Open imports and validates a file into a fresh local project ID. Scene and shot IDs inside it remain stable. An imported file cannot overwrite an existing autosave.
- Recent Projects reopens an existing local project.

Browser file handles are session-only platform state, not portable project data. A reopened native file handle is reused by Save in that session; downloads remain available on browsers without the API. Tauri is not required or installed.

## Migration and safety

The existing `StoryboardSpatialDirector` database is retained. Dexie schema 2 keeps `projects` and adds `backups`. A legacy record is backed up before migration, once per source schema version so an older backup does not suppress a later V0.3 backup. The original V0.2 ID `local-project` is still discovered when no newer active project is selected.

Missing Plan data, annotations, semantic-front fields and constraints receive defaults. Stable IDs, names, transforms and images are preserved. Invalid transforms, duplicate IDs, unsupported types, malformed sketch data and future schema versions cause an error; they are not silently discarded. Unknown extra metadata fields are preserved via object spreads. File parsing completes before active state changes. If startup recovery fails, writes to the incompatible project are blocked and the user can open or create an independent project.

Backups are retained in IndexedDB; an automatic backup deletion policy and recovery browser are deliberately not introduced yet. Clearing browser site data still clears local projects and backups, so keep portable project files.

ZIP packaging with `project.json` and separate embedded assets is a future container version. The storage adapter will handle that transition; views will not change.

## V0.9 fields (project schema 4)

- Shot `aspectRatio`: numeric width/height (0.1–10), default 16/9 for older files.
- Shot `focus`: optical target ID or world point, camera pick-plane depth, normalized rectangle/ellipse region with authored meaning, and overlay visibility.
- Shot `environment`: color, intensity, default lighting rig flag. DirectionalLight / PointLight / SpotLight objects add intensity, color, range, cone angle and shadow flag.
- `primaryCharacterId`, existing `primarySubjectId` (now explicitly Primary Visual Subject), `secondarySubjectId`, `backgroundAnchorId` are independent optional references. Legacy explicitly chosen character subjects populate Primary Character; an explicit null remains null.
- `hardConstraints`: object/reference IDs, relation space and expected relation. Free-text `constraints` and `negativeConstraints` remain separate authored data.
- `includeTechnical`: defaults false; controls optional coordinate text. Camera annotation flags include semantic labels and focus overlays.

Older V0.2/V0.3 projects receive defaults without changing existing object IDs/transforms. Invalid new fields and unsupported future schema versions are rejected. Container version remains 1 and Dexie schema remains 2. V0.3 readers cannot read schema 4; compatibility here means safe older-file loading into V0.9, not opening V0.9 files in older applications. The AI Shot Packet ZIP is an export artifact, separate from the JSON `.jyproject` format.
