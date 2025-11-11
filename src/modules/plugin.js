/**
 * AI Paper Analysis Plugin - 主模块
 * 初始化和管理所有功能模块
 */
import { ContextMenuManager } from "./menu/context-menu";
import { AnalysisEngine } from "./analyzer/engine";
import { LLMManager } from "./llm/manager";
import { PromptManager } from "./prompts/manager";
import { VisualizationTab } from "./visualization/tab";
export class AIPaperAnalysisPlugin {
    contextMenu = null;
    analysisEngine = null;
    llmManager = null;
    promptManager = null;
    visualizationTab = null;
    initialized = false;
    /**
     * 初始化插件
     */
    async initialize() {
        if (this.initialized) {
            console.warn("Plugin already initialized");
            return;
        }
        try {
            console.log("Initializing AI Paper Analysis Plugin...");
            // 初始化核心管理器
            this.llmManager = new LLMManager();
            this.promptManager = new PromptManager();
            this.analysisEngine = new AnalysisEngine();
            this.visualizationTab = new VisualizationTab();
            // 初始化上下文菜单
            this.contextMenu = new ContextMenuManager();
            this.contextMenu.register();
            this.visualizationTab.register();
            this.initialized = true;
            console.log("AI Paper Analysis Plugin initialized successfully");
        }
        catch (error) {
            console.error("Failed to initialize AI Paper Analysis Plugin:", error);
            throw error;
        }
    }
    /**
     * 清理插件
     */
    cleanup() {
        if (!this.initialized) {
            return;
        }
        try {
            console.log("Cleaning up AI Paper Analysis Plugin...");
            // 注销上下文菜单
            if (this.contextMenu) {
                this.contextMenu.unregister();
                this.contextMenu = null;
            }
            // 清理引用
            this.analysisEngine = null;
            this.llmManager = null;
            if (this.visualizationTab) {
                this.visualizationTab.unregister();
                this.visualizationTab = null;
            }
            this.promptManager = null;
            this.initialized = false;
            console.log("AI Paper Analysis Plugin cleaned up successfully");
        }
        catch (error) {
            console.error("Failed to cleanup AI Paper Analysis Plugin:", error);
        }
    }
    /**
     * 获取分析引擎
     */
    getAnalysisEngine() {
        return this.analysisEngine;
    }
    /**
     * 获取LLM管理器
     */
    getLLMManager() {
        return this.llmManager;
    }
    /**
     * 获取提示词管理器
     */
    getPromptManager() {
        return this.promptManager;
    }
    /**
     * 获取上下文菜单管理器
     */
    getContextMenu() {
        return this.contextMenu;
    }
    /**
     * 检查是否已初始化
     */
    isInitialized() {
        return this.initialized;
    }
}
// 创建全局插件实例
let pluginInstance = null;
/**
 * 获取插件实例
 */
export function getPluginInstance() {
    if (!pluginInstance) {
        pluginInstance = new AIPaperAnalysisPlugin();
    }
    return pluginInstance;
}
/**
 * 初始化插件（在Zotero启动时调用）
 */
export async function initializePlugin() {
    const plugin = getPluginInstance();
    await plugin.initialize();
}
/**
 * 清理插件（在Zotero关闭时调用）
 */
export function cleanupPlugin() {
    const plugin = getPluginInstance();
    plugin.cleanup();
    pluginInstance = null;
}
