# Developer Guide

完整的开发者文档，整合了开发计划、进度跟踪和技术细节。

## 项目概述

AI Paper Analysis 是一个 Zotero 7 插件，使用多个 LLM 提供商（OpenAI, DeepSeek, 阿里云, 字节等）对学术论文进行智能分析。

**技术栈:**
- TypeScript + Zotero Plugin Template
- Build: ESBuild via zotero-plugin-scaffold
- UI: XUL/XHTML
- Charts: ECharts
- LLM: Native fetch API（无外部 SDK）

## 快速开始

```bash
# 环境要求: Node.js 20.17+ 或 22.9+
npm install
npm run build    # 构建
npm start        # 开发模式（热重载）
npm run test:stage6  # 运行测试
```

## 架构概览

```
核心模块:
├── LLMManager         # 多提供商 AI API 抽象
├── PromptManager      # 提示词 CRUD
├── AnalysisEngine     # PDF 提取 + LLM 调度
├── ContextMenu        # 右键菜单集成
└── VisualizationTab   # ECharts 仪表板

数据流:
1. 用户右键选择分析提示词
2. TextExtractor 提取 PDF + 元数据
3. LLMManager 调用 AI API
4. NoteCreator 生成带元数据的笔记
5. DataAggregator 聚合所有笔记数据
6. VisualizationTab 渲染图表
```

详细架构请参考 [CLAUDE.md](../CLAUDE.md)。

## 开发状态

**当前版本**: v0.1.0（开发中）

**已完成** (约 85%):
- ✅ 阶段一: 项目初始化
- ✅ 阶段二: LLM API 集成（5 个提供商）
- ✅ 阶段三: 核心功能（分析引擎、提示词、笔记）
- ✅ 阶段四: 可视化汇总（5 种图表）
- ✅ 阶段五: 设置面板和 UI
- 🔄 阶段六: 测试和发布（85% 完成）

**待完成**:
- [ ] 真实 Zotero 环境内的手动验证
- [ ] 打包发布 v0.1.0

详细进度参考 [PROGRESS.md](PROGRESS.md)（归档）。

## 添加新 LLM Provider

**重要**: 所有 Provider 使用 native fetch API，不使用外部 SDK。

1. 创建 `src/modules/llm/newprovider.ts`，继承 `BaseLLMProvider`
2. 实现必需方法:
   - `getProviderName()` - 显示名称
   - `chat()` - 通过 OpenAI 兼容端点调用
   - `validateApiKey()` - 测试 API 连接
   - `listModels()` - 返回可用模型
   - `request<T>()` - HTTP 请求（使用 `globalThis.fetch`）

参考实现: [DeepSeekProvider](../src/modules/llm/deepseek.ts)

**模板:**
```typescript
private async request<T>(path: string, options = {}): Promise<T> {
  const fetchFn = (globalThis as any).fetch;
  const AbortControllerCtor = (globalThis as any).AbortController;
  const controller = AbortControllerCtor ? new AbortControllerCtor() : null;
  
  // 超时处理（可选）
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  if (controller && this.timeout > 0) {
    timeoutId = setTimeout(() => controller.abort(), this.timeout);
  }
  
  try {
    const response = await fetchFn(this.buildURL(path), {
      method: options.method || "GET",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller ? controller.signal : undefined,
    });
    
    // 解析响应...
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
```

3. 在 [LLMManager](../src/modules/llm/manager.ts) 中注册
4. 添加到 [preferenceScript.ts](../src/modules/preferenceScript.ts) 的 PROVIDERS 数组
5. 更新 UI [preferences.xhtml](../addon/content/preferences.xhtml)

## 技术迁移记录

### 2025-11-11: Native Fetch API Migration

**问题**: "AbortController is not defined" 错误（Windows/macOS）

**解决方案**: 移除所有 SDK（openai, @anthropic-ai/sdk），全部改用 native fetch。

**影响**:
- ❌ 移除 Anthropic Provider
- ✅ Bundle 减小 75% (~620KB)
- ✅ 跨平台兼容性改善

详细技术细节: [MIGRATION_NOTES.md](MIGRATION_NOTES.md)

## 测试

```bash
npm run test:stage6     # 自动回归测试（9 个用例）
npm run build          # 构建验证
npm run lint:check     # 代码风格检查
```

测试覆盖:
- ✅ PromptManager CRUD
- ✅ LLMManager 配置持久化
- ✅ 可视化导出（JSON/CSV/Markdown）
- ✅ 性能基准（CSV 导出 < 500ms）

详细报告: [TESTING_REPORT.md](TESTING_REPORT.md)

## 调试

### Zotero Debug Output

```javascript
// Zotero → 帮助 → Developer → Run JavaScript
Zotero.Debug.setStore(true);
Zotero.Debug.get();  // 查看日志
```

### 诊断工具

使用 [debug-bridge](../debug-bridge/) 脚本快速排查问题:

```bash
cd debug-bridge
./run-all.sh              # 运行所有诊断
node cli.cjs run diagnose-analysis.js
```

### 常见问题

- `styleText is not exported` → 升级 Node.js 到 22+
- `Failed to register preference pane` → 检查 locale 文件
- `AbortController is not defined` → 已修复（v0.1.0+）

完整排查指南: [TROUBLESHOOTING.md](../TROUBLESHOOTING.md)

## 发布流程

1. 更新 [package.json](../package.json) 版本号
2. 运行 `npm run build` 验证
3. 运行 `npm run test:stage6`
4. 创建 git tag: `git tag v0.x.x && git push --tags`
5. GitHub Actions 自动构建 `.xpi`
6. 撰写 Release Notes（参考 [docs/RELEASE_NOTES.md](RELEASE_NOTES.md)）

## 资源

- [Zotero Plugin Template](https://github.com/windingwind/zotero-plugin-template)
- [Zotero Plugin Toolkit](https://github.com/windingwind/zotero-plugin-toolkit)
- [ECharts 示例](https://echarts.apache.org/examples/)

## 归档文档

- [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md) - 原始详细开发计划（52K，已归档参考）
- [PROGRESS.md](PROGRESS.md) - 阶段性进度跟踪（已归档参考）

---

_本文档由 DEVELOPMENT_PLAN.md, PROGRESS.md, MIGRATION_NOTES.md 整合而成_
