# Zotero AI论文分析插件 - 开发方案

## 项目概述

### 项目名称

AIPaperAnalysis - 基于大模型的Zotero文献分析插件

### 项目目标

开发一个功能强大的Zotero插件，利用多种大模型API（DeepSeek、阿里通义、Claude、字节豆包、OpenAI及自定义API）对学术文献进行智能分析，并提供可视化的汇总视图。

### 核心功能

1. **右键菜单分析**：右击文献选择自定义提示词进行AI分析
2. **智能笔记生成**：分析结果自动保存为Markdown格式子笔记，包含元数据
3. **可视化汇总**：专门的标签页展示所有分析结果，提供多种图表
4. **多API支持**：支持多个LLM提供商，用户可自由配置和切换
5. **提示词管理**：用户可自定义、编辑、添加、删除分析提示词

---

## 技术架构

### 技术栈选型

| 组件     | 技术选择                           | 理由                                   |
| -------- | ---------------------------------- | -------------------------------------- |
| 开发模板 | windingwind/zotero-plugin-template | 官方推荐，完善的TypeScript支持，热重载 |
| 编程语言 | TypeScript                         | 类型安全，IDE支持好，符合Zotero生态    |
| 构建工具 | ESBuild                            | Zotero插件标准，快速构建               |
| 工具库   | zotero-plugin-toolkit              | 简化菜单、UI、对话框等开发             |
| 图表库   | ECharts                            | 功能丰富，性能优秀，中文文档完善       |
| LLM SDK  | openai SDK                         | 兼容OpenAI格式的多种API                |
| 包管理器 | npm                                | 主流选择，生态完善                     |

### 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    Zotero主窗口                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ 文献列表      │  │ 右键菜单      │  │ 汇总标签页    │      │
│  │              │  │ - AI分析      │  │ - 时间线图表  │      │
│  │ [右键]       │  │ - 提示词1     │  │ - 主题分类    │      │
│  │              │  │ - 提示词2     │  │ - 引用关系    │      │
│  │              │  │ - ...         │  │ - 关键词云    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    插件核心模块                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ LLM API管理器 (多提供商抽象层)                         │  │
│  │  - OpenAI │ Anthropic │ DeepSeek │ 阿里 │ 字节 │ 自定义 │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ 分析引擎      │  │ 提示词管理    │  │ 文本提取器    │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ 笔记生成器    │  │ 数据聚合器    │  │ 可视化引擎    │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    数据存储                                  │
│  - Zotero文献条目                                           │
│  - Markdown格式子笔记（含元数据）                            │
│  - 用户偏好设置（API密钥、提示词模板等）                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 项目结构

```
AIPaperAnalysis/
├── .github/
│   └── workflows/
│       └── build.yml              # GitHub Actions自动构建
├── src/
│   ├── index.ts                   # 插件入口文件
│   ├── modules/
│   │   ├── llm/                   # LLM API集成模块
│   │   │   ├── base.ts            # 抽象基类
│   │   │   ├── openai.ts          # OpenAI提供商
│   │   │   ├── anthropic.ts       # Anthropic/Claude
│   │   │   ├── deepseek.ts        # DeepSeek
│   │   │   ├── aliyun.ts          # 阿里通义千问
│   │   │   ├── bytedance.ts       # 字节豆包
│   │   │   ├── custom.ts          # 自定义API
│   │   │   └── manager.ts         # LLM管理器
│   │   ├── analyzer/              # 分析引擎
│   │   │   ├── engine.ts          # 分析引擎核心
│   │   │   ├── extractor.ts       # 文本提取（PDF、元数据）
│   │   │   └── parser.ts          # 结果解析器
│   │   ├── prompts/               # 提示词管理
│   │   │   ├── manager.ts         # 提示词CRUD
│   │   │   ├── templates.ts       # 默认模板
│   │   │   └── storage.ts         # 持久化存储
│   │   ├── menu/                  # 右键菜单
│   │   │   ├── context-menu.ts    # 上下文菜单注册
│   │   │   └── actions.ts         # 菜单动作处理
│   │   ├── notes/                 # 笔记管理
│   │   │   ├── creator.ts         # 笔记创建器
│   │   │   ├── formatter.ts       # Markdown格式化
│   │   │   └── metadata.ts        # 元数据处理
│   │   ├── visualization/         # 可视化模块
│   │   │   ├── aggregator.ts      # 数据聚合器
│   │   │   ├── charts/            # 图表组件
│   │   │   │   ├── timeline.ts    # 时间线图表
│   │   │   │   ├── topic.ts       # 主题分类图
│   │   │   │   ├── citation.ts    # 引用关系图
│   │   │   │   ├── wordcloud.ts   # 关键词云
│   │   │   │   └── methods.ts     # 研究方法统计
│   │   │   ├── tab.ts             # 汇总标签页
│   │   │   └── renderer.ts        # 渲染引擎
│   │   └── preferences/           # 设置面板
│   │       ├── pane.ts            # 偏好设置面板
│   │       ├── api-config.ts      # API配置UI
│   │       └── prompt-editor.ts   # 提示词编辑器
│   ├── utils/
│   │   ├── logger.ts              # 日志工具
│   │   ├── storage.ts             # 本地存储工具
│   │   └── i18n.ts                # 国际化工具
│   └── types/
│       ├── analysis.ts            # 分析相关类型
│       ├── llm.ts                 # LLM相关类型
│       └── chart.ts               # 图表相关类型
├── addon/
│   ├── bootstrap.js               # 插件引导文件
│   ├── manifest.json              # 插件清单
│   ├── locale/                    # 本地化文件
│   │   ├── en-US/
│   │   │   └── addon.ftl
│   │   └── zh-CN/
│   │       └── addon.ftl
│   ├── content/
│   │   ├── icons/                 # 图标资源
│   │   ├── visualization.html     # 可视化页面
│   │   └── styles/                # 样式文件
│   └── skin/
│       └── default.css
├── build/                         # 构建输出目录
├── typings/                       # TypeScript类型定义
├── .env                           # 环境配置（本地）
├── .gitignore
├── package.json
├── tsconfig.json
├── README.md
└── DEVELOPMENT_PLAN.md            # 本文档
```

---

## 开发路线图

### 阶段一：项目初始化（预计2小时）

#### 1.1 克隆和配置模板

```bash
# 克隆模板
git clone https://github.com/windingwind/zotero-plugin-template.git temp-template
cd temp-template

# 复制文件到当前项目（排除.git）
cp -r src addon build scripts typings .env.example package.json tsconfig.json ../

# 返回项目目录
cd ..
rm -rf temp-template
```

#### 1.2 配置项目元数据

**package.json 修改**：

```json
{
  "name": "ai-paper-analysis",
  "version": "0.1.0",
  "description": "AI-powered paper analysis plugin for Zotero",
  "config": {
    "addonName": "AI Paper Analysis",
    "addonID": "ai-paper-analysis@fsmeng.com",
    "addonRef": "aipaperanalysis",
    "addonInstance": "AIPaperAnalysis",
    "prefsPrefix": "extensions.aipaperanalysis"
  }
}
```

**manifest.json 配置**：

```json
{
  "manifest_version": 2,
  "name": "AI Paper Analysis",
  "version": "0.1.0",
  "description": "Analyze research papers using AI language models",
  "author": "Your Name",
  "homepage_url": "https://github.com/yourusername/AIPaperAnalysis",
  "icons": {
    "48": "content/icons/icon.png",
    "96": "content/icons/icon@2x.png"
  },
  "applications": {
    "zotero": {
      "id": "ai-paper-analysis@fsmeng.com",
      "update_url": "https://github.com/yourusername/AIPaperAnalysis/releases/latest/download/update.json",
      "strict_min_version": "6.999",
      "strict_max_version": "7.0.*"
    }
  }
}
```

#### 1.3 安装依赖

```bash
npm install

# 安装额外依赖
npm install openai echarts
npm install @anthropic-ai/sdk  # Anthropic Claude SDK
npm install --save-dev @types/echarts
```

#### 1.4 配置开发环境

```bash
# 创建.env文件
cp .env.example .env

# 编辑.env，设置Zotero路径
# ZOTERO_PLUGIN_ZOTERO_BIN_PATH=/Applications/Zotero.app/Contents/MacOS/zotero
```

#### 1.5 验证基础功能

```bash
npm run build
npm start  # 热重载开发模式
```

---

### 阶段二：LLM API集成（预计6小时）

#### 2.1 定义类型系统

**src/types/llm.ts**：

```typescript
export interface LLMProvider {
  id: string;
  name: string;
  baseURL?: string;
  apiKey: string;
  models: LLMModel[];
}

export interface LLMModel {
  id: string;
  name: string;
  maxTokens: number;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface ChatCompletionResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
```

#### 2.2 实现抽象基类

**src/modules/llm/base.ts**：

```typescript
export abstract class BaseLLMProvider {
  protected apiKey: string;
  protected baseURL?: string;

  constructor(apiKey: string, baseURL?: string) {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
  }

  abstract chat(
    request: ChatCompletionRequest,
  ): Promise<ChatCompletionResponse>;
  abstract listModels(): Promise<LLMModel[]>;
  abstract validateApiKey(): Promise<boolean>;
}
```

#### 2.3 实现各提供商

**OpenAI**（src/modules/llm/openai.ts）：

```typescript
import OpenAI from "openai";

export class OpenAIProvider extends BaseLLMProvider {
  private client: OpenAI;

  constructor(apiKey: string, baseURL?: string) {
    super(apiKey, baseURL);
    this.client = new OpenAI({
      apiKey,
      baseURL: baseURL || "https://api.openai.com/v1",
    });
  }

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const response = await this.client.chat.completions.create({
      model: request.model,
      messages: request.messages,
      temperature: request.temperature || 0.7,
      max_tokens: request.maxTokens,
    });

    return {
      content: response.choices[0].message.content || "",
      model: response.model,
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
    };
  }

  // ... 其他方法实现
}
```

类似地实现其他提供商：

- **Anthropic** (Claude)
- **DeepSeek**
- **Aliyun** (通义千问)
- **Bytedance** (豆包)
- **Custom** (自定义API)

#### 2.4 实现LLM管理器

**src/modules/llm/manager.ts**：

```typescript
export class LLMManager {
  private providers: Map<string, BaseLLMProvider>;
  private activeProvider: string | null;

  constructor() {
    this.providers = new Map();
    this.loadProviders();
  }

  addProvider(id: string, provider: BaseLLMProvider) {
    this.providers.set(id, provider);
  }

  setActiveProvider(id: string) {
    if (!this.providers.has(id)) {
      throw new Error(`Provider ${id} not found`);
    }
    this.activeProvider = id;
  }

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    if (!this.activeProvider) {
      throw new Error("No active provider");
    }
    const provider = this.providers.get(this.activeProvider)!;
    return provider.chat(request);
  }

  private loadProviders() {
    // 从Zotero偏好设置加载API配置
    const prefs = Zotero.Prefs.get("extensions.aipaperanalysis");
    // ... 初始化各个提供商
  }
}
```

---

### 阶段三：核心功能开发（预计8小时）

#### 3.1 文本提取器

**src/modules/analyzer/extractor.ts**：

```typescript
export class TextExtractor {
  /**
   * 从Zotero文献条目提取文本
   */
  async extractFromItem(item: Zotero.Item): Promise<string> {
    let text = "";

    // 1. 提取元数据
    const metadata = this.extractMetadata(item);
    text += metadata;

    // 2. 从PDF附件提取正文
    const attachments = item.getAttachments();
    for (const attachmentID of attachments) {
      const attachment = await Zotero.Items.getAsync(attachmentID);
      if (attachment.attachmentContentType === "application/pdf") {
        const pdfText = await this.extractFromPDF(attachment);
        text += "\n\n" + pdfText;
      }
    }

    return text;
  }

  private extractMetadata(item: Zotero.Item): string {
    const title = item.getField("title") || "";
    const authors = item
      .getCreators()
      .map((c) => c.firstName + " " + c.lastName)
      .join(", ");
    const year = item.getField("date")?.substring(0, 4) || "";
    const abstract = item.getField("abstractNote") || "";

    return `Title: ${title}\nAuthors: ${authors}\nYear: ${year}\nAbstract: ${abstract}`;
  }

  private async extractFromPDF(attachment: Zotero.Item): Promise<string> {
    // 使用Zotero内置的PDF文本提取
    const path = await attachment.getFilePathAsync();
    if (!path) return "";

    try {
      // Zotero 7提供的PDF文本提取API
      const text = await Zotero.Fulltext.indexPDF(attachment.id);
      return text || "";
    } catch (error) {
      console.error("PDF extraction failed:", error);
      return "";
    }
  }
}
```

#### 3.2 提示词管理

**src/modules/prompts/manager.ts**：

```typescript
export interface Prompt {
  id: string;
  name: string;
  content: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class PromptManager {
  private prompts: Prompt[];

  constructor() {
    this.prompts = this.loadPrompts();
  }

  async addPrompt(name: string, content: string): Promise<Prompt> {
    const prompt: Prompt = {
      id: this.generateId(),
      name,
      content,
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.prompts.push(prompt);
    await this.savePrompts();
    return prompt;
  }

  async updatePrompt(id: string, updates: Partial<Prompt>): Promise<void> {
    const prompt = this.prompts.find((p) => p.id === id);
    if (!prompt) throw new Error("Prompt not found");
    Object.assign(prompt, updates, { updatedAt: new Date() });
    await this.savePrompts();
  }

  async deletePrompt(id: string): Promise<void> {
    const index = this.prompts.findIndex((p) => p.id === id);
    if (index === -1) throw new Error("Prompt not found");
    this.prompts.splice(index, 1);
    await this.savePrompts();
  }

  getAllPrompts(): Prompt[] {
    return [...this.prompts];
  }

  private loadPrompts(): Prompt[] {
    const stored = Zotero.Prefs.get("extensions.aipaperanalysis.prompts");
    if (stored) {
      return JSON.parse(stored as string);
    }
    // 返回默认提示词
    return this.getDefaultPrompts();
  }

  private async savePrompts(): Promise<void> {
    Zotero.Prefs.set(
      "extensions.aipaperanalysis.prompts",
      JSON.stringify(this.prompts),
    );
  }

  private getDefaultPrompts(): Prompt[] {
    return [
      {
        id: "summary",
        name: "论文摘要",
        content:
          "请用中文总结这篇论文的核心内容，包括：研究问题、方法、主要发现和贡献。控制在300字以内。",
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "methodology",
        name: "研究方法",
        content:
          "请详细分析这篇论文使用的研究方法，包括：实验设计、数据收集方式、分析技术等。",
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "innovation",
        name: "创新点",
        content: "请提取这篇论文的主要创新点和贡献，与现有研究的区别是什么？",
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "limitations",
        name: "局限性",
        content: "请分析这篇论文的局限性和未来研究方向。",
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }

  private generateId(): string {
    return `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

#### 3.3 分析引擎

**src/modules/analyzer/engine.ts**：

```typescript
import { LLMManager } from "../llm/manager";
import { TextExtractor } from "./extractor";
import { PromptManager } from "../prompts/manager";

export interface AnalysisResult {
  itemId: number;
  promptId: string;
  promptName: string;
  content: string;
  model: string;
  provider: string;
  timestamp: Date;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class AnalysisEngine {
  private llmManager: LLMManager;
  private textExtractor: TextExtractor;
  private promptManager: PromptManager;

  constructor() {
    this.llmManager = new LLMManager();
    this.textExtractor = new TextExtractor();
    this.promptManager = new PromptManager();
  }

  async analyzeItem(
    item: Zotero.Item,
    promptId: string,
  ): Promise<AnalysisResult> {
    // 1. 提取文本
    const text = await this.textExtractor.extractFromItem(item);

    // 2. 获取提示词
    const prompt = this.promptManager
      .getAllPrompts()
      .find((p) => p.id === promptId);
    if (!prompt) throw new Error("Prompt not found");

    // 3. 调用LLM
    const response = await this.llmManager.chat({
      model: this.getCurrentModel(),
      messages: [
        {
          role: "system",
          content: "你是一个专业的学术论文分析助手。",
        },
        {
          role: "user",
          content: `${prompt.content}\n\n论文内容：\n${text}`,
        },
      ],
      temperature: 0.7,
      maxTokens: 2000,
    });

    // 4. 返回结果
    return {
      itemId: item.id,
      promptId: prompt.id,
      promptName: prompt.name,
      content: response.content,
      model: response.model,
      provider: this.llmManager.getActiveProvider(),
      timestamp: new Date(),
      usage: response.usage,
    };
  }

  async analyzeBatch(
    items: Zotero.Item[],
    promptId: string,
  ): Promise<AnalysisResult[]> {
    const results: AnalysisResult[] = [];

    for (const item of items) {
      try {
        const result = await this.analyzeItem(item, promptId);
        results.push(result);

        // 显示进度
        Zotero.ProgressWindow.show(
          `分析进度: ${results.length}/${items.length}`,
        );
      } catch (error) {
        console.error(`分析失败 (Item ID: ${item.id}):`, error);
      }
    }

    return results;
  }

  private getCurrentModel(): string {
    return (
      (Zotero.Prefs.get("extensions.aipaperanalysis.currentModel") as string) ||
      "gpt-4"
    );
  }
}
```

#### 3.4 笔记生成器

**src/modules/notes/creator.ts**：

```typescript
import { AnalysisResult } from "../analyzer/engine";

export class NoteCreator {
  async createNoteFromAnalysis(result: AnalysisResult): Promise<Zotero.Item> {
    const item = await Zotero.Items.getAsync(result.itemId);

    // 创建Markdown格式的笔记内容
    const content = this.formatNoteContent(result);

    // 创建笔记
    const note = new Zotero.Item("note");
    note.parentID = result.itemId;
    note.setNote(content);

    // 添加标签
    note.addTag("ai-analysis");
    note.addTag(`prompt:${result.promptId}`);

    await note.saveTx();

    return note;
  }

  private formatNoteContent(result: AnalysisResult): string {
    const markdown = `
# ${result.promptName}

${result.content}

---

**元数据**
- 分析时间: ${result.timestamp.toLocaleString("zh-CN")}
- 使用模型: ${result.model}
- 提供商: ${result.provider}
${result.usage ? `- Token使用: ${result.usage.totalTokens} (输入: ${result.usage.promptTokens}, 输出: ${result.usage.completionTokens})` : ""}

---

*此笔记由 AI Paper Analysis 插件自动生成*
    `.trim();

    // 转换为HTML（Zotero笔记使用HTML）
    return this.markdownToHTML(markdown);
  }

  private markdownToHTML(markdown: string): string {
    // 简单的Markdown到HTML转换
    // 可以使用marked库或其他Markdown解析器
    let html = markdown
      .replace(/^# (.+)$/gm, "<h1>$1</h1>")
      .replace(/^## (.+)$/gm, "<h2>$1</h2>")
      .replace(/^### (.+)$/gm, "<h3>$1</h3>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/^- (.+)$/gm, "<li>$1</li>")
      .replace(/---/g, "<hr>")
      .replace(/\n\n/g, "</p><p>")
      .replace(/^(?!<[h|l|p])/gm, "<p>")
      .replace(/(?<![h|l|p]>)$/gm, "</p>");

    return html;
  }

  async createBatchNotes(results: AnalysisResult[]): Promise<Zotero.Item[]> {
    const notes: Zotero.Item[] = [];

    for (const result of results) {
      try {
        const note = await this.createNoteFromAnalysis(result);
        notes.push(note);
      } catch (error) {
        console.error(`创建笔记失败 (Item ID: ${result.itemId}):`, error);
      }
    }

    return notes;
  }
}
```

#### 3.5 右键菜单

**src/modules/menu/context-menu.ts**：

```typescript
import { PromptManager } from "../prompts/manager";
import { AnalysisEngine } from "../analyzer/engine";
import { NoteCreator } from "../notes/creator";

export class ContextMenu {
  private promptManager: PromptManager;
  private analysisEngine: AnalysisEngine;
  private noteCreator: NoteCreator;
  private menuElements: Element[] = [];

  constructor() {
    this.promptManager = new PromptManager();
    this.analysisEngine = new AnalysisEngine();
    this.noteCreator = new NoteCreator();
  }

  register() {
    const doc = Zotero.getMainWindow().document;

    // 创建主菜单
    const mainMenu = doc.createElementNS(
      "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul",
      "menu",
    );
    mainMenu.id = "ai-paper-analysis-menu";
    mainMenu.setAttribute("label", "AI分析");
    mainMenu.setAttribute("class", "menuitem-iconic");

    // 创建弹出菜单
    const popup = mainMenu.appendChild(
      doc.createElementNS(
        "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul",
        "menupopup",
      ),
    );
    popup.id = "ai-paper-analysis-popup";

    // 添加提示词菜单项
    const prompts = this.promptManager.getAllPrompts();
    prompts.forEach((prompt) => {
      const menuitem = doc.createElementNS(
        "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul",
        "menuitem",
      );
      menuitem.id = `ai-analysis-${prompt.id}`;
      menuitem.setAttribute("label", prompt.name);
      menuitem.addEventListener("command", () =>
        this.handleAnalysis(prompt.id),
      );
      popup.appendChild(menuitem);
      this.menuElements.push(menuitem);
    });

    // 添加分隔符
    const separator = doc.createElementNS(
      "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul",
      "menuseparator",
    );
    popup.appendChild(separator);
    this.menuElements.push(separator);

    // 添加"管理提示词"菜单项
    const manageItem = doc.createElementNS(
      "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul",
      "menuitem",
    );
    manageItem.id = "ai-analysis-manage-prompts";
    manageItem.setAttribute("label", "管理提示词...");
    manageItem.addEventListener("command", () => this.openPromptManager());
    popup.appendChild(manageItem);
    this.menuElements.push(manageItem);

    // 添加到Zotero右键菜单
    const itemMenu = doc.getElementById("zotero-itemmenu");
    if (itemMenu) {
      itemMenu.appendChild(mainMenu);
      this.menuElements.push(mainMenu);
    }
  }

  unregister() {
    // 清理所有菜单元素
    this.menuElements.forEach((element) => {
      element.remove();
    });
    this.menuElements = [];
  }

  private async handleAnalysis(promptId: string) {
    const selectedItems = Zotero.getActiveZoteroPane().getSelectedItems();

    if (selectedItems.length === 0) {
      Zotero.alert(null, "提示", "请先选择文献条目");
      return;
    }

    // 显示进度窗口
    const progressWin = new Zotero.ProgressWindow();
    progressWin.changeHeadline("AI分析进行中...");
    progressWin.show();
    progressWin.startCloseTimer(5000);

    try {
      // 执行分析
      const results = await this.analysisEngine.analyzeBatch(
        selectedItems,
        promptId,
      );

      // 创建笔记
      await this.noteCreator.createBatchNotes(results);

      progressWin.changeHeadline("分析完成！");
      progressWin.addDescription(`成功分析 ${results.length} 篇文献`);
    } catch (error) {
      console.error("分析失败:", error);
      Zotero.alert(null, "错误", `分析失败: ${error.message}`);
    }
  }

  private openPromptManager() {
    // 打开提示词管理对话框
    const win = Zotero.getMainWindow();
    win.openDialog(
      "chrome://aipaperanalysis/content/prompt-manager.xhtml",
      "prompt-manager",
      "chrome,centerscreen,modal",
      {},
    );
  }
}
```

---

### 阶段四：可视化汇总页面（预计10小时）

#### 4.1 数据聚合器

**src/modules/visualization/aggregator.ts**：

```typescript
export interface AggregatedData {
  timeline: TimelineData[];
  topics: TopicData[];
  citations: CitationData;
  keywords: KeywordData[];
  methods: MethodData[];
}

export interface TimelineData {
  year: string;
  count: number;
  items: number[];
}

export interface TopicData {
  topic: string;
  count: number;
  items: number[];
}

export interface CitationData {
  nodes: { id: number; title: string; year: string }[];
  links: { source: number; target: number; weight: number }[];
}

export interface KeywordData {
  word: string;
  frequency: number;
}

export interface MethodData {
  method: string;
  count: number;
}

export class DataAggregator {
  async aggregateAnalysisResults(): Promise<AggregatedData> {
    // 查找所有带有ai-analysis标签的笔记
    const notes = await this.findAnalysisNotes();

    // 聚合数据
    const timeline = await this.buildTimeline(notes);
    const topics = await this.extractTopics(notes);
    const citations = await this.buildCitationNetwork(notes);
    const keywords = await this.extractKeywords(notes);
    const methods = await this.extractMethods(notes);

    return { timeline, topics, citations, keywords, methods };
  }

  private async findAnalysisNotes(): Promise<Zotero.Item[]> {
    const search = new Zotero.Search();
    search.addCondition("itemType", "is", "note");
    search.addCondition("tag", "is", "ai-analysis");

    const itemIds = await search.search();
    return await Zotero.Items.getAsync(itemIds);
  }

  private async buildTimeline(notes: Zotero.Item[]): Promise<TimelineData[]> {
    const timelineMap = new Map<string, number[]>();

    for (const note of notes) {
      const parentItem = await Zotero.Items.getAsync(note.parentID);
      if (!parentItem) continue;

      const year = parentItem.getField("date")?.substring(0, 4) || "Unknown";

      if (!timelineMap.has(year)) {
        timelineMap.set(year, []);
      }
      timelineMap.get(year)!.push(parentItem.id);
    }

    return Array.from(timelineMap.entries())
      .map(([year, items]) => ({
        year,
        count: items.length,
        items,
      }))
      .sort((a, b) => a.year.localeCompare(b.year));
  }

  private async extractTopics(notes: Zotero.Item[]): Promise<TopicData[]> {
    // 使用AI提取的主题信息
    // 这里简化处理，实际可以从笔记内容中解析
    const topicMap = new Map<string, number[]>();

    for (const note of notes) {
      const content = note.getNote();
      const topics = this.parseTopicsFromContent(content);

      topics.forEach((topic) => {
        if (!topicMap.has(topic)) {
          topicMap.set(topic, []);
        }
        topicMap.get(topic)!.push(note.parentID);
      });
    }

    return Array.from(topicMap.entries())
      .map(([topic, items]) => ({
        topic,
        count: items.length,
        items,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // 取前10个主题
  }

  private parseTopicsFromContent(content: string): string[] {
    // 简单的主题提取逻辑
    // 实际应该使用更复杂的NLP或从结构化笔记中提取
    const topics: string[] = [];

    // 查找常见主题关键词
    const topicPatterns = [
      /主题[:：]\s*(.+)/g,
      /研究领域[:：]\s*(.+)/g,
      /关键词[:：]\s*(.+)/g,
    ];

    topicPatterns.forEach((pattern) => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        topics.push(...match[1].split(/[,，、]/));
      }
    });

    return topics.map((t) => t.trim()).filter((t) => t.length > 0);
  }

  private async buildCitationNetwork(
    notes: Zotero.Item[],
  ): Promise<CitationData> {
    const nodes: CitationData["nodes"] = [];
    const links: CitationData["links"] = [];
    const itemIds = new Set<number>();

    // 收集所有相关文献
    for (const note of notes) {
      const parentItem = await Zotero.Items.getAsync(note.parentID);
      if (!parentItem) continue;

      if (!itemIds.has(parentItem.id)) {
        itemIds.add(parentItem.id);
        nodes.push({
          id: parentItem.id,
          title: parentItem.getField("title") || "Untitled",
          year: parentItem.getField("date")?.substring(0, 4) || "",
        });
      }

      // 查找引用关系（通过Zotero的related items）
      const relatedItems = parentItem.relatedItems || [];
      relatedItems.forEach((relatedId) => {
        if (itemIds.has(relatedId)) {
          links.push({
            source: parentItem.id,
            target: relatedId,
            weight: 1,
          });
        }
      });
    }

    return { nodes, links };
  }

  private async extractKeywords(notes: Zotero.Item[]): Promise<KeywordData[]> {
    const keywordFreq = new Map<string, number>();

    for (const note of notes) {
      const content = note.getNote();
      const keywords = this.extractKeywordsFromContent(content);

      keywords.forEach((keyword) => {
        keywordFreq.set(keyword, (keywordFreq.get(keyword) || 0) + 1);
      });
    }

    return Array.from(keywordFreq.entries())
      .map(([word, frequency]) => ({ word, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 50); // 取前50个关键词
  }

  private extractKeywordsFromContent(content: string): string[] {
    // 简化版关键词提取
    // 实际应该使用TF-IDF或其他NLP技术
    const text = content.replace(/<[^>]+>/g, ""); // 移除HTML标签
    const words = text.match(/[\u4e00-\u9fa5]{2,}|[a-zA-Z]{3,}/g) || [];

    // 过滤停用词
    const stopWords = new Set([
      "这个",
      "那个",
      "可以",
      "进行",
      "研究",
      "分析",
      "方法",
    ]);
    return words.filter((word) => !stopWords.has(word));
  }

  private async extractMethods(notes: Zotero.Item[]): Promise<MethodData[]> {
    const methodFreq = new Map<string, number>();

    // 常见研究方法关键词
    const methodKeywords = [
      "实验研究",
      "问卷调查",
      "案例研究",
      "文献综述",
      "定性研究",
      "定量研究",
      "混合方法",
      "元分析",
      "深度学习",
      "机器学习",
      "统计分析",
      "内容分析",
    ];

    for (const note of notes) {
      const content = note.getNote();

      methodKeywords.forEach((method) => {
        if (content.includes(method)) {
          methodFreq.set(method, (methodFreq.get(method) || 0) + 1);
        }
      });
    }

    return Array.from(methodFreq.entries())
      .map(([method, count]) => ({ method, count }))
      .sort((a, b) => b.count - a.count);
  }
}
```

#### 4.2 图表组件

**src/modules/visualization/charts/timeline.ts**（示例）：

```typescript
import * as echarts from "echarts";
import { TimelineData } from "../aggregator";

export class TimelineChart {
  render(container: HTMLElement, data: TimelineData[]) {
    const chart = echarts.init(container);

    const option = {
      title: {
        text: "文献发表时间分布",
        left: "center",
      },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
        },
      },
      xAxis: {
        type: "category",
        data: data.map((d) => d.year),
        axisLabel: {
          rotate: 45,
        },
      },
      yAxis: {
        type: "value",
        name: "文献数量",
      },
      series: [
        {
          name: "文献数量",
          type: "bar",
          data: data.map((d) => d.count),
          itemStyle: {
            color: "#5470c6",
          },
          emphasis: {
            itemStyle: {
              color: "#91cc75",
            },
          },
        },
      ],
      grid: {
        left: "3%",
        right: "4%",
        bottom: "10%",
        containLabel: true,
      },
    };

    chart.setOption(option);

    // 响应式
    window.addEventListener("resize", () => {
      chart.resize();
    });

    return chart;
  }
}
```

类似地实现其他图表：

- **TopicChart** - 主题分类饼图或树图
- **CitationChart** - 引用关系网络图（使用force-directed graph）
- **WordCloudChart** - 关键词云图
- **MethodChart** - 研究方法柱状图

#### 4.3 汇总标签页

**src/modules/visualization/tab.ts**：

```typescript
import { DataAggregator } from "./aggregator";
import { TimelineChart } from "./charts/timeline";
import { TopicChart } from "./charts/topic";
import { CitationChart } from "./charts/citation";
import { WordCloudChart } from "./charts/wordcloud";
import { MethodChart } from "./charts/methods";

export class VisualizationTab {
  private aggregator: DataAggregator;
  private charts: Map<string, any>;

  constructor() {
    this.aggregator = new DataAggregator();
    this.charts = new Map();
  }

  async register() {
    // 注册自定义标签页
    const tabId = Zotero.ItemPaneManager.registerSection({
      paneID: "ai-analysis-summary",
      pluginID: "ai-paper-analysis@fsmeng.com",

      header: {
        l10nID: "ai-analysis-summary-header",
        icon: "chrome://aipaperanalysis/content/icons/chart.svg",
      },

      sidenav: {
        l10nID: "ai-analysis-summary-sidenav",
        icon: "chrome://aipaperanalysis/content/icons/chart-20.svg",
      },

      bodyXHTML: `
        <html:div id="ai-analysis-summary-container" style="padding: 20px;">
          <html:div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
            <html:h2>AI分析汇总</html:h2>
            <html:button id="refresh-analysis" style="padding: 5px 15px;">刷新</html:button>
          </html:div>

          <html:div id="timeline-chart" style="width: 100%; height: 400px; margin-bottom: 30px;"></html:div>
          <html:div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
            <html:div id="topic-chart" style="height: 400px;"></html:div>
            <html:div id="method-chart" style="height: 400px;"></html:div>
          </html:div>
          <html:div id="citation-chart" style="width: 100%; height: 500px; margin-bottom: 30px;"></html:div>
          <html:div id="wordcloud-chart" style="width: 100%; height: 400px;"></html:div>
        </html:div>
      `,

      onInit: async () => {
        console.log("可视化标签页初始化");
      },

      onRender: async ({ body }) => {
        await this.renderCharts(body);

        // 绑定刷新按钮
        const refreshBtn = body.querySelector("#refresh-analysis");
        refreshBtn?.addEventListener("click", () => this.renderCharts(body));
      },

      sectionButtons: [
        {
          type: "export",
          icon: "chrome://zotero/skin/16/universal/export.svg",
          l10nID: "export-analysis-tooltip",
          onClick: () => this.exportData(),
        },
      ],
    });

    return tabId;
  }

  private async renderCharts(container: HTMLElement) {
    // 获取聚合数据
    const data = await this.aggregator.aggregateAnalysisResults();

    // 渲染各个图表
    const timelineContainer = container.querySelector(
      "#timeline-chart",
    ) as HTMLElement;
    const timelineChart = new TimelineChart();
    this.charts.set(
      "timeline",
      timelineChart.render(timelineContainer, data.timeline),
    );

    const topicContainer = container.querySelector(
      "#topic-chart",
    ) as HTMLElement;
    const topicChart = new TopicChart();
    this.charts.set("topic", topicChart.render(topicContainer, data.topics));

    const citationContainer = container.querySelector(
      "#citation-chart",
    ) as HTMLElement;
    const citationChart = new CitationChart();
    this.charts.set(
      "citation",
      citationChart.render(citationContainer, data.citations),
    );

    const wordcloudContainer = container.querySelector(
      "#wordcloud-chart",
    ) as HTMLElement;
    const wordcloudChart = new WordCloudChart();
    this.charts.set(
      "wordcloud",
      wordcloudChart.render(wordcloudContainer, data.keywords),
    );

    const methodContainer = container.querySelector(
      "#method-chart",
    ) as HTMLElement;
    const methodChart = new MethodChart();
    this.charts.set(
      "method",
      methodChart.render(methodContainer, data.methods),
    );
  }

  private async exportData() {
    const data = await this.aggregator.aggregateAnalysisResults();

    // 导出为JSON
    const json = JSON.stringify(data, null, 2);
    const filePath = await Zotero.FilePicker.saveFile(
      "另存为...",
      "analysis-data.json",
    );

    if (filePath) {
      await Zotero.File.putContentsAsync(filePath, json);
      Zotero.alert(null, "导出成功", `数据已保存到: ${filePath}`);
    }
  }
}
```

---

### 阶段五：设置和UI优化（预计6小时）

#### 5.1 偏好设置面板

**addon/content/preferences.xhtml**：

```xml
<?xml version="1.0"?>
<?xml-stylesheet href="chrome://global/skin/" type="text/css"?>
<?xml-stylesheet href="chrome://zotero/skin/preferences.css" type="text/css"?>

<vbox xmlns="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul"
      id="ai-paper-analysis-prefs">

  <groupbox>
    <caption label="API配置"/>

    <vbox>
      <label value="当前提供商:"/>
      <menulist id="provider-select" preference="extensions.aipaperanalysis.provider">
        <menupopup>
          <menuitem label="OpenAI" value="openai"/>
          <menuitem label="Anthropic (Claude)" value="anthropic"/>
          <menuitem label="DeepSeek" value="deepseek"/>
          <menuitem label="阿里通义千问" value="aliyun"/>
          <menuitem label="字节豆包" value="bytedance"/>
          <menuitem label="自定义" value="custom"/>
        </menupopup>
      </menulist>

      <separator/>

      <label value="API密钥:"/>
      <textbox id="api-key" type="password" preference="extensions.aipaperanalysis.apiKey"/>

      <label value="自定义API端点 (可选):"/>
      <textbox id="base-url" placeholder="https://api.example.com/v1" preference="extensions.aipaperanalysis.baseURL"/>

      <label value="模型:"/>
      <textbox id="model" placeholder="gpt-4" preference="extensions.aipaperanalysis.model"/>

      <button label="测试连接" oncommand="window.testAPIConnection()"/>
    </vbox>
  </groupbox>

  <groupbox>
    <caption label="分析设置"/>

    <vbox>
      <checkbox label="分析后自动创建笔记" preference="extensions.aipaperanalysis.autoCreateNote"/>
      <checkbox label="批量分析时显示详细进度" preference="extensions.aipaperanalysis.showDetailedProgress"/>

      <separator/>

      <label value="默认温度 (0.0-1.0):"/>
      <hbox align="center">
        <scale id="temperature" min="0" max="100" preference="extensions.aipaperanalysis.temperature"/>
        <label id="temperature-value"/>
      </hbox>

      <label value="最大Token数:"/>
      <textbox id="max-tokens" type="number" min="100" max="4000" preference="extensions.aipaperanalysis.maxTokens"/>
    </vbox>
  </groupbox>

  <groupbox>
    <caption label="可视化设置"/>

    <vbox>
      <checkbox label="启用时间线图表" preference="extensions.aipaperanalysis.charts.timeline"/>
      <checkbox label="启用主题分类图表" preference="extensions.aipaperanalysis.charts.topic"/>
      <checkbox label="启用引用关系图表" preference="extensions.aipaperanalysis.charts.citation"/>
      <checkbox label="启用关键词云图" preference="extensions.aipaperanalysis.charts.wordcloud"/>
      <checkbox label="启用研究方法图表" preference="extensions.aipaperanalysis.charts.method"/>
    </vbox>
  </groupbox>

  <groupbox>
    <caption label="提示词管理"/>

    <vbox>
      <button label="打开提示词编辑器" oncommand="window.openPromptEditor()"/>
      <button label="重置为默认提示词" oncommand="window.resetPrompts()"/>
    </vbox>
  </groupbox>

</vbox>
```

#### 5.2 本地化支持

**addon/locale/zh-CN/addon.ftl**：

```
plugin-name = AI论文分析
menu-ai-analysis = AI分析
menu-manage-prompts = 管理提示词...

ai-analysis-summary-header = AI分析汇总
ai-analysis-summary-sidenav = 汇总

export-analysis-tooltip = 导出分析数据

prompt-summary = 论文摘要
prompt-methodology = 研究方法
prompt-innovation = 创新点
prompt-limitations = 局限性

analysis-progress = 分析进度: { $current }/{ $total }
analysis-complete = 分析完成！成功分析 { $count } 篇文献
analysis-failed = 分析失败: { $error }

note-generated-by = 此笔记由 AI Paper Analysis 插件自动生成
```

**addon/locale/en-US/addon.ftl**：

```
plugin-name = AI Paper Analysis
menu-ai-analysis = AI Analysis
menu-manage-prompts = Manage Prompts...

ai-analysis-summary-header = AI Analysis Summary
ai-analysis-summary-sidenav = Summary

export-analysis-tooltip = Export analysis data

prompt-summary = Paper Summary
prompt-methodology = Research Methodology
prompt-innovation = Innovation Points
prompt-limitations = Limitations

analysis-progress = Analysis Progress: { $current }/{ $total }
analysis-complete = Analysis Complete! Successfully analyzed { $count } papers
analysis-failed = Analysis Failed: { $error }

note-generated-by = This note was automatically generated by AI Paper Analysis plugin
```

---

### 阶段六：测试和发布（预计4小时）

> 当前状态：`npm run test:stage6` 已覆盖提示词、LLM配置与可视化导出逻辑；详见 [TESTING_REPORT.md](TESTING_REPORT.md) 与 [RELEASE_NOTES.md](RELEASE_NOTES.md)。Zotero UI 内的手工验证与正式发布仍在待办列表。

#### 6.1 测试清单

**功能测试**：

- [ ] 右键菜单显示正常（需在Zotero中验证）
- [ ] 提示词列表加载正确（需在Zotero中验证）
- [ ] 单个文献分析成功
- [ ] 批量文献分析成功
- [ ] 笔记自动创建并关联到父文献
- [ ] 笔记内容格式正确
- [ ] 汇总标签页显示正常
- [ ] 所有图表正确渲染
- [x] API配置保存和加载正常（`npm run test:stage6`）
- [x] 多提供商切换正常（`npm run test:stage6`）
- [x] 提示词增删改查正常（`npm run test:stage6`）
- [x] 可视化导出（JSON/CSV/Markdown）逻辑正确（`npm run test:stage6`）

**异常处理测试**：

- [ ] API密钥错误时显示友好提示
- [ ] 网络错误时重试机制
- [ ] PDF无法提取时的降级处理
- [ ] 无效文献条目的处理
- [ ] 并发请求的限流
- [x] 无效提示词导入提示（`npm run test:stage6`，模拟异常）

**性能测试**：

- [ ] 100篇文献批量分析
- [ ] 大型PDF文本提取
- [ ] 图表渲染性能（1000+数据点）
- [x] 导出性能：千级聚合数据 CSV 生成 < 500 ms（`npm run test:stage6`）

#### 6.2 构建和发布

**package.json scripts**（关键条目）：

- `npm run build`：`zotero-plugin build && tsc --noEmit`（已通过；如需在 CI 中验证，只需运行同名脚本）
- `npm run test:stage6`：加载 `ts-node` + Mocha 的回归测试入口

**GitHub Actions自动构建**（.github/workflows/build.yml）：

```yaml
name: Build and Release

on:
  push:
    tags:
      - "v*"

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          files: build/*.xpi
          generate_release_notes: true
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

#### 6.3 用户文档

已更新：

- README.md – 新增测试/发布说明
- SETUP.md – 补充 `npm run test:stage6` 步骤
- RELEASE_NOTES.md – v0.1.0 草稿发布说明
- TESTING_REPORT.md – 阶段六测试细节

更新 **README.md**：

```markdown
# AI Paper Analysis - Zotero插件

基于大模型的智能文献分析插件，支持多种AI提供商。

## 功能特性

- 🤖 多AI提供商支持（OpenAI、Claude、DeepSeek等）
- 📝 自定义分析提示词
- 📊 可视化汇总（时间线、主题分类、引用网络等）
- 🎯 一键批量分析
- 💾 自动生成Markdown笔记

## 安装

1. 下载最新版本的 `.xpi` 文件
2. 在Zotero中：工具 → 插件 → 右上角齿轮 → Install Add-on From File
3. 选择下载的 `.xpi` 文件
4. 重启Zotero

## 使用指南

### 1. 配置API

编辑 → 偏好设置 → AI Paper Analysis

- 选择提供商
- 输入API密钥
- 测试连接

### 2. 分析文献

- 右键点击文献 → AI分析
- 选择分析类型（摘要、方法、创新点等）
- 等待分析完成

### 3. 查看汇总

- 点击"AI分析汇总"标签页
- 查看各类图表和统计

## 支持的AI提供商

- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude 3)
- DeepSeek
- 阿里通义千问
- 字节豆包
- 自定义API端点

## 开发

见 [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md)

## 许可证

MIT License
```

---

## 预计工作量总结

| 阶段     | 预计时间   | 主要任务                               |
| -------- | ---------- | -------------------------------------- |
| 阶段一   | 2小时      | 项目初始化、模板配置、环境搭建         |
| 阶段二   | 6小时      | LLM多提供商API集成、抽象层设计         |
| 阶段三   | 8小时      | 文本提取、分析引擎、笔记生成、右键菜单 |
| 阶段四   | 10小时     | 数据聚合、5种图表、汇总标签页          |
| 阶段五   | 6小时      | 偏好设置、提示词编辑器、国际化         |
| 阶段六   | 4小时      | 测试、文档、自动构建、发布             |
| **总计** | **36小时** | 完整功能实现                           |

---

## 技术难点和解决方案

### 1. PDF文本提取质量

**问题**：扫描版PDF或复杂排版的提取效果差
**解决方案**：

- 使用Zotero内置的 `Zotero.Fulltext` API
- 降级到仅使用元数据和摘要
- 提示用户手动添加文本

### 2. LLM API限流

**问题**：批量分析时触发API限流
**解决方案**：

- 实现请求队列和速率限制
- 添加重试机制（指数退避）
- 显示详细进度和预估时间

### 3. 大型图表性能

**问题**：数千个数据点时图表卡顿
**解决方案**：

- ECharts的数据抽样和渐进渲染
- 虚拟化列表（仅渲染可见部分）
- 分页加载数据

### 4. 跨平台兼容性

**问题**：Windows/Mac/Linux的路径和API差异
**解决方案**：

- 使用Zotero的跨平台API
- 避免直接操作文件系统
- 充分测试各平台

---

## 参考资源

### 官方文档

- [Zotero 7开发者文档](https://www.zotero.org/support/dev/zotero_7_for_developers)
- [Zotero Plugin Template](https://github.com/windingwind/zotero-plugin-template)
- [Zotero Plugin Toolkit](https://github.com/windingwind/zotero-plugin-toolkit)

### 参考插件

- [ARIA](https://github.com/lifan0127/ai-research-assistant)
- [PapersGPT](https://github.com/papersgpt/papersgpt-for-zotero)
- [Better Notes](https://github.com/windingwind/zotero-better-notes)

### 技术栈文档

- [TypeScript](https://www.typescriptlang.org/docs/)
- [ECharts](https://echarts.apache.org/zh/index.html)
- [OpenAI API](https://platform.openai.com/docs/api-reference)

---

## 联系方式

- GitHub Issues: [项目地址]/issues
- Email: your-email@example.com

---

_最后更新: 2025-11-09_
