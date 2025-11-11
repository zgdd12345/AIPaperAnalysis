/**
 * Anthropic (Claude) Provider 实现
 * 支持 Claude 3 系列模型
 */
import { BaseLLMProvider } from "./base";
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  LLMModel,
  ProviderConfig,
} from "../../types/llm";
export declare class AnthropicProvider extends BaseLLMProvider {
  private client;
  constructor(config: ProviderConfig);
  getProviderName(): string;
  chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
  listModels(): Promise<LLMModel[]>;
  validateApiKey(): Promise<boolean>;
}
