# Midnight Sushi Station

## Phase 01：主题骨架、Design Tokens 与主题切换接入报告

日期：2026-09-10  
主题 key：`midnight-station`  
最终判定：**PASS WITH WARNINGS**

本阶段将「午夜月台｜Midnight Sushi Station」作为现有主题系统的第三个成员接入。实现遵循原有三段式页面与业务链路，新增视觉只在 `midnight-station` 作用域内生效，没有重写订单、购物车、AI、语音或国际化架构。

## 1. Git 信息

| 项目 | 结果 |
|---|---|
| branch | `themev1` |
| HEAD before | `b1a9028 chore: adapt code for local machine environment` |
| HEAD after | 同上；本阶段未提交 commit |
| working tree | 包含本阶段预期的主题文件、组件皮肤、i18n 文案和阶段报告；未执行 reset、stash 或 checkout |

## 2. 原主题架构确认

### `zhenxian`

现有设置项名称为「蜡笔小新·海滩」，使用 `public/images/ui/b/` 的海滩、船和过渡素材。它通过 `SCENES.zhenxian` 提供背景与预加载资源，并由 `data-theme="zhenxian"` 驱动组件中的主题选择器。

### `xiaoxin`

现有设置项名称为「海底贝壳」，使用 `public/images/ui/c/` 的海底、海龟、珊瑚和过渡素材。它沿用相同的 `SCENES`、`data-theme`、`localStorage` 与场景转场链路。

### 固定结构与接入点

- `ConveyorBeltDisplay.vue` 维持顶部信息区、中部菜品/场景区、底部左右购物车加中央操作区。
- `activeSceneKey` 从 `localStorage.selectedThemeKey` 初始化；`applySceneTheme` 同时更新 `--theme-key`、`--theme-bg`、`data-theme` 和持久化值。
- `pendingSceneKey`、`preloadScene`、`SceneTransitionOverlay`、`selectedThemeKey` 和 `SettingDialog` 继续走原链路。
- `TopPlateProgress`、`ScenicDishStage`、`CartPanel`、`CenterFunctionPanel`、`VirtualDiningAssistant`、`FeaturedDishScreen`、`AmbientSceneEffects` 均保留原有业务事件，仅增加主题皮肤入口或午夜主题必要的安全分支。
- Midnight Station 不依赖新的位图背景；舞台使用 CSS 几何轨道、规则线、站牌和信号元素，因此不会把低质量占位图变成正式资源。

### 必须规避的重复点

新主题没有复用海浪、气泡、鱼、海龟、珊瑚、木船、海洋托盘、紫蓝霓虹、CRT、赛博网格、满屏粒子或原有横向漂浮装饰。它使用「纸票、站牌、轨道、信号、控制台」作为新的统一语义。

## 3. 新增文件

| 文件 | 用途 |
|---|---|
| `src/styles/themes/midnight-station.scss` | Midnight Station 的颜色、圆角、阴影、字体、间距、动效 token 和全局基础舞台作用域 |
| `docs/theme-midnight-station/PHASE_01_THEME_FOUNDATION_REPORT.md` | 本阶段实现与验收记录 |

本阶段没有新增低质量 PNG、GIF、在线字体依赖或第三方运行时资源。

## 4. 修改文件

| 文件 | 修改内容 |
|---|---|
| `src/styles/index.scss` | 引入午夜主题 token 文件 |
| `src/views/display/ConveyorBeltDisplay.vue` | 注册 `midnight-station`、传递 `theme-key`、支持无位图背景、保留场景切换链路 |
| `src/components/display/SettingDialog.vue` | 增加第三主题选择卡、CSS 站牌预览、i18n 标题和午夜设置面板皮肤 |
| `src/components/display/SceneTransitionOverlay.vue` | 增加午夜站牌/轨道/信号的简化 covering、covered、revealing、idle 结构与 reduced-motion 规则 |
| `src/components/display/ScenicDishStage.vue` | 增加静态午夜月台舞台、两条轨道、规则线、站台标签、纸面菜品槽位与低干扰暂停状态 |
| `src/components/display/TopPlateProgress.vue` | 增加 `PLATE ROUTE` 站台进度牌，旧主题图片进度保持不变 |
| `src/components/display/CartPanel.vue` | 将左右购物车解释为 `LEFT SEAT / A`、`RIGHT SEAT / B` 的纸票夹/席位票 |
| `src/components/display/CenterFunctionPanel.vue` | 增加站台控制台皮肤、明确边框、按压下沉 1px 和控制标签 |
| `src/components/display/VirtualDiningAssistant.vue` | 增加站务员信息窗口皮肤和状态 class 预留，未改语音、TTS、推荐状态机 |
| `src/components/display/FeaturedDishScreen.vue` | 增加基础纸票式招牌菜容器皮肤，完整宣传动效留到下一阶段 |
| `src/components/display/AmbientSceneEffects.vue` | 午夜主题第一阶段不投放背景事件，避免旧海洋事件污染舞台；无候选事件时安全返回 |
| `src/i18n/messages.js` | 增加中文、英文、日文的 `settings.themeMidnightStation` |

## 5. Midnight Station Design Tokens

所有午夜主题值集中在 `src/styles/themes/midnight-station.scss` 的 `html[data-theme='midnight-station']` 作用域中。组件不再散落 Midnight 专属色值。

除设计稿中的基础色外，纸线、轨道线、遮罩、信号柔化和推荐高亮所需的 alpha 派生值也集中为 token，组件只引用变量。

### Color

| Token | 实际值 |
|---|---|
| background | `#151A19` |
| background-deep | `#0E1211` |
| surface | `#ECE5D6` |
| surface-elevated | `#F7F2E8` |
| surface-muted | `#D8D1C2` |
| primary | `#A63D32` |
| primary-strong | `#7E2C28` |
| secondary | `#31584D` |
| accent | `#D3A94E` |
| text-primary | `#F6F0E5` |
| text-on-surface | `#202725` |
| text-secondary | `#BEB8AA` |
| border | `#6D776B` |
| selected | `#C84C3E` |
| hover | `#E1B75D` |
| success | `#8EAF78` |
| warning | `#D39A45` |
| error | `#C8594B` |

### Radius

`panel: 8px`、`control: 6px`、`ticket: 3px`、`small: 4px`。没有使用大面积 16px/20px/24px/999px 圆角。

### Shadow

`E0: none`、`E1: 0 4px 12px rgba(14,18,17,.22)`、`E2: 0 10px 22px rgba(14,18,17,.32)`、`E3: 0 18px 34px rgba(14,18,17,.42)`、`Pressed: inset 0 2px 0 rgba(14,18,17,.24)`。阴影仅用于纸面与层级，不用于霓虹发光。

### Typography

- `brand`：`Noto Serif SC / Source Han Serif SC / Songti SC`，用于品牌与站牌标题。
- `scene-title`：沿用品牌衬线字体的场景标题等级。
- `dish-name`：`Noto Sans SC / Source Han Sans CN / Microsoft YaHei`，保证远距离识别。
- `price`、`table-number`、`ticket-number`：`Roboto Mono / IBM Plex Mono / Consolas`，强化票据和站台数据感。
- `secondary`、`button`、`assistant`：既有本地无衬线字体栈，避免在线字体依赖。
- 尺寸使用 `clamp`：品牌约 28–36px，菜名约 16–24px，价格约 20–28px，正文约 14–16px，按钮约 17–20px。

### Spacing

统一 `4 / 8 / 12 / 16 / 24 / 32 / 48px` 级数，分别映射 `space-1` 至 `space-7`。

### Motion

- `instant: 100ms`
- `fast: 180ms`
- `normal: 280ms`
- `scene: 1200ms`
- `easing-standard: cubic-bezier(0.22, 0.72, 0.24, 1)`
- `easing-enter: cubic-bezier(0.18, 0.76, 0.2, 1)`
- `easing-exit: cubic-bezier(0.55, 0, 0.72, 0.24)`
- `easing-spring: cubic-bezier(0.22, 1.18, 0.36, 1)`

本阶段只使用轻量 hover、pressed、状态显现和简化主题遮罩；弧线送餐、飞入购物车、数字翻页、AI 状态动画留到下一阶段。

## 6. Theme Registration

`midnight-station` 已加入 `SCENES`，并经过以下链路：

1. `getInitialSceneKey()` 从 `localStorage.selectedThemeKey` 读取并校验。
2. `applySceneTheme()` 更新 `--theme-key`、`data-theme`、`localStorage`。
3. `preloadScene()` 对无位图主题安全跳过。
4. `pendingSceneKey` 和 `sceneTransitionPhase` 继续驱动现有场景转场状态。
5. `SettingDialog` 使用主题 key 发出原有选择事件。
6. `SceneTransitionOverlay` 对午夜主题渲染独立的站牌/轨道/信号结构。

午夜主题背景值为 `none`，避免产生 `url()` 空路径；旧主题的背景、资源预加载与选择器没有改写。

## 7. SettingDialog

设置中现在有三项：

- 蜡笔小新·海滩 / `zhenxian`
- 海底贝壳 / `xiaoxin`
- 午夜月台 · Midnight Station / `midnight-station`

第三项使用 CSS 站牌预览，不依赖占位图，包含午夜底色、双轨规则线、纸票标题和红/黄/绿信号点。标题通过现有 i18n 机制提供中文、英文和日文，不改变设置弹窗的 tabs、声音、速度、方向、历史或关闭逻辑。

## 8. 基础 UI

### 顶部

品牌、桌号/人数、投碟进度和 AI 区域位置保持不变。午夜皮肤将顶部解释为横向站台信息牌，加入 `AI DINING TABLE`、纸面文字、`PLATE ROUTE` 与分段轨道线；取消毛玻璃与海洋背景。

### 中部舞台

舞台使用深炭墨背景、前后两条轻量轨道、规则线、中心低干扰菜品区与边缘暗部。菜品仍占据最高视觉层级；轨道只提供空间方向，不覆盖菜品。错误/空数据时可见明确的 `暂无菜品` 或现有错误反馈，不会卡住遮罩。

### 左右购物车

左右位置、容量、加减、删除、选择、下单事件不变。皮肤变为席位票/纸票夹：纸面槽位、编号、容量和 `DEPART` 信号按钮；数量按钮使用清晰触控区域和按压下沉反馈。

### 中央操作区

现有菜单、搜索、历史、设置、呼叫服务员和暂停事件不变，视觉解释为站台控制台。按钮采用明确边框、小圆角、纸面结构和统一 mono 标签，主要反馈是颜色/边框/下沉，不使用 `hover -> scale(1.1)`。

### AI 助手

外观解释为站务员/调度员信息窗口：纸面问候、深色推荐栏、票据式推荐项，并预留 `idle`、`listening`、`thinking`、`recommending`、`success`、`error` 主题状态 class。现有识别、推荐、TTS、音频与状态机没有重写。

### 设置、招牌菜与转场

设置面板使用站牌/票据标题、纸面正文和控制台分区；`FeaturedDishScreen` 只增加基础纸票式容器；转场先实现站牌、轨道、信号的结构和基础遮罩，复杂线路收束、票据撕口和分翻页站牌留到下一阶段。

## 9. 旧主题回归测试

### `zhenxian`

旧场景注册、海滩背景、旧资源数组、原有组件主题选择器均保留。新增样式全部使用 `html[data-theme='midnight-station']` 或 midnight 组件 class 作用域，没有修改 `zhenxian` 的主题变量。

### `xiaoxin`

旧场景注册、海底背景、海龟/珊瑚资源、原有转场分支均保留。午夜舞台不会加载海洋事件，也不会改写 `xiaoxin` 的 DOM 分支。

### 运行态检查

已用本地页面 `http://localhost:3000/display` 确认 HTTP 200，并在 1920×1080 浏览器视口检查到三段布局、午夜舞台、双侧购物车、中央控制台、顶部进度牌和 AI 区域均存在。此前运行页面因本地后端不可用显示「获取菜品列表失败」，这是环境数据源问题；空状态与错误反馈仍可见，未能完成真实菜品点击和真实加购链路的人工操作验证。

## 10. 自动检查

| command | result |
|---|---|
| `npm run build` | **BLOCKED**：npm/node 启动阶段因 `EPERM: lstat C:\Users\10851` 失败 |
| 直接执行 Vite build 等价命令 | **PASS**：1791 modules transformed，构建完成；仅有既存 Sass deprecation 与大 chunk warning |
| `npm run test:assistant` | **BLOCKED**：同一 npm/node 启动权限问题 |
| 直接 Node assistant test 等价命令 | **PASS**：26/26 passed |
| `npm run test:voice` | **BLOCKED**：同一 npm/node 启动权限问题 |
| 直接 Node voice test 等价命令 | **PASS**：9/9 passed |
| `npm test` | **NOT AVAILABLE**：`package.json` 没有通用 `test` script |
| `npm run lint` | **BLOCKED**：先遇到同一 npm/node 启动权限问题；仓库当前也没有 ESLint 9 所需的 `eslint.config.js/mjs/cjs` |
| `git diff --check` | **PASS**：无 whitespace error；仅有 Git 关于 LF/CRLF 的提示 |

## 11. 手工检查

| 检查项 | 结果 |
|---|---|
| `1920x1080` | **PASS WITH WARNINGS**：三段结构保持，顶部、舞台、底部席位票夹与控制台完整可见；页面错误提示来自不可用后端 |
| 页面可进入 | **PASS**：`http://localhost:3000/display` 返回 HTTP 200 |
| `midnight-station` 主题状态 | **PASS**：主题根作用域、站台轨道、进度牌、购物车、控制台和助手皮肤均存在 |
| theme switch | **SOURCE VERIFIED / UI AUTOMATION BLOCKED**：选择事件、`SCENES`、`applySceneTheme` 和 Overlay 链路已接入；重启后的浏览器调试接口无法稳定建立连接 |
| refresh persistence | **SOURCE VERIFIED**：由 `localStorage.selectedThemeKey` 初始化并由 `applySceneTheme` 持久化；浏览器自动化受上述环境限制 |
| cart | **PARTIAL PASS**：双侧购物车、容量、加减/删除/下单 UI 与原事件仍存在；因菜单 API 失败无法做真实菜品加购 |
| dish click | **BLOCKED BY ENVIRONMENT**：菜品列表 API 不可用，页面进入空/错状态，没有可点击菜品 |
| AI region | **PASS**：AI 区域存在，基础午夜信息窗口皮肤可见；识别逻辑未改 |
| settings | **SOURCE VERIFIED**：第三主题卡片、i18n 文案和 CSS 站牌预览已加入；浏览器自动化受重启后调试接口限制 |
| reduced motion | **PASS BY IMPLEMENTATION**：主题 token、转场、舞台和基础组件均包含 `prefers-reduced-motion: reduce`；转场在 reduced motion 下直接收束到最终状态 |

## 12. 本阶段未实现项

以下项目明确留到后续阶段：

- 完整菜品弧线路径、深度连续移动和空间遮挡动画；
- 菜品到左右购物车的 add-to-cart 飞行动画；
- 数量数字翻页/弹簧动画；
- AI idle/listening/thinking/recommending/success/error 的完整动态系统；
- `FeaturedDishScreen` 的完整数字广告装置表现；
- 完整线路收束、分翻页站牌、票据撕口和红黄绿信号转场；
- `SushiNavigation` 重做；
- `OrderHistoryDialog` 重做；
- 大量背景粒子、复杂新图片和新增场景事件素材。

## 13. 风险

1. 当前本地菜单 API 在人工运行检查中不可用，无法验证真实菜品点击、加购和订单提交，只能确认空/错状态不破坏布局。
2. npm 启动器受到本机 `C:\Users\10851` 的 `EPERM lstat` 影响；使用直接 Node/Vite 等价命令后构建与测试通过。
3. 仓库没有 ESLint 9 flat config，lint 当前无法正常启动；本阶段没有为了“补齐 lint”而修改 `package.json` 或引入无关配置。
4. 现有 Sass deprecation 与大 chunk warning 仍存在，未做无关技术债清理。
5. 阶段 1 的舞台使用 CSS/SVG-ready 几何而非最终美术素材；这保证了可运行性，但最终质感仍依赖后续真实站牌/票据素材与动效打磨。

## 14. 最终判定

**PASS WITH WARNINGS**

判定依据：`midnight-station` 已完成安全注册、设置入口、持久化契约、三段布局基础皮肤、Design Tokens、站台舞台、基础转场和 reduced-motion 基础支持；直接构建和现有两组测试均通过，未改业务逻辑。警告来自本机 npm 权限、缺少 ESLint 配置以及后端 API 不可用导致的人工菜品/加购验证受限。
