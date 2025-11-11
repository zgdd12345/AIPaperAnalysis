/**
 * 笔记生成器 - 将分析结果保存为Zotero笔记
 */
import type { AnalysisResult } from "../../types/analysis";
export declare class NoteCreator {
    /**
     * 从分析结果创建笔记
     */
    createNoteFromAnalysis(result: AnalysisResult): Promise<Zotero.Item>;
    /**
     * 批量创建笔记
     */
    createBatchNotes(results: AnalysisResult[]): Promise<Zotero.Item[]>;
    /**
     * 格式化笔记内容（Markdown转HTML）
     */
    private formatNoteContent;
    /**
     * 构建Markdown内容
     */
    private buildMarkdownContent;
    private buildMetadataComment;
    /**
     * Markdown转HTML（简化版）
     */
    private markdownToHTML;
    /**
     * 格式化日期时间
     */
    private formatDateTime;
    /**
     * 更新现有笔记
     */
    updateNote(noteId: number, result: AnalysisResult): Promise<void>;
    /**
     * 检查是否已存在相同提示词的分析笔记
     */
    findExistingNote(itemId: number, promptId: string): Promise<Zotero.Item | null>;
    /**
     * 创建或更新笔记
     */
    createOrUpdateNote(result: AnalysisResult): Promise<Zotero.Item>;
    /**
     * 删除指定文献的所有AI分析笔记
     */
    deleteAllAnalysisNotes(itemId: number): Promise<number>;
    /**
     * 导出笔记为Markdown文件
     */
    exportNoteAsMarkdown(noteId: number): Promise<string>;
    /**
     * HTML转Markdown（简化版）
     */
    private htmlToMarkdown;
    /**
     * 获取笔记统计
     */
    getNotesStats(itemId: number): Promise<{
        total: number;
        aiGenerated: number;
        byPrompt: Record<string, number>;
    }>;
    /**
     * 格式化错误信息
     */
    private formatError;
}
