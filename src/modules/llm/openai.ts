/**
 * OpenAI Provider 实现
 * 使用原生 fetch API 避免 SDK 在 Zotero 中的兼容性问题
 */

import { BaseLLMProvider } from "./base";
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  LLMModel,
  ProviderConfig,
} from "../../types/llm";

const DEFAULT_BASE_URL = "https://api.openai.com/v1";

export class OpenAIProvider extends BaseLLMProvider {
  private readonly apiBaseUrl: string;

  constructor(config: ProviderConfig) {
    super(config);
    this.validateConfig();
    const base = this.baseURL || DEFAULT_BASE_URL;
    this.apiBaseUrl = base.replace(/\/+$/, "");
  }

  getProviderName(): string {
    return "OpenAI";
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
          const timeoutError: any = new Error("OpenAI request timed out");
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
            const error: any = new Error("Failed to parse OpenAI response");
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
          `OpenAI API request failed: ${response.status} ${response.statusText}`;
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
        throw new Error("Invalid response from OpenAI");
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

  private getFallbackModels(): LLMModel[] {
    return [
      {
        id: "gpt-4-turbo-preview",
        name: "GPT-4 Turbo",
        maxTokens: 128000,
        supportsFunctions: true,
      },
      {
        id: "gpt-4",
        name: "GPT-4",
        maxTokens: 8192,
        supportsFunctions: true,
      },
      {
        id: "gpt-4-32k",
        name: "GPT-4 32K",
        maxTokens: 32768,
        supportsFunctions: true,
      },
      {
        id: "gpt-3.5-turbo",
        name: "GPT-3.5 Turbo",
        maxTokens: 16385,
        supportsFunctions: true,
      },
      {
        id: "gpt-3.5-turbo-16k",
        name: "GPT-3.5 Turbo 16K",
        maxTokens: 16385,
        supportsFunctions: true,
      },
    ];
  }

  async listModels(): Promise<LLMModel[]> {
    try {
      const data: any = await this.request("/models");
      const models = Array.isArray(data?.data) ? data.data : [];
      if (models.length > 0) {
        // 过滤出 GPT 模型
        return models
          .filter((model: { id: string }) => model.id.includes("gpt"))
          .map((model: { id: string }) => ({
            id: model.id,
            name: model.id,
            maxTokens: model.id.includes("32k")
              ? 32768
              : model.id.includes("16k")
                ? 16385
                : model.id.includes("turbo-preview") ||
                    model.id.includes("4-turbo")
                  ? 128000
                  : 8192,
            supportsFunctions: true,
          }));
      }
    } catch (error: any) {
      if (typeof Zotero !== "undefined" && Zotero.debug) {
        Zotero.debug(
          `[AIPaperAnalysis] Failed to fetch OpenAI models: ${
            error?.message || error
          }`,
        );
      }
    }
    return this.getFallbackModels();
  }

  async validateApiKey(): Promise<boolean> {
    try {
      await this.request("/models");
      return true;
    } catch (error: any) {
      if (error?.status === 401) {
        return false;
      }
      throw error;
    }
  }
}
