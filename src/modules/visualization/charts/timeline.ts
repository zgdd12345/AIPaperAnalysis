/**
 * 时间线图表组件
 */

import * as echarts from "echarts";
import type { TimelineData } from "../aggregator";

export class TimelineChart {
  render(container: HTMLElement, data: TimelineData[]): echarts.ECharts {
    if (!container) {
      throw new Error("Timeline container not found");
    }

    const chart = echarts.init(container);

    const option: echarts.EChartsOption = {
      title: {
        text: "文献发表时间分布",
        left: "center",
        textStyle: {
          fontSize: 14,
        },
      },
      tooltip: {
        trigger: "axis",
        formatter(params) {
          const list = Array.isArray(params) ? params : [params];
          if (!list.length) {
            return "";
          }
          const item = list[0] as {
            axisValueLabel?: string;
            axisValue?: string | number;
            value?: string | number;
          };
          const label = item.axisValueLabel ?? String(item.axisValue ?? "");
          return `${label}: ${item.value ?? ""} 篇`;
        },
      },
      xAxis: {
        type: "category",
        data: data.map((item) => item.year),
        axisLabel: {
          rotate: 45,
        },
      },
      yAxis: {
        type: "value",
        name: "文献数量",
      },
      grid: {
        top: 50,
        left: 40,
        right: 20,
        bottom: 60,
      },
      series: [
        {
          name: "文献数量",
          type: "bar",
          data: data.map((item) => item.count),
          emphasis: {
            focus: "series",
          },
          itemStyle: {
            color: "#5470c6",
          },
        },
      ],
    };

    chart.setOption(option);
    return chart;
  }
}
