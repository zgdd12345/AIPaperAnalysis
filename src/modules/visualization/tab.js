/**
 * 可视化标签页 - ItemPaneSection骨架
 */
import { getLocaleID, getString } from "../../utils/locale";
import { DataAggregator } from "./aggregator";
import { TimelineChart } from "./charts/timeline";
import { TopicChart } from "./charts/topic";
import { MethodChart } from "./charts/method";
import { CitationChart } from "./charts/citation";
import { KeywordCloudChart } from "./charts/keyword-cloud";
export class VisualizationTab {
  paneID = "ai-analysis-summary";
  aggregator = new DataAggregator();
  timelineChart = new TimelineChart();
  topicChart = new TopicChart();
  methodChart = new MethodChart();
  citationChart = new CitationChart();
  keywordChart = new KeywordCloudChart();
  charts = new Map();
  activeYears = new Set();
  activeTopics = new Set();
  registered = false;
  register() {
    if (this.registered) {
      return;
    }
    Zotero.ItemPaneManager.registerSection({
      paneID: this.paneID,
      pluginID: addon.data.config.addonID,
      header: {
        l10nID: getLocaleID("item-section-ai-summary-head"),
        icon: "chrome://zotero/skin/16/universal/graph.svg",
      },
      sidenav: {
        l10nID: getLocaleID("item-section-ai-summary-sidenav"),
        icon: "chrome://zotero/skin/20/universal/graph.svg",
      },
      bodyXHTML: this.getBodyTemplate(),
      onRender: ({ body, setSectionSummary }) => {
        this.bindRefreshButton(body, setSectionSummary);
        this.bindFilterResetButton(body, setSectionSummary);
        const loadingText = getString("item-section-ai-summary-loading");
        this.updateStatus(body, loadingText);
        setSectionSummary?.(loadingText);
        this.updateFilterSummary(body);
      },
      onAsyncRender: async ({ body, setSectionSummary }) => {
        await this.renderCharts(body, setSectionSummary);
      },
      onDestroy: () => {
        this.disposeCharts();
        this.registered = false;
      },
      sectionButtons: [
        {
          type: "export-json",
          icon: "chrome://zotero/skin/16/universal/export.svg",
          l10nID: getLocaleID("item-section-ai-summary-export-json"),
          onClick: () => this.handleExport("json"),
        },
        {
          type: "export-csv",
          icon: "chrome://zotero/skin/16/universal/export.svg",
          l10nID: getLocaleID("item-section-ai-summary-export-csv"),
          onClick: () => this.handleExport("csv"),
        },
        {
          type: "export-markdown",
          icon: "chrome://zotero/skin/16/universal/export.svg",
          l10nID: getLocaleID("item-section-ai-summary-export-markdown"),
          onClick: () => this.handleExport("markdown"),
        },
      ],
    });
    this.registered = true;
  }
  unregister() {
    if (!this.registered) {
      return;
    }
    Zotero.ItemPaneManager.unregisterSection(this.paneID);
    this.disposeCharts();
    this.registered = false;
  }
  async renderCharts(body, setSectionSummary) {
    try {
      const loadingText = getString("item-section-ai-summary-loading");
      this.updateStatus(body, loadingText);
      const data = await this.aggregator.aggregateAnalysisResults(
        this.getCurrentFilters(),
      );
      const totalItems = data.timeline.reduce(
        (sum, entry) => sum + entry.count,
        0,
      );
      if (totalItems === 0) {
        this.disposeCharts();
        this.toggleChartVisibility(body, false);
        const emptyText =
          this.activeYears.size || this.activeTopics.size
            ? getString("item-section-ai-summary-empty-filtered")
            : getString("item-section-ai-summary-empty");
        this.updateStatus(body, emptyText);
        setSectionSummary?.(emptyText);
        this.updateFilterSummary(body);
        return;
      }
      this.toggleChartVisibility(body, true);
      this.disposeCharts();
      this.renderTimeline(body, data, setSectionSummary);
      this.renderTopic(body, data, setSectionSummary);
      this.renderMethod(body, data);
      this.renderCitation(body, data);
      this.renderWordcloud(body, data);
      this.updateFilterSummary(body);
      this.updateStatus(body, "");
      const summaryText = getString("item-section-ai-summary-summary", {
        args: { count: totalItems },
      });
      setSectionSummary?.(summaryText);
    } catch (error) {
      console.error("Failed to render visualization tab:", error);
      const errorText = `${getString("item-section-ai-summary-error")}: ${error?.message || error}`;
      this.updateStatus(body, errorText);
      setSectionSummary?.(getString("item-section-ai-summary-error"));
    }
  }
  renderTimeline(body, data, setSectionSummary) {
    const container = body.querySelector("#aipaperanalysis-timeline");
    if (!container) {
      return;
    }
    const chart = this.timelineChart.render(container, data.timeline);
    this.charts.set("timeline", chart);
    chart.on("click", (params) => {
      const year = typeof params?.name === "string" ? params.name : null;
      if (!year) {
        return;
      }
      this.toggleYearFilter(year, body, setSectionSummary);
    });
  }
  renderTopic(body, data, setSectionSummary) {
    const container = body.querySelector("#aipaperanalysis-topic");
    if (!container) {
      return;
    }
    if (data.topics.length === 0) {
      container.textContent = getString("item-section-ai-summary-empty-topics");
      return;
    }
    const chart = this.topicChart.render(container, data.topics);
    this.charts.set("topic", chart);
    chart.on("click", (params) => {
      const topic = typeof params?.name === "string" ? params.name : null;
      if (!topic) {
        return;
      }
      this.toggleTopicFilter(topic, body, setSectionSummary);
    });
  }
  renderMethod(body, data) {
    const container = body.querySelector("#aipaperanalysis-method");
    if (!container) {
      return;
    }
    if (data.methods.length === 0) {
      container.textContent = getString(
        "item-section-ai-summary-empty-methods",
      );
      return;
    }
    const chart = this.methodChart.render(container, data.methods);
    this.charts.set("method", chart);
  }
  renderCitation(body, data) {
    const container = body.querySelector("#aipaperanalysis-citation");
    if (!container) {
      return;
    }
    if (
      data.citations.nodes.length === 0 ||
      data.citations.links.length === 0
    ) {
      container.textContent = getString(
        "item-section-ai-summary-empty-citations",
      );
      return;
    }
    const chart = this.citationChart.render(container, data.citations);
    this.charts.set("citation", chart);
    chart.on("click", (params) => {
      const nodeId = params?.data?.id;
      const numericId = typeof nodeId === "string" ? Number(nodeId) : nodeId;
      if (!Number.isFinite(numericId)) {
        return;
      }
      this.openItemInZotero(Number(numericId));
    });
  }
  renderWordcloud(body, data) {
    const container = body.querySelector("#aipaperanalysis-wordcloud");
    if (!container) {
      return;
    }
    const chart = this.keywordChart.render(
      container,
      data.keywords,
      (keyword) => this.openKeywordSearch(keyword, body),
    );
    this.charts.set("keywords", chart);
  }
  toggleYearFilter(year, body, setSectionSummary) {
    if (this.activeYears.has(year)) {
      this.activeYears.delete(year);
    } else {
      this.activeYears.add(year);
    }
    this.renderCharts(body, setSectionSummary).catch((error) =>
      console.error("Failed to apply year filter:", error),
    );
  }
  toggleTopicFilter(topic, body, setSectionSummary) {
    if (this.activeTopics.has(topic)) {
      this.activeTopics.delete(topic);
    } else {
      this.activeTopics.add(topic);
    }
    this.renderCharts(body, setSectionSummary).catch((error) =>
      console.error("Failed to apply topic filter:", error),
    );
  }
  getCurrentFilters() {
    const filters = {};
    if (this.activeYears.size) {
      filters.years = Array.from(this.activeYears);
    }
    if (this.activeTopics.size) {
      filters.topics = Array.from(this.activeTopics);
    }
    return filters.years || filters.topics ? filters : undefined;
  }
  bindFilterResetButton(body, setSectionSummary) {
    const button = body.querySelector("#aipaperanalysis-filter-reset");
    if (!button || button.dataset.bound === "true") {
      return;
    }
    button.dataset.bound = "true";
    button.addEventListener("click", () => {
      if (!this.activeYears.size && !this.activeTopics.size) {
        return;
      }
      this.activeYears.clear();
      this.activeTopics.clear();
      this.renderCharts(body, setSectionSummary).catch((error) =>
        console.error("Failed to reset filters:", error),
      );
    });
  }
  updateFilterSummary(body) {
    const summaryEl = body.querySelector("#aipaperanalysis-filter-summary");
    const resetBtn = body.querySelector("#aipaperanalysis-filter-reset");
    if (!summaryEl) {
      return;
    }
    const parts = [];
    if (this.activeYears.size) {
      parts.push(
        getString("item-section-ai-summary-filter-years", {
          args: {
            years: Array.from(this.activeYears).join(", "),
            count: this.activeYears.size,
          },
        }),
      );
    }
    if (this.activeTopics.size) {
      parts.push(
        getString("item-section-ai-summary-filter-topics", {
          args: {
            topics: Array.from(this.activeTopics).join(", "),
            count: this.activeTopics.size,
          },
        }),
      );
    }
    if (parts.length === 0) {
      summaryEl.textContent = getString("item-section-ai-summary-filter-none");
    } else {
      summaryEl.textContent = parts.join(" | ");
    }
    if (resetBtn) {
      resetBtn.disabled = parts.length === 0;
    }
  }
  openItemInZotero(itemId) {
    try {
      const pane = Zotero.getActiveZoteroPane?.();
      if (pane?.selectItems) {
        pane.selectItems([itemId]);
        pane.focus();
      }
    } catch (error) {
      console.warn("Failed to select item in Zotero:", error);
    }
  }
  async openKeywordSearch(keyword, body) {
    try {
      const search = new Zotero.Search();
      search.addCondition("tag", "is", keyword);
      const itemIds = await search.search();
      const pane = Zotero.getActiveZoteroPane?.();
      if (itemIds?.length && pane?.selectItems) {
        pane.selectItems(itemIds);
        pane.focus();
        this.updateStatus(
          body,
          getString("item-section-ai-summary-keyword-search-success", {
            args: { keyword, count: itemIds.length },
          }),
        );
        return;
      }
      Zotero.alert(
        null,
        getString("item-section-ai-summary-keyword-search-title"),
        getString("item-section-ai-summary-keyword-search-empty", {
          args: { keyword },
        }),
      );
    } catch (error) {
      console.error("Failed to open keyword search:", error);
      Zotero.alert(
        null,
        getString("item-section-ai-summary-keyword-search-title"),
        getString("item-section-ai-summary-keyword-search-error", {
          args: { keyword },
        }),
      );
    }
  }
  bindRefreshButton(body, setSectionSummary) {
    const button = body.querySelector("#aipaperanalysis-summary-refresh");
    if (!button || button.dataset.bound === "true") {
      return;
    }
    button.dataset.bound = "true";
    button.addEventListener("click", () => {
      button.disabled = true;
      this.renderCharts(body, setSectionSummary)
        .catch((error) => {
          console.error("Failed to refresh visualization tab:", error);
          const errorText = getString("item-section-ai-summary-error");
          this.updateStatus(body, errorText);
        })
        .finally(() => {
          button.disabled = false;
        });
    });
  }
  updateStatus(body, message) {
    const statusEl = body.querySelector("#aipaperanalysis-summary-status");
    if (!statusEl) {
      return;
    }
    statusEl.textContent = message;
    statusEl.style.display = message ? "block" : "none";
  }
  toggleChartVisibility(body, visible) {
    const wrapper = body.querySelector("#aipaperanalysis-charts-wrapper");
    if (wrapper) {
      wrapper.style.display = visible ? "flex" : "none";
    }
  }
  disposeCharts() {
    this.charts.forEach((chart) => {
      try {
        chart.dispose();
      } catch (error) {
        console.warn("Failed to dispose chart", error);
      }
    });
    this.charts.clear();
  }
  getBodyTemplate() {
    const refreshLabel = getString("item-section-ai-summary-button-label");
    const filterResetLabel = getString("item-section-ai-summary-filter-reset");
    const title = getString("item-section-ai-summary-title");
    const wordcloudTitle = getString("item-section-ai-summary-wordcloud-title");
    const noFilterText = getString("item-section-ai-summary-filter-none");
    return `
      <html:div class="ai-analysis-summary" style="display:flex; flex-direction:column; gap:16px; padding:16px;">
        <html:div style="display:flex; align-items:center; justify-content:space-between;">
          <html:div style="display:flex; flex-direction:column;">
            <html:span style="font-size:16px; font-weight:600;">${title}</html:span>
            <html:span id="aipaperanalysis-summary-status" style="font-size:12px; color: var(--zotero-secondary-label-color);"></html:span>
          </html:div>
          <html:button id="aipaperanalysis-summary-refresh" style="padding:4px 12px;">${refreshLabel}</html:button>
        </html:div>
        <html:div style="display:flex; align-items:center; justify-content:space-between;">
          <html:span id="aipaperanalysis-filter-summary" style="font-size:12px; color: var(--zotero-secondary-label-color);">${noFilterText}</html:span>
          <html:button id="aipaperanalysis-filter-reset" style="padding:2px 10px;" disabled="true">${filterResetLabel}</html:button>
        </html:div>
        <html:div id="aipaperanalysis-charts-wrapper" style="display:none; flex-direction:column; gap:16px;">
          <html:div id="aipaperanalysis-timeline" style="width:100%; height:320px;"></html:div>
          <html:div style="display:grid; gap:16px; grid-template-columns:repeat(auto-fit,minmax(280px,1fr));">
            <html:div id="aipaperanalysis-topic" style="height:320px;"></html:div>
            <html:div id="aipaperanalysis-method" style="height:320px;"></html:div>
          </html:div>
          <html:div id="aipaperanalysis-citation" style="width:100%; height:420px;"></html:div>
          <html:div style="display:flex; flex-direction:column; gap:8px;">
            <html:span style="font-size:14px; font-weight:600;">${wordcloudTitle}</html:span>
            <html:div id="aipaperanalysis-wordcloud" style="min-height:220px; padding:12px; border:1px solid var(--zotero-pane-border-color); border-radius:8px;"></html:div>
          </html:div>
        </html:div>
      </html:div>
    `.trim();
  }
  async handleExport(format) {
    try {
      const data = await this.aggregator.aggregateAnalysisResults(
        this.getCurrentFilters(),
      );
      const defaultName =
        format === "json"
          ? "ai-analysis-summary.json"
          : format === "csv"
            ? "ai-analysis-summary.csv"
            : "ai-analysis-summary.md";
      const pickerTitle = getString("item-section-ai-summary-export-title");
      const filePath = await Zotero.FilePicker.saveFile(
        pickerTitle,
        defaultName,
      );
      if (!filePath) {
        return;
      }
      const payload =
        format === "json"
          ? JSON.stringify(data, null, 2)
          : format === "csv"
            ? this.buildCSV(data)
            : this.buildMarkdownExport(data);
      await Zotero.File.putContentsAsync(filePath, payload);
      Zotero.alert(
        null,
        getString("item-section-ai-summary-export-success-title"),
        getString("item-section-ai-summary-export-success", {
          args: { path: filePath },
        }),
      );
    } catch (error) {
      console.error("Failed to export AI summary:", error);
      Zotero.alert(
        null,
        getString("item-section-ai-summary-export-error-title"),
        `${getString("item-section-ai-summary-export-error")}: ${error?.message || error}`,
      );
    }
  }
  buildCSV(data) {
    const escape = (value) => {
      const str = String(value ?? "").replace(/"/g, '""');
      return `"${str}"`;
    };
    const lines = ["Section,Key,Value"];
    data.timeline.forEach((entry) => {
      lines.push(`Timeline,${escape(entry.year)},${escape(entry.count)}`);
    });
    data.topics.forEach((entry) => {
      lines.push(`Topics,${escape(entry.topic)},${escape(entry.count)}`);
    });
    data.methods.forEach((entry) => {
      lines.push(`Methods,${escape(entry.method)},${escape(entry.count)}`);
    });
    data.keywords.forEach((entry) => {
      lines.push(`Keywords,${escape(entry.word)},${escape(entry.frequency)}`);
    });
    lines.push("Citations,Nodes,");
    data.citations.nodes.forEach((node) => {
      lines.push(
        `Citation Node,${escape(node.title)},${escape(node.year || "")}`,
      );
    });
    lines.push("Citations,Links,");
    data.citations.links.forEach((link) => {
      lines.push(
        `Citation Link,${escape(link.source)}->${escape(link.target)},${escape(link.weight)}`,
      );
    });
    return lines.join("\n");
  }
  buildMarkdownExport(data) {
    const filters = this.getCurrentFilters();
    const parts = ["# AI Analysis Summary"];
    if (filters?.years?.length || filters?.topics?.length) {
      parts.push("## Active Filters");
      if (filters?.years?.length) {
        parts.push(`- Years: ${filters.years.join(", ")}`);
      }
      if (filters?.topics?.length) {
        parts.push(`- Topics: ${filters.topics.join(", ")}`);
      }
    }
    parts.push("## Timeline");
    data.timeline.forEach((entry) => {
      parts.push(`- ${entry.year}: ${entry.count}`);
    });
    parts.push("## Topics");
    data.topics.forEach((entry) => {
      parts.push(`- ${entry.topic}: ${entry.count}`);
    });
    parts.push("## Methods");
    data.methods.forEach((entry) => {
      parts.push(`- ${entry.method}: ${entry.count}`);
    });
    parts.push("## Keywords");
    data.keywords.slice(0, 20).forEach((entry) => {
      parts.push(`- ${entry.word}: ${entry.frequency}`);
    });
    parts.push("## Citations");
    parts.push(`- Nodes: ${data.citations.nodes.length}`);
    parts.push(`- Links: ${data.citations.links.length}`);
    return parts.join("\n");
  }
}
