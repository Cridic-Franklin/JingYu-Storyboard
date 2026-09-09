# AI-readable export foundation

No AI API is called. These exports communicate decisions already present in the scene.

## Available files

- `SHOT_001_CLEAN.png`: camera frame with no guides or annotations by default.
- `SHOT_001_DIRECTOR.png`: names, front/facing arrows, measurements and selected guides by default.
- `SHOT_001_AI.png`: names, front/facing arrows and screen coordinates by default.
- `SHOT_001_PLAN.png`: current Plan region, with selectable names, arrows, frustum, measurements, sketch and grid.
- `SHOT_001_spatial.txt`: concise generated description, semantic relations, screen coordinates, depth order and authored constraints.
- `SHOT_001_spatial.json`: structured shared scene data, IDs, camera transforms/FOV, object transforms/dimensions, semantic front, projected bounds, camera depths, measurement anchors/distances and constraints.

Presets only initialize independent overlay checkboxes. Users can customize each export. Camera outputs support 1920x1080, 2560x1440, 3840x2160, and a custom width (multiple of 16 from 320 to 7680, subject to device limits). Height preserves 16:9. Plan PNG uses 1920x1152, preserving the current Plan aspect ratio.

Copy Image uses the selected camera export configuration and clipboard PNG support. If unsupported or denied, the same PNG is downloaded instead. All images are generated locally.

## Coordinate conventions and approximations

World coordinates are meters, Y-up. Screen origin is top left, X grows rightward and Y downward. Projected proxy bounds are not occlusion-tested or clipped to the frame. Partially visible objects can have center percentages outside 0-100 and dimensions greater than 100%. Objects behind or crossing the near plane report status rather than unreliable percentages.

Depth order is near-to-far camera-space depth of visible proxy centers. Semantic-front target inference compares the configured front vector to directions toward visible object origins. This is an approximate directional statement, not contact or gaze detection. Measurements use endpoint distances in 3D; Plan annotations additionally show a planar angle from world +Z toward +X.

Constraints are authored instructions. No constraint solver, image analysis, hand-level occlusion claim or automatic geometry correction is performed.

## Future AI Shot Packet

The individual exports are ready to compose into a later package:

```
SHOT_001_AI/
  camera_clean.png
  camera_annotated.png
  plan_view.png
  spatial.txt
  spatial.json
```

The combined ZIP action, separate sketch-only export, overlap metadata and advanced focus-priority fields are deferred. No architectural split or AI integration is needed to add packaging.
