# Migration Notes - Native Fetch API Refactor

## Summary

This document describes the migration from SDK-based LLM providers to native `fetch` API implementation.

## Date

2025-11-11

## Problem Statement

Users reported "AbortController is not defined" errors when using Aliyun and other LLM providers in Zotero 7, particularly on Windows systems. Root cause analysis revealed:

1. OpenAI SDK (`openai` package) internally requires `AbortController`
2. Anthropic SDK (`@anthropic-ai/sdk`) has similar dependencies
3. Zotero 7's JavaScript environment doesn't consistently provide these Web APIs across all platforms
4. While polyfills could be added, SDKs add unnecessary complexity and bundle size

## Solution

**Complete migration from external SDKs to native `fetch` API.**

## Changes

### Removed

- ❌ Anthropic Provider (`src/modules/llm/anthropic.ts`)
- ❌ `openai` npm package + 39 transitive dependencies
- ❌ `@anthropic-ai/sdk` npm package

### Rewritten (SDK → Fetch)

All providers now use `globalThis.fetch` directly:

| Provider  | Original Implementation         | New Implementation |
| --------- | ------------------------------- | ------------------ |
| OpenAI    | OpenAI SDK                      | Native fetch       |
| Aliyun    | OpenAI SDK (compatibility mode) | Native fetch       |
| Bytedance | OpenAI SDK (compatibility mode) | Native fetch       |
| Custom    | OpenAI SDK (compatibility mode) | Native fetch       |
| DeepSeek  | Already native fetch            | No change          |

### Implementation Pattern

All providers follow this consistent pattern:

```typescript
class SomeProvider extends BaseLLMProvider {
  private async request<T>(path: string, options = {}): Promise<T> {
    const fetchFn = (globalThis as any).fetch;
    const AbortControllerCtor = (globalThis as any).AbortController;
    const controller = AbortControllerCtor ? new AbortControllerCtor() : null;

    // Conditional timeout setup
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
          ...(options.headers || {}),
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller ? controller.signal : undefined,
      });

      // Parse JSON response
      const rawText = await response.text();
      const parsed = rawText ? JSON.parse(rawText) : {};

      // Handle errors
      if (!response.ok) {
        const error: any = new Error(
          parsed?.error?.message || `Request failed: ${response.status}`,
        );
        error.status = response.status;
        throw error;
      }

      return parsed as T;
    } catch (error: any) {
      if (error?.name === "AbortError") {
        throw new Error("Request timed out");
      }
      throw error;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    return this.withRetry(async () => {
      const response = await this.request("/chat/completions", {
        method: "POST",
        body: {
          model: request.model,
          messages: request.messages,
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens,
        },
      });

      return {
        content: response.choices[0].message.content,
        model: response.model,
        finishReason: response.choices[0].finish_reason,
        usage: response.usage
          ? {
              promptTokens: response.usage.prompt_tokens,
              completionTokens: response.usage.completion_tokens,
              totalTokens: response.usage.total_tokens,
            }
          : undefined,
      };
    });
  }
}
```

### Key Features

1. **Conditional AbortController:**
   - Uses `AbortController` if available for timeout support
   - Gracefully degrades if unavailable (timeout disabled, core functionality works)

2. **Error Handling:**
   - Consistent error normalization across all providers
   - Status code preservation for debugging
   - Timeout errors clearly identified

3. **OpenAI Compatibility:**
   - All endpoints use OpenAI-compatible format (`/chat/completions`)
   - Request/response structures match OpenAI spec
   - Easy to add new OpenAI-compatible providers

## Impact Assessment

### For Users

**Anthropic (Claude) Users:**

- ⚠️ **Action Required:** Must switch to another provider (OpenAI, DeepSeek, Aliyun, Bytedance, or Custom)
- Old configurations using Anthropic will need to be reconfigured

**Other Provider Users:**

- ✅ **No Action Required:** Functionality unchanged
- ✅ May experience better stability (no SDK-related errors)
- ✅ Existing API keys and configurations remain valid

### For Developers

**Adding New Providers:**

- ✅ Simpler: Just implement `request()` method using fetch pattern
- ✅ No SDK documentation to learn
- ✅ More control over HTTP requests
- ✅ Reference implementation: `src/modules/llm/deepseek.ts`

**Debugging:**

- ✅ More transparent: Can see exact HTTP requests in logs
- ✅ Enhanced logging added (especially in Aliyun provider)
- ✅ Environment diagnostics logged at startup

## Verification Steps

After upgrade, verify:

1. **Build Success:**

   ```bash
   npm run build
   # Should complete without errors
   ```

2. **Environment Check:**
   - Install plugin in Zotero
   - Check Zotero Debug Output for:
     ```
     [AIPaperAnalysis] Environment diagnostics: {
       "zoteroVersion": "7.x.x",
       "platform": "...",
       "hasAbortController": true/false,
       "hasFetch": true,
       ...
     }
     ```

3. **Test Connection:**
   - Open Zotero Settings → AI Paper Analysis
   - Configure any provider (except Anthropic)
   - Click "Test Connection"
   - Should see "连接成功！" (Connection successful)

4. **Analyze Paper:**
   - Right-click any paper
   - Select "AI Paper Analysis" → "Analyze with [Provider]"
   - Should generate analysis note without errors

## Rollback Plan

If issues arise, revert to previous version:

```bash
git checkout [previous-commit-hash]
npm install
npm run build
```

Note: Previous version still had SDK-related issues, so rollback is not recommended unless critical bugs are found in the new implementation.

## Performance Impact

**Bundle Size:**

- Before: ~2.5MB (with SDKs)
- After: ~1.8MB (fetch only)
- **Reduction:** ~700KB (28% smaller)

**Runtime Performance:**

- No noticeable difference in request latency
- Slightly faster initialization (fewer imports)

## Future Considerations

1. **AbortController Polyfill:**
   - Currently implemented in `src/utils/polyfills.ts`
   - May be removed if all target Zotero versions provide native support
   - Keep for now as safety net

2. **Adding More Providers:**
   - Follow the fetch pattern in `DeepSeekProvider`
   - Document any provider-specific quirks in code comments
   - Update `CLAUDE.md` with new provider details

3. **SDK Re-evaluation:**
   - If Zotero environment improves Web API support, could reconsider SDKs
   - Current approach is more maintainable and compatible

## References

- Issue: "AbortController is not defined" error report
- Zotero Version: 7.x
- Affected Platforms: Windows (primarily), some macOS configurations
- Test Coverage: Manual testing across OpenAI, DeepSeek, Aliyun providers

## Contact

For questions about this migration:

- Check `CLAUDE.md` for architecture details
- See `CHANGELOG.md` for version history
- Review code examples in `src/modules/llm/deepseek.ts`
