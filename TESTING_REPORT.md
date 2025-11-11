# Stage 6 Test Report – v0.1.0

- **Date**: 2025-11-09
- **Commit**: `0aaa77c`
- **Environment**: macOS (Node.js v22.17.0, npm 10.9.2)
- **Primary Command**: `npm run test:stage6`

## Automated Coverage

| Area                     | What Was Verified                                                                     | Command               | Result  | Notes                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------- | --------------------- | ------- | --------------------------------------------------------------------- |
| Prompt Manager CRUD      | Default prompts load/persist, custom prompts add/update/delete, default content guard | `npm run test:stage6` | ✅ Pass | Covers prompt state transitions without requiring Zotero UI           |
| Prompt Import Validation | Invalid JSON payload emits friendly error and aborts import                           | `npm run test:stage6` | ✅ Pass | See console warning in test output for expected error log             |
| Provider Preferences     | `LLMManager` stores provider config, active provider, and clears prefs on removal     | `npm run test:stage6` | ✅ Pass | Exercises provider switching logic used by preferences panel          |
| Visualization Exports    | Markdown exports include active filters, CSV export reflects each data section        | `npm run test:stage6` | ✅ Pass | Validates JSON/CSV/Markdown payload builders independent of Zotero UI |
| Export Performance       | CSV export over 200+ timeline/keyword rows completes < 500 ms                         | `npm run test:stage6` | ✅ Pass | Ensures batch export path remains responsive for large libraries      |

### Pending Manual Validation

| Scenario                                    | Status                       | Suggested Steps                                                                  |
| ------------------------------------------- | ---------------------------- | -------------------------------------------------------------------------------- |
| Context-menu analysis flow (single & batch) | 🔸 Blocked (needs Zotero UI) | Launch Zotero via `npm start`, right-click items → AI分析, confirm note creation |
| Provider connectivity test dialog           | 🔸 Blocked                   | Use preferences panel → 测试连接 for each provider with valid API keys           |
| Visualization tab rendering + filter UX     | 🔸 Blocked                   | Open “AI分析汇总” tab, interact with timeline/topic filters, confirm status text |

## Tooling & Build Notes

| Command               | Result                                            | Follow-up                                                                                                                                          |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run test:stage6` | ✅ 9 passing regression specs (see above)         | Logs include expected warning from mocked invalid prompt import                                                                                    |
| `npm run build`       | ✅ Passes (`zotero-plugin build && tsc --noEmit`) | Added local type augmentations (`typings/global.d.ts`) so Zotero UI widgets (`XUL.Scale`, `Zotero.FilePicker`, prompt table state) are recognized. |

## Artifacts & References

- Regression suite source: `test/stage6.test.ts`
- Custom loaders for JSON/TypeScript ESM: `test/json-assert-loader.mjs`, `test/ts-node-env.cjs`
- Command shortcut: `npm run test:stage6`
- Known open issues: [PROGRESS.md](PROGRESS.md) → “Stage Six” section
