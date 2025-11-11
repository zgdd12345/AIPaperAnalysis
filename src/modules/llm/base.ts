/**
 * LLM Provider 抽象基类
 * 所有LLM提供商都必须实现这个接口
 */

import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  LLMModel,
  ProviderConfig,
  LLMError,
} from '../../types/llm';

export abstract class BaseLLMProvider {
  protected apiKey: string;
  protected baseURL?: string;
  protected timeout: number;
  protected maxRetries: number;

  constructor(config: ProviderConfig) {
    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL;
    this.timeout = config.timeout || 60000; // 默认60秒
    this.maxRetries = config.maxRetries || 3;
  }

  /**
   * 发送聊天请求
   */
  abstract chat(
    request: ChatCompletionRequest,
  ): Promise<ChatCompletionResponse>;

  /**
   * 列出可用的模型
   */
  abstract listModels(): Promise<LLMModel[]>;

  /**
   * 验证API密钥是否有效
   */
  abstract validateApiKey(): Promise<boolean>;

  /**
   * 获取提供商名称
   */
  abstract getProviderName(): string;

  /**
   * 带重试的请求包装
   */
  protected async withRetry<T>(
    fn: () => Promise<T>,
    retries = this.maxRetries,
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries > 0 && this.isRetryableError(error)) {
        // 指数退避
        const delay = Math.pow(2, this.maxRetries - retries) * 1000;
        await this.sleep(delay);
        return this.withRetry(fn, retries - 1);
      }
      throw this.normalizeError(error);
    }
  }

  /**
   * 判断错误是否可重试
   */
  protected isRetryableError(error: any): boolean {
    // 网络错误、超时、429 Too Many Requests、500+ 服务器错误都可以重试
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      return true;
    }
    if (error.status === 429 || error.status >= 500) {
      return true;
    }
    return false;
  }

  /**
   * 规范化错误信息
   */
  protected normalizeError(error: any): LLMError {
    const llmError: LLMError = {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred',
      provider: this.getProviderName(),
    };

    if (error.status) {
      llmError.statusCode = error.status;
    }

    // 根据状态码提供更友好的错误消息
    if (error.status === 401) {
      llmError.message = 'Invalid API key';
    } else if (error.status === 429) {
      llmError.message = 'Rate limit exceeded, please try again later';
    } else if (error.status === 500) {
      llmError.message = 'Provider server error';
    }

    return llmError;
  }

  /**
   * 睡眠函数
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 验证必需的配置
   */
  protected validateConfig(): void {
    if (!this.apiKey) {
      throw new Error('API key is required');
    }
  }
}
