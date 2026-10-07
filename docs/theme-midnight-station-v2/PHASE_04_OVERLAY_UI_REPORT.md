# Phase04 — Midnight Station 覆盖层、菜单与弹窗统一

## 1. 分支与基线

- branch：`themev2`
- HEAD before：`9feb18401c6e29cf4855d968bf38c39fc4b20abd`
- HEAD after：`9feb18401c6e29cf4855d968bf38c39fc4b20abd`
- 本轮成果为工作区修改，未自行提交或推送；没有切换分支、reset、restore 或覆盖已有成果。
- 开始前工作区干净，已阅读 Phase01 视觉方向和 Phase03-R5 几何回归报告。

## 2. 修改文件

- `src/views/customer/MenuView.vue`
- `src/components/menu/SushiNavigation.vue`
- `src/components/order/OrderHistoryDialog.vue`
- `src/components/display/SettingDialog.vue`
- `src/components/display/FeaturedDishScreen.vue`
- `src/components/display/SceneTransitionOverlay.vue`
- `src/views/display/ConveyorBeltDisplay.vue`：仅菜单主题参数、Midnight 菜单覆盖层挂载和转场时序接线，没有修改主页面几何。
- 新增 `src/styles/themes/midnight-overlays.scss`：覆盖层专用材质/字号/焦点样式 mixin。
- 新增 `tests/midnight-overlays.test.mjs`：隔离、共享业务脚本、冻结组件和转场时序回归保护。
- 本报告及 `screenshots/phase04-*.png`。

## 3. 新增资产与实现边界

没有新增运行时图片或大型依赖。复用现有 Midnight 背景缩略图和 `special-express.webp` 转场列车。

Midnight 皮肤使用深绿漆面、黄铜压边、暗色站务分区和米色餐单/档案纸。所有名称、价格、状态、按钮文案仍是 DOM。没有生成包含文字的素材，没有第二套弹窗业务或商品数据。

ui-ux-pro-max 和 better-layout 的规则用于商品优先、清晰分组、响应尺寸、按钮热区和键盘焦点；没有借此扩展主页面设计范围。

## 4. MenuView

保留原有分类、每页八项商品、分页、side、加购和关闭逻辑。Midnight 使用金属菜单架和米色菜单页，图片、名称、价格有独立信息区；移除本主题下旧卡通 logo。

真实页面发现菜单原先困在底栏 stacking context 中，关闭位置被主舞台分类条压住。使用同一个 template 的 Teleport，仅 Midnight 挂到 body；旧主题禁用 Teleport，维持原有挂载位置。没有修改主舞台层级。

实测：左菜单加购成功；右菜单加购后右购物车显示数量 1；分类切换成功；关闭后菜单 DOM 数量为 0。当前接口分类只有一页，验证了 `1 / 1` 和禁用的分页边界，没有声称完成真实多页数据翻页。

## 5. SushiNavigation

保留原有无限商品板、拖拽、分类式检索、搜索结果数量、左右加购、数量、删除、下单 emit、loading/error/retry/close。没有新增与原业务不同的文本搜索。

站务商品板采用暗绿分区、黄铜分类牌和米色商品信息栏。商品区域与底部购物操作分隔；1920 下保留原有可拖动大商品板，同时调整本覆盖层的响应分配，保证左右购物区和返回入口可见。

实测：真实商品分别进入左右购物车；左侧数量 `1 → 2 → 1`，数字没有位移；右侧删除后数量为 0；分类检索切换显示相应商品；关闭返回主页面。临时注入隔离错误态后，点击原 retry 按钮重新调用真实接口，恢复 18 个商品/分类节点。错误展示值未写入业务源码或后端。

## 6. OrderHistoryDialog

共享 table、order items、数量、时间、金额、合计、店员呼叫、结账提示和关闭逻辑原样。皮肤为深绿档案架、米色记录纸、黄铜分隔和暖色操作按钮，表格仍正常阅读。

当前测试会话没有真实历史订单。主截图记录实际空历史；另保存有内容的隔离展示样例，使用真实接口商品“饮料”、数量 2、金额 ¥8.00，时间明确标注“展示测试”。此样例只给现有组件传入展示数据，没有创建或修改订单，刷新即清除。

实测：打开、表头/合计、样例行内容、呼叫店员确认入口、取消呼叫、返回均正常；返回后历史 DOM 数量为 0。没有确认呼叫或提交真实结账。

## 7. SettingDialog

业务脚本与审核基线逐字一致，主题、默认值、语言、语音设置、方向、速度、localStorage/store/emits 保留。仅把原主题/方向点击容器改为真实 button，保留既有 handler，增加 pressed/disabled 和焦点反馈。button 的字体完全继承，避免浏览器默认按钮字体改变旧布局。

Midnight 调度柜限定于 `[data-theme="midnight-station"] .luxury-settings-dialog`；没有全局改 Element Plus。保留三个真实主题缩略图，Midnight 正确显示当前 v3 月台背景。覆盖层内部既有语音设置选项只做弹窗皮肤，不涉及冻结的 VirtualDiningAssistant。

实测方向更新为 `right`，速度由 1 更新为 1.6，关闭后状态保留。系统设置标题实测 36px、颜色 `rgb(255,241,208)`，修复了被既有默认弹窗标题样式覆盖的问题。

## 8. FeaturedDishScreen

共享商品/poster/video、视频失败回退、close、自动结束和 promo 业务脚本未修改。Midnight 使用局部黄铜吊挂宣传框、深色内衬、暖色标记和 44px 关闭按钮。真实媒体采用 contain，避免商品画面被框架裁掉。

实际触发现有特殊列车上的 promo 按钮，显示真实商品“小蛋糕”海报；12 秒现有 poster 回退定时正常收回，DOM 数量变为 0；手动关闭也变为 0。1920 下仍能完整显示和关闭。

当前真实接口没有命中金枪鱼视频活动，因此本轮实际验证的是现有真实商品 poster promo，不声称现场完成视频播放测试。视频/ended/自动收回的共享代码通过基线脚本一致性保护，没有制造第二套活动。

## 9. SceneTransitionOverlay

复用既有 Midnight 列车、夜色遮挡和站灯，不画新车、不加长期驻留效果。保留原 `covering → covered → revealing → idle`、主题应用和关闭逻辑。

只有涉及 Midnight 的切换使用 600ms 覆盖、最多额外 200ms 遮挡预加载等待、450ms 揭幕。资产预加载在覆盖阶段并行开始，避免当前失效商品图片让原 2400ms 预加载等待变成长黑屏。旧主题之间仍使用原 1700ms/1050ms；减少动态效果模式保留。

浏览器记录从点击到恢复 idle：

| 切换 | 实测总时长 | 最终状态 |
| --- | ---: | --- |
| zhenxian → Midnight | 1322.3ms | midnight-station / idle |
| Midnight → xiaoxin | 1340.9ms | xiaoxin / idle |
| xiaoxin → Midnight | 1315.7ms | midnight-station / idle |

## 10. 3840 验证

通过本机 Chrome 的真实 3840×1080 viewport 检查，并保存页面截图，不是设计稿。使用已有本机后端，未修改接口配置文件。

| 覆盖层 | 实测尺寸 | 文字/媒体 |
| --- | --- | --- |
| MenuView | 1540×680 | 名称约24px，价格约30px，图片约196px高 |
| Navigation | 3840×1080 | 商品位240×320，图片220×220，名称约24px，价格约28px |
| History | 外框1720×约788 | 正文约24px，独立表格行；样例行无重叠 |
| Settings（最终） | 1300×810.31 | 标题36px，按钮约26px，三主题预览完整 |
| Featured | 1000×568 | 真实商品海报、局部吊架、44px关闭区 |

主页面几何实测仍为：进度中心 X=1920，底栏213px，购物车217px，中央功能区217px。没有恢复超高底栏或后景柜台。

## 11. 1920 验证

运行中从 3840 切到 1920，不整窗 scale。实际打开菜单、导航、历史、设置和 Featured。

- MenuView：1320×680，位于 (300,200)，分类/商品/关闭均在屏内。
- Navigation：1920×1080，商品位220×290、图片200×200；保留横向拖动检索板，底部左右购物区和返回按钮可见。
- History：1720×约788，位于 (100,146)，样例表格、时间、金额和操作区可读。
- Settings：约1300×730，高度受 viewport 限制，主题预览图150px；关闭入口在屏内。
- Featured：局部响应覆盖，海报和关闭入口在屏内。
- 不刷新切回 3840 后主舞台仍有66个普通托盘车节点；原 resize 修复没有修改或回退。

## 12. Midnight 业务回归与冻结检查

已实际验证菜单开关/分类/左右加购，导航检索/左右购物/加减/删除/错误重试/关闭，历史显示/呼叫取消/关闭，设置方向/速度/主题切换/关闭，Featured 触发/自动结束/关闭，以及运行中双尺寸切换。

未提交真实订单、结账或呼叫请求。下单入口和 emit 保留，购物车业务源码未修改；本轮没有声称执行新的真实订单提交。

测试对 VirtualDiningAssistant、ScenicDishStage、CartPanel、CenterFunctionPanel、TopPlateProgress、MidnightDishTrolley、MidnightExpressPass 进行审核基线文件一致性断言，全部通过。背景、轨道、配送走廊、品牌和其他主舞台资产未修改。

## 13. zhenxian 回归

实际打开主页面、菜单、导航、历史、设置并保存截图；各覆盖层的 `--station-metal` 为空，仍使用原皮肤。菜单保留原1300×600位置；历史原1500×780；主页面共享购物区不变。

对原设置 div 结构的临时浏览器对照测量为1037.5px，最终继承字体的真实 button 结构同为1037.5px，没有引入新的尺寸差异。该旧设置布局原有较高、需要滚动的表现没有反向改造。

## 14. xiaoxin 回归

实际打开主页面、菜单、导航、历史、设置并保存截图；Midnight 变量为空，仍保留原白色商品导航、米色菜单、历史和设置皮肤。菜单/历史尺寸与原共享结构一致，主题选择缩略图未损坏。

旧主题 Featured 的业务脚本未修改，新增皮肤同时要求 Midnight theme 和 `.is-midnight-station`；旧主题之间转场时序保持原值。本机数据没有可触发旧视频活动，未声称实际播放旧视频。

## 15. 构建

`npm run build` 通过。存在既有 Sass `darken`/除法弃用提示和 Phaser/Element Plus 大包提示，没有为本轮引入大型框架或新4K素材。

## 16. 测试

- `npm run test:assistant`：26/26。
- `npm run test:voice`：9/9。
- 原 geometry 测试：3/3；原 menu API 测试：2/2。
- 新 overlay 回归测试：5/5。
- 最终六个测试文件合并执行：45/45。
- `git diff --check`：通过。
- 仓库没有 `test:stage-geometry` npm script，使用现有 `tests/midnight-geometry.test.mjs` 直接执行，没有增加重复测试基础设施。

## 17. 截图清单

均保存在本目录 `screenshots/`：

- `phase04-midnight-menu.png`
- `phase04-midnight-navigation.png`
- `phase04-midnight-history.png`（真实空历史）
- `phase04-midnight-settings.png`
- `phase04-midnight-featured.png`
- `phase04-midnight-transition.png`
- `phase04-midnight-3840-full.png`
- `phase04-midnight-1920.png`
- `phase04-zhenxian-regression.png`
- `phase04-xiaoxin-regression.png`

补充：四个覆盖层的1920截图、Featured 1920截图、历史有内容隔离样例双尺寸、导航错误态、传送设置页，以及旧主题菜单/导航/历史/设置截图。

## 18. 已知问题与验证边界

1. 真实商品“霸气橙子”仍引用失效的48081图片地址，“33333”没有商品图片；各主题均能复现，本轮未修改商品数据。
2. 本机没有真实历史订单和金枪鱼视频活动；历史有内容展示与错误态验证明确使用隔离样例，实际 promo 为真实商品海报。
3. 菜单当前真实分类只有一页，未制造多页商品或订单。
4. 旧主题设置原有较高布局保持，不因为 Midnight 皮肤反向重做旧主题。
5. 米色纸张纹理、图标和小型 hover 尚可微调；这是视觉收尾项，不需要改共享结构。

## 19. 下一阶段建议

保留所有冻结边界，只做最终视觉细节、素材/图片地址的独立数据核对，并在有视频活动和真实历史的测试环境补充媒体/历史数据验收。不要重新扩张主页面结构或语音助手主题化。

## 20. 最终状态

`READY_FOR_PHASE_05_WITH_NOTES`。本轮六覆盖层已接入隔离 Midnight 皮肤，核心共享业务和冻结组件未回退；上述环境/数据验证边界和轻微视觉细节已明确记录。本任务到此停止，不开始 Phase05。
