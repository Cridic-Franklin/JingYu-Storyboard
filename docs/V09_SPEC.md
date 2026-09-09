Use JingYu Development.

Read PROJECT_STATE.md first.
Then inspect only the project documentation and modules relevant to this task.

We are now implementing:

JingYu / 镜域 V0.9
Director Workflow & AI Spatial Communication

V0.3 is the existing baseline.

Do NOT perform redundant V0.3 backups, tags, full regression passes, or baseline verification before implementation.

Do NOT rewrite stable systems without a concrete technical reason.

Do NOT expand scope beyond this specification.

The purpose of V0.9 is to turn JingYu into a practical daily storyboard-directing tool and a low-ambiguity spatial communication system for image-generation AI.

The core workflow should become:

PLAN 2D
↕
SHARED SCENE GRAPH
↕
SPATIAL 3D
↕
CAMERA / COMPOSITION
↓
SPATIAL VALIDATION
↓
AI-READABLE EXPORT

────────────────────────────────────
PRIORITY ORDER
────────────────────────────────────

Implement in this order:

P0 — Core usability and camera workflow

1. Add Object menu usability
2. Numeric input system
3. Aspect ratio system
4. Camera presets
5. Focus system
6. Lighting system
7. Project Open / Save / Save As workflow

P1 — AI spatial semantics

8. Primary Character / Primary Visual Subject
9. Screen / Subject / World spatial relations
10. Frame visibility / crop semantics
11. Depth semantics
12. Semantic spatial description
13. Spatial validation
14. Hard / Negative spatial constraints

P2 — Export system

15. Clean Frame
16. Director Frame
17. AI Spatial Frame
18. Plan View export
19. AI Shot Packet
20. AI Reference Board

P3 — UI polish

21. Label decluttering
22. Workspace improvements
23. AI Review workspace
24. Tooltips and visual consistency

If implementation scope becomes large, finish and stabilize P0 and P1 before secondary polish.

────────────────────────────────────
1. ADD OBJECT MENU
────────────────────────────────────

Fix the current Add Object menu so objects lower in the menu are always accessible.

Requirements:

- scrollable menu
- sensible maximum height
- mouse wheel scrolling
- search field
- Chinese and English search support where practical

Organize objects by category:

COMMON
Character
Prop
Camera

PRIMITIVES
Cube
Sphere
Cylinder
Capsule
Cone
Plane

LIGHTS
Directional Light
Point Light
Spot Light

If practical, show recently used objects near the top.

Do not build an asset browser in this version.

────────────────────────────────────
2. UNIFIED NUMERIC FIELD
────────────────────────────────────

Fix the existing problems when entering numeric values in Inspector fields.

Create one reusable NumericField component for:

Position
Rotation
Scale
FOV
Lens values
Light settings
Focus values
other numeric Inspector fields

It must support:

direct typing
negative numbers
decimal values
Enter = confirm
Esc = cancel
Arrow Up / Down = small increment
Shift + Arrow = larger increment
Ctrl + Arrow = fine increment

Suggested behavior:

Arrow = 0.1
Shift + Arrow = 1
Ctrl + Arrow = 0.01

Important:

While typing "-2.5", temporary states such as:

-
-2
-2.
-2.5

must be allowed.

Do not immediately coerce temporary incomplete strings to zero.

Parse and commit values on:

Enter
blur
explicit commit

Prevent unnecessary scene resets while typing.

────────────────────────────────────
3. ASPECT RATIO SYSTEM
────────────────────────────────────

Aspect ratio must become a Shot-level property.

Support presets:

FILM / ANIMATION

16:9
1.85:1
2.00:1
2.35:1
2.39:1
4:3
3:2

SOCIAL

9:16
4:5
1:1

CUSTOM

allow custom ratio input.

Changing Shot aspect ratio must correctly update:

Camera Preview
Rule of Thirds
Golden Spiral
Safe Frame
Screen-space calculations
Bounding boxes
Camera exports
AI Reference exports

Do not implement aspect ratio as only a visual crop overlay.

The underlying camera projection / framing calculations must respect the shot ratio.

────────────────────────────────────
4. EXPORT RESOLUTION
────────────────────────────────────

Separate:

Aspect Ratio

from:

Export Resolution

Allow common export widths such as:

1920
2560
3840

and custom values.

Automatically calculate corresponding height from the active aspect ratio.

Example:

2.39:1
3840 width

→ approximately 3840 × 1607

Do not force users to manually calculate resolution.

────────────────────────────────────
5. CAMERA PRESET SYSTEM
────────────────────────────────────

Replace the current overly simple camera preset concept with structured presets.

SHOT SIZE

Extreme Wide Shot / 大远景
Wide Shot / 全景
Medium Wide Shot / 中全景
Medium Shot / 中景
Medium Close-Up / 中近景
Close-Up / 近景
Extreme Close-Up / 大特写

CAMERA ANGLE

Eye Level / 平视
Low Angle / 仰拍
High Angle / 俯拍
Ground Level / 贴地
Overhead / 正俯视
Bird's Eye / 鸟瞰
Dutch Left / 左倾斜
Dutch Right / 右倾斜

LENS PRESETS

18mm
24mm
35mm
50mm
85mm
135mm

Users must still be able to manually modify camera values.

Avoid placing every preset permanently on the main toolbar.

Use compact menus or grouped controls.

────────────────────────────────────
6. FOCUS SYSTEM
────────────────────────────────────

Implement a lightweight but semantically useful focus system.

Distinguish:

OPTICAL FOCUS
camera focus target / focus distance concept

and

VISUAL FOCUS
what the director wants the viewer / AI to prioritize

Support:

A. Focus Target

Select a scene object.

Example:

Focus Target:
Emergency Beacon

Calculate approximate Camera → Target distance.

B. Focus Point

Allow defining a point in 3D or Camera View.

Example:

Leo's face.

C. Visual Focus Region

Allow defining a simple region in Camera View.

Initial shapes:

Rectangle
Ellipse

Display optional overlays:

Focus Point
Focus Region

Do not build a physically accurate depth-of-field renderer.

The purpose is blocking and semantic communication.

────────────────────────────────────
7. FOCUS SEMANTICS
────────────────────────────────────

Spatial Description and AI exports should communicate focus semantically.

Example:

Primary visual focus:
Emergency Beacon in the lower-left foreground.

or:

Focus region:
Leo's face in the upper-right portion of the frame.

Raw focus coordinates may remain available in structured JSON.

Do not make raw X/Y percentages the primary user-facing description.

────────────────────────────────────
8. LIGHTING SYSTEM
────────────────────────────────────

Add lightweight lighting-blocking support.

This is NOT a final rendering or professional lighting system.

Support:

ENVIRONMENT LIGHT

Intensity
Color

DIRECTIONAL LIGHT

Rotation
Intensity
Color
Cast Shadow toggle

POINT LIGHT

Position
Intensity
Color
Radius / range if needed

SPOT LIGHT

Position
Direction
Cone Angle
Intensity
Color

Lights should appear as scene objects and remain synchronized with:

Spatial 3D
Plan View
Inspector
project save/open

Directional and Spot lights should have clearly readable direction indicators in planning views.

────────────────────────────────────
9. LIGHTING SEMANTICS
────────────────────────────────────

Where possible, generate simple AI-readable lighting descriptions.

Example:

Main light comes from Leo's rear-right side.

or:

Primary light direction is screen-left to screen-right.

Do not output raw Euler rotation as the primary natural-language lighting description.

Raw rotation remains available in JSON.

────────────────────────────────────
10. PROJECT FILE WORKFLOW
────────────────────────────────────

Complete the practical project workflow.

Provide:

File / 文件

New Project
Open Project...
Recent Projects

Save
Save As...

Export

The existing .jyproject format remains the portable project format for now.

OPEN PROJECT

Users should be able to choose a .jyproject file from the local filesystem and restore the project.

SAVE

Save the current project state appropriately.

SAVE AS

Allow saving a new .jyproject file with a different name/location.

Restore at minimum:

Shots
Scene Graph
Cameras
Plan View data
Sketches
Measurements
Lights
Focus data
Constraints
Storyboard images
relevant shot settings

Do not make project data depend exclusively on IndexedDB.

Preserve IndexedDB autosave as appropriate.

────────────────────────────────────
11. PRIMARY SUBJECT SYSTEM
────────────────────────────────────

Replace ambiguous implicit subject assumptions.

Allow explicit optional fields:

Primary Character
Primary Visual Subject
Secondary Subject
Background Anchor

Example:

Primary Character:
Leo

Primary Visual Subject:
Emergency Beacon

Secondary Subject:
Leo

Background Anchor:
Spacecraft

These values must be available to:

Spatial Description
AI exports
structured JSON

Primary Character and Primary Visual Subject may be different.

────────────────────────────────────
12. SPATIAL RELATION REFERENCE SYSTEM
────────────────────────────────────

Formalize three relation spaces.

WORLD SPACE

Raw world-space position and orientation.

SUBJECT SPACE

Relative to a chosen object's facing direction.

Example:

Emergency Beacon is front-right of Leo.

SCREEN SPACE

Relative to the final camera image.

Example:

Emergency Beacon appears lower-left of Leo in frame.

Do not mix these relation systems.

Every generated relation should internally know which reference system it uses.

AI-facing descriptions should prioritize:

Screen Space
+
Subject Space

World-space coordinates remain primarily machine data.

────────────────────────────────────
13. FRAME VISIBILITY SEMANTICS
────────────────────────────────────

Improve interpretation of screen-space bounds.

Instead of only outputting raw coordinates such as:

X 80%
Y -31%
Height 230%

derive semantic frame visibility:

Fully Visible
Partially Visible
Mostly Outside Frame
Outside Frame

Crop directions:

Top Cropped
Bottom Cropped
Left Cropped
Right Cropped

Example:

Leo is positioned on the right side of the frame.

Most of his upper body extends beyond the top edge.

Only the lower body remains clearly visible.

Keep raw values in JSON.

────────────────────────────────────
14. CHARACTER VISIBLE REGION
────────────────────────────────────

For Character proxies, where practical, provide approximate visible-region descriptions.

Examples:

Full Body
Upper Body
Head + Upper Torso
Lower Body / Legs

This may be approximate.

Do not build computer vision.

Use proxy geometry / projected bounds.

────────────────────────────────────
15. DEPTH SEMANTICS
────────────────────────────────────

Keep exact camera depth ordering.

Also derive semantic layers:

Foreground
Midground
Background

Example:

Foreground:
Emergency Beacon

Midground:
Leo

Background:
Spacecraft

Include this in AI-readable descriptions.

────────────────────────────────────
16. TECHNICAL COORDINATES POLICY
────────────────────────────────────

Do NOT remove screen X/Y or bounding data.

They remain valuable machine data.

Keep in spatial JSON:

screen X
screen Y
width
height
world position
rotation
scale
depth
distance

But default human / AI TXT descriptions should use semantic descriptions instead.

Add optional export preference:

Include Technical Coordinates

Default:
OFF

When enabled, append technical screen percentages.

────────────────────────────────────
17. SPATIAL VALIDATION
────────────────────────────────────

Implement a lightweight Spatial Validation system.

Before AI export, detect obvious contradictions between:

actual scene relationships

and

Hard Spatial Constraints

Example:

Calculated Subject Relation:
Beacon = front-left of Leo

Hard Constraint:
Beacon = front-right of Leo

Display:

Spatial Conflict

Do NOT automatically move scene objects.

Allow:

Edit Constraint
Ignore / Continue

Validation should clearly identify which reference system is involved:

Subject Space
Screen Space
etc.

────────────────────────────────────
18. HARD SPATIAL CONSTRAINTS
────────────────────────────────────

Continue supporting semantic Hard Constraints.

Examples:

Beacon must remain front-right of Leo in Subject Space.

Beacon interface must face Leo.

Leo must remain closer to Camera than Ship.

Do not build a physics constraint solver.

These remain semantic/directorial rules.

────────────────────────────────────
19. SPATIAL NEGATIVE CONSTRAINTS
────────────────────────────────────

Support clear AI-specific spatial mistakes to avoid.

Example:

DO NOT:

reverse Leo and Beacon

place Beacon behind Leo

make Beacon face camera

enlarge Beacon

Keep these separate from ordinary image negative prompts.

────────────────────────────────────
20. ORIENTATION ANNOTATION REDESIGN
────────────────────────────────────

Current naked arrows in Director / AI Camera exports may create ambiguity.

Fix this.

PLAN VIEW

Direction arrows are appropriate but must be explicitly labelled:

FACING →
FRONT →
LIGHT →

CAMERA VIEW

Do NOT display ambiguous naked arrows by default.

If orientation appears in AI reference overlays, use explicit semantic labels such as:

FACING: SCREEN RIGHT

FRONT: TOWARD LEO

Do not rely on arrow shape alone.

────────────────────────────────────
21. LABEL DECLUTTERING
────────────────────────────────────

Improve object labels in:

Camera View
AI Spatial Frame
Plan View

Reduce:

label overlap
label-object overlap
labels covering the primary visual subject

Use simple automatic offsetting.

Where appropriate use non-directional Callout Lines.

Example:

[ Leo — Character ]
        |
        └──── object

Callout lines must not look like movement or facing arrows.

────────────────────────────────────
22. CLEAN FRAME
────────────────────────────────────

Define a clean camera export.

Contains:

camera render only

No:

object names
orientation labels
technical coordinates
engineering annotations

Optional composition guides should normally be OFF.

Filename example:

SHOT_011_CLEAN.png

────────────────────────────────────
23. DIRECTOR FRAME
────────────────────────────────────

Redefine Director Frame as an image for composition review.

Default available overlays:

Rule of Thirds
Golden Spiral
Safe Frame
Focus Point
Focus Region

Object names and orientation arrows should default OFF.

Director Frame should prioritize visual composition rather than engineering metadata.

Filename:

SHOT_011_DIRECTOR.png

────────────────────────────────────
24. AI SPATIAL FRAME
────────────────────────────────────

Create a dedicated AI-oriented camera reference.

Its job is to explain the final projected composition.

Prefer semantic labels such as:

EMERGENCY BEACON
Prop
Foreground
Lower-left frame
Primary visual subject

LEO
Character
Midground
Right side
Upper body cropped

Avoid raw technical coordinate clutter by default.

Allow optional technical data.

Filename:

SHOT_011_AI.png

────────────────────────────────────
25. PLAN VIEW EXPORT
────────────────────────────────────

Plan View remains the main spatial diagram.

It should clearly communicate:

Camera position
Camera frustum
Object positions
Character facing
Prop front direction
Distances
Measurements
Light direction
Sketch annotations where enabled

Export settings should allow independent toggles.

Filename:

SHOT_011_PLAN.png

────────────────────────────────────
26. AI-READABLE SPATIAL DESCRIPTION
────────────────────────────────────

Redesign spatial TXT output.

Keep it concise and semantic.

Suggested structure:

SHOT

CAMERA

Aspect ratio
Lens
Camera relationship
Camera height / angle if useful

PRIMARY CHARACTER

PRIMARY VISUAL SUBJECT

FRAME COMPOSITION

Object screen region
crop state
visibility

SPATIAL RELATIONSHIPS

Subject-space relationship
Screen-space relationship
distance
orientation

DEPTH

Foreground
Midground
Background

FOCUS

LIGHTING

HARD CONSTRAINTS

DO NOT

Example:

SHOT 011

CAMERA
Low-angle camera approximately 1.9 m from Leo.
Aspect ratio: 2.39:1.
Lens: 35mm.

PRIMARY CHARACTER
Leo.

PRIMARY VISUAL SUBJECT
Emergency Beacon.

FRAME COMPOSITION
Emergency Beacon:
Foreground, lower-left area of frame, fully visible.

Leo:
Midground, right side of frame.
Upper body mostly outside the top edge.
Lower body visible.

Spacecraft:
Background, large visual mass extending beyond frame boundaries.

SPATIAL RELATIONSHIPS
Beacon is approximately 1.0 m from Leo.
Beacon is front-right of Leo in Subject Space.
Beacon appears screen-left of Leo.
Beacon front faces Leo.

DEPTH
Beacon → Leo → Spacecraft.

FOCUS
Primary visual focus: Emergency Beacon.

LIGHTING
Main light comes from rear-right.

HARD CONSTRAINTS
Beacon must remain front-right of Leo.
Beacon interface must face Leo.

DO NOT
Reverse Leo and Beacon.
Place Beacon behind Leo.

Do not repeat redundant information.

────────────────────────────────────
27. STRUCTURED SPATIAL JSON
────────────────────────────────────

Keep structured technical information for machine use.

The JSON should preserve:

Shot metadata
Aspect ratio
Camera parameters
Primary Character
Primary Visual Subject
Focus
Lights
Scene objects
World transforms
Screen coordinates
Bounding boxes
Depth
Dimensions
Subject-space relationships
Screen-space relationships
Orientation semantics
Crop state
Hard constraints
Negative constraints

Do not require users to manually edit JSON.

────────────────────────────────────
28. AI SHOT PACKET
────────────────────────────────────

Implement:

Export AI Shot Packet

Generate a portable package for one shot.

Suggested structure:

SHOT_011_AI/

01_camera_clean.png
02_director_frame.png
03_ai_spatial_frame.png
04_plan_view.png
05_spatial.txt
06_spatial.json

If existing web limitations make direct folder generation inconvenient, a ZIP export is acceptable.

Example:

SHOT_011_AI.zip

The package should contain only current-shot data.

────────────────────────────────────
29. AI REFERENCE BOARD
────────────────────────────────────

Create a single convenient AI Reference Board export.

Example filename:

SHOT_011_AI_REFERENCE.png

Suggested layout:

┌────────────────────┬────────────────────┐
│                    │                    │
│ Camera / AI Frame  │ Plan View          │
│                    │                    │
├────────────────────┼────────────────────┤
│                    │                    │
│ Spatial Summary    │ Constraints        │
│                    │                    │
└────────────────────┴────────────────────┘

The board should be:

clear
compact
readable
not visually overloaded

The purpose is to allow many AI workflows to receive one spatial reference image rather than multiple independent files.

────────────────────────────────────
30. WORKSPACE PRESETS
────────────────────────────────────

Continue using the current resizable panel architecture.

Add / improve workspace presets:

BLOCKING

Large Spatial 3D

PLAN

Large Plan View

COMPOSITION

Large Camera View

AI REVIEW

AI Spatial Frame / Camera Preview
Plan View
Spatial Description

Do not create separate applications or duplicate views.

────────────────────────────────────
31. AI REVIEW WORKSPACE
────────────────────────────────────

Add an AI Review workspace optimized for validating an AI export before generation.

Suggested layout:

Camera / AI Frame
Plan View
Spatial Description
Spatial Validation status

Allow quick review before:

Export AI Shot Packet

────────────────────────────────────
32. UI POLISH
────────────────────────────────────

Preserve the existing JingYu visual identity:

dark neutral interface
warm amber / gold accents
compact filmmaking tool aesthetic

Do NOT redesign into a generic SaaS dashboard.

Improve:

toolbar hierarchy
Inspector grouping
Focus controls
Lighting controls
camera preset organization
tooltips
disabled states
hover states
spacing consistency

Keep high-frequency actions visible.

Move secondary actions into compact menus.

────────────────────────────────────
33. PROJECT PERSISTENCE
────────────────────────────────────

Update .jyproject serialization to preserve all new V0.9 data:

Aspect Ratio
Camera preset state where necessary
Focus settings
Primary Character
Primary Visual Subject
Light objects
Spatial relation metadata
Validation constraints
AI export preferences where appropriate

Existing older project files should load using sensible defaults.

Do not silently destroy older data.

────────────────────────────────────
34. V0.9 SCOPE LIMITS
────────────────────────────────────

DO NOT implement in V0.9:

GLB import
FBX
rigging
character animation
animation timeline
video editing
Maya integration
Unreal Engine integration
AI image-generation API
cloud accounts
cloud sync
collaboration
Tauri desktop runtime
GitHub deployment
PBR material authoring
HDRI workflow
advanced GI
physically accurate depth-of-field rendering

These remain future work.

────────────────────────────────────
35. IMPLEMENTATION PRINCIPLES
────────────────────────────────────

Use the existing shared Scene Graph.

Do not introduce duplicate 2D/3D object state.

Reuse current systems where practical.

Avoid destructive refactors.

Keep dependencies minimal.

Use the JingYu Development skill workflow.

Do not spend time performing redundant V0.3 backup or baseline-validation work before starting.

Inspect the relevant code, then implement.

────────────────────────────────────
36. V0.9 ACCEPTANCE WORKFLOW
────────────────────────────────────

V0.9 is successful if I can perform the following workflow:

1. Open JingYu.

2. Create or open a project.

3. Create a shot.

4. Change shot aspect ratio from 16:9 to 2.39:1.

5. Confirm Camera Preview and guides update correctly.

6. Add objects through the searchable / scrollable Add Object menu.

Add:

Leo
Emergency Beacon
Spacecraft proxy
Directional Light
Storyboard Camera

7. Enter negative and decimal numeric transform values reliably.

8. Move objects in Plan View and confirm 3D synchronization.

9. Define:

Leo as Primary Character

Emergency Beacon as Primary Visual Subject

10. Define Beacon Front Direction.

11. Position Beacon front-right of Leo in Subject Space.

12. Set camera preset approximately:

Low Angle
35mm
appropriate shot size

13. Set Emergency Beacon as Focus Target.

14. Create a Visual Focus Region around Beacon.

15. Position Directional Light from rear-right.

16. Confirm Plan View displays:

Camera frustum
Facing
Front
Light direction
distance

17. Confirm Camera View displays the correct composition.

18. Verify that labels do not heavily overlap the visual subjects.

19. Generate Spatial Description.

20. Confirm it uses semantic descriptions rather than raw X/Y percentages by default.

21. Confirm it correctly communicates:

Primary Character
Primary Visual Subject
Foreground / Midground / Background
Crop state
Subject-space relation
Screen-space relation
Focus
Lighting
Hard Constraints

22. Create an intentionally incorrect Hard Constraint.

23. Confirm Spatial Validation identifies the contradiction.

24. Export:

Clean Frame

25. Export:

Director Frame

26. Export:

AI Spatial Frame

27. Export:

Plan View

28. Export:

Spatial TXT

29. Export:

Spatial JSON

30. Export:

AI Reference Board

31. Export:

AI Shot Packet

32. Save project.

33. Save As:

JUST_BREATHE.jyproject

34. Create/open another project.

35. Reopen JUST_BREATHE.jyproject.

36. Confirm:

Shots
Scene
Camera
Aspect Ratio
Focus
Lights
Subjects
Constraints
Measurements
Sketches

restore correctly.

37. Run final TypeScript checks.

38. Run production build.

39. Run targeted browser/runtime tests for the new workflows.

40. Fix actual implementation issues.

41. Update PROJECT_STATE.md with:

V0.9 implementation status
completed work
known limitations
deferred scope
next recommended testing phase

42. Commit V0.9 only after the implementation is stable.

Suggested commit message:

"Implement JingYu V0.9 director and AI spatial workflow"

────────────────────────────────────
37. IMPORTANT FINAL INSTRUCTION
────────────────────────────────────

Do not stop after creating mockups or placeholder controls.

Implement functioning workflows.

Prioritize correctness and usability over decorative complexity.

If part of the specification requires a substantial architectural change, preserve the working application and choose the smallest safe implementation.

Do not invent additional product scope.

When finished, provide a concise report containing:

- implemented V0.9 features
- meaningful architecture changes
- tests/build status
- known limitations
- project format changes
- Git commit hash
- active application preview