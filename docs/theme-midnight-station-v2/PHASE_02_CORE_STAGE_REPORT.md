# Midnight Station V2 · Phase02 Core Stage Report

## 1. 基线

- branch：`themev2`
- HEAD before：`79d0bb9815ab47ee7c567adf96047eb5fe617279`
- HEAD after：`PENDING_COMMIT`
- Phase01 reviewed commit：`fcb7640030084c443dc2fd9cdd31efcb888fae37`
- Phase01 provenance 修正提交：`79d0bb9815ab47ee7c567adf96047eb5fe617279`
- 本阶段没有切换到 `themev1`，没有修改 `master`，没有 reset / restore Phase01 产物。
- `public/images/ui/midnight-station/background-v2.png` 保持原文件，未重新生成或修改。

### 实际修改文件

- `src/views/display/ConveyorBeltDisplay.vue`
- `src/components/display/ScenicDishStage.vue`
- `src/components/display/SettingDialog.vue`
- `src/components/display/AmbientSceneEffects.vue`
- `src/components/display/SceneTransitionOverlay.vue`
- `src/styles/conveyor-belt.scss`
- `src/components/display/midnight/MidnightDishTrolley.vue`（新增）
- `src/components/display/midnight/MidnightExpressPass.vue`（新增）
- `public/images/ui/midnight-station/delivery-trolley.webp`（新增）
- `public/images/ui/midnight-station/special-express.webp`（新增）
- `docs/theme-midnight-station-v2/PHASE_02_CORE_STAGE_REPORT.md`（新增）

未修改 `CartPanel`、`CenterFunctionPanel`、`VirtualDiningAssistant`、`MenuView`、`SushiNavigation`、`OrderHistoryDialog`、`FeaturedDishScreen`、后端接口、商品数据、购物车业务逻辑或 Phase01 文档。

## 2. 主题注册

- Midnight key：`midnight-station`
- 固定背景：`/images/ui/midnight-station/background-v2.png`
- 预加载资产：母背景、`delivery-trolley.webp`、`special-express.webp`
- 设置入口：`SettingDialog.vue` 的主题设置页新增“午夜月台”选项，预览图直接使用 `background-v2.png`。
- localStorage：继续使用原有 `selectedThemeKey`，没有新增第二套持久化机制。
- 刷新恢复：在真实页面选择 Midnight 后执行 reload，页面恢复 `data-theme="midnight-station"`，背景与 33 个真实商品托盘车、3 个循环事件实例均重新挂载。
- 进入 / 退出：在真实设置页完成 `midnight-station → xiaoxin → zhenxian → midnight-station` 双向切换，转场结束后主题 DOM 和背景均正确替换。
- 已拒绝素材：正式代码未引用 `background.png`、`locomotive.png`、`carriage.png`。它们只继续作为 Phase01 审计记录存在。

## 3. 四层结构落实

1. 固定环境层：只使用 `background-v2.png`；没有 CSS / SVG 重画夜空、月台、建筑或轨道。
2. 动态世界层：共享托盘车、共享特殊列车、轻雾、微尘、车窗暖光；增强效果均可独立关闭。
3. 业务内容层：商品图、菜名、价格、AI、selected、售罄状态继续由 Vue DOM 和真实商品数据承担。
4. 覆盖 / 弹窗层：继续使用既有购物车、设置、招牌菜展示和转场层级，没有重写业务架构。

## 4. 普通铁路托盘车

### 最终资产

| 资产 | 尺寸 | 格式 | 透明 | 图片文字 |
| --- | ---: | --- | --- | --- |
| `delivery-trolley.webp` | 1619×439 | lossless WebP | RGBA | 无 |

最终采用一个统一透明资产，不拆 shell / wheels / shadow：车架、轮组、联轴结构共享同一透视和接触线，拆成多张生成资产会带来轮距与边缘错位风险；运行时阴影由轻量 `drop-shadow` 提供，所有商品复用同一文件，不为单品生成独立大图。

### 视觉与轨道接触

- 低矮旧金属底盘、实体轮组、深绿黑蓝旧漆、黄铜 / 琥珀细节与母背景的冷夜光、暖站灯一致。
- 真实页面校准后，Midnight 槽位统一使用 `--midnight-rail-drop: clamp(230px, 24vh, 266px)`；3840 下托盘车底盘接触线约 `y=715`，大型列车约 `y=702`，都落在母背景同一条连续低位配送轨道上。
- 没有新增 CSS 轨道，也没有用水平 transform 补偿错误素材。

### DOM 商品数据映射

- `MidnightDishTrolley.vue` 只接收现有 `item`、direction、recommended、selected、soldOut、paused。
- 图片、名称、价格来自现有商品对象；图片失败继续走项目既有默认图策略。
- 点击 / Enter 只上抛既有 `dish-click`；组件不请求 API、不管理购物车、不复制商品数组。
- 实测点击真实“饮料”后左购物车从 `0/4` 变为 `1/4`，随后删除恢复 `0/4`。

### 方向、pause、speed、reduced-motion

- 主水平运动仍唯一来自 `ScenicDishStage` 的 `scrollLeft` 帧循环。
- 方向切换时只镜像纯图片列车；托盘车 DOM 文字不镜像，仅将车灯从左端切到右端。实测列车图像矩阵为 `scaleX(-1)`，商品文字矩阵仍为正常方向。
- pause 实测按钮从“暂停”变为“继续”，舞台 `is-paused=true`，托盘悬挂、列车雾气和窗光动画均为 `animation-play-state: paused`。
- speed 继续使用既有滑块；实测从 `1.0` 调至 `1.2` 后恢复 `1.0`。
- `prefers-reduced-motion: reduce`：关闭托盘悬挂、列车雾气、窗光、转场列车长动画和环境粒子；不关闭 `scrollLeft` 基本商品流、拖拽、点击和状态变化。

## 5. 大型周期特殊列车

### 最终资产

| 资产 | 原始尺寸 | 3840 实际槽宽 / 高 | 1920 实际槽宽 / 高 | 图片文字 |
| --- | ---: | ---: | ---: | --- |
| `special-express.webp` | 2172×481 RGBA | 约 1459×365 | 1100×280 | 无 |

机车与一节餐车采用统一透明 WebP：这样可以锁定连接器、轮组基线和窗光方向；动态薄雾、车窗呼吸光、DOM 招牌菜触发位没有烘焙进图片。

### 事件接入

- 继续使用 `streamCycleItems` 的 `entry.kind === 'event'`，没有增加第二套列表或 Promo 系统。
- Midnight 事件槽宽 `clamp(1100px, 38vw, 1480px)`，约占 4–6 个普通菜品的视觉宽度，不伪造商品数据。
- 进入、经过和退出仍由既有商品流滚动位置控制；列车没有独立水平 CSS animation。
- 正常托盘车仍是主流；大型列车周期性占据一个扩展 event slot，事件前后商品流连续。
- `MidnightExpressPass.vue` 在 `promoItem && promoContent` 时显示餐车 DOM 触发位，并沿既有 `featured-promo` emit 链上抛。

### featured promo 实测状态

代码链路已经接通，但当前真实后端商品列表没有 `promoContent.js` 唯一支持的金枪鱼 / tuna 商品，因此 `promoTriggerItem === null`，实际页面不会生成招牌菜触发按钮。没有为了截图注入 mock 商品，也没有把现有蛋糕、饮料错误映射到金枪鱼宣传素材。

这使“特殊列车招牌菜可触发状态的真实页面证据”无法完成，是本阶段最终 `BLOCKED` 的唯一核心阻塞项。解除方式应由真实商品数据提供匹配商品，或由后续明确授权的内容工作为真实现有商品制作对应 promo 素材并扩展 `PROMO_CONTENT`；不得用假数据绕过。

## 6. 3840×1080 审查

真实页面使用 Codex in-app browser，明确设置并读取：`innerWidth=3840`、`innerHeight=1080`、`devicePixelRatio≈1`。

| 检查项 | 结果 |
| --- | --- |
| 整体 | PASS：无标题 5 秒观察可判断深夜铁路月台；顶棚、站灯、铁柱、架空线、多组轨道、湿地和候车设施共同建立场景。 |
| 普通托盘车 | PASS：同屏为真实商品 DOM，轮组、联轴器和旧金属底盘可识别，不像盘子加轮子。 |
| 菜品 | PASS：图片为视觉焦点；菜名 / 价格为 DOM；售罄状态可见。当前后端商品 `33333` 的图片内容为空是数据质量问题，不是主题烘焙图。 |
| 文字 | PASS：3840 下菜名约 26px、价格约 31px、分类最高 24px、pause 52×52；没有镜像文字。 |
| 轨道接触 | PASS：校准后普通车底盘底边约 y=715、特殊列车约 y=702，压在背景同一配送轨道上，无明显漂浮或埋入。 |
| 特殊列车 | PASS：实际宽约 1459px、高约 365px，一眼可识别机车 + 餐车，远大于 V1 小节点。 |
| 背景协调 | PASS：动态资产使用同一冷蓝环境光、暖琥珀站灯、旧绿漆和湿夜金属反射。 |
| 100% | PASS：整页构图中 UI 主舞台仍可读，背景主体没有被 CSS 场景覆盖。 |
| 150% 局部 | PASS：托盘车轮组、联轴器、车体边缘、餐车窗和轨道接触清楚，无白边。 |
| 200% 局部 | PASS：金属结构仍可理解，无明显塑料模型感；透明轮廓没有白色毛边。 |
| 招牌菜触发 | BLOCKED：真实数据没有匹配 promo 的商品，按钮没有生成。 |

## 7. 1920×1080 审查

- 明确读取 `innerWidth=1920`、`innerHeight=1080`。
- 普通槽宽约 286px，同屏约 5–6 辆托盘车；底盘接触线约 `y=680`。
- 特殊列车使用 1100×280 视觉框，仍明显但不覆盖整个页面；分类栏底边约 `y=888`。
- 商品、轨道和分类 / pause 控件仍可操作；没有横向页面溢出。
- 1920 下视觉密度高于 3840，但没有出现文字镜像、列车裁成小图标或轨道错位。

## 8. 真实截图证据

保存位置：**当前 Codex 任务的 in-app browser 内联截图证据（未写入 Git，避免仓库膨胀）**。测试视口由浏览器能力直接设置，报告同时记录 DOM 几何读数，避免仅凭缩略图判断。

| 证据 | 视口 / 局部 | 状态 |
| --- | --- | --- |
| Midnight 正常主页 | 3840×1080 | PASS |
| 普通托盘车与轨道 | 1920×1080 + 下半区裁切 | PASS |
| 大型特殊列车经过 | 3840×1080 | PASS |
| 特殊列车招牌菜触发 | 3840×1080 | BLOCKED：真实数据无 tuna 映射 |
| 暂停状态 | 3840×1080 | PASS |
| zhenxian 回归 | 3840×1080 | PASS |
| xiaoxin 回归 | 3840×1080 | PASS |
| 150% / 200% 托盘车细节 | 640×360 / 480×270 局部裁切 | PASS |
| 150% / 200% 特殊列车细节 | 640×360 / 480×270 局部裁切 | PASS |
| 1920 降级 | 1920×1080 | PASS |

## 9. 旧主题回归

### zhenxian

- PASS：真实设置页切换完成，海滩背景、木筏托盘和既有 `Featured video` 事件槽继续出现。
- PASS：Midnight 托盘车和列车 DOM 数量为 0，分类和商品数据正常。
- PASS：未修改 zhenxian 背景、船素材、商品渲染样式或滚动物理。

### xiaoxin

- PASS：海底背景、贝壳托盘和大型海龟事件继续显示。
- PASS：Midnight 托盘车和列车不出现，商品图片、价格、售罄状态正常。
- PASS：未修改 xiaoxin 背景、海龟素材、商品渲染样式或滚动物理。

Midnight 样式全部限制在 `.is-midnight-theme`、`.theme-midnight-station` 或 `[data-theme="midnight-station"]`，没有使用污染旧主题的裸全局覆盖。

## 10. 业务回归

| 项目 | 结果 | 证据 |
| --- | --- | --- |
| 商品接口 | PASS | 页面读取 11 个真实商品，三段循环共 33 个 Midnight 商品 DOM；未注入 mock。 |
| 分类 | PASS | 点击“招牌热卖”后实际内容缩减为火龙果 / 红豆嘟嘟，再恢复“全部”。 |
| click / 加购 | PASS | 点击真实饮料后左购物车 `0/4 → 1/4`，删除后恢复。 |
| drag | PASS | CUA 实际拖拽后 `scrollLeft` 变化约 600px。 |
| inertia | CODE-PASS / AUTOMATION-LIMITED | 惯性实现代码未改；CUA 的慢速合成拖拽没有产生可测甩动初速度，无法作为手势惯性证据。 |
| wheel | PASS（复用） | 仍绑定原 `handleStreamWheel`，Midnight 未创建替代滚动层。 |
| pause | PASS | 按钮状态和装饰动画冻结状态均实测。 |
| direction | PASS | 向右模式实测；纯列车图反向，商品 DOM 文字保持正常。 |
| speed | PASS | 既有滑块 1.0 → 1.2 → 1.0 实测。 |
| AI / selected / sold-out | PASS（映射） | 对应 props 直接来自 ScenicDishStage；售罄真实可见，AI / selected 不创建副本状态。 |
| featured promo | BLOCKED | 事件 emit 链已接入；当前真实商品无 promo 映射，无法生成触发位。 |
| 主题持久化 | PASS | Midnight 选择后 reload 仍恢复正确背景和组件。 |

## 11. 性能与实现边界

- 每个商品复用同一个约 491KiB 的托盘车 WebP；特殊事件复用同一个约 904KiB 的列车 WebP。
- 没有增加每商品 4K 资产、Canvas 主滚动系统或第二个 requestAnimationFrame 水平动画。
- Midnight 分支只改变槽位视觉和事件组件，继续尊重 `ScenicDishStage` 的循环宽度缓存、ResizeObserver、滚动归一化和帧循环。
- 新装饰动画只改变 transform / opacity；reduced-motion 下关闭。
- 没有大规模修改业务组件，没有改正式接口或商品数组。

## 12. 构建与静态检查

- `git diff --check`：PASS；只有 Git 的 LF→CRLF 工作区提示，无空白错误。
- `npm run build`：PASS；Vite 6.3.5，1797 modules transformed，`✓ built in 19.42s`。
- 构建警告：仓库既有 Sass `darken()` / slash division 弃用警告，以及既有大 chunk 警告；均不由本阶段引入。
- 定向 ESLint：未能执行。仓库安装 ESLint 9.34，但没有 ESLint 9 要求的 `eslint.config.js/mjs/cjs`；没有为通过检查而修改 lint 配置。
- 仓库没有针对 `ScenicDishStage` / 主题渲染的现有自动化测试脚本；未运行与本阶段无关的 assistant / voice 测试。

## 13. 已知问题与 blocker

1. **核心 blocker**：真实商品列表没有 `PROMO_CONTENT` 当前唯一支持的金枪鱼 / tuna，导致 `promoTriggerItem` 为空，无法在真实 Midnight 列车上产生招牌菜触发按钮与截图，也无法完成 Phase02 验收条件 17。
2. CUA 拖拽可以验证 scrollLeft 和拖拽链，但其合成手势持续时间较长，未产生可测的快速 flick 惯性；惯性源代码和尺寸缓存没有被本阶段修改。
3. 真实商品 `33333` / 个别商品图片本身为空或内容质量低；正式代码继续按真实接口渲染，没有写死替代数据。
4. Phase03 范围的购物车、中央控制台、AI、菜单和弹窗外观尚未 Midnight 化，符合本阶段边界。

## 14. 最终状态

`BLOCKED`

核心舞台、主题注册、普通托盘车、大型特殊列车、真实商品链、3840 / 1920 校准、旧主题回归与构建均已完成；但当前真实数据无法满足“featured promo 能在实际特殊列车上触发”的强制验收条件。未用 mock 或错误内容映射硬凑通过。
