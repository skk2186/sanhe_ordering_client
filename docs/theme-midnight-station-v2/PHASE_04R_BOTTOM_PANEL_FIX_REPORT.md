# Phase04-R — Midnight Station 底部点餐区统一与购物车消失修复

## 1. branch

- `themev2`

## 2. HEAD before

- `175648c6d6aeda6d9510e0f463b027d7a5328f8d`

## 3. HEAD after

- `175648c6d6aeda6d9510e0f463b027d7a5328f8d`
- 本轮成果保留为工作区修改，未自行提交或推送；没有切换分支，也没有执行 reset、restore 或 checkout 覆盖已有成果。

## 4. 原底部视觉为何仍不成熟

Phase04 基线已经恢复共享几何，但 Midnight 底部仍缺少完整、连续的组件边界：左右购物区与中央功能区主要靠内部色块表达，三个区域缺少同一套外框、圆角、金属压边和层级；中央按钮的图形识别也不足。结果虽然可操作，却仍像若干零散控件，没有形成一组稳定的夜间站务控制台。

本轮没有再引入桌柜、独立锚点或 Midnight 专属 DOM，而是在既有共享尺寸上补齐皮肤：深绿漆面、黄铜边、暗木确认区、统一圆角和可识别图标。

## 5. 继承的共享结构

- `CartPanel` 继续使用同一套四槽、下单区、商品名、价格、数量、加减、删除和左右镜像顺序。
- `CenterFunctionPanel` 继续使用左菜单、中间两行功能、右菜单的共享 template 和原有 emits。
- 组件尺寸保持共享基线：购物区 `827 × 217px`，中央功能区 `790 × 217px`；没有扩大底栏或侵占轨道。
- 没有新增 Midnight 专属购物车状态、订单状态或功能入口逻辑。

## 6. 三块完整外框

Midnight 的左购物区、中央功能区、右购物区均增加完整的深绿金属框架：16px 统一圆角、2px 黄铜压边、克制的内沿高光和投影。外框覆盖组件完整边界，不再出现只装饰局部或后方柜体露半截的问题。

实际 3840 截图中，底部整体裁切高度为 213px；三个组件保持同一高度等级并完整可见。

## 7. 颜色、边框与层级

- 主框：深绿黑蓝漆面，黄铜细边。
- 商品槽：更深的绿色内衬与柔和圆角，不使用额外桌柜图片。
- 下单区与呼叫店员：暗木棕色，和普通操作区形成清楚但不刺眼的主次。
- 菜单端区：米色票纸/黄铜夹板语义，与中央深绿控制区分离。
- hover、focus-visible、disabled 均保留；焦点环不依赖颜色之外的状态变化。

## 8. 图标

新增无文字 SVG 图标：

- `menu.svg`
- `search.svg`
- `history.svg`
- `settings.svg`
- `bell.svg`
- `empty-tray.svg`
- `cart-full.svg`
- `order-ok.svg`

中央菜单、搜索、点餐记录、系统设置、呼叫店员均采用“图标 + DOM 文字”；空槽、满载和下单成功状态也有独立图形提示。图标不包含文字、数字、价格或 Logo。

## 9. 购物车消失 bug 根因

根因在 `CartPanel.vue` 的条件渲染：四槽容器原为 `v-if="!tipsType"`。当第四个槽位填满时，父级设置 `tipsType = 'out_meal'`；下单成功时设置 `tipsType = 'order_meal'`。两种状态都会直接卸载整个 `.item-group`，所以用户看到的不只是提示，而是四槽、商品和下单区全部消失。点击满载提示后才清除状态并重新挂载；下单提示则要等待定时器结束才恢复。

修复后 `.item-group` 始终挂载，状态提示只占据原下单位置。满载时四件商品保持可见，第五件不会改变四槽；下单成功时四个空槽立即可见，成功提示只替代下单按钮，定时结束后原下单按钮恢复。

## 10. 满载行为

Midnight 左右两侧均实际加入 4 件商品：

- 四个商品图、名称、价格、数量、加减和删除保持显示。
- 满载提示位于各自下单区，并有购物车满载图标与 DOM 状态文字。
- 再点击第五件商品时，槽位数量保持 4，既有商品区没有卸载或空白。
- 满载提示为真实 button，可点击关闭；ARIA live 状态保留。

## 11. 下单行为

- 左右两侧均完成最小开发环境下单验证。
- 下单后商品数组清空，四个共享空槽立即显示；成功反馈固定在下单区，不覆盖商品区。
- 成功提示按既有定时逻辑结束，随后下单区恢复，组件无需刷新。
- `order_meal` 成功提示不可误点关闭，避免与自动结束逻辑冲突。

## 12. Midnight 验证

- 空购物区：四槽、空托盘图标和下单区完整。
- 左侧满 4：通过；第五件：被拒绝且四槽保持。
- 右侧满 4：通过；第五件行为与左侧一致。
- 左侧下单：清空、成功提示、自动恢复均通过。
- 右侧下单：清空、成功提示、自动恢复均通过。
- 中央五类入口保持真实 button 与原 emits；图标和文字清楚。
- 3840 底部三框完整，无新增高度、锚点或桌柜背景。

截图：

- `screenshots/phase04r-midnight-bottom-full.png`
- `screenshots/phase04r-midnight-left-cart-empty.png`
- `screenshots/phase04r-midnight-left-cart-full-4.png`
- `screenshots/phase04r-midnight-left-cart-after-order.png`
- `screenshots/phase04r-midnight-right-cart-full-4.png`
- `screenshots/phase04r-midnight-center-console.png`

## 13. zhenxian 回归

- 实际切换到 zhenxian，左侧加入 4 件商品，四槽在满载提示出现时仍保持可见。
- 下单后四个空槽立即恢复并保持；共享数量、加减和中央入口结构正常。
- 原主题橙色资产、尺寸和中央图文没有被 Midnight 外框、图标或颜色污染。
- 截图：`screenshots/phase04r-zhenxian-bottom.png`。

## 14. xiaoxin 回归

- 实际切换到 xiaoxin，右侧加入 4 件商品，满载与下单后均未发生整区消失。
- 原主题黄色资产、尺寸、数量控件和中央按钮保持原表现。
- Midnight 的深绿框架与中央 SVG 图标仅在 `[data-theme="midnight-station"]` 下生效。
- 截图：`screenshots/phase04r-xiaoxin-bottom.png`。

## 15. build 与测试

- `npm run build`：通过，1804 modules transformed。
- `node --test tests/cart-panel-persistence.test.mjs tests/midnight-geometry.test.mjs tests/midnight-overlays.test.mjs`：11/11 通过。
- `npm run test:assistant`：26/26 通过。
- `npm run test:voice`：9/9 通过。
- `git diff --check`：通过。
- 新增回归保护覆盖：提示期间四槽持续挂载、左右提示位置、无障碍状态、Midnight 三框和中央图标皮肤。
- Phase04 冻结保护继续覆盖 `VirtualDiningAssistant`、`ScenicDishStage`、`TopPlateProgress`、`MidnightDishTrolley` 和 `MidnightExpressPass`。

## 16. 已知问题

- 构建仍有既有 Dart Sass `@import` deprecation 与大 chunk 警告，不影响本轮构建结果。
- 部分开发商品数据本身存在失效图片地址；截图选用可正常加载的真实商品进行布局验证，该数据问题不属于本轮底部 UI 范围。
- 为修复共享消失问题，旧主题满载/成功提示也改为只占下单位的 DOM 状态卡；旧主题主体资产、布局与交互未改变。

## 17. 是否可进入 Phase05

可以。三块 Midnight 底部框架已统一，购物车在满 4 和下单反馈期间不再整区消失；Midnight、zhenxian、xiaoxin 的真实交互和回归检查均通过，构建和专项测试通过。

最终状态：`READY_FOR_PHASE_05`
