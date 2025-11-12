/**
 * 分析相关的类型定义
 */

export interface AnalysisResult {
  /** 文献条目ID */
  itemId: number;
  /** 提示词ID */
  promptId: string;
  /** 提示词名称 */
  promptName: string;
  /** 分析内容 */
  content: string;
  /** 使用的模型 */
  model: string;
  /** 提供商 */
  provider: string;
  /** 时间戳 */
  timestamp: Date;
  /** Token使用情况 */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** 错误信息（如果失败） */
  error?: string;
}

export interface Prompt {
  /** 唯一ID */
  id: string;
  /** 提示词名称 */
  name: string;
  /** 提示词内容 */
  content: string;
  /** 是否为默认提示词 */
  isDefault: boolean;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
  /** 描述 */
  description?: string;
  /** 分类/标签 */
  category?: string;
}

export interface ExtractedText {
  /** 标题 */
  title: string;
  /** 作者 */
  authors: string;
  /** 年份 */
  year: string;
  /** 摘要 */
  abstract: string;
  /** 关键词 */
  keywords: string[];
  /** PDF正文 */
  fullText?: string;
  /** 出版物 */
  publication?: string;
  /** DOI */
  doi?: string;
  /** 提取结果状态 */
  extractionStatus?: ExtractionStatus;
}

/**
 * PDF文本提取状态
 */
export interface ExtractionStatus {
  /** 是否成功提取全文 */
  success: boolean;
  /** 提取失败的原因 */
  errors: ExtractionError[];
  /** 警告信息 */
  warnings: string[];
  /** 附件信息 */
  attachments: AttachmentInfo[];
}

/**
 * 提取错误详情
 */
export interface ExtractionError {
  /** 附件ID */
  attachmentId: number;
  /** 错误类型 */
  type: "file_not_found" | "cloud_placeholder" | "permission_denied" | "network_error" | "extraction_failed" | "linked_file_unavailable";
  /** 错误消息 */
  message: string;
  /** 文件路径（如有） */
  filePath?: string;
}

/**
 * 附件信息
 */
export interface AttachmentInfo {
  /** 附件ID */
  id: number;
  /** 附件类型 */
  linkMode: "stored" | "linked" | "linked_url" | "embedded" | "unknown";
  /** 文件路径 */
  path?: string;
  /** 是否可访问 */
  accessible: boolean;
  /** 是否为云占位符 */
  isCloudPlaceholder?: boolean;
}

export interface AnalysisProgress {
  /** 当前进度 */
  current: number;
  /** 总数 */
  total: number;
  /** 当前处理的文献 */
  currentItem?: string;
  /** 状态 */
  status: "pending" | "processing" | "completed" | "failed";
  /** 错误信息 */
  error?: string;
}

export interface BatchAnalysisOptions {
  /** 文献列表 */
  items: Zotero.Item[];
  /** 提示词ID */
  promptId: string;
  /** 是否自动创建笔记 */
  autoCreateNote?: boolean;
  /** 进度回调 */
  onProgress?: (progress: AnalysisProgress) => void;
  /** 完成回调 */
  onComplete?: (results: AnalysisResult[]) => void;
  /** 错误回调 */
  onError?: (error: Error) => void;
}

export interface NoteMetadata {
  /** 分析时间 */
  analyzedAt: string;
  /** 使用的模型 */
  model: string;
  /** 提供商 */
  provider: string;
  /** 提示词名称 */
  promptName: string;
  /** Token使用 */
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
  /** 全文提取状态 */
  extractionStatus?: {
    success: boolean;
    hasFullText: boolean;
    attachmentCount: number;
    errors?: string[];
    warnings?: string[];
  };
}
