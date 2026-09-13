# 镜域 JingYu

**Spatial Storyboard Planning & AI Communication Tool**<br>
**空间分镜规划与 AI 沟通工具**

[简体中文](#简体中文) | [English](#english)

**在线体验 / Live demo:** [https://jing-yu-storyboard.vercel.app](https://jing-yu-storyboard.vercel.app)

## ❤️ 支持镜域 / Support JingYu

如果镜域对你的创作有所帮助，欢迎通过爱发电支持项目的持续开发与维护。

If JingYu is useful to your creative workflow, you can support its continued development on Afdian.

**爱发电 / Afdian:** [https://afdian.com/a/Cridic223](https://afdian.com/a/Cridic223)

---

<a id="简体中文"></a>

## 简体中文

### 项目简介

镜域是一款面向动画、分镜与视觉开发工作者的本地 Web 应用，用于快速搭建镜头空间、检查构图，并把导演意图整理成清晰的画面与语义信息。项目使用 React、TypeScript、Vite、Three.js、React Three Fiber、drei、Zustand 与 Dexie 构建，无需后端、账号、云服务或 AI API。

镜域不是 Blender、Maya、Photoshop、Premiere 或完整 DCC。资产在镜头中被摆放和调度，而不是被建模；3D 只服务于场面调度、空间推理和构图。

### 核心目标

- 使用同一份共享场景图驱动空间三维视图、二维平面图、摄影机画面、空间描述与导出结果。
- 用对象名称、主体关系、朝向、距离、景深层次和画面位置表达导演意图，而不只提供原始坐标。
- 让分镜师能够从一个镜头复制空间与摄影机，在连续镜头之间保持调度关系。
- 保持轻量、本地优先和可移植，不引入云端账号、协作系统或图像生成服务。

### 核心功能

- 镜头列表、复制镜头、从上一镜头复制场景，以及 Draft / Approved 状态。
- 中文 / English 双语界面、Maya 风格视口导航、可调整尺寸的工作区与对象名称标签。
- 共用同一场景图的空间三维视图与二维平面图；在任一视图移动对象都会同步到另一视图。
- 角色、道具、立方体、球体、圆柱体、胶囊体、圆锥体、平面、摄影机和基础灯光。
- 轻量角色姿势系统：站立、行走、蹲姿、单膝跪地、双膝跪地、坐姿、身体前倾，以及躯干 / 头部 / 肩 / 肘 / 髋 / 膝关节调整。
- OBJ 几何导入、对象显示颜色、可见 / 隐藏、锁定 / 解锁、复制与删除。
- 摄影机焦距、画幅比例、景别、机位角度、光学焦点、视觉重点区域和构图辅助线。
- 三分构图、中心十字、安全框，以及可调整方向、镜像、偏移和缩放的黄金螺旋。
- 平面图测量、标注草图、朝向、灯光方向和摄影机视锥。草图始终是标注，不会成为场景几何。
- 可导入 PNG、JPEG、WebP 或 GIF 分镜参考图；检查器会显示对象画面中心与近似投影边界百分比。
- 简洁的空间语义描述、结构化约束检查和 AI 空间 JSON，不调用任何 AI 服务。
- 摄影机画面、导演画面、AI 空间参考画面、平面图、TXT、JSON、AI 镜头包 ZIP 与 AI 参考板导出。
- `.jyproject` 打开 / 保存 / 另存为、IndexedDB 自动保存、旧项目迁移与存储失败保护。

### 工作流程

1. 新建项目或打开 `.jyproject`，创建镜头并设置画幅比例。
2. 添加角色、道具、基础几何体或 OBJ，在空间三维视图或二维平面图中完成调度。
3. 为对象命名，设置主要角色、主要视觉主体、次要主体和背景参照物。
4. 调整摄影机景别、机位、镜头焦距、光学焦点与视觉重点区域。
5. 使用角色姿势、对象朝向、灯光、测量和空间约束说明动作与关系。
6. 在摄影机画面或 AI 复核工作区检查最终构图、裁切、景深层次与约束冲突。
7. 可选导入本地分镜参考图；生成空间描述，并根据需要导出摄影机画面、平面图、语义 TXT / JSON、AI 镜头包或参考板。
8. 等待界面显示“所有更改已保存”，并定期保存便携式 `.jyproject` 文件。

复制镜头会创建新的镜头与对象 ID，同时复制空间、摄影机、姿势、灯光、画幅、焦点、辅助线和参考图；从上一镜头复制场景时会保留当前镜头自身的标题、状态和参考图。

### 当前版本

当前稳定版本为 **V0.96 — UI 专业化升级**。

- 建立统一的深色桌面工作区 Design Token，统一间距、边框、圆角、层级和交互状态。
- 优化顶部导航、镜头列表、主工作区工具栏、Spatial 3D、Plan View、Camera View、Camera Preview、空间描述和 Inspector。
- 优化项目弹窗、空状态、Loading / Error 状态、中英文界面、窄桌面 Export Toolbar 及 Reduced Motion 适配。
- 统一面板控制 SVG 图标，并补充 [UI Design System](docs/UI_DESIGN_SYSTEM.md)。

本次更新专注于 UI / UX 专业化升级；共享 Scene Graph、项目数据结构、持久化逻辑和核心业务逻辑保持不变。完整更新记录见 [CHANGELOG](CHANGELOG.md)，历史验证范围见 [V0.95 验证记录](docs/VERIFICATION_V095.md)。

### 控制与约定

- **Alt + 鼠标左键拖动**：环绕；**Alt + 鼠标中键拖动**：平移；**Alt + 鼠标右键拖动**：推拉。滚轮缩放。普通拖动不会导航视口。
- **Q** 选择、**W** 移动、**E** 旋转、**R** 缩放、**F** 聚焦所选、**Delete / Backspace** 删除、**Escape** 取消选择或还原最大化面板。
- **Ctrl+Z** 撤销，**Ctrl+Shift+Z** 重做；macOS 可使用 Cmd。一次完整手柄拖动记为一个撤销步骤。
- 一个世界单位等于一米，Y 轴向上；旋转字段使用世界空间 Euler XYZ 角度。
- 角色正面与道具语义正面沿局部 +Z；分镜摄影机沿局部 −Z 拍摄。
- 每个镜头最多有一台分镜摄影机。添加摄影机时，如已有摄影机则直接选中。
- 每个对象拥有稳定内部 ID、显示名称与对象类型；重命名不会改变内部 ID。
- 中文 / English 选择、对象标签和工作区布局保存在浏览器本地。空间描述使用生成时选择的语言；切换语言后可重新生成。
- 隐藏对象不会出现在场景视图或空间描述中；隐藏摄影机只隐藏其编辑器替身。锁定对象仍可重命名，但不能变换、删除或被摄影机预设移动。

### 安装与本地运行

需要 Node.js 20.19+ 或 22.12+，以及 pnpm。

第一次在 Windows 上运行？请阅读[中文与 English 双语新手指南](docs/WINDOWS_SETUP.md)。

```sh
pnpm install
pnpm dev --port 5173
```

在启用 WebGL 的浏览器中打开终端显示的实际地址。常用地址是 `http://127.0.0.1:5173`，端口被占用时 Vite 可能选择其他端口。使用同一浏览器配置和 URL，才能继续访问对应来源下的本地工作区。

```sh
pnpm build
pnpm preview --port 5173
```

### 项目文件

`.jyproject` 是自包含的 UTF-8 JSON 文件。当前便携容器版本为 1，项目 `schemaVersion` 为 5；它们与应用版本号是不同的版本域。

- 对象 ID、名称、类型、变换、可见性、锁定、角色姿势、显示颜色与导入 OBJ 几何会随项目保存。
- 镜头画幅、摄影机、焦点、构图辅助线、主体角色、空间约束、平面图标注与分镜参考图也会保存。
- OBJ 几何与分镜参考图嵌入文件，不依赖本机绝对路径。项目文件上限为 100 MB；单张参考图导入上限为 10 MB。
- 自动保存按顺序写入浏览器 IndexedDB。写入失败时界面会显示错误与重试操作。清除网站数据会删除本地项目，因此应保留便携式项目文件。
- 打开便携项目时会先完成解析与验证，再替换当前状态；旧版项目获得安全默认值，未来或损坏格式会被拒绝。

详细格式与迁移约定见 [项目格式](docs/PROJECT_FORMAT.md)。

### AI 导出工作流

镜域不生成图片，也不调用 AI API。它把场景中已有的空间决策整理成人和外部 AI 工作流都容易理解的资料：

- **Clean Frame**：只包含摄影机渲染，默认关闭辅助线、焦点与工程标注。
- **Director Frame**：包含当前构图辅助线和焦点 / 重点区域。
- **AI Spatial Frame**：包含对象名称、类型、画面区域、景深层次与裁切信息；技术百分比可选。
- **Plan View**：导出当前二维平面图，可分别控制名称、朝向、灯光方向、视锥、测量、草图和网格。
- **Spatial TXT / JSON**：提供主体角色、相对位置、距离、画面投影、姿势、焦点、灯光、约束与验证结果。
- **AI Shot Packet**：为当前镜头生成包含三张摄影机画面、平面图、TXT 与 JSON 的六文件 ZIP。
- **AI Reference Board**：把 AI 空间画面、平面图、空间摘要与约束组合为一张参考板。

详细字段、参考空间与近似范围见 [AI 导出说明](docs/AI_EXPORT.md)。

### 已知限制

- OBJ 仅导入几何，最大 20 MB / 100,000 个三角面；不支持 MTL、贴图、平滑组或 FBX。凹多边形应在导入前完成三角化。
- 角色姿势用于场面调度，不提供 IK / FK 工作流、蒙皮、动画时间线、碰撞、接触或解剖关节限制求解。
- 投影边界、身体可见区域、景深层次、平面图轮廓和语义正面判断均为近似值，不进行遮挡分析。
- 结构化约束可以自动检查；自由文本约束仍需人工复核。密集标注仍可能重叠。
- 工作区布局只保存在当前浏览器中，不写入便携项目；桌面界面最低宽度为 960 px，不面向手机布局。
- 浏览器文件句柄取决于浏览器与操作系统；不支持时会使用下载 / 导入回退。
- 生产构建仍有非阻塞的包体积提示，导出分辨率受设备纹理尺寸限制。

### 后续规划

近期建议是在真实分镜项目中检验角色姿势、OBJ 道具、浮动布局、构图辅助线与导出可读性，并只针对明确问题进行修正。

Web 仍是应用核心。未来如提供 Tauri 桌面版，应作为同一 React 应用外部的轻量平台层。原生菜单、项目目录、安装包与更新机制可以后续评估；云账号、协作、AI 图像生成 API、网格建模、进阶绑定和动画系统不在当前计划内，除非另行明确提出。

更多信息见 [架构](docs/ARCHITECTURE.md)、[发布与平台规划](docs/RELEASE_PLAN.md)和[当前项目状态](PROJECT_STATE.md)。

### 安全与使用权

安全问题请参阅[安全政策](SECURITY.md)。本仓库采用[保留所有权利的版权与使用声明](LICENSE)；公开源代码仅供查看与评估，不授予复制、修改、分发或商业使用许可。

### 验证

`pnpm build` 会执行 TypeScript 项目检查并生成生产构建。V0.95 的定向浏览器脚本使用独立 Chrome 配置，不会修改用户项目，也没有向应用加入测试依赖：

```sh
node scripts/verify-v095.cjs
node scripts/verify-v095-edges.cjs
```

可通过 `PLAYWRIGHT_MODULE` 指定外部 Playwright 安装，通过 `APP_URL` 指定 Vite 实际地址。历史 V0.9 与 V0.3 验证仍保留在 [V0.9 验证记录](docs/VERIFICATION_V09.md)和 [V0.3 验证记录](docs/VERIFICATION.md)中。

---

<a id="english"></a>

## English

### Project introduction

JingYu is a local web application for animation, storyboard and visual-development artists to block shot space, inspect composition and express directing intent as clear visual and semantic information. It is built with React, TypeScript, Vite, Three.js, React Three Fiber, drei, Zustand and Dexie. It requires no backend, account, cloud service or AI API.

JingYu is not Blender, Maya, Photoshop, Premiere or a full DCC. Assets are positioned and blocked rather than modeled; 3D exists for staging, spatial reasoning and composition.

### Core purpose

- Drive Spatial 3D, Plan 2D, Camera View, spatial descriptions and exports from one shared Scene Graph.
- Communicate directing intent through object names, subject relationships, facing, distances, depth layers and frame positions rather than raw coordinates alone.
- Let storyboard artists copy a shot's space and camera to maintain blocking continuity across successive shots.
- Remain lightweight, local-first and portable without cloud accounts, collaboration systems or image-generation services.

### Key features

- Shot list, Duplicate Shot, Copy Scene From Previous Shot and Draft / Approved status.
- Chinese / English interface, Maya-style viewport navigation, resizable workspaces and object name labels.
- Spatial 3D and Plan 2D over the same Scene Graph; moving an object in either view updates the other.
- Character, Prop, Cube, Sphere, Cylinder, Capsule, Cone, Plane, Camera and basic lights.
- Lightweight Character poses: Standing, Walking, Crouching, Single-knee kneeling, Double-knee kneeling, Sitting and Leaning forward, with torso/head, shoulder/elbow and hip/knee adjustment.
- OBJ geometry import, object display colors, visibility, locking, duplication and deletion.
- Camera aspect, lens, shot size, camera angle, optical focus, visual focus regions and composition guides.
- Rule of Thirds, Center Cross, Safe Frame and an adjustable Golden Spiral with orientation, mirror, offset and scale controls.
- Plan measurements, sketch annotations, facing, light direction and camera frustum. Sketches remain annotations and never become scene geometry.
- PNG, JPEG, WebP or GIF storyboard reference images; Inspector screen-center and approximate projected-bounds percentages.
- Concise spatial descriptions, structured constraint validation and AI spatial JSON without calling an AI service.
- Camera, Director and AI Spatial frames; Plan, TXT, JSON, AI Shot Packet ZIP and AI Reference Board export.
- `.jyproject` Open / Save / Save As, IndexedDB autosave, legacy migration and storage-failure protection.

### Workflow

1. Create a project or open a `.jyproject`, add a shot and set its aspect ratio.
2. Add characters, props, primitives or OBJ geometry, then block them in Spatial 3D or Plan 2D.
3. Name objects and assign Primary Character, Primary Visual Subject, Secondary Subject and Background Anchor.
4. Adjust shot size, camera angle, lens, optical focus and the visual focus region.
5. Use Character poses, object facing, lights, measurements and spatial constraints to communicate action and relationships.
6. Review final composition, crops, depth layers and constraint conflicts in Camera View or the AI Review workspace.
7. Optionally import a local storyboard reference image; generate the spatial description, then export Camera or Plan images, semantic TXT / JSON, the AI Shot Packet or Reference Board as needed.
8. Wait for “All changes saved,” and keep portable `.jyproject` files for durable storage.

Duplicate Shot creates fresh shot and object IDs while copying spatial data, camera, poses, lights, aspect, focus, guides and the reference image. Copy Scene From Previous Shot retains the current shot's own title, status and reference image.

### Current version

The current stable release is **V0.96 — UI Professionalization Update**.

- Established unified dark desktop-workspace design tokens for spacing, borders, radii, hierarchy and interaction states.
- Refined top navigation, Shot List, workspace toolbar, Spatial 3D, Plan View, Camera View, Camera Preview, Spatial Description and Inspector.
- Refined project dialogs, empty, loading and error states, bilingual UI, narrow-desktop export toolbar behavior and reduced-motion support.
- Standardized SVG panel-control icons and added the [UI Design System](docs/UI_DESIGN_SYSTEM.md).

This release is a UI/UX professionalization update. The shared Scene Graph, project data structure, persistence logic and core business logic remain unchanged. See the full [CHANGELOG](CHANGELOG.md) and the historical [V0.95 verification record](docs/VERIFICATION_V095.md).

### Controls and conventions

- **Alt + left-drag**: orbit; **Alt + middle-drag**: pan; **Alt + right-drag**: dolly. Mouse wheel zooms. Plain dragging never navigates the viewport.
- **Q** Select, **W** Move, **E** Rotate, **R** Scale, **F** Frame Selected, **Delete / Backspace** Delete, and **Escape** deselects or restores a maximized panel.
- **Ctrl+Z** Undo and **Ctrl+Shift+Z** Redo; Cmd also works on macOS. One complete gizmo drag is one undo step.
- One world unit is one meter and Y is up. Rotation fields use world-space Euler XYZ angles.
- Character and Prop semantic fronts point along local +Z. The storyboard camera looks down local −Z.
- Each shot supports at most one storyboard camera. Add Camera selects the existing camera when one is present.
- Every object has a stable internal ID, display name and object type. Renaming never changes its internal ID.
- The Chinese / English choice, object-label preference and workspace layout persist in browser-local settings. Spatial descriptions use the selected language at generation time and can be regenerated after switching languages.
- Hidden objects are excluded from scene views and spatial descriptions; hiding the Camera affects only its editor proxy. Locked objects may still be renamed but cannot be transformed, deleted or moved by camera presets.

### Installation and local development

Requires Node.js 20.19+ or 22.12+ and pnpm.

New to local development on Windows? Follow the [bilingual Windows beginner guide](docs/WINDOWS_SETUP.md).

```sh
pnpm install
pnpm dev --port 5173
```

Open the actual address reported by Vite in a WebGL-enabled browser. The common address is `http://127.0.0.1:5173`; Vite may choose another port when it is occupied. Use the same browser profile and URL origin to return to its locally persisted workspace.

```sh
pnpm build
pnpm preview --port 5173
```

### Project format

`.jyproject` is self-contained UTF-8 JSON. The current portable container version is 1 and project `schemaVersion` is 5; these are separate version domains from the application release number.

- Object IDs, names, types, transforms, visibility, locks, Character poses, display colors and imported OBJ geometry are stored in the project.
- Shot aspect, camera, focus, guides, subject roles, spatial constraints, Plan annotations and storyboard reference images are stored as well.
- OBJ geometry and storyboard images are embedded with no local absolute-path dependency. Project files are limited to 100 MB; individual storyboard images are limited to 10 MB on import.
- Autosave writes to browser IndexedDB in order. Failed writes show an error and retry action. Clearing site data removes local projects, so retain portable project files.
- Portable files are parsed and validated before replacing state. Older projects receive safe defaults; malformed and unsupported future formats are rejected.

See [Project format](docs/PROJECT_FORMAT.md) for the detailed format and migration contract.

### AI export workflow

JingYu does not generate images or call AI APIs. It packages spatial decisions already present in the scene into material that people and external AI workflows can interpret:

- **Clean Frame**: camera render only, with guides, focus and engineering annotations off by default.
- **Director Frame**: current composition guides and focus point / region.
- **AI Spatial Frame**: names, types, semantic frame region, depth and crop information; technical percentages are optional.
- **Plan View**: the current 2D plan with independent name, facing, light-direction, frustum, measurement, sketch and grid controls.
- **Spatial TXT / JSON**: subject roles, relationships, distances, screen projection, poses, focus, lighting, constraints and validation results.
- **AI Shot Packet**: a six-file ZIP for the active shot containing three Camera frames, Plan, TXT and JSON.
- **AI Reference Board**: a single board combining the AI Spatial frame, Plan, spatial summary and constraints.

See [AI exports](docs/AI_EXPORT.md) for exact fields, reference spaces and approximation boundaries.

### Known limitations

- OBJ import is geometry-only and limited to 20 MB / 100,000 triangles. MTL, textures, smoothing groups and FBX are unsupported. Triangulate concave polygons before import.
- Character poses are blocking proxies without an IK / FK workflow, skinning, animation timeline, collision, contact or anatomical joint-limit solving.
- Projection bounds, body visibility, depth layers, Plan footprints and semantic-front alignment are approximations without occlusion analysis.
- Structured constraints support automatic checks; free-text constraints still require manual review. Dense annotations may overlap.
- Workspace layouts are local browser preferences and are not part of portable projects. The desktop UI has a 960 px minimum width and is not intended as a phone layout.
- Browser file handles depend on browser and OS support; download / import fallback is used where unavailable.
- Production builds retain a non-blocking bundle-size warning. Export dimensions remain device-texture-limited.

### Roadmap

The recommended next step is real storyboard production testing of pose controls, modest OBJ props, floating layouts, composition guides and export readability, followed by fixes for concrete findings.

Web remains the application core. A future Tauri desktop edition should be a thin platform layer around the same React application. Native menus, project directories, installers and update delivery may be considered later. Cloud accounts, collaboration, AI image-generation APIs, mesh modeling, advanced rigging and animation remain outside the current plan unless explicitly requested.

See [Architecture](docs/ARCHITECTURE.md), [Release and platform plan](docs/RELEASE_PLAN.md) and [Project state](PROJECT_STATE.md) for more detail.

### Security and usage rights

See the [Security Policy](SECURITY.md) for vulnerability reporting. This repository uses an [all-rights-reserved copyright and use notice](LICENSE); public source access does not grant permission to copy, modify, distribute or use the project commercially.

### Verification

`pnpm build` runs the TypeScript project checks and creates the production bundle. The targeted V0.95 browser scripts use isolated Chrome profiles, do not touch user projects and add no testing dependency to the application:

```sh
node scripts/verify-v095.cjs
node scripts/verify-v095-edges.cjs
```

Set `PLAYWRIGHT_MODULE` for an external Playwright installation and `APP_URL` for the actual Vite address when needed. Historical V0.9 and V0.3 evidence remains in the [V0.9 verification record](docs/VERIFICATION_V09.md) and [V0.3 verification record](docs/VERIFICATION.md).
