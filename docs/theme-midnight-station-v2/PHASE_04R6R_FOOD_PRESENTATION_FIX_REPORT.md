# Phase04-R6R：菜品展示与重复托盘修复报告

**状态：`READY_FOR_VISUAL_REVIEW`**

- 仓库：`skk2186/sanhe_ordering_client`
- 分支：`themev2`
- 审核起点：`698fbed899bf7650e901e45037484083a2a4535e`
- 验收时 HEAD：`119aa4f78f69030714929cfa10affc82c64797a7`

## 变更内容

- 从 `MidnightDishTrolley.vue` 删除 `midnight-dish-trolley__platter` 及其专属样式，移除菜品图片容器的椭圆底色与圆形裁切。
- 从 Midnight 资源预加载清单删除 `delivery-trolley-platter.svg`，并删除已无运行时用途的托盘 SVG。
- 没有新增车体或托盘美术资产；继续使用现有透明车体 `delivery-trolley-body-v3.webp`。
- 复用同一车体素材作前后两层：完整车体置于商品图后方，车体前侧从素材 35% 高度起以裁切层盖住商品图下沿；轮组独立置于前层，铭牌位于车体铭牌板上。商品图的底边统一锚定在车体坐标的 42% 高度，避免原先多个互不关联的 `top` 定位。
- 图片保持 `object-fit: contain`。商品图片框使用直角裁切边界与 `max-width/max-height`，不添加新的白底或边框；方图不会被强行裁掉，SVG 缺图占位也不会溢出图片框。
- 车体宽度、车轮旋转数据和共享横向滚动机制不变。`dish-click`、方向、选中、推荐、售罄、暂停、键盘交互和可访问名称仍由原组件逻辑提供。

## 实测比例与可读性

尺寸来自真实浏览器 `getBoundingClientRect()` 与计算样式。R6 基线图框尺寸取自审核前版本；可比照片源为 800×500。

| 视口 | R6 商品图框 | R6R 商品框 | 800×500 照片实际显示内容 | 菜名 / 价格计算字号 |
|---|---:|---:|---:|---:|
| 3840×1080 | 165×98px | 199.7×134px | 199.7×124.8px（约 24,917px²） | 23px / 23.8px |
| 1920×1080 | 145×80px | 170×115px | 170×106.3px（约 18,063px²） | 19px / 19px |

对应 R6 同源照片实际显示约为 156.8×98px（15,366px²）和 128×80px（10,240px²）。R6R 的照片可见面积分别提高约 62% 和 76%。方形寿司照片完整保留在 134×134px（3840）或 115×115px（1920）的 `contain` 内容区内。

铭牌宽度由车体 42% 调至 76%；按 320px 与 286px 车体计算，铭牌有效宽度分别约 243px 与 217px。菜名超出空间时使用省略号，完整名称仍在按钮的 `aria-label` 中。浏览器视觉夹具中的 13 字菜名测得文本内容宽 299px、可见宽 148px，已触发省略而没有挤小字号。铭牌不覆盖轮组，菜单不放在餐盘上方。

## 图片与商品抽样

- 真实页面共加载 371 个图片元素（包含横向循环副本），首次图片检查 `naturalWidth` 失败数为 0；无图商品显示 `default-food.svg`，不再呈现黑色空圆。
- 将一个商品图临时设为无效 PNG 后，浏览器实际触发 `error` 回退：`fallbackApplied=true`，最终来源为 `default-food.svg`；1920 下回退图边界与 170×115px 图片框一致。
- 当前演示目录没有寿司命名商品，也没有超过四字的真实菜名。多商品截图使用仓库现有 `public/images/menu/generated/nigiri.webp` 与临时长标题作 DOM 视觉夹具，饮料、甜点、主食、售罄和无图商品来自页面当前目录。夹具只存在于临时无头浏览器，不改动菜单数据或应用状态。夹具测得菜名省略行为正常；图片没有裁掉主体。

## 浏览器验收截图

截图由一个临时无头 Chrome 页面依次检查视口后生成，文件均位于 Git 忽略的 `screenshots/` 目录，没有加入版本控制。

- `screenshots/r6-vs-r6r-3840.png`：R6 与 R6R 同为 3840×1080 基线下的商品车局部对照。
- `screenshots/r6r-full-3840.png`：R6R 真实目录全页面，3840×1080。
- `screenshots/r6r-full-1920.png`：R6R 真实目录全页面，1920×1080。
- `screenshots/r6r-multifood-3840.png`：连续多辆车，含饮料、寿司视觉夹具、甜点、主食、售罄与长标题夹具。
- `screenshots/r6r-image-fallback-1920.png`：图片加载失败后的主题占位状态。
- `screenshots/special-express-3840.jpg`：R6 基线同视口特殊列车参考。R6R 没有修改 `MidnightExpressPass.vue`，单元测试继续核对该组件与基线一致。当前全景抓取周期未将特殊列车滚入视口，因此此项以同分辨率既有浏览器截图与未变更组件作为比例依据。

全景截图中车体、侧板、车轮和轨道均可见；相邻车辆没有互相覆盖。3840 与 1920 的标签字号均达到目标范围。底部购物区、背景、特殊列车、`VirtualDiningAssistant`、进度条、其他主题和业务状态机均未修改。

## 构建与回归

- `npm run build`：通过。只出现既有 Sass 函数弃用和大分块体积警告。
- `git diff --check`：通过。
- `node --test tests/cart-panel-persistence.test.mjs tests/midnight-geometry.test.mjs tests/midnight-overlays.test.mjs`：12 项通过，0 失败。
- 测试断言已改为检查重复托盘移除、图片回退、Contain 展示、字号和铭牌宽度，并保留购物车、滚动、特殊列车与组件业务保护。

**最终状态：`READY_FOR_VISUAL_REVIEW`**。本轮至此停止，不进入 Phase05。
