/**
 * 文本提取器 - 从Zotero文献条目提取文本
 */

import type { ExtractedText, ExtractionStatus, ExtractionError, AttachmentInfo } from "../../types/analysis";

export class TextExtractor {
  /**
   * 从Zotero文献条目提取所有文本
   */
  async extractFromItem(item: Zotero.Item): Promise<ExtractedText> {
    const extracted: ExtractedText = {
      title: "",
      authors: "",
      year: "",
      abstract: "",
      keywords: [],
    };

    // 初始化提取状态
    const extractionStatus: ExtractionStatus = {
      success: false,
      errors: [],
      warnings: [],
      attachments: [],
    };

    try {
      // 提取元数据
      extracted.title = (item.getField("title") as string) || "";
      extracted.abstract = (item.getField("abstractNote") as string) || "";
      extracted.year = this.extractYear(item);
      extracted.authors = this.extractAuthors(item);
      extracted.keywords = this.extractKeywords(item);
      extracted.publication =
        (item.getField("publicationTitle") as string) || undefined;
      extracted.doi = (item.getField("DOI") as string) || undefined;

      // 从PDF附件提取正文
      const result = await this.extractFromAttachments(item);
      if (result.text) {
        extracted.fullText = result.text;
      }

      // 合并提取状态
      extractionStatus.success = result.status.success;
      extractionStatus.errors = result.status.errors;
      extractionStatus.warnings = result.status.warnings;
      extractionStatus.attachments = result.status.attachments;
    } catch (error) {
      console.error("Text extraction failed:", error);
      extractionStatus.errors.push({
        attachmentId: -1,
        type: "extraction_failed",
        message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
      });
    }

    extracted.extractionStatus = extractionStatus;
    return extracted;
  }

  /**
   * 提取年份
   */
  private extractYear(item: Zotero.Item): string {
    try {
      const date = item.getField("date") as string;
      if (date) {
        // 尝试提取4位数字的年份
        const yearMatch = date.match(/\d{4}/);
        if (yearMatch) {
          return yearMatch[0];
        }
      }
    } catch (error) {
      console.error("Year extraction failed:", error);
    }
    return "";
  }

  /**
   * 提取作者
   */
  private extractAuthors(item: Zotero.Item): string {
    try {
      const creators = item.getCreators();
      if (creators && creators.length > 0) {
        return creators
          .map((creator) => {
            const parts = [];
            if (creator.firstName) parts.push(creator.firstName);
            if (creator.lastName) parts.push(creator.lastName);
            return parts.join(" ");
          })
          .filter((name) => name.length > 0)
          .join(", ");
      }
    } catch (error) {
      console.error("Authors extraction failed:", error);
    }
    return "";
  }

  /**
   * 提取关键词
   */
  private extractKeywords(item: Zotero.Item): string[] {
    try {
      const tags = item.getTags();
      if (tags && tags.length > 0) {
        return tags.map((tag) => tag.tag);
      }
    } catch (error) {
      console.error("Keywords extraction failed:", error);
    }
    return [];
  }

  /**
   * 从PDF附件提取文本
   */
  private async extractFromAttachments(item: Zotero.Item): Promise<{
    text: string;
    status: ExtractionStatus;
  }> {
    const status: ExtractionStatus = {
      success: false,
      errors: [],
      warnings: [],
      attachments: [],
    };

    try {
      const attachmentIDs = item.getAttachments();
      if (!attachmentIDs || attachmentIDs.length === 0) {
        status.warnings.push("No attachments found");
        return { text: "", status };
      }

      const textParts: string[] = [];
      let successCount = 0;

      for (const attachmentID of attachmentIDs) {
        const attachment = await Zotero.Items.getAsync(attachmentID);
        if (!attachment) {
          status.warnings.push(`Attachment ${attachmentID} not found`);
          continue;
        }

        // 只处理PDF附件
        const contentType = attachment.attachmentContentType;
        if (contentType !== "application/pdf") {
          continue;
        }

        try {
          const result = await this.extractFromPDF(attachment);

          // 记录附件信息
          status.attachments.push(result.info);

          if (result.text) {
            textParts.push(result.text);
            successCount++;
          }

          // 合并错误和警告
          if (result.error) {
            status.errors.push(result.error);
          }
          if (result.warning) {
            status.warnings.push(result.warning);
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.warn(`Failed to extract text from PDF ${attachmentID}:`, error);

          status.errors.push({
            attachmentId: attachmentID,
            type: "extraction_failed",
            message: errorMsg,
          });

          status.attachments.push({
            id: attachmentID,
            linkMode: "unknown",
            accessible: false,
          });
        }
      }

      status.success = successCount > 0;
      return {
        text: textParts.join("\n\n"),
        status,
      };
    } catch (error) {
      console.error("Attachments extraction failed:", error);
      status.errors.push({
        attachmentId: -1,
        type: "extraction_failed",
        message: `Attachments processing failed: ${error instanceof Error ? error.message : String(error)}`,
      });
      return { text: "", status };
    }
  }

  /**
   * 从单个PDF提取文本
   */
  private async extractFromPDF(attachment: Zotero.Item): Promise<{
    text: string;
    info: AttachmentInfo;
    error?: ExtractionError;
    warning?: string;
  }> {
    const attachmentId = attachment.id;
    const info: AttachmentInfo = {
      id: attachmentId,
      linkMode: this.getLinkMode(attachment),
      accessible: false,
      isCloudPlaceholder: false,
    };

    try {
      // 获取文件路径
      const path = await attachment.getFilePathAsync();
      if (!path || typeof path !== "string") {
        return {
          text: "",
          info,
          error: {
            attachmentId,
            type: "file_not_found",
            message: "No file path available for attachment",
          },
        };
      }

      info.path = path;

      // 检查文件是否存在
      const fileExists = await this.checkFileExists(path);
      if (!fileExists) {
        const errorType = info.linkMode === "linked" ? "linked_file_unavailable" : "file_not_found";
        return {
          text: "",
          info,
          error: {
            attachmentId,
            type: errorType,
            message: `File not found: ${path}`,
            filePath: path,
          },
        };
      }

      // 检查是否为云占位符
      const isPlaceholder = await this.checkCloudPlaceholder(path);
      info.isCloudPlaceholder = isPlaceholder;

      if (isPlaceholder) {
        return {
          text: "",
          info,
          error: {
            attachmentId,
            type: "cloud_placeholder",
            message: `File appears to be a cloud storage placeholder (OneDrive/Dropbox). Please ensure the file is fully synced.`,
            filePath: path,
          },
        };
      }

      info.accessible = true;

      // 方法1: 尝试从Zotero全文索引获取
      const indexedState = await Zotero.Fulltext.getIndexedState(attachment);

      if (indexedState === Zotero.Fulltext.INDEX_STATE_INDEXED) {
        const cached = await this.readIndexedContent(attachment);
        if (cached) {
          return { text: cached, info };
        }
      } else if (indexedState === Zotero.Fulltext.INDEX_STATE_UNINDEXED) {
        await Zotero.Fulltext.indexItems([attachment.id]);
        const cached = await this.readIndexedContent(attachment);
        if (cached) {
          return { text: cached, info };
        }
      }

      // 方法2: 如果全文索引失败，尝试直接读取PDF
      const text = await this.extractTextFromPath(path);
      if (text) {
        return { text, info };
      }

      // 如果两种方法都失败
      return {
        text: "",
        info,
        warning: `PDF content extraction failed for ${path}, but file is accessible`,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("PDF extraction failed:", error);

      // 尝试判断错误类型
      let errorType: ExtractionError["type"] = "extraction_failed";
      if (errorMsg.includes("permission") || errorMsg.includes("EACCES")) {
        errorType = "permission_denied";
      } else if (errorMsg.includes("network") || errorMsg.includes("ETIMEDOUT") || errorMsg.includes("ENOTFOUND")) {
        errorType = "network_error";
      }

      return {
        text: "",
        info,
        error: {
          attachmentId,
          type: errorType,
          message: errorMsg,
          filePath: info.path,
        },
      };
    }
  }

  /**
   * 从文件路径提取PDF文本
   */
  private async extractTextFromPath(path: string): Promise<string> {
    try {
      const text = await Zotero.File.getBinaryContentsAsync(path);
      return text ? this.cleanText(text) : "";
    } catch (error) {
      console.warn("Direct PDF text extraction not available:", error);
      return "";
    }
  }

  /**
   * 读取全文索引缓存
   */
  private async readIndexedContent(item: Zotero.Item): Promise<string | null> {
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
    } catch (error) {
      console.warn("Failed to read indexed content:", error);
      return null;
    }
  }

  /**
   * 清理提取的文本
   */
  private cleanText(text: string): string {
    if (!text) return "";

    return (
      text
        // 移除多余的空白字符
        .replace(/\s+/g, " ")
        // 移除特殊字符（保留基本标点）
        .replace(/[^\w\s\u4e00-\u9fa5.,;:!?()[\]{}"'-]/g, "")
        // 移除多余的换行
        .replace(/\n{3,}/g, "\n\n")
        .trim()
    );
  }

  /**
   * 格式化提取的文本为分析用的格式
   */
  formatForAnalysis(extracted: ExtractedText): string {
    const parts: string[] = [];

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
      const fullText =
        extracted.fullText.length > maxLength
          ? extracted.fullText.substring(0, maxLength) + "\n...(内容已截断)"
          : extracted.fullText;
      parts.push(fullText + "\n");
    }

    return parts.join("");
  }

  /**
   * 获取文本的token估计（粗略估计）
   */
  estimateTokens(text: string): number {
    // 粗略估计：英文约4个字符=1 token，中文约1.5个字符=1 token
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const otherChars = text.length - chineseChars;
    return Math.ceil(chineseChars / 1.5 + otherChars / 4);
  }

  /**
   * 获取附件链接模式
   */
  private getLinkMode(attachment: Zotero.Item): AttachmentInfo["linkMode"] {
    try {
      const linkMode = attachment.attachmentLinkMode;

      // Zotero attachment link modes:
      // 0 = imported_file (stored in Zotero storage)
      // 1 = linked_file (external file)
      // 2 = imported_url (snapshot)
      // 3 = linked_url (web link)
      // 4 = embedded_image (embedded in note)

      switch (linkMode) {
        case 0: // Zotero.Attachments.LINK_MODE_IMPORTED_FILE
          return "stored";
        case 1: // Zotero.Attachments.LINK_MODE_LINKED_FILE
          return "linked";
        case 2: // Zotero.Attachments.LINK_MODE_IMPORTED_URL
          return "stored";
        case 3: // Zotero.Attachments.LINK_MODE_LINKED_URL
          return "linked_url";
        case 4: // Zotero.Attachments.LINK_MODE_EMBEDDED_IMAGE
          return "embedded";
        default:
          return "unknown";
      }
    } catch (error) {
      console.warn("Failed to get link mode:", error);
      return "unknown";
    }
  }

  /**
   * 检查文件是否存在
   */
  private async checkFileExists(path: string): Promise<boolean> {
    try {
      // Try using IOUtils (Zotero 7+)
      if (typeof IOUtils !== "undefined" && IOUtils.exists) {
        return await IOUtils.exists(path);
      }

      // Fallback to OS.File (older Zotero versions)
      if (typeof OS !== "undefined" && OS.File && OS.File.exists) {
        return await OS.File.exists(path);
      }

      // Last resort: try to access via Zotero.File
      if (Zotero.File.pathToFile) {
        const file = Zotero.File.pathToFile(path);
        return file && file.exists();
      }

      // If none of the above work, assume file exists and let later operations fail
      console.warn("No file existence check API available, assuming file exists");
      return true;
    } catch (error) {
      console.warn("File existence check failed:", error);
      return false;
    }
  }

  /**
   * 检查是否为云存储占位符文件
   */
  private async checkCloudPlaceholder(path: string): Promise<boolean> {
    try {
      // 检查路径是否包含云存储标识
      const isOneDrive = path.includes("OneDrive") || path.includes("onedrive");
      const isDropbox = path.includes("Dropbox") || path.includes("dropbox");
      const isGoogleDrive = path.includes("Google Drive") || path.includes("GoogleDrive");
      const isiCloud = path.includes("iCloud") || path.includes("Library/Mobile Documents");

      if (!isOneDrive && !isDropbox && !isGoogleDrive && !isiCloud) {
        return false;
      }

      // 尝试获取文件大小
      let fileSize = 0;

      try {
        // Try IOUtils.stat (Zotero 7+)
        if (typeof IOUtils !== "undefined" && IOUtils.stat) {
          const stat = await IOUtils.stat(path);
          fileSize = stat.size || 0;
        }
        // Fallback to OS.File.stat
        else if (typeof OS !== "undefined" && OS.File && OS.File.stat) {
          const stat = await OS.File.stat(path);
          fileSize = stat.size || 0;
        }
        // Fallback to Zotero.File
        else if (Zotero.File.pathToFile) {
          const file = Zotero.File.pathToFile(path);
          if (file && file.fileSize !== undefined) {
            fileSize = file.fileSize;
          }
        }
      } catch (error) {
        console.warn("Failed to get file size:", error);
        return false;
      }

      // 云占位符特征：
      // 1. OneDrive: 通常 < 1KB，或者特定大小（如 0 字节）
      // 2. Dropbox: 空文件或非常小的文件
      // 3. iCloud: .icloud 扩展名或特殊大小

      // Check for .icloud placeholder files
      if (path.endsWith(".icloud")) {
        return true;
      }

      // OneDrive Files On-Demand placeholders are typically very small or 0 bytes
      if (isOneDrive && fileSize < 1024) {
        return true;
      }

      // Dropbox Smart Sync placeholders
      if (isDropbox && fileSize === 0) {
        return true;
      }

      // Google Drive File Stream placeholders
      if (isGoogleDrive && fileSize < 1024) {
        return true;
      }

      return false;
    } catch (error) {
      console.warn("Cloud placeholder check failed:", error);
      return false;
    }
  }
}
