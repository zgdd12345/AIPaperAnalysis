/**
 * LLM Manager - 管理多个LLM提供商
 * 提供统一的接口来访问不同的LLM服务
 */
import type {
  ProviderType,
  ProviderConfig,
  ChatCompletionRequest,
  ChatCompletionResponse,
  LLMModel,
} from "../../types/llm";
export declare class LLMManager {
  private providers;
  private activeProvider;
  private configs;
  constructor();
  /**
   * 从Zotero偏好设置加载配置
   */
  private loadFromPreferences;
  /**
   * 添加或更新提供商配置
   */
  addProvider(config: ProviderConfig): void;
  /**
   * 设置活动提供商
   */
  setActiveProvider(type: ProviderType): void;
  /**
   * 获取活动提供商
   */
  getActiveProvider(): ProviderType | null;
  /**
   * 获取或创建提供商实例
   */
  private getProvider;
  /**
   * 发送聊天请求
   */
  chat(
    request: ChatCompletionRequest,
    providerType?: ProviderType,
  ): Promise<ChatCompletionResponse>;
  /**
   * 列出可用模型
   */
  listModels(providerType?: ProviderType): Promise<LLMModel[]>;
  /**
   * 验证API密钥
   */
  validateApiKey(providerType?: ProviderType): Promise<boolean>;
  /**
   * 获取所有已配置的提供商
   */
  getConfiguredProviders(): ProviderType[];
  /**
   * 获取提供商配置
   */
  getProviderConfig(type: ProviderType): ProviderConfig | undefined;
  /**
   * 移除提供商配置
   */
  removeProvider(type: ProviderType): void;
  /**
   * 获取默认模型
   */
  getDefaultModel(providerType?: ProviderType): string | undefined;
  /**
   * 设置默认模型
   */
  setDefaultModel(model: string, providerType?: ProviderType): void;
  /**
   * 测试提供商连接
   */
  testConnection(providerType?: ProviderType): Promise<{
    success: boolean;
    message: string;
  }>;
}
