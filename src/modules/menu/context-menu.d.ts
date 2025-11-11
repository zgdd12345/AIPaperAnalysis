/**
 * 右键菜单管理器
 * 在Zotero文献列表中添加AI分析菜单
 */
import { AnalysisEngine } from "../analyzer/engine";
import { PromptManager } from "../prompts/manager";
export declare class ContextMenuManager {
    private analysisEngine;
    private noteCreator;
    private promptManager;
    private menuElements;
    constructor();
    /**
     * 注册右键菜单
     */
    register(): void;
    /**
     * 创建主菜单
     */
    private createMainMenu;
    /**
     * 更新菜单项（动态加载提示词）
     */
    private updateMenuItems;
    /**
     * 创建提示词菜单项
     */
    private createPromptMenuItem;
    /**
     * 处理分析请求
     */
    private handleAnalysis;
    /**
     * 确认分析对话框
     */
    private confirmAnalysis;
    /**
     * 显示批量分析对话框
     */
    private showBatchAnalysisDialog;
    /**
     * 打开提示词管理器
     */
    private openPromptManager;
    /**
     * 打开设置
     */
    private openSettings;
    /**
     * 显示警告对话框
     */
    private showAlert;
    /**
     * 注销右键菜单
     */
    unregister(): void;
    /**
     * 获取分析引擎（供外部使用）
     */
    getAnalysisEngine(): AnalysisEngine;
    /**
     * 获取提示词管理器（供外部使用）
     */
    getPromptManager(): PromptManager;
}
