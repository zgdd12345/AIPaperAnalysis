/**
 * 研究方法统计图
 */

import * as echarts from "echarts";
import type { MethodData } from "../aggregator";

export class MethodChart {
  render(container: HTMLElement, data: MethodData[]): echarts.ECharts {
    if (!container) {
      throw new Error("Method container not found");
    }

    const chart = echarts.init(container);

    chart.setOption({
      title: {
        text: "研究方法统计",
        left: "center",
        textStyle: { fontSize: 14 },
      },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
        },
      },
      grid: { left: 60, right: 20, top: 50, bottom: 40 },
      xAxis: {
        type: "value",
        name: "数量",
      },
      yAxis: {
        type: "category",
        data: data.map((item) => item.method),
        inverse: true,
      },
      series: [
        {
          type: "bar",
          data: data.map((item) => item.count),
          itemStyle: {
            color: "#73c0de",
          },
          label: {
            show: true,
            position: "right",
            formatter: "{c} 篇",
          },
        },
      ],
    });

    return chart;
  }
}
