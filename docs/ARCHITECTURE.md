# Architecture

JingYu retains the V0.2 React/TypeScript/Vite, Zustand, Three.js / React Three Fiber / drei, and Dexie architecture. No backend or AI service is involved.

## Shared scene graph

`Project.shots[].objects` is the only semantic object collection. IDs identify objects; names may change. Plan View does not own a second copy. UI selection references an ID, and transforms use the same `updateObject` action in every view.

The 3D components instantiate Three.js visual proxies from shared data. Plan SVG footprints and camera annotations are derived representations, never stored copies of scene transforms. Export reads the same shot snapshot and spatial calculations. No synchronization button or reconciliation process exists.

Transforms use meters, Y-up, Euler XYZ degrees. Plan horizontal is X and vertical is Z. Plan drag changes X/Z only. Characters use local +Z as their front; props add `frontYaw` (local degrees) and `frontLabel` (for example HUD interface). Cameras look along local -Z. Plan arrows use the transformed front vector. Camera frusta are schematic horizontal field-of-view cones, not ground-intersection or visibility analysis.

## Modules

- `src/store.ts`: shared graph mutations, grouped undo history, project switching and ordered autosave.
- `src/types.ts`: scene, project, Plan annotations and camera overlay types.
- `src/lib/scene.ts`: bounds, projection and concise bilingual descriptions.
- `src/lib/spatial.ts`: semantic front, screen-facing, depth, measurements and structured exports.
- `src/components/Stage.tsx`: existing proxy geometry, editor and camera renderer; the preview registers a capture callback.
- `src/components/PlanView.tsx`: interactive SVG Plan View and reusable export drawing.
- `src/components/CameraOverlay.tsx`: one overlay implementation for live preview and exported frames.
- `src/lib/export.tsx`: camera capture, SVG compositing, PNG creation and clipboard fallback.
- `src/storage/ProjectStorage.ts`: browser storage adapter, migration/validation, file picker and portable project I/O.
- `src/components/ProjectMenu.tsx`: project actions calling the adapter and store.
- `src/settings.ts`: local workspace preferences; `src/i18n.ts`: all bilingual interface copy.

## Annotations and history

Sketch points are world X/Z coordinates. They never become meshes. Measurements contain explicit endpoints and optional object-ID anchors. An anchored endpoint follows that object's origin, including its Y height. Deleting an anchor object freezes the endpoint at its last location. Shot duplication remaps anchor and primary-subject IDs together with object IDs.

Plan edits, sketches, measurements and constraints participate in existing project undo. A transform gesture is one transaction. Field edits and transforms have separate transaction kinds so focus changes cannot split a drag. History is session-only and resets when switching projects.

## Export rendering

Camera capture temporarily renders the existing preview scene at the requested 16:9 dimensions, copies pixels to a 2D canvas, and restores the renderer's original dimensions and pixel ratio in `finally`. Selected overlays are rasterized from the same SVG overlay component used in the live preview. Plan export similarly reuses `PlanDrawing`. No separate renderer or copied semantic scene is created for export.

## Storage and platform boundary

WebProjectStorage implements local loading/saving, recent project listing, portable import/export and browser download. IndexedDB remains the autosave source of truth. Unknown future project versions are rejected without replacing records. Legacy records are copied to the backups table before migration. Import always receives a new project ID, leaving existing local projects untouched.

A future DesktopProjectStorage can supply native file operations through a thin Tauri shell. Scene, geometry, Plan, measurements, overlays and export data stay in shared TypeScript. Tauri is not installed.
