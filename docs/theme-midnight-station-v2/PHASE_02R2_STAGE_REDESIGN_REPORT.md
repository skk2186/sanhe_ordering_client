# Midnight Station Phase02-R2 核心舞台结构修复报告

## 1. 基线

- branch：`themev2`
- HEAD before：`5789ebb4c3519ad7c0cec80a669df6ce5d813b24`
- Phase02-R 基线：`5789ebb4c3519ad7c0cec80a669df6ce5d813b24`（`fix: refine midnight station train motion and event layering`）
- HEAD after：`5789ebb4c3519ad7c0cec80a669df6ce5d813b24`（本轮未创建提交，修改保留在工作区）
- Phase01、Phase02、Phase02-R 文档与既有可用成果均保留；未执行 reset / restore / checkout，未修改 `master`，未引入 `themev1` 的 SVG/CSS 场景。

## 2. background-v2 点餐空间审计

### 2.1 中部活动带

实际 3840 页面中，`ScenicDishStage` 位于 `y=196~859`，高约 663px。v2 虽然有完整月台空间，但真正能同时容纳商品、车体和轨道接触的连续区域只有约 300px：上方受站棚、立柱和远景高对比结构影响，下方受月台设施、长凳、岗亭和功能区挤压。

### 2.2 造成拥挤的元素

- 左侧长凳、行李/站务设施及其相邻立柱共同占据商品进入区域。
- 中央多根立柱把横向配送路径切成若干短段，列车经过时遮挡频率过高。
- 右侧岗亭与设备箱过于靠近核心交互区，既抢视觉焦点，也压缩特殊列车完整出现的宽度。
- 长凳前缘、推车、栏杆和 Phase02-R 的大面积前景复贴使普通商品频繁被遮挡。

### 2.3 必需与非必需前景

空间识别真正需要的是边缘站棚、少量关键立柱、局部护栏/长凳、右侧一处站务建筑和月台边缘；中央密集柱、连续长凳、重复设备箱、大面积岗亭前沿属于装饰性信息，付出的交互空间成本高于场景收益。

### 2.4 轨道与视觉主角

v2 轨道高度能承载普通托盘车，但大型列车若按背景设施比例放大，会与商品和分类区争夺同一窄带。因此 v2 更容易让火车/建筑成为视觉主角，而不是菜品、菜名、价格和分类。它不适合继续通过增加 z-index 补丁解决。

### 2.5 v3 取舍

保留午夜、冷蓝夜景、暖黄站灯、湿地反射、旧铁路材质、山体/城镇、架空线和真实铁轨；削弱中央立柱、连续近景遮挡、岗亭体量和高对比设备，把站务设施推向左右边缘。

## 3. background-v3

### 3.1 状态与生成方式

已生成并正式接入：

- `public/images/ui/midnight-station/background-v3-rear.png`：3840×1080，固定后景。
- `public/images/ui/midnight-station/background-v3-foreground.png`：3840×1080 RGBA，像素级对齐的局部前景遮挡层。

使用 ImageGen 的参考图编辑模式，以 `background-v2.png` 为视觉基准。最终提示词模式为“precise object/layout edit”：保留既有午夜铁路世界、冷暖光与老旧材质，要求中央约 60% 成为低对比连续 delivery corridor，减少中央柱子、缩小并移开岗亭、保留边缘设施、禁止列车/商品/UI/文字/数字/Logo/水印/霓虹/赛博朋克。生成结果先无畸变居中裁为 32:9，再使用 Lanczos 输出精确 3840×1080。

新背景及全部新透明资产均经人工检查，不含中文、英文、数字、Logo、价格、菜名、站名、伪文字或水印。

### 3.2 与 v2 的主要区别

- 中央 60%~70% 不再被立柱或岗亭分割，横向配送路径连续。
- 单一低位轨道成为普通托盘车与特殊列车共用的明确接触基准。
- 顶部仍为暗夜低频区域，进度/AI 可覆盖；底部保持暗色湿地和低频纹理，购物车/功能台可覆盖。
- 候车设施只保留在左右边缘，不再每隔数个商品形成一次大遮挡。
- 画面仍能在 5 秒内识别为深夜铁路月台，但第一视觉落点回到菜品。

## 4. Delivery corridor

3840 实测主舞台为 `3804×663`（`x=18, y=196`）。普通托盘车位于约 `y=437~703`，背景轨道与车轮接触集中于 `y≈665~704`。从菜品顶部到轨道/阴影形成约 360px 的连续有效带，约占舞台高度 55%；中央无高对比前景切割。分类工具条位于 `y≈782`，与配送层有明确间隔。

1920 实测主舞台为 `1884×714`，普通托盘车一次可见约 5 辆；分类 8 项仍完整可操作。

## 5. 前景遮挡重构

### 5.1 减少的元素

- 移除中央密集立柱的前景复贴。
- 移除跨越配送走廊的连续长凳/推车遮挡。
- 移除大面积岗亭前沿和重复设备箱。
- 中央约 88% 横向范围的 foreground alpha 为空，不做整屏复制。

### 5.2 保留的元素

- 最左侧站棚边缘、关键立柱、护栏和长凳局部。
- 最右侧站棚边缘、关键立柱、缩小后的站务建筑/设备局部。

渲染顺序为 `background-v3-rear -> 普通托盘车/特殊列车 -> background-v3-foreground -> DOM/UI`。实际页面中列车在左右边缘经过关键柱/岗亭时被局部遮挡，中央通过时保持完整；普通托盘车不会被连续遮挡。透明边缘与后景同尺寸同像素坐标，无重复柱、白边或错位。

## 6. 机车机械系统重构

### 6.1 资产与分层

放弃“完整火车图上外贴轮子”的 Phase02-R 结构，改为：

1. `shadow`：接触阴影；
2. `running gear`：后置独立车轮与连杆；
3. `special-express-body-v2.webp`：机车 + 一节餐车的无轮车体；
4. `special-express-lower-mask.webp`：重复覆盖下车架/裙边，应被遮挡的轮缘和连杆确实位于其后；
5. 车灯、车窗暖光、少量雾气；
6. DOM 招牌菜交互位。

最终资产：

- `special-express-body-v2.webp`：2172×426 RGBA，原生高分辨率车体，不依靠 1.7/2 倍 CSS 硬拉伸。
- `special-express-lower-mask.webp`：2172×426 RGBA，车体下沿遮挡层。
- `special-wheel.webp`：复用既有独立轮组图。
- `special-driving-rod.webp`：720×54 RGBA 独立连杆图。

### 6.2 轮组

一列包含 8 个独立轮组：机车 4 个驱动轮、餐车 4 个 bogie 轮。实际页面 DOM 检查为 `body=1, wheels=8, carriageWheels=4, rod=1`。轮组位于车体/裙边之后，不再贴在车体表面；餐车不再是静态纸片。

### 6.3 位移驱动角度

继续使用 `ScenicDishStage` 唯一 `requestAnimationFrame` 和唯一 `scrollLeft` 主运动源。每帧已有的 `scrollDelta` 同时驱动所有 Midnight 轮组：

`angle += -(scrollDelta / renderedWheelRadius) × 180 / π`

机车和餐车共享 `--midnight-express-wheel-angle`，普通托盘车共享 `--midnight-trolley-wheel-angle`；没有为每个轮子创建独立 RAF，也没有每帧读取每个轮子的布局。

### 6.4 连杆联动

驱动杆与机车轮角共享同一相位：

- `rodX = cos(angle) × 5.2px`
- `rodY = sin(angle) × 5.2px`

形成克制的偏心销前后/上下往复。实际采样中轮变换从 `matrix(0.998..., -0.054...)` 变化到 `matrix(0.585..., -0.810...)` 时，杆同步从 `(5.19, 0.29)` 变化到 `(3.05, 4.22)`。

### 6.5 pause / direction / speed / reduced-motion

- pause：350ms 两次采样的 `scrollLeft`、机车轮、连杆、托盘轮变换完全一致，全部停止。
- direction：切换方向后 stage 的 `is-reversed` 状态、位移符号和轮组旋转方向共同反转；仅镜像纯车体/机械层，商品文字与价格不镜像。
- speed：400ms 实测，速度 0.2 时位移约 8px，速度 3 时位移约 143.33px，轮速由同一 `scrollDelta` 自动同步。正式设置已恢复为 1，方向恢复为用户原值 `right`。
- reduced-motion：关闭雾气、车窗呼吸和非必要悬挂，机械层保留静态正确结构；基本商品移动、拖拽、点击和业务状态仍可用。

## 7. 普通送餐

`MidnightDishTrolley` 是页面常态：一个真实商品对应一辆小型低位铁路托盘车，多个连续出现。组件不请求 API、不复制购物车、不维护第二套滚动系统；图片、名称、价格、AI、selected、sold-out 和 click 全部沿用真实商品 DOM/现有事件。

资产 `delivery-trolley-body-v2.webp` 为 1619×333 RGBA 无轮车体；两个后置独立小轮使用同一位移角度，车体下沿遮挡轮上缘并带独立接触阴影。3840 实测单车约 360×266，一次可见 8~9 辆；1920 一次可见约 5 辆。普通托盘车显著小于 3840 下 1536×359、1920 下 1220×310 的特殊列车。

## 8. 特殊列车事件

`MidnightExpressPass` 只由 `entry.kind === 'event'` 的原事件槽渲染，不是常驻广告层，也不替代普通商品。

- 结构：1 个 locomotive + 1 个 dining car；车体资产和组件结构上都只有一个机车。
- 3840 event slot：`clamp(1220px, 40vw, 1540px)`，实测约 1536×359。
- 1920：实测约 1220×310，不占满 714px 舞台高度。
- 频率：Midnight cycle 扩为约 22 个普通商品实例后插入一个事件，随机偏移 8~13；只扩视觉循环，不修改真实商品数组。三份 DOM 是无缝滚动的三周期副本，不代表一列中重复机车。
- 进入/离开：跟随原 `scrollLeft` 流完整进入、完整离场，之后继续普通托盘车。
- featured promo：优先既有精确活动匹配；Midnight 无专属视频时使用销量最高的真实可售 API 商品图片作为 DOM 海报，实际点击已显示“小蛋糕”招牌菜大屏。`zhenxian`/`xiaoxin` 仍保持原精确匹配策略。

## 9. 独立机械测试页

新增 `docs/theme-midnight-station-v2/preview/train-mechanics-preview.html`，仅供开发态隔离检查，不进入生产路由。可查看机车、餐车、车轮、连杆、lower mask、正向、反向、pause 和速度联动，使用同一 distance/radius 计算规则。

## 10. 真实页面验证

### 10.1 3840×1080

- 整体：PASS。v3 中央连续、背景不抢商品，5 秒可识别午夜铁路月台。
- 普通送餐：PASS。实测 66 个托盘车 DOM（22 个视觉周期条目 × 3 个无缝周期），可见 8~9 辆，商品/菜名/价格为主角。
- 轨道接触：PASS。托盘轮与背景单轨接触稳定，无漂浮或埋轨。
- 特殊列车：PASS。真实页面观察到单机车 + 单餐车完整通过，明显大于托盘车但未占满舞台。
- 机械：PASS。8 轮均随位移变化，连杆同相位往复；暂停、方向与速度采样通过。
- 遮挡：PASS。边缘柱/岗亭在列车前，中央无遮挡；不存在整列永远置顶或永远置底。
- featured promo：PASS。列车餐车交互位成功打开真实商品“小蛋糕”的招牌海报。
- drag / inertia：PASS。实际拖拽后继续产生惯性位移；主运动仍是原 `scrollLeft`。
- 分类与暂停：PASS。8 个真实分类可见；暂停后业务与机械状态一致。

### 10.2 1920×1080

- PASS。主舞台 `1884×714`；5 辆普通托盘车可见；特殊列车 `1220×310`，可完整通过且不遮满屏；8 个分类保持可用；v3 foreground 正确加载。
- 降级表现：顶部与底部仍使用现有组件，本轮未全面改造；主舞台和配送语义未崩坏。

### 10.3 100% / 150% / 200% 检查

- 100%：真实页面完整检查通过。
- 150% / 200%：对车体、轮组、连杆、lower mask、托盘、foreground alpha 边缘进行原生像素局部放大检查；未发现白边、重影、穿模、悬浮或明显模糊。浏览器自动化的固定 viewport 会保持 CSS viewport 数值，因此放大证据采用原生像素裁切/资产原图检查，而非改变业务 CSS。
- 截图证据保留于本次 Codex 任务的实际 in-app browser 运行记录中，未提交 Git，避免仓库膨胀。包含 3840 普通态、特殊列车、边缘遮挡、pause、方向、featured promo、1920、zhenxian、xiaoxin；机械运动另有数值采样和隔离预览页。

## 11. 旧主题回归

### zhenxian

- PASS。实际切换后 `theme=zhenxian`、stage=`is-beach-theme`、Midnight 组件数为 0。
- `queue-boat-event` 三周期副本存在，木筏菜品、背景、分类、拖拽和暂停未被 Midnight 样式污染。

### xiaoxin

- PASS。实际切换后 `theme=xiaoxin`、stage=`is-underwater-theme`、Midnight 组件数为 0、`queue-turtle-event=3`。
- 海龟、贝壳菜品、背景、分类、拖拽和暂停正常。

回归后已恢复 `midnight-station`。所有新选择器均限定在 Midnight 专属组件或 `is-midnight-theme`/`data-theme='midnight-station'` 范围。

## 12. 构建与测试

- `git diff --check`：PASS（仅 Git 的 LF/CRLF 提示，无空白错误）。
- `npm run build`：PASS；Vite 6.3.5，1801 modules，约 18.07s。仅有仓库既有 Sass deprecation 与 chunk-size warning。
- `npm run test:assistant`：PASS；26/26 tests。

## 13. 本轮修改文件

### 代码

- `src/components/display/FeaturedDishScreen.vue`
- `src/components/display/ScenicDishStage.vue`
- `src/components/display/SettingDialog.vue`
- `src/components/display/midnight/MidnightDishTrolley.vue`
- `src/components/display/midnight/MidnightExpressPass.vue`
- `src/config/promoContent.js`
- `src/styles/conveyor-belt.scss`
- `src/views/display/ConveyorBeltDisplay.vue`

### 文档 / 预览

- `docs/theme-midnight-station-v2/preview/train-mechanics-preview.html`
- `docs/theme-midnight-station-v2/PHASE_02R2_STAGE_REDESIGN_REPORT.md`

### 新增视觉资产

- `public/images/ui/midnight-station/background-v3-rear.png`
- `public/images/ui/midnight-station/background-v3-foreground.png`
- `public/images/ui/midnight-station/delivery-trolley-body-v2.webp`
- `public/images/ui/midnight-station/special-express-body-v2.webp`
- `public/images/ui/midnight-station/special-express-lower-mask.webp`
- `public/images/ui/midnight-station/special-driving-rod.webp`

## 14. 已知问题

1. 实际后端数据中商品 `33333` 的商品图片为空，组件按既有 fallback 逻辑显示深色占位；这是数据质量问题，本轮未注入 mock 或修改接口。
2. 150%/200% 证据以原生像素裁切与透明资产原图检查完成，固定 viewport 自动化没有可靠改变浏览器 zoom；因此最终状态保留 notes，而不把该验证方式描述成浏览器缩放。
3. 新前景 PNG 约 5.3MB，透明范围虽已限制在两侧，但后续可在不损失边缘质量的前提下评估 WebP/AVIF；本轮优先保证像素级对齐和无白边。

## 15. 最终状态

`READY_FOR_PHASE_03_WITH_NOTES`

Phase02-R2 的三个核心结构已修通：background-v3 为点餐让出空间、普通托盘车成为常态、特殊列车恢复为低频事件；机车/餐车轮组、连杆、裙边遮挡、方向、速度和暂停均使用同一位移状态。未进入 Phase03。
