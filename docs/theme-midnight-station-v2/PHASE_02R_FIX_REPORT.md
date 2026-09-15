# Midnight Station Phase02-R 修复报告

## 基线

- branch：`themev2`
- HEAD before：`ecc9cd17f9b1105572384183f9da1020314c1ab9`
- HEAD after：`PENDING_COMMIT`（本轮未被要求创建提交；工作树仍基于上述 HEAD）
- Phase01 reviewed commit：`fcb7640030084c443dc2fd9cdd31efcb888fae37`
- 修复方式：保留 Phase01 文档与 Phase02 主舞台，不 reset、不改商品接口、不创建第二套滚动或事件系统。

本轮修改文件：

- `src/components/display/ScenicDishStage.vue`
- `src/components/display/midnight/MidnightExpressPass.vue`
- `src/views/display/ConveyorBeltDisplay.vue`
- `public/images/ui/midnight-station/background-v2-foreground.png`
- `public/images/ui/midnight-station/special-wheel.webp`
- `docs/theme-midnight-station-v2/PHASE_02R_FIX_REPORT.md`

## 问题 1：机械运动

### 轮组

`ScenicDishStage` 继续是唯一水平位移来源。新增 `advanceMidnightRunningGear(scrollDelta)`，直接消费自动移动、pointer drag、滚轮与惯性共同产生的真实 `scrollDelta`，将其换算为 `--midnight-wheel-angle`。没有给列车增加第二条水平 CSS animation。

- `scrollLeft` 增大、内容向左时，轮组逆时针转动；
- `scrollLeft` 减小、内容向右时，轮组顺时针转动；
- 普通自动移动、拖拽、滚轮和惯性使用同一换算；
- 一列车的 8 个轮组共享同一个机械相位，不会出现车速与轮速彼此独立。

运行实测：连续 260ms 的两个轮组 transform 采样不同；暂停后连续 260ms 的两个采样完全相同。向右运行实测 CSS 角度增量为正，与左向运行相反。

### 连杆

机车驱动轮上增加克制的金属连接横杆。横杆位置由同一轮组角度的 `cos/sin` 相位计算，水平行程约 3.2px、垂直行程约 2.1px；不是独立循环动画。200% 检查时结构仍清楚，没有白边或夸张卡通摆幅。

### pause / direction / reduced-motion

- pause：停止自动位移并清除残余惯性，因此轮组和连杆停止；用户主动拖拽仍可操作并会产生对应机械位移。
- direction：只镜像纯视觉车体与机械层，DOM 文字不镜像；右向实测机车位于列车前导端，轮角符号反向。
- reduced-motion：隐藏额外轮组/连杆/雾气/灯光装饰层，保留原始静态列车和业务所需的基本商品移动、拖拽与点击，不会保留错误的独立动画。

最终轮组资产：`special-wheel.webp`，511×512 RGBA WebP，约 303KB，被所有列车轮组复用。图片不含文字。

生成模式与最终提示词摘要：`precise-object-edit`；以现有 `special-express.webp` 为风格参考，生成单个旧钢制铁路驱动轮，匹配深绿旧漆、暖琥珀站灯与冷夜环境光，真实透明背景，无车体、轨道、阴影、文字或 Logo。候选连杆透明边缘不合格，未进入仓库最终资产。

## 问题 2：空间遮挡

新增与母背景同尺寸、同像素坐标的透明遮挡层：

- `background-v2.png`：继续作为完整后景环境；
- `background-v2-foreground.png`：3840×1080 RGBA PNG，约 1.43MB；
- 列车/托盘车：位于二者之间；
- DOM 控件与底部业务区：位于遮挡层之上。

前景层由 `background-v2.png` 的原始像素确定性提取，没有重新生成背景，也没有用 CSS 色块重画月台。包含左侧长凳前缘、关键立柱、行李设施、右侧关键立柱/设备、岗亭前沿和右下设施。透明层使用相同 `center/cover` 参数，真实页面对齐，无白边。

3840 实测把列车移动到 x≈574–2263 时，中左立柱对机车/餐车产生连续局部遮挡；列车其他部分仍位于背景轨道前，不是整体永远置顶或整体置底。遮挡层 `pointer-events:none`，不截获商品与控件交互。

## 问题 3：列车比例

第三主题 event 槽从 `clamp(1100px, 38vw, 1480px)` 调整为 `clamp(1320px, 44vw, 1700px)`，约占 4.6–4.7 个普通托盘车槽位。列车高度及负边距同步校准，保持轨道接触线而不是简单整体放大后漂移。

- 3840×1080：实测列车组件约 1690×430，y≈276–706；普通托盘车约 360×256。列车宽度约为普通车的 4.7 倍，一眼可识别为实体机车+餐车事件。
- 1920×1080：实测列车组件约 1320×330，y≈350–680；普通托盘车约 286×240。页面仍可操作，列车没有变成贴脸全屏广告。
- 轮组、连杆、车底与背景配送结构在 100%、150%、200% 检查中保持清楚；没有透明白边和明显放大糊边。

## 问题 4：单一机车

`MidnightExpressPass` 的一张主体资产包含且只包含：

1. 一台前导机车；
2. 一节餐车。

每个 `entry.kind === 'event'` 只实例化一个 `MidnightExpressPass`。真实 DOM 对可见事件实测：主体列车图片数量 1、轮组数量 8。三份 DOM event 来自 `ScenicDishStage` 原有三周期无缝循环副本，不会在同一可见列车中产生多个机车；当前视口仅有一个 event 可见，整列离场后才在下一周期回归。

## 问题 5：普通送餐与特殊事件

- 普通送餐：真实商品继续由 `MidnightDishTrolley` 承载；图片、名称、价格、推荐、选中和售罄状态继续来自现有商品 props/DOM。
- 特殊事件：`streamCycleItems` 的原 `entry.kind === 'event'` 插入链路实例化放大后的 `MidnightExpressPass`；未修改真实商品数组，未伪造 4–6 条商品。
- 事件语义：普通小型低位托盘车连续送餐，周期性大型夜间餐饮特快插入约 4–6 个普通槽位宽度后整列离场。
- featured promo：`MidnightExpressPass -> ScenicDishStage -> ConveyorBeltDisplay -> FeaturedDishScreen` 的既有 emit 链仍完整，且没有建立第二套 promo 系统。

### featured promo 数据说明

当前真实后端商品仍没有匹配 `promoContent.js` 唯一金枪鱼素材的商品，因此 `promoTriggerItem` 为 null，真实页面不会出现 promo 按钮。这不是 Midnight 事件链缺失；zhenxian/xiaoxin 使用同一匹配条件，也同样没有触发物。本轮没有把蛋糕或饮料错误映射为金枪鱼，也没有注入 mock。需要真实商品提供匹配项，或单独授权为现有真实商品制作对应 promo 内容后才能补齐“实际点击展开”的截图证据。

## 实际页面验证

截图证据来自真实运行页 `http://127.0.0.1:3000/display`，使用仓库自带本地后端真实商品数据；截图在本任务的浏览器验证记录中内联展示，未提交到 Git，避免仓库膨胀。

### 3840×1080

- 普通状态：小型铁路托盘车连续承载真实菜品，轨道接触稳定；
- 特殊状态：1690×430 的单机车+单餐车清晰可辨；
- 遮挡：列车经过关键立柱时被局部遮挡；
- pause：按钮切换为“继续”，轮组连续采样不再变化；
- direction：右向时仅车体与机械层改变朝向，商品 DOM 文字保持正常；
- 5 秒语义：环境为夜间铁路月台、普通菜品由小型轨道车运送、特殊事件为大型列车，四项均可直接识别。

### 1920×1080

- 普通托盘车 286×240，列车 1320×330；
- 分类、暂停和底部业务区仍可访问；
- 背景保持 cover 降级，列车未溢出舞台高度；
- 普通商品与特殊列车仍有明显体量差。

### 100% / 150% / 200%

- 100%：全局比例、轨道关系和前景遮挡通过；
- 150%：轮辐、轮缘、车底、连杆与商品边缘清楚；
- 200%：独立轮组无白边，车体材质未呈现明显塑料感，连杆可理解且不过度夸张。

## 业务回归

- 真实商品接口：PASS，本地后端返回现有分类和商品；未使用 mock。
- 分类：原分类 DOM 与筛选链未修改。
- click：真实 Midnight 商品点击事件仍由原 `handleSushiClick` 链接收；本轮组件只透传事件。
- drag：PASS，实际拖动列车从视口边缘移动到中央，运动与轮组相位同步。
- inertia：原惯性计算和循环归一化保留；仅在 pause 时清除不应继续存在的残余惯性。
- pause：PASS，机械采样稳定。
- direction：PASS，右向实测车头方向与轮角符号正确。
- speed：原 `normalizedSpeed` 与帧循环保留，机械层直接读取结果位移，因此随速度同比变化。
- featured promo：事件 emit 链 PASS；真实数据触发证据受上述内容映射缺口限制。
- theme switch：PASS，Midnight、zhenxian、xiaoxin 实际切换完成。

## 旧主题回归

### zhenxian

实际切换后：`theme=zhenxian`、boat event DOM=3（无缝循环副本）、turtle=0、Midnight trolley=0、Midnight express=0、Midnight foreground overlay=false。海滩背景、木筏普通菜品与小船特殊事件正常。

### xiaoxin

实际切换后：`theme=xiaoxin`、turtle event DOM=3（无缝循环副本）、boat=0、Midnight trolley=0、Midnight express=0、Midnight foreground overlay=false。海底背景、贝壳普通菜品与海龟特殊事件正常。

## 构建与检查

- `npm run build`：PASS，1798 modules transformed，Vite build 完成。
- 构建仅有仓库既有 Sass deprecation 和大 chunk warning；无本轮编译错误。
- `git diff --check`：PASS。
- 定向 ESLint：未执行成功；仓库当前 ESLint 9 缺少 `eslint.config.js`，属于现有工具配置问题。本轮未为此修改全局 lint 配置。

## 已知问题

1. 真实商品数据没有 promo 内容映射，因此无法产出“点击特殊列车打开招牌菜屏”的真实截图；事件链本身存在且与另两套主题共用。
2. 连接杆为轻量 CSS 机械覆盖层，主体列车仍完全来自 Phase02 栅格资产；这是为了保持清晰联动而避免重新用 CSS/SVG 拼整列火车。
3. 截图证据未写入仓库，只保留在本任务浏览器记录中。

## 结论

五个修复目标中的机械联动、局部遮挡、比例、单一机车和普通/特殊事件分工均已完成；构建与旧主题回归通过。featured promo 的代码链可用，但真实数据缺少可匹配内容，因此阶段状态为：

`READY_FOR_PHASE_03_WITH_NOTES`
