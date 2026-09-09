# AI-readable exports

No AI API is called. Semantic names, subject/screen relationships, crop, depth, focus and lighting communicate decisions already in the shared scene. Rendering ownership is described in [architecture](ARCHITECTURE.md).

## Individual outputs

- Clean Frame: camera render only; guides, focus and engineering overlays off by default.
- Director Frame: current composition guides and focus point/region; names and orientation off by default.
- AI Spatial Frame: names, types, semantic frame/depth/crop labels and primary visual subject. Technical percentages default off. Optional orientation uses explicit words, not naked arrows.
- Plan View: current world X/Z region, with independent name, facing, light-direction, frustum, measurement, sketch and grid toggles. Direction arrows are labelled FACING / FRONT / LIGHT.
- Spatial TXT: concise semantic description, separate primary character/visual subject, reference-labelled relations, depth order, focus, lighting, hard rules and DO NOT notes. Include Technical Coordinates optionally appends percentages.
- Spatial JSON version 2: current-shot metadata, aspect/lens parameters, raw world transforms, projected bounds, semantic relations/crops/depth, focus, lights, measurements, constraints and validation.

Camera widths 1920/2560/3840 or custom integer 320–7680 use `round(width / shot.aspectRatio)` for height, subject to device limits. Plan PNG is 1920×1152. Copy Image uses the chosen camera settings with download fallback. Preset checkboxes can be customized independently.

## AI Shot Packet and reference board

Export AI Shot Packet produces a ZIP containing only the active shot:

```text
SHOT_001_AI/
  01_camera_clean.png
  02_director_frame.png
  03_ai_spatial_frame.png
  04_plan_view.png
  05_spatial.txt
  06_spatial.json
```

Packet camera images use 1920 px width; Plan is 1920×1152. ZIP STORE avoids another dependency because PNG content is already compressed. AI Reference Board produces a 3200 px wide PNG combining the AI frame, Plan diagram, spatial summary and constraints. Its height grows with text, up to 8000 px; exceptionally long summaries show an explicit continuation notice and retain full content in TXT/JSON.

## Reference spaces and approximations

World coordinates use meters, Y-up. Subject relations use the chosen reference object's horizontal semantic facing. Screen origin is top left. Exact near-to-far ordering uses camera-space proxy-center depth. Semantic layers are approximate: with Primary Character, depths within ±10% of its depth are midground, nearer is foreground and farther is background; otherwise thirds of the visible depth span are used.

Projected proxy bounds are not occlusion-tested. Fully/partially/mostly outside labels use viewport intersection over projected bounding-box area (mostly outside means under 25% remains). Crop edges are explicit. Character visible-region hints sample body-band centers and are marked approximate. Raw outside-frame percentages remain in JSON; behind-camera or near-plane crossings report status when projection is unreliable.

Optical focus distance refers to an object center or world point. Visual focus regions are normalized image annotations. No physically accurate DOF, gaze detection or constraint solver is involved. Light direction is relative to the explicit Primary Character when available, otherwise explicitly world-relative. Semantic front targeting is approximate direction-to-origin alignment, not contact detection.

## Validation boundary

Structured rules check subject-space sectors, individual screen axes, camera depth and front orientation. Conflicts or unresolved references trigger Edit Constraint / Ignore-Continue before AI exports; no objects move automatically. Authored free-text hard constraints remain intact and require manual review, clearly disclosed in the UI and export gate. Negative spatial notes are distinct from ordinary image-generation negative prompts.
