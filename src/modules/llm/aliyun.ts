/**
 * 阿里云通义千问 Provider 实现
 * 使用原生 fetch API 调用 OpenAI 兼容的 DashScope API
 */

import { BaseLLMProvider } from "./base";
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  LLMModel,
  ProviderConfig,
} from "../../types/llm";

const DEFAULT_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";

export class AliyunProvider extends BaseLLMProvider {
  private readonly apiBaseUrl: string;

  constructor(config: ProviderConfig) {
    super(config);
    this.validateConfig();
    const base = this.baseURL || DEFAULT_BASE_URL;
    this.apiBaseUrl = base.replace(/\/+$/, "");
  }

  getProviderName(): string {
    return "Aliyun (通义千问)";
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

    Zotero.debug(
      `[AIPaperAnalysis] Aliyun API request - URL: ${this.buildURL(path)}`,
    );

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
          const timeoutError: any = new Error("Aliyun request timed out");
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
            const error: any = new Error("Failed to parse Aliyun response");
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
          `Aliyun API request failed: ${response.status} ${response.statusText}`;
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

        // 记录详细错误信息
        Zotero.logError(
          new Error(
            `[AIPaperAnalysis] Aliyun API error - status: ${error.status}, code: ${error.code || "unknown"}, message: ${errorMessage}`,
          ),
        );

        throw error;
      }

      Zotero.debug(
        `[AIPaperAnalysis] Aliyun API response received successfully`,
      );

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

      Zotero.debug(
        `[AIPaperAnalysis] Aliyun chat request - model: ${request.model}, messages: ${request.messages.length}`,
      );

      const response: any = await this.request("/chat/completions", {
        method: "POST",
        body: payload,
      });

      const choice = response?.choices?.[0];
      if (!choice || !choice.message) {
        throw new Error("Invalid response from Aliyun");
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
        id: "qwen-max",
        name: "Qwen Max",
        maxTokens: 8000,
        supportsFunctions: true,
      },
      {
        id: "qwen-plus",
        name: "Qwen Plus",
        maxTokens: 8000,
        supportsFunctions: true,
      },
      {
        id: "qwen-turbo",
        name: "Qwen Turbo",
        maxTokens: 8000,
        supportsFunctions: true,
      },
      {
        id: "qwen-long",
        name: "Qwen Long (长文本)",
        maxTokens: 1000000,
        supportsFunctions: false,
      },
    ];
  }

  async validateApiKey(): Promise<boolean> {
    try {
      // 发送一个简单的测试请求
      await this.request("/chat/completions", {
        method: "POST",
        body: {
          model: "qwen-turbo",
          messages: [{ role: "user", content: "test" }],
          max_tokens: 10,
        },
      });
      return true;
    } catch (error: any) {
      // 认证错误 - API key 无效
      if (error.status === 401 || error.status === 403) {
        Zotero.debug(
          `[AIPaperAnalysis] Aliyun API key validation failed: ${error.message}`,
        );
        return false;
      }

      // 其他错误 - 抛出以便上层处理
      Zotero.logError(
        new Error(
          `[AIPaperAnalysis] Aliyun API validation error: ${error.message}`,
        ),
      );
      throw error;
    }
  }
}
