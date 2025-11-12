# AI Paper Analysis - Zotero Plugin

[![Zotero 7](https://img.shields.io/badge/Zotero-7-green?style=flat-square&logo=zotero&logoColor=CC2936)](https://www.zotero.org)
[![License: AGPL-3.0]
[![Using Zotero Plugin Template](https://img.shields.io/badge/Using-Zotero%20Plugin%20Template-blue?style=flat-square&logo=github)](https://github.com/windingwind/zotero-plugin-template)

基于大模型的智能文献分析插件，支持多种AI提供商。

[English](#) | [简体中文](#readme)

## ✨ 功能特性

- 🤖 **多AI提供商支持** - OpenAI、DeepSeek、阿里通义千问、字节豆包、自定义API
- 📝 **自定义分析提示词** - 完全可定制的分析模板，支持增删改
- 💾 **自动笔记生成** - Markdown格式笔记，包含完整元数据
- 🌐 **中英文界面** - 完整的国际化支持

## 📦 安装

### 方式一：从Release安装（推荐）

1. 从 [Releases](https://github.com/zgdd12345/AIPaperAnalysis/releases) 下载最新的 `.xpi` 文件
2. 在Zotero中：`工具` → `插件` → 右上角齿轮图标 → `Install Add-on From File`
3. 选择下载的 `.xpi` 文件
4. 重启Zotero

### 方式二：开发版安装

```bash
git clone https://github.com/zgdd12345/AIPaperAnalysis.git
cd AIPaperAnalysis
npm install
npm run build
```

然后从 `.scaffold/build` 目录安装生成的 `.xpi` 文件。

## 🚀 快速开始

### 1. 配置API

首次使用需要配置AI提供商：

1. `编辑` → `偏好设置` → `AI Paper Analysis`
2. 选择提供商（例如：OpenAI）
3. 输入API密钥
4. （可选）配置自定义端点和模型
5. 点击"测试连接"验证

### 2. 分析文献

#### 单个文献分析

1. 右键点击文献条目
2. 选择 `AI分析` → 选择分析类型
   - 论文摘要
   - 研究方法
   - 创新点
   - 局限性
   - （或你自定义的提示词）
3. 等待分析完成

#### 批量分析

1. 选中多个文献（Ctrl/Cmd + 点击）
2. 右键 → `AI分析` → 选择分析类型
3. 查看进度窗口

### 3. 查看分析结果

**方式一：查看笔记**

- 展开文献条目，找到新生成的子笔记
- 笔记标签：`ai-analysis`

**方式二：可视化汇总**
TODO
1. 点击Zotero主窗口的 `AI分析汇总` 标签页
2. 查看各类图表：
   - **时间线图表**：文献发表年份分布
   - **主题分类**：AI提取的研究主题聚类
   - **引用关系网络**：文献间的关联
   - **关键词云图**：高频术语可视化
   - **研究方法统计**：常用方法分布

## 🔧 高级配置

### 管理提示词

1. 右键文献 → `AI分析` → `管理提示词...`
2. 在对话框中：
   - **添加**：创建新的分析模板
   - **编辑**：修改现有提示词
   - **删除**：移除不需要的提示词
   - **重置**：恢复默认提示词

### 支持的API提供商

#### OpenAI

```
提供商：OpenAI
API密钥：sk-...
模型：gpt-4, gpt-3.5-turbo
```

#### DeepSeek

```
提供商：DeepSeek
API密钥：sk-...
端点：https://api.deepseek.com/v1
模型：deepseek-chat
```

#### 阿里通义千问

```
提供商：Aliyun
API密钥：sk-...
模型：qwen-max, qwen-plus
```

#### 字节豆包

```
提供商：Bytedance
API密钥：...
模型：doubao-pro
```

#### 自定义API

```
提供商：Custom
API密钥：your-key
端点：https://your-api.com/v1
模型：your-model
```

## 📊 可视化功能详解

TODO

### 时间线图表

- 展示文献按发表年份的分布
- 柱状图显示每年的文献数量
- 点击柱子查看该年度的文献列表

### 主题分类图表

- AI自动提取的研究主题
- 饼图或树图展示主题分布
- 支持交互式筛选

### 引用关系图

- 使用力导向图展示文献关联
- 节点大小表示引用数
- 支持缩放和拖拽

### 关键词云图

- 基于分析结果提取高频术语
- 词的大小表示出现频率
- 支持中英文

### 研究方法统计

- 识别常见研究方法（实验、问卷、案例等）
- 柱状图显示方法使用频率

## 🛠 开发

**开发者指南**: [docs/DEVELOPER.md](docs/DEVELOPER.md) - 完整的开发、测试和发布文档

### 快速开始

1. **克隆项目**

```bash
git clone https://github.com/zgdd12345/AIPaperAnalysis.git
cd AIPaperAnalysis
```

2. **安装依赖**

```bash
npm install
```

3. **配置开发环境**

编辑 `.env` 文件：

```env
# Mac
ZOTERO_PLUGIN_ZOTERO_BIN_PATH=/Applications/Zotero.app/Contents/MacOS/zotero

# Windows
# ZOTERO_PLUGIN_ZOTERO_BIN_PATH=C:\\Program Files\\Zotero\\zotero.exe

# Linux
# ZOTERO_PLUGIN_ZOTERO_BIN_PATH=/usr/lib/zotero/zotero

# 可选：开发用配置文件路径
ZOTERO_PLUGIN_PROFILE_PATH=/path/to/profile
```

4. **开发模式（热重载）**

```bash
npm start
```

5. **构建生产版本**

```bash
npm run build
```

6. **代码检查**

```bash
npm run lint:check
npm run lint:fix
```

### 项目结构

```
AIPaperAnalysis/
├── src/                      # TypeScript源代码
│   ├── modules/
│   │   ├── llm/             # LLM API集成
│   │   ├── analyzer/        # 分析引擎
│   │   ├── prompts/         # 提示词管理
│   │   ├── menu/            # 右键菜单
│   │   ├── notes/           # 笔记生成
│   │   ├── visualization/   # 可视化
│   │   └── preferences/     # 设置面板
│   └── utils/               # 工具函数
├── addon/                   # 插件资源
│   ├── locale/              # 国际化文件
│   └── content/             # 图标、样式
├── docs/                    # 详细文档
├── debug-bridge/            # 诊断工具
└── .scaffold/build/         # 构建输出
```

详细说明参考 [CLAUDE.md](CLAUDE.md) 和 [docs/DEVELOPER.md](docs/DEVELOPER.md)。

## 🧪 测试

```bash
npm run test:stage6      # 自动回归测试
npm run build           # 构建验证
npm run lint:check      # 代码检查
```

详细测试报告：[docs/TESTING_REPORT.md](docs/TESTING_REPORT.md)

## 📖 文档

- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - 故障排查
- [CHANGELOG.md](CHANGELOG.md) - 版本历史
- [CLAUDE.md](CLAUDE.md) - Claude Code 协作指南
- [docs/DEVELOPER.md](docs/DEVELOPER.md) - 完整开发者文档

## 🤝 贡献

欢迎贡献！请查看 [贡献指南](#) 了解详情。

## 📄 许可证

[AGPL-3.0 License](LICENSE)

## 🙏 致谢

- [Zotero Plugin Template](https://github.com/windingwind/zotero-plugin-template) - 插件模板
- [Zotero Plugin Toolkit](https://github.com/windingwind/zotero-plugin-toolkit) - 工具库
- [ECharts](https://echarts.apache.org/) - 图表库

## 📮 联系

- GitHub Issues: [提交问题](https://github.com/zgdd12345/AIPaperAnalysis/issues)
- Email: 1315660867@qq.com

---

**⚠️ 当前状态**: 开发中 (v0.1.1)

如果此项目对你有帮助，请给个 ⭐️ Star！
