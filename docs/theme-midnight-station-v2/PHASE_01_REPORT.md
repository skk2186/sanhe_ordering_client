# 午夜月台 V2 · Phase 01 阶段报告

## 1. 状态摘要

- 当前分支：`themev2`
- Phase01 implementation base / pre-report HEAD：`a9331f281ee8752c70b4ccf6665aa678dc91c237`
- Phase01 reviewed commit：`fcb7640030084c443dc2fd9cdd31efcb888fae37`
- master baseline：`b1a90285f904c505b9f293ebfa858cee18e8da75`
- themev1 audit target：`1fc5e9ce7465ba06d851dd89f6cfa3c24e4aef1c`
- documentation-fix commit：本报告随本次文档修复提交更新；最终 SHA 见交付记录（避免在提交内容中自引用）
- 本阶段类型：研究、审计、视觉基准、资产规划和可实现性验证
- 业务组件改动：无
- 旧主题改动：无
- 后端/API 改动：无
- 当前 blocker：无
- 最终状态：`READY_FOR_PHASE_02`

## 2. 检查过的文件

### 正式主题与真实业务

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
- `src/components/order/OrderHistoryDialog.vue`
- `src/composables/useCart.js`
- `src/composables/useOrderProgress.js`
- `src/api/menu.js`
- `src/api/order.js`
- `src/styles/conveyor-belt.scss`
- `src/styles/variables.scss`
- `public/images/ui/b/`
- `public/images/ui/c/`

### `themev1` 专项

- `src/components/display/midnight/StationPlatformScene.vue`
- `src/components/display/midnight/StationCartTransfer.vue`
- `src/styles/themes/midnight-station.scss`
- `themev1` 对上述主页、舞台、购物车、功能台、进度、AI、招牌屏、转场、设置、菜单、导航和订单组件的全部差异
- `themev1` 阶段报告与视觉报告

### `themev2` 已有素材

- `public/images/ui/midnight-station/background.png`
- `public/images/ui/midnight-station/locomotive.png`
- `public/images/ui/midnight-station/carriage.png`

## 3. 已有两套主题总结

### `zhenxian`

- 3840×1080 海滩/浅水背景一次性建立完整环境；
- 菜品使用独立浅水漂流托盘图，运动与水面语义一致；
- 特殊事件是占多个槽位的小船，并用 Canvas 依据真实速度产生浪花；
- 购物车、按钮、进度、状态图和转场均来自同一海滩素材系列；
- CSS 主要负责布局、裁切和交互状态，不负责重新绘制整片海滩。

### `xiaoxin`

- 3840×1080 海面/水下背景建立连续水域；
- 菜品使用贝壳托盘；
- 周期事件为分层海龟，身体部件独立运动并配合气泡/涟漪；
- 购物车、功能按钮、进度条和转场按相同文件接口替换；
- 旧背景带二维码和宣传文字，是遗留缺陷，V2 不继承。

### 场景感强于普通 CSS 页面的原因

两套主题都先回答“用户身处什么环境”，再回答“UI 放在哪里”。背景、载具、周期事件、环境介质、购物车、按钮和转场共享插画世界；商品移动也有场景内的物理解释。CSS 只是把素材组织成可交互系统，因此不会呈现为一堆互不相关的卡片和线条。

## 4. `themev1` 失败总结

`themev1` 从 `master` 分出后约新增 6574 行、修改 24 个文件，但第三主题核心依赖 1600×660 巨型内联 SVG、CSS 建筑、CSS 轨道、CSS 盘车、CSS 站牌和大量小号等宽文字。

主要失败原因：

1. SVG/CSS 细节在放大后呈平面、塑料和重复 pattern 质感；
2. SVG、顶部 CSS 天际线、购物车、盘车和弹窗各有独立透视/光源；
3. 依赖 `PLATFORM`、`ROUTE 03`、`深夜食堂`、编号等文字才能说明主题；
4. 缺少真实候车设施、设备、磨损和远端铁路关系；
5. 月亮、栏杆和线条只是符号，没有组成完整站台；
6. 大量 8–14px 文字在 3840 屏幕上变成装饰噪声；
7. 1600×660 SVG 使用 `preserveAspectRatio="none"`，在 32:9 下横向变形；
8. 周期事件只是 126–176px 的小线路节点，不是可识别列车；
9. 同一水平流按 scale/opacity 轮换成三条假深度车道，空间逻辑不真实；
10. 原 AI 角色、纸票面板、CSS 盘车和 SVG 月台不属于同一材质世界；
11. 场景和组件内存在大量硬编码英文/中文，绕开 i18n；
12. 大量代码投入主要增加了 CSS 数量，没有形成统一美术质量。

### 明确禁止带入 V2

- `StationPlatformScene.vue` 和其巨型 SVG；
- CSS 拼装月亮、城市、建筑、轨道、盘车、轮子、站牌；
- 三视觉车道假纵深；
- 小线路节点周期事件；
- 任何硬编码装饰文字；
- 固定寿司图替代真实商品；
- 用发光细线和小等宽字掩盖缺少实体素材的问题。

### 可保留的逻辑思想

- 第三主题注册、预加载、切换遮罩和 `themeKey` 传递；
- 现有单一商品滚动流；
- 特殊事件占多槽位；
- 加购视觉副本飞向购物车的目标定位思想；
- 主题 token、focus、disabled、ARIA 和 reduced-motion；
- 点击、数量、删除、下单成功/失败与视觉短反馈的挂钩。

这些仅作逻辑参考，不复制 `themev1` 实现。

## 5. 3840×1080 页面真实结构

在目标分辨率下，现有布局的主要固定区间为：

- 顶部：196px；
- 中央舞台：约 671px；
- 底部：213px；
- 页面左右 padding：顶部 28px、舞台 18px；
- 进度条：居中，最大宽 941px；
- 底部左/右购物车：各 827×217；
- 中央功能台：790×217；
- 三者加两个 30px 间距，总宽约 2504px，居中显示；
- 详细菜单：现有 1300×600，分别从左右购物车上方展开；
- 全局 `SushiNavigation`：100vw×100vh 覆盖层，保留左右购物车；
- 招牌菜屏：只覆盖舞台，不覆盖底部操作；
- 设置、订单历史、呼叫服务员和主题转场位于覆盖层。

必须持续支持：真实商品接口、菜品点击、左右加购、双购物车、数量增减、删除、下单、分类、拖拽、惯性、暂停、方向、速度、AI 推荐、语音助手、订单历史、设置、呼叫服务员、招牌菜、游戏进度和主题切换。

## 6. 母背景结果

- 最终路径：`public/images/ui/midnight-station/background-v2.png`
- 尺寸：3840×1080（已读取文件验证）
- 模式：RGB
- 文件大小：4,062,626 bytes
- 是否含文字：否；无站名、路线、编号、品牌、标语、AI 文本、菜名或水印
- 是否画死动态列车：否
- 是否画死信号亮态：否；信号壳保留，灯面未点亮
- 生成方式：OpenAI 内置图片生成工具；两轮候选 + 一轮定向编辑；最终机械中心裁切/高质量缩放到精确尺寸

### 场景识别结果

无标题查看时，顶棚、铁柱、架空线、多组轨道、道岔、站台触觉铺装、长椅、行李车、站务房、配电箱和低位配送轨道共同构成明确的深夜车站。冷夜光、暖站灯和湿地反射统一，缩小预览仍可识别。阶段自检结论：通过。

### UI 留白与背景对应

| 区域 | 坐标 | 结果 |
| --- | --- | --- |
| 顶部品牌/进度/AI | `y=0–196` | 暗顶棚与夜空，外侧灯具；可覆盖 |
| 菜品运动 | `y=196–805` | 配送轨道横向连续，中央低对比；可覆盖 |
| 分类/暂停 | `y≈805–867` | 深色地面，轮廓稳定；可覆盖 |
| 左购物车 | `x≈668–1495, y=867–1080` | 暗湿地面；可覆盖 |
| 中央功能台 | `x≈1525–2315, y=867–1080` | 低频地面纹理；可覆盖 |
| 右购物车 | `x≈2345–3172, y=867–1080` | 暗湿地面；可覆盖 |
| 菜单展开 | `y≈217–817` 左右侧 | 背景不使用高对比文字；应由不透明菜单面板隔离 |

独立校验文件：`docs/theme-midnight-station-v2/background-v2-layout-preview.html`。

## 7. 动态组件规划

### 普通菜品

选定“单件低位铁路托盘车”。透明外壳和轮组与背景配送轨道对齐；真实菜图、菜名、价格、AI、售罄状态继续用 DOM。滚动、拖拽、惯性、方向、速度和暂停完全复用现有逻辑。

### 周期特殊事件

选定“大型夜间餐饮特快”：机车 + 餐车，建议宽 1100–1600px、高 300–420px，占 4–6 个普通槽位。车灯、窗光和蒸汽独立分层，招牌菜触发区域为 DOM。用户无需仔细观察即可知道有列车通过。

### 点餐进度

继续三层图片 + CSS clip + DOM 百分比：站务线路板、琥珀线路灯、旧金属边框。100% 使用绿色通行图形和 DOM 状态，不把文字画入图片。

### 点餐台

中央功能区设计为实体站务/餐饮服务台；左右购物车设计为行李/餐票整理台。保留当前尺寸和全部 emits，仅替换外壳、按钮视觉和反馈动画。

## 8. 动态资产清单

下一阶段核心资产：

- 普通托盘车外壳、轮组、接触阴影；
- 特殊机车、餐车、可选服务车；
- 车窗暖光和车灯层；
- 左右购物车外壳与槽位；
- 中央站务台外壳；
- 菜单夹/灯箱外壳；
- 进度条底图、填充、边框；
- 招牌菜展示屏外壳；
- 主题转场列车近景剪影；
- 红/琥珀/绿信号灯面；
- Canvas 蒸汽、微尘、轮下水雾。

完整尺寸和实现方式见 `PHASE_01_COMPONENT_MAPPING.md`。

## 9. 现有素材接受 / 拒绝

| 文件 | 判定 | 说明 |
| --- | --- | --- |
| `background-v2.png` | **ACCEPTED** | 最终母背景，3840×1080、无文字、完整车站、UI 留白合格 |
| `background-v2-a.png` | 候选保留 | 可识别，但配送轨道语义弱于 B |
| `background-v2-b.png` | **ACCEPTED** | 与最终主方案同图，作为生成过程留档 |
| 原 `background.png` | **REJECTED** | 2172×724，写死大量文字/编号/时刻，高对比信息板占 UI |
| 原 `locomotive.png` | **REJECTED** | 写死中文、蒸汽方向固定、视点与轨道未校准、画风不统一 |
| 原 `carriage.png` | **REJECTED** | 写死中文与固定寿司，不能承载真实商品数据，烟雾和材质不匹配 |

被拒素材本阶段未删除，防止破坏现有分支历史；Phase 02 不得引用。

## 10. 下一阶段需要修改的组件

按风险从低到高：

1. `ConveyorBeltDisplay.vue`
2. `SettingDialog.vue`
3. `SceneTransitionOverlay.vue`
4. `ScenicDishStage.vue`
5. 新 `MidnightDishTrolley.vue`
6. 新 `MidnightExpressPass.vue`
7. `TopPlateProgress.vue`
8. `CartPanel.vue`
9. `CenterFunctionPanel.vue`
10. `VirtualDiningAssistant.vue`
11. `FeaturedDishScreen.vue`
12. `MenuView.vue`
13. `SushiNavigation.vue`
14. `OrderHistoryDialog.vue`
15. `AmbientSceneEffects.vue` / 新粒子层

顺序原则：先打通主题注册和安全切换，再做普通配送车，然后做大列车和底部设施，最后处理覆盖层与环境细节。

## 11. 本阶段实际新增 / 修改文件

新增：

- `docs/theme-midnight-station-v2/PHASE_01_EXISTING_THEME_AUDIT.md`
- `docs/theme-midnight-station-v2/PHASE_01_VISUAL_DIRECTION.md`
- `docs/theme-midnight-station-v2/PHASE_01_COMPONENT_MAPPING.md`
- `docs/theme-midnight-station-v2/PHASE_01_REPORT.md`
- `docs/theme-midnight-station-v2/background-v2-layout-preview.html`
- `public/images/ui/midnight-station/background-v2-a.png`
- `public/images/ui/midnight-station/background-v2-b.png`
- `public/images/ui/midnight-station/background-v2.png`

修改既有源代码：无。

修改既有主题素材：无。

## 12. 构建检查

- 命令：`npm run build`
- 结果：通过
- Vite：6.3.5
- 转换模块：1791
- 构建时间：约 14.30s
- 错误：无
- 已有警告：Dart Sass `darken()` / slash division 弃用警告；Element Plus、Phaser 等 chunk 超过 1000kB。均来自现有代码，与本阶段新增静态资产/文档无关。
- 初次在受限沙箱中执行时，Node 因 `C:\Users\10851` 的 `lstat` 权限失败；获准在沙箱外执行同一构建后通过。这不是项目 blocker。

## 13. 风险与 Phase 02 验证点

1. 内置生成器源图低于原生 3840 宽，最终图经高质量缩放；Phase 02 必须在真实 3840 物理屏 100% 比例检查细节，不足处用局部素材补强或重新出原生高分辨率美术稿。
2. 动态托盘车和列车必须以最终背景作为透视/光照参考生成，不能单独出图后强行缩放。
3. 背景配送轨道位于主舞台中下部；接入时要用真实页面截图校准轮组接触线。
4. 顶部和底部现有文字偏小；Phase 02 需为 3840 单独提高字号，同时验证 1920 降级。
5. 菜单与导航当前有固定 1300px / 3000px 画布和拖拽边界；只改外观时要防止破坏原交互，并补充按钮/键盘替代。
6. 背景 PNG 约 4.06MB、解码约 11.9MiB；应预加载，发布时评估无损 WebP/AVIF，但不能牺牲细节和色带质量。
7. 信号灯、蒸汽、车窗光必须为动态层；不可在后续重新烘焙进背景。

## 14. 验收结论

- 已完整研究两套正式主题：是
- 已解释其场景感来源：是
- 已专项审计 `themev1`：是
- 未以 `themev1` 为 V2 基础修补：是
- 已审计真实业务组件和约束：是
- 已完成 3840×1080 母背景：是
- 背景无文字：是
- 背景可识别为深夜铁路月台：是
- 背景不是 CSS/SVG 拼装：是
- 已规划普通铁路托盘车：是
- 已规划大尺寸特殊列车：是
- 已规划进度条和点餐台：是
- 已映射现有 Vue 组件：是
- 已判定旧 locomotive/carriage：是，均 `REJECTED`
- 已形成资产清单：是
- 已输出全部阶段文档：是
- 未破坏旧主题和业务逻辑：是
- 已通过生产构建：是

`READY_FOR_PHASE_02`
