/**
 * 分析笔记数据聚合器
 * 扫描被标记为 AI 分析的子笔记并提取汇总数据
 */

export interface AggregatedData {
  timeline: TimelineData[];
  topics: TopicData[];
  citations: CitationData;
  keywords: KeywordData[];
  methods: MethodData[];
}

export interface AggregationFilters {
  years?: string[];
  topics?: string[];
}

export interface TimelineData {
  year: string;
  count: number;
  items: number[];
}

export interface TopicData {
  topic: string;
  count: number;
  items: number[];
}

export interface CitationData {
  nodes: Array<{ id: number; title: string; year: string }>;
  links: Array<{ source: number; target: number; weight: number }>;
}

export interface KeywordData {
  word: string;
  frequency: number;
}

export interface MethodData {
  method: string;
  count: number;
}

type ParentCache = Map<number, Zotero.Item | null>;

export class DataAggregator {
  /**
   * 聚合所有分析笔记
   */
  async aggregateAnalysisResults(
    filters?: AggregationFilters,
  ): Promise<AggregatedData> {
    const notes = await this.findAnalysisNotes();
    const parentCache: ParentCache = new Map();
    const filteredNotes = await this.applyFilters(notes, filters, parentCache);

    if (filteredNotes.length === 0) {
      return {
        timeline: [],
        topics: [],
        citations: { nodes: [], links: [] },
        keywords: [],
        methods: [],
      };
    }

    const [timeline, topics, citations, keywords, methods] = await Promise.all([
      this.buildTimeline(filteredNotes, parentCache),
      this.extractTopics(filteredNotes),
      this.buildCitationNetwork(filteredNotes, parentCache),
      this.extractKeywords(filteredNotes),
      this.extractMethods(filteredNotes),
    ]);

    return {
      timeline,
      topics,
      citations,
      keywords,
      methods,
    };
  }

  /**
   * 查找所有 AI 分析笔记
   */
  private async findAnalysisNotes(): Promise<Zotero.Item[]> {
    const search = new Zotero.Search();
    search.addCondition("itemType", "is", "note");
    search.addCondition("tag", "is", "ai-analysis");

    const itemIds = await search.search();
    if (!itemIds?.length) {
      return [];
    }

    const items = await Zotero.Items.getAsync(itemIds);
    return items.filter((item): item is Zotero.Item => !!item);
  }

  /**
   * 构建年份分布
   */
  private async buildTimeline(
    notes: Zotero.Item[],
    cache: ParentCache,
  ): Promise<TimelineData[]> {
    const timelineMap = new Map<string, number[]>();

    for (const note of notes) {
      const parentItem = await this.getParentItem(note, cache);
      if (!parentItem) continue;

      const yearField =
        (parentItem.getField("date") as string | undefined) || "";
      const year = /^\d{4}/.test(yearField)
        ? yearField.substring(0, 4)
        : "Unknown";

      if (!timelineMap.has(year)) {
        timelineMap.set(year, []);
      }
      timelineMap.get(year)!.push(parentItem.id);
    }

    return Array.from(timelineMap.entries())
      .map(([year, items]) => ({
        year,
        count: items.length,
        items,
      }))
      .sort((a, b) => a.year.localeCompare(b.year));
  }

  /**
   * 提取主题信息
   */
  private async extractTopics(notes: Zotero.Item[]): Promise<TopicData[]> {
    const topicMap = new Map<string, number[]>();

    for (const note of notes) {
      const content = note.getNote();
      const topics = this.parseTopicsFromContent(content);

      topics.forEach((topic) => {
        if (!topicMap.has(topic)) {
          topicMap.set(topic, []);
        }
        const items = topicMap.get(topic)!;
        const parentId =
          typeof note.parentID === "number" ? note.parentID : note.id;
        items.push(parentId);
      });
    }

    return Array.from(topicMap.entries())
      .map(([topic, items]) => ({
        topic,
        count: items.length,
        items,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * 从笔记内容解析主题关键词
   */
  private parseTopicsFromContent(content: string): string[] {
    const topics: string[] = [];
    const patterns = [
      /主题[:：]\s*(.+)/g,
      /研究领域[:：]\s*(.+)/g,
      /关键词[:：]\s*(.+)/g,
    ];

    patterns.forEach((pattern) => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const rawTopics = match[1]
          .split(/[,，、;]/)
          .map((topic) => topic.trim())
          .filter(Boolean);
        topics.push(...rawTopics);
      }
    });

    return topics;
  }

  /**
   * 构建引用关系网络
   */
  private async buildCitationNetwork(
    notes: Zotero.Item[],
    cache: ParentCache,
  ): Promise<CitationData> {
    const nodes: CitationData["nodes"] = [];
    const links: CitationData["links"] = [];
    const seenItems = new Map<
      number,
      { id: number; title: string; year: string }
    >();

    for (const note of notes) {
      const parentItem = await this.getParentItem(note, cache);
      if (!parentItem) continue;

      if (!seenItems.has(parentItem.id)) {
        const node = {
          id: parentItem.id,
          title: (parentItem.getField("title") as string) || "Untitled",
          year:
            (parentItem.getField("date") as string | undefined)?.substring(
              0,
              4,
            ) || "",
        };
        seenItems.set(parentItem.id, node);
        nodes.push(node);
      }

      const relatedItems = parentItem.relatedItems ?? [];
      relatedItems.forEach((relatedId) => {
        if (typeof relatedId !== "number") {
          return;
        }

        if (!seenItems.has(relatedId)) {
          // Related item might not be part of the analyzed set yet
          const relatedItem = Zotero.Items.get(relatedId);
          if (relatedItem) {
            const relatedNode = {
              id: relatedItem.id,
              title: (relatedItem.getField("title") as string) || "Untitled",
              year:
                (relatedItem.getField("date") as string | undefined)?.substring(
                  0,
                  4,
                ) || "",
            };
            seenItems.set(relatedItem.id, relatedNode);
            nodes.push(relatedNode);
          }
        }

        if (seenItems.has(relatedId)) {
          links.push({
            source: parentItem.id,
            target: relatedId,
            weight: 1,
          });
        }
      });
    }

    return { nodes, links };
  }

  /**
   * 统计关键词频率
   */
  private async extractKeywords(notes: Zotero.Item[]): Promise<KeywordData[]> {
    const freqMap = new Map<string, number>();

    for (const note of notes) {
      const keywords = this.extractKeywordsFromContent(note.getNote());
      keywords.forEach((word) => {
        freqMap.set(word, (freqMap.get(word) || 0) + 1);
      });
    }

    return Array.from(freqMap.entries())
      .map(([word, frequency]) => ({ word, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 50);
  }

  /**
   * 简化版关键词提取（过滤常见停用词）
   */
  private extractKeywordsFromContent(content: string): string[] {
    const text = content.replace(/<[^>]+>/g, " ");
    const words = text.match(/[\u4e00-\u9fa5]{2,}|[a-zA-Z]{3,}/g) || [];

    const stopWords = new Set([
      "这个",
      "那个",
      "可以",
      "进行",
      "研究",
      "分析",
      "方法",
      "以及",
      "同时",
    ]);

    return words.filter((word) => !stopWords.has(word));
  }

  /**
   * 识别研究方法分布
   */
  private async extractMethods(notes: Zotero.Item[]): Promise<MethodData[]> {
    const methodFreq = new Map<string, number>();
    const methodKeywords = [
      "实验研究",
      "问卷调查",
      "案例研究",
      "文献综述",
      "定性研究",
      "定量研究",
      "混合方法",
      "元分析",
      "深度学习",
      "机器学习",
      "统计分析",
      "内容分析",
    ];

    for (const note of notes) {
      const content = note.getNote();
      methodKeywords.forEach((method) => {
        if (content.includes(method)) {
          methodFreq.set(method, (methodFreq.get(method) || 0) + 1);
        }
      });
    }

    return Array.from(methodFreq.entries())
      .map(([method, count]) => ({ method, count }))
      .sort((a, b) => b.count - a.count);
  }

  private async applyFilters(
    notes: Zotero.Item[],
    filters: AggregationFilters | undefined,
    cache: ParentCache,
  ): Promise<Zotero.Item[]> {
    if (!filters || (!filters.years?.length && !filters.topics?.length)) {
      return notes;
    }

    const years = filters.years?.filter(Boolean);
    const topics = filters.topics?.filter(Boolean);
    const filtered: Zotero.Item[] = [];

    for (const note of notes) {
      let include = true;

      if (years?.length) {
        const year = await this.getParentYear(note, cache);
        if (!year || !years.includes(year)) {
          include = false;
        }
      }

      if (include && topics?.length) {
        const noteTopics = this.parseTopicsFromContent(note.getNote());
        if (!noteTopics.some((topic) => topics.includes(topic))) {
          include = false;
        }
      }

      if (include) {
        filtered.push(note);
      }
    }

    return filtered;
  }

  private async getParentItem(
    note: Zotero.Item,
    cache: ParentCache,
  ): Promise<Zotero.Item | null> {
    const parentId = note.parentID;
    if (!parentId) {
      return null;
    }

    if (cache.has(parentId)) {
      return cache.get(parentId) ?? null;
    }

    const parentItem = await Zotero.Items.getAsync(parentId);
    cache.set(parentId, parentItem ?? null);
    return parentItem ?? null;
  }

  private async getParentYear(
    note: Zotero.Item,
    cache: ParentCache,
  ): Promise<string> {
    const parentItem = await this.getParentItem(note, cache);
    if (!parentItem) {
      return "Unknown";
    }

    const yearField = (parentItem.getField("date") as string | undefined) || "";
    return /^\d{4}/.test(yearField) ? yearField.substring(0, 4) : "Unknown";
  }
}
