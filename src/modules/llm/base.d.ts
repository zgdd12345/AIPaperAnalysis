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
} from "../../types/llm";
export declare abstract class BaseLLMProvider {
  protected apiKey: string;
  protected baseURL?: string;
  protected timeout: number;
  protected maxRetries: number;
  constructor(config: ProviderConfig);
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
  protected withRetry<T>(fn: () => Promise<T>, retries?: number): Promise<T>;
  /**
   * 判断错误是否可重试
   */
  protected isRetryableError(error: any): boolean;
  /**
   * 规范化错误信息
   */
  protected normalizeError(error: any): LLMError;
  /**
   * 睡眠函数
   */
  protected sleep(ms: number): Promise<void>;
  /**
   * 验证必需的配置
   */
  protected validateConfig(): void;
}
