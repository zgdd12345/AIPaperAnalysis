/**
 * 主题分布图表
 */
import * as echarts from "echarts";
export class TopicChart {
    render(container, data) {
        if (!container) {
            throw new Error("Topic container not found");
        }
        const chart = echarts.init(container);
        const seriesData = data.map((topic) => ({
            name: topic.topic || "未分类",
            value: topic.count,
        }));
        chart.setOption({
            title: {
                text: "主题分布",
                left: "center",
                textStyle: { fontSize: 14 },
            },
            tooltip: {
                trigger: "item",
                formatter: (params) => `${params.name}: ${params.value} 篇 (${params.percent}%)`,
            },
            legend: {
                orient: "vertical",
                left: "left",
            },
            series: [
                {
                    type: "pie",
                    radius: ["40%", "70%"],
                    avoidLabelOverlap: false,
                    itemStyle: {
                        borderRadius: 8,
                        borderColor: "#fff",
                        borderWidth: 2,
                    },
                    label: {
                        formatter: "{b}\n{c} 篇",
                    },
                    emphasis: {
                        label: {
                            show: true,
                            fontWeight: "bold",
                        },
                    },
                    data: seriesData,
                },
            ],
        });
        return chart;
    }
}
