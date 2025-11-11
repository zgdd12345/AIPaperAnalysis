/**
 * 提示词管理器
 * 负责提示词的增删改查和持久化
 */

import type { Prompt } from "../../types/analysis";

export class PromptManager {
  private prompts: Prompt[];
  private readonly PREF_KEY = "extensions.aipaperanalysis.prompts";

  constructor() {
    this.prompts = [];
    this.loadPrompts();
  }

  /**
   * 从偏好设置加载提示词
   */
  private loadPrompts(): void {
    try {
      const stored = Zotero.Prefs.get(this.PREF_KEY) as string | undefined;
      if (stored) {
        const parsed = JSON.parse(stored);
        // 恢复Date对象
        this.prompts = parsed.map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
        }));
      } else {
        // 首次使用，加载默认提示词
        this.prompts = this.getDefaultPrompts();
        this.savePrompts();
      }
    } catch (error) {
      console.error("Failed to load prompts:", error);
      this.prompts = this.getDefaultPrompts();
    }
  }

  /**
   * 保存提示词到偏好设置
   */
  private async savePrompts(): Promise<void> {
    try {
      const json = JSON.stringify(this.prompts);
      Zotero.Prefs.set(this.PREF_KEY, json);
    } catch (error) {
      console.error("Failed to save prompts:", error);
      throw new Error("保存提示词失败");
    }
  }

  /**
   * 获取默认提示词
   */
  private getDefaultPrompts(): Prompt[] {
    const now = new Date();
    return [
      {
        id: this.generateId(),
        name: "论文摘要",
        content:
          "请用中文总结这篇论文的核心内容，包括：\n1. 研究问题/背景\n2. 研究方法\n3. 主要发现\n4. 研究贡献\n\n请控制在300-500字以内，使用学术化的语言。",
        isDefault: true,
        createdAt: now,
        updatedAt: now,
        description: "生成论文的中文摘要",
        category: "基础分析",
      },
      {
        id: this.generateId(),
        name: "研究方法",
        content:
          "请详细分析这篇论文使用的研究方法，包括：\n1. 研究设计（实验/观察/调查等）\n2. 数据来源和收集方式\n3. 分析技术和工具\n4. 方法的创新点或特色\n\n请用结构化的方式呈现。",
        isDefault: true,
        createdAt: now,
        updatedAt: now,
        description: "分析研究方法论",
        category: "基础分析",
      },
      {
        id: this.generateId(),
        name: "创新点与贡献",
        content:
          "请提取这篇论文的主要创新点和学术贡献：\n1. 理论创新\n2. 方法创新\n3. 实践应用价值\n4. 与现有研究的区别\n\n请明确指出其独特性和重要性。",
        isDefault: true,
        createdAt: now,
        updatedAt: now,
        description: "识别论文的创新点",
        category: "基础分析",
      },
      {
        id: this.generateId(),
        name: "局限性与展望",
        content:
          "请分析这篇论文的局限性和未来研究方向：\n1. 研究的局限性（方法、数据、理论等）\n2. 可能的改进方向\n3. 建议的后续研究问题\n4. 对实践应用的启示\n\n请客观中立地评价。",
        isDefault: true,
        createdAt: now,
        updatedAt: now,
        description: "评估研究局限性",
        category: "基础分析",
      },
      {
        id: this.generateId(),
        name: "文献综述",
        content:
          "请基于这篇论文，总结其文献综述部分：\n1. 主要引用的理论框架\n2. 关键的前人研究\n3. 研究缺口的识别\n4. 本研究的定位\n\n这将帮助理解该研究在学术脉络中的位置。",
        isDefault: true,
        createdAt: now,
        updatedAt: now,
        description: "总结文献回顾",
        category: "深度分析",
      },
      {
        id: this.generateId(),
        name: "研究问题与假设",
        content:
          "请提取论文中的核心研究问题和假设：\n1. 主要研究问题\n2. 研究假设（如有）\n3. 理论基础\n4. 研究问题的重要性\n\n请用清晰的语言表述。",
        isDefault: true,
        createdAt: now,
        updatedAt: now,
        description: "识别研究问题",
        category: "深度分析",
      },
    ];
  }

  /**
   * 获取所有提示词
   */
  getAllPrompts(): Prompt[] {
    return [...this.prompts];
  }

  /**
   * 根据ID获取提示词
   */
  getPromptById(id: string): Prompt | undefined {
    return this.prompts.find((p) => p.id === id);
  }

  /**
   * 根据分类获取提示词
   */
  getPromptsByCategory(category: string): Prompt[] {
    return this.prompts.filter((p) => p.category === category);
  }

  /**
   * 获取所有分类
   */
  getCategories(): string[] {
    const categories = new Set(
      this.prompts
        .map((p) => p.category)
        .filter((c) => c !== undefined) as string[],
    );
    return Array.from(categories);
  }

  /**
   * 添加新提示词
   */
  async addPrompt(
    name: string,
    content: string,
    options?: {
      description?: string;
      category?: string;
    },
  ): Promise<Prompt> {
    const prompt: Prompt = {
      id: this.generateId(),
      name,
      content,
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      description: options?.description,
      category: options?.category,
    };

    this.prompts.push(prompt);
    await this.savePrompts();
    return prompt;
  }

  /**
   * 更新提示词
   */
  async updatePrompt(
    id: string,
    updates: Partial<Omit<Prompt, "id" | "isDefault" | "createdAt">>,
  ): Promise<void> {
    const index = this.prompts.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error("Prompt not found");
    }

    const prompt = this.prompts[index];

    // 不允许修改默认提示词的内容（但可以修改名称和描述）
    if (prompt.isDefault && updates.content) {
      throw new Error("Cannot modify content of default prompts");
    }

    this.prompts[index] = {
      ...prompt,
      ...updates,
      updatedAt: new Date(),
    };

    await this.savePrompts();
  }

  /**
   * 删除提示词
   */
  async deletePrompt(id: string): Promise<void> {
    const index = this.prompts.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error("Prompt not found");
    }

    const prompt = this.prompts[index];

    // 不允许删除默认提示词
    if (prompt.isDefault) {
      throw new Error("Cannot delete default prompts");
    }

    this.prompts.splice(index, 1);
    await this.savePrompts();
  }

  /**
   * 重置为默认提示词
   */
  async resetToDefaults(): Promise<void> {
    this.prompts = this.getDefaultPrompts();
    await this.savePrompts();
  }

  /**
   * 导出提示词为JSON
   */
  exportPrompts(): string {
    return JSON.stringify(this.prompts, null, 2);
  }

  /**
   * 从JSON导入提示词
   */
  async importPrompts(
    json: string,
    options?: { replace?: boolean },
  ): Promise<void> {
    try {
      const imported = JSON.parse(json);

      if (!Array.isArray(imported)) {
        throw new Error("Invalid format: expected an array");
      }

      // 验证格式
      for (const item of imported) {
        if (!item.name || !item.content) {
          throw new Error("Invalid format: missing required fields");
        }
      }

      // 恢复Date对象
      const prompts: Prompt[] = imported.map((p) => ({
        ...p,
        id: p.id || this.generateId(), // 如果没有ID则生成新的
        isDefault: false, // 导入的都标记为非默认
        createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
        updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
      }));

      if (options?.replace) {
        // 替换所有提示词
        this.prompts = prompts;
      } else {
        // 追加到现有提示词
        this.prompts.push(...prompts);
      }

      await this.savePrompts();
    } catch (error) {
      console.error("Failed to import prompts:", error);
      throw new Error("导入提示词失败：格式无效");
    }
  }

  /**
   * 复制提示词
   */
  async duplicatePrompt(id: string): Promise<Prompt> {
    const original = this.getPromptById(id);
    if (!original) {
      throw new Error("Prompt not found");
    }

    const duplicated: Prompt = {
      ...original,
      id: this.generateId(),
      name: `${original.name} (副本)`,
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.prompts.push(duplicated);
    await this.savePrompts();
    return duplicated;
  }

  /**
   * 搜索提示词
   */
  searchPrompts(query: string): Prompt[] {
    const lowerQuery = query.toLowerCase();
    return this.prompts.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.content.toLowerCase().includes(lowerQuery) ||
        p.description?.toLowerCase().includes(lowerQuery),
    );
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `prompt_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * 获取提示词数量统计
   */
  getStats(): {
    total: number;
    default: number;
    custom: number;
    byCategory: Record<string, number>;
  } {
    const byCategory: Record<string, number> = {};

    this.prompts.forEach((p) => {
      const category = p.category || "未分类";
      byCategory[category] = (byCategory[category] || 0) + 1;
    });

    return {
      total: this.prompts.length,
      default: this.prompts.filter((p) => p.isDefault).length,
      custom: this.prompts.filter((p) => !p.isDefault).length,
      byCategory,
    };
  }
}
