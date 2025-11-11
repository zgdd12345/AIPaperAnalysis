# 故障排查指南

## 问题：在 Zotero 中安装后看不到设置面板

### 症状
- 插件在"工具 → 插件"中可见，显示"AI Paper Analysis"
- 在 Zotero 的"设置"(Preferences) 中找不到 AI Paper Analysis 选项
- 无法配置 API 密钥

### 根本原因

1. **Node.js 版本过低**
   - `zotero-plugin-scaffold` 需要 Node.js 20.17+ 或 22.9+
   - Node.js 18.19.1 不支持 `util.styleText` API
   - 构建失败会导致生成的 XPI 文件不完整

2. **本地化字符串错误**
   - `prefs-title` 在 locale 文件中使用了模板默认值
   - 偏好设置面板注册需要正确的标题

### 解决方案

#### 步骤 1: 升级 Node.js

```bash
# 检查当前版本
node --version

# 如果 < 20.17，使用 nvm 升级
nvm use 22  # 或 nvm use 20

# 验证版本
node --version  # 应该显示 v22.x.x 或 v20.17+
```

#### 步骤 2: 重新构建插件

```bash
# 清理旧构建
rm -rf .scaffold/build

# 重新构建
npm run build
```

#### 步骤 3: 验证构建

检查以下文件是否正确生成：

```bash
# 1. XPI 文件应该存在
ls -lh .scaffold/build/*.xpi

# 2. preferences.xhtml 应该存在
ls .scaffold/build/addon/content/preferences.xhtml

# 3. 本地化文件应包含正确的 prefs-title
grep "prefs-title" .scaffold/build/addon/locale/zh-CN/aipaperanalysis-addon.ftl
# 应该输出: aipaperanalysis-prefs-title = AI Paper Analysis
```

#### 步骤 4: 在 Zotero 中重新安装

1. 卸载旧版本
   - Zotero → 工具 → 插件
   - 选择 AI Paper Analysis
   - 点击"卸载"
   - 重启 Zotero

2. 安装新版本
   - Zotero → 工具 → 插件 → 齿轮图标 → Install Add-on From File
   - 选择 `.scaffold/build/ai-paper-analysis.xpi`
   - 重启 Zotero

3. 验证设置面板
   - Zotero → 设置 → 侧边栏应该显示 "AI Paper Analysis"
   - 点击后应该看到 API 配置选项

## 其他常见问题

### 右键菜单不显示

**症状**: 右键点击文献条目时看不到"AI分析"菜单

**可能原因**:
1. 插件未完全初始化
2. 上下文菜单注册失败

**解决方案**:
```bash
# 检查 Zotero 错误日志
# 在 Zotero 中: 帮助 → Debug Output Logging → View Output

# 查找类似这样的错误:
# "Failed to register context menu"
# "ContextMenuManager is null"
```

如果看到错误，尝试：
1. 完全重启 Zotero（不是重新加载）
2. 确保插件在 Zotero 启动后完全加载（等待 5-10 秒）

### API 连接测试失败

**症状**: 点击"测试连接"按钮后显示连接失败

**可能原因**:
1. API 密钥错误或过期
2. 网络连接问题
3. 自定义端点 URL 格式错误

**解决方案**:
1. 验证 API 密钥
   - OpenAI: 应以 `sk-` 开头
   - Anthropic: 应以 `sk-ant-` 开头
   - DeepSeek: 检查 https://platform.deepseek.com 获取正确格式

2. 检查网络
   ```bash
   # 测试连接到 OpenAI
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer YOUR_API_KEY"
   ```

3. 自定义端点格式
   - 应包含完整 URL，例如: `https://api.example.com/v1`
   - 不要在末尾添加 `/chat/completions`

### 可视化标签页为空

**症状**: "AI分析汇总"标签页不显示任何图表

**可能原因**:
1. 还没有分析过任何文献
2. 笔记没有正确的标签

**解决方案**:
1. 确保至少分析了一篇文献
2. 检查生成的笔记是否有 `ai-analysis` 标签
3. 刷新可视化标签页（点击刷新按钮）

### 开发模式热重载不工作

**症状**: 修改代码后 `npm start` 没有自动更新

**解决方案**:
1. 完全重启开发模式
   ```bash
   # 停止 npm start (Ctrl+C)
   # 清理构建
   rm -rf .scaffold/build
   # 重新启动
   npm start
   ```

2. 如果还是不工作，手动重启 Zotero

## Node.js 版本管理最佳实践

### 推荐配置

在项目根目录创建 `.nvmrc`:

```bash
echo "22" > .nvmrc
```

然后每次进入项目时:

```bash
nvm use
```

### 设置默认版本

```bash
# 设置 Node.js 22 为默认版本
nvm alias default 22

# 验证
nvm list
```

## 构建脚本快捷方式

为了避免 Node 版本问题，可以创建一个包装脚本：

**build.sh**:
```bash
#!/bin/bash
export PATH="/Users/fsm/.nvm/versions/node/v22.21.0/bin:$PATH"
npm run build
```

使用方法:
```bash
chmod +x build.sh
./build.sh
```

## 日志和调试

### 启用 Zotero Debug 输出

1. Zotero → 帮助 → Debug Output Logging → Enable
2. 执行操作（例如右键分析）
3. Zotero → 帮助 → Debug Output Logging → View Output
4. 查找包含 "AIPaperAnalysis" 或 "aipaperanalysis" 的行

### 插件特定日志

插件使用以下日志前缀:
- `[AIPaperAnalysis]` - 一般日志
- `Failed to initialize AI Paper Analysis Plugin` - 初始化错误
- `Failed to register context menu` - 菜单注册错误

### 常见错误信息

| 错误信息 | 含义 | 解决方案 |
|---------|------|---------|
| `Cannot read properties of undefined (reading 'bind')` | Node.js 版本问题 | 升级到 Node.js 22+ |
| `styleText is not exported` | Node.js 版本过低 | 升级到 Node.js 20.17+ |
| `Failed to register preference pane` | 偏好设置注册失败 | 检查 locale 文件和 preferences.xhtml |
| `PromptManager is null` | 插件未初始化 | 重启 Zotero |
| `LLMManager is null` | 插件未初始化 | 重启 Zotero |

## 联系支持

如果以上方法都无法解决问题:

1. 收集以下信息:
   - Node.js 版本 (`node --version`)
   - Zotero 版本
   - 操作系统
   - 完整的错误日志

2. 提交 Issue: https://github.com/yourusername/AIPaperAnalysis/issues

3. 包含以下文件:
   - Zotero Debug Output
   - 构建输出 (`npm run build` 的完整输出)
   - 插件配置截图
