/**
 * AI Paper Analysis Plugin - 主模块
 * 初始化和管理所有功能模块
 */

import { ContextMenuManager } from "./menu/context-menu";
import { AnalysisEngine } from "./analyzer/engine";
import { LLMManager } from "./llm/manager";
import { PromptManager } from "./prompts/manager";
import { VisualizationTab } from "./visualization/tab";
import { getString } from "../utils/locale";

export class AIPaperAnalysisPlugin {
  private contextMenu: ContextMenuManager | null = null;
  private analysisEngine: AnalysisEngine | null = null;
  private llmManager: LLMManager | null = null;
  private promptManager: PromptManager | null = null;
  private visualizationTab: VisualizationTab | null = null;
  private initialized = false;
  private prefsPaneId: string | null = null;

  /**
   * 初始化插件
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      Zotero.debug("AI Paper Analysis Plugin already initialized");
      return;
    }

    try {
      Zotero.debug("Initializing AI Paper Analysis Plugin...");

      // 初始化核心管理器
      this.llmManager = new LLMManager();
      this.promptManager = new PromptManager();
      this.analysisEngine = new AnalysisEngine();
      this.visualizationTab = new VisualizationTab();

      // 注册设置面板优先，避免后续UI模块报错导致无法配置
      await this.registerPreferencePane();

      // 初始化上下文菜单
      this.contextMenu = new ContextMenuManager();
      this.safeRegisterContextMenu();

      // 注册可视化标签页（非关键功能，失败时记录错误但不中断插件初始化）
      // TODO: 可视化功能暂时禁用 - 需要修复locale字符串缺失和API兼容性问题
      // this.safeRegisterVisualizationTab();

      this.initialized = true;
      Zotero.debug("AI Paper Analysis Plugin initialized successfully");
    } catch (error) {
      Zotero.logError(
        error instanceof Error
          ? error
          : new Error(
              `Failed to initialize AI Paper Analysis Plugin: ${String(error)}`,
            ),
      );
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * 清理插件
   */
  cleanup(): void {
    if (!this.initialized) {
      return;
    }

    try {
      Zotero.debug("Cleaning up AI Paper Analysis Plugin...");

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
      if (this.prefsPaneId) {
        Zotero.PreferencePanes.unregister(this.prefsPaneId);
        this.prefsPaneId = null;
      }

      this.initialized = false;
      Zotero.debug("AI Paper Analysis Plugin cleaned up successfully");
    } catch (error) {
      Zotero.logError(
        error instanceof Error
          ? error
          : new Error(
              `Failed to cleanup AI Paper Analysis Plugin: ${String(error)}`,
            ),
      );
    }
  }

  /**
   * 获取分析引擎
   */
  getAnalysisEngine(): AnalysisEngine | null {
    return this.analysisEngine;
  }

  /**
   * 获取LLM管理器
   */
  getLLMManager(): LLMManager | null {
    return this.llmManager;
  }

  /**
   * 获取提示词管理器
   */
  getPromptManager(): PromptManager | null {
    return this.promptManager;
  }

  /**
   * 获取上下文菜单管理器
   */
  getContextMenu(): ContextMenuManager | null {
    return this.contextMenu;
  }

  /**
   * 检查是否已初始化
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  private async registerPreferencePane(): Promise<void> {
    if (this.prefsPaneId) {
      return;
    }
    try {
      const prefsTitle = getString("prefs-title");
      const prefsSrc = `${rootURI}content/preferences.xhtml`;
      const prefsImage = `${rootURI}content/icons/favicon.png`;
      const paneId = addon.data.config.addonRef;

      Zotero.debug(`[AI Paper Analysis] Registering preference pane:`);
      Zotero.debug(`  - pluginID: ${addon.data.config.addonID}`);
      Zotero.debug(`  - id: ${paneId}`);
      Zotero.debug(`  - src: ${prefsSrc}`);
      Zotero.debug(`  - label: ${prefsTitle}`);
      Zotero.debug(`  - image: ${prefsImage}`);

      this.prefsPaneId = await Zotero.PreferencePanes.register({
        pluginID: addon.data.config.addonID,
        id: paneId,
        src: prefsSrc,
        label: prefsTitle,
        image: prefsImage,
      });

      Zotero.debug(`[AI Paper Analysis] Preference pane registered successfully with ID: ${this.prefsPaneId}`);
    } catch (error) {
      Zotero.logError(
        error instanceof Error
          ? error
          : new Error(
              `Failed to register preference pane: ${String(error)}`,
            ),
      );
      // 重新抛出错误以便调试
      throw error;
    }
  }

  private safeRegisterContextMenu(): void {
    if (!this.contextMenu) {
      return;
    }
    try {
      this.contextMenu.register();
    } catch (error) {
      Zotero.logError(
        error instanceof Error
          ? error
          : new Error(
              `Failed to register AI Paper Analysis context menu: ${String(
                error,
              )}`,
            ),
      );
    }
  }

  private safeRegisterVisualizationTab(): void {
    // 可视化功能暂时禁用 - 存在以下问题需要修复:
    // 1. 缺失关键locale字符串 (item-section-ai-summary-head, item-section-ai-summary-sidenav)
    // 2. ItemPaneManager API兼容性未验证
    // 3. XHTML模板格式问题
    // 4. 数据聚合的多语言支持不完善
    return;

    /* 原代码保留供将来修复参考
    if (!this.visualizationTab) {
      return;
    }
    try {
      this.visualizationTab.register();
    } catch (error) {
      Zotero.logError(
        error instanceof Error
          ? error
          : new Error(
              `Failed to register AI Paper Analysis visualization tab: ${String(
                error,
              )}`,
            ),
      );
    }
    */
  }
}

// 创建全局插件实例
let pluginInstance: AIPaperAnalysisPlugin | null = null;

/**
 * 获取插件实例
 */
export function getPluginInstance(): AIPaperAnalysisPlugin {
  if (!pluginInstance) {
    pluginInstance = new AIPaperAnalysisPlugin();
  }
  return pluginInstance;
}

/**
 * 初始化插件（在Zotero启动时调用）
 */
export async function initializePlugin(): Promise<void> {
  const plugin = getPluginInstance();
  await plugin.initialize();
}

/**
 * 清理插件（在Zotero关闭时调用）
 */
export function cleanupPlugin(): void {
  const plugin = getPluginInstance();
  plugin.cleanup();
  pluginInstance = null;
}
