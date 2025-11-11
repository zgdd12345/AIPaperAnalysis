# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Paper Analysis is a Zotero 7 plugin that uses multiple LLM providers (OpenAI, Anthropic, DeepSeek, Aliyun, Bytedance, Custom) to analyze academic papers. It generates AI-powered notes and provides visualization dashboards for literature analysis.

**Tech Stack:**
- TypeScript with Zotero Plugin Template
- Build: ESBuild via `zotero-plugin-scaffold`
- UI: XUL/XHTML for Zotero integration
- Charts: ECharts
- LLM SDKs: `openai`, `@anthropic-ai/sdk`

## Essential Commands

### Development

**IMPORTANT**: This project requires Node.js 20.17+ or 22.9+. Node.js 18.x will fail with `styleText` import errors.

```bash
# Ensure correct Node version first
node --version              # Should show v20.17+ or v22.x
nvm use 22                  # If using nvm

# Development commands
npm start                   # Hot-reload dev mode (launches Zotero)
npm run build              # Production build (zotero-plugin build && tsc --noEmit)
npm run lint:check         # Check code formatting
npm run lint:fix           # Auto-fix formatting issues
npm run test:stage6        # Run automated regression tests
```

**If build fails with Node version error**:
```bash
# Upgrade Node.js
nvm install 22
nvm use 22

# Clean and rebuild
rm -rf .scaffold/build
npm run build
```

### Testing
The test suite (`npm run test:stage6`) covers:
- Prompt CRUD operations
- LLM provider configuration
- Multi-format export (JSON/CSV/Markdown)
- Performance benchmarks

**Manual testing** (requires real Zotero):
- Right-click menu analysis
- Visualization tab interactions
- API connection tests

### Build Output
- `.scaffold/build/` - Contains the `.xpi` file after build

## Architecture

### Module Structure

The plugin uses a centralized initialization pattern in [src/modules/plugin.ts](src/modules/plugin.ts):

```typescript
AIPaperAnalysisPlugin
  ├── LLMManager          // Multi-provider AI API abstraction
  ├── PromptManager       // Template CRUD & persistence
  ├── AnalysisEngine      // PDF extraction + LLM orchestration
  ├── ContextMenuManager  // Right-click menu integration
  └── VisualizationTab    // ECharts dashboard + data aggregation
```

**Initialization flow:**
1. [src/hooks.ts](src/hooks.ts) → `onStartup()` calls `initializePlugin()`
2. [src/modules/plugin.ts](src/modules/plugin.ts) → Instantiates all managers
3. ContextMenu registers dynamic XUL menus
4. VisualizationTab registers item pane section via `Zotero.ItemPaneManager`

### Key Abstractions

#### 1. LLM Provider Layer (`src/modules/llm/`)
All providers extend [src/modules/llm/base.ts](src/modules/llm/base.ts):
- `chat()` - Unified ChatCompletion interface
- `validateApiKey()` - Test connectivity
- Automatic retry with exponential backoff
- Error normalization

Providers are managed by [LLMManager](src/modules/llm/manager.ts) which stores config in `Zotero.Prefs` under `extensions.aipaperanalysis.*`.

#### 2. Analysis Pipeline
[AnalysisEngine](src/modules/analyzer/engine.ts) coordinates:
1. [TextExtractor](src/modules/analyzer/extractor.ts) - Pulls metadata + PDF text
2. PromptManager - Retrieves user templates
3. LLMManager - Sends chat completion requests
4. [NoteCreator](src/modules/notes/creator.ts) - Generates child notes with embedded JSON metadata

#### 3. Visualization System
[DataAggregator](src/modules/visualization/aggregator.ts) scans notes tagged `ai-analysis` and builds:
- Timeline data (by publication year)
- Topic clusters (parsed from note content)
- Citation networks (from `relatedItems`)
- Keyword frequencies
- Research methods

Charts are rendered in [VisualizationTab](src/modules/visualization/tab.ts) using ECharts instances with cross-filtering support.

### Data Persistence

- **LLM Config:** `Zotero.Prefs.get("extensions.aipaperanalysis.provider")` etc.
- **Prompts:** Serialized JSON in `Zotero.Prefs.get("extensions.aipaperanalysis.prompts")`
- **Analysis Results:** Stored as Zotero child notes with tags `ai-analysis` and `prompt:{id}`
- **Metadata Embedding:** Notes contain hidden JSON comments for aggregation (see [NoteCreator](src/modules/notes/creator.ts))

## Common Development Tasks

### Adding a New LLM Provider

1. Create `src/modules/llm/newprovider.ts` extending `BaseLLMProvider`
2. Implement `chat()`, `validateApiKey()`, `listModels()`
3. Register in [LLMManager constructor](src/modules/llm/manager.ts)
4. Add UI option in [preferences.xhtml](addon/content/preferences.xhtml)

### Modifying Analysis Logic

**Text Extraction:** Edit [TextExtractor.extractFromItem()](src/modules/analyzer/extractor.ts)
- Uses `Zotero.Fulltext.indexPDF()` for PDF content
- Falls back to metadata if PDF extraction fails

**Post-Processing:** Modify [AnalysisEngine.analyzeItem()](src/modules/analyzer/engine.ts)
- `buildSystemPrompt()` - Controls AI behavior
- `parseResponse()` - Extract structured data from LLM output

### Adding Visualization Charts

1. Create chart class in `src/modules/visualization/charts/`
2. Implement `render(container: HTMLElement, data: T)` returning ECharts instance
3. Update [DataAggregator](src/modules/visualization/aggregator.ts) to compute required data
4. Wire into [VisualizationTab.renderCharts()](src/modules/visualization/tab.ts)

Example: [TimelineChart](src/modules/visualization/charts/timeline.ts) shows the pattern.

### Preferences Panel

[preferences.xhtml](addon/content/preferences.xhtml) uses XUL bindings. Script handlers in [preferenceScript.ts](src/modules/preferenceScript.ts) connect to:
- `testConnection()` - Validates API keys via LLMManager
- `openPromptManager()` - Launches prompt editor dialog
- Auto-saves to `Zotero.Prefs` on change

## Code Style

- **Type Safety:** All modules use explicit TypeScript interfaces (see [src/types/](src/types/))
- **Error Handling:** Use `formatError()` helper and log via `Zotero.logError()`
- **Localization:** Strings via `getString(key)` from [src/utils/locale.ts](src/utils/locale.ts)
- **Linting:** Prettier + ESLint (config in `eslint.config.mjs`)

## Important Constraints

1. **Zotero API Version:** Target Zotero 7.x (check [zotero-types](https://github.com/zotero/zotero-types))
2. **PDF Extraction Limits:** Zotero's `Fulltext.indexPDF()` may fail on scanned PDFs or complex layouts
3. **LLM Rate Limits:** [AnalysisEngine.analyzeBatch()](src/modules/analyzer/engine.ts) includes delays between requests
4. **XUL Elements:** Context menus use Mozilla XUL (`createElementNS`), not HTML - see [ContextMenuManager](src/modules/menu/context-menu.ts)

## File Organization

**DO NOT modify:**
- `src/addon.ts` - Template-generated scaffold
- `src/index.ts` - Global setup
- Files in `typings/` - Type augmentations

**Key entry points:**
- [src/hooks.ts](src/hooks.ts) - Lifecycle events
- [src/modules/plugin.ts](src/modules/plugin.ts) - Module orchestration
- [src/modules/preferenceScript.ts](src/modules/preferenceScript.ts) - Settings panel logic

## Testing Strategy

### Unit/Integration Tests
Run `npm run test:stage6` - Uses Mocha + ts-node with custom loaders.

**What's covered:**
- PromptManager CRUD (load/add/update/delete/import/export)
- LLMManager provider switching and persistence
- Visualization export formats (JSON/CSV/Markdown)
- Performance benchmarks (CSV export < 500ms for 200+ rows)

**What needs manual verification:**
- Analysis flow (requires Zotero UI + valid API keys)
- Visualization rendering and filtering
- Context menu population

### Test Files Location
- `test/stage6.test.ts` - Main test suite
- `test/json-assert-loader.mjs` - JSON import loader
- `test/ts-node-env.cjs` - TypeScript ESM configuration

## Release Process

1. Update version in [package.json](package.json)
2. Run `npm run build` to verify
3. Run `npm run test:stage6` for regression checks
4. Create git tag: `git tag v0.x.x && git push --tags`
5. GitHub Actions ([.github/workflows/release.yml](.github/workflows/release.yml)) auto-builds `.xpi`
6. Draft release notes using [RELEASE_NOTES.md](RELEASE_NOTES.md) template

## Debugging

### Common Installation Issues

**Preferences panel not showing in Zotero Settings:**
1. Verify Node.js version: `node --version` (must be 20.17+ or 22.9+)
2. Check build succeeded: `ls .scaffold/build/*.xpi`
3. Reinstall: Uninstall plugin in Zotero → Restart → Install fresh XPI
4. Check Zotero debug output for `Failed to register preference pane`

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for detailed fixes.

**Enable Zotero debug output:**
```javascript
// In Zotero console (Tools → Developer → Run JavaScript)
Zotero.Debug.setStore(true)
Zotero.Debug.get()  // View logs
```

**Plugin-specific logs:**
```typescript
Zotero.debug("[AIPaperAnalysis] Your message")
ztoolkit.log("message", data)  // Structured logging
```

**Hot reload issues:**
- Restart Zotero completely if menu items don't update
- Clear build cache: `rm -rf .scaffold/build && npm run build`

### Key Log Messages to Watch For

- ✅ `AI Paper Analysis Plugin initialized successfully`
- ❌ `Failed to register preference pane` → Check locale files
- ❌ `Failed to register context menu` → Restart Zotero
- ❌ `styleText is not exported` → Upgrade Node.js to 22+

## Resources

- [Zotero 7 Plugin Template](https://github.com/windingwind/zotero-plugin-template)
- [Zotero Plugin Toolkit Docs](https://github.com/windingwind/zotero-plugin-toolkit)
- [ECharts Examples](https://echarts.apache.org/examples/)
- Project Planning: [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md)
- Progress Tracking: [PROGRESS.md](PROGRESS.md)
