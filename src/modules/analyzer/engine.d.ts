/**
 * 分析引擎 - 协调LLM和文本提取，执行分析任务
 */
import { LLMManager } from "../llm/manager";
import { PromptManager } from "../prompts/manager";
import type { AnalysisResult, BatchAnalysisOptions } from "../../types/analysis";
export declare class AnalysisEngine {
    private llmManager;
    private textExtractor;
    private promptManager;
    constructor();
    /**
     * 分析单个文献条目
     */
    analyzeItem(item: Zotero.Item, promptId: string): Promise<AnalysisResult>;
    /**
     * 批量分析文献
     */
    analyzeBatch(options: BatchAnalysisOptions): Promise<AnalysisResult[]>;
    /**
     * 取消正在进行的分析
     * 注：这是一个简化版本，实际应该使用AbortController
     */
    cancelAnalysis(): void;
    /**
     * 获取分析历史
     */
    getAnalysisHistory(itemId: number): Promise<AnalysisResult[]>;
    /**
     * 从笔记内容中解析元数据
     */
    private parseMetadataFromNote;
    /**
     * 估算分析成本（token使用）
     */
    estimateCost(items: Zotero.Item[], promptId: string): Promise<{
        totalTokens: number;
        itemCount: number;
        averageTokensPerItem: number;
    }>;
    /**
     * 检查是否可以开始分析
     */
    canStartAnalysis(): {
        canStart: boolean;
        reason?: string;
    };
    /**
     * 睡眠函数
     */
    private sleep;
    /**
     * 获取LLM管理器（供外部使用）
     */
    getLLMManager(): LLMManager;
    /**
     * 获取提示词管理器（供外部使用）
     */
    getPromptManager(): PromptManager;
}
