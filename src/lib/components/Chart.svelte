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
  }
  let { data, type, legend = false, stack = false }: Props = $props();

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
