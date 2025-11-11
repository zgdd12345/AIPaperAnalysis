/**
 * 右键菜单管理器
 * 在Zotero文献列表中添加AI分析菜单
 */

import { AnalysisEngine } from "../analyzer/engine";
import { NoteCreator } from "../notes/creator";
import { PromptManager } from "../prompts/manager";

export class ContextMenuManager {
  private analysisEngine: AnalysisEngine;
  private noteCreator: NoteCreator;
  private promptManager: PromptManager;
  private menuElements: Element[] = [];

  constructor() {
    this.analysisEngine = new AnalysisEngine();
    this.noteCreator = new NoteCreator();
    this.promptManager = this.analysisEngine.getPromptManager();
  }

  /**
   * 注册右键菜单
   */
  register(): void {
    try {
      const win = Zotero.getMainWindow();
      if (!win) {
        console.error("Main window not found");
        return;
      }

      const doc = win.document;

      // 创建主菜单
      const mainMenu = this.createMainMenu(doc);

      // 添加到Zotero的item menu
      const itemMenu = doc.getElementById("zotero-itemmenu");
      if (itemMenu) {
        itemMenu.appendChild(mainMenu);
        this.menuElements.push(mainMenu);
        console.log("Context menu registered");
      } else {
        console.error("Zotero item menu not found");
      }
    } catch (error) {
      console.error("Failed to register context menu:", error);
    }
  }

  /**
   * 创建主菜单
   */
  private createMainMenu(doc: Document): Element {
    const XUL_NS =
      "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

    // 创建menu元素
    const menu = doc.createElementNS(XUL_NS, "menu");
    menu.id = "ai-paper-analysis-menu";
    menu.setAttribute("label", "AI分析");
    menu.setAttribute("class", "menuitem-iconic");

    // 创建popup
    const popup = doc.createElementNS(XUL_NS, "menupopup");
    popup.id = "ai-paper-analysis-popup";

    // 动态添加提示词菜单项
    popup.addEventListener("popupshowing", () => {
      this.updateMenuItems(doc, popup);
    });

    menu.appendChild(popup);
    return menu;
  }

  /**
   * 更新菜单项（动态加载提示词）
   */
  private updateMenuItems(doc: Document, popup: Element): void {
    const XUL_NS =
      "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

    // 清空现有菜单项
    while (popup.firstChild) {
      popup.removeChild(popup.firstChild);
    }

    // 检查是否可以开始分析
    const checkResult = this.analysisEngine.canStartAnalysis();
    if (!checkResult.canStart) {
      // 显示错误提示
      const errorItem = doc.createElementNS(XUL_NS, "menuitem");
      errorItem.setAttribute("label", checkResult.reason || "无法分析");
      errorItem.setAttribute("disabled", "true");
      popup.appendChild(errorItem);

      // 添加设置菜单项
      const separator = doc.createElementNS(XUL_NS, "menuseparator");
      popup.appendChild(separator);

      const settingsItem = doc.createElementNS(XUL_NS, "menuitem");
      settingsItem.setAttribute("label", "打开设置...");
      settingsItem.addEventListener("command", () => {
        this.openSettings();
      });
      popup.appendChild(settingsItem);
      return;
    }

    // 获取所有提示词
    const prompts = this.promptManager.getAllPrompts();
    console.log(
      `[ContextMenu] Loaded ${prompts.length} prompts:`,
      prompts.map((p) => ({ id: p.id, name: p.name, category: p.category })),
    );

    if (prompts.length === 0) {
      const emptyItem = doc.createElementNS(XUL_NS, "menuitem");
      emptyItem.setAttribute("label", "没有可用的提示词");
      emptyItem.setAttribute("disabled", "true");
      popup.appendChild(emptyItem);
      return;
    }

    // 按分类组织提示词
    const categories = this.promptManager.getCategories();
    console.log(
      `[ContextMenu] Found ${categories.length} categories:`,
      categories,
    );

    if (categories.length > 0) {
      categories.forEach((category, index) => {
        const categoryPrompts =
          this.promptManager.getPromptsByCategory(category);
        if (!categoryPrompts.length) {
          return;
        }

        const header = doc.createElementNS(XUL_NS, "menuitem");
        header.setAttribute("label", category);
        header.setAttribute("disabled", "true");
        header.setAttribute("class", "aipaperanalysis-category-label");
        popup.appendChild(header);

        categoryPrompts.forEach((prompt) => {
          const menuitem = this.createPromptMenuItem(
            doc,
            prompt.id,
            prompt.name,
          );
          popup.appendChild(menuitem);
        });

        if (index < categories.length - 1) {
          const separator = doc.createElementNS(XUL_NS, "menuseparator");
          popup.appendChild(separator);
        }
      });
    }

    // 未分类提示词或没有分类的情况
    const uncategorized = prompts.filter((p) => !p.category);
    if (!categories.length || uncategorized.length) {
      if (categories.length) {
        const separator = doc.createElementNS(XUL_NS, "menuseparator");
        popup.appendChild(separator);
      }
      if (uncategorized.length) {
        const header = doc.createElementNS(XUL_NS, "menuitem");
        header.setAttribute("label", "未分类");
        header.setAttribute("disabled", "true");
        popup.appendChild(header);
        uncategorized.forEach((prompt) => {
          const menuitem = this.createPromptMenuItem(
            doc,
            prompt.id,
            prompt.name,
          );
          popup.appendChild(menuitem);
        });
      } else if (!prompts.length) {
        const emptyItem = doc.createElementNS(XUL_NS, "menuitem");
        emptyItem.setAttribute("label", "没有可用的提示词");
        emptyItem.setAttribute("disabled", "true");
        popup.appendChild(emptyItem);
      }
    }

    // 添加分隔符和管理选项
    const separator = doc.createElementNS(XUL_NS, "menuseparator");
    popup.appendChild(separator);

    // 设置（打开偏好设置面板）
    const settingsItem = doc.createElementNS(XUL_NS, "menuitem");
    settingsItem.setAttribute("label", "设置...");
    settingsItem.addEventListener("command", () => {
      this.openSettings();
    });
    popup.appendChild(settingsItem);
  }

  /**
   * 创建提示词菜单项
   */
  private createPromptMenuItem(
    doc: Document,
    promptId: string,
    promptName: string,
  ): Element {
    const XUL_NS =
      "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

    const menuitem = doc.createElementNS(XUL_NS, "menuitem");
    menuitem.setAttribute("label", promptName);
    menuitem.addEventListener("command", () => {
      this.handleAnalysis(promptId);
    });

    return menuitem;
  }

  /**
   * 处理分析请求
   */
  private async handleAnalysis(promptId: string): Promise<void> {
    try {
      // 获取选中的文献
      const items = Zotero.getActiveZoteroPane().getSelectedItems();

      if (items.length === 0) {
        this.showAlert("提示", "请先选择文献条目");
        return;
      }

      // 过滤掉非regular item（如笔记、附件等）
      const regularItems = items.filter((item) => item.isRegularItem());

      if (regularItems.length === 0) {
        this.showAlert("提示", "请选择有效的文献条目（非笔记或附件）");
        return;
      }

      // 确认分析
      const promptName =
        this.promptManager.getPromptById(promptId)?.name || "未知";
      const confirmed = await this.confirmAnalysis(
        regularItems.length,
        promptName,
      );
      if (!confirmed) {
        return;
      }

      // 创建进度窗口
      const progressWindow = new Zotero.ProgressWindow();
      progressWindow.changeHeadline("AI分析进行中...");
      progressWindow.show();

      // 批量分析
      const results = await this.analysisEngine.analyzeBatch({
        items: regularItems,
        promptId,
        onProgress: (progress) => {
          progressWindow.changeHeadline(
            `正在分析: ${progress.currentItem} (${progress.current}/${progress.total})`,
          );
        },
      });

      // 创建笔记
      progressWindow.changeHeadline("正在创建笔记...");
      const notes = await this.noteCreator.createBatchNotes(results);

      // 显示结果
      progressWindow.changeHeadline("分析完成！");
      progressWindow.addDescription(
        `成功分析 ${results.filter((r) => !r.error).length} 篇文献`,
      );
      progressWindow.addDescription(`创建了 ${notes.length} 条笔记`);

      if (results.some((r) => r.error)) {
        const errorCount = results.filter((r) => r.error).length;
        progressWindow.addDescription(`${errorCount} 篇文献分析失败`);
      }

      progressWindow.startCloseTimer(5000);
    } catch (error: any) {
      console.error("Analysis failed:", error);
      this.showAlert("错误", `分析失败: ${error.message}`);
    }
  }

  /**
   * 确认分析对话框
   */
  private async confirmAnalysis(
    itemCount: number,
    promptName: string,
  ): Promise<boolean> {
    const win = Zotero.getMainWindow();
    if (!win) return false;

    const message = `即将使用提示词"${promptName}"分析 ${itemCount} 篇文献。\n\n这可能需要一些时间并消耗API额度。\n\n是否继续？`;

    const result = win.confirm(message);
    return result;
  }

  /**
   * 打开设置
   */
  private openSettings(): void {
    // 打开Zotero偏好设置，定位到插件设置页
    Zotero.Utilities.Internal.openPreferences("aipaperanalysis");
  }

  /**
   * 显示警告对话框
   */
  private showAlert(title: string, message: string): void {
    const win = Zotero.getMainWindow();
    if (win) {
      win.alert(message);
    }
  }

  /**
   * 注销右键菜单
   */
  unregister(): void {
    try {
      // 移除所有菜单元素
      this.menuElements.forEach((element) => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      });
      this.menuElements = [];
      console.log("Context menu unregistered");
    } catch (error) {
      console.error("Failed to unregister context menu:", error);
    }
  }

  /**
   * 获取分析引擎（供外部使用）
   */
  getAnalysisEngine(): AnalysisEngine {
    return this.analysisEngine;
  }

  /**
   * 获取提示词管理器（供外部使用）
   */
  getPromptManager(): PromptManager {
    return this.promptManager;
  }
}
