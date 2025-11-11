/**
 * 引用关系网络图
 */
import * as echarts from "echarts";
export class CitationChart {
  render(container, data) {
    if (!container) {
      throw new Error("Citation container not found");
    }
    const chart = echarts.init(container);
    const nodes = data.nodes.map((node) => ({
      id: String(node.id),
      name: node.title,
      category: node.year || "Unknown",
      value: node.year,
      symbolSize: 20,
      tooltip: {
        formatter: `${node.title}<br/>${node.year}`,
      },
      label: {
        show: true,
        position: "right",
        formatter: () => node.title,
      },
    }));
    const links = data.links.map((link) => ({
      source: String(link.source),
      target: String(link.target),
      lineStyle: {
        width: Math.max(1, link.weight),
      },
    }));
    chart.setOption({
      title: {
        text: "引用关系网络",
        left: "center",
        textStyle: { fontSize: 14 },
      },
      tooltip: {},
      animationDuration: 1000,
      series: [
        {
          type: "graph",
          layout: "force",
          roam: true,
          data: nodes,
          links,
          label: {
            show: false,
          },
          force: {
            repulsion: 120,
            edgeLength: [50, 200],
          },
        },
      ],
    });
    return chart;
  }
}
