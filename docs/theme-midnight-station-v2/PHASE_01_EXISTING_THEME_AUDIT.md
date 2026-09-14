# 午夜月台 V2 · 现有主题与系统约束审计

## 1. 审计范围与基线

- 仓库：`skk2186/sanhe_ordering_client`
- 工作分支：`themev2`
- 本轮只读参考：`master`、`themev1`
- master baseline：`b1a90285f904c505b9f293ebfa858cee18e8da75`
- themev1 audit target：`1fc5e9ce7465ba06d851dd89f6cfa3c24e4aef1c`
- Phase01 implementation base / pre-report HEAD：`a9331f281ee8752c70b4ccf6665aa678dc91c237`
- Phase01 reviewed commit：`fcb7640030084c443dc2fd9cdd31efcb888fae37`

实际阅读了下列组件的模板、脚本、样式和资源引用，而不是只检查文件名：

- `src/views/display/ConveyorBeltDisplay.vue`
- `src/components/display/ScenicDishStage.vue`
- `src/components/display/CartPanel.vue`
- `src/components/display/CenterFunctionPanel.vue`
- `src/components/display/TopPlateProgress.vue`
- `src/components/display/VirtualDiningAssistant.vue`
- `src/components/display/FeaturedDishScreen.vue`
- `src/components/display/SceneTransitionOverlay.vue`
- `src/components/display/SettingDialog.vue`
- `src/components/display/AmbientSceneEffects.vue`
- `src/components/display/BeachBoatPass.vue`
- `src/components/display/SeaTurtlePass.vue`
- `src/components/display/StageSplashLayer.vue`
- `src/components/menu/SushiNavigation.vue`
- `src/views/customer/MenuView.vue`
- `src/composables/useCart.js`
- `src/composables/useOrderProgress.js`
- `src/api/menu.js`
- `src/api/order.js`
- `src/styles/conveyor-belt.scss`
- `public/images/ui/b/`
- `public/images/ui/c/`
- `public/images/ui/midnight-station/`

## 2. 正式主题 `zhenxian` 的设计方法

### 2.1 背景如何建立场景

`public/images/ui/b/background.png` 是一张原生 3840×1080 的完整海滩/浅水环境图。沙滩人物与设施集中在上部，中央和下部保留连续水面。它并不是“蓝色渐变背景”，而是预先解决了海岸线、天空、水面、角色、岸上活动和远近层次的完整世界。

页面通过 `ConveyorBeltDisplay.vue` 的 `SCENES.zhenxian.background` 注册背景，同时预加载背景、进度条、托盘、特殊事件和转场素材。`src/styles/conveyor-belt.scss` 只负责把背景铺满页面，不重新用 DOM 绘制海滩。

### 2.2 背景与菜品输送如何关联

`ScenicDishStage.vue` 把真实商品放进可循环横向流。菜品不是悬浮在普通卡片上，而是放在 `shallow-drift-raft.png` 浅水漂流托盘上；菜品位置还有起伏和轻微倾角，运动原因自然解释为水面漂流。

拖拽、滚轮、惯性、方向和速度全部仍由同一条真实滚动流控制。视觉载具只改变“为什么移动”，没有改变商品接口和点击链路。

### 2.3 背景与特殊事件如何关联

周期事件使用独立 `BeachBoatPass.vue`。小船素材进入和普通菜品相同的循环流，但占据约两个普通槽位，因此具有明显体量。`StageSplashLayer.vue` 从船体真实显示框计算吃水线，再把速度和方向传给 Canvas 粒子引擎生成浪花。

主题切换时，`SceneTransitionOverlay.vue` 使用主题专属拼贴素材；招牌菜通过 `FeaturedDishScreen.vue` 在舞台内部垂下。特殊事件、环境和转场使用同一套海滩语言。

### 2.4 组件世界观

- `CartPanel.vue` 使用 `cart_bg.png`、`diezi1.png`、`diezi2.png`、`order_meal.png`、`out_meal.png`。
- `CenterFunctionPanel.vue` 使用 `cart_bg2.png` 和菜单、导航、历史、设置、呼叫按钮贴图。
- `TopPlateProgress.vue` 叠放 `bar.png`、`bar1.png`、`bar2.png`，CSS 只裁切填充宽度，百分比由 DOM 渲染。
- 菜品载具和特殊事件使用透明 PNG；水花与细微波纹使用 Canvas/CSS。
- 菜单、购物车和按钮的轮廓、色彩和插画来自同一资源系列，因此即使细节不高，也不容易脱离海滩世界。

## 3. 正式主题 `xiaoxin` 的设计方法

### 3.1 背景如何建立场景

`public/images/ui/c/background.png` 同样是 3840×1080，采用上下连续的海面/水下空间。岛屿、划船和岸边活动位于上部，中央与下部是水下空间、鱼影和珊瑚。背景一次性统一了水色、纹理、插画比例和时间氛围。

注意：该旧背景右下含二维码和宣传文字，这是遗留资产问题，只能作为“完整场景优先”的方法参考，不能成为 V2 允许图片文字的先例。

### 3.2 背景与菜品输送如何关联

菜品使用贝壳托盘，继续沿水流横向运动。三条 CSS 波纹只是强化水流方向，真正承载世界观的仍是背景图和贝壳素材，而不是波纹线本身。

### 3.3 背景与特殊事件如何关联

周期事件由 `SeaTurtlePass.vue` 实现。海龟由壳、身体、头、四肢和水花多张透明素材分层，允许各部分做不同相位的运动；Canvas 再生成气泡与涟漪。与一张静态海龟图相比，它更像环境中的生物。

`AmbientSceneEffects.vue` 还提供鱼影、气泡和焦散等轻量事件；主题转场使用 `c/transition/ocean-animals.png`。

### 3.4 组件世界观

`c/` 目录与 `b/` 目录保持相同资产接口：背景、进度条三层、购物车底板、左右槽位、下单按钮、菜单/导航/历史/设置/呼叫按钮和状态覆盖图都有同尺寸替代物。因此业务组件无需分叉，只按 `data-theme` 换皮。

## 4. 图片、CSS、动态组件的合理边界

### 图片素材适合承担

- 完整环境、人物、建筑、地貌和复杂材质；
- 具有主题辨识度的托盘/载具；
- 购物车、控制台、进度条等需要独特轮廓和材质的外壳；
- 船、海龟、转场插画等复杂主体；
- 状态覆盖图和招牌菜海报。

### CSS 适合承担

- 真实布局、响应式尺寸、裁切、层级和留白；
- hover、focus、disabled、pressed 等交互状态；
- 简单灯面、遮罩、阴影、低频波纹和轻量环境光；
- 文字排版；所有可翻译文字必须由 DOM/i18n 渲染；
- 低成本的素材组合与颜色 token，不承担整座建筑或完整场景。

### 动态组件 / Canvas 适合承担

- 商品横向循环、拖拽、惯性、方向、速度和暂停；
- 小船、海龟、未来列车等需要独立运动的实体；
- 水花、气泡、蒸汽、微尘、轮下火花等粒子；
- 招牌菜视频吊屏、主题转场、AI 助手状态；
- 与商品点击、加购和下单结果联动的短动画。

## 5. 为什么两套正式主题比普通 CSS 页面更有场景感

1. 完整背景先建立“用户站在哪里”，再放 UI；不是先画卡片再塞几个图标。
2. 商品移动方式有物理解释：水面漂流、贝壳载具，而不是一排卡片自动平移。
3. 周期事件是大体量、可识别的实体，且与场景介质发生反应。
4. 背景、托盘、购物车、按钮、进度条和转场使用相同插画体系。
5. CSS 主要负责组合和状态，复杂物体由素材承担，因此放大时仍保留细节。
6. 特殊事件沿用同一滚动/点击业务链路，世界观与交互没有割裂。

## 6. 第三主题值得复用的方法

- 复用 `SCENES` 注册、预加载、主题切换和 `data-theme` 机制。
- 复用 `ScenicDishStage` 的单一横向流、三循环无缝结构、拖拽、惯性、方向、速度和暂停。
- 复用特殊事件“占多个普通槽位”的插入机制，但替换成大尺寸列车/车厢。
- 复用 `StageSplashLayer` 的架构思想：环境粒子读取实体位置和真实速度，不直接控制业务。
- 复用 `themeKey` prop 向进度、购物车、AI、菜单、转场和招牌屏传递主题语义的做法。
- 复用进度条“三层图片 + CSS clip + DOM 百分比”的结构。
- 复用左右购物车和统一父页面事件流，不改购物车数据模型。
- 复用图片预加载、错误回退、`prefers-reduced-motion` 和主题转场遮罩。

## 7. 不适合照搬的部分

- 不能照搬旧背景中嵌入的文字、二维码、品牌角色或路线信息。
- 不能把海浪的三条曲线简单改色成铁轨；铁路必须有真实结构与透视。
- 不能继续使用 8–14px 的小字作为 3840×1080 主界面的主要信息。
- 不能把所有按钮仍做成海滩/海底轮廓后仅换成深色。
- 不能让主题专属素材继续靠 `background-size: 100% 100%` 无差别拉伸。
- 不能把多个视觉“深度车道”建立在同一水平流上再靠缩放/透明度伪装。
- 不能继续让拖拽成为某些区域的唯一操作方式；分类按钮、暂停、方向/速度控制和点击加购必须保留。

## 8. `themev1` 专项审计

### 8.1 实现概况

`themev1` 并不是基于位图环境，而是新增：

- `StationPlatformScene.vue`：1600×660 巨型内联 SVG，包含天空、城市、顶棚、立柱、窗、灯、月台、轨道、枕木、节点和遮挡层；
- `midnight-station.scss`：大量全局 token、渐变、边框、阴影和主题覆盖；
- `ConveyorBeltDisplay.vue` 顶部 CSS 场景：月亮、天际线、电线、月台和移动光；
- `ScenicDishStage.vue`：CSS 铁轨、三条视觉深度车道、CSS 盘面、托架、轮子、线路节点、站台标记、盖章状态；
- `CartPanel.vue`：CSS 站台柜、灯、票面、蒸汽、信号与英文状态；
- `CenterFunctionPanel.vue`：CSS 站务控制台；
- `TopPlateProgress.vue`：铁路线路式进度；
- `SceneTransitionOverlay.vue`：CSS 站牌、信号和轨道；
- `FeaturedDishScreen.vue`：站内广告板；
- 菜单、导航、设置、订单历史和 AI 面板的深色站务风皮肤；
- `StationCartTransfer.vue`：使用 Web Animations API 把加购视觉副本送入左右购物车。

### 8.2 已知问题的代码证据

1. **CSS/SVG 从零拼完整场景**：`StationPlatformScene.vue` 内含大量 `<path>`、`pattern`、渐变和滤镜；菜品盘、托架、车轮也由多个 `<span>/<i>` 拼装。缩略图尚可，1:1 查看缺少真实材质。
2. **透视和光源不统一**：SVG 轨道曲线、CSS 顶部天际线、CSS 购物车灯、CSS 盘面和 DOM 站牌各自有独立几何与阴影规则。
3. **主题识别依赖文字**：场景直接写入 `SANHE DINING`、`PLATFORM 03`、`深夜食堂`、`03-A` 等；隐藏文字后，剩余画面更像深色控制台。
4. **元素数量与空间关系不足**：车站设施以符号化立柱、灯、线条和节点为主，缺少真实候车空间、长椅、站务房、线缆、设备、地面磨损和远端铁路线。
5. **铁路符号代替车站空间**：月亮、线、栏杆、轨道和编号没有共同构成可生活的连续空间。
6. **文字整体偏小**：大量铁路标签使用 8–14px 等宽字体；即便设置了少量 1921px 以上提升，许多局部仍显得像装饰。
7. **3840×1080 尺度失真**：核心 SVG 设计画布仅 1600×660 并强制 `preserveAspectRatio="none"`，在 32:9 上横向变形；组件视觉宽度多为 126–330px，落到 3840 屏幕中非常小。
8. **周期节点过小**：第三主题取消船/海龟事件，插入的是约 126–176px 的 `station-route-node`，且每个节点内容仍是小字和三颗小灯，不能形成“列车经过”的事件感。
9. **动态组件与背景不在同一世界**：CSS 盘车、纸票、圆角面板、原 AI 角色和 SVG 月台的材质、细节密度与光照都不同。
10. **轨道与建筑放大后细节不足**：枕木是重复 pattern，轨面主要是描边和渐变；墙面、地面和设备缺少真实磨损、接缝和微表面。
11. **背景含硬编码文字**：不仅违反 V2 母背景规则，也绕开 i18n。
12. **三视觉车道制造假纵深**：同一 DOM 水平流按 `back/middle/front` 循环改变 Y、scale、opacity；它不是三个真实轨道，商品会规律性忽远忽近。
13. **开发量与视觉收益倒挂**：24 个文件约新增 6574 行，视觉复杂度却主要来自 CSS 数量，而非统一美术资产。

### 8.3 应彻底放弃

- `StationPlatformScene.vue` 整体方案和 1600×660 拉伸 SVG；
- 顶部月亮/天际线/电线/平台由 div 拼装的 `station-top-atmosphere`；
- 用 CSS 线条代替实体轨道；
- CSS 拼盘面、托架、车轮、建筑、站牌和站台设施；
- 三种 scale/opacity 循环制造的假深度车道；
- 126–176px 的 `station-route-node` 周期事件；
- 所有 `ROUTE 03`、`BOARDING`、`PLATFORM HOLD`、`SEAT A/B` 等硬编码装饰文字；
- 为主题专门指向固定寿司图的视觉回退；
- 用发光小点、细线和等宽小字充当铁路氛围的做法。

### 8.4 可复用的业务与交互思想

- `SCENES` 增加第三 key、预加载和设置入口的整体方向；
- `themeKey` 向子组件传递；
- 主题 token 原则，但颜色、字号和材质需重新定义；
- 主题切换时先遮罩、再换 token、再揭幕；
- `StationCartTransfer.vue` 的“加购后飞向目标槽位”交互概念、目标定位和 reduced-motion 降级；
- 点击态、加购反馈、数量变化、删除、下单成功/失败的状态挂钩；
- 复用现有单条滚动流，不重写商品移动物理；
- 保留 focus、disabled、ARIA 和减少动态处理。

这些只能作为逻辑/交互参考，不能直接把 `themev1` 文件复制进 `themev2`。

## 9. 真实业务约束

### 不可删除或改写逻辑

- `menuApi.getProducts` 和 `menuApi.getCategory` 的真实商品与分类接口；
- 菜品点击与屏幕左右位置决定加购侧；
- `useCart` 的左右 4 槽、同品数量、最大数量、删除和清空规则；
- `orderApi.getShop/openDesk/syncCart/create` 下单链路；
- 分类筛选、商品可售状态和图片错误回退；
- 横向循环、鼠标/触控拖拽、滚轮、惯性、暂停、方向和速度；
- AI 推荐、语音识别、录音/TTS、快捷命令和下单反馈；
- 订单历史、设置、呼叫服务员、招牌菜展示、游戏触发和主题切换。

### 可改变

- 背景、外壳、托盘、列车、购物车、按钮、进度条和转场素材；
- 组件视觉层级、占位和主题专属布局；
- 动画轨迹、节奏、遮挡和环境粒子；
- 字体体系、字号、颜色 token、边框和阴影；
- 在不破坏事件接口的前提下新增纯视觉子组件。

### 调整边界

- 可以向组件增加 `themeKey`、视觉状态或 `ref`，但不要复制一份业务组件；
- 可以让特殊列车占多个槽位，但不能改变商品数组和真实接口数据；
- 可以重新设计菜单外观和导航布局，但必须保留分类、返回、拖拽/滚动、加购和左右购物车；
- 可以新增键盘/按钮替代操作，不能移除拖拽和惯性；
- 图片不得写入商品名称、价格、站名、编号和任何 i18n 文案。
