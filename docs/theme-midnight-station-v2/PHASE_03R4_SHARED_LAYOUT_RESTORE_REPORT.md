# Phase03-R4 · 文字归位与共享布局回归报告

## 1. 基线

- branch：`themev2`
- HEAD before：`2254bc6e679fa5ce8c6a7664d153dc691ad3bf0a`
- HEAD after：`2254bc6e679fa5ce8c6a7664d153dc691ad3bf0a`（修改留在工作区，未提交或推送）
- 开始时工作区干净。未 reset / restore / checkout，未修改 master 或 themev1。

## 2. R3 为什么仍然失败

接受人工验收结论：R3 的资产改善不能证明文字排布通过。商品、数量、订单与中央入口均由逐项绝对坐标控制，绕过了原有 flex 层级；文字保持平面却贴在斜面上，形成明显的不协调。此前报告将“节点存在、点击可用”过度等同于视觉通过。

本轮还发现两项实际共享回归：旧主题按钮素材已有文字，新增 DOM 文字再次叠印；订单计数没有明确左边界，原生 button 的静态起点导致计数偏到按钮外。助手文件仍留有 79 行 Midnight 配色、纸张、渐变和底座 CSS，R2/R3 的冻结声明并不完整。

## 3. 牌匾只保留回转寿司

仅 Midnight 隐去 DOM 的 `AI DINING TABLE` 与 `TABLE ... SEATS`；旧主题内容不变。原牌匾资产保留，容器 440×160px，中文位于主体信息面中央（视觉中心约 61% 高度），取消旧的多行 padding。中文使用 30～38px、自然字间距，没有 skew 或变形。

证据：`screenshots/phase03r4-brand-plaque.png`。

## 4. 进度文字与充能归位

- 标题居中在左铭牌：x=19%～43%，y=20%～38%。
- 百分比居中在右铭牌：x=57%～81%，y=20%～38%；取消原先 translateY(-50%) 造成的上移。
- 删除纯色/渐变矩形充能条。亮态现在使用同一设备资产的第二层，仅裁切资产内真实灯格，亮度变化不会另画一个条。
- 灯格裁切：`inset(49.5% right 39% 15%)`；right=`85 - 0.70 × progress`，0% 无亮态，100% 覆盖全部实际灯格。
- 顶部进度从绝对居中覆盖恢复为中间栏正常排布，并用 flex 消除 grid 的内在宽度溢出；1920 下不再遮挡牌匾或助手。
- progress 计算、formatted、完成态、ARIA 和动态更新均未改，progress-hanger-v1 与设备资产未换。

真实本机下单后进度为 10%，裁切为 `inset(49.5% 78% 39% 15%)`。证据：`screenshots/phase03r4-progress.png`。

## 5. 底部回归共享逻辑

结论：是，三个主题应使用成熟的共享结构，而不是逐项对位的独立系统。

CartPanel 继续使用同一个 template、同一个 item-group flex 顺序、同一个四槽 v-for、同一个商品图/信息/控制层级，以及原有 side 决定订单在左或右的规则。Midnight 不再控制单件商品的 x/y 坐标。商品图、名称/价格、数量控制通过正常的纵向 flex 信息层排布，数量始终在 +/- 之间。订单内容改为正常纵向信息组，不再逐项 absolute。

CenterFunctionPanel 继续使用同一个 template 和共享 `.center-layout → .center-functions → 两个 .function-row` 层级：两侧菜单、中央上排导航/记录、下排设置/呼叫。所有入口均保留真实 button、原 emits 和 ARIA。

## 6. Midnight 保留的皮肤

保留深绿金属、黄铜边、米色菜单牌、暖色呼叫按钮，以及 v3 柜体下缘装饰。v3 资产只作为柜体皮肤，不再决定控件坐标；其上方不适配信息的斜面被裁掉，DOM 放在规则的正面信息板上。此取舍优先文字与共享排布，而非继续用透视设施强迫内容变形。

Midnight 的 CSS 仅覆盖容器尺寸、间距、颜色、边框、字体、背景/装饰与状态。没有新增主题分叉 template，没有第二套业务计算。

## 7. 删除的专属布局

- 删除 `MIDNIGHT_CART_V3_ANCHORS`、rectVars、localRect、midnightSlotStyle 与订单逐项坐标变量。
- 删除 `MIDNIGHT_CONSOLE_V3_ANCHORS` 与六入口坐标变量。
- 删除 Midnight 商品/文字/数量/加减的绝对定位，恢复 item-info、item-controls、center-functions、function-row 原正常结构。
- 删除助手全部 Midnight 主题覆盖，包括配色、渐变、纸张气泡、角色底座与伪元素。

五个相关代码文件合计约删除 408 行、增加 106 行（不含报告），没有扩大 Midnight 特例系统。

## 8. 旧主题污染修复

旧主题素材中已有完整按钮文案，不再显示新增 span 的重复印字；span 保留在共享 DOM 中，Midnight 皮肤显示它们，旧主题通过 visibility 隐藏，ARIA 不受影响。

旧主题订单区隐藏额外代表商品图、下单 DOM 标签与额外总价，不再覆盖原下单资产；保留 count 并明确 `inset-inline-start: 0`、border-box，使计数回到按钮内部。统一移除原生按钮的浏览器默认底色/边框，保留主题资产自身边框。

所有 Midnight skin 选择器严格限定 `data-theme="midnight-station"`；两个旧主题不使用 Midnight 尺寸、背景或坐标系统。ailaotou 存在历史样式，但当前 SCENES 不提供该入口，选择该 key 会按现有逻辑回落 zhenxian；未为本轮新增或修改主题切换。

## 9. 语音助手恢复与冻结

本轮只移除残留 Midnight CSS，未触及任何 script、template、TTS、推荐、状态机或 emits。三个主题的 assistant-recommendation-rail 实测 backgroundImage 均为 `none`，原气泡、角色和原 halo 保持共享风格。没有 Midnight 底座或额外贴图。

**FROZEN**：后续无用户明确授权不得修改 VirtualDiningAssistant 外观。

证据：`screenshots/phase03r4-assistant.png`。

## 10. 3840 验证

真实 Chrome，3840×1080：

- 左右各真实加入 2 件 API 商品；名称、价格、数量与按钮均位于正常信息层。
- 商品名 22px，名称/价格区 157×48px；商品图位 157×110px；订单预览 100×100px。
- +/- 静态 44×44px（鼠标 hover raise 时实测 48.4×48.4px），数量 26px。
- 中央菜单约 151.9×212px / 30px；中间四功能 26px。
- 进度标题 24px、百分比 30px，两者居中于各自铭牌。
- 助手无专属颜色和贴图，牌匾无额外英文。

截图：

- `phase03r4-midnight-3840-full.png`
- `phase03r4-brand-plaque.png`
- `phase03r4-progress.png`
- `phase03r4-bottom-full.png`
- `phase03r4-left-cart.png`
- `phase03r4-center-console.png`
- `phase03r4-right-cart.png`
- `phase03r4-assistant.png`

均位于 `screenshots/`。

## 11. 1920 与 resize 验证

1920×1080 的三套设施仍按同一 flex 层级排列：商品名 17px、价格 16px、数量 21px、+/- 34px、订单预览 65×65px，中央功能 20px、菜单 23px。顶部进度在中间栏内，不再伸向牌匾与助手。

真实执行 3840 → 1920 → 3840，不刷新；普通配送节点仍为 66、特殊列车节点仍为 3，购物车未重置。ScenicDishStage 和 ResizeObserver 修复代码零修改。

证据：`screenshots/phase03r4-1920-full.png`。

## 12. Midnight 业务回归

- 左加购 2 件、右加购 2 件：通过。
- +/- 与数量 `1 → 2 → 1`：通过，真实鼠标点击。
- 删除：通过，左侧有商品槽数由 2 变为 1。
- 左菜单与右菜单：真实打开各自菜单。
- 导航/搜索：真实打开全屏导航入口；仅验证入口，未修改导航界面。
- 点餐记录：真实显示历史订单表格。
- 设置：真实显示设置弹窗。
- 呼叫店员：真实显示确认窗口；未确认派送通知。
- 下单：在本机后端 49000 的测试桌 Y1（id=24）提交剩余 1 件土豆炒肉，左购物车清空，真实进度增加为 10%；未连接远端订单服务。该本机测试订单保留，未擅自删除订单记录。

预览使用仓库已有 VITE_API_PROXY_TARGET 环境变量接入运行中的本机后端，无 API 文件改动，无 mock 商品。

## 13. zhenxian 回归

截图加载完成后检查：四槽、商品信息、数量、订单 count 与六个中央入口排布正常；重复 DOM 文案消失，订单 count 位于原信息窗内。Midnight facility=`none`、额外 order preview=`none`、中心额外 span=`hidden`，助手背景=`none`。

证据：`screenshots/phase03r4-zhenxian-regression.png`。

## 14. xiaoxin 回归

同样检查四槽、购物车、名称、数量、订单窗及中央按钮；未使用 Midnight 布局或资产，无重复标签。上述 display/visibility/assistant background 实测结果与 zhenxian 相同。

证据：`screenshots/phase03r4-xiaoxin-regression.png`。

## 15. Build 与测试

- `npm run build`：通过，1805 modules，最终构建 29.98s；仅现有 Sass deprecation / chunk-size 警告。
- `npm run test:assistant`：26/26 通过。
- `git diff --check`：通过，仅 LF/CRLF 提示。
- 首次构建因沙箱 Node 用户目录 EPERM 无法运行，获准在沙箱外重跑成功；不是代码错误。

## 16. 布局原则检查

使用 better-layout 与 ui-ux-pro-max 的共享边缘、正常信息分组和可见控制原则，放弃逐字拟合斜面。Vue 专项查询两次无匹配，采用仓库现有结构与通用规则作为 fallback，没有生成新设计系统。

已检查：3840、1920、两次 resize、真实商品状态、所有中央入口。未验证：200% 浏览器 zoom、RTL、真实麦克风识别；本轮没有修改对应逻辑。

## 17. 已知问题

1. 真实商品“霸气橙子”图片 URL 指向未运行的 localhost:48081 文件服务，三个主题都有缺图；“33333”本身无图。这是已有真实数据问题，没有替换真实商品或修改 API。仍能识别名称、价格和数量。
2. 柜体装饰与前视信息板边缘可继续微调，但文字不再强行贴到透视斜面上。
3. 本机测试下单留下 1 件测试订单（7 元）；没有远端订单或服务员通知。
4. 完整菜单、历史、设置皮肤、招牌菜屏、转场仍未处理，严格属于 Phase04。

## 18. 阶段结论

共享排布和本轮文字修复已完成；数据缺图与轻微柜体装饰衔接保留 notes，不将这些说明成已解决。下一阶段建议状态：`READY_FOR_PHASE_04_WITH_NOTES`，仍以人工视觉验收为准。本轮未进入 Phase04。
