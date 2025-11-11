/**
 * OpenAI Provider 实现
 * 支持 OpenAI GPT-4, GPT-3.5 等模型
 */
import OpenAI from "openai";
import { BaseLLMProvider } from "./base";
export class OpenAIProvider extends BaseLLMProvider {
  client;
  constructor(config) {
    super(config);
    this.validateConfig();
    this.client = new OpenAI({
      apiKey: this.apiKey,
      baseURL: this.baseURL || "https://api.openai.com/v1",
      timeout: this.timeout,
      maxRetries: 0, // 我们自己处理重试
    });
  }
  getProviderName() {
    return "OpenAI";
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
  async listModels() {
    // OpenAI的模型列表
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
  async validateApiKey() {
    try {
      await this.client.models.list();
      return true;
    } catch (error) {
      return false;
    }
  }
}
