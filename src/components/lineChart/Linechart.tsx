import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export interface LineChartProps {
  margin: {
    r: number;
    b: number;
    l: number;
    t: number;
  };
  data: number[][];
}

const WIDTH = 450;
const HEIGHT = 250;

const LineChart = ({ margin, data }: LineChartProps) => {
  const widthMap: number = WIDTH - margin.l - margin.r;
  const heightMap: number = HEIGHT - margin.t - margin.b;

  const xScale = d3
    .scaleLinear()
    .range([0, widthMap])
    .domain([1, data[0].length]);
  const yScale = d3
    .scaleSymlog()
    .range([heightMap, 0])
    .domain([0, d3.max(data.flat()) as number]);
  // const yScale = d3.scaleLinear().range([heightMap, 0]).domain([0, 10000000])

  const $xaxis: any = useRef(null);
  const $yaxis: any = useRef(null);

  const line = d3
    .line()
    .x((d, i) => xScale(i + 1))
    .y((d: any) => yScale(d));

  useEffect(() => {
    const xAxis = d3.axisBottom(xScale).ticks(10);
    const yAxis = d3.axisLeft(yScale).ticks(2);

    d3.select($xaxis.current).call(xAxis.scale(xScale));

    d3.select($yaxis.current).call(yAxis.scale(yScale));
  }, [xScale, yScale]);

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
      <g transform={`translate(${margin.l}, ${margin.t})`}>
        <g
          transform={`translate(0, ${heightMap})`}
          className="axes x-axis"
          ref={$xaxis}
        />
        <g className="axes y-axis" ref={$yaxis} />
        {/* {
          data.map((d,i) => (
            <path d={line(d as any) || ''}
              stroke={i === 0 ? '#ccc' : '#000'}
              fill="none"
            />
          ))
        } */}
        <path d={line(data[0] as any) || ''} stroke="#777" fill="none" />
        {data[1].map((d, i) => (
          <circle cx={xScale(i + 1)} cy={yScale(d)} r={2} fill="#0b69b6" />
        ))}
      </g>
    </svg>
  );
};

export default LineChart;
