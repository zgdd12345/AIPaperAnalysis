/**
 * OpenAI Provider 实现
 * 支持 OpenAI GPT-4, GPT-3.5 等模型
 */
import { BaseLLMProvider } from './base';
import type { ChatCompletionRequest, ChatCompletionResponse, LLMModel, ProviderConfig } from '../../types/llm';
export declare class OpenAIProvider extends BaseLLMProvider {
    private client;
    constructor(config: ProviderConfig);
    getProviderName(): string;
    chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
    listModels(): Promise<LLMModel[]>;
    validateApiKey(): Promise<boolean>;
}
