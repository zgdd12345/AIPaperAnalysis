/**
 * 字节跳动豆包 Provider 实现
 * 使用原生 fetch API 调用 OpenAI 兼容的豆包 API
 */

import { BaseLLMProvider } from "./base";
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  LLMModel,
  ProviderConfig,
} from "../../types/llm";

const DEFAULT_BASE_URL = "https://ark.cn-beijing.volces.com/api/v3";

export class BytedanceProvider extends BaseLLMProvider {
  private readonly apiBaseUrl: string;

  constructor(config: ProviderConfig) {
    super(config);
    this.validateConfig();
    const base = this.baseURL || DEFAULT_BASE_URL;
    this.apiBaseUrl = base.replace(/\/+$/, "");
  }

  getProviderName(): string {
    return "Bytedance (豆包)";
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
          const timeoutError: any = new Error("Bytedance request timed out");
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
            const error: any = new Error("Failed to parse Bytedance response");
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
          `Bytedance API request failed: ${response.status} ${response.statusText}`;
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
        throw new Error("Invalid response from Bytedance");
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
    return [
      {
        id: "doubao-lite-4k",
        name: "豆包 Lite 4K",
        maxTokens: 4096,
        supportsFunctions: true,
      },
      {
        id: "doubao-pro-4k",
        name: "豆包 Pro 4K",
        maxTokens: 4096,
        supportsFunctions: true,
      },
      {
        id: "doubao-pro-32k",
        name: "豆包 Pro 32K",
        maxTokens: 32768,
        supportsFunctions: true,
      },
      {
        id: "doubao-pro-128k",
        name: "豆包 Pro 128K",
        maxTokens: 131072,
        supportsFunctions: true,
      },
    ];
  }

  async validateApiKey(): Promise<boolean> {
    try {
      await this.request("/chat/completions", {
        method: "POST",
        body: {
          model: "doubao-lite-4k",
          messages: [{ role: "user", content: "test" }],
          max_tokens: 10,
        },
      });
      return true;
    } catch (error: any) {
      if (error.status === 401 || error.status === 403) {
        return false;
      }
      throw error;
    }
  }
}
