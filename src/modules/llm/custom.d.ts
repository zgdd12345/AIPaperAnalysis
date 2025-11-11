/**
 * 自定义 API Provider 实现
 * 支持任何OpenAI兼容的API端点
 */
import { BaseLLMProvider } from './base';
import type { ChatCompletionRequest, ChatCompletionResponse, LLMModel, ProviderConfig } from '../../types/llm';
export declare class CustomProvider extends BaseLLMProvider {
    private client;
    private customModels;
    constructor(config: ProviderConfig & {
        models?: LLMModel[];
    });
    getProviderName(): string;
    chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
    listModels(): Promise<LLMModel[]>;
    validateApiKey(): Promise<boolean>;
    /**
     * 设置自定义模型列表
     */
    setCustomModels(models: LLMModel[]): void;
}
