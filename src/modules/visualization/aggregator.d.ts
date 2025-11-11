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
    nodes: Array<{
        id: number;
        title: string;
        year: string;
    }>;
    links: Array<{
        source: number;
        target: number;
        weight: number;
    }>;
}
export interface KeywordData {
    word: string;
    frequency: number;
}
export interface MethodData {
    method: string;
    count: number;
}
export declare class DataAggregator {
    /**
     * 聚合所有分析笔记
     */
    aggregateAnalysisResults(filters?: AggregationFilters): Promise<AggregatedData>;
    /**
     * 查找所有 AI 分析笔记
     */
    private findAnalysisNotes;
    /**
     * 构建年份分布
     */
    private buildTimeline;
    /**
     * 提取主题信息
     */
    private extractTopics;
    /**
     * 从笔记内容解析主题关键词
     */
    private parseTopicsFromContent;
    /**
     * 构建引用关系网络
     */
    private buildCitationNetwork;
    /**
     * 统计关键词频率
     */
    private extractKeywords;
    /**
     * 简化版关键词提取（过滤常见停用词）
     */
    private extractKeywordsFromContent;
    /**
     * 识别研究方法分布
     */
    private extractMethods;
    private applyFilters;
    private getParentItem;
    private getParentYear;
}
