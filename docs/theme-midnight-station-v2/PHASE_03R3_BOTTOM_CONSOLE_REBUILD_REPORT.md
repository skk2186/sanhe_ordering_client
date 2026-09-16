# Phase03-R3 · Midnight Station 点餐控制区强制重构报告

## 1. 基线

- branch：`themev2`
- HEAD before：`48a658a93655c03fc7adc2c13c9f28bb0a340e39`
- HEAD after：`48a658a93655c03fc7adc2c13c9f28bb0a340e39`（修改保留在工作区；未执行 reset / restore / checkout，也未进入 Phase04）
- 保留：background-v3、foreground、MidnightDishTrolley、MidnightExpressPass、机械动画、delivery corridor、resize 修复、progress-hanger-v1 与当前顶部进度条。
- `VirtualDiningAssistant.vue` 本轮零修改，继续保持 FROZEN。

## 2. 为什么彻底废弃 v2 柜台

R2 的失败并非单纯坐标偏差，而是物理结构不足：购物台约 17% 的订单窗、偏浅的托盘面和中央台狭窄铭牌无法同时承载图片、名称、数量、加减、总价和六个中央入口。在 v2 上继续增加百分比坐标只能形成“稳定的错误布局”。因此正式代码已停止引用 `cart-counter-left-v2.png`、`cart-counter-right-v2.png`、`service-console-v2.png`；三张旧文件只保留作历史参考。

## 3. interaction-first wireframe

先建立无美术 3840 线框，再生成资产：

- 左台：`4 商品槽 + 1 大订单区`；右台：`1 大订单区 + 4 商品槽`。
- 订单区占约 22%～25%，每个商品槽约 16%～18%。
- 每槽明确拆为图片区、名称区、`- / 数量 / +` 控制区；订单区明确拆为预览、下单、count、total。
- 中央台固定为成熟结构：大左菜单 / 导航 / 点餐记录 / 设置 / 呼叫店员 / 大右菜单；中部为严格 2×2，不再自由散落。
- 线框中商品预览 118×118px、数量按钮 52×52px、订单预览 108×108px，确认无重叠后才进入资产生成。

文件与截图：

- `preview/phase03r3-bottom-wireframe.html`
- `screenshots/phase03r3-wireframe-3840.png`

## 4. 新 v3 资产

- `public/images/ui/midnight-station/cart-counter-left-v3.png`
- `public/images/ui/midnight-station/cart-counter-right-v3.png`
- `public/images/ui/midnight-station/service-console-v3.png`

购物台使用更大、更陡的可见台面，直接画出四个托盘、四组控制底座、名称铭牌和独立订单窗；中央台直接按两侧菜单 + 中间 2×2 功能区塑造物理结构。资产不含中文、英文、数字、价格、商品图、Logo、伪文字或水印。左侧资产生成后的非内容棋盘底已清为真实透明通道，未用 CSS 遮盖补救。

## 5. 购物台尺寸结构与 v3 锚点

3840 下单台实际组件为 1050×300px。左台四槽从左至右，订单区在右；右台为独立坐标，订单区在左，未镜像 DOM。

`MIDNIGHT_CART_V3_ANCHORS` 为每一槽直接定义最终矩形：

- `imageRect`
- `nameRect`
- `minusRect`
- `quantityRect`
- `plusRect`
- `removeRect`

订单区直接定义：

- `previewRect`
- `labelRect`
- `countRect`
- `totalRect`
- `buttonRect`

关键内容不再使用“一个槽 rect + item-info/controls inset”二次猜测。DOM 只从最终 rect 生成 CSS variables；图片、名称和每个 button 都直接落在资产对应实体位。

## 6. 中央台尺寸结构与 v3 锚点

3840 下中央台实际组件为 900×300px。`MIDNIGHT_CONSOLE_V3_ANCHORS` 直接定义：

- `leftMenuRect`
- `navigationRect`
- `historyRect`
- `settingsRect`
- `waiterRect`
- `rightMenuRect`

左右菜单为 175.5×133.5px 的主入口；中间四功能保持上排导航/记录、下排设置/呼叫，与既有主题成熟空间关系一致。所有交互仍为原生 `button`，保留 emit、ARIA、title、focus-visible、hover 与 disabled 行为。

## 7. R2 vs R3 硬性像素对比（3840）

下表 R2 数值由基线提交中的 827×217 / 790×217 组件及已提交百分比几何换算；R3 数值来自浏览器 `getBoundingClientRect()` 实测。

| 项目 | Phase03-R2 | Phase03-R3 | 结果 |
| --- | ---: | ---: | --- |
| 单侧购物台 | 827×217px | 1050×300px | 台面外接面积 +75.5% |
| 商品图片区 | 约 141.4×42.1px（槽高 73.8px 内仅 57%） | 154.3×72.6px | 图片承载高度 +72.4% |
| +/- 可见/点击区 | 约 30×30px | 44.6×44px | 达到 44px 热区要求 |
| 数量字号 | 上限 26px | 29px | 数字更清楚且固定居中 |
| 商品名字号 | 上限 22px | 23px | 固定 150.1×21.9px 铭牌，不再侵入控制区 |
| 订单区 | 约 142.2×82.5px | 225.8×132px | 面积约 +154% |
| 订单预览 | CSS 上限 72px，受 82.5px 四行网格继续压缩 | 110×82.2px | 3840 双边均 ≥80px |
| 中央台 | 790×217px | 900×300px | 台面外接面积 +57.5% |
| 左/右菜单入口 | 约 126.4×62.9px | 175.5×133.5px | 高度 +112% |
| 导航入口 | 约 128×54.3px | 155.7×57px | 独立承载位 |
| 点餐记录入口 | 约 191.2×36.9px | 162×57px | 牺牲冗余宽度换取 +54% 高度 |
| 设置入口 | 约 101.1×43.4px | 155.7×60px | 面积约 +113% |
| 呼叫店员入口 | 约 96.4×45.6px | 162×60px | 面积约 +121% |

R3 中央实际字号：菜单 30px、导航 28px、点餐记录 26px、设置 24px、呼叫店员 24px；购物商品名 23px、数量 29px、订单 count 29px、总价 22px。

## 8. 商品预览、订单区与数量控件

- 左右各真实加入 2 件商品后截图；商品图片、名称、删除、数量、加减均在对应实体槽内。
- 订单窗同时容纳代表商品预览、下单、`2/4` 与总价；不再纵向塞入窄角落。
- 3840 订单预览实测 110×82.2px；1920 实测 70×60.3px。
- 3840 +/- 实测 44.6×44px；1920 为 34×34px，仍保持清晰可见与稳定热区。
- 数量变化真实执行 `1 → 2 → 1`，数字未位移、未重叠。

局部证据：

- `screenshots/phase03r3-left-cart-empty.png`
- `screenshots/phase03r3-left-cart-filled.png`
- `screenshots/phase03r3-right-cart-filled.png`
- `screenshots/phase03r3-order-zone.png`
- `screenshots/phase03r3-quantity-controls.png`
- `screenshots/phase03r3-center-console.png`

## 9. 3840×1080 实测

PASS。

- 三套 v3 设施均完整显示，v2 正式引用为 0。
- 左右各 2 件真实商品；数量按钮、删除、订单预览、count、total 均可读。
- 66 个普通配送节点、3 个特殊列车节点仍在；background-v3、轨道和配送走廊未重做。
- 3840 → 1920 → 3840 后测量恢复为 1050×300 / 900×300，商品流与特殊列车数量仍为 66 / 3，无空屏。
- 顶部 progress-hanger-v1 与原进度逻辑未修改；VirtualDiningAssistant 未修改。

截图：`screenshots/phase03r3-midnight-3840-full.png`。

## 10. 1920×1080 实测

PASS。没有整组 `scale(.5)`；组件按容器宽度与局部 clamp 降级。

- 单侧购物台 694×220px。
- 商品图 102×53.2px，商品名 19.584px。
- +/- 34×34px，数量字号 23.04px。
- 订单窗 149.2×96.8px，预览 70×60.3px。
- 中央菜单 93.6×97.9px / 21.12px；导航 83×41.8px / 19.584px；其余核心入口 18.816px。
- 商品流与特殊列车仍为 66 / 3，设施热区与图像保持对齐。

截图：`screenshots/phase03r3-1920-full.png`。

## 11. 业务回归

PASS。

- 左侧加购 2 件、右侧加购 2 件。
- 一件商品执行数量 `1 → 2 → 1`，按钮和数字均稳定。
- 删除按钮、下单入口保持原生 button；购物车状态、总价与 count 使用原业务计算，没有改 API 或购物逻辑。
- CenterFunctionPanel 六个入口保留原有 emits 与真实 button；本轮只更换资产和位置变量。
- pause、方向、速度、分类、拖拽、惯性与 resize 代码未改。

## 12. 旧主题回归

PASS。

- `zhenxian` 与 `xiaoxin` 均在加载完成状态截图。
- 两主题下 `.midnight-cart-facility` 实测 `display: none`，v3 尺寸、锚点和资产未污染旧主题。
- 旧主题原购物区、中央功能台、顶部进度与助手保持原表现。

截图：

- `screenshots/phase03r3-zhenxian-regression.png`
- `screenshots/phase03r3-xiaoxin-regression.png`

## 13. Build

- `npm run build`：PASS（仅仓库既有 Sass deprecation 与 chunk-size 提示）。
- `npm run test:assistant`：PASS，26/26。

## 14. 已知问题与结论

剩余问题仅为资产边缘高光和 hover 灯效可继续精修，不影响 1～15 项核心视觉验收、热区、业务或响应式布局。品牌、覆盖层、完整设置弹窗、菜单、历史、招牌菜大屏与转场均未进入本轮。

Phase03-R3 结论：`READY_FOR_PHASE_04`。
