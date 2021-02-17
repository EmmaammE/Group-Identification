import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';

export interface CpLineChartProps {
  margin: {
    r: number;
    b: number;
    l: number;
    t: number;
  };
  data: number[];
  title: string;
}

const WIDTH = 350;
const HEIGHT = 180;

const CpLineChart = ({ margin, data: rawData, title }: CpLineChartProps) => {
  const widthMap: number = WIDTH - margin.l - margin.r;
  const heightMap: number = HEIGHT - margin.t - margin.b;

  const [data, setData] = useState<{ [key: number]: number }>({});
  const [maxValue, setMax] = useState<number>(0);

  useEffect(() => {
    const hash: { [key: number]: number } = {};
    rawData.forEach((d) => {
      if (hash[d]) {
        hash[d]++;
      } else {
        hash[d] = 1;
      }
    });
    setData(hash);
  }, [rawData]);

  useEffect(() => {
    setMax(Math.max(...Object.values(data)));
  }, [data]);

  const xScale = useMemo(
    () =>
      d3
        .scaleBand()
        .domain(Object.keys(data).sort((a, b) => Number(a) - Number(b)))
        .range([0, widthMap]),
    [data, widthMap]
  );

  const yScale = d3.scaleLinear().range([heightMap, 0]).domain([0, maxValue]);

  const $xaxis: any = useRef(null);
  const $yaxis: any = useRef(null);

  const dataKey = useMemo(() => Object.keys(data).sort((a: any, b: any) => Number(a) - Number(b)), [
    data,
  ]);

  const line = d3
    .line()
    .x((d: any) => xScale(d) as number)
    .y((d: any) => yScale(data[d]));

  useEffect(() => {
    const xAxis = d3.axisBottom(xScale).tickValues(xScale.domain().filter((d, i) => !(i % 8)));
    const yAxis = d3.axisLeft(yScale).ticks(5);

    d3.select($xaxis.current).call(xAxis.scale(xScale).tickFormat((x) => Number(x).toFixed(5)));

    d3.select($yaxis.current).call(yAxis.scale(yScale));
  }, [dataKey.length, xScale, yScale]);

  return (
    <div className="line-wrapper">
      <p style={{ textAlign: 'center' }}>Attribute name</p>
      <svg width="100%" viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <g transform={`translate(${margin.l}, ${margin.t})`}>
          <g transform={`translate(0, ${heightMap})`} className="axes x-axis" ref={$xaxis} />
          <g className="axes y-axis" ref={$yaxis} />

          <line
            x1={0}
            x2={widthMap + 5}
            y1={heightMap}
            y2={heightMap}
            stroke="rgba(0,0,0,0.8)"
            markerEnd="url(#arrow)"
          />
          <line
            x1={0}
            x2={0}
            y1={heightMap}
            y2={-10}
            stroke="rgba(0,0,0,0.8)"
            markerEnd="url(#arrow)"
          />
          <text dy={-25} textAnchor="middle">
            Percentage
          </text>
          <text transform={`translate(${widthMap + 20},${heightMap + 5})`}>Value</text>

          {dataKey.length > 0 && <path d={line(dataKey as any) || ''} stroke="#777" fill="none" />}
        </g>
      </svg>
    </div>
  );
};

export default CpLineChart;
