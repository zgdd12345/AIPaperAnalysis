var PromptManagerDialog = {
  params: null,
  manager: null,
  refreshCallback: null,
  listbox: null,
  emptyLabel: null,
  strings: null,

  onLoad() {
    this.params = window.arguments?.[0] || {};
    this.manager = this.params.manager || null;
    this.refreshCallback = this.params.onChange || null;
    this.strings = this.params.strings || {};
    this.listbox = document.getElementById("prompt-manager-list");
    this.emptyLabel = document.getElementById("prompt-manager-empty");

    if (!this.manager) {
      try {
        this.manager =
          Zotero.AIPaperAnalysis?.data?.plugin?.getPromptManager?.() || null;
      } catch (error) {
        Zotero.logError(error);
      }
    }

    // Fallback: create a lightweight manager backed by Prefs so that
    // the dialog can be opened via Debug Bridge without passing params.
    if (!this.manager) {
      this.manager = PrefsBackedPromptManager.create();
    }

    if (!this.manager) {
      Zotero.alert(
        window,
        "AI Paper Analysis",
        "无法加载提示词管理器，请在设置面板中重试。",
      );
      window.close();
      return;
    }

    this.refreshList();
    this.listbox?.addEventListener("select", () => this.updateButtons());
    this.listbox?.addEventListener("dblclick", () => this.editPrompt());
    this.updateButtons();
  },

  refreshList() {
    if (!this.listbox) {
      return;
    }
    while (this.listbox.firstChild) {
      this.listbox.firstChild.remove();
    }
    const prompts = this.manager.getAllPrompts();
    if (!prompts.length) {
      if (this.emptyLabel) {
        this.emptyLabel.hidden = false;
      }
      this.updateButtons();
      return;
    }
    if (this.emptyLabel) {
      this.emptyLabel.hidden = true;
    }

    prompts.forEach((prompt) => {
      const item = document.createElement("listitem");
      item.setAttribute("value", prompt.id);
      item.classList.add("prompt-manager-row");

      item.appendChild(this.createCell(prompt.name || "-"));
      item.appendChild(this.createCell(prompt.category || "-"));
      item.appendChild(this.createCell(prompt.description || ""));

      if (prompt.isDefault) {
        item.setAttribute("isDefault", "true");
      }

      this.listbox.appendChild(item);
    });

    this.listbox.selectedIndex = prompts.length ? 0 : -1;
    // Use setTimeout to ensure selectedItem is updated before checking button states
    setTimeout(() => this.updateButtons(), 0);
  },

  createCell(value) {
    const cell = document.createElement("listcell");
    cell.setAttribute("label", value || "");
    return cell;
  },

  getSelectedPrompt() {
    if (!this.listbox || this.listbox.selectedItem == null) {
      return null;
    }
    const id = this.listbox.selectedItem.getAttribute("value");
    if (!id) {
      return null;
    }
    return this.manager.getPromptById(id) || null;
  },

  updateButtons() {
    const prompt = this.getSelectedPrompt();
    // Enable both edit and delete buttons when a prompt is selected
    this.toggleButton("prompt-manager-edit", !prompt);
    this.toggleButton("prompt-manager-delete", !prompt);
  },

  toggleButton(id, disabled) {
    const button = document.getElementById(id);
    if (button) {
      button.disabled = !!disabled;
    }
  },

  openEditor(prompt) {
    const params = { prompt };
    window.openDialog(
      "chrome://aipaperanalysis/content/prompt-editor.xhtml",
      "prompt-editor",
      "chrome,dialog,centerscreen,resizable=yes",
      params,
    );
    return params.result || null;
  },

  async addPrompt() {
    const result = this.openEditor();
    if (!result) return;
    try {
      await this.manager.addPrompt(result.name, result.content, {
        category: result.category,
        description: result.description,
      });
      this.afterChange();
    } catch (error) {
      this.showError(error);
    }
  },

  async editPrompt() {
    const prompt = this.getSelectedPrompt();
    if (!prompt) {
      return;
    }
    const result = this.openEditor(prompt);
    if (!result) return;
    try {
      await this.manager.updatePrompt(prompt.id, {
        name: result.name,
        content: result.content,
        category: result.category,
        description: result.description,
      });
      this.afterChange();
    } catch (error) {
      this.showError(error);
    }
  },

  async deletePrompt() {
    const prompt = this.getSelectedPrompt();
    if (!prompt) {
      return;
    }
    // Allow deletion of all prompts including defaults
    const confirmMessage = prompt.isDefault
      ? this.getString(
          "deleteDefaultConfirm",
          "Are you sure you want to delete this default prompt? You can restore it using the Reset button.",
        )
      : this.getString("deleteConfirm", "Delete this prompt?");

    if (!window.confirm(confirmMessage)) {
      return;
    }
    try {
      await this.manager.deletePrompt(prompt.id);
      this.afterChange();
    } catch (error) {
      this.showError(error);
    }
  },

  async resetPrompts() {
    if (
      !window.confirm(
        this.getString(
          "resetConfirm",
          "Reset all prompts to the default set? This cannot be undone.",
        ),
      )
    ) {
      return;
    }
    try {
      await this.manager.resetToDefaults();
      this.afterChange();
    } catch (error) {
      this.showError(error);
    }
  },

  afterChange() {
    this.refreshList();
    if (typeof this.refreshCallback === "function") {
      try {
        this.refreshCallback();
      } catch (error) {
        Zotero.logError(error);
      }
    }
  },

  showError(error) {
    const message =
      error instanceof Error ? error.message : String(error || "未知错误");
    Zotero.alert(window, "AI Paper Analysis", message);
  },

  close() {
    window.close();
    return false;
  },

  getString(key, fallback) {
    if (this.strings && this.strings[key]) {
      return this.strings[key];
    }
    return fallback;
  },
};

window.addEventListener("load", () => PromptManagerDialog.onLoad());

// ------------------------
// Prefs-backed Manager Fallback
// ------------------------
var PrefsBackedPromptManager = (function () {
  const PREF_KEY = "extensions.aipaperanalysis.prompts";

  function now() {
    return new Date();
  }

  function load() {
    try {
      const raw = Zotero.Prefs.get(PREF_KEY);
      if (raw) {
        const parsed = JSON.parse(String(raw));
        if (Array.isArray(parsed)) {
          return parsed.map((p) => ({
            ...p,
            createdAt: p.createdAt ? new Date(p.createdAt) : now(),
            updatedAt: p.updatedAt ? new Date(p.updatedAt) : now(),
          }));
        }
      }
    } catch (e) {
      Zotero.logError(e);
    }
    return getDefaults();
  }

  function save(list) {
    try {
      Zotero.Prefs.set(PREF_KEY, JSON.stringify(list));
    } catch (e) {
      Zotero.logError(e);
    }
  }

  function genId() {
    return `prompt_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  function getDefaults() {
    const t = now();
    return [
      {
        id: genId(),
        name: "论文摘要",
        content:
          "请用中文总结这篇论文的核心内容，包括：\n1. 研究问题/背景\n2. 研究方法\n3. 主要发现\n4. 研究贡献\n\n请控制在300-500字以内，使用学术化的语言。",
        isDefault: true,
        createdAt: t,
        updatedAt: t,
        description: "生成论文的中文摘要",
        category: "基础分析",
      },
      {
        id: genId(),
        name: "研究方法",
        content:
          "请详细分析这篇论文使用的研究方法，包括：\n1. 研究设计（实验/观察/调查等）\n2. 数据来源和收集方式\n3. 分析技术和工具\n4. 方法的创新点或特色\n\n请用结构化的方式呈现。",
        isDefault: true,
        createdAt: t,
        updatedAt: t,
        description: "分析研究方法论",
        category: "基础分析",
      },
      {
        id: genId(),
        name: "创新点与贡献",
        content:
          "请提取这篇论文的主要创新点和学术贡献：\n1. 理论创新\n2. 方法创新\n3. 实践应用价值\n4. 与现有研究的区别\n\n请明确指出其独特性和重要性。",
        isDefault: true,
        createdAt: t,
        updatedAt: t,
        description: "识别论文的创新点",
        category: "基础分析",
      },
      {
        id: genId(),
        name: "局限性与展望",
        content:
          "请分析这篇论文的局限性和未来研究方向：\n1. 研究的局限性（方法、数据、理论等）\n2. 可能的改进方向\n3. 建议的后续研究问题\n4. 对实践应用的启示\n\n请客观中立地评价。",
        isDefault: true,
        createdAt: t,
        updatedAt: t,
        description: "评估研究局限性",
        category: "基础分析",
      },
      {
        id: genId(),
        name: "文献综述",
        content:
          "请基于这篇论文，总结其文献综述部分：\n1. 主要引用的理论框架\n2. 关键的前人研究\n3. 研究缺口的识别\n4. 本研究的定位\n\n这将帮助理解该研究在学术脉络中的位置。",
        isDefault: true,
        createdAt: t,
        updatedAt: t,
        description: "总结文献回顾",
        category: "深度分析",
      },
      {
        id: genId(),
        name: "研究问题与假设",
        content:
          "请提取论文中的核心研究问题和假设：\n1. 主要研究问题\n2. 研究假设（如有）\n3. 理论基础\n4. 研究问题的重要性\n\n请用清晰的语言表述。",
        isDefault: true,
        createdAt: t,
        updatedAt: t,
        description: "识别研究问题",
        category: "深度分析",
      },
    ];
  }

  function create() {
    let list = load();

    return {
      getAllPrompts() {
        return list.slice();
      },
      getPromptById(id) {
        return list.find((p) => p.id === id);
      },
      async addPrompt(name, content, { description, category } = {}) {
        const p = {
          id: genId(),
          name,
          content,
          isDefault: false,
          createdAt: now(),
          updatedAt: now(),
          description,
          category,
        };
        list.push(p);
        save(list);
        return p;
      },
      async updatePrompt(id, updates) {
        const idx = list.findIndex((p) => p.id === id);
        if (idx === -1) throw new Error("Prompt not found");
        const curr = list[idx];
        // Allow modification of all fields including content for default prompts
        list[idx] = { ...curr, ...updates, updatedAt: now() };
        save(list);
      },
      async deletePrompt(id) {
        const idx = list.findIndex((p) => p.id === id);
        if (idx === -1) throw new Error("Prompt not found");
        // Allow deletion of all prompts including defaults
        list.splice(idx, 1);
        save(list);
      },
      async resetToDefaults() {
        list = getDefaults();
        save(list);
      },
    };
  }

  return { create };
})();
