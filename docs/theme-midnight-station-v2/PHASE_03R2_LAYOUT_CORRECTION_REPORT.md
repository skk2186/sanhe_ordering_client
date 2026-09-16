# Phase03-R2 · Midnight Station 主界面交互设施排布修复报告

## 1. 基线

- branch：`themev2`
- HEAD before：`704e576b6b521e66fe6052d86f0634e46e70b8a9`
- HEAD after：`704e576b6b521e66fe6052d86f0634e46e70b8a9`（本轮修改保留在工作区，未执行 reset / restore / checkout）
- 已保留 Phase02-R2 的 background-v3、MidnightDishTrolley、MidnightExpressPass 和 resize 修复；未修改 master 或切换 themev1。

## 2. Phase03-R 失败根因

Phase03-R 已将结构素材放在 DOM 后方，但购物车与服务台仍使用通用网格、固定高度和局部百分比猜测。素材里的托盘、票窗、菜单夹和机械台面没有一套可复用的坐标定义，导致文字、数量与按钮虽然可用，却不能稳定落在对应物理位置。

## 3. 已有主题成熟布局的借鉴

保留成熟布局的四槽购物车、左右订单区、菜单左右入口、中央导航/记录、下方设置/呼叫的层级，不照搬旧主题配色。Midnight 仅将这些稳定的操作关系映射到柜台素材已有承载位；可用性优先于不必要的透视装饰。

## 4. 新增 / 重做资产

- `public/images/ui/midnight-station/progress-hanger-v1.png`：透明吊架、固定座、黄铜链与下方连接耳，只承担悬挂关系。

现有 cart-counter-left/right-v2、service-console-v2、progress-console-v2 均继续使用。新吊架无文字、数字、Logo、价格、菜名或水印。

## 5. 锚点系统

- `CartPanel.vue`：`MIDNIGHT_CART_ANCHORS` 为左右资产分别定义四个 `x/y/width/height` 托盘位和订单窗；DOM 通过 CSS custom properties 定位，不再依据通用 grid 进行 margin 猜测。
- `CenterFunctionPanel.vue`：`MIDNIGHT_CONSOLE_ANCHORS` 定义 leftMenu、navigation、history、settings、waiter、rightMenu 六个物理矩形；所有按钮仍为原生 button。
- `TopPlateProgress.vue`：`MIDNIGHT_PROGRESS_ANCHORS` 定义吊架、状态标题与百分比相对位置；进度计算、ARIA 与填充裁切没有变化。

锚点坐标均为资产比例坐标，3840 与 1920 共用同一逻辑，CSS 只负责容器缩放与 focus/hover。

## 6. 顶部进度条悬挂

progress-hanger-v1 位于控制板后方并向上延伸至顶栏，包含真实的顶棚固定座、金属臂、链条与连接耳，而非 CSS 直线。文字仍为 DOM；线路板的 fill 继续由真实 `progress` 百分比裁切，完成态仍使用绿色通行语义与 ARIA 数值。

## 7. 左 / 右购物柜台

左右柜台使用各自独立的锚点，不镜像文字或 DOM。四个商品图进入实体托盘，名称位于托盘下的信息条，加减与数量落在同组机械控制条，订单按钮/计数/总价进入独立出票窗。存在商品时订单窗同步显示首个商品预览，订单信息不再缩在边缘。

为使 3840 下的商品预览与数量热区达到可读尺寸，Midnight 专属底栏从 213px 增至 260px；这是对配送舞台的最小高度协调，不改变其结构、轨道或运动系统。1920 的对应高度为 200px。

## 8. 中央服务台

服务台恢复已有主题的熟悉关系：两侧菜单夹、中央左导航、上方票据记录、下方设置拨盘和服务铃。按钮没有再做等宽网页卡片，文案均居中在资产真实承载位；hover 仅加暖光，focus-visible 保留高对比轮廓。

## 9. 字体与控件

购物柜商品、数量、订单、总价和中央台均通过 `clamp()` 维持 3840 下的可读尺寸。加减按钮在 3840 下使用至少 30px 的可见按钮并获得约 44px 高的控制带热区；1920 下降级为仍可点击的 24px 可视按键和同一锚点。

## 10. VirtualDiningAssistant 恢复与冻结

撤销 ai-station-desk-v2、绝对定位票纸和 Midnight 专属工作台覆盖，恢复 Phase03-R 前的助手容器、气泡、角色布局、推荐栏和桌面底座样式。没有触及 TTS、状态机、推荐、emit 或语音逻辑。VirtualDiningAssistant 从本报告起为 **FROZEN**，除非后续有明确指令，不再修改其外观。

## 11. 验证

### 3840×1080

PASS。实际页面为 Midnight 主题，两个购物柜、中央服务台、66 个普通托盘车、3 个特快节点均存在；吊架显示为 block。全景及局部截图：

- `screenshots/phase03r2-midnight-3840-full.png`
- `screenshots/phase03r2-progress.png`
- `screenshots/phase03r2-left-cart.png`
- `screenshots/phase03r2-center-console.png`
- `screenshots/phase03r2-right-cart.png`
- `screenshots/phase03r2-cart-filled.png`

### 1920×1080

PASS。按同一相对锚点降级，无整组 `scale(.5)`；商品流、特快节点和三套设施仍显示。

- `screenshots/phase03r2-1920-full.png`

### Resize

PASS。Phase03 的 ResizeObserver、90ms debounce 和合法周期坐标映射未修改；本轮只调整底栏容器尺寸，不会重置分类、购物车、pause、方向或速度。页面在 3840 与 1920 切换期间仍维持商品/特快 DOM。

### 业务回归

PASS。真实页面触发左右商品加购，两个订单窗均显示 `1/4` 与总价；商品图进入对应实体托盘。购物车仍保留原生 +/-、删除、下单入口、disabled、ARIA 与 focus-visible。CenterFunctionPanel 的菜单、导航/搜索、记录、设置、呼叫店员 emits 未变。pause 与既有方向/速度逻辑未改。

### 旧主题回归

PASS。切换 zhenxian / xiaoxin 后，Midnight 设施不显示；旧主题进度与点餐区不使用上述锚点或吊架。

- `screenshots/phase03r2-zhenxian-regression.png`
- `screenshots/phase03r2-xiaoxin-regression.png`

### Build 与 AI 测试

- `npm run build`：PASS（仅仓库既有 Sass deprecation 与 chunk-size 提示）。
- `npm run test:assistant`：PASS，26/26。

## 12. 已知问题与阶段结论

仅剩金属高光、边缘微对齐及 hover 灯效可在后续按需微调；不影响文本归位、热区、购物车、助手或 resize。设置、历史、菜单、招牌菜大屏和转场仍明确留在 Phase04 范围，未提前修改。

下一阶段可进入：`READY_FOR_PHASE_04_WITH_NOTES`。
