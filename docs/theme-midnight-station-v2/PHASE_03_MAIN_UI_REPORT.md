# Midnight Station V2 · Phase03 主界面统一报告

## 1. 基线

- branch：`themev2`
- HEAD before：`e6ab8699bb3fe2a04dfd58e6cfaad3620cf59099`
- HEAD after：`e6ab8699bb3fe2a04dfd58e6cfaad3620cf59099`（本阶段修改保留在工作区，未创建提交）
- 未切换 `themev1`，未修改 `master`，未执行 reset / restore；Phase02-R2 的 `background-v3`、`MidnightDishTrolley` 与 `MidnightExpressPass` 均保留。

## 2. 实际修改文件

### 代码

- `src/views/display/ConveyorBeltDisplay.vue`
- `src/components/display/TopPlateProgress.vue`
- `src/components/display/VirtualDiningAssistant.vue`
- `src/components/display/CartPanel.vue`
- `src/components/display/CenterFunctionPanel.vue`
- `src/components/display/ScenicDishStage.vue`

### 资产与验证截图

- `public/images/ui/midnight-station/platform-service-counter-v1.png`
- `docs/theme-midnight-station-v2/screenshots/phase03-*.png`

`platform-service-counter-v1.png` 是无文字、无 Logo 的深绿搪瓷 / 暗木 / 黄铜月台服务柜素材。它仅承担购物车与中部服务台的实体材质；菜名、数量、价格、按钮文案和状态仍由 DOM 输出。

## 3. 顶部品牌区

- Midnight 专属样式将品牌放入左上方的低矮站务铭牌：深绿旧漆、黄铜压边与左侧立柱相呼应，不覆盖背景中央配送廊道。
- 中文主标题在 3840 下为 `clamp(30px, 1.65vw, 40px)`，桌台辅助信息为 `clamp(17px, .88vw, 22px)`。
- 现有品牌、桌号和人数数据没有被改写，也没有绘制到背景或素材中。

## 4. TopPlateProgress

- 保留 `progress`、`formatted`、ARIA `progressbar`、百分比计算和完成态逻辑。
- 午夜主题将原游戏条替换为站务线路板：哑光深绿板、黄铜压边、两端信号透镜，以及由真实百分比 CSS 裁切的琥珀分段线路灯。
- 100% 时填充改为绿色通行灯并增加形状提示；状态不只依赖颜色。
- 3840 实测进度设施为 `1040×124px`；主状态和百分比为 DOM，百分比分别使用 `clamp(20px, 1.28vw, 30px)`。

## 5. AI 助手

- 未修改语音状态机、TTS、推荐、错误处理和 emit 链路。
- 午夜主题将助手容器改为夜班站务台：深绿金属台、黄铜边、底部服务台压边；角色继续复用。
- 对话、推荐列表改为米色票纸，移除突兀白色网页客服气泡。状态仍使用文字、角色姿态和小型形状/灯色共同表达：listening、processing、result 与 error 不仅依靠颜色。
- `npm run test:assistant`：26/26 通过。

## 6. 左右 CartPanel

- 购物车变为月台餐票 / 行李整理台。左右没有镜像 DOM 或文字；只共享无文字柜台材质，左右下单区的原业务顺序保持不变。
- 四个槽位改为托盘架，商品图、名称、数量、删除、加减仍为真实 DOM 控件。
- 原先以 `div` 承担的下单入口改为原生 `button`；保留 `place-order` emit，并增加可读的真实下单文案、`count/4` 与由购物车项计算的总价。
- 槽位保留键盘 Enter/Space 选择、删除/加减的 focus-visible 和 disabled 反馈；删除按钮与加减按钮在 3840 下保持足够面积。
- 本地 Chrome 输入验证：左右可见托盘车各完成一次加购，购物车有项目槽位且数量按钮可用；未点击下单，未创建订单。

## 7. CenterFunctionPanel

- 五类既有 emits 完整保留：详细菜单、导航、订单历史、设置、呼叫服务员。
- 所有入口从带 click 的 `div` 改为原生 `button`，显示真实 i18n 文案，保留 title / aria-label、hover、active、focus-visible。
- 午夜主题使用服务台柜体、黄铜边、深绿按钮和独立暖色呼叫服务员按钮；不再是悬在地面的图标条。

## 8. 分类与控制条

- Midnight 专属工具条改为横向站务控制轨，分类按钮为硬边路线牌；active、hover、focus 都有区别。
- pause 保留原状态、ARIA 和可点击面积。实际本地输入验证触发 pause 后舞台获得 `is-paused`。
- direction / speed 的业务状态及设置入口没有修改；Phase02-R2 对方向、速度和机械联动的既有验证继续适用。

## 9. 3840 字体与 1920 降级

- 品牌、进度、购物车商品/数量/总价、中心入口、分类和助手均使用 Midnight 范围内的 `clamp()` 或 1920 专属约束，避免直接按 50% 缩小。
- 3840：商品名/价格由 Phase02-R2 托盘车保持 `18–31px` 范围；购物车与中心操作文案提升至约 `17–28px`。
- 1920：购物车和服务台使用组件内 `769–1920px` 午夜覆盖，保持四槽和五入口而不横向溢出。

## 10. 固定 3840 viewport resize 修复

### 根因

`ScenicDishStage.vue` 原有 `ResizeObserver` 只会将 `streamCycleWidth` 置零。手动 Device Toolbar resize 后，旧周期的 `scrollLeft` 仍保留，而由 `clamp()` 计算的新槽位 / 事件宽度已经改变，可能使当前位置落入三周期轨道的非预期空白段。

### 修复

新增 `queueStreamGeometryRecalculation()`：

1. 在 ResizeObserver 首次通知中缓存旧周期内的 `scrollLeft % cycleWidth` 比例；
2. 失效 cycle 宽度缓存，并在 90ms debounce + 下一帧后重新测量；
3. 使用 `newCycleWidth + newCycleWidth * ratio` 映射回新周期的稳定中段；
4. 调用既有 `normalizeStreamPosition()`，清除本次跳变的速度采样但不重置购物车、分类、pause 或方向/速度状态；
5. 同时观察 stream 与 stage，覆盖 Device Toolbar 的手动宽度更新。

该过程不在每帧重测布局，主动画仍使用原有单一 RAF / `scrollLeft` 流。

## 11. 实际验证

使用已有本机前后端预览与 Chrome DevTools 的真实 viewport / 鼠标输入完成验证；未提交订单。

| 场景 | 结果 |
| --- | --- |
| Midnight 3840×1080 | PASS：`trolleyCount=66`、`expressCount=3`、stage `3804px`、cycle `12105px` |
| 特殊列车经过 | PASS：将真实 cycle 定位到特快节点后保存截图，普通托盘车未被替换 |
| 3840 → 1920（无刷新） | PASS：stage `1884px`、cycle `9168px`，商品与 3 个特快节点仍存在 |
| 1920 → 3840（无刷新） | PASS：stage/cycle 回到 `3804px` / `12105px`，商品与特快节点仍存在 |
| 真实左右加购 | PASS：真实鼠标输入后购物车项目槽位出现，数量按钮可用；未提交订单 |
| pause | PASS：真实鼠标输入后 `is-paused=true` |
| zhenxian 回归 | PASS：Midnight trolley / express DOM 数均为 0，旧主题进度素材仍为 `/images/ui/b/bar.png` |
| xiaoxin 回归 | PASS：Midnight trolley / express DOM 数均为 0，旧主题进度素材仍为 `/images/ui/c/bar.png` |
| `npm run build` | PASS：Vite 构建完成；仅存在仓库既有 Sass 弃用与 chunk-size 提示 |
| `npm run test:assistant` | PASS：26/26 |

截图已保存：

- `phase03-midnight-3840.png`
- `phase03-midnight-top-ai.png`
- `phase03-midnight-left-cart.png`
- `phase03-midnight-center-console.png`
- `phase03-midnight-right-cart.png`
- `phase03-midnight-special-express.png`
- `phase03-midnight-1920.png`
- `phase03-midnight-resize-3840.png`
- `phase03-zhenxian-regression.png`
- `phase03-xiaoxin-regression.png`

## 12. 已知问题

1. 自动化环境未授予麦克风权限，因此未在无头浏览器中实际开启识别；语音/推荐逻辑由既有 26 个助手测试覆盖，AI 面板与状态样式在真实页面中已加载。
2. 设置弹窗、订单历史、菜单、全屏导航、招牌菜屏和转场的完整 Midnight 皮肤不在本阶段范围内。

## 13. Phase04 未处理范围

- `MenuView.vue`
- `SushiNavigation.vue`
- `OrderHistoryDialog.vue`
- `FeaturedDishScreen.vue`
- `SceneTransitionOverlay.vue`
- 设置弹窗的完整皮肤
- 招牌菜大屏的完整皮肤

## 14. 最终状态

`READY_FOR_PHASE_04_WITH_NOTES`

