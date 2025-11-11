/**
 * DeepSeek Provider 实现
 * 使用 OpenAI 兼容协议，但通过原生 fetch 避免 SDK 在 Zotero 中的网络限制
 */
import { BaseLLMProvider } from "./base";
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  LLMModel,
  ProviderConfig,
} from "../../types/llm";
export declare class DeepSeekProvider extends BaseLLMProvider {
  private readonly apiBaseUrl;
  constructor(config: ProviderConfig);
  getProviderName(): string;
  private buildURL;
  private request;
  chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
  private getFallbackModels;
  listModels(): Promise<LLMModel[]>;
  validateApiKey(): Promise<boolean>;
}
