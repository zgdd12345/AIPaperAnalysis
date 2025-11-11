/**
 * 自定义 API Provider 实现
 * 支持任何OpenAI兼容的API端点
 */
import OpenAI from 'openai';
import { BaseLLMProvider } from './base';
export class CustomProvider extends BaseLLMProvider {
    client;
    customModels;
    constructor(config) {
        super(config);
        if (!this.baseURL) {
            throw new Error('Base URL is required for custom provider');
        }
        this.validateConfig();
        this.client = new OpenAI({
            apiKey: this.apiKey,
            baseURL: this.baseURL,
            timeout: this.timeout,
            maxRetries: 0,
        });
        // 用户可以自定义模型列表
        this.customModels = config.models || [];
    }
    getProviderName() {
        return 'Custom API';
    }
    async chat(request) {
        return this.withRetry(async () => {
            const response = await this.client.chat.completions.create({
                model: request.model,
                messages: request.messages,
                temperature: request.temperature ?? 0.7,
                max_tokens: request.maxTokens,
                top_p: request.topP,
                stream: false,
            });
            const choice = response.choices[0];
            if (!choice || !choice.message) {
                throw new Error('Invalid response from custom API');
            }
            return {
                content: choice.message.content || '',
                model: response.model,
                finishReason: choice.finish_reason || undefined,
                usage: response.usage
                    ? {
                        promptTokens: response.usage.prompt_tokens,
                        completionTokens: response.usage.completion_tokens,
                        totalTokens: response.usage.total_tokens,
                    }
                    : undefined,
            };
        });
    }
    async listModels() {
        // 如果用户提供了自定义模型列表，使用它
        if (this.customModels.length > 0) {
            return this.customModels;
        }
        // 否则尝试从API获取
        try {
            const response = await this.client.models.list();
            return response.data.map((model) => ({
                id: model.id,
                name: model.id,
                maxTokens: 4096, // 默认值
                supportsFunctions: false,
            }));
        }
        catch (error) {
            // 如果API不支持列出模型，返回一个默认模型
            return [
                {
                    id: 'default',
                    name: 'Default Model',
                    maxTokens: 4096,
                    supportsFunctions: false,
                },
            ];
        }
    }
    async validateApiKey() {
        try {
            // 尝试列出模型或发送测试请求
            await this.listModels();
            return true;
        }
        catch (error) {
            if (error.status === 401 || error.status === 403) {
                return false;
            }
            // 对于自定义API，如果无法确定，默认认为有效
            return true;
        }
    }
    /**
     * 设置自定义模型列表
     */
    setCustomModels(models) {
        this.customModels = models;
    }
}
