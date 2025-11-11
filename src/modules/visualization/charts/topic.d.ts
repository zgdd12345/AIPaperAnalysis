/**
 * 主题分布图表
 */
import * as echarts from "echarts";
import type { TopicData } from "../aggregator";
export declare class TopicChart {
  render(container: HTMLElement, data: TopicData[]): echarts.ECharts;
}
