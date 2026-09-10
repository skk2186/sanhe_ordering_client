# Midnight Sushi Station

## Phase 02：核心菜品舞台、轨道运动与点餐交互动效报告

主题 key：`midnight-station`
工作分支：`themev1`
报告状态：**PASS WITH WARNINGS**

本阶段在阶段 1 的主题基础设施上完成 Midnight Station 的核心舞台运动、菜品触摸反馈、购物车空间连续性、购物车状态反馈、开站进入动画和专属场景转场。真实水平滚动仍是唯一运动模型，业务数据、购物车规则、订单接口和旧主题逻辑未被重写。

## 1. Git 信息

| 项目 | 结果 |
|---|---|
| branch | `themev1` |
| HEAD before | `3c43766957bd42f2c8c459bd2a455680f5095312` / `feat: add new theme` |
| HEAD after | 同上；本阶段未创建新 commit |
| working tree | 包含本阶段预期的 6 个修改文件、1 个新增 motion 组件和本阶段报告；未执行 reset、stash、checkout 或删除用户改动 |

## 2. 修改文件

| 文件 | 本阶段内容 |
|---|---|
| `src/components/display/ScenicDishStage.vue` | 在现有 stream、拖拽、惯性、wheel、方向、速度和暂停模型上增加午夜三层视觉轨道、缓存式中央焦点、首批错峰进站、hover/focus 检查灯、按压态、BOARDING 印章和 PLATFORM HOLD |
| `src/components/display/midnight/StationCartTransfer.vue` | 新增轻量临时纸票 transfer overlay；从真实菜品 DOMRect 飞向真实左右席位槽位，支持取消、清理、快速连续点击和 reduced motion |
| `src/components/display/CartPanel.vue` | 增加席位票数量变化、纸票删除、满载提示、席位接收、下单 loading/success/error 的 Midnight 反馈；业务事件保持原样 |
| `src/views/display/ConveyorBeltDisplay.vue` | 传入 UI-only source metadata，接入 transfer ref 和订单反馈状态；左右归属判断、`add`、`placeOrder` 和接口调用保持原流程 |
| `src/components/display/SceneTransitionOverlay.vue` | 将午夜转场扩展为线路收束、站牌揭示、票据撕口和红黄绿信号序列；保留原有 `covering/covered/revealing/idle` 状态机 |
| `src/styles/themes/midnight-station.scss` | 补充 transfer、stamp、receive、number、remove 等统一 motion token |
| `src/components/display/SettingDialog.vue` | 修正与三个主题数量不一致的旧注释；没有重做设置布局 |
| `docs/theme-midnight-station/PHASE_02_CORE_MOTION_REPORT.md` | 本阶段实现与验证记录 |

## 3. Core Motion Architecture

### 保留真实 stream

Midnight Station 继续使用 `ScenicDishStage` 原有的一条水平 scroll stream。自动滚动、无限循环、drag、inertia、wheel、`beltDirection`、`beltSpeed`、pause、category 和 click 均由原代码继续负责，没有新增第二套 carousel，也没有把购物车方向误用为传送带方向。

### 视觉轨道

每个 entry 依据 `instanceIndex` 轮换 `back / middle / front` 三个 visual lane，使用 CSS variables 控制 `y / scale / opacity / brightness / z-index`。三份循环数据仍是同一业务列表，因此没有改变数据来源或点击链路。

- back：`-18px / 94% / 72% opacity`，较低对比度；
- middle：`0px / 98.5% / 90% opacity`；
- front：`18px / 100% / 100% opacity`，作为主要可点击层。

中央焦点只在现有 stream RAF 中以约 84ms 的节奏更新 CSS variables；槽位布局矩形只在列表变化或 resize 后缓存，不在每帧调用 `getBoundingClientRect()`。

## 4. Dish Motion

| 项目 | 实现 |
|---|---|
| entry | Midnight 场景进入时，第二循环的首批菜品按 `420ms + 42ms` stagger 依次进站，单盘约 `600ms`；没有 bounce、海浪上下漂浮或大幅旋转 |
| lane depth | 前后轨道通过 `translate3d / scale / opacity / brightness / z-index` 建立层级，真实水平 scroll 不变 |
| focus zone | 以 stream 中心附近约 42% 视口范围计算 0–1 focus；最多增加约 1.5% scale、5.5% brightness 和有限 opacity，进入焦点时只增强对应短平台标记 |
| hover/focus | 菜品上移 3px、边框和层级提升、底部检查灯展开；`focus-visible` 有 3px accent outline，不依赖 hover 才能操作 |
| pressed | pointer down 立即进入 `120ms` 内的实体按压态：`translateY(1px) scale(.985)`、pressed shadow；不会等待接口返回 |
| click | 成功触发既有 `dish-click` 前显示约 `380ms` 的 `BOARDING` 主题印章；没有替换既有 ElMessage 或业务反馈 |
| duplicate cycle safety | feedback key 包含 cycle index，点击无限循环中的一盘只反馈真实点击的那一份，不会三份同时盖章 |
| pause | 保留原 scroll 位置并显示 `PLATFORM HOLD / PAUSED`；恢复后从原位置继续，不重置列表 |

## 5. Add-to-Cart Motion

- source：点击菜品时从 `event.currentTarget` 获取真实 `.tide-dish` 元素；键盘触发也能定位同一元素。非菜品入口（如助手/导航）不伪造菜品节点，使用安全的视口 fallback。
- target：业务 `add(item, side)` 返回的真实 `side/index` 保持不变；下一帧在对应 `.cart-section--left/right` 内查找真实 `data-station-cart-index` 槽位，并读取真实目标 `DOMRect`。
- trajectory：创建临时纸票 ghost，使用 Web Animations API 的三段 `transform + opacity` 路径，以中段弧线抬升表现“入席”，不移动真实菜品 DOM。
- direction：目标严格取 `result.side`，左席位飞左、右席位飞右；不依赖 `beltDirection`。
- cleanup：动画完成、取消、目标不可用、组件卸载时都会移除 ghost；active animation 和接收 timer 均清空。快速连续点击使用独立 id，可并行动画，不会共享状态错位。
- reduced motion：不执行票据飞行，直接移除 ghost 并短暂点亮真实目标席位，业务状态仍即时更新。

## 6. Cart Feedback

### 数量

数量显示保持固定宽度 `2ch`，菜名、缩略图和 slot 不 reflow。增加/减少分别使用约 `190ms` 的上下方向 number flip，状态只在 `midnight-station` 下启用。

### 删除

真实 `remove` 事件立即发出，不延迟业务状态；同时在原槽位短暂显示 `REMOVED` 纸票，并在约 `260ms` 内向下淡出。

### 满载

继续沿用现有容量规则。尝试超出容量时，原 `out_meal` 提示改为午夜 `SEAT FULL`，只运行一次短提示，不持续 shake、不持续红光、不遮挡下单和删除控制。

### 下单

- idle：保留原 i18n 与 `/4` 进度，纸面按钮视觉标记为 `DEPART`；
- press：沿用控制台的 1–2px 下沉；
- loading：按钮宽度不变，隐藏原 spinner 的视觉竞争，显示 `ROUTE` 轻量 departure signal；
- success：既有 `order_meal` 流程不变，加入 `ORDER SENT`、纸票边框确认和一次 `red → amber → green` signal sequence；
- error：保留原错误提示和可重试业务状态，显示一次 `CHECK` 故障状态。

## 7. Scene Motion

### Open Station

Midnight 舞台进入时使用约 `1200ms` 的专属开站编排：背景暗部先稳定，三条轨道分别在 `120 / 210 / 300ms` 延迟后部署，第二循环菜品再以 42ms 间隔进站。轨道只做一次入场，不持续高频运动。

### Covering

从其他主题进入午夜时，overlay 使用现有 `covering` 状态，让双线路向中央收束；站牌在收束过程中以轻量纵向压合进入，票据撕口线同步展开。

### Covered

画面覆盖后显示 `NEXT SERVICE / MIDNIGHT STATION / ROUTE 03 · OPEN` 的站牌票据结构，使用 `scaleY / clip-path` 做 2–3 段翻牌感，不引入复杂 3D 机械动画。

### Revealing

进入 `revealing` 后，线路从中心向左右展开，站牌和票据撕口向上退出，信号灯依次经过 red、amber、green，随后由父级现有状态机卸载 overlay。转出 Midnight 时仍走 zhenxian/xiaoxin 原有分支，午夜 token 不会泄漏到其他主题。

## 8. Reduced Motion

`prefers-reduced-motion: reduce` 下：

- 取消开站 choreography、stagger、轨道部署、票据飞行、split-flap、线路展开和连续装饰动画；
- 舞台、菜品、轨道和转场直接到达可用最终状态；
- 保留 pointer pressed、颜色/边框变化、selected、BOARDING 语义、数量结果、success、error 和 PLATFORM HOLD 文案；
- transfer 不依赖 `animationend` 才更新业务，直接清理 ghost 并点亮目标；
- overlay 通过 CSS 直接收束，父级仍按短等待完成 `covered/revealing` 状态，不会留下透明遮罩挡住点击。

## 9. Performance

| 检查项 | 结果 |
|---|---|
| 新增 RAF | 无；复用舞台已有单一 RAF |
| 新增 observer | 无新增业务 observer；复用已有 ResizeObserver，仅在尺寸变化时让 focus cache 失效 |
| 每帧 layout read | 无；focus 每 84ms 只读取 `scrollLeft/clientWidth`，矩形在列表变化/resize 后缓存；transfer 只在点击时读取 source/target DOMRect |
| 动画属性 | 主要为 `transform`、`opacity`、`filter: brightness` 和 border/background 状态，未加入大面积 blur、backdrop-filter、canvas 粒子或 GIF |
| 临时 DOM | 每个 transfer ghost 由独立 id 管理，完成/取消/卸载均删除 |
| 第三方依赖 | 无；未引入 GSAP 或其他动画库 |
| 无限动画 | 仅保留 loading 状态下的 departure signal；轨道、菜品和背景装饰不持续独立循环 |

## 10. 自动检查

| command | result |
|---|---|
| `git status --short` / `git branch --show-current` / `git log -3 --oneline` | **PASS**：当前为 `themev1`，HEAD 仍为 `3c43766 feat: add new theme`，工作区只有本阶段预期文件 |
| `npm run build` | **BLOCKED**：npm/node 启动阶段仍因 `EPERM: lstat C:\Users\10851` 失败 |
| 直接 Node/Vite 等价 build | **PASS**：`1793 modules transformed`，构建完成；保留既有 Sass deprecation 与大 chunk warning，无 fatal error |
| `npm run test:assistant` | **BLOCKED**：同一 npm/node 启动权限问题 |
| 直接 Node assistant tests | **PASS**：26/26 passed |
| `npm run test:voice` | **BLOCKED**：同一 npm/node 启动权限问题 |
| 直接 Node voice tests | **PASS**：9/9 passed |
| `npm run lint` | **BLOCKED**：同一 npm/node 启动权限问题；未让 `--fix` 修改工作区 |
| 直接 ESLint no-fix | **BLOCKED**：ESLint 9 找不到 `eslint.config.js/mjs/cjs`；本阶段未新增无关配置 |
| `npm test` | **NOT AVAILABLE**：`package.json` 没有通用 `test` script；npm launcher 同样受本机权限问题影响 |
| `git diff --check` | **PASS**：无 whitespace error；仅有 LF/CRLF 转换提示 |
| `http://localhost:3000/display` | **PASS**：本地页面返回 HTTP 200 |

## 11. Manual Review

| 检查项 | 结果 |
|---|---|
| `1920x1080` | **PASS WITH WARNINGS**：沿用阶段 1 的实际页面检查结果，三段布局、午夜舞台、双侧席位票、中央控制台、顶部信息区和 AI 区域可见；本阶段新增动态只能做源码/构建核验，因为菜单 API 返回失败 |
| dish stream | **SOURCE VERIFIED**：单 stream、三周期、自动横向连续滚动和午夜 lane vars 已接入；真实菜品为空时无法进行动态视觉操作 |
| drag / inertia | **SOURCE VERIFIED**：原 pointer capture、flick sample 和 inertia 逻辑未重写；真实菜品运行态受 API 环境阻断 |
| pause / resume | **SOURCE VERIFIED**：原暂停位置保持，午夜显示 `PLATFORM HOLD`；运行态点击受浏览器自动化连接阻断 |
| speed / direction | **SOURCE VERIFIED**：继续使用原 `beltSpeed` / `beltDirection`；运行态受空菜单/浏览器自动化阻断 |
| cart left / right | **SOURCE VERIFIED**：transfer target 由真实 `side/index` 查找，左右选择不互换；真实加购受菜单 API 阻断 |
| theme switch | **SOURCE VERIFIED / UI AUTOMATION BLOCKED**：原 `SCENES`、`pendingSceneKey`、`applySceneTheme`、overlay 状态链未改；重启后 CUA 浏览器枚举失败 |
| reduced motion | **PASS BY IMPLEMENTATION**：舞台、购物车 transfer、购物车反馈和 overlay 均有 reduced-motion 直达规则 |
| console | **WARNING**：无法在重启后重新建立浏览器调试连接；构建无新增 fatal error。页面已知菜单请求失败属于当前后端环境问题 |

仓库没有安全可用的 display mock/development fallback。本阶段没有伪造生产菜品数据，也没有修改 `menuApi`、订单 API 或业务状态以绕过该限制。

## 12. Old Theme Regression

### `zhenxian`

海滩的 wave、raft、boat、特殊事件和原转场分支保留。午夜新增舞台规则均以 `.is-midnight-station` 或 `themeKey === 'midnight-station'` 作用域保护；旧主题的 `dish-bob`、foam、boat 资源和事件缓存没有被改写。

### `xiaoxin`

海底的 wave、shell、turtle、bubble、特殊事件和原转场分支保留。午夜分支不插入船/海龟事件，不加载海洋素材，也不覆盖海底选择器。

### 业务回归边界

`useCart`、`menuApi`、`orderApi`、`useOrderProgress`、AI recommendation、voice recognition、TTS、history、call waiter、game eligibility 和 i18n architecture 没有被重构；新增内容只有 UI metadata、视觉 ref、主题反馈状态和现有 i18n 链路上的主题渲染。

## 13. UI/UX Pro Max 自审

已重新使用 `ui-ux-pro-max` 的 motion、touch、focus、reduced-motion 和层级规则进行实现后检查，并据此保留以下约束：

- 以菜品为 Level 1，购物车当前操作为 Level 2，背景轨道只做空间提示；
- 不把所有元素同时动画，不给菜品使用海浪式上下漂浮，不用 hover scale 作为主反馈；
- 交互保留 pointer/click/key action，focus-visible 清晰；
- 菜品、暂停和控制按钮维持大屏可操作尺寸，常用触摸目标按 44–48px 方向检查；
- transfer、按压和入席使用 transform/opacity，快速状态可取消并直接收敛语义状态；
- 无限运动只保留 loading departure signal，reduced motion 下直接显示最终状态；
- Midnight Station 不引入紫蓝渐变、毛玻璃、霓虹、满屏粒子或 AI 模板式 glow。

## 14. Remaining Work

以下内容按计划留给阶段 3 或后续 refinement：

- AI idle/listening/thinking/recommending/success/error 的深度主题动效；
- `FeaturedDishScreen` 的完整数字广告装置表现；
- `SushiNavigation` Midnight Station 重做；
- `OrderHistoryDialog` Midnight Station 重做；
- 全局 UI refinement、最终站牌/票据美术素材与更细的场景遮挡表现；
- 在可用菜单 API 或安全测试数据环境下完成真实连续加菜、左右飞票、数量、满载、下单成功/失败的浏览器验收。

## 15. Risks

1. 当前本地菜单 API 在人工页面中返回失败，无法对真实菜品做运行态点击、加购、购物车容量和下单手工验证；本报告没有把源码核验冒充真实 UI PASS。
2. CUA 浏览器连接在电脑重启后无法枚举浏览器，阻断了本轮页面操作、主题切换和 console 的再次人工确认。
3. npm 启动器仍受到 `C:\Users\10851` `EPERM lstat` 影响；直接 Vite/Node 等价命令已通过。
4. 仓库没有 ESLint 9 flat config；直接 lint 无法启动。本阶段没有为了 lint 引入与主题无关的配置。
5. 构建仍有既存 Sass deprecation 和 Element Plus/Phaser 大 chunk warning，未做无关技术债处理。

## 16. Final Verdict

**PASS WITH WARNINGS**

`midnight-station` 的核心菜品舞台、视觉轨道层次、首屏进站、焦点/按压/点击反馈、左右真实目标 transfer、数量/删除/满载/下单反馈、开站进入、专属转场和 reduced-motion 已完成，且没有破坏原有 stream 或业务链路。警告仅来自 npm 启动权限、缺少 ESLint 配置、菜单 API 不可用和重启后的浏览器自动化连接失败，因此真实动态菜品链路仍需在可用环境补做人工验收。
