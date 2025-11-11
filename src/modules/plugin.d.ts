/**
 * AI Paper Analysis Plugin - 主模块
 * 初始化和管理所有功能模块
 */
import { ContextMenuManager } from "./menu/context-menu";
import { AnalysisEngine } from "./analyzer/engine";
import { LLMManager } from "./llm/manager";
import { PromptManager } from "./prompts/manager";
export declare class AIPaperAnalysisPlugin {
    private contextMenu;
    private analysisEngine;
    private llmManager;
    private promptManager;
    private visualizationTab;
    private initialized;
    /**
     * 初始化插件
     */
    initialize(): Promise<void>;
    /**
     * 清理插件
     */
    cleanup(): void;
    /**
     * 获取分析引擎
     */
    getAnalysisEngine(): AnalysisEngine | null;
    /**
     * 获取LLM管理器
     */
    getLLMManager(): LLMManager | null;
    /**
     * 获取提示词管理器
     */
    getPromptManager(): PromptManager | null;
    /**
     * 获取上下文菜单管理器
     */
    getContextMenu(): ContextMenuManager | null;
    /**
     * 检查是否已初始化
     */
    isInitialized(): boolean;
}
/**
 * 获取插件实例
 */
export declare function getPluginInstance(): AIPaperAnalysisPlugin;
/**
 * 初始化插件（在Zotero启动时调用）
 */
export declare function initializePlugin(): Promise<void>;
/**
 * 清理插件（在Zotero关闭时调用）
 */
export declare function cleanupPlugin(): void;
