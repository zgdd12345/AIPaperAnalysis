/**
 * LLM API集成的类型定义
 */
export interface LLMProvider {
    id: string;
    name: string;
    baseURL?: string;
    apiKey: string;
    models: LLMModel[];
}
export interface LLMModel {
    id: string;
    name: string;
    maxTokens: number;
    supportsFunctions?: boolean;
}
export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}
export interface ChatCompletionRequest {
    model: string;
    messages: ChatMessage[];
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    stream?: boolean;
}
export interface ChatCompletionResponse {
    content: string;
    model: string;
    finishReason?: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}
export interface LLMError {
    code: string;
    message: string;
    statusCode?: number;
    provider?: string;
}
export type ProviderType = 'openai' | 'anthropic' | 'deepseek' | 'aliyun' | 'bytedance' | 'custom';
export interface ProviderConfig {
    type: ProviderType;
    apiKey: string;
    baseURL?: string;
    defaultModel?: string;
    timeout?: number;
    maxRetries?: number;
}
