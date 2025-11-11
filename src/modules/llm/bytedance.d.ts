/**
 * 字节跳动豆包 Provider 实现
 * 使用OpenAI兼容的API格式
 */
import { BaseLLMProvider } from './base';
import type { ChatCompletionRequest, ChatCompletionResponse, LLMModel, ProviderConfig } from '../../types/llm';
export declare class BytedanceProvider extends BaseLLMProvider {
    private client;
    constructor(config: ProviderConfig);
    getProviderName(): string;
    chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
    listModels(): Promise<LLMModel[]>;
    validateApiKey(): Promise<boolean>;
}
