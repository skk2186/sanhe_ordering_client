# 午夜月台 V2 · 组件与资产映射

## 1. 分层原则

下一阶段必须保持四层结构，避免再次把所有内容画死在背景中。

1. **固定环境层**：`background-v2.png`，只含建筑、远景、地面、固定轨道和未点亮信号设施。
2. **动态世界层**：托盘车、特殊列车、车灯、蒸汽、微尘、轮组和反射。
3. **业务内容层**：真实菜图、菜名、价格、分类、购物车、数量、订单和 AI 状态。
4. **覆盖与弹窗层**：详细菜单、全局导航、招牌菜、设置、订单历史、主题转场。

固定环境不得包含未来需要移动、切换或翻译的内容。动态世界层不得持有商品和订单业务状态，只通过 props/emit 读取视觉状态。

## 2. 3840×1080 布局映射

| 页面区域 | 当前组件 | 当前职责 | V2 视觉映射 | 可改范围 | 不可改范围 |
| --- | --- | --- | --- | --- | --- |
| 整体背景 | `ConveyorBeltDisplay.vue` | 主题、数据和所有区域编排 | 使用 `background-v2.png` 作为固定环境层 | `SCENES`、预加载、主题类、背景定位 | 商品/订单/AI 业务链路 |
| 顶部品牌 | `ConveyorBeltDisplay.vue` 内 `brand-lockup` | 品牌、桌号、人数 | 顶棚下的站务铭牌区域；文字仍为 DOM | 字号、材质、布局 | i18n 和桌台数据 |
| 投碟进度 | `TopPlateProgress.vue` | 真实百分比和奖励进度 | 站务信号线路板 | 三层主题资产、灯段动画、尺寸 | `progress/formatted` 计算和 ARIA |
| AI 助手 | `VirtualDiningAssistant.vue` | 唤醒、录音、TTS、推荐和反馈 | 深夜站务员/餐饮服务员驻点；推荐卡像纸质餐票 | 外壳、角色底座、状态光、布局 | 语音状态机、事件和推荐数据 |
| 菜品主舞台 | `ScenicDishStage.vue` | 分类、横向循环、拖拽、惯性、暂停 | 背景配送轨道 + 独立托盘车 | 主题渲染分支、槽位宽度、视觉动画 | 商品数组、筛选、滚动物理和 emits |
| 周期事件 | `ScenicDishStage.vue` + 新视觉组件 | 插入特殊事件 | 大型夜间餐饮特快（机车 + 餐车） | 事件组件和素材、占槽数、视觉触发 | 周期插入与招牌菜事件接口 |
| 环境动效 | `AmbientSceneEffects.vue` / Canvas | 低频氛围 | 蒸汽、微尘、灯光扫过、远端雾气 | 事件库、Canvas 粒子 | 暂停和 reduced-motion |
| 招牌菜 | `FeaturedDishScreen.vue` | 视频/海报、自动收回 | 从顶棚降下的实体站内展示屏 | 外壳素材、吊挂方式、入退场 | 视频、poster、关闭和计时逻辑 |
| 左购物车 | `CartPanel.vue` | 4 槽、增减、删除、下单 | 左侧行李/餐票整理台 | 主题外壳、槽位托架、反馈动画 | cart props/emits、数量上限 |
| 中央功能台 | `CenterFunctionPanel.vue` | 菜单、导航、历史、设置、呼叫 | 实体站务服务台 | 背板、按钮材质、图标和布局 | 五类 emits |
| 右购物车 | `CartPanel.vue` | 同左侧 | 右侧行李/餐票整理台 | 同左侧 | 同左侧 |
| 详细菜单 | `MenuView.vue` | 分类分页、商品获取、加购 | 从站务台展开的菜单柜/灯箱 | 主题 class、外壳、卡片和分页外观 | API、分页、分类和 emits |
| 全局导航 | `SushiNavigation.vue` | 全屏浏览、过滤、拖拽、左右加购 | 站内陈列厅/候车大厅 | 背景、网格、分类标记、返回区 | 商品列表、拖拽、加购和双购物车 |
| 订单历史 | `OrderHistoryDialog.vue` | 已提交订单记录 | 票据档案柜 | 主题皮肤 | 记录数据与呼叫服务员 |
| 设置 | `SettingDialog.vue` | 主题、语言、语音、方向、速度 | 站务设置柜；第三主题预览 | 新主题项、主题皮肤 | 保存和事件逻辑 |
| 呼叫服务员 | `ConveyorBeltDisplay.vue` 内对话框 | 确认呼叫 | 站台服务铃/呼叫牌 | 图标、面板材质 | 确认/取消链路 |
| 主题转场 | `SceneTransitionOverlay.vue` | 遮罩并切换资产 | 近景列车掠过或站棚卷帘遮罩 | 第三主题专属动效和素材 | covering/covered/revealing 时序 |

## 3. 菜品输送实现方案

### 3.1 选定方案

采用“单件低位铁路托盘车”。每个菜品仍是一个 `tide-slot`，其内部从上到下分为：

- DOM 菜品图；
- DOM 菜名、价格、AI/售罄状态；
- 透明托盘车上壳；
- 独立轮组/连杆层；
- 低成本接触阴影与灯面。

托盘车与背景中已经画好的低位配送轨道对齐。商品平移仍只由现有 `scrollLeft` 流控制，不新建第二套动画坐标。

### 3.2 建议尺度

- 普通槽位：320–380px 宽；
- 商品主体：190–230px；
- 载具可见高度：210–270px；
- 间距：80–130px；
- 3840 屏幕同时可见约 8–10 件商品；
- 菜名建议 24–30px，价格 28–34px，分类/控制 20–24px；
- 最小点击区域不小于 48×48px。

### 3.3 交互映射

- 点击：继续根据屏幕左右半区加购；
- 拖拽与惯性：继续使用 `ScenicDishStage`；
- 暂停：列车/托盘车平移停止，轮动、蒸汽和接触光同步冻结；
- 方向：车体不镜像文字层；底盘或头尾灯可根据方向切换；
- 速度：平移速度使用现有值，轮动和蒸汽强度读取同一归一化速度；
- reduced-motion：不取消核心商品流，但停止蒸汽、灯扫、轮组细节和非必要抖动；
- 键盘：菜品继续可 focus + Enter，加购不依赖拖拽。

## 4. 周期特殊事件

### 4.1 结构

建议新增纯视觉组件 `MidnightExpressPass.vue`，内部组合：

- `special-locomotive.webp`；
- `special-dining-car.webp`；
- 可选 `special-service-car.webp`；
- 独立车灯/窗光层；
- Canvas 蒸汽与轮下轻尘；
- DOM 招牌菜触发按钮/无障碍名称。

### 4.2 尺度与行为

- 整体宽 1100–1600px，高 300–420px；
- 在流中占 4–6 个普通槽位；
- 只在“全部”分类中出现，沿用现有特殊事件插入逻辑；
- 经过时车体明显，但顶部仍能看到品牌/AI，底部购物车不被遮挡；
- 招牌菜触发区域应至少 88×88px，不能是小点；
- 列车经过期间不要禁止普通菜品点击；
- 动效结束不改变商品数组或进度。

## 5. 进度条方案

继续沿用 `TopPlateProgress.vue` 的结构：

- `progress-track-base.webp`：暗绿/黑蓝站务线路板，无文字；
- `progress-track-fill.webp`：琥珀色线路灯段；
- `progress-track-frame.webp`：旧金属/黄铜压边；
- `progress-count`：真实 DOM 百分比；
- 可新增 DOM 节点标记，不把编号画入图片；
- 100% 时使用绿色通行图形、轻微机械翻牌和 ARIA 状态，不使用爆闪。

## 6. 点餐台与购物车方案

### 中央站务台

- 使用一张 790×217 或 2×密度的透明/不透明外壳图建立真实材质；
- 五个功能继续由 DOM button 承担；
- 图标采用统一线性矢量家族，文字由 i18n；
- 左右“菜单”可以设计为站务台两侧翻开的实体活页夹；
- 呼叫服务员使用机械服务铃语义，不使用 emoji。

### 左右购物车

- 复用 827×217 的占位，制作同一套镜像兼容外壳；
- 四槽像低位行李架/托盘架；
- 空槽不使用过细虚线，保留明确的可点击占位；
- 数量控制为可触达的实体小按钮，不能被票据装饰吞没；
- 下单状态使用机械牌/通行灯 + DOM 文案；
- 加购飞行动画可以参考 `themev1` 的目标定位，但视觉副本应是缩小托盘车或餐票，不是 CSS 盘子。

## 7. 资产清单

### 已完成

| 资产 | 格式/尺寸 | 状态 | 用途 |
| --- | --- | --- | --- |
| `background-v2.png` | PNG 3840×1080 RGB | **ACCEPTED / 主方案** | 固定环境 |
| `background-v2-a.png` | PNG 3840×1080 RGB | 候选保留 | 构图对照，不用于正式实现 |
| `background-v2-b.png` | PNG 3840×1080 RGB | **ACCEPTED / 与主方案同图** | 生成过程留档 |

### 下一阶段需要制作

| 建议文件 | 推荐格式 | 是否透明 | 建议原始尺寸 | 实现方式 |
| --- | --- | --- | --- | --- |
| `delivery-trolley-shell.webp` | WebP | 是 | 1200×720 | 图片 |
| `delivery-trolley-wheels.webp` | WebP | 是 | 1200×720 | 图片 + CSS transform |
| `delivery-trolley-shadow.webp` | WebP | 是 | 1200×300 | 图片/可退化 CSS |
| `special-locomotive.webp` | WebP | 是 | 1800×900 | 图片 |
| `special-dining-car.webp` | WebP | 是 | 2000×900 | 图片 |
| `special-service-car.webp` | WebP | 是 | 1800×900 | 可选图片 |
| `train-window-light.webp` | WebP | 是 | 与车体同画布 | 图片 opacity 动画 |
| `cart-shell-left.webp` | WebP | 是或不透明 | 1654×434 | 图片 |
| `cart-shell-right.webp` | WebP | 是或不透明 | 1654×434 | 图片 |
| `cart-slot-left.webp` | WebP | 是 | 228×334 | 图片 |
| `cart-slot-right.webp` | WebP | 是 | 228×334 | 图片 |
| `service-console.webp` | WebP | 是或不透明 | 1580×434 | 图片 |
| `menu-folder-shell.webp` | WebP | 是 | 276×370 | 图片 |
| `progress-track-base.webp` | WebP | 是 | 1882×186 | 图片 |
| `progress-track-fill.webp` | WebP | 是 | 1502×100 | 图片 + clip |
| `progress-track-frame.webp` | WebP | 是 | 1870×160 | 图片 |
| `featured-board-shell.webp` | WebP | 是 | 1800×1000 | 图片 |
| `transition-train-silhouette.webp` | WebP | 是 | 2400×900 | 图片 |
| `signal-lens-red/amber/green.webp` | WebP | 是 | 128×128 | 图片或 CSS 简单灯面 |

### 适合 CSS / DOM

- 所有文字、百分比、价格、菜名、桌号、数量、状态和 i18n；
- 组件布局、裁切、focus、pressed、disabled、loading；
- 信号灯基础亮灭、低强度光池和金属阴影；
- 轮组旋转、车体轻微悬挂位移；
- 菜品选中/推荐状态；
- 票据 perforation 可用重复渐变，但只作为局部装饰。

### 适合 Canvas

- 蒸汽、微尘、轻雾、轮下细小火星/水雾；
- 根据真实移动速度改变粒子量；
- 必须在暂停、拖拽和 reduced-motion 时正确降级；
- 不用 Canvas 绘制整台列车、整座站台或文字。

## 8. 现有 Midnight 素材判定

| 现有文件 | 尺寸/特征 | 判定 | 原因 |
| --- | --- | --- | --- |
| `background.png` | 2172×724 RGB | **REJECTED** | 非 3840×1080；大量中文、路线、时刻、编号写死；高对比信息板占据 UI 区；不是纯环境资产 |
| `locomotive.png` | 1448×1086 RGBA | **REJECTED** | 车身写死中文；巨大蒸汽固定方向；产品渲染质感与最终背景不一致；比例/视点尚未与配送轨道校准 |
| `carriage.png` | 1448×1086 RGBA | **REJECTED** | 车体写死中文；寿司组合固定在图中，无法使用真实商品数据；右侧烟雾被画死；材质和用途更像海报道具 |

旧文件本阶段不删除，以便追溯；下一阶段不得引用它们。

## 9. 下一阶段组件修改顺序

1. `ConveyorBeltDisplay.vue`：仅接入第三主题 key、背景、预加载和主题 prop；
2. `SettingDialog.vue` + `SceneTransitionOverlay.vue`：先打通安全切换；
3. `ScenicDishStage.vue` + 新 `MidnightDishTrolley.vue`：接入普通托盘车，保持滚动物理不变；
4. 新 `MidnightExpressPass.vue`：实现大尺寸周期列车；
5. `TopPlateProgress.vue`：接入三层铁路进度资产；
6. `CartPanel.vue` + `CenterFunctionPanel.vue`：替换底部实体设施外壳；
7. `VirtualDiningAssistant.vue` + `FeaturedDishScreen.vue`：统一站务员和展示屏；
8. `MenuView.vue` + `SushiNavigation.vue` + `OrderHistoryDialog.vue` + `SettingDialog.vue`：统一覆盖层；
9. `AmbientSceneEffects.vue` / Canvas：最后补低频氛围；
10. 3840×1080、1920×1080 和 reduced-motion 回归验证。

## 10. 可实现性与性能约束

- 背景在目标分辨率下无需裁切；其他比例用 `background-size: cover` 时应设置主题专属 `background-position`。
- 3840×1080 RGB 背景解码约 11.9MiB，必须预加载并避免主题切换时重复解码。
- 普通托盘车应复用同一素材，不为每个商品生成独立图片。
- 特殊列车一次只保留一个可见实例；不可同时渲染三个高分辨率重复列车。
- 大型透明资产优先 WebP，保留 PNG 源稿；在高 DPR 屏幕验证边缘无白边。
- 大列表继续使用稳定 key；不要让背景或列车资产进入深层响应式对象。
- 视觉动画优先 transform/opacity，不动画 width/height，不在每帧读取全部布局。
- 拖拽不是唯一入口；分类、暂停、方向/速度和点击/键盘操作必须并存。
