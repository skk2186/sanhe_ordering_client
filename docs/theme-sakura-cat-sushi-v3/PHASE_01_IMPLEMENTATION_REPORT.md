# Theme V3 Phase 01：执行报告

## 本阶段范围

按要求只做现状审计、主题蓝图和目录/文档骨架。本阶段没有编辑 `src/`、现有主题图片、设置白名单或 `SCENES`，所以没有把 themev3 接入运行流程，也未改变业务和构建入口。

## 实际阅读范围

- 展示主链路：`src/views/display/ConveyorBeltDisplay.vue`。
- 指定组件：`ScenicDishStage.vue`、`TopPlateProgress.vue`、`CartPanel.vue`、`CenterFunctionPanel.vue`、`FeaturedDishScreen.vue`、`SettingDialog.vue`、`SceneTransitionOverlay.vue`、`AmbientSceneEffects.vue`、`BeachBoatPass.vue`、`SeaTurtlePass.vue`、`StageSplashLayer.vue`。
- 样式及资源：`src/styles/conveyor-belt.scss`、`public/images/ui/b/`、`public/images/ui/c/`；检查了资源命名、组件引用方式、分层进度图和主题外壳映射。
- 分支文档：读取 `themev2` 分支的 `PHASE_01_EXISTING_THEME_AUDIT.md`、`PHASE_01_VISUAL_DIRECTION.md`、`PHASE_01_COMPONENT_MAPPING.md`、`PHASE_01_REPORT.md`，以及 Phase 04R5R 比例报告和 Phase 04R9R5 餐盘遮挡报告。当前分支工作区的同名目录是截图/浏览器记录，不包含这些 markdown；报告据实区分两者。
- 基线：当前 `themev3` 与本地 `master` 在审计时指向同一提交；本地 `themev2` 分支可供只读参考。

## 新增目录和文件

- `docs/theme-sakura-cat-sushi-v3/PHASE_01_EXISTING_THEME_AUDIT.md`
- `docs/theme-sakura-cat-sushi-v3/PHASE_01_THEME_BLUEPRINT.md`
- `docs/theme-sakura-cat-sushi-v3/PHASE_01_ASSET_MANIFEST.md`
- `docs/theme-sakura-cat-sushi-v3/PHASE_01_IMPLEMENTATION_REPORT.md`
- `public/images/ui/sakura-cat-sushi/README.md`
- `public/images/ui/sakura-cat-sushi/` 下的 `background/`、`stage/`、`cats/`、`plates/`、`console/`、`effects/`、`progress/`、`cart/`、`transition/` 占位目录及 `.gitkeep`。

没有新建图片资源或业务源文件。

## 整体判断

正式主题用主题母图建立场所感，再用同系列载具、购物车/控制台、进度条和转场素材完成视觉统一；真实商品流和购物车订单链路仍由共用组件负责。`themev2` 的审计强调资产先行与 3840×1080 规划，并记录了 CSS/SVG 画整场景的比例、质感、透视和尺寸问题。V3 需要把背景、猫咪拆件、弧形餐台、可点击盘底与中央点餐台分别规划和验收，再将纯视觉层挂到既有机制上。

当前 `SettingDialog.vue` 与父页面 SCENES 只有 zhenxian/xiaoxin 两项；themev3 尚未注册，符合本阶段避免运行风险的目标。

## 下一阶段切入点

先做不接入运行时的视觉前置：按本蓝图绘制 3840×1080 构图线框，标出真实顶部、中段、底部交互区及遮挡边界；并绘制背景色稿、回转台轮廓、点餐台位置和四只角色工位缩略稿。以母图透视、灯光方向和目标像素尺寸作为后续资产生成/绘制约束，完成一张无文字组合预览后再进入 Vue 层集成。

## 推荐开发顺序

1. 3840×1080 空间线框与构图/色稿；锁定互动留白、弧形餐台位置、服务台占位和光源方向。
2. 母背景与餐台前/后景主体资产；完成 3840 与 1920 画面校验。
3. 四只猫的静态角色设计、拆件锚点、姿势回退，再为切菜/摆盘/端菜/炒菜制作低频循环动作。
4. 餐盘按钮底图与真实商品 DOM 组合，确认不同商品图比例、售罄/推荐/focus/点击热区。
5. 点餐台及购物车、中控、进度条主题外壳成套制作，确保两侧购物车和中控控件仍可用。
6. 蒸汽、花瓣、灯笼/火苗等环境效果与主题转场，添加暂停和 reduced-motion 行为。
7. 再改主题注册、预加载、设置预览和视觉组件绑定；逐项跑原业务回归并以 3840×1080/1920×1080 真实浏览器截图验收。

## 基础检查记录

新增文件暂存后执行 `git diff --cached --check`，通过；新建目录及文档路径均存在。`npm run build` 首次在受限执行环境被 `EPERM realpath index.html` 阻止，获准在沙箱外重跑后通过：1791 个模块完成转换，Vite 生产构建成功。输出含仓库既有 Sass 弃用警告和 Element Plus/Phaser 大 chunk 提示。本阶段未改运行时代码、依赖或构建配置。
