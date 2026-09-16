# Phase03-R Midnight Station 主界面实体设施融合修复报告

## 1. 基线

- branch：`themev2`
- HEAD before：`46d139d781d2c0932d237e36b37587e2562cf975`
- HEAD after：`46d139d781d2c0932d237e36b37587e2562cf975`（本轮成果保留为工作区修改，未擅自提交或推送）
- 已确认基线同时包含 Phase02-R2 与 Phase03；`background-v3`、`MidnightDishTrolley`、`MidnightExpressPass` 和 Phase03 resize 修复均保留。
- 未执行 `reset`、`restore` 或 `checkout`，未修改 master/themev1。

## 2. Phase03 视觉问题根因

Phase03 已接入 `platform-service-counter-v1.png`，但 Midnight 专属 CSS 又在其上绘制了完整的深绿渐变槽位、票据卡、等宽按钮、边框和阴影。资产实际只成为边缘装饰，DOM 方块遮住了托盘、桌面、灯条和柜体，最终仍呈现为网页 card 覆盖背景。

本轮改为严格三层关系：实体设施图片在后、DOM 数据和真实 button 热区在中、状态光和 focus outline 在前。CSS 只负责布局、透明热区、裁切、响应式和状态反馈。

## 3. 实际修改文件

- `src/views/display/ConveyorBeltDisplay.vue`
- `src/components/display/CartPanel.vue`
- `src/components/display/CenterFunctionPanel.vue`
- `src/components/display/TopPlateProgress.vue`
- `src/components/display/VirtualDiningAssistant.vue`
- `docs/theme-midnight-station-v2/PHASE_03R_ASSET_INTEGRATION_REPORT.md`
- `docs/theme-midnight-station-v2/screenshots/phase03r-*.png`
- `public/images/ui/midnight-station/*-v2.png`（见下一节）

未修改 `ScenicDishStage.vue` 的 Phase03 resize 实现，也未修改 Phase02-R2 主舞台、轨道、普通配送车、特殊列车或 background-v3 构图。

## 4. 新增资产

所有资产均不含中文、英文、数字、Logo、价格、菜名、按钮文案、伪文字或水印；文字继续由 DOM/i18n 输出。

| 资产 | 用途 |
| --- | --- |
| `cart-counter-left-v2.png` | 左购物车专用：四个实体托盘位在左，出票/确认区在右 |
| `cart-counter-right-v2.png` | 右购物车专用：出票/确认区在左，四个实体托盘位在右 |
| `service-console-v2.png` | 中央服务台：左右菜单夹、搜索拨杆、票据档案槽、设置旋钮、服务铃 |
| `progress-console-v2.png` | 顶部旧金属线路控制板、两端信号器与分段灯槽 |
| `ai-station-desk-v2.png` | 夜班站务员工作位、票纸、票架、状态灯与角色站台 |
| `brand-sign-v2.png` | 站棚吊挂式入口铭牌 |

生成时统一以 `background-v3-rear.png`、Phase03 实际页面截图和既有柜台资产为参考，要求同一正面透视、深绿旧漆、旧木、黄铜、琥珀站灯和蓝黑夜景阴影。购物柜与进度资产的生成结果随后仅做透明通道清理，未改变柜体结构和物理槽位。

## 5. 删除 / 简化的 CSS 实体绘制

- CartPanel：删除 Midnight 槽位的深绿渐变背景、黄铜矩形边框、票纸信息卡背景、数量键渐变块、下单卡片背景和实体阴影。
- CenterFunctionPanel：删除通用柜台背景、五个等宽深绿矩形按钮、呼叫店员金色矩形和对应边框/阴影。
- TopPlateProgress：删除整块 CSS 金属板、CSS 圆形端点和外框阴影；只保留真实百分比的分段灯亮态裁切。
- VirtualDiningAssistant：删除外层深绿 rail、纯色票纸气泡边框/阴影和 CSS 角色底座；状态呼吸光、文字和 focus 提示保留。
- 品牌区：删除 dashboard card 式背景、左粗边、矩形描边与阴影。

旧主题原有 CSS 未删除；所有新设施图片默认 `display:none`，仅在 `midnight-station` 根选择器下显示。

## 6. 左购物车融合

左柜独立资产内直接提供四个托盘、四套数量拨片/窗口、删除红钮、右侧信息窗、出票槽和确认钮。DOM 商品图落在托盘内部；空槽只显示弱“+”；数量 `- / 数量 / +` 放在资产已有的三段机械控制板上。下单、槽位数和总价写入右侧资产信息窗，真实 `button`、disabled、ARIA 和 focus-visible 保留。

## 7. 右购物车融合

右柜不是对整个 DOM 做 `scaleX(-1)`，而是独立生成的右侧资产：订单/出票区在左，四个托盘在右。DOM 文字和商品保持正常方向，热区按照右资产的物理位置单独排布。

## 8. 中央服务台融合

中央区改为非等宽热区：左右菜单分别落在两本纸质菜单夹上；搜索落在大型机械拨杆板；点餐记录落在票据档案槽；设置落在旋钮/开关板；呼叫店员与实体黄铜铃对应。六个 DOM button（菜单左右入口共用同一业务功能）全部保留，背景透明，仅 hover 使用轻微暖光、focus 使用清晰 outline。

## 9. 进度条融合

`progress-console-v2.png` 提供旧金属框、黄铜紧固件、两端信号器、空铭牌和分段玻璃灯槽。真实 `progress`、格式化百分比、ARIA、完成状态和业务逻辑不变；CSS 只按 `--progress` 裁切琥珀灯亮态，完成时改为绿色通行信号。3840 与 1920 的主状态和百分比均清晰可读。

## 10. AI 融合

AI 角色本体和状态机未修改。新增工作台提供暖灯、空白票纸、票据架、三色状态灯与角色站台；DOM 姓名和状态文字放在票纸上，角色 button 放在右侧实体站台。`idle/listening/processing/result/error` 继续通过既有文字、状态 class、角色动画和灯光共同表达，不只依赖颜色。1920 下工作位固定在进度设备右侧，不再遮挡线路板。

## 11. 品牌区融合

品牌文字仍由 DOM 输出，改放在带吊链、黄铜上下压边和侧灯的站棚挂牌中。移除了原矩形 dashboard 背景，3840/1920 均保持中文主标题、英文说明和桌位信息的层级。

## 12. DOM hotspot 对齐与无障碍

- Cart 的槽位、删除、数量和下单热区按左右资产各自的百分比坐标排布。
- 中央功能台按菜单夹、拨杆、档案槽、旋钮和服务铃的真实位置绝对定位，不再强制等宽等高。
- 所有功能仍是原生 `button`；透明视觉不影响 `aria-label`、title、disabled、键盘 focus 和点击区域。
- focus outline 为 3px 暖黄高对比描边；hover 只增加轻微暖光，不重新绘制矩形卡片。
- 调试热区没有默认开启，也没有提交任何常驻红蓝覆盖层。

## 13. 3840 验证

- viewport：`3840×1080`，页面根尺寸 `3840×1080`。
- stage：`3804px`；Midnight 托盘车 `66` 个；特殊列车节点 `3` 个。
- 左柜 `827×217`、中央台 `790×217`、右柜 `827×217`；三套设施桌面、灯、托盘和柜体完整可见。
- 品牌、线路板、AI 工作位互不遮挡；进度板 `941×124`。
- 截图：`phase03r-midnight-3840.png`、`phase03r-bottom-full.png`、三张组件截图、进度和 AI 截图。

## 14. 1920 验证

- 在同一页面、不刷新业务状态的情况下切换为 `1920×1080`。
- stage：`1884px`；托盘车仍为 `66`，特殊列车仍为 `3`，可视商品 `7`。
- 左右柜和中央台按容器缩放并保持热区坐标；不是对整个 DOM 使用 `scale(.5)`。
- AI 工作位从进度板右侧开始，票纸、状态文字和角色仍可见。
- 截图：`phase03r-midnight-1920.png`。

## 15. Resize 回归

| 路径 | 结果 |
| --- | --- |
| 3840 → 1920（无刷新） | PASS：stage `3804 → 1884px`，66 个商品托盘与 3 个特快节点持续存在 |
| 1920 → 3840（无刷新） | PASS：stage `1884 → 3804px`，商品和特快节点持续存在 |

Phase03 的 `ResizeObserver + debounce + 合法周期坐标映射` 未改动；购物车、分类和暂停状态未因 resize 重置。

## 16. 业务回归

真实 Chrome viewport 和鼠标输入验证：

- 左右商品加购：PASS。
- 数量 `+` / `-`：PASS（`1 → 2 → 1`）。
- 删除：PASS。
- 下单 button 热区、ARIA、focus 和 enabled 状态：PASS；未向真实后端提交订单。
- 分类切换：PASS。
- pause / resume：PASS。
- 左菜单、搜索、点餐记录、设置、呼叫店员入口：全部 PASS；仅验证打开后关闭/重载，没有提前美化覆盖层。
- AI button、ARIA 和状态 class：PASS；自动化环境未授予麦克风权限，没有改动语音状态机。
- `npm run test:assistant`：PASS，26/26。

## 17. 旧主题回归

| 主题 | 结果 |
| --- | --- |
| zhenxian | PASS：新增 Midnight 设施全部 `display:none`，Midnight trolley 为 0，进度素材仍为 `/images/ui/b/bar.png` |
| xiaoxin | PASS：新增 Midnight 设施全部 `display:none`，Midnight trolley 为 0，进度素材仍为 `/images/ui/c/bar.png` |

截图：`phase03r-zhenxian-regression.png`、`phase03r-xiaoxin-regression.png`。

## 18. Phase03 与 Phase03-R 对比

1. 实体柜台露出面积显著增加：Phase03 的柜台仅露出边柱/柜脚；Phase03-R 的桌面、托盘、拨片、票窗、柜门和灯具均完整可见。
2. CSS 矩形显著减少：底部四槽深绿框、两块下单卡和中央等宽按钮矩形均移除；可见实体结构由六张专用资产承担。
3. 底部不再能一眼识别为网页 card：隐藏 DOM 文案后仍能辨认左右购物柜和中央服务台。
4. DOM 已融入资产槽位：商品进托盘、数量进机械控制板、下单进信息窗，中央文案逐一对应菜单夹/拨杆/票槽/旋钮/服务铃。
5. 深绿旧漆、旧木、黄铜与琥珀灯和 background-v3 的夜间站台属于同一画风。

## 19. 构建

- `npm run build`：PASS。
- Vite 完成 1805 个模块转换；仅有仓库既有 Sass 弃用提示和 chunk-size 提示，无 Phase03-R 编译错误。
- `git diff --check`：PASS。

## 20. 已知问题

1. AI 有推荐结果时，推荐菜仍以小型票纸卡承载真实商品图和文字；这是可读性优先的轻量保留，不会遮挡主工作台，后续可继续做纹理微调。
2. 新增 PNG 为 3840 kiosk 的高分辨率透明资产，文件体积较大；当前已纳入场景预加载，后续可在不改变 alpha 边缘的前提下做 WebP 产物优化。
3. 设置、订单历史、菜单、全屏导航、招牌菜大屏与转场没有在本轮改皮肤，明确保留给 Phase04。

## 21. 截图清单

- `phase03r-midnight-3840.png`
- `phase03r-bottom-full.png`
- `phase03r-left-cart.png`
- `phase03r-center-console.png`
- `phase03r-right-cart.png`
- `phase03r-progress.png`
- `phase03r-ai.png`
- `phase03r-midnight-1920.png`
- `phase03r-zhenxian-regression.png`
- `phase03r-xiaoxin-regression.png`

## 22. 最终结论

`READY_FOR_PHASE_04_WITH_NOTES`
