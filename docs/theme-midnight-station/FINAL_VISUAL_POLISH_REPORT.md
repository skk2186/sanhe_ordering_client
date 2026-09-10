# Midnight Sushi Station — Final Visual Polish Report

日期：2026-09-10  
分支：`themev1`  
基线：`d948396949d671aaa0baaea4a340644b4bd63420 feat: add new theme section3`

## 1. Baseline

- `branch`: `themev1`
- `HEAD before`: `d948396949d671aaa0baaea4a340644b4bd63420`
- `HEAD after`: `d948396949d671aaa0baaea4a340644b4bd63420`（本轮未创建提交）
- 工作区：7 个实现文件修改，另新增本报告；没有 reset、stash、切换分支或删除用户文件。
- 本轮范围：只做 Midnight Station 的视觉精修、可读性修正和主题内资源兜底，没有扩展业务功能。

## 2. Initial Visual Problems

本轮实际浏览器审查确认的主要问题：

1. 中央控制区原先依赖 `FIND SEARCH`、`LOG HISTORY`、`SET UP`、`CALL STAFF` 等英文伪标签，按钮像概念稿中的占位块。
2. 部分接口菜品图片地址为空或失效，导致 Midnight 餐盘出现空白/过淡的盘面，食物没有成为第一视觉焦点。
3. Xiaohe 角色周围的边界和光晕偏重，与精致的月台场景竞争。
4. 票签、控制区和辅助区域的次级边框偏多，视觉层级不够收敛。
5. 3840×1080 下部分菜名、价格和辅助文本的阅读下限偏小。

月台核心结构本身没有被推倒：顶棚、柱体、悬挂站牌、月台边缘、实体送餐轨道、陶瓷餐盘、Rail Cradle 和 Ticket Tag 均保留。

## 3. Elements Removed / Reduced

- 删除中央控制按钮的英文伪文本 `FIND SEARCH`、`LOG HISTORY`、`SET UP`、`CALL STAFF`，改为 Element Plus 图标加当前语言文案。
- 删除 Midnight 下订单按钮的 CSS 伪元素 `DEPART`，改为真实的 i18n 下单文案，保留提交中、成功、错误状态。
- 弱化 Xiaohe 周围的矩形边界和厚重光晕，改为低对比的短椭圆暖光。
- 没有继续增加新的站牌、路线号或装饰英文。
- 没有新增图片素材、霓虹、全屏渐变、粒子或持续性背景动画。
- 旧主题的历史 CSS 伪文本和旧图片路径没有被删除；新 DOM 通过基础隐藏规则和主题类隔离，避免 `zhenxian`、`xiaoxin` 视觉变化。

## 4. Typography Changes

- Midnight 中央功能区使用 Element Plus icon + 当前语言文本，按钮字重收敛到 `500`，不再使用大写英文装饰承担主要信息。
- 1920×1080 保持紧凑可读的按钮字号；1921px 以上提高 Midnight 的菜名、价格、正文、按钮、助手和票签字号上限。
- 舞台 Ticket Tag 的菜名上限由 `14px` 提升到 `16px`，价格上限由 `18px` 提升到 `21px`；避免超宽屏上食物信息变成细小噪声。
- 继续复用现有 Midnight 字体 token，没有引入在线字体或新的字体依赖。

## 5. Spacing Changes

- 中央控制台改为稳定的图标/文案垂直节奏，图标与文字间距分别使用 `5px/6px`，不改变原有事件和布局关系。
- Midnight 顶部助手列收窄角色占用，减少其对品牌、投碟进度和舞台的挤压。
- 超宽屏只提升文字阅读下限，不拉伸控制区、不改变三段式布局、不把购物车推离中央操作区。
- 1920×1080 与 3840×1080 均实际检查，主舞台和底部区域没有新增横向溢出。

## 6. Color Changes

- 没有引入新的主色；继续使用 Midnight 的炭墨、纸面、柿红、松柏绿和琥珀 token。
- 中央按钮图标使用已有琥珀强调色，按钮文字使用纸面色；hover/focus 使用纸面反差而不是 scale 或 glow。
- Xiaohe 的辅助光改为低不透明度暖色椭圆，降低其与菜品、站牌和购物车的竞争。
- 失效图片仅在 Midnight 主题使用现有高质量 `public/images/menu/generated/nigiri.webp` 作为视觉兜底，不影响旧主题的 `/images/default-dish.jpg` 路径。

## 7. Stage Polish

- 没有重写 Phase 02R 的月台架构或运动模型。
- 在原有建筑空间、主轨道和餐盘结构上，优先修复“食物缺图”造成的视觉空洞，并提高超宽屏 Ticket Tag 阅读性。
- 真实浏览器截图确认：主舞台的视觉顺序仍是餐盘/食物优先，轨道与月台承担环境语义，站牌没有压过菜品。
- 现有菜品 stream、drag、inertia、pause、direction 和 category 行为未改动。

## 8. Plate Polish

- 没有更换业务图片来源，也没有把菜品重新做成卡片。
- 当接口返回空图或失效地址时，Midnight 仍显示在现有陶瓷盘面中的真实寿司照片，避免空盘破坏餐饮感。
- 保留盘沿、接触阴影、Rail Cradle 和 Ticket Tag 的原有层次；本轮只改善图片可见性与标签阅读下限。

## 9. Assistant Polish

- Station Concierge 的业务状态、语音识别、TTS、推荐算法、音频和命令处理均未修改。
- Midnight 空闲态助手缩小为更明确的辅助角色比例，推荐栏和角色列收窄，主推荐仍优先于角色。
- 失效推荐图片使用 Midnight 菜品兜底，避免助手区域显示破损图片。
- 旧 Xiaohe 角色资产仍保留；没有为了赶工生成新的低质量角色 PNG。

## 10. Navigation Polish

- SushiNavigation 继续使用原有分类、搜索、浏览、添加和购物车业务。
- Midnight 菜品图片使用与主舞台相同的兜底策略，使导航仍处在同一家餐厅中，而不是出现另一套空白占位图。
- 1920×1080 与 3840×1080 实际打开检查：深色菜单表面、圆盘菜图、票签和底部席位购物车保持统一，没有新增大圆角卡片或海洋主题泄漏。

## 11. History Polish

- 本轮未重写 Phase 03 已完成的 Ticket Ledger。
- 3840×1080 实际检查订单历史空状态：账本表面、空票夹、提示和关闭路径可见，没有默认 Element Plus 空白弹层泄漏或溢出。
- 当前环境没有订单数据，因此空账本保留较多纸面留白；这是数据状态，不是新增布局问题。

## 12. Settings Polish

- 本轮未重写 Phase 03 的 Station Control Room；复核其 Midnight 皮肤、主题选择、语音、路线控制和语言区域。
- 1920×1080 与 3840×1080 实际检查：对话框保持合理最大宽度，内容可滚动，关闭入口可见，没有因为超宽屏被拉成不可读的整页面板。
- 没有改变设置 tabs、slider、switch、语言选择或主题选择业务。

## 13. Cart / Controls Polish

- CartPanel 保留左右席位、容量、增减、删除、选择、提交和反馈逻辑。
- 下单按钮改为当前语言真实文案，保留 loading、success、error、full 等既有状态表现。
- 中央控制区使用 `Menu`、`Search`、`Tickets`、`Setting`、`Bell` 图标配合当前语言标签，移除开发者临时英文块。
- 图标按钮继续使用真实 `aria-label`、键盘触发和 focus-visible，主要触摸目标没有缩小。

## 14. Motion Cleanup

- 本轮没有新增持续性环境动画；菜品传送流仍是主页面唯一的主要持续运动。
- 没有改变已有 Add-to-Cart、数量变化、删除、购物车满、下单、场景转场和 reduced-motion 架构。
- 按钮 hover/focus 采用颜色和图标/文字反差，不使用 `scale(1.1)`。
- 已复核 `prefers-reduced-motion: reduce`：场景 choreography、stagger、票据飞行和持续装饰会降级/取消，但 pressed、selected、success、error 和最终状态仍可见。

## 15. 1920×1080 Review

真实浏览器页面通过 Chrome DevTools Protocol 设置为 `1920×1080`，并实际截图检查。截图证据：

- `E:\Temp\final-polish-final-1920.png`：主页面 idle，主题为 `midnight-station`，33 个菜品节点，轨道、盘面、票签、底部三段布局完整。
- `E:\Temp\final-polish-cart-click.png`：点击菜品后购物车业务链路可见，右侧席位数量更新，ghost 动画结束后 DOM 清理。
- `E:\Temp\final-polish-main-after-pass2-1920.png`：控制台图标/当前语言标签与助手缩小效果。
- `E:\Temp\codex-phase03-featured.png`：Station Advertising Board，菜品媒体大于装饰边框。
- `E:\Temp\codex-phase03-waiter.png`：呼叫服务员使用 Element Plus Bell 图标，无 emoji。
- `E:\Temp\codex-phase03-settings-final.png`：Station Control Room。
- `E:\Temp\final-polish-history-3840.png`：订单账本空状态；该截图为超宽尺寸，但同时验证了弹层逻辑。

主页面五秒与眯眼测试结论：第一层是食物和餐盘，第二层是左右席位与中央操作，第三层是助手和进度，月台环境保持低对比。

未安全触发语音输入来制造完整 AI 推荐态；推荐状态映射和图片兜底已做源码检查，实际 AI 推荐截图仍受当前浏览器/API 环境限制。

## 16. 3840×1080 Review

真实浏览器页面通过 DevTools Protocol 设置为 `3840×1080`，并实际截图检查。截图证据：

- `E:\Temp\final-polish-final-3840.png`：主页面完整铺开，左右购物车没有离开中央控制区，菜品数量和间距随宽屏展开，没有横向裁切。
- `E:\Temp\final-polish-navigation-3840-loaded.png`：等待数据加载完成后检查导航；圆盘菜图、票签和底部席位存在，没有被拉成单列或出现 overflow。
- `E:\Temp\final-polish-settings-3840.png`：设置弹层保持最大宽度，未随 viewport 无限拉伸。
- `E:\Temp\final-polish-history-3840.png`：历史账本保持可读宽度和可见关闭入口。

主页面状态检查返回：`theme=midnight-station`、`width=3840`、`height=1080`、`plates=33`。`document.body` 没有被设置为横向滚动布局；截图中无明显横向裁切。

## 17. Old Theme Regression

实际切换并截图检查：

- `zhenxian`：海滩、波浪、木筏和原有角色/场景保持；没有出现 Midnight 站牌、轨道或盘面样式。
- `xiaoxin`：海底、贝壳、海龟和原有场景保持；没有出现 Midnight 的暖色轨道和票签结构。

隔离措施：

- Midnight 文字、图标布局和超宽 token 均受 `.is-midnight-station` 或 `html[data-theme='midnight-station']` 限制。
- 中央功能区新增图标/标签在旧主题基础样式中隐藏，旧主题仍使用原有背景和行为。
- 菜品、购物车、导航图片兜底保持旧主题历史路径，避免新素材污染旧主题。

## 18. Automated Tests

| Command | Result |
| --- | --- |
| `npm run build` | NOT AVAILABLE：Node 在脚本启动前因 `EPERM: operation not permitted, lstat 'C:\\Users\\10851'` 失败。 |
| `npm run test:assistant` | NOT AVAILABLE：同一环境级 `EPERM lstat`。 |
| `npm run test:voice` | NOT AVAILABLE：同一环境级 `EPERM lstat`。 |
| `node --test tests/assistant-recommendations.test.mjs tests/assistant-sound.test.mjs` | PASS，26/26。 |
| `node --test tests/voice-client.test.mjs` | PASS，9/9。 |
| `node node_modules/vite/bin/vite.js build` | PASS，1795 modules transformed，构建完成。 |
| `git diff --check` | PASS；仅报告工作区 LF→CRLF 提示，无 whitespace error。 |

直接构建仍输出项目既有 Sass deprecation 和大型 chunk warning；本轮没有升级依赖或改动无关技术债。

## 19. UI/UX Pro Max Review

本轮先用 `ui-ux-pro-max` 审查已实现页面，再按其建议执行：

- 餐厅触摸大屏优先：维持至少 44px/48px 触摸目标，不用更小的精致化按钮换取视觉。
- Food-first hierarchy：优先修复失效菜图，让菜品成为第一视觉焦点；背景和站务角色退到辅助层。
- Warm dark restaurant palette：继续使用深炭、纸面、柿红、松柏绿、琥珀，不引入蓝紫霓虹或新渐变。
- 8px rhythm、明确 focus、当前语言标签和 reduced motion 继续保留。
- 环境运动控制在低噪声范围，菜品流作为主要连续运动；没有增加新的粒子、blur 或长时间闪烁。
- 最终 Vue-specific 数据库搜索没有返回可直接复用的 Vue 条目，因此按该 Skill 的通用大屏、餐饮、可访问性和动效规则完成实现，没有虚构专项结果。

## 20. Better Interface Review

按 `better-interface` 的完整检查维度完成第二轮复核：

### P0 — 可用性

- 1920×1080 和 3840×1080 主页面、导航、设置、历史没有发现新增 overflow 或被透明 overlay 阻塞。
- 失效菜图已有 Midnight fallback，不再把破损图片直接暴露给用户。
- 中央控制按钮拥有图标、当前语言文案、aria-label 和键盘入口。

### P1 — 层级与一致性

- 删除英文伪标签，收敛中央控制台。
- 降低 Xiaohe 的角色尺寸和矩形 halo。
- 提升超宽屏菜名、价格和票签的阅读下限。
- 保留 Phase 02R 月台、餐盘和票签结构，不增加新的视觉噪声。

### P2 — 剩余 polish

- Xiaohe 仍是较卡通的历史角色资产，周围已降低冲突，但未生成新角色。
- 个别历史 Element Plus 组件仍有基础框架质感；本轮只处理了现有 Midnight 覆盖，不重写组件库。
- 部分 API 菜品仍可能没有高质量真实图片，主题兜底能保持可用，但不能替代生产数据质量。

## 21. Interface Review

`interface-review` slash skill：`NOT AVAILABLE`。当前环境没有可调用的 slash-command 接口；该命令按 Skill 说明需要由用户显式调用，因此没有冒充执行。

已用同等维度完成当前 diff 的人工 review，重点检查 `Introduced` 与 `Regression`：未发现新增的 Midnight overflow、旧主题污染、未命名图标按钮或 reduced-motion 阻塞；保留的 Sass/chunk warning 属于 pre-existing build warning。

## 22. Visual Noise Audit

- 主页面只保留一个主要悬挂站牌、一个 Station Concierge 锚点和必要的月台建筑结构。
- 删除中央控制区的大写英文装饰，减少重复 `ROUTE/PLATFORM/SERVICE` 类标签。
- 将助手 halo 从矩形边界改为低对比暖光，减少框套框。
- 普通按钮不再新增阴影或发光；阴影继续主要服务于餐盘、购物车选中项、广告板和对话框的层级。
- 票签仍保留，因为它同时承担菜名/价格的信息功能，不是纯装饰。

## 23. Squint / Grayscale / Five-second Tests

- Squint：主页面仍能辨认出菜品、左右购物车、中央操作区、顶部助手/进度四个层级，而不是一排同亮度的矩形。
- Grayscale：成功/错误/选中状态除颜色外还依靠文字、图标、边界和形状，不只依赖红/黄/绿。
- Five-second：先读作餐厅点餐系统，再读作午夜月台主题；食物、席位和操作仍比“车站”更重要。

## 24. Remaining Issues / Final Polish Backlog

1. Xiaohe 的历史卡通角色资产仍不是为 Midnight 专门绘制；当前通过尺寸、容器和光晕完成协调，后续如有正式美术资源可替换。
2. 部分菜单接口图片地址可能为空或失效；当前 Midnight fallback 保证餐盘仍有食物，但生产环境应补齐真实菜品图片数据。
3. 当前环境未安全触发完整语音推荐流程，因此没有对 `recommending` 状态做新的 1920/3840 截图验收；业务状态和视觉映射沿用 Phase 03 已实现内容。
4. 构建仍有既有 Sass deprecation 和大型 Element Plus/Phaser chunk warning；本轮不升级依赖、不扩大技术债范围。
5. 历史订单为空时账本纸面留白较多；有真实订单后信息密度会自然提升。

## 25. Final Verdict

**PASS WITH WARNINGS**

视觉精修范围已完成，1920×1080 与 3840×1080 主页面实际检查通过，Midnight 菜品焦点、控制区层级、图片兜底和旧主题隔离均达到本轮目标。保留的 warning 主要来自运行环境、历史角色资产、生产图片数据质量和未触发的完整 AI 推荐态，不是本轮新增的业务回归。
