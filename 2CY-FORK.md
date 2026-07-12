# 2CY Fork 规范 —— 这个 fork 的生命线

> 基座：opencode dev 分支（MIT）。本文档是强约束，所有改动前先读一遍。

## 三条铁律

**一、新增物一律进新包。** 2CY 领域逻辑只允许存在于 `packages/theme-2cy`、`packages/character`、`packages/memory`（未来新增同理）。任何「顺手写进上游包」的诱惑都要抵制——那是三个月后 rebase 地狱的首付。

**二（2026-07-10 由所有者决议修订）：上游同步通道已主动切断。** 全库包名已由 `@2cy/*` 承载、提交历史已重写，rebase 上游不再可行；今后上游的功能与安全修复须人工评估、手动搬运（关注上游 releases，重点盯安全公告）。原「铁律二：不改内部包名」随本决议废止。

**三、能走官方扩展点的绝不改源码。** 优先级：插件工具（`@2cy/plugin` 的 `tool()`）＞ config 自定义 agent（`prompt`/`mode`/工具白名单）＞ JSON 主题（`packages/ui/src/theme/themes/`）＞ CSS 追加层 ＞ 改上游文件。

**三、必须侵入时，只做「注册与注入」，并打标记。** 每一处对上游文件的改动必须带 `// 2CY:` 注释（CSS 用 `/* 2CY: */`，其余语言同理）。当前允许的侵入点白名单只有四处：

1. `packages/app` 路由/布局 —— 挂载角色面板、审批印章、便签等 2CY 组件；
2. `packages/server` 路由 —— 挂载 character / memory 的 HTTP 端点；
3. `packages/opencode/src/session/system.ts` —— system prompt 组装链插入 `<persona>` 与 `<memory>` 区块；
4. `packages/app/src/i18n` —— 中文文案与术语表；
5. `packages/opencode/src/plugin/index.ts` 的 `internalPlugins` 列表 —— 挂载 2CY 内置插件（当前：`@2cy/memory`、`@2cy/character`），使产品工具开箱即用；
6. CLI 品牌字样 —— `index.ts` 的 scriptName 与 `cli/cmd/web.ts` 的启动横幅（体验层 2CY 化；LICENSE 与内部包名不动）；
7. `server/shared/ui.ts` —— 铲除「界面代理到上游托管站」的回退（本地优先红线），改为：嵌入 UI > OPENCODE_WEB_UI_DIR 本地目录（开发用）> 明确 503 报错。

要新开第六处侵入点？先在 issue 里论证为什么三个官方扩展点都不行。

## 上游同步流程（已废止，存档备查）

```bash
git remote add upstream https://github.com/anomalyco/opencode.git   # 仅首次
git fetch upstream
git rebase upstream/dev        # 我们的提交历史应当短而干净，rebase 而非 merge
grep -rn "2CY:" packages/app packages/server packages/opencode | wc -l   # 核对侵入点是否全部存活
bun install && bun turbo typecheck && bun test                       # 全绿才算完成同步
```

冲突处理原则：上游赢。我们的改动被上游重构冲掉时，把 2CY 逻辑重新注入新结构，而不是保卫旧结构。

## 术语表（i18n 与 UI 文案统一用这套）

| 上游概念 | 2CY 术语 |
|---|---|
| build agent | 执笔 |
| plan agent / plan mode | 分镜 |
| task / subagent | 分身 |
| explore agent | 探子 |
| compaction 摘要 | 前情提要 |
| revert | 回到这一格 |
| permission: allow once / always / deny | 准 / 全权委托 / 不行 |
| todo | 桌角便签 |

## 不做的事（同样是规范）

不删除用不到的上游包（enterprise / console / slack / stats 等），只是不构建、不分发；不删开发者面板 UI，折叠进「工房抽屉」；不 fork 后改包名 `@2cy/*`（改名会把每次 rebase 变成全仓库冲突）。

## 许可合规

MIT：保留上游 LICENSE 与版权声明；README 显著注明「基于 opencode 魔改」，这既是义务，也是产品故事的一部分。

## CI 工作流暂存说明（2026-07-09）

`.github/workflows/` 已整体暂存：上游官方流水线在 `ci/upstream-workflows/`（fork 中不应原样运行——那是 opencode 官方的发布/测试流水线，缺少其 secrets，只会失败并消耗 Actions 配额）；2CY 自己的编译流水线在 `ci/2cy-build.yml`，激活方法见《上手指南.md》第二步。上游 rebase 时若 workflows 有更新，同步进暂存目录即可。


## 界面皮肤的接线方式（2026-07-12 立）

会话界面的原稿风（气泡、分镜格、便签、前情提要、印章、分身脊）**全部通过 `data-slot` / `data-component` 属性选择器在 `@2cy/theme` 的 CSS 里挂皮，不改任何上游组件代码**。好处：上游重构布局时，最坏情况是皮肤失效（外观回退为默认），绝不会撞坏功能，也不产生代码冲突。新增皮肤一律沿用此法。
