/**
 * 分析引擎 - 协调LLM和文本提取，执行分析任务
 */

import { LLMManager } from "../llm/manager";
import { TextExtractor } from "./extractor";
import { PromptManager } from "../prompts/manager";
import type {
  AnalysisResult,
  BatchAnalysisOptions,
  AnalysisProgress,
  NoteMetadata,
} from "../../types/analysis";

export class AnalysisEngine {
  private llmManager: LLMManager;
  private textExtractor: TextExtractor;
  private promptManager: PromptManager;

  constructor() {
    this.llmManager = new LLMManager();
    this.textExtractor = new TextExtractor();
    this.promptManager = new PromptManager();
  }

  /**
   * 分析单个文献条目
   */
  async analyzeItem(
    item: Zotero.Item,
    promptId: string,
  ): Promise<AnalysisResult> {
    try {
      // 1. 获取提示词
      const prompt = this.promptManager.getPromptById(promptId);
      if (!prompt) {
        throw new Error(`Prompt not found: ${promptId}`);
      }

      // 2. 提取文本
      const extracted = await this.textExtractor.extractFromItem(item);
      const formattedText = this.textExtractor.formatForAnalysis(extracted);

      // 检查文本长度
      const estimatedTokens = this.textExtractor.estimateTokens(formattedText);
      console.log(`Estimated tokens: ${estimatedTokens}`);

      // 如果文本太长，截断或警告
      const maxTokens = 30000; // 保守估计
      if (estimatedTokens > maxTokens) {
        console.warn(
          `Text too long (${estimatedTokens} tokens), may need truncation`,
        );
      }

      // 3. 调用LLM
      const activeProvider = this.llmManager.getActiveProvider();
      if (!activeProvider) {
        throw new Error("No active LLM provider configured");
      }

      const defaultModel = this.llmManager.getDefaultModel();
      if (!defaultModel) {
        throw new Error("No default model configured");
      }

      const response = await this.llmManager.chat({
        model: defaultModel,
        messages: [
          {
            role: "system",
            content:
              "你是一个专业的学术论文分析助手。请严格按照用户的要求分析论文内容，提供准确、客观的分析结果。",
          },
          {
            role: "user",
            content: `${prompt.content}\n\n${formattedText}`,
          },
        ],
        temperature: 0.7,
        maxTokens: 4000,
      });

      // 4. 返回结果
      return {
        itemId: item.id,
        promptId: prompt.id,
        promptName: prompt.name,
        content: response.content,
        model: response.model,
        provider: activeProvider,
        timestamp: new Date(),
        usage: response.usage,
      };
    } catch (error: any) {
      // 返回包含错误信息的结果
      return {
        itemId: item.id,
        promptId: promptId,
        promptName:
          this.promptManager.getPromptById(promptId)?.name || "Unknown",
        content: "",
        model: "",
        provider: "",
        timestamp: new Date(),
        error: error.message || "Analysis failed",
      };
    }
  }

  /**
   * 批量分析文献
   */
  async analyzeBatch(options: BatchAnalysisOptions): Promise<AnalysisResult[]> {
    const { items, promptId, onProgress, onComplete, onError } = options;
    const results: AnalysisResult[] = [];
    const total = items.length;

    try {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        // 更新进度
        const progress: AnalysisProgress = {
          current: i + 1,
          total,
          currentItem: (item.getField("title") as string) || "Untitled",
          status: "processing",
        };

        if (onProgress) {
          onProgress(progress);
        }

        // 执行分析
        try {
          const result = await this.analyzeItem(item, promptId);
          results.push(result);

          // 如果失败，记录错误但继续
          if (result.error) {
            console.error(`Analysis failed for item ${item.id}:`, result.error);
          }
        } catch (error: any) {
          console.error(`Analysis failed for item ${item.id}:`, error);
          results.push({
            itemId: item.id,
            promptId: promptId,
            promptName:
              this.promptManager.getPromptById(promptId)?.name || "Unknown",
            content: "",
            model: "",
            provider: "",
            timestamp: new Date(),
            error: error.message,
          });
        }

        // 添加延迟以避免API限流
        if (i < items.length - 1) {
          await this.sleep(1000); // 1秒延迟
        }
      }

      // 完成
      if (onComplete) {
        onComplete(results);
      }

      return results;
    } catch (error: any) {
      if (onError) {
        onError(error);
      }
      throw error;
    }
  }

  /**
   * 取消正在进行的分析
   * 注：这是一个简化版本，实际应该使用AbortController
   */
  cancelAnalysis(): void {
    // TODO: 实现取消逻辑
    console.warn("Cancel analysis not yet implemented");
  }

  /**
   * 获取分析历史
   */
  async getAnalysisHistory(itemId: number): Promise<AnalysisResult[]> {
    try {
      // 从笔记中解析历史分析结果
      const item = await Zotero.Items.getAsync(itemId);
      if (!item) return [];

      const notes = Zotero.Items.get(item.getNotes());
      const results: AnalysisResult[] = [];

      for (const note of notes) {
        // 检查笔记是否有ai-analysis标签
        const tags = note.getTags();
        const hasAITag = tags.some((tag) => tag.tag === "ai-analysis");

        if (hasAITag) {
          // 尝试从笔记内容中解析元数据
          const content = note.getNote();
          const metadata = this.parseMetadataFromNote(content);
          const promptTag = tags.find((tag) => tag.tag.startsWith("prompt:"));
          const promptId = promptTag
            ? promptTag.tag.replace("prompt:", "")
            : "";

          if (metadata) {
            results.push({
              itemId,
              promptId,
              promptName: metadata.promptName || promptId || "Unknown",
              content,
              model: metadata.model || "",
              provider: metadata.provider || "",
              timestamp: metadata.analyzedAt
                ? new Date(metadata.analyzedAt)
                : new Date(note.dateModified),
              usage: metadata.tokenUsage
                ? {
                    promptTokens: metadata.tokenUsage.prompt,
                    completionTokens: metadata.tokenUsage.completion,
                    totalTokens: metadata.tokenUsage.total,
                  }
                : undefined,
            });
          }
        }
      }

      return results.sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
      );
    } catch (error) {
      console.error("Failed to get analysis history:", error);
      return [];
    }
  }

  /**
   * 从笔记内容中解析元数据
   */
  private parseMetadataFromNote(content: string): NoteMetadata | null {
    try {
      const metadataMatch = content.match(/<!--\s*AIPaperAnalysis:(.+?)-->/s);
      if (metadataMatch) {
        return JSON.parse(metadataMatch[1].trim()) as NoteMetadata;
      }

      // 回退到正则解析
      const modelMatch = content.match(/使用模型[:：]\s*(.+)/);
      const providerMatch = content.match(/提供商[:：]\s*(.+)/);
      const promptMatch = content.match(/提示词[:：]\s*(.+)/);

      return {
        analyzedAt: "",
        model: modelMatch ? modelMatch[1].trim() : "",
        provider: providerMatch ? providerMatch[1].trim() : "",
        promptName: promptMatch ? promptMatch[1].trim() : "",
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * 估算分析成本（token使用）
   */
  async estimateCost(
    items: Zotero.Item[],
    promptId: string,
  ): Promise<{
    totalTokens: number;
    itemCount: number;
    averageTokensPerItem: number;
  }> {
    const prompt = this.promptManager.getPromptById(promptId);
    if (!prompt) {
      throw new Error("Prompt not found");
    }

    let totalTokens = 0;

    for (const item of items) {
      const extracted = await this.textExtractor.extractFromItem(item);
      const formatted = this.textExtractor.formatForAnalysis(extracted);
      const itemTokens =
        this.textExtractor.estimateTokens(formatted) +
        this.textExtractor.estimateTokens(prompt.content) +
        500; // 系统提示词和响应的估算

      totalTokens += itemTokens;
    }

    return {
      totalTokens,
      itemCount: items.length,
      averageTokensPerItem: Math.round(totalTokens / items.length),
    };
  }

  /**
   * 检查是否可以开始分析
   */
  canStartAnalysis(): { canStart: boolean; reason?: string } {
    const activeProvider = this.llmManager.getActiveProvider();
    if (!activeProvider) {
      return {
        canStart: false,
        reason: "未配置LLM提供商，请先在设置中配置API密钥",
      };
    }

    if (!this.llmManager.isProviderConfigured(activeProvider)) {
      return {
        canStart: false,
        reason: "请先设置API密钥并保存配置",
      };
    }

    const defaultModel = this.llmManager.getDefaultModel();
    if (!defaultModel) {
      return {
        canStart: false,
        reason: "未选择默认模型，请先在设置中选择模型",
      };
    }

    return { canStart: true };
  }

  /**
   * 睡眠函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 获取LLM管理器（供外部使用）
   */
  getLLMManager(): LLMManager {
    return this.llmManager;
  }

  /**
   * 获取提示词管理器（供外部使用）
   */
  getPromptManager(): PromptManager {
    return this.promptManager;
  }
}
