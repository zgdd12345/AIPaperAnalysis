/**
 * 时间线图表组件
 */
import * as echarts from "echarts";
export class TimelineChart {
    render(container, data) {
        if (!container) {
            throw new Error("Timeline container not found");
        }
        const chart = echarts.init(container);
        const option = {
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
                    if (!Array.isArray(params) || params.length === 0) {
                        return "";
                    }
                    const item = params[0];
                    return `${item.axisValueLabel}: ${item.value} 篇`;
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
