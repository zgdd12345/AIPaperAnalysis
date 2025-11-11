/**
 * 字节跳动豆包 Provider 实现
 * 使用OpenAI兼容的API格式
 */
import OpenAI from "openai";
import { BaseLLMProvider } from "./base";
export class BytedanceProvider extends BaseLLMProvider {
  client;
  constructor(config) {
    super(config);
    this.validateConfig();
    this.client = new OpenAI({
      apiKey: this.apiKey,
      baseURL: this.baseURL || "https://ark.cn-beijing.volces.com/api/v3",
      timeout: this.timeout,
      maxRetries: 0,
    });
  }
  getProviderName() {
    return "Bytedance (豆包)";
  }
  async chat(request) {
    return this.withRetry(async () => {
      const response = await this.client.chat.completions.create({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens,
        top_p: request.topP,
        stream: false,
      });
      const choice = response.choices[0];
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
  async listModels() {
    return [
      {
        id: "doubao-pro-4k",
        name: "Doubao Pro 4K",
        maxTokens: 4096,
        supportsFunctions: true,
      },
      {
        id: "doubao-pro-32k",
        name: "Doubao Pro 32K",
        maxTokens: 32768,
        supportsFunctions: true,
      },
      {
        id: "doubao-lite-4k",
        name: "Doubao Lite 4K",
        maxTokens: 4096,
        supportsFunctions: false,
      },
      {
        id: "doubao-lite-32k",
        name: "Doubao Lite 32K",
        maxTokens: 32768,
        supportsFunctions: false,
      },
    ];
  }
  async validateApiKey() {
    try {
      // 发送测试请求
      await this.client.chat.completions.create({
        model: "doubao-lite-4k",
        messages: [{ role: "user", content: "test" }],
        max_tokens: 10,
      });
      return true;
    } catch (error) {
      if (error.status === 401 || error.status === 403) {
        return false;
      }
      return true;
    }
  }
}
