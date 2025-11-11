/**
 * DeepSeek Provider 实现
 * 使用 OpenAI 兼容协议，但通过原生 fetch 避免 SDK 在 Zotero 中的网络限制
 */

import { BaseLLMProvider } from './base';
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  LLMModel,
  ProviderConfig,
} from '../../types/llm';

const DEFAULT_BASE_URL = 'https://api.deepseek.com/v1';

export class DeepSeekProvider extends BaseLLMProvider {
  private readonly apiBaseUrl: string;

  constructor(config: ProviderConfig) {
    super(config);
    this.validateConfig();
    const base = this.baseURL || DEFAULT_BASE_URL;
    this.apiBaseUrl = base.replace(/\/+$/, '');
  }

  getProviderName(): string {
    return 'DeepSeek';
  }

  private buildURL(path: string): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.apiBaseUrl}${cleanPath}`;
  }

  private async request<T>(
    path: string,
    options: {
      method?: string;
      headers?: Record<string, string>;
      body?: unknown;
    } = {},
  ): Promise<T> {
    const fetchFn = (globalThis as any).fetch;
    if (typeof fetchFn !== 'function') {
      throw new Error('Fetch API is not available in this environment');
    }

    const AbortControllerCtor = (globalThis as any).AbortController;
    const controller = AbortControllerCtor ? new AbortControllerCtor() : null;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (controller && this.timeout > 0) {
      timeoutId = setTimeout(() => controller.abort(), this.timeout);
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    const body =
      options.body !== undefined
        ? typeof options.body === 'string'
          ? options.body
          : JSON.stringify(options.body)
        : undefined;

    try {
      const response = await fetchFn(this.buildURL(path), {
        method: options.method || 'GET',
        headers,
        body,
        signal: controller ? controller.signal : undefined,
      });

      const rawText = await response.text();
      let parsed: any = null;

      if (rawText) {
        try {
          parsed = JSON.parse(rawText);
        } catch (parseError) {
          if (response.ok) {
            const error: any = new Error('Failed to parse DeepSeek response');
            error.cause = parseError;
            throw error;
          }
        }
      }

      if (!response.ok) {
        const errorMessage =
          (parsed &&
            typeof parsed === 'object' &&
            parsed.error &&
            parsed.error.message) ||
          rawText ||
          `DeepSeek API request failed: ${response.status} ${response.statusText}`;
        const error: any = new Error(errorMessage);
        error.status = response.status;
        if (
          parsed &&
          typeof parsed === 'object' &&
          parsed.error &&
          parsed.error.code
        ) {
          error.code = parsed.error.code;
        }
        throw error;
      }

      return (parsed ?? ({} as T)) as T;
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        const timeoutError: any = new Error('DeepSeek request timed out');
        timeoutError.code = 'ETIMEDOUT';
        throw timeoutError;
      }
      throw error;
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  async chat(
    request: ChatCompletionRequest,
  ): Promise<ChatCompletionResponse> {
    return this.withRetry(async () => {
      const payload = {
        model: request.model,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens,
        top_p: request.topP,
        stream: false,
      };

      const response: any = await this.request('/chat/completions', {
        method: 'POST',
        body: payload,
      });

      const choice = response?.choices?.[0];
      if (!choice || !choice.message) {
        throw new Error('Invalid response from DeepSeek');
      }

      return {
        content: choice.message.content || '',
        model: response.model,
        finishReason: choice.finish_reason || undefined,
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

  private getFallbackModels(): LLMModel[] {
    return [
      {
        id: 'deepseek-chat',
        name: 'DeepSeek Chat',
        maxTokens: 32768,
        supportsFunctions: true,
      },
      {
        id: 'deepseek-coder',
        name: 'DeepSeek Coder',
        maxTokens: 32768,
        supportsFunctions: true,
      },
    ];
  }

  async listModels(): Promise<LLMModel[]> {
    try {
      const data: any = await this.request('/models');
      const models = Array.isArray(data?.data) ? data.data : [];
      if (models.length > 0) {
        return models.map((model: { id: string }) => ({
          id: model.id,
          name: model.id,
          maxTokens: 32768,
          supportsFunctions: true,
        }));
      }
    } catch (error: any) {
      if (typeof Zotero !== 'undefined' && Zotero.debug) {
        Zotero.debug(
          `[AIPaperAnalysis] Failed to fetch DeepSeek models: ${
            error?.message || error
          }`,
        );
      }
    }
    return this.getFallbackModels();
  }

  async validateApiKey(): Promise<boolean> {
    try {
      await this.request('/models');
      return true;
    } catch (error: any) {
      if (error?.status === 401) {
        return false;
      }
      throw error;
    }
  }
}
