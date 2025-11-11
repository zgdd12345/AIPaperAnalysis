/**
 * 引用关系网络图
 */
import * as echarts from "echarts";
import type { CitationData } from "../aggregator";
export declare class CitationChart {
    render(container: HTMLElement, data: CitationData): echarts.ECharts;
}
