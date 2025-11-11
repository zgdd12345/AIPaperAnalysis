/**
 * 文本提取器 - 从Zotero文献条目提取文本
 */
import type { ExtractedText } from "../../types/analysis";
export declare class TextExtractor {
    /**
     * 从Zotero文献条目提取所有文本
     */
    extractFromItem(item: Zotero.Item): Promise<ExtractedText>;
    /**
     * 提取年份
     */
    private extractYear;
    /**
     * 提取作者
     */
    private extractAuthors;
    /**
     * 提取关键词
     */
    private extractKeywords;
    /**
     * 从PDF附件提取文本
     */
    private extractFromAttachments;
    /**
     * 从单个PDF提取文本
     */
    private extractFromPDF;
    /**
     * 从文件路径提取PDF文本
     */
    private extractTextFromPath;
    /**
     * 读取全文索引缓存
     */
    private readIndexedContent;
    /**
     * 清理提取的文本
     */
    private cleanText;
    /**
     * 格式化提取的文本为分析用的格式
     */
    formatForAnalysis(extracted: ExtractedText): string;
    /**
     * 获取文本的token估计（粗略估计）
     */
    estimateTokens(text: string): number;
}
