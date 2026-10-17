# Repo-Cleanup-01：主题资源审计与 Git 仓库瘦身报告

日期：2026-10-17  
分支：`themev2`  
审核基线：`20bd2d80c64198500fc1c754b4881c6202e21896`

## 执行摘要

本轮仅调整截图的 Git 跟踪、`.gitignore` 和历史报告中的截图引用，并新增本报告。未修改 Vue、CSS、主题选择或正式图片素材。103 张历史截图仍保留在工作区，并已复制到仓库外归档。

| 指标 | 清理前 | 清理后 |
|---|---:|---:|
| Git 跟踪文件 | 483 | 380（本报告目前为新建未跟踪文件） |
| 跟踪文件字节数 | 292,032,015（278.5 MiB） | 132,056,201（125.9 MiB） |
| 跟踪历史截图 | 103（159,976,575 字节，152.6 MiB） | 0 |

清理前数值按工作区内跟踪文件实际大小统计。清理后文件数与字节数按 Git 索引中的跟踪路径及其当前文件大小计算；新报告暂为未跟踪文件，大小 6,579 字节。

## 跟踪文件分类（清理前）

下表按互斥路径规则分类，大小为工作区文件字节数；“必要源码与配置”包含未归入其它分类的项目配置及资源以外源码。

| 分类 | 文件数 | 大小 |
|---|---:|---:|
| 正式运行依赖及锁文件（package 文件） | 2 | 155,965 B |
| 必要源码与配置（其余） | 19 | 76,730 B |
| 源码与正式资源（`src/`、`public/`，不含单列的 Midnight 资源） | 287 | 46,524,090 B |
| 阶段报告与文档 | 23 | 228,302 B |
| 历史截图（`docs/theme-midnight-station-v2/screenshots/`） | 103 | 159,976,575 B |
| Midnight 主题图像资源 | 40 | 79,580,359 B |
| 构建及生成中间产物 | 9 | 5,489,994 B |
| **合计** | **483** | **292,032,015 B** |

## 截图归档与解除跟踪

先将 `docs/theme-midnight-station-v2/screenshots/` 复制到仓库外目录：

`E:\CodexWork\CodexHome\visualizations\2026\10\17\01a148cb-d521-7ff2-a7bc-c630fc33c9b0\Repo-Cleanup-01\theme-midnight-station-v2-screenshots`

归档核对结果：源目录和归档目录均有 103 个文件、159,976,575 字节；逐文件 SHA-256 与大小比较完全一致。原截图在工作区继续保留。随后通过 `git rm --cached -r` 解除该目录文件的索引跟踪，未删除本地文件。`.gitignore` 中添加了截图目录忽略规则，因此后续本地截图仍留在工作区但不再进入 Git 跟踪。

所有阶段 Markdown 报告均保留。原来指向截图目录的 Markdown 图片/链接改为文件名与“本地归档”提示；未删除报告中的结论、问题记录或验证文字。

## `.gitignore` 变更

新增规则：

```gitignore
# Generated visual review artifacts
/docs/theme-midnight-station-v2/screenshots/
/output/imagegen/

# Local temporary visual experiments
/.visual-review/
```

没有添加全局图片扩展名忽略规则，正式图片资源仍受 Git 管理。

## Midnight 图片引用与哈希审计

对 `public/images/ui/midnight-station/` 逐文件统计大小和 SHA-256，并在 `src/`、`public/`、`index.html` 中按文件名搜索引用。代码中确认的运行依赖包括：

- 当前 v4 正式背景：`background-v4-warm-rear.png`、`background-v4-warm-foreground.png`，在显示页和主题样式中被引用。
- 必要 v3 回退/设置预览：`background-v3-rear.png`、`background-v3-foreground.png`；v3 后景在传送带样式、主题样式和设置对话框中被引用。
- 品牌牌匾：`brand-sign-v2.png`；进度资产：`progress-console-v2.png`、`progress-hanger-v1.png`。
- 运行列车/轮组和送餐车素材：`special-express*.webp`、`special-wheel.webp`、`special-driving-rod.webp`、`delivery-trolley-body-v2.webp`。这些素材在列车、轮组或送餐车组件中被引用。
- Midnight 图标目录内的 SVG 图标均在面板组件中被引用。

发现两组文件内容 SHA-256 完全相同：

- `background-v2.png` 与 `background-v2-b.png`（哈希 `02cacd8a…00f744c9`，各 4,062,626 B）。
- `background-v4-warm-foreground.png` 与未启用的 `background-v5-food-station-foreground.png`（哈希 `acf5785b…413d69b`，各 5,740,463 B）。

未删除重复文件或未引用候选。后续可评估 `background-v2.png` / `background-v2-b.png`、`background-v2-a.png`、v2 前景、旧 `background.png`、旧服务台/购物柜候选、`locomotive.png`、`carriage.png`、`delivery-trolley.webp`、`platform-service-counter-v1.png`，以及未启用的 v5 后景与蒙版。当前引用搜索未匹配到其中部分文件名，但删除前仍需核查历史回退、运行时拼接引用及主题素材依赖。v5 候选继续保留。当前 v4 背景、v3 回退、已引用的列车与轮组素材、进度条、品牌素材、图标及其他主题资源均未移除。

## 文件树、`.git` 与 push 体积

清理前工作区内 483 个 Git 跟踪文件共 292,032,015 字节，约 278.5 MiB；其中历史截图是 159,976,575 字节，约 152.6 MiB。移除跟踪后，Git 工作区的跟踪文件清单少了这 103 张截图。这个变化不会自动清除 `.git` 中已提交的历史对象：本轮没有重写历史，也没有删除对象。

清理前 `git count-objects -vH` 报告 561 个 loose objects、213.55 MiB，另有 1 个 pack、5,607 个 packed objects、pack 62.19 MiB。本轮之后对象计数仍相同；`.git` 目录实测约 289,220,181 字节（275.8 MiB），其中还包括索引、refs、配置等元数据。普通 `git push` 传输的是接收端缺少的提交和对象及协议开销；它不等于工作区大小，也不等于 `.git` 目录大小。若截图对象已在远端，后续 push 通常无需再次传输；如果对象此前未到达远端，解除跟踪的提交仍可能连同所需历史对象上传。要从历史中清除这些对象需要重写历史，本轮明确未做。

## 构建与最终检查

- `npm run build`：通过，Vite 6.3.5 构建完成（12.93 秒）。输出 Sass 弃用提示及已有大 chunk 提示，不影响本次构建成功。
- `git diff --check`：通过，无空白错误。
- `git status --short`：确认仅有 `.gitignore`、12 份截图引用文档修改、103 张截图索引删除，以及本报告新建；源码和业务文件无改动。
- `git ls-files docs/theme-midnight-station-v2/screenshots`：无输出，目录中已无跟踪文件。
- 源码与业务文件：未修改；正式背景及其它主题图片：未删除、未替换。
- Git 历史：无 filter、强制推送、硬重置或历史重建操作。

## 后续 Codex 截图存储

阶段截图默认放在被忽略的 `docs/theme-midnight-station-v2/screenshots/` 本地验收目录；通用视觉生成输出放在被忽略的 `output/imagegen/`；临时视觉实验放在 `.visual-review/`。需要长期保留的结论写入 Markdown 报告，截图通过本地归档目录名和文件名引用。若需跨设备或长期保存，请在仓库外归档并记录路径。
