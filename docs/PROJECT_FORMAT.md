# Portable project format

Current extension: `.jyproject` (internal, subject to rename).

## Version 1 container

The foundation implementation uses self-contained UTF-8 JSON instead of ZIP, avoiding a packaging dependency while the schema is evolving:

```json
{
  "format": "JingYu Project",
  "version": 1,
  "project": {
    "schemaVersion": 3,
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
- Save downloads a portable copy of the current workspace.
- Save As creates an independent named project with a fresh project ID, activates it, and downloads its `.jyproject` file.
- Open imports and validates a file into a fresh local project ID. Scene and shot IDs inside it remain stable. An imported file cannot overwrite an existing autosave.
- Recent Projects reopens an existing local project.

Browser downloads do not silently overwrite files. Native in-place Save can be implemented by a future desktop adapter.

## Migration and safety

The existing `StoryboardSpatialDirector` database is retained. Dexie schema 2 keeps `projects` and adds `backups`. A legacy record is backed up before migration. The original V0.2 ID `local-project` is still discovered when no newer active project is selected.

Missing Plan data, annotations, semantic-front fields and constraints receive defaults. Stable IDs, names, transforms and images are preserved. Invalid transforms, duplicate IDs, unsupported types, malformed sketch data and future schema versions cause an error; they are not silently discarded. Unknown extra metadata fields are preserved via object spreads. File parsing completes before active state changes. If startup recovery fails, writes to the incompatible project are blocked and the user can open or create an independent project.

Backups are retained in IndexedDB; an automatic backup deletion policy and recovery browser are deliberately not introduced yet. Clearing browser site data still clears local projects and backups, so keep portable project files.

ZIP packaging with `project.json` and separate embedded assets is a future container version. The storage adapter will handle that transition; views will not change.
