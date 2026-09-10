# Phase 02R：Midnight Sushi Station 视觉返工报告

## User Feedback

本轮返工针对四个明确问题：

- 月台看不出来；
- 中部只有几根平行线；
- 菜品仍像矩形商品框，不像餐盘；
- 整体美观度不足，存在明显的 AI 卡片感。

## Root Cause

阶段 2 的运动层是建立在原有海洋主题 DOM 上的。Midnight Station 只替换了颜色和轨道线，舞台没有建筑、顶棚、柱体、月台边缘或具有物理结构的主轨道，因此“月台”只能依靠文字和几条线来解释。

同时，`.tide-dish` 仍保留浅色背景、边框、圆角、阴影和整宽信息栏。即使图片被裁成圆形，视觉重心仍然是商品 Card，而不是“食物放在盘面上、盘子由托座沿轨道送来”。

## Variant Comparison

| 方向 | 空间识别度 | 菜品突出程度 | 餐饮感 | 当前布局兼容性 | 实现成本 | 结论 |
|---|---|---|---|---|---|---|
| A · Night Platform | 最高：顶棚、立柱、悬挂站牌、主轨道和月台边缘形成完整空间 | 高：建筑退后，餐盘在主轨道前景 | 高：陶瓷盘、暖灯、小票签 | 高：只增加中部背景层，不改变 stream | 中 | 选用 |
| B · Dining Rail Lounge | 中：更像餐厅包厢或服务廊，铁路语义变弱 | 高 | 最高，但“月台”识别度不足 | 高 | 中 | 备选 |
| C · Illustrated Station | 中：插画化几何更平面，偏视觉海报 | 中高 | 中高 | 高 | 低 | 备选 |

三个方向通过不同的建筑构图、站牌处理和灯光关系产生差异，不是三个配色版本。实际在 `http://localhost:3000/display` 的 1920×1080 页面上比较后，A 在美观度、月台识别度、菜品突出和布局兼容之间取得最佳平衡。

## Chosen Direction

最终采用 **A · Night Platform**：

> 一座低照度、暖站灯照明的夜间日式餐饮月台；一条有枕木和金属轨的微型送餐轨道从站台前方经过，寿司以陶瓷盘和金属托座的组合形式进站。

它不依赖蓝紫霓虹、毛玻璃、全屏渐变、网格或高频粒子，也没有把“Japanese”表达成文化符号堆叠。

## Stage Architecture

新增 `StationPlatformScene.vue`，仅在 `midnight-station` 下挂载，结构分为：

- 远景：低对比夜色、暗部窗带、远处暖色反射；
- 顶棚：横向 canopy、檐下暗部和横梁，建立“上方有棚”；
- 建筑：左右两根站台柱、柱内暖灯和编号灯箱，建立侧向边界；
- 中央锚点：悬挂式 SANHE DINING / 深夜食堂站牌；
- 主轨道：深色轨道底座、重复枕木纹、双金属轨和接触暗线；
- 月台边缘：单条暖黄 tactile strip、浅色压线和深色安全边界；
- 透视：地面轻微俯视透视，保持低强度，不做强 3D。

原有三层 lane 数据继续存在，但 Midnight Station 不再把三层渲染成三根平行装饰线：画面只保留一条明确的主送餐轨道，其他层只承担远近、亮度和遮挡提示。

## Dish Redesign

Midnight Station 的菜品 DOM 仍然是原来的可点击 `article`，数据、事件和运动模型没有改变；视觉承载层改为：

- **陶瓷盘**：宽椭圆盘面、盘沿、盘底接触阴影和浅色陶瓷材质；
- **食物图像**：作为盘面上的内容层，不再承担“卡片边框”；
- **Rail cradle**：盘底的金属托座、双轮和接触高光，解释菜品为何能沿轨道移动；
- **Station Ticket Tag**：小型票签放在托座前侧，显示菜名和价格，面积小于盘面；
- **推荐状态**：`AI PICK` 作为小旗标，不给整盘套一圈黄色边框；
- **Hover / focus**：整只盘轻抬 4px，盘底阴影变深，托座检查灯增强，票签提高对比度；
- **Click**：保留阶段 2 的即时 pressed 和 BOARDING 反馈，印章移动到票签/盘座附近；
- **Depth**：back / middle / front 只改变轻微 scale、opacity、brightness 和 y 偏移，不变成三条道路。

## Removed Card Patterns

本轮已删除 Midnight Station 的实际矩形 Card 表现：

- `.tide-dish` 在午夜主题下改为透明背景、无边框、无圆角、无卡片阴影；
- 移除整宽浅色底栏，信息改为小型票签；
- 隐藏旧海滩/厨师托盘视觉，只保留 Midnight 专属盘、托座和票签；
- 旧的三条 `tide-current` 只在旧主题使用，午夜主题中不再显示；
- `StationCartTransfer` 的 ghost 由矩形纸片改为“缩小餐盘 + 小票签”。

## Motion / Business Boundary

阶段 2 的核心 Motion Architecture 保持不变：

- 真实水平 stream、无限循环、drag、inertia、wheel、speed、direction、pause 没有重写；
- source / target `DOMRect` 的 Add-to-Cart 路径没有改变，只更换 ghost 视觉；
- 左右购物车判断、数量变化、删除、满载、下单反馈和 reduced-motion 分支没有改变；
- 本轮没有修改 API、购物车业务、订单业务、AI、语音、TTS、i18n 或旧主题事件。

## Visual Validation

本轮实际通过本机 Chrome DevTools Protocol 查看了 `http://localhost:3000/display`，而不是只检查源码。

- 1920×1080：确认顶棚、站牌、柱灯、实体轨道、月台边缘和餐盘层次同时可见；
- 3840×1080：确认新场景没有产生页面横向溢出，现有三段式布局仍保持；
- 浏览器运行时状态：`data-theme=midnight-station`、`station-platform-scene=true`、`station-main-track=true`，首屏检测到 33 个 plate/ticket 节点；
- 实际点击探测：点击可用菜品后约 150ms 检测到 1 个 transfer ghost，约 750ms 后 ghost 已清理且购物车状态已更新；测试购物车随后清除并刷新；
- reduced-motion 实测：通过浏览器媒体模拟后 `matchMedia('(prefers-reduced-motion: reduce)').matches=true`，舞台 `animation-name=none`，场景 SVG `transform=none`；随后已恢复普通媒体状态；
- `zhenxian` 与 `xiaoxin` 均实际截图回看，海滩船、海浪、海底海龟、贝壳和底部布局没有被新结构覆盖。

## Five-second Recognition Test

| 问题 | 结果 | 依据 |
|---|---|---|
| Q1：遮住 MIDNIGHT STATION / PLATFORM，仍能看出夜间月台吗？ | 通过 | 顶棚、两侧柱体灯箱、悬挂牌的物理安装关系、主轨道、枕木和暖黄站台边缘共同提供语义，不依赖文字。 |
| Q2：遮住菜名和价格，仍能看出是一盘食物吗？ | 通过但受现有图片管线影响 | 盘沿、盘面、接触阴影和底部托座明确形成“餐盘”轮廓；实际菜图仍来自现有 menu API / fallback 管线，本轮没有替换业务图片资源。 |
| Q3：第一视觉焦点是否仍是菜品？ | 通过 | 建筑低对比、站牌尺寸克制、轨道作为承载层，盘面和食物图像位于前景最高视觉层。 |

## Removed / Added Files

### Added

- `src/components/display/midnight/StationPlatformScene.vue`
- `docs/theme-midnight-station/PHASE_02R_VISUAL_REDESIGN_REPORT.md`

### Modified

- `src/components/display/ScenicDishStage.vue`
- `src/components/display/midnight/StationCartTransfer.vue`

## Skill Review

### ui-ux-pro-max

采用了“日式克制、可读、低动效、高层级”的方向；菜品作为 Level 1，购物车操作作为 Level 2，场景只作为承载层。实现使用 transform / opacity 和 CSS/SVG 几何，没有引入新动画库、霓虹 glow、毛玻璃或大面积 blur。

### better-interface

第二轮检查重点覆盖了：卡片感、空间层次、盘面材质、触摸目标、focus-visible、文字层级、站牌与票签的比例、背景对比度以及 reduced-motion。没有发现本轮引入的高优先级视觉或可用性问题。

### interface-review

按本轮 diff 作用域检查了 `ScenicDishStage`、`StationPlatformScene` 和 `StationCartTransfer`：没有发现新的全局选择器污染、旧主题选择器串扰、持续高频动画或未清理的 transfer DOM。运行时 API / 图片是否返回真实食物素材属于现有环境链路，未在本轮伪造数据。

## Build / Tests

| Command | Result |
|---|---|
| `npm run build` | NOT PASS：当前 Node 环境在 npm 启动前触发 `EPERM: lstat C:\Users\10851`。 |
| `node node_modules/vite/bin/vite.js build` | PASS：1795 modules transformed，构建完成；仅有项目既有 Sass deprecation 与 chunk size warnings。 |
| `npm run test:assistant` | NOT PASS：同一 `EPERM: lstat C:\Users\10851` 启动环境问题。 |
| `node --test tests/assistant-recommendations.test.mjs tests/assistant-sound.test.mjs` | PASS：26/26。 |
| `npm run test:voice` | NOT PASS：同一 `EPERM: lstat C:\Users\10851` 启动环境问题。 |
| `node --test tests/voice-client.test.mjs` | PASS：9/9。 |
| `git diff --check` | PASS：仅提示工作区文件的 CRLF 转换，不是 whitespace error。 |
| ESLint direct check | NOT AVAILABLE：仓库没有 `eslint.config.js|mjs|cjs`，而 ESLint 9 已不接受旧 `--ignore-path` 参数。未执行自动修复。 |

## Git

- Branch：`themev1`
- HEAD before：`4f4dfb1519012260e46d6aedfde252aba912cb32`
- HEAD after：同一 commit；本轮未创建新 commit，修改保留在 working tree
- Working tree：2 个既有组件修改、1 个新增 Midnight 场景组件、1 个阶段报告

## Risks / Warnings

- 官方 npm scripts 仍受机器级 Node `EPERM` 限制，已用直接 Node/Vite 等价命令完成构建和测试，但不能把等价命令冒充 npm script 成功。
- 当前图片仍由既有 menu API / fallback 负责；本轮只改变承载方式，没有引入低质量占位图或伪生产数据。
- 本轮重点是视觉返工；AI 深层动效、FeaturedDishScreen、SushiNavigation、OrderHistoryDialog 仍留给阶段 3。

## Final Verdict

**PASS WITH WARNINGS**

视觉硬门槛已满足：午夜主题不再是几根线，菜品不再是矩形商品 Card，页面实际可识别为带建筑空间、实体轨道和餐盘托座的夜间寿司月台。警告仅来自当前机器的 npm/ESLint 环境限制，以及现有图片/API 管线不属于本轮改造范围。
