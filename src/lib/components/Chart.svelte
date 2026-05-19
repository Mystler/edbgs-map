<script lang="ts">
  import { formatBigNumber } from "$lib/Helpers";
  import {
    ArcElement,
    BarController,
    BarElement,
    CategoryScale,
    Chart,
    Legend,
    LinearScale,
    PieController,
    Tooltip,
    type ChartData,
  } from "chart.js";
  import ChartDataLabels from "chartjs-plugin-datalabels";

  interface Props {
    data: ChartData;
    type: "bar" | "pie";
    legend?: boolean;
    stack?: boolean;
    showPercentage?: boolean;
  }
  let { data, type, legend = false, stack = false, showPercentage = true }: Props = $props();

  Chart.defaults.color = "#aaaaaa";
  Chart.defaults.borderColor = "#333333";
  Chart.register(
    BarController,
    BarElement,
    CategoryScale,
    LinearScale,
    PieController,
    ArcElement,
    Tooltip,
    Legend,
    ChartDataLabels,
  );

  let canvas: HTMLCanvasElement;
  let chart: Chart;

  $effect(() => {
    let scales = stack ? { x: { stacked: true }, y: { stacked: true } } : undefined;
    const total = data.datasets.reduce((sum, x) => sum + (x.data as number[]).reduce((isum, y) => isum + y, 0), 0);
    chart = new Chart(canvas, {
      type,
      data,
      options: {
        maintainAspectRatio: false,
        plugins: {
          datalabels: {
            color: "#ffffff",
            anchor: "end",
            align: "start",
            formatter: (n) => (n === 0 ? "" : formatBigNumber(n)),
            textStrokeWidth: 2,
            textStrokeColor: "#222222",
            clamp: true,
            font: { size: 14 },
          },
          legend: {
            display: legend,
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                if (!showPercentage) return context.formattedValue;
                const percentage = ((100 * (context.raw as number)) / total).toFixed(1);
                return `${context.formattedValue} (${percentage}%)`;
              },
            },
          },
        },
        scales: scales,
      },
    });
    return () => {
      if (chart) chart.destroy();
    };
  });
</script>

<canvas bind:this={canvas}></canvas>
