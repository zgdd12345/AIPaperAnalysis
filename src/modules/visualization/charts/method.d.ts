/**
 * 研究方法统计图
 */
import * as echarts from "echarts";
import type { MethodData } from "../aggregator";
export declare class MethodChart {
  render(container: HTMLElement, data: MethodData[]): echarts.ECharts;
}
