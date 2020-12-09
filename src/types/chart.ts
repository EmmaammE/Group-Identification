interface AxisConfig {
  title: string,
  color: string,
  grid: boolean
}

interface MariginConfig {
  r: number,
  b: number,
  l: number,
  t: number
}

export interface ChartProps {
  width: number,
  height: number,
  yaxis: AxisConfig,
  xaxis: AxisConfig,
  margin: MariginConfig
}
