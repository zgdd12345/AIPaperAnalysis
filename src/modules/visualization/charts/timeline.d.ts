/**
 * 时间线图表组件
 */
import * as echarts from "echarts";
import type { TimelineData } from "../aggregator";
export declare class TimelineChart {
  render(container: HTMLElement, data: TimelineData[]): echarts.ECharts;
}
