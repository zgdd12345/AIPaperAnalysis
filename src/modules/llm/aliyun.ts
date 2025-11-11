/**
 * 阿里云通义千问 Provider 实现
 * 使用OpenAI兼容的API格式
 */

import OpenAI from 'openai';
import { BaseLLMProvider } from './base';
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  LLMModel,
  ProviderConfig,
} from '../../types/llm';

export class AliyunProvider extends BaseLLMProvider {
  private client: OpenAI;

  constructor(config: ProviderConfig) {
    super(config);
    this.validateConfig();

    // 阿里云通义千问使用DashScope API
    this.client = new OpenAI({
      apiKey: this.apiKey,
      baseURL:
        this.baseURL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      timeout: this.timeout,
      maxRetries: 0,
    });
  }

  getProviderName(): string {
    return 'Aliyun (通义千问)';
  }

  async chat(
    request: ChatCompletionRequest,
  ): Promise<ChatCompletionResponse> {
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
        throw new Error('Invalid response from Aliyun');
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

  async listModels(): Promise<LLMModel[]> {
    return [
      {
        id: 'qwen-max',
        name: 'Qwen Max',
        maxTokens: 8000,
        supportsFunctions: true,
      },
      {
        id: 'qwen-plus',
        name: 'Qwen Plus',
        maxTokens: 8000,
        supportsFunctions: true,
      },
      {
        id: 'qwen-turbo',
        name: 'Qwen Turbo',
        maxTokens: 8000,
        supportsFunctions: true,
      },
      {
        id: 'qwen-long',
        name: 'Qwen Long (长文本)',
        maxTokens: 1000000,
        supportsFunctions: false,
      },
    ];
  }

  async validateApiKey(): Promise<boolean> {
    try {
      // 发送一个简单的测试请求
      await this.client.chat.completions.create({
        model: 'qwen-turbo',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 10,
      });
      return true;
    } catch (error: any) {
      if (error.status === 401 || error.status === 403) {
        return false;
      }
      return true;
    }
  }
}
