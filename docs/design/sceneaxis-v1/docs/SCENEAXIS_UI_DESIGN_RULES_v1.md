# 镜域 / SceneAxis — Brand & UI Design Rules v1

**状态：** UI North Star v1 / Brand System v1 Candidate
**产品名：** 镜域 / SceneAxis
**副标题：** SPATIAL DIRECTOR
**核心身份：** 面向影视、动画与分镜创作者的空间导演与镜头规划工具。Spatial Description 是不可弱化的核心能力。

---

## 1. 设计目标

SceneAxis 不应表现为传统后台、通用 SaaS 或“发光 AI 工具”。它应具有：

- 专业影视创作工具的可靠、紧凑与高信息密度；
- 现代设计工具的克制、清晰与一致性；
- 明确的空间、摄影机、构图与导演语义；
- 长时间桌面使用的低视觉疲劳；
- 可扩展到 Previs、AI Shot Planning 与自动 Blocking 的结构。

**关键词：** Precision / Spatial Thinking / Cinematic Intent / Calm / Professional.

---

## 2. Logo 系统

### 2.1 核心图形
Logo 由两类几何语义构成：

1. **Field of View / Frustum**：两侧三角形代表视域、镜头与空间观察；
2. **Axis**：中央纵轴与锚点代表空间坐标、定位与 SceneAxis 的 “Axis”。

Logo 的解释必须来自产品本身，不额外加入 AI sparkle、场记板、胶片等俗套符号。

### 2.2 使用版本

- `sceneaxis-logo-horizontal-dark.svg`：深色背景完整横版；
- `sceneaxis-logo-horizontal-light.svg`：浅色背景完整横版；
- `sceneaxis-glyph-dark.svg`：深色 UI、小尺寸；
- `sceneaxis-glyph-light.svg`：浅色 UI、小尺寸；
- `sceneaxis-app-icon.svg`：应用图标；
- `sceneaxis-favicon.svg`：浏览器 favicon。

### 2.3 Logo 规则

- 完整 Logo 只在品牌区、项目页、欢迎页与文档封面使用；
- 工具栏、侧栏、favicon 优先使用 Glyph；
- 小尺寸版本不得依靠 Glow 才能识别；
- 不拉伸、不旋转、不改变轴线与视锥比例；
- Logo 主色保持 Cyan + Neutral，不将 Cinema Gold 填入主 Logo；Gold 属于产品内的“导演语义色”。

---

## 3. 双强调色语义

SceneAxis 使用两个**不同含义**的强调色。两者不能互相替代。

### 3.1 Axis Cyan — System / Interaction

**主色：** `#41C6CE`
**柔和色：** `#8CDDE1`

用于：

- 当前主导航 / Tab；
- Active Tool；
- Toggle / Switch；
- Hover / Focus；
- 系统层级的 Selection；
- 可交互状态；
- Spatial system status；
- 品牌 Logo。

**不要用于：** 所有按钮、所有描边、所有 Card、所有文本。

### 3.2 Cinema Gold — Camera / Spatial Intent

**主色：** `#D6A84F`
**强化色：** `#E7B85E`

用于：

- Camera / Camera Frustum；
- 镜头选中与镜头强调；
- Composition；
- Blocking 与 Cinematic Intent；
- Spatial relation 的导演级重点；
- Spatial Description 中摄影机、构图、镜头语义标签。

Gold 的意义是**导演意图**，不是普通 UI 的“高亮色”。

### 3.3 使用比例

建议视觉面积：

- Neutral：约 85%；
- Cyan：约 8–10%；
- Gold：约 3–5%；
- Success / Warning / Error：只在实际状态出现。

严禁把 Cyan + Gold 演化成霓虹、Cyberpunk 或黑金奢侈品风。

---

## 4. Dark / Light Theme

### Dark（默认）

| Token | Hex | 用途 |
|---|---|---|
| BG Primary | `#0B0F12` | 主工作背景 |
| BG Secondary | `#121A20` | 侧栏 / 次级区域 |
| Surface | `#18232C` | 面板 |
| Elevated | `#23313B` | 浮层 / Popover |
| Text Primary | `#F1F5F7` | 主文字 |
| Text Secondary | `#A6B4BE` | 次级文字 |
| Border | `#2F3B46` | 必要分隔 |

### Light

| Token | Hex | 用途 |
|---|---|---|
| BG Primary | `#F4F6F7` | 主工作背景 |
| BG Secondary | `#E9EEF0` | 侧栏 |
| Surface | `#FFFFFF` | 面板 |
| Elevated | `#F7F9FA` | 浮层 |
| Text Primary | `#11181D` | 主文字 |
| Text Secondary | `#5C6973` | 次级文字 |
| Border | `#CCD5DA` | 必要分隔 |

Light Theme 不得变成普通白色 SaaS Dashboard，仍保持低饱和、冷静、专业的工具感。

---

## 5. 布局架构

UI North Star 固定以下主结构：

1. **Global Navigation（最左）**
   Shots / Assets / Environments / Characters / Library / Settings

2. **Context Panel（左侧第二列）**
   当前模块的内容导航。例如 Shots 下使用 Shot List。

3. **Workspace（中央）**
   Plan View / Spatial 3D / Camera View。中央 Workspace 必须获得最大面积，是视觉主角。

4. **Lower Workspace（中央下方）**
   Camera Preview + Spatial Description / AI Assistant / Notes。

5. **Inspector（右侧）**
   紧凑、专业、适合连续编辑，不使用普通网页表单式的大尺寸输入框。

---

## 6. 二级导航与菜单

优先把相关功能组合进：

- Tabs；
- Dropdown；
- Context Menu；
- Secondary Toolbar；
- Popover；
- Collapsible Section。

低频功能不长期占据主工具栏。

示例：

- Shot：`Sequence / Timeline / Boards`
- Workspace：`Plan View / Spatial 3D / Camera View`
- Spatial Panel：`Spatial Description / AI Assistant / Notes`
- Inspector：`Inspector / Scene / Environment`
- Export：通过单一 `Export ▾` 进入 Camera Frame / Plan / JSON / Text / Reference Board 等。

---

## 7. 图标与 Tooltip

高频工具采用 **Icon-first**。

适合仅显示图标的操作：

- Select
- Pan
- Move
- Rotate
- Scale
- Measure
- Pen
- Marker
- Frame
- Duplicate
- Panel maximize / collapse

Tooltip 在 Hover 后约 **350–500ms** 显示：

- 功能名称；
- 快捷键（若存在）；
- 必要时一行简短解释。

所有 Icon 必须保持统一线宽、圆角与视觉尺寸。禁止混入 Emoji 或多个不一致 Icon 库。

---

## 8. Typography 与文字缩放

建议基础字号体系：

- 12px：元数据 / 辅助；
- 13px：紧凑工具文字；
- 14px：默认 UI；
- 16px：面板标题；
- 20px：局部主标题；
- 28px+：仅品牌 / 项目页。

文字缩放使用统一系统，不逐组件修改：

- **Compact：90%**
- **Default：100%**
- **Large：115%**

字号变化必须同时覆盖 Shot List、Inspector、Tooltip、Menu、Dialog、Spatial Description 与 AI Panel。布局不可因 Large 模式发生明显溢出。

---

## 9. Shot List

Shot 卡片以**缩略图 + 核心元数据**为主体：

- Shot number
- Shot title
- Shot type
- Duration

选中态：

- 普通系统 Selection：Cyan；
- 镜头 / Cinematic selection：可使用克制 Gold；
- 不使用厚重整圈发光边框。

支持 Sequence 分组、折叠、数量显示与 Context Menu。

---

## 10. Workspace / Plan View

- 画布优先于 UI 装饰；
- Grid 必须弱于场景内容；
- Toolbar 尽量轻量、悬浮或与画布融合；
- Camera / Frustum 使用 Cinema Gold；
- Active Tool / 系统 Selection 使用 Axis Cyan；
- 不用大量 Card / Border 把画布切碎。

**核心规则：UI 后退，创作内容前进。**

---

## 11. Camera Preview

Camera Preview 是构图验证区，而不是普通缩略图。

显示可包含：

- Aspect Ratio
- Lens / Focal Length
- Resolution
- Exposure / ISO（未来）
- Composition Guides

Gold 可用于与摄影机、构图直接相关的选中/强调状态。

---

## 12. Spatial Description

Spatial Description 是 SceneAxis 的核心产品能力，应保持明显的视觉层级。

推荐内部：

- 结构化空间数据；
- Human-readable Description；
- Tags；
- AI Enhancement（可选）。

标签颜色：

- Neutral：普通事实；
- Cyan：空间 / 系统关系；
- Gold：Camera / Composition / Cinematic Intent。

AI Assistant 不得在视觉与信息架构上取代 Spatial Description。

---

## 13. Inspector

Inspector 使用专业工具式紧凑布局：

`Label    Control`

Transform 推荐：

- Position：X / Y / Z
- Rotation：X / Y / Z
- Scale：X / Y / Z

Camera 推荐：

- Lens
- Sensor
- Aspect Ratio
- FOV

使用 Collapsible Sections；减少巨大输入框和纵向空白。

---

## 14. 状态色

- Success：`#45B87A`
- Warning：`#DCA44A`
- Error：`#D85B60`

状态色只用于系统真实状态，不用于品牌装饰。避免 Tailwind 默认式高饱和红绿灯观感。

---

## 15. Motion 与反馈

动画应服务于状态理解：

- Hover / Focus：100–160ms；
- Panel / Popover：140–220ms；
- 不使用夸张弹簧动画；
- 支持 `prefers-reduced-motion`；
- Glow 仅允许 Logo、Camera / Spatial selection 极轻使用，普通按钮与 Card 禁止 Glow。

---

## 16. 响应式桌面策略

SceneAxis 是 **Desktop-first**。

关键验证尺寸：

- 1920×1080
- 1440×900
- 1366×768
- 1024×768

低宽度时优先：

- Collapse / hide secondary panels；
- 使用二级菜单收纳低频工具；
- 不通过无限缩小文字和控件强行塞下全部内容。

---

## 17. 无障碍与可读性

- Focus state 必须可见；
- 不以颜色作为唯一信息载体；
- Tooltip / aria-label 补充纯图标按钮；
- 文本和表面优先达到 WCAG AA 对比度；
- Cyan / Gold 选中状态同时使用形状、描边或图标变化。

---

## 18. 禁止事项

**不要：**

- 紫蓝 AI 渐变；
- 大面积 Glow；
- 玻璃拟态泛滥；
- 每个区域都变成圆角 Card；
- 超大 SaaS 标题；
- 大面积金色；
- 全界面 Cyan；
- Emoji 工具图标；
- 为了“高级感”牺牲信息效率；
- 让 AI 功能在视觉上压过 Spatial Description。

---

## 19. 核心颜色语义速查

> **Cyan = System / Interaction**
> **Gold = Cinema / Camera / Spatial Intent**
> **Neutral = Content / Structure**
> **Status colors = Actual system state**

这条规则是 SceneAxis UI 色彩体系的最高优先级。
