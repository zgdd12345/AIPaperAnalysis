/**
 * 笔记生成器 - 将分析结果保存为Zotero笔记
 */

import type { AnalysisResult, NoteMetadata } from "../../types/analysis";

export class NoteCreator {
  /**
   * 从分析结果创建笔记
   */
  async createNoteFromAnalysis(result: AnalysisResult): Promise<Zotero.Item> {
    try {
      // 获取父条目
      const parentItem = await Zotero.Items.getAsync(result.itemId);
      if (!parentItem) {
        throw new Error(`Parent item not found: ${result.itemId}`);
      }

      // 创建笔记内容
      const content = this.formatNoteContent(result);

      // 创建笔记
      const note = new Zotero.Item("note");
      note.parentID = result.itemId;
      note.setNote(content);

      // 添加标签
      note.addTag("ai-analysis");
      note.addTag(`prompt:${result.promptId}`);
      if (result.provider) {
        note.addTag(`provider:${result.provider}`);
      }

      // 保存笔记
      await note.saveTx();

      console.log(`Created note for item ${result.itemId}`);
      return note;
    } catch (error) {
      console.error("Failed to create note:", error);
      throw new Error(`创建笔记失败: ${this.formatError(error)}`);
    }
  }

  /**
   * 批量创建笔记
   */
  async createBatchNotes(results: AnalysisResult[]): Promise<Zotero.Item[]> {
    const notes: Zotero.Item[] = [];

    for (const result of results) {
      try {
        // 跳过有错误的结果
        if (result.error) {
          console.warn(
            `Skipping note creation for failed analysis: ${result.error}`,
          );
          continue;
        }

        const note = await this.createNoteFromAnalysis(result);
        notes.push(note);
      } catch (error) {
        console.error(
          `Failed to create note for item ${result.itemId}:`,
          error,
        );
        // 继续处理其他笔记
      }
    }

    return notes;
  }

  /**
   * 格式化笔记内容（Markdown转HTML）
   */
  private formatNoteContent(result: AnalysisResult): string {
    // 构建Markdown内容
    const markdown = this.buildMarkdownContent(result);

    // 转换为HTML
    const html = this.markdownToHTML(markdown);

    return html;
  }

  /**
   * 构建Markdown内容
   */
  private buildMarkdownContent(result: AnalysisResult): string {
    const parts: string[] = [];

    // 标题
    parts.push(`# ${result.promptName}\n`);

    // 分析内容
    parts.push(result.content);
    parts.push("\n");

    // 分隔线
    parts.push("---\n");

    // 元数据
    parts.push("## 分析元数据\n");
    parts.push(`- **分析时间**: ${this.formatDateTime(result.timestamp)}\n`);
    parts.push(`- **使用模型**: ${result.model}\n`);
    parts.push(`- **提供商**: ${result.provider}\n`);
    parts.push(`- **提示词**: ${result.promptName}\n`);

    if (result.usage) {
      parts.push(
        `- **Token使用**: ${result.usage.totalTokens} ` +
          `(输入: ${result.usage.promptTokens}, 输出: ${result.usage.completionTokens})\n`,
      );
    }

    parts.push("\n");
    parts.push("---\n");
    parts.push(
      "*此笔记由 [AI Paper Analysis](https://github.com/yourusername/AIPaperAnalysis) 插件自动生成*\n",
    );
    parts.push(this.buildMetadataComment(result));

    return parts.join("");
  }
  private buildMetadataComment(result: AnalysisResult): string {
    const metadata: NoteMetadata = {
      analyzedAt: result.timestamp.toISOString(),
      model: result.model,
      provider: result.provider,
      promptName: result.promptName,
      tokenUsage: result.usage
        ? {
            prompt: result.usage.promptTokens,
            completion: result.usage.completionTokens,
            total: result.usage.totalTokens,
          }
        : undefined,
    };
    return `<!-- AIPaperAnalysis:${JSON.stringify(metadata)} -->\n`;
  }

  /**
   * Markdown转HTML（简化版）
   */
  private markdownToHTML(markdown: string): string {
    let html = markdown;

    // 标题
    html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");
    html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
    html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
    html = html.replace(/^#### (.+)$/gm, "<h4>$1</h4>");

    // 粗体
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

    // 斜体
    html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

    // 代码块
    html = html.replace(
      /```(\w+)?\n([\s\S]+?)```/g,
      "<pre><code>$2</code></pre>",
    );

    // 行内代码
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

    // 链接
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

    // 列表项
    html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
    html = html.replace(/^(\d+)\. (.+)$/gm, "<li>$2</li>");

    // 包装列表
    html = html.replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>");

    // 水平线
    html = html.replace(/^---$/gm, "<hr>");

    // 段落（简化处理）
    html = html.replace(/\n\n/g, "</p><p>");
    html = "<p>" + html + "</p>";

    // 清理多余的段落标签
    html = html.replace(/<p>\s*<h/g, "<h");
    html = html.replace(/<\/h(\d)>\s*<\/p>/g, "</h$1>");
    html = html.replace(/<p>\s*<hr>\s*<\/p>/g, "<hr>");
    html = html.replace(/<p>\s*<ul>/g, "<ul>");
    html = html.replace(/<\/ul>\s*<\/p>/g, "</ul>");
    html = html.replace(/<p>\s*<pre>/g, "<pre>");
    html = html.replace(/<\/pre>\s*<\/p>/g, "</pre>");

    // 清理空段落
    html = html.replace(/<p>\s*<\/p>/g, "");

    return html;
  }

  /**
   * 格式化日期时间
   */
  private formatDateTime(date: Date): string {
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  /**
   * 更新现有笔记
   */
  async updateNote(noteId: number, result: AnalysisResult): Promise<void> {
    try {
      const note = await Zotero.Items.getAsync(noteId);
      if (!note || note.itemType !== "note") {
        throw new Error("Note not found");
      }

      const content = this.formatNoteContent(result);
      note.setNote(content);
      await note.saveTx();

      console.log(`Updated note ${noteId}`);
    } catch (error) {
      console.error("Failed to update note:", error);
      throw new Error(`更新笔记失败: ${this.formatError(error)}`);
    }
  }

  /**
   * 检查是否已存在相同提示词的分析笔记
   */
  async findExistingNote(
    itemId: number,
    promptId: string,
  ): Promise<Zotero.Item | null> {
    try {
      const item = await Zotero.Items.getAsync(itemId);
      if (!item) return null;

      const noteIds = item.getNotes();
      const notes = await Zotero.Items.getAsync(noteIds);

      for (const note of notes) {
        const tags = note.getTags();
        const hasAITag = tags.some((tag) => tag.tag === "ai-analysis");
        const hasPromptTag = tags.some(
          (tag) => tag.tag === `prompt:${promptId}`,
        );

        if (hasAITag && hasPromptTag) {
          return note;
        }
      }

      return null;
    } catch (error) {
      console.error("Failed to find existing note:", error);
      return null;
    }
  }

  /**
   * 创建或更新笔记
   */
  async createOrUpdateNote(result: AnalysisResult): Promise<Zotero.Item> {
    // 检查是否已存在
    const existingNote = await this.findExistingNote(
      result.itemId,
      result.promptId,
    );

    if (existingNote) {
      // 更新现有笔记
      await this.updateNote(existingNote.id, result);
      return existingNote;
    } else {
      // 创建新笔记
      return await this.createNoteFromAnalysis(result);
    }
  }

  /**
   * 删除指定文献的所有AI分析笔记
   */
  async deleteAllAnalysisNotes(itemId: number): Promise<number> {
    try {
      const item = await Zotero.Items.getAsync(itemId);
      if (!item) return 0;

      const noteIds = item.getNotes();
      const notes = await Zotero.Items.getAsync(noteIds);

      let deletedCount = 0;

      for (const note of notes) {
        const tags = note.getTags();
        const hasAITag = tags.some((tag) => tag.tag === "ai-analysis");

        if (hasAITag) {
          await note.eraseTx();
          deletedCount++;
        }
      }

      console.log(`Deleted ${deletedCount} analysis notes for item ${itemId}`);
      return deletedCount;
    } catch (error) {
      console.error("Failed to delete analysis notes:", error);
      return 0;
    }
  }

  /**
   * 导出笔记为Markdown文件
   */
  async exportNoteAsMarkdown(noteId: number): Promise<string> {
    try {
      const note = await Zotero.Items.getAsync(noteId);
      if (!note || note.itemType !== "note") {
        throw new Error("Note not found");
      }

      // 从HTML转回Markdown（简化版）
      const html = note.getNote();
      const markdown = this.htmlToMarkdown(html);

      return markdown;
    } catch (error) {
      console.error("Failed to export note:", error);
      throw new Error(`导出笔记失败: ${this.formatError(error)}`);
    }
  }

  /**
   * HTML转Markdown（简化版）
   */
  private htmlToMarkdown(html: string): string {
    let markdown = html;

    // 移除HTML标签
    markdown = markdown.replace(/<h1>(.*?)<\/h1>/g, "# $1\n");
    markdown = markdown.replace(/<h2>(.*?)<\/h2>/g, "## $1\n");
    markdown = markdown.replace(/<h3>(.*?)<\/h3>/g, "### $1\n");
    markdown = markdown.replace(/<h4>(.*?)<\/h4>/g, "#### $1\n");
    markdown = markdown.replace(/<strong>(.*?)<\/strong>/g, "**$1**");
    markdown = markdown.replace(/<em>(.*?)<\/em>/g, "*$1*");
    markdown = markdown.replace(/<code>(.*?)<\/code>/g, "`$1`");
    markdown = markdown.replace(
      /<pre><code>(.*?)<\/code><\/pre>/gs,
      "```\n$1\n```",
    );
    markdown = markdown.replace(/<a href="(.*?)">(.*?)<\/a>/g, "[$2]($1)");
    markdown = markdown.replace(/<li>(.*?)<\/li>/g, "- $1\n");
    markdown = markdown.replace(/<\/?ul>/g, "");
    markdown = markdown.replace(/<hr>/g, "---");
    markdown = markdown.replace(/<\/?p>/g, "\n");

    // 清理多余的换行
    markdown = markdown.replace(/\n{3,}/g, "\n\n");

    return markdown.trim();
  }

  /**
   * 获取笔记统计
   */
  async getNotesStats(itemId: number): Promise<{
    total: number;
    aiGenerated: number;
    byPrompt: Record<string, number>;
  }> {
    try {
      const item = await Zotero.Items.getAsync(itemId);
      if (!item) {
        return { total: 0, aiGenerated: 0, byPrompt: {} };
      }

      const noteIds = item.getNotes();
      const notes = await Zotero.Items.getAsync(noteIds);

      const byPrompt: Record<string, number> = {};
      let aiGenerated = 0;

      for (const note of notes) {
        const tags = note.getTags();
        const hasAITag = tags.some((tag) => tag.tag === "ai-analysis");

        if (hasAITag) {
          aiGenerated++;

          // 统计每个提示词的笔记数
          const promptTag = tags.find((tag) => tag.tag.startsWith("prompt:"));
          if (promptTag) {
            const promptId = promptTag.tag.replace("prompt:", "");
            byPrompt[promptId] = (byPrompt[promptId] || 0) + 1;
          }
        }
      }

      return {
        total: notes.length,
        aiGenerated,
        byPrompt,
      };
    } catch (error) {
      console.error("Failed to get notes stats:", error);
      return { total: 0, aiGenerated: 0, byPrompt: {} };
    }
  }

  /**
   * 格式化错误信息
   */
  private formatError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }
}
