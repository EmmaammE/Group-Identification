import { ChartProps } from "./chart";
import { Data } from "./data";

export default interface ScatterplotProps {
  chartConfig: ChartProps,
  data: Data[],
  // 0：svg  1: canvas
  render: number
}
