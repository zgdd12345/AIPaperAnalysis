/**
 * LLM Provider 抽象基类
 * 所有LLM提供商都必须实现这个接口
 */
export class BaseLLMProvider {
    apiKey;
    baseURL;
    timeout;
    maxRetries;
    constructor(config) {
        this.apiKey = config.apiKey;
        this.baseURL = config.baseURL;
        this.timeout = config.timeout || 60000; // 默认60秒
        this.maxRetries = config.maxRetries || 3;
    }
    /**
     * 带重试的请求包装
     */
    async withRetry(fn, retries = this.maxRetries) {
        try {
            return await fn();
        }
        catch (error) {
            if (retries > 0 && this.isRetryableError(error)) {
                // 指数退避
                const delay = Math.pow(2, this.maxRetries - retries) * 1000;
                await this.sleep(delay);
                return this.withRetry(fn, retries - 1);
            }
            throw this.normalizeError(error);
        }
    }
    /**
     * 判断错误是否可重试
     */
    isRetryableError(error) {
        // 网络错误、超时、429 Too Many Requests、500+ 服务器错误都可以重试
        if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
            return true;
        }
        if (error.status === 429 || error.status >= 500) {
            return true;
        }
        return false;
    }
    /**
     * 规范化错误信息
     */
    normalizeError(error) {
        const llmError = {
            code: error.code || 'UNKNOWN_ERROR',
            message: error.message || 'An unknown error occurred',
            provider: this.getProviderName(),
        };
        if (error.status) {
            llmError.statusCode = error.status;
        }
        // 根据状态码提供更友好的错误消息
        if (error.status === 401) {
            llmError.message = 'Invalid API key';
        }
        else if (error.status === 429) {
            llmError.message = 'Rate limit exceeded, please try again later';
        }
        else if (error.status === 500) {
            llmError.message = 'Provider server error';
        }
        return llmError;
    }
    /**
     * 睡眠函数
     */
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    /**
     * 验证必需的配置
     */
    validateConfig() {
        if (!this.apiKey) {
            throw new Error('API key is required');
        }
    }
}
