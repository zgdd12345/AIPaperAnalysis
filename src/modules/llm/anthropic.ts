/**
 * Anthropic (Claude) Provider 实现
 * 支持 Claude 3 系列模型
 */

import Anthropic from '@anthropic-ai/sdk';
import { BaseLLMProvider } from './base';
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  LLMModel,
  ProviderConfig,
  ChatMessage,
} from '../../types/llm';

export class AnthropicProvider extends BaseLLMProvider {
  private client: Anthropic;

  constructor(config: ProviderConfig) {
    super(config);
    this.validateConfig();

    this.client = new Anthropic({
      apiKey: this.apiKey,
      baseURL: this.baseURL,
      timeout: this.timeout,
      maxRetries: 0, // 我们自己处理重试
    });
  }

  getProviderName(): string {
    return 'Anthropic';
  }

  async chat(
    request: ChatCompletionRequest,
  ): Promise<ChatCompletionResponse> {
    return this.withRetry(async () => {
      // 分离system消息和其他消息
      const systemMessage = request.messages.find((m) => m.role === 'system');
      const messages = request.messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

      const response = await this.client.messages.create({
        model: request.model,
        max_tokens: request.maxTokens || 4096,
        temperature: request.temperature ?? 0.7,
        top_p: request.topP,
        system: systemMessage?.content,
        messages,
      });

      const content =
        response.content[0].type === 'text' ? response.content[0].text : '';

      return {
        content,
        model: response.model,
        finishReason: response.stop_reason || undefined,
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens:
            response.usage.input_tokens + response.usage.output_tokens,
        },
      };
    });
  }

  async listModels(): Promise<LLMModel[]> {
    return [
      {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        maxTokens: 200000,
        supportsFunctions: true,
      },
      {
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        maxTokens: 200000,
        supportsFunctions: true,
      },
      {
        id: 'claude-3-sonnet-20240229',
        name: 'Claude 3 Sonnet',
        maxTokens: 200000,
        supportsFunctions: true,
      },
      {
        id: 'claude-3-haiku-20240307',
        name: 'Claude 3 Haiku',
        maxTokens: 200000,
        supportsFunctions: true,
      },
    ];
  }

  async validateApiKey(): Promise<boolean> {
    try {
      // Anthropic没有专门的验证接口，尝试发送一个简单请求
      await this.client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }],
      });
      return true;
    } catch (error: any) {
      if (error.status === 401) {
        return false;
      }
      // 其他错误也认为密钥有效（可能是余额不足等）
      return true;
    }
  }
}
