/**
 * LLM Manager - 管理多个LLM提供商
 * 提供统一的接口来访问不同的LLM服务
 */
import { OpenAIProvider } from './openai';
import { AnthropicProvider } from './anthropic';
import { DeepSeekProvider } from './deepseek';
import { AliyunProvider } from './aliyun';
import { BytedanceProvider } from './bytedance';
import { CustomProvider } from './custom';
export class LLMManager {
    providers;
    activeProvider;
    configs;
    constructor() {
        this.providers = new Map();
        this.configs = new Map();
        this.activeProvider = null;
        this.loadFromPreferences();
    }
    /**
     * 从Zotero偏好设置加载配置
     */
    loadFromPreferences() {
        try {
            // 加载活动提供商
            const activeProvider = Zotero.Prefs.get('extensions.aipaperanalysis.provider');
            if (activeProvider) {
                this.activeProvider = activeProvider;
            }
            // 加载各个提供商的配置
            const providers = [
                'openai',
                'anthropic',
                'deepseek',
                'aliyun',
                'bytedance',
                'custom',
            ];
            providers.forEach((type) => {
                const apiKey = Zotero.Prefs.get(`extensions.aipaperanalysis.${type}.apiKey`);
                if (apiKey) {
                    const config = {
                        type,
                        apiKey,
                        baseURL: Zotero.Prefs.get(`extensions.aipaperanalysis.${type}.baseURL`),
                        defaultModel: Zotero.Prefs.get(`extensions.aipaperanalysis.${type}.model`),
                        timeout: Zotero.Prefs.get(`extensions.aipaperanalysis.${type}.timeout`),
                        maxRetries: Zotero.Prefs.get(`extensions.aipaperanalysis.${type}.maxRetries`),
                    };
                    this.configs.set(type, config);
                }
            });
        }
        catch (error) {
            console.error('Failed to load LLM configurations:', error);
        }
    }
    /**
     * 添加或更新提供商配置
     */
    addProvider(config) {
        this.configs.set(config.type, config);
        // 保存到偏好设置
        Zotero.Prefs.set(`extensions.aipaperanalysis.${config.type}.apiKey`, config.apiKey);
        if (config.baseURL) {
            Zotero.Prefs.set(`extensions.aipaperanalysis.${config.type}.baseURL`, config.baseURL);
        }
        if (config.defaultModel) {
            Zotero.Prefs.set(`extensions.aipaperanalysis.${config.type}.model`, config.defaultModel);
        }
        // 清除已实例化的提供商，下次使用时重新创建
        this.providers.delete(config.type);
    }
    /**
     * 设置活动提供商
     */
    setActiveProvider(type) {
        if (!this.configs.has(type)) {
            throw new Error(`Provider ${type} is not configured`);
        }
        this.activeProvider = type;
        Zotero.Prefs.set('extensions.aipaperanalysis.provider', type);
    }
    /**
     * 获取活动提供商
     */
    getActiveProvider() {
        return this.activeProvider;
    }
    /**
     * 获取或创建提供商实例
     */
    getProvider(type) {
        const providerType = type || this.activeProvider;
        if (!providerType) {
            throw new Error('No active provider set');
        }
        // 如果已经实例化，直接返回
        if (this.providers.has(providerType)) {
            return this.providers.get(providerType);
        }
        // 获取配置
        const config = this.configs.get(providerType);
        if (!config) {
            throw new Error(`Provider ${providerType} is not configured`);
        }
        // 创建提供商实例
        let provider;
        switch (providerType) {
            case 'openai':
                provider = new OpenAIProvider(config);
                break;
            case 'anthropic':
                provider = new AnthropicProvider(config);
                break;
            case 'deepseek':
                provider = new DeepSeekProvider(config);
                break;
            case 'aliyun':
                provider = new AliyunProvider(config);
                break;
            case 'bytedance':
                provider = new BytedanceProvider(config);
                break;
            case 'custom':
                provider = new CustomProvider(config);
                break;
            default:
                throw new Error(`Unknown provider type: ${providerType}`);
        }
        this.providers.set(providerType, provider);
        return provider;
    }
    /**
     * 发送聊天请求
     */
    async chat(request, providerType) {
        const provider = this.getProvider(providerType);
        return provider.chat(request);
    }
    /**
     * 列出可用模型
     */
    async listModels(providerType) {
        const provider = this.getProvider(providerType);
        return provider.listModels();
    }
    /**
     * 验证API密钥
     */
    async validateApiKey(providerType) {
        try {
            const provider = this.getProvider(providerType);
            return await provider.validateApiKey();
        }
        catch (error) {
            console.error('API key validation failed:', error);
            return false;
        }
    }
    /**
     * 获取所有已配置的提供商
     */
    getConfiguredProviders() {
        return Array.from(this.configs.keys());
    }
    /**
     * 获取提供商配置
     */
    getProviderConfig(type) {
        return this.configs.get(type);
    }
    /**
     * 移除提供商配置
     */
    removeProvider(type) {
        this.configs.delete(type);
        this.providers.delete(type);
        // 从偏好设置中删除
        Zotero.Prefs.clear(`extensions.aipaperanalysis.${type}.apiKey`);
        Zotero.Prefs.clear(`extensions.aipaperanalysis.${type}.baseURL`);
        Zotero.Prefs.clear(`extensions.aipaperanalysis.${type}.model`);
        // 如果删除的是活动提供商，清除活动状态
        if (this.activeProvider === type) {
            this.activeProvider = null;
            Zotero.Prefs.clear('extensions.aipaperanalysis.provider');
        }
    }
    /**
     * 获取默认模型
     */
    getDefaultModel(providerType) {
        const type = providerType || this.activeProvider;
        if (!type)
            return undefined;
        const config = this.configs.get(type);
        return config?.defaultModel;
    }
    /**
     * 设置默认模型
     */
    setDefaultModel(model, providerType) {
        const type = providerType || this.activeProvider;
        if (!type) {
            throw new Error('No provider specified');
        }
        const config = this.configs.get(type);
        if (!config) {
            throw new Error(`Provider ${type} is not configured`);
        }
        config.defaultModel = model;
        this.configs.set(type, config);
        Zotero.Prefs.set(`extensions.aipaperanalysis.${type}.model`, model);
        // 清除已实例化的提供商
        this.providers.delete(type);
    }
    /**
     * 测试提供商连接
     */
    async testConnection(providerType) {
        try {
            const provider = this.getProvider(providerType);
            const isValid = await provider.validateApiKey();
            if (isValid) {
                const models = await provider.listModels();
                return {
                    success: true,
                    message: `连接成功！找到 ${models.length} 个可用模型。`,
                };
            }
            else {
                return {
                    success: false,
                    message: 'API密钥无效，请检查您的配置。',
                };
            }
        }
        catch (error) {
            return {
                success: false,
                message: `连接失败: ${error.message}`,
            };
        }
    }
}
