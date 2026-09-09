# Changelog

## 0.9.0 — Director workflow and AI spatial communication

- Searchable, scrollable bilingual object menu; draft-safe reusable numeric fields.
- Shot-level camera aspect ratio and computed export heights; grouped size/angle/lens presets.
- Optical target/world point and camera-picked focus; visual rectangle/ellipse focus regions.
- Shared directional/point/spot lights and environment controls with planning indicators.
- Browser file-handle Open/Save/Save As with portable-download fallback and cancellation safety.
- Independent subject roles; semantic screen/subject relations, crop/body visibility and depth layers.
- Structured hard-constraint validation with edit/continue; separate authored notes and spatial negatives.
- Clean/Director/AI camera presets, Plan output, semantic TXT/JSON, current-shot ZIP and reference board.
- Existing resizable workspace presets and AI Review; explicit orientation labels and label offsets.
- Project schema 4 with older-project defaults, per-source-schema migration backups and preserved IDs.
- No new application dependencies, AI API, cloud, DCC features or desktop runtime.

## 0.3.0 — JingYu plan and spatial export foundations

- Preserve the V0.2 baseline in Git before development.
- Add a top-down Plan View over the same shot object array used by 3D, camera preview and descriptions.
- Edit X/Z while preserving Y; rotate, rename, duplicate non-camera objects, snap, undo and redo.
- Show semantic front arrows, height labels and FOV-dependent camera frusta.
- Add object-anchored measurements and separate Pen, Marker, Arrow, Text and Eraser sketches.
- Add independent camera annotation overlays and camera/plan PNG export, export presets, selectable resolution and image clipboard fallback.
- Export concise live spatial text and structured JSON without any AI API.
- Add independent projects, recent projects, portable Open/Save/Save As and migration backups through ProjectStorage.
- Keep the existing dark interface, bilingual UI, transforms, resizable panels and composition guides.
- Make static build paths relative. Exclude exported test artifacts from Vite watching on Windows.

This release implements the prioritized foundations. Secondary/target/focus-priority metadata, bounding-box overlap reports, workspace presets, outliner classification, ZIP packaging and the combined AI Shot Packet are deferred.
