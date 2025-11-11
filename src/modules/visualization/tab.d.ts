/**
 * 可视化标签页 - ItemPaneSection骨架
 */
export declare class VisualizationTab {
    private readonly paneID;
    private readonly aggregator;
    private readonly timelineChart;
    private readonly topicChart;
    private readonly methodChart;
    private readonly citationChart;
    private readonly keywordChart;
    private readonly charts;
    private readonly activeYears;
    private readonly activeTopics;
    private registered;
    register(): void;
    unregister(): void;
    private renderCharts;
    private renderTimeline;
    private renderTopic;
    private renderMethod;
    private renderCitation;
    private renderWordcloud;
    private toggleYearFilter;
    private toggleTopicFilter;
    private getCurrentFilters;
    private bindFilterResetButton;
    private updateFilterSummary;
    private openItemInZotero;
    private openKeywordSearch;
    private bindRefreshButton;
    private updateStatus;
    private toggleChartVisibility;
    private disposeCharts;
    private getBodyTemplate;
    private handleExport;
    private buildCSV;
    private buildMarkdownExport;
}
