# 镜域 · JingYu 0.3 — Spatial Director

A local, desktop-oriented storyboard planning application built with React, TypeScript, Vite, Three.js, React Three Fiber, drei, Zustand and Dexie. No backend, accounts, AI service or external assets are needed.

## Run

Requires Node.js 20.19+ or 22.12+ and pnpm.

```sh
pnpm install
pnpm dev --port 5173
```

Open http://127.0.0.1:5173 in a browser with WebGL enabled. Use the same browser profile and URL to return to your saved workspace.

```sh
pnpm build
pnpm preview --port 5173
```


## 0.3 foundation workflow

The existing V0.2 workspace is preserved. **Spatial 3D**, **Plan View** and **Camera View** use one shared scene graph.

1. Open the **Project** menu to open a `.jyproject`, choose a recent project, or create a new independent project.
2. Switch to **Plan View**. Add and rename objects with the existing toolbar and Inspector. W-drag changes X/Z without changing height Y; E-drag rotates. Position and rotation snaps default to Off. Ctrl+D duplicates the selected non-camera object. Double-click an object to rename it.
3. Configure a prop's **Front meaning / label** and **Front offset** in the Inspector. Its Plan arrow, preview annotations, description and JSON use the same semantic direction. Camera frusta respond to FOV.
4. Use **Measure** to pick two points. Nearby visible object origins snap automatically, and anchored distances update when objects move. Use Pen, Marker, Arrow or Text to add separate director sketches. Eraser removes strokes; Clear Sketch and Clear Measurements are undoable. Toggle the Scene, Measurements and Sketch layers independently.
5. Switch back to Spatial 3D and move objects normally. Plan View and the camera preview update automatically. There is no separate synchronization step.
6. In Camera Preview's **Annotations** menu, choose names, types, facing/front arrows, coordinates, bounds and measurements. These are overlays, not 3D geometry. Use Camera View or maximize for a larger image.
7. Optionally set a primary subject and spatial/negative constraints in Shot Details. After **Generate Spatial Description**, the description remains live as the scene changes.
8. Use **Export Camera Frame** for clean, director or AI-reference PNG presets, then customize each checkbox. Resolutions include 1080p, 1440p, 4K and custom 16:9 widths. **Copy Image** uses the same export settings, with PNG download as fallback. **Export Plan View**, **Export Spatial JSON** and **Export Spatial Text** provide the individual files for a future AI Shot Packet.
9. **Save** downloads a portable project copy. **Save As** makes an independent named project and downloads it. **Open Project** restores all shots, objects, images, sketches, measurements and constraints into a fresh local project ID. Autosave continues independently.

Plan navigation: middle-drag or Alt-drag pans, wheel zooms, F frames the selected object. Plan measurements are true 3D endpoint distances; the displayed angle is planar. The single storyboard camera per shot is retained, so object duplication excludes cameras.

The `.jyproject` foundation format is self-contained UTF-8 JSON with embedded images, not ZIP yet. See [project format](docs/PROJECT_FORMAT.md), [architecture](docs/ARCHITECTURE.md), [AI exports](docs/AI_EXPORT.md) and [release plan](docs/RELEASE_PLAN.md). Advanced focus metadata, overlap reports, workspace presets and combined ZIP packets are explicitly deferred.

## Original blocking workflow

1. The initial workspace creates SHOT 001 with a storyboard camera. Use **New shot** for additional shots.
2. Choose **Add object → Character**, then enter **Leo** in the inspector's Display Name field.
3. Choose **Add object → Prop**, then enter **Emergency Beacon** as its Display Name. Existing semantic-name data is retained for compatibility; descriptions prefer Display Name.
4. Select an object on the stage or in the scene list. Use the transform handles or inspector fields to move, rotate and scale it.
5. Select the camera to edit its position, rotation and vertical FOV. Camera presets frame the first character, or the origin if the shot has no character.
6. Watch the 16:9 camera preview and toggle composition guides, including Golden Spiral.
7. Choose **Generate Spatial Description**, then **Copy**. After generation, scene edits update the description live.
8. Import a local PNG, JPEG, WebP or GIF (up to 10 MB). The image appears in the shot card; click the reference to replace it or use its trash button to remove it.
9. Edit the shot title, short description and Draft/Approved status in **Shot details** in the right inspector. Wait for **All changes saved** before closing or refreshing.

## Controls and conventions

- **Alt + left-drag**: orbit, **Alt + middle-drag**: pan, **Alt + right-drag**: dolly (horizontal or vertical mouse movement). Mouse wheel: zoom. Plain dragging never navigates the viewport. The reset button restores the editor viewpoint.
- **Q**: select, **W**: move, **E**: rotate, **R**: scale, **F**: frame selected, **Delete/Backspace**: delete selected object, **Escape**: deselect and restore a maximized panel.
- **Ctrl+Z**: undo, **Ctrl+Shift+Z**: redo (Cmd on macOS also works). A complete gizmo drag is one undo step. Editing a field is grouped from focus to blur. Scene shortcuts are inactive while typing, preserving native text editing. History keeps up to 60 steps for the current session and is not stored across refresh.
- One world unit is one meter; Y is up. Rotation fields use world Euler XYZ angles in degrees.
- Character face and prop panel point along local +Z. Facing direction sets character yaw.
- The storyboard camera looks down its local −Z axis. Its proxy is hidden from the preview. Camera scale affects the editor proxy; FOV controls the lens.
- Each shot has an independent scene and at most one storyboard camera. **Add object → Camera** selects the existing camera or creates one if deleted.
- Spatial descriptions use approximate object centers and orientations. They do not analyze occlusion or image content.

## Preserved V0.2 controls

- Use the global **English / 简体中文** selector. All interface copy is centralized in `src/i18n.ts`; language choice persists. Authored names and shot text are preserved verbatim. Descriptions are generated in the currently selected language; regenerate to change the language of existing output.
- Drag the borders next to Shot List and Inspector, between the editor and lower panels, or between Camera Preview and Spatial Description. Sizes persist. Double-click any of those five panel headers to maximize it; double-click again or use **Restore Panel** to return. **Reset Layout** restores default sizes.
- Cube, Sphere, Cylinder, Capsule, Cone and Plane are simple fixed primitive proxies. Character and Prop remain available.
- Each object retains a stable internal ID when renamed. **Show Object Labels** displays its name above its proxy. Names may be edited even when locked.
- Eye and lock buttons are available in the scene list and Inspector. Hidden objects are excluded from the stage, preview and generated descriptions. Hiding the camera hides only its editor proxy. Locked objects cannot be transformed, deleted or repositioned by camera presets until unlocked.
- **Duplicate Shot** inserts a copy immediately after the source, with a new shot number and fresh object IDs. It copies camera, transforms, names, visibility, locks, guides, image, shot description and status. Generated spatial text is cleared so its shot number can be regenerated. Editing a copy never changes its source.
- **Copy Scene From Previous Shot** copies objects and the camera from the preceding card in the shot list into the current shot. The current shot's title, image, status and guides stay unchanged. Replacement can be undone.
- **Frame Position** reports approximate projected center X/Y and bounding width/height as percentages of the 16:9 preview. The top-left corner is (0%, 0%); X increases rightward and Y downward. Bounds are measured before occlusion and are not clipped to the frame, so partially visible objects can have centers outside 0–100% and bounds above 100%. Hidden, offscreen, behind-camera and near-plane cases show a status instead of misleading coordinates.

## Local storage

The project, object transforms, guides, generated text and imported images are stored in the `StoryboardSpatialDirector` IndexedDB database. Saving is automatic and ordered. Failed writes are shown in a banner with a retry button. Browser storage is tied to the URL origin and browser profile; clearing site data removes the project. Portable .jyproject files complement IndexedDB autosave; no backend is used.

Version 0.1 projects are upgraded on load with Visible=true and Locked=false. Existing IDs and scene data are retained. Language, label preference and layout sizes use localStorage independently of shot undo history.

## Architecture

- `src/types.ts`: scene and project types.
- `src/store.ts`: Zustand actions and ordered Dexie persistence.
- `src/lib/scene.ts`: primitive bounds, camera presets, projection percentages and deterministic bilingual descriptions.
- `src/i18n.ts`: centralized English and Simplified Chinese messages.
- `src/settings.ts`: persisted language, labels and layout preferences.
- `src/components/Layout.tsx`: draggable panel borders and maximize behavior.
- `src/components/ViewportNavigation.tsx`: Maya-style navigation and frame selected.
- `src/components/Stage.tsx`: editor, transform handles, camera preview and SVG overlays.
- `src/components/Inspector.tsx`: editable object and shot properties.
- `src/App.tsx`: shot list, image import, description and workspace layout.
- `src/styles.css`: compact desktop production interface.

## Verification

`pnpm build` runs strict TypeScript checks and builds production assets. `scripts/verify.cjs` is a real-browser workflow check using an existing Playwright installation and Google Chrome. It adds no dependencies to the application. With the dev server running, set `PLAYWRIGHT_MODULE` to the installed Playwright module path if it is not resolvable, then run:

```sh
node scripts/verify.cjs
node scripts/verify-v02.cjs
node scripts/verify-foundations.cjs
node scripts/verify-storage.cjs
```

The tests use fresh browser contexts. They cover original workflows plus bilingual persistence, primitives, visibility/locking, stable IDs, grouped undo/redo, viewport navigation, panel resizing/maximization, shot copying, screen coordinates and 0.1 migration. Screenshots are written to `.verification/`.

