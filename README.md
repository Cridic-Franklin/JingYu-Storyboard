# 镜域 · JingYu 0.9 — Spatial Director

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


## V0.9 director workflow

1. Use File to create/open a `.jyproject` or choose a recent local project. Save reuses a supported browser file handle; Save As chooses a new file and independent local project. Other browsers download portable copies.
2. Set the shot Aspect Ratio in the Inspector; it changes camera projection, guides, calculations and export dimensions.
3. Search Add Object in English or Chinese. Numeric fields allow draft negative/decimal text, Enter/blur to commit, Esc to cancel, and Arrow/Shift/Ctrl increments.
4. Position the same objects in Spatial 3D and Plan View. Use compact Shot Size, Camera Angle and Lens menus, or edit camera values directly.
5. Choose Primary Character and Primary Visual Subject independently. Set optical Focus Target or a world/camera-picked point; draw a rectangle/ellipse for visual emphasis.
6. Add directional/point/spot lights and adjust the environment. Planning arrows show facing/front/light direction. Sketches and anchored measurements remain annotations.
7. Add structured Hard Spatial Constraints for automatic validation; retain free-text director notes and separate spatial DO NOT notes. Generate concise semantic descriptions; technical percentages are optional.
8. Choose Blocking, Plan, Composition or AI Review workspace. Review the camera, Plan, description and validation together.
9. Export Clean / Director / AI frames, Plan, TXT/JSON, the six-file AI Shot Packet or single AI Reference Board.

Read [project state](PROJECT_STATE.md), [architecture](docs/ARCHITECTURE.md), [project format](docs/PROJECT_FORMAT.md), [AI exports](docs/AI_EXPORT.md) and [release plan](docs/RELEASE_PLAN.md) as needed. No AI generation, modeling, animation, cloud, deployment or Tauri runtime was added.

## Original blocking workflow

1. The initial workspace creates SHOT 001 with a storyboard camera. Use **New shot** for additional shots.
2. Choose **Add object → Character**, then enter **Leo** in the inspector's Display Name field.
3. Choose **Add object → Prop**, then enter **Emergency Beacon** as its Display Name. Existing semantic-name data is retained for compatibility; descriptions prefer Display Name.
4. Select an object on the stage or in the scene list. Use the transform handles or inspector fields to move, rotate and scale it.
5. Select the camera to edit its position, rotation and vertical FOV. Camera presets prefer Primary Character, then Primary Visual Subject, with a visible-character/origin fallback for framing.
6. Watch the camera preview and toggle composition guides, including Golden Spiral.
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
- **Frame Position** reports approximate projected center X/Y and bounding width/height as percentages of the active shot preview. The top-left corner is (0%, 0%); X increases rightward and Y downward. Bounds are measured before occlusion and are not clipped to the frame, so partially visible objects can have centers outside 0–100% and bounds above 100%. Hidden, offscreen, behind-camera and near-plane cases show a status instead of misleading coordinates.

## Local storage

The project, object transforms, guides, generated text and imported images are stored in the `StoryboardSpatialDirector` IndexedDB database. Saving is automatic and ordered. Failed writes are shown in a banner with a retry button. Browser storage is tied to the URL origin and browser profile; clearing site data removes the project. Portable .jyproject files complement IndexedDB autosave; no backend is used.

Version 0.1 projects are upgraded on load with Visible=true and Locked=false. Existing IDs and scene data are retained. Language, label preference and layout sizes use localStorage independently of shot undo history.

## Architecture

See [the module map and architectural contracts](docs/ARCHITECTURE.md).

## Verification

`pnpm build` runs TypeScript project checks and builds production assets. The V0.9 browser scripts use Playwright and Chrome with fresh profiles; no testing dependency was added to the application. Set `PLAYWRIGHT_MODULE` if using an external installation, and `APP_URL` to the actual Vite address.

```sh
node scripts/verify-v09-p0.cjs
node scripts/verify-v09-camera.cjs
node scripts/verify-v09-semantics.cjs
node scripts/verify-v09-storage.cjs
node scripts/verify-v09-export.cjs
```

Run P0 before the export integration test: it creates the portable fixture in `.verification/`. Other tests are independent. See [V0.9 verification](docs/VERIFICATION_V09.md) for coverage and limits. Older scripts and [the V0.3 record](docs/VERIFICATION.md) remain historical evidence; their old preset/UI/description expectations are not the V0.9 acceptance workflow.
