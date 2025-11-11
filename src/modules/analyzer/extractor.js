/**
 * 文本提取器 - 从Zotero文献条目提取文本
 */
export class TextExtractor {
    /**
     * 从Zotero文献条目提取所有文本
     */
    async extractFromItem(item) {
        const extracted = {
            title: "",
            authors: "",
            year: "",
            abstract: "",
            keywords: [],
        };
        try {
            // 提取元数据
            extracted.title = item.getField("title") || "";
            extracted.abstract = item.getField("abstractNote") || "";
            extracted.year = this.extractYear(item);
            extracted.authors = this.extractAuthors(item);
            extracted.keywords = this.extractKeywords(item);
            extracted.publication =
                item.getField("publicationTitle") || undefined;
            extracted.doi = item.getField("DOI") || undefined;
            // 从PDF附件提取正文
            const fullText = await this.extractFromAttachments(item);
            if (fullText) {
                extracted.fullText = fullText;
            }
        }
        catch (error) {
            console.error("Text extraction failed:", error);
        }
        return extracted;
    }
    /**
     * 提取年份
     */
    extractYear(item) {
        try {
            const date = item.getField("date");
            if (date) {
                // 尝试提取4位数字的年份
                const yearMatch = date.match(/\d{4}/);
                if (yearMatch) {
                    return yearMatch[0];
                }
            }
        }
        catch (error) {
            console.error("Year extraction failed:", error);
        }
        return "";
    }
    /**
     * 提取作者
     */
    extractAuthors(item) {
        try {
            const creators = item.getCreators();
            if (creators && creators.length > 0) {
                return creators
                    .map((creator) => {
                    const parts = [];
                    if (creator.firstName)
                        parts.push(creator.firstName);
                    if (creator.lastName)
                        parts.push(creator.lastName);
                    return parts.join(" ");
                })
                    .filter((name) => name.length > 0)
                    .join(", ");
            }
        }
        catch (error) {
            console.error("Authors extraction failed:", error);
        }
        return "";
    }
    /**
     * 提取关键词
     */
    extractKeywords(item) {
        try {
            const tags = item.getTags();
            if (tags && tags.length > 0) {
                return tags.map((tag) => tag.tag);
            }
        }
        catch (error) {
            console.error("Keywords extraction failed:", error);
        }
        return [];
    }
    /**
     * 从PDF附件提取文本
     */
    async extractFromAttachments(item) {
        try {
            const attachmentIDs = item.getAttachments();
            if (!attachmentIDs || attachmentIDs.length === 0) {
                return "";
            }
            const textParts = [];
            for (const attachmentID of attachmentIDs) {
                const attachment = await Zotero.Items.getAsync(attachmentID);
                if (!attachment)
                    continue;
                // 只处理PDF附件
                const contentType = attachment.attachmentContentType;
                if (contentType !== "application/pdf")
                    continue;
                try {
                    const text = await this.extractFromPDF(attachment);
                    if (text) {
                        textParts.push(text);
                    }
                }
                catch (error) {
                    console.warn(`Failed to extract text from PDF ${attachmentID}:`, error);
                }
            }
            return textParts.join("\n\n");
        }
        catch (error) {
            console.error("Attachments extraction failed:", error);
            return "";
        }
    }
    /**
     * 从单个PDF提取文本
     */
    async extractFromPDF(attachment) {
        try {
            // 方法1: 尝试从Zotero全文索引获取
            const indexedState = await Zotero.Fulltext.getIndexedState(attachment);
            if (indexedState === Zotero.Fulltext.INDEX_STATE_INDEXED) {
                const cached = await this.readIndexedContent(attachment);
                if (cached) {
                    return cached;
                }
            }
            else if (indexedState === Zotero.Fulltext.INDEX_STATE_UNINDEXED) {
                await Zotero.Fulltext.indexItems([attachment.id]);
                const cached = await this.readIndexedContent(attachment);
                if (cached) {
                    return cached;
                }
            }
            // 方法2: 如果全文索引失败，尝试直接读取PDF
            // 注意：这需要PDF.js或其他PDF解析库，Zotero 7已经内置
            const path = await attachment.getFilePathAsync();
            if (typeof path === "string") {
                // 使用Zotero内置的PDF文本提取
                // 注：这个API可能因Zotero版本而异
                return await this.extractTextFromPath(path);
            }
            return "";
        }
        catch (error) {
            console.error("PDF extraction failed:", error);
            return "";
        }
    }
    /**
     * 从文件路径提取PDF文本
     */
    async extractTextFromPath(path) {
        try {
            const text = await Zotero.File.getBinaryContentsAsync(path);
            return text ? this.cleanText(text) : "";
        }
        catch (error) {
            console.warn("Direct PDF text extraction not available:", error);
            return "";
        }
    }
    /**
     * 读取全文索引缓存
     */
    async readIndexedContent(item) {
        try {
            const cacheFile = Zotero.Fulltext.getItemCacheFile(item);
            if (!cacheFile || !cacheFile.path) {
                return null;
            }
            const content = await Zotero.File.getBinaryContentsAsync(cacheFile.path);
            if (!content) {
                return null;
            }
            return this.cleanText(content);
        }
        catch (error) {
            console.warn("Failed to read indexed content:", error);
            return null;
        }
    }
    /**
     * 清理提取的文本
     */
    cleanText(text) {
        if (!text)
            return "";
        return (text
            // 移除多余的空白字符
            .replace(/\s+/g, " ")
            // 移除特殊字符（保留基本标点）
            .replace(/[^\w\s\u4e00-\u9fa5.,;:!?()[\]{}"'-]/g, "")
            // 移除多余的换行
            .replace(/\n{3,}/g, "\n\n")
            .trim());
    }
    /**
     * 格式化提取的文本为分析用的格式
     */
    formatForAnalysis(extracted) {
        const parts = [];
        parts.push("# 文献信息\n");
        if (extracted.title) {
            parts.push(`**标题**: ${extracted.title}\n`);
        }
        if (extracted.authors) {
            parts.push(`**作者**: ${extracted.authors}\n`);
        }
        if (extracted.year) {
            parts.push(`**年份**: ${extracted.year}\n`);
        }
        if (extracted.publication) {
            parts.push(`**出版物**: ${extracted.publication}\n`);
        }
        if (extracted.doi) {
            parts.push(`**DOI**: ${extracted.doi}\n`);
        }
        if (extracted.keywords.length > 0) {
            parts.push(`**关键词**: ${extracted.keywords.join(", ")}\n`);
        }
        if (extracted.abstract) {
            parts.push("\n## 摘要\n");
            parts.push(extracted.abstract + "\n");
        }
        if (extracted.fullText) {
            parts.push("\n## 正文\n");
            // 限制正文长度以避免超过token限制
            const maxLength = 50000; // 约50k字符
            const fullText = extracted.fullText.length > maxLength
                ? extracted.fullText.substring(0, maxLength) + "\n...(内容已截断)"
                : extracted.fullText;
            parts.push(fullText + "\n");
        }
        return parts.join("");
    }
    /**
     * 获取文本的token估计（粗略估计）
     */
    estimateTokens(text) {
        // 粗略估计：英文约4个字符=1 token，中文约1.5个字符=1 token
        const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
        const otherChars = text.length - chineseChars;
        return Math.ceil(chineseChars / 1.5 + otherChars / 4);
    }
}
