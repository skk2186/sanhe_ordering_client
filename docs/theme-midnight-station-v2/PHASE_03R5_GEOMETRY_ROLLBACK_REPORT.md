# Phase03-R5 · 顶部居中与底部共享尺寸回归

## 基线与范围

- branch：`themev2`
- HEAD before：`7974782caa6d87949e0f7683aceecc7e92ed1d4c`
- HEAD after：`7974782caa6d87949e0f7683aceecc7e92ed1d4c`（本轮修改保留工作区，未提交/推送）
- 开始时工作区干净，已核对 status、branch、HEAD、最近 8 条历史。
- 未 reset / restore / checkout，未修改 master 或 themev1，未进入 Phase04。
- 实际修改：ConveyorBeltDisplay.vue、CartPanel.vue、CenterFunctionPanel.vue；新增轻量检查 tests/midnight-geometry.test.mjs、本报告和 7 张真实页面截图。
- 新增 UI 资产：无。

## 进度偏左的直接根因与修复

R4 把 `.top-progress` 从整页绝对居中改为 relative / grid-column:2 / transform:none。三栏宽度不对称，第二栏中心不等于 viewport 中心；这是直接根因，不是标题锚点或设备建模问题。

恢复 absolute、left:50%、translateX(-50%)，containing block 为原本 position:relative 的 top-scene-banner。左右页面内边距相同，横幅中心等于页面中心；top:38px 控制悬挂设备所在行。设备宽度为 min(1040px, calc(100vw - 1120px))，3840 使用 1040px，1920 使用 800px，预留品牌与共享助手气泡间距。宽度不会因 AI 是否开启改变。

未改 TopPlateProgress.vue、标题/百分比/灯格计算、ARIA、完成态、progress-hanger-v1 或 progress-console-v2。品牌仍只保留“回转寿司”，相关代码未改。

真实 Chrome boundingClientRect 测量（设备尺寸覆盖，deviceScaleFactor=1）：

| viewport | viewport center X | progress center X | error | AI 实际启用/停用 |
| --- | ---: | ---: | ---: | --- |
| 3840×1080 | 1920 | 1920 | 0px | 两种状态均 0px |
| 1920×1080 | 960 | 960 | 0px | 两种状态均 0px |

通过开发页面已存在的 globalStore.voiceAssistantEnabled 实际切换开关，非修改助手源码，也非仅隐藏 DOM。1920 截图已检查进度框不遮住助手气泡。

## 底部共享尺寸回归

基线 Midnight CSS：3840 bottom=320px、cart/center=300px；1920 bottom=230px、cart/center=220px。取消页面及组件这两组专属高度，同时取消 Midnight 外层专属宽度、额外下 padding、item-group 拉伸与中央独立 flex 几何。

直接使用共享 SCSS 和组件原有断点，未反向修改 zhenxian/xiaoxin。不是把所有 viewport 固定为 217px。

| viewport / theme | bottom 高度 | 左 cart W×H | center W×H | 右 cart W×H |
| --- | ---: | --- | --- | --- |
| 3840 / zhenxian | 213px | 827×217 | 790×217 | 827×217 |
| 3840 / xiaoxin | 213px | 827×217 | 790×217 | 827×217 |
| 3840 / midnight-station | 213px | 827×217 | 790×217 | 827×217 |
| 1920 / zhenxian | 180px | 694×170 | 480×170 | 694×170 |
| 1920 / xiaoxin | 180px | 694×170 | 480×170 | 694×170 |
| 1920 / midnight-station | 180px | 694×170 | 480×170 | 694×170 |

3840 三主题位置也一致：bottom y=867；左 cart x=668、center x=1525、右 cart x=2345，组件 y=865。1920 bottom y=900，组件 y=905。共享 217px 组件的空白底缘延伸到 1082px（原有几何），实际控制区未被屏幕边缘裁切；未为此改变成熟主题。

## 共享结构与文字

CartPanel 保留同一 template、四槽 v-for、left/right 决定订单区顺序、商品信息与 +/- 层级、购物业务和 emits。CenterFunctionPanel 保留两侧菜单与中间上下两行四功能，全部六个真实 button 与 emits 原样保留。没有新增 Midnight DOM 分叉或锚点系统。

Midnight 仅保留深绿、黄铜边、米色菜单、暖色呼叫区、focus/hover/disabled 与局部信息排版。没有通过全面缩小字体硬塞：3840 商品名仍 22px、价格 20px、数量 26px、菜单 30px、中央功能 26px。商品名称区实测 112×44px；菜单 138×184px，搜索 218×105px，均采用共享功能位。

订单按钮回归共享 118×185px，内部代表图 80×80px，标签/计数/总价分别 26/26/24px，以正常纵向信息层呈现。+/- 在共享 114px 槽宽内为 34×34px，符号 28px，数量居中，避免原来 44px 两按钮挤压信息。1920 沿用原有 Midnight 字级：商品名 17px、价格 16px、数量 21px、菜单 23px、中央功能 20px；按钮仍 34×34px，代表图 65×65px。

## 后方整体桌柜移除

删除 CartPanel 中整张 cart-counter-${side}-v3 img 与对应后景样式；删除 CenterFunctionPanel 的 service-console-v3 img 与对应后景样式；删除 SCENES 的三张预加载引用。

三个文件正式路径不再引用这些整张桌柜。文件保留历史，不删除原资产，不新增局部 trim。真实 DOM 扫描对应 v3 图片节点数为 0；底部截图没有柜体下缘或桌腿露半截。

## 轨道与轮组叠加检查

3840 全景与专门净空截图同时显示普通配送及完整特殊列车。通过已有 tide-stream 的 scrollLeft 将中间周期特殊列车定位到 x≈2200，暂停拍摄；未改变 stage 结构、轮组动画、素材或 delivery corridor。

- 普通轮组下缘实测 y=702.515625。
- 特殊驱动轮下缘 y=688.53125，客车轮下缘约 y=681.720825。
- 底栏内容顶边 y=865，分别至少留出约 162.5px / 176.5px 净空。
- 肉眼检查：商品/列车 → 完整轮组 → 铁轨 → 月台前缘 → 底部点餐区的关系恢复；底栏不覆盖轨道与轮组。
- background-v3、foreground、ScenicDishStage、MidnightDishTrolley、MidnightExpressPass、TopPlateProgress、VirtualDiningAssistant 和全部 UI 图片与基线 diff 均为零。

## 实际业务与 resize 回归

隔离 Chrome 配置，本地页面 3003，使用已运行的 49000 后端（仅运行环境代理目标，不改 API）。真实 API 商品左右各加入 2 件，计数均 2/4；左总价 11.00、右总价 5.00。

- 左右加购：正常。
- 数量：真实鼠标点击 1→2→1，数字、按钮和名字不位移。
- 删除：左侧数量槽从 [1,1,0,0] 变为 [0,1,0,0]。
- 左右菜单：分别显示相应侧菜单与分页。
- 搜索/导航：显示已有商品分类与搜索结果。
- 点餐记录：显示历史订单表格。
- 设置：显示现有设置弹窗。
- 呼叫店员：显示确认窗口，未确认发送通知。
- 空车下单入口：真实点击保持原有静默处理，无新增订单；本轮未重新提交有商品订单，订单业务源码无改动。
- 不刷新执行 3840→1920→3840，已有购物车四件商品未重置，普通配送 66 个、特殊列车 3 个节点保留。
- 再以未暂停实际运动验证 resize：3840 scrollLeft 13258→13313，1920 10135→10158，回到 3840 13523→13575；流继续可见并运动。
- 实际暂停后 scrollLeft 13583→13583（600ms），暂停未回退。

## 旧主题与冻结对象

zhenxian / xiaoxin 各在两种尺寸实测并检查，尺寸见上表。真实有商品状态下四槽、图片、原生数量控制、下单计数、中央功能入口及底部高度正常；两个主题分别鼠标点击 +/- 验证 1→2→1。截图已检查旧主题素材文字没有新增叠印，未改其成熟皮肤或共享尺寸规则。

VirtualDiningAssistant 继续严格 FROZEN：本轮没有修改文件，没有颜色、贴图、底座新增。品牌不回退。Phase04 的菜单、导航、历史、设置皮肤、大屏与转场全部未处理，仅验证入口。

## 构建与轻量防回归

- npm run build：通过（1804 modules，最终构建 19.27s）。
- git diff --check：通过。
- npm run test:assistant：26/26。
- npm run test:voice：9/9。
- node --test tests/midnight-geometry.test.mjs：3/3。

新增测试防止进度再次回到 Grid 第二栏、超高底栏/v3 后景引用或锚点结构复活；它不替代真实视觉验收。未引入 Playwright 或其他庞大基础设施。

布局技能用于核对共同边缘、原有密度与响应边界；UI/UX 数据库的 Vue 定向搜索无匹配，已重试，最终以仓库真实共享规则和浏览器测量为准，未按通用建议扩张 UI。

## 截图

全部位于本目录 screenshots/，真实 Chrome 页面截图，非设计稿：

- phase03r5-midnight-3840-full.png
- phase03r5-progress-center.png
- phase03r5-bottom-full.png
- phase03r5-track-wheel-clearance.png
- phase03r5-midnight-1920.png
- phase03r5-zhenxian.png
- phase03r5-xiaoxin.png

## 已知问题与阶段结论

实际数据的“霸气橙子”图片 URL 指向未运行的 localhost:48081，“33333”无图，跨主题均存在；未修改商品数据或替换业务图片。构建仍有既有 Sass 弃用和大 chunk 提示，不影响构建。

本轮核心几何与叠加验收已完成，未发现进度偏移、后景半截桌柜、底栏遮轮或旧主题尺寸污染。结论：READY_FOR_PHASE_04。此状态只表示本轮范围可交接，最终人工验收仍由用户决定；未开始 Phase04。
