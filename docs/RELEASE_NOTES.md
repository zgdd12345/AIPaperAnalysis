# AI Paper Analysis – v0.1.0 (Draft)

## Highlights

- ✅ Multi-provider LLM stack (OpenAI, Claude, DeepSeek, Aliyun, Bytedance, Custom) with persisted preferences and connection testing hooks.
- ✅ Prompt Manager with CRUD, duplication, import/export, and default template reset wired into the Zotero preferences pane.
- ✅ AI note pipeline with Markdown exports and visualization tab (timeline, topic/method splits, citation network, keyword cloud) plus JSON/CSV/Markdown exports that honor active filters.
- ✅ Localization coverage for en-US / zh-CN across preferences, visualization tab, and context menus.

## Testing Summary

- Automated regression suite: `npm run test:stage6`
  - Prompt CRUD & safeguards
  - Provider configuration persistence
  - Visualization export builders (JSON/CSV/Markdown) including large-dataset performance
  - Error handling for malformed prompt imports
- Detailed log: [TESTING_REPORT.md](TESTING_REPORT.md)
- Manual Zotero UI validation: **Pending** (blocked in CLI environment)

## Known Issues & Risks

1. 仍需进行以下手动验证（真实 Zotero + API Key）：
   - Right-click AI analysis (single/batch)
   - Provider connection dialog
   - Visualization tab rendering/filter UX inside Zotero
2. Release packaging (`npm run release`) and signing not yet exercised for this iteration。

## Release Checklist

- [x] Implement Stage 1–5 features
- [x] Add regression tests + docs for Stage 6 (`npm run test:stage6`)
- [x] Draft README/SETUP/DEVELOPMENT_PLAN updates
- [x] Prepare release notes (this file)
- [x] Fix `npm run build` type errors
- [ ] Run manual Zotero smoke tests
- [ ] Tag `v0.1.0` and upload `.xpi`
