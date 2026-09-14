# SceneAxis UI design system

This document records the stable visual rules for SceneAxis's desktop workspace. It describes presentation and interaction only; scene data and application behavior remain owned by the shared Scene Graph and feature modules.

## Direction

SceneAxis uses restrained production-workstation chrome, near-black canvas space and deliberate semantic accents. Warm gold is reserved for camera/shot intent; cyan is reserved for selection, transforms, motion and system interaction. Interfaces stay compact enough for continuous storyboard work without becoming cramped or low-contrast.

Allow only the restrained tonal surfaces and SceneAxis Chromatic Divider specified below. Avoid broad glass effects, glow, large marketing typography, oversized cards and motion that does not explain an interaction.

## Tokens

The base tokens live in `src/styles.css` under **Professional workspace system**. V0.98 tonal surfaces, theme refinements and divider tokens live in `src/ui-correction.css`, loaded after the base system.

- Surfaces progress from `--bg-canvas` through `--bg-workspace`, `--bg-chrome`, `--bg-panel` and `--bg-panel-raised`.
- Borders use `--border-subtle`, `--border-default` and `--border-strong` according to hierarchy.
- Text uses `--text-primary`, `--text-secondary`, `--text-muted`, `--text-placeholder` and `--text-disabled`.
- `--sa-accent-cinema` identifies camera, shot and composition concepts. `--sa-accent-system` identifies selection, transforms, motion and system interaction. Neither is decorative fill.
- `--green` indicates healthy live or saved state; `--danger` is reserved for destructive actions and errors.
- Controls use 3 px corners, raised dialogs and floating panels use 5 px corners, and shadows appear only when elevation changes.

## Component rules

- Application chrome, panel headers and canvas areas remain visually distinct. The Spatial Editor receives the strongest area emphasis.
- Selected states use at least two cues: semantic accent text or border plus a background or edge marker. Hover never substitutes for selection.
- Camera-primary buttons may use gold; editing and selection controls use cyan. Secondary actions use neutral controls; destructive actions use the danger token.
- Inputs share the control surface, border and focus ring. Labels stay visible and placeholders remain supplementary.
- Panel controls use the shared outline icon set and preserve accessible names. Drag and resize affordances retain keyboard alternatives.
- Empty, loading and error states explain the current condition without decorative animation. Reduced-motion preferences suppress nonessential transitions.
- Dense toolbars may wrap at narrower desktop widths. No command may become inaccessible because a toolbar clips.

## Layout

The workspace is desktop-first with a 960 px minimum. Its hierarchy is Global Navigation → Context Panel → Main Workspace → Inspector, with Camera Preview and Spatial Description as subordinate working panels. At narrower desktop widths, optional labels collapse and actions wrap. Major panels remain resizable, floatable, hideable and maximizable through the existing layout system.

Review changes at 1920 × 1080, 1440 × 900, 1366 × 768 and 1024 × 768 in both themes. Include English and Simplified Chinese. Also inspect focus, hover, active, selected, disabled, modal, empty, loading and error treatments when those states are affected.

## Viewport toolbar / 视口工具列

视口左侧使用统一 SVG 的纵向 Icon-first 工具列：Select、Pan、Move、Rotate、Scale，普通灰色分隔后是 Measure 与 Annotate。悬停或键盘聚焦 400 ms 后显示名称与可用快捷键。Q / H / W / E / R / M 分别对应前述工具；颜色不是唯一选中提示，必须同时有边框与表面变化。

Pen、Marker、Eraser、Arrow、Text 只放在 Annotate 二级浮层，画笔色、粗细和清空操作也收在其中。Escape 或点击外部关闭浮层。Spatial 3D 的 Measure / Annotate 进入共享场景的 Plan View。顶部 View options 收纳位置/旋转吸附、Scene、Measurements、Sketch、Motion Paths 与 Heights，不再铺开为文字工具栏。

The left, icon-first rail uses one outline SVG family. Tooltips appear after 400 ms on hover or keyboard focus, with names and available shortcuts. Annotation tools and brush settings belong to the Annotate flyout. View options owns snapping and visibility toggles. These are presentation adapters over existing scene and annotation state.

## Shot references / 镜头卡片参考图

参考图属于 Shot Card 缩略图，不设底部独立 Storyboard Reference 面板。空缩略图点击导入 PNG/JPEG；整张卡片支持拖放。悬停和键盘聚焦显示替换、预览及选项入口；缩略图右键支持导入/替换、预览、移除、Fit/Fill，文字区仍提供镜头操作。预览使用可 Escape 关闭、限制焦点范围的原生 dialog。

- No Image：中性灰阶表面、图像轮廓图标与导入提示，无测试图片或高亮占位。
- Valid Reference：真实本地图片，使用保存的 Fit/Fill；图片本身的颜色不被篡改。
- Loading：卡片内显示加载状态，解码完成前不替换旧记录。
- Failed：卡片内可读错误提示，保留旧有效图片和恢复机会。

References live inside shot thumbnails. PNG/JPEG import, drop, preview, replace, remove and fit/fill use the existing reference record and legacy image compatibility field. Invalid files never replace a valid reference. Concurrent imports use a request guard; an obsolete read cannot overwrite a newer choice. Test imagery belongs only to isolated verification contexts, never default scene state.

## Tonal surface gradient / 同色阶表面

Panel、Header、Toolbar、Shot Card 延续同色阶渐变，但相对 V0.98 Correction 基线提高约 20–35% 的明暗可感度，上缘略亮、下缘略暗。增强只发生在中性色明度，不提高 Cyan / Gold 饱和度。深色保留冷灰黑空间深度；浅色采用冷灰蓝制图工作台：工作区较深、面板略亮、输入控件可辨，不使用通篇纯白。普通边框仍为 Neutral Gray。

Cyan 表达 System / Interaction；Gold 表达 Cinema / Camera / Spatial Intent。活动工具用低强度 Cyan 表面；镜头卡片与摄影机预览用细 Gold 边界。Plan Frustum 使用低透明度 Gold 内部，从近摄影机到远端递减，边缘较清晰但不发光。禁止高饱和整面渐变、Neon Glow、Rainbow Gradient 和大面积发光边框。

Tonal surfaces use restrained same-hue lightness variation, with perceptibility raised roughly 20–35% from the earlier V0.98 correction baseline and a slightly lighter top. The increase is neutral luminance, not accent saturation. Light theme is a cool-gray drafting studio. Cyan communicates interaction; gold communicates camera and cinematic intent. Frustum interiors remain transparent, with modest near-camera emphasis and clearer edges.

## SceneAxis Chromatic Divider

SceneAxis Chromatic Divider 是 Neutral Gray + Cyan + Gold 的品牌细线系统。推荐顺序为 Neutral → Cyan → Neutral → Gold → Neutral，允许按布局方向简化。它提供空间层次与轻微流动感，不承担大面积装饰。

### Key Chromatic Divider

`Divider-Key` 使用完整 Neutral → Cyan → Neutral → Gold → Neutral 节奏，用于产品主层级和活动状态。彩色段短、低饱和，当前宽度统一为 1 px。

### Soft Chromatic Divider

`Divider-Soft` 在 Neutral 基础上只混入更低比例的 Cyan / Gold，用于次级分组。它不能连续堆叠，也不能替代列表行和控件的 Neutral Gray 边框。

- 默认 1 px；极少数强重点允许 2 px，当前实现全部为 1 px。
- 普通结构线始终使用 Neutral Gray；不得让每个 Panel 都带彩色线。
- 分为两级：`Divider-Key` 使用完整 Neutral → Cyan → Neutral → Gold → Neutral 节奏；`Divider-Soft` 降低彩色混合比与对比，仅用于次级分组。
- `Divider-Key` 白名单：全局 Header、Workspace / Shot Header、Stage Header、Inspector 主 Header、Global Navigation Active Section、Workspace / Panel Active Tab underline。
- `Divider-Soft` 白名单：普通 Panel Header、Inspector Section 分组、List Group、Secondary Navigation。它不能替代普通 Neutral Gray 边框，也不能用于每一行或每张卡片。
- 渐变色段仅占小部分：15–28% 区间放低饱和 Cyan，72–86% 区间放低饱和 Gold；其余及过渡端点为 Neutral。
- Dark：Neutral `#303a40`、Cyan `#416268`、Gold `#6b604a`，低亮度、不发光。
- Light：Neutral `#c6cfd5`、Cyan `#9cbfc3`、Gold `#c4bda9`，更浅、更低饱和，避免污浊感。
- 实现位于 `src/ui-correction.css`：`--sa-divider-neutral`、`--sa-divider-cyan`、`--sa-divider-gold`、`--sa-divider-key` 与 `--sa-divider-soft`。`--sa-chromatic-divider` 保留为 Key 级兼容别名。装饰伪元素不接收指针事件。

The SceneAxis Chromatic Divider combines neutral gray with short, desaturated cyan and gold segments. It is a 1 px accent reserved for selected high-level boundaries and active tabs. Most of the line stays neutral. Dark and light themes have separate low-contrast palettes. Never use neon glow, rainbow gradients, saturated blue/gold strips, or chromatic borders on every panel. Color segments supplement structural and active-state cues rather than replacing them.

### Divider Usage Matrix

| Surface | Divider | Usage |
| --- | --- | --- |
| Global Header / Workspace Header / Stage Header | Key | Full-width 1 px lower edge |
| Inspector main header | Key | Main contextual boundary |
| Active Global Navigation section | Key | Short vertical active edge |
| Active workspace or panel tab | Key | 1 px underline only |
| Ordinary Panel Header | Soft | Low-contrast lower edge |
| Inspector Section / List Group / Secondary Navigation | Soft | Sparse group boundary only |
| Card rows / fields / ordinary controls | Neutral | No chromatic color |

## Updated Sidebar IA / 更新后的侧栏架构

Global Navigation 固定为七个产品域：Shots、Objects、Scene、Characters、References、Create、Settings。导航表达“用户正在管理哪一类工作”，不是资产分类器。

- Shots：当前镜头列表与 Sequence 工作流；Timeline / Boards 只能在有真实派生视图时出现。
- Objects：Furniture、Vehicles、Props、Architecture 与基础体入口。
- Scene：Ground / Plane、Lighting 与 Environment 控制。
- Characters：角色创建、角色选择、姿态与 Facing 工作流。
- References：镜头参考图及 Reference Board 相关入口。
- Create：仅展示 Script、Shot Planning、AI Storyboard 的预览说明。未来功能必须带 `Coming Soon`，不得提供伪生成、伪导入或无结果操作。
- Settings：Appearance、Language、AI Provider 与 Layout。

### Future / Coming Soon Navigation

Create 下的 Script、Shot Planning、AI Storyboard 只打开说明型预览对话框。对话框只提供关闭操作，必须明确标记 Coming Soon；不得出现会让用户误判为可执行的 Generate、Import、Start 或空结果按钮。

图标语义必须分离：Theme 用太阳 / 月亮表达目标切换，Lighting View 使用场景照明符号，Settings 使用齿轮。它们不得复用同一太阳图形。

The seven global domains describe product responsibilities, not arbitrary asset buckets. Future Create modules are honest previews with explanatory dialogs and no fake executable controls. Theme, lighting and settings use distinct icon semantics.

### Final RC ownership and reading layout

Shots contains a collapsible Shot Details / Camera workflow on the left (shot metadata, subject/focus/composition rules and active-camera selection). Scene contains environment settings. Right Inspector shows only the current selected object's parameters; no duplicate Scene/Environment tabs or shot-wide settings appear there.

AI prose uses a default 180px reading field (minimum 140px), vertical native resize and text scrolling. The existing bottom split, float and maximize controls remain available. Suggestions never shrink the prose field. Stage stacking is isolated from the reading area; the compact rail adapts to short desktop heights without covering the lower panels.

## Character Mannequin Rules / 角色人偶规则

Character Mannequin 是 Blocking Mannequin，不是写实人物。默认站姿采用低多边形关节结构：头部、短颈、肩线、锥形躯干、骨盆、上下臂、手、上下腿、踝与脚。关节层级必须清楚，选择态不能遮蔽轮廓。

- Plan 2D 显示身体朝向与独立 Head Facing 指示。
- Spatial 3D 的胸前 Cyan 标记只表示 Facing，不是装饰灯。
- Camera View 保留可读剪影；不得增加面部、衣物或写实材质。
- 默认比例服务于走位、遮挡、构图和镜头空间判断。

## Primitive Recognizability / 基础体辨识度

基础体在 Plan 2D、Spatial 3D、Camera View 必须由轮廓而不是标签独立识别。Car / Van 使用车身、座舱、车头和车轮；Motorcycle 使用前后轮、车架、座椅、油箱、前叉、车把和灯；家具与建筑基础体使用最少必要结构。保持低模、低面数，不进入精细建模。

## Motion Path Visual Language / 运动路径视觉语言

Motion Path 属于共享 Scene Graph 中可移动对象的路径数据，而不是 Inspector 私有数值。Camera、Character、Vehicle、Prop 与其他可移动对象使用同一套 `motionPaths`。

- Spatial 3D 与 Plan 2D 都可选中路径、选中节点并直接拖动。
- Inspector 提供节点选择、XYZ 数值、Add、Delete 与路径删除，作为精确和键盘可达替代操作。
- 每条路径至少保留两个节点；删除后重新规范 `order`。
- `Linear` 使用折线；`Auto Smooth` 使用自动平滑曲线。两种视口必须读取相同 `smooth` 标记。
- 路径颜色遵循语义：Camera 为低饱和 Gold，其他可移动对象为低饱和 Cyan；选中还必须伴随宽度或节点环变化。

## AI Product Doctrine

正式定义：**AI interprets intent and language. SceneAxis owns spatial truth.** AI 是语义与创意辅助层，不是 Scene Graph 作者、自动建模器或场景事实来源。

- SceneAxis 的结构化坐标、旋转、距离、Facing、Camera、对象身份、可见性、屏幕位置与前后景关系是权威事实。
- Director Interpretation 提供 `Faithful` 与 `Director`。Faithful 只做自然、简洁、接近原结构的改写；Director 可重组表达、强调已有构图与空间关系，但不得添加意图或事实。
- 输出语言跟随当前 UI 语言；用户对象名必须原样保留，不得错误翻译。
- Current Shot Suggestions 只分析当前镜头，按 Camera、Composition、Blocking、Lens、Subject、Depth 返回“建议 + 原因”。建议是可选阅读内容，不自动写回 Scene Graph。
- AI 请求必须具备 Loading、Timeout、Error、Retry 与结构化响应校验。低差异解释需要提示用户，不得把近似原文伪装成有效增强。
- Provider Adapter 只暴露文本与结构化生成协议。DeepSeek 与 OpenAI-compatible endpoint 使用同一界面；产品逻辑不得依赖模型名或供应商专属返回结构。
- API Key 仅在当前会话内存中使用，不写入持久化偏好或 `.jyproject`。

AI output may interpret, rewrite and suggest, but it cannot mutate or overrule spatial truth. Suggestions remain session-local until the user explicitly edits the scene through normal SceneAxis controls.

### AI Director Interpretation

Faithful 与 Director 共用相同的不可变空间事实输入。Faithful 优先忠实、自然和简洁；Director 优先导演可读性、构图关系与空间层次，但两者都不允许生成新的对象、位置、镜头参数或未经结构化数据支持的意图。结果写入可读的 AI enhancement 字段，不覆盖 deterministic Spatial Description。

### AI Shot Suggestions

Current Shot Suggestions 使用结构化响应 `{ category, suggestion, reason }`。允许的 category 为 Camera、Composition、Blocking、Lens、Subject、Depth。响应必须通过数量、枚举、非空文本与长度校验；错误、超时或非法 schema 保留当前场景与确定性描述，并显示可重试状态。
