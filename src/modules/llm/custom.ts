/**
 * Custom Provider 实现
 * 支持任何 OpenAI 兼容的 API
 */

import { BaseLLMProvider } from "./base";
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  LLMModel,
  ProviderConfig,
} from "../../types/llm";

export class CustomProvider extends BaseLLMProvider {
  private readonly apiBaseUrl: string;

  constructor(config: ProviderConfig) {
    super(config);
    if (!config.baseURL) {
      throw new Error("Custom provider requires baseURL to be configured");
    }
    this.validateConfig();
    this.apiBaseUrl = config.baseURL.replace(/\/+$/, "");
  }

  getProviderName(): string {
    return "Custom";
  }

  private buildURL(path: string): string {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
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
    if (typeof fetchFn !== "function") {
      throw new Error("Fetch API is not available in this environment");
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    const body =
      options.body !== undefined
        ? typeof options.body === "string"
          ? options.body
          : JSON.stringify(options.body)
        : undefined;

    // 使用 Promise.race 实现超时，避免使用 AbortController
    const fetchPromise = fetchFn(this.buildURL(path), {
      method: options.method || "GET",
      headers,
      body,
    });

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      if (this.timeout > 0) {
        timeoutId = setTimeout(() => {
          const timeoutError: any = new Error(
            "Custom provider request timed out",
          );
          timeoutError.code = "ETIMEDOUT";
          timeoutError.name = "TimeoutError";
          reject(timeoutError);
        }, this.timeout);
      }
    });

    try {
      const response = await (this.timeout > 0
        ? Promise.race([fetchPromise, timeoutPromise])
        : fetchPromise);

      const rawText = await response.text();
      let parsed: any = null;

      if (rawText) {
        try {
          parsed = JSON.parse(rawText);
        } catch (parseError) {
          if (response.ok) {
            const error: any = new Error(
              "Failed to parse Custom provider response",
            );
            error.cause = parseError;
            throw error;
          }
        }
      }

      if (!response.ok) {
        const errorMessage =
          (parsed &&
            typeof parsed === "object" &&
            parsed.error &&
            parsed.error.message) ||
          rawText ||
          `Custom provider API request failed: ${response.status} ${response.statusText}`;
        const error: any = new Error(errorMessage);
        error.status = response.status;
        if (
          parsed &&
          typeof parsed === "object" &&
          parsed.error &&
          parsed.error.code
        ) {
          error.code = parsed.error.code;
        }
        throw error;
      }

      return (parsed ?? ({} as T)) as T;
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    return this.withRetry(async () => {
      const payload = {
        model: request.model,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens,
        top_p: request.topP,
        stream: false,
      };

      const response: any = await this.request("/chat/completions", {
        method: "POST",
        body: payload,
      });

      const choice = response?.choices?.[0];
      if (!choice || !choice.message) {
        throw new Error("Invalid response from Custom provider");
      }

      return {
        content: choice.message.content || "",
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

  async listModels(): Promise<LLMModel[]> {
    try {
      const data: any = await this.request("/models");
      const models = Array.isArray(data?.data) ? data.data : [];
      if (models.length > 0) {
        return models.map((model: { id: string }) => ({
          id: model.id,
          name: model.id,
          maxTokens: 8192,
          supportsFunctions: true,
        }));
      }
    } catch (error: any) {
      if (typeof Zotero !== "undefined" && Zotero.debug) {
        Zotero.debug(
          `[AIPaperAnalysis] Failed to fetch Custom provider models: ${
            error?.message || error
          }`,
        );
      }
    }
    // 返回空列表，需要用户手动配置模型
    return [];
  }

  async validateApiKey(): Promise<boolean> {
    try {
      await this.request("/models");
      return true;
    } catch (error: any) {
      if (error.status === 401 || error.status === 403) {
        return false;
      }
      // 如果 /models 不存在，尝试一个测试请求
      try {
        await this.request("/chat/completions", {
          method: "POST",
          body: {
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: "test" }],
            max_tokens: 10,
          },
        });
        return true;
      } catch {
        return false;
      }
    }
  }
}
