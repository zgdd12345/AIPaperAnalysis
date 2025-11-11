# Changelog

All notable changes to AI Paper Analysis plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [0.1.1] - 2025-11-11

### Changed

#### 📚 Documentation Organization
- Reorganized project documentation for clarity
- Created consolidated [docs/DEVELOPER.md](docs/DEVELOPER.md) guide
- Simplified debug-bridge documentation structure
- Reduced main documentation files by ~60%

#### 🔥 Native Fetch API Migration

**Breaking Changes:**
- ❌ Removed Anthropic (Claude) provider support
- ❌ Removed external LLM SDK dependencies (`openai`, `@anthropic-ai/sdk` + 39 transitive packages)

**What Changed:**
All LLM providers rewritten to use native `fetch` API, resolving "AbortController is not defined" errors on Windows/macOS.

**Provider Migration:**
- OpenAI, Aliyun, Bytedance, Custom → Native fetch implementation
- DeepSeek → Already using fetch (no changes)
- All providers now use consistent `request<T>()` pattern with OpenAI-compatible endpoints

**Benefits:**
- ✅ Fixed cross-platform compatibility issues
- ✅ Bundle size reduced by ~700KB (75% smaller)
- ✅ Graceful degradation for missing Web APIs
- ✅ Enhanced error handling and diagnostics

**User Impact:**
- **Anthropic users**: Must switch to another provider (OpenAI, DeepSeek, Aliyun, Bytedance, or Custom)
- **Other users**: No action required, existing configurations remain valid

See [MIGRATION_NOTES.md](MIGRATION_NOTES.md) for technical details.

### Fixed
- "AbortController is not defined" error on Windows systems
- Connection failures with Aliyun provider
- SDK-related compatibility issues in Zotero 7

### Internal
- Added environment diagnostics logging at startup
- Enhanced debug output for provider troubleshooting
- Updated architecture documentation

---

## [0.1.0] - 2025-11-09

### Added
- Multi-provider LLM support (OpenAI, DeepSeek, Aliyun, Bytedance, Custom)
- AI-powered paper analysis with customizable prompts
- Automated note generation with embedded metadata
- Visualization dashboard (timeline, topics, citations, keywords, methods)
- Prompt template management (CRUD, import/export)
- Export functionality (JSON, CSV, Markdown)
- Context menu integration and item pane tab
- English/Chinese localization

### Technical
- TypeScript codebase with Zotero Plugin Template
- ESBuild bundling via zotero-plugin-scaffold
- XUL/XHTML UI components
- Automated test suite (`npm run test:stage6`)
