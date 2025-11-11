/**
 * 提示词管理器
 * 负责提示词的增删改查和持久化
 */
import type { Prompt } from '../../types/analysis';
export declare class PromptManager {
    private prompts;
    private readonly PREF_KEY;
    constructor();
    /**
     * 从偏好设置加载提示词
     */
    private loadPrompts;
    /**
     * 保存提示词到偏好设置
     */
    private savePrompts;
    /**
     * 获取默认提示词
     */
    private getDefaultPrompts;
    /**
     * 获取所有提示词
     */
    getAllPrompts(): Prompt[];
    /**
     * 根据ID获取提示词
     */
    getPromptById(id: string): Prompt | undefined;
    /**
     * 根据分类获取提示词
     */
    getPromptsByCategory(category: string): Prompt[];
    /**
     * 获取所有分类
     */
    getCategories(): string[];
    /**
     * 添加新提示词
     */
    addPrompt(name: string, content: string, options?: {
        description?: string;
        category?: string;
    }): Promise<Prompt>;
    /**
     * 更新提示词
     */
    updatePrompt(id: string, updates: Partial<Omit<Prompt, 'id' | 'isDefault' | 'createdAt'>>): Promise<void>;
    /**
     * 删除提示词
     */
    deletePrompt(id: string): Promise<void>;
    /**
     * 重置为默认提示词
     */
    resetToDefaults(): Promise<void>;
    /**
     * 导出提示词为JSON
     */
    exportPrompts(): string;
    /**
     * 从JSON导入提示词
     */
    importPrompts(json: string, options?: {
        replace?: boolean;
    }): Promise<void>;
    /**
     * 复制提示词
     */
    duplicatePrompt(id: string): Promise<Prompt>;
    /**
     * 搜索提示词
     */
    searchPrompts(query: string): Prompt[];
    /**
     * 生成唯一ID
     */
    private generateId;
    /**
     * 获取提示词数量统计
     */
    getStats(): {
        total: number;
        default: number;
        custom: number;
        byCategory: Record<string, number>;
    };
}
